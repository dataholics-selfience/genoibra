const fetch = require('node-fetch');

// Configuração do Firebase
const FIREBASE_CONFIG = {
  projectId: 'genoibra-5ed82',
  apiKey: 'AIzaSyAVeS0OmVlGd4_RV5b1xnJ1aAUPt8rbt1M',
  authDomain: 'genoibra-5ed82.firebaseapp.com'
};

// IPs hardcoded apenas para desenvolvimento local
const HARDCODED_IPS = [
  '127.0.0.1',
  '::1'
];

/**
 * Extrai o IP real do cliente considerando proxies e CDNs
 */
function extractClientIP(event) {
  const headers = event.headers || {};
  
  // Lista de headers em ordem de prioridade para Netlify
  const ipHeaders = [
    'x-nf-client-connection-ip',  // Netlify específico - MAIS CONFIÁVEL
    'x-forwarded-for',           // Padrão para proxies
    'x-real-ip',                 // Nginx
    'x-client-ip',               // Apache
    'cf-connecting-ip',          // Cloudflare
    'true-client-ip',            // Cloudflare Enterprise
    'x-cluster-client-ip',       // Cluster
    'x-forwarded',               // Variação
    'forwarded-for',             // Variação
    'forwarded'                  // RFC 7239
  ];

  console.log('📋 TODOS OS HEADERS RECEBIDOS:');
  Object.entries(headers).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  const detectedIPs = new Set(); // Usar Set para evitar duplicatas
  const ipDetails = [];

  for (const header of ipHeaders) {
    const value = headers[header];
    if (value) {
      console.log(`🔍 Processando header ${header}: ${value}`);
      
      // x-forwarded-for pode ter múltiplos IPs separados por vírgula
      const ips = value.split(',').map(ip => ip.trim()).filter(ip => ip && ip !== 'unknown');
      
      for (const ip of ips) {
        const type = detectIPType(ip);
        if (type !== 'invalid' && !detectedIPs.has(ip)) {
          detectedIPs.add(ip);
          ipDetails.push({ ip, type, source: header });
          console.log(`  ✅ IP válido encontrado: ${ip} (${type}) via ${header}`);
        } else if (detectedIPs.has(ip)) {
          console.log(`  🔄 IP duplicado ignorado: ${ip} via ${header}`);
        } else {
          console.log(`  ❌ IP inválido ignorado: ${ip} via ${header}`);
        }
      }
    }
  }

  // Fallback para IP do evento (menos confiável)
  const eventIP = event.ip || event.clientIP;
  if (eventIP && !detectedIPs.has(eventIP)) {
    const type = detectIPType(eventIP);
    if (type !== 'invalid') {
      detectedIPs.add(eventIP);
      ipDetails.push({ ip: eventIP, type, source: 'event' });
      console.log(`⚠️ IP do evento (fallback): ${eventIP} (${type})`);
    }
  }

  console.log(`🎯 TOTAL DE IPs ÚNICOS DETECTADOS: ${ipDetails.length}`);
  ipDetails.forEach((ipData, index) => {
    console.log(`  ${index + 1}. ${ipData.ip} (${ipData.type}) - fonte: ${ipData.source}`);
  });

  return ipDetails;
}

/**
 * Normaliza IPv6 para comparação consistente
 */
function normalizeIPv6(ip) {
  if (!ip || !ip.includes(':')) return ip;
  
  try {
    let normalized = ip.trim().toLowerCase();
    
    // Remover prefixos IPv4-mapped IPv6 (::ffff:192.168.1.1)
    if (normalized.startsWith('::ffff:')) {
      const ipv4Part = normalized.substring(7);
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipv4Part)) {
        console.log(`🔄 Convertendo IPv4-mapped IPv6 para IPv4: ${ip} -> ${ipv4Part}`);
        return ipv4Part;
      }
    }
    
    // Expandir :: para zeros completos
    if (normalized.includes('::')) {
      const parts = normalized.split('::');
      const leftParts = parts[0] ? parts[0].split(':').filter(p => p !== '') : [];
      const rightParts = parts[1] ? parts[1].split(':').filter(p => p !== '') : [];
      const missingParts = 8 - leftParts.length - rightParts.length;
      
      if (missingParts > 0) {
        const middleParts = Array(missingParts).fill('0000');
        const allParts = [...leftParts, ...middleParts, ...rightParts];
        normalized = allParts.map(part => part.padStart(4, '0')).join(':');
      }
    } else {
      // Normalizar cada parte para 4 dígitos
      const parts = normalized.split(':');
      if (parts.length === 8) {
        normalized = parts.map(part => part.padStart(4, '0')).join(':');
      }
    }
    
    console.log(`🔧 IPv6 normalizado: ${ip} -> ${normalized}`);
    return normalized;
  } catch (error) {
    console.error('❌ Erro ao normalizar IPv6:', error);
    return ip;
  }
}

/**
 * Detecta tipo de IP com validação rigorosa
 */
function detectIPType(ip) {
  if (!ip) return 'invalid';
  
  const cleanIP = ip.trim();
  
  // Check for CIDR notation (ranges)
  if (cleanIP.includes('/')) {
    const [ipPart, prefixPart] = cleanIP.split('/');
    const prefix = parseInt(prefixPart);
    
    // Validate prefix length
    if (isNaN(prefix)) return 'invalid';
    
    // IPv4 CIDR (e.g., 192.168.1.0/24)
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = ipPart.match(ipv4Pattern);
    
    if (ipv4Match) {
      const parts = ipv4Match.slice(1).map(Number);
      if (parts.every(part => part >= 0 && part <= 255) && prefix >= 0 && prefix <= 32) {
        return 'ipv4_range';
      }
    }
    
    // IPv6 CIDR (e.g., 2001:db8::/32)
    const ipv6Patterns = [
      /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      /^::1$/,
      /^::$/,
      /^([0-9a-fA-F]{1,4}:){1,7}:$/,
      /^:([0-9a-fA-F]{1,4}:){1,7}$/,
      /^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/,
      /^::ffff:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
    ];
    
    if (ipv6Patterns.some(pattern => pattern.test(ipPart)) || ipPart.includes('::')) {
      if (prefix >= 0 && prefix <= 128) {
        return 'ipv6_range';
      }
    }
    
    return 'invalid';
  }
  
  // IPv4 pattern mais rigoroso
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = cleanIP.match(ipv4Pattern);
  
  if (ipv4Match) {
    const parts = ipv4Match.slice(1).map(Number);
    if (parts.every(part => part >= 0 && part <= 255)) {
      return 'ipv4';
    }
  }
  
  // IPv6 patterns mais abrangentes
  const ipv6Patterns = [
    /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,  // Formato completo
    /^::1$/,                                        // Localhost
    /^::$/,                                         // All zeros
    /^([0-9a-fA-F]{1,4}:){1,7}:$/,                // Com :: no final
    /^:([0-9a-fA-F]{1,4}:){1,7}$/,                // Com :: no início
    /^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/, // Com :: no meio
    /^::ffff:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/ // IPv4-mapped IPv6
  ];
  
  if (ipv6Patterns.some(pattern => pattern.test(cleanIP)) || cleanIP.includes('::')) {
    return 'ipv6';
  }
  
  return 'invalid';
}

/**
 * Verifica se um IP está dentro de um range CIDR
 */
function isIPInRange(ip, range) {
  console.log(`🎯 Verificando se IP ${ip} está no range ${range}`);
  
  if (!range.includes('/')) {
    // Se não é um range, fazer comparação direta
    const directMatch = ip === range;
    console.log(`  📍 Comparação direta: ${ip} === ${range} = ${directMatch}`);
    return ip === range;
  }

  const [rangeIP, prefixStr] = range.split('/');
  const prefix = parseInt(prefixStr);
  
  console.log(`  📊 Range decomposto: IP=${rangeIP}, Prefix=${prefix}`);

  // IPv4 range check
  const ipType = detectIPType(ip);
  const rangeType = detectIPType(rangeIP);
  
  console.log(`  🔍 Tipos: IP=${ipType}, Range=${rangeType}`);
  
  if (ipType === 'ipv4' && rangeType === 'ipv4') {
    console.log(`  🔢 Verificando range IPv4...`);
    const result = isIPv4InRange(ip, rangeIP, prefix);
    console.log(`  ✅ Resultado IPv4: ${result}`);
    return result;
  }

  // IPv6 range check
  if (ipType === 'ipv6' && rangeType === 'ipv6') {
    console.log(`  🔢 Verificando range IPv6...`);
    const result = isIPv6InRange(ip, rangeIP, prefix);
    console.log(`  ✅ Resultado IPv6: ${result}`);
    return result;
  }

  console.log(`  ❌ Tipos incompatíveis: ${ipType} vs ${rangeType}`);
  return false;
}

/**
 * Verifica se um IPv4 está dentro de um range CIDR
 */
function isIPv4InRange(ip, rangeIP, prefix) {
  console.log(`    🔢 Calculando range IPv4: ${ip} em ${rangeIP}/${prefix}`);
  
  const ipToNumber = (ipStr) => {
    const parts = ipStr.split('.').map(Number);
    // Usar >>> 0 para garantir número unsigned de 32 bits
    return ((parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
  };

  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(rangeIP);
  const mask = (~((1 << (32 - prefix)) - 1)) >>> 0; // Garantir unsigned
  
  console.log(`    📊 Números: IP=${ipNum}, Range=${rangeNum}, Mask=${mask.toString(16)}`);
  console.log(`    🔍 IP & Mask = ${(ipNum & mask) >>> 0}, Range & Mask = ${(rangeNum & mask) >>> 0}`);

  const ipMasked = (ipNum & mask) >>> 0;
  const rangeMasked = (rangeNum & mask) >>> 0;
  const result = ipMasked === rangeMasked;
  
  console.log(`    ✅ Resultado final IPv4: ${result}`);
  return result;
}

/**
 * Verifica se um IPv6 está dentro de um range CIDR (implementação simplificada)
 */
function isIPv6InRange(ip, rangeIP, prefix) {
  // Normalizar ambos os IPs
  const normalizedIP = normalizeIPv6(ip);
  const normalizedRange = normalizeIPv6(rangeIP);

  // Converter para array de números para comparação bit a bit
  const ipParts = normalizedIP.split(':').map(part => parseInt(part, 16));
  const rangeParts = normalizedRange.split(':').map(part => parseInt(part, 16));

  // Calcular quantos grupos de 16 bits precisamos comparar
  const groupsToCheck = Math.floor(prefix / 16);
  const remainingBits = prefix % 16;

  // Comparar grupos completos
  for (let i = 0; i < groupsToCheck; i++) {
    if (ipParts[i] !== rangeParts[i]) {
      return false;
    }
  }

  // Comparar bits restantes no último grupo
  if (remainingBits > 0 && groupsToCheck < 8) {
    const mask = 0xFFFF << (16 - remainingBits);
    if ((ipParts[groupsToCheck] & mask) !== (rangeParts[groupsToCheck] & mask)) {
      return false;
    }
  }

  return true;
}

/**
 * Compara dois IPs considerando normalização
 */
function compareIPs(clientIP, allowedIPOrRange) {
  if (!clientIP || !allowedIPOrRange) return false;
  
  const clientType = detectIPType(clientIP);
  const allowedType = detectIPType(allowedIPOrRange);
  
  console.log(`🔍 Comparando IPs: ${clientIP} (${clientType}) vs ${allowedIPOrRange} (${allowedType})`);
  
  // Se é um range, usar verificação de range
  if (allowedType === 'ipv4_range' || allowedType === 'ipv6_range') {
    const isInRange = isIPInRange(clientIP, allowedIPOrRange);
    console.log(`🎯 Verificação de range: ${clientIP} em ${allowedIPOrRange} = ${isInRange}`);
    return isInRange;
  }
  
  // Se tipos diferentes, não podem ser iguais
  if (clientType !== allowedType) {
    console.log(`❌ Tipos diferentes: ${clientType} vs ${allowedType}`);
    return false;
  }
  
  if (clientType === 'ipv4') {
    // Comparação direta para IPv4
    const match = clientIP.trim() === allowedIPOrRange.trim();
    console.log(`IPv4 match: "${clientIP}" === "${allowedIPOrRange}" = ${match}`);
    return match;
  }
  
  if (clientType === 'ipv6') {
    // Normalizar ambos os IPv6 antes de comparar
    const normalizedClient = normalizeIPv6(clientIP);
    const normalizedAllowed = normalizeIPv6(allowedIPOrRange);
    const match = normalizedClient === normalizedAllowed;
    console.log(`IPv6 match: "${normalizedClient}" === "${normalizedAllowed}" = ${match}`);
    return match;
  }
  
  console.log(`❌ Tipo de IP inválido: ${clientType}`);
  return false;
}

/**
 * Verifica se IP está na lista hardcoded
 */
function isHardcodedIP(clientIPs) {
  for (const clientIPData of clientIPs) {
    for (const allowedIP of HARDCODED_IPS) {
      const match = compareIPs(clientIPData.ip, allowedIP);
      if (match) {
        console.log(`✅ IP hardcoded encontrado: ${clientIPData.ip} = ${allowedIP}`);
        return true;
      }
    }
  }
  return false;
}

/**
 * Busca IPs permitidos usando REST API do Firebase
 */
async function getFirebaseAllowedIPs() {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Tentativa ${attempt}/${maxRetries} - Buscando IPs via REST API (${new Date().toISOString()})...`);
      
      // Usar REST API do Firestore com query correta
      const timestamp = Date.now();
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;
      const url = `${baseUrl}/allowedIPs?key=${FIREBASE_CONFIG.apiKey}&_t=${timestamp}`;
      
      console.log(`🌐 Fazendo requisição para: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro HTTP ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`📊 Resposta da REST API recebida. Status: ${response.status}`);
      
      if (!data.documents || !Array.isArray(data.documents)) {
        console.log(`📄 Nenhum documento encontrado na coleção allowedIPs`);
        return [];
      }

      console.log(`📄 Documentos encontrados: ${data.documents.length}`);
      
      const ips = [];
      data.documents.forEach((doc, index) => {
        try {
          const fields = doc.fields || {};
          const ip = fields.ip?.stringValue;
          const active = fields.active?.booleanValue;
          const type = fields.type?.stringValue;
          const description = fields.description?.stringValue;
          const addedBy = fields.addedBy?.stringValue;
          const addedAt = fields.addedAt?.stringValue;
          
          console.log(`  📄 Documento ${index + 1}:`, {
            docId: doc.name?.split('/').pop(),
            ip,
            active,
            type,
            description,
            addedBy,
            addedAt
          });
          
          // Só incluir IPs ativos
          if (ip && active !== false) {
            ips.push(ip);
            console.log(`    ✅ IP adicionado à lista: ${ip} (${type})`);
          } else {
            console.log(`    ❌ IP ignorado (inativo ou inválido): ${ip}`);
          }
        } catch (docError) {
          console.error(`❌ Erro ao processar documento ${index + 1}:`, docError);
        }
      });
      
      console.log(`✅ Total de IPs carregados via REST API: ${ips.length}`);
      ips.forEach((ip, index) => {
        console.log(`  ${index + 1}. ${ip}`);
      });
      
      return ips;
      
    } catch (error) {
      console.error(`❌ Tentativa ${attempt}/${maxRetries} falhou:`, error);
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`⏳ Aguardando 1 segundo antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  console.error(`💥 Todas as ${maxRetries} tentativas falharam. Último erro:`, lastError);
  
  // FALLBACK: Tentar buscar via método alternativo
  console.log('🔄 TENTANDO MÉTODO ALTERNATIVO...');
  try {
    return await getFirebaseIPsAlternative();
  } catch (fallbackError) {
    console.error('❌ Método alternativo também falhou:', fallbackError);
    return [];
  }
}

/**
 * Método alternativo para buscar IPs do Firebase usando query simples
 */
async function getFirebaseIPsAlternative() {
  try {
    console.log('🔄 Tentando método alternativo para buscar IPs...');
    
    // Usar endpoint de query mais simples
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;
    const url = `${baseUrl}:runQuery`;
    
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: 'allowedIPs' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'active' },
            op: 'EQUAL',
            value: { booleanValue: true }
          }
        }
      }
    };
    
    console.log(`🌐 Fazendo query alternativa para: ${url}`);
    console.log(`📋 Payload:`, JSON.stringify(queryPayload, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryPayload)
    });

    console.log(`📊 Status da query alternativa: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na query alternativa:`, errorText);
      throw new Error(`Query failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`📊 Resposta da query alternativa recebida`);
    
    if (!data || !Array.isArray(data)) {
      console.log(`📄 Resposta inválida da query alternativa`);
      return [];
    }

    const ips = [];
    data.forEach((item, index) => {
      if (item.document && item.document.fields) {
        const fields = item.document.fields;
        const ip = fields.ip?.stringValue;
        const active = fields.active?.booleanValue;
        
        if (ip && active !== false) {
          ips.push(ip);
          console.log(`  ✅ IP encontrado via query: ${ip}`);
        }
      }
    });
    
    console.log(`✅ IPs carregados via método alternativo: ${ips.length}`);
    return ips;
    
  } catch (error) {
    console.error('❌ Método alternativo falhou:', error);
    throw error;
  }
}

/**
 * Verifica configuração de acesso público usando REST API
 */
async function checkPublicAccess() {
  try {
    console.log('🌍 Verificando configuração de acesso público via REST API...');
    
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;
    const url = `${baseUrl}/systemConfig/publicAccess?key=${FIREBASE_CONFIG.apiKey}`;
    console.log(`🌐 URL da requisição: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Status da configuração: ${response.status} ${response.statusText}`);

    if (response.status === 404) {
      console.log('🌍 Documento de configuração não existe - acesso público DESABILITADO');
      return { enabled: false };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao buscar configuração:`, errorText);
      return { enabled: false };
    }

    const data = await response.json();
    console.log('📊 Resposta da configuração recebida:', JSON.stringify(data, null, 2));
    
    if (!data.fields) {
      console.log('🌍 Documento sem campos - acesso público DESABILITADO');
      return { enabled: false };
    }

    const enabled = data.fields.enabled?.booleanValue || false;
    const enabledBy = data.fields.enabledBy?.stringValue;
    const enabledAt = data.fields.enabledAt?.stringValue;
    const reason = data.fields.reason?.stringValue;
    
    const config = { enabled, enabledBy, enabledAt, reason };
    
    console.log(`🌍 Acesso público: ${enabled ? 'HABILITADO' : 'DESABILITADO'}`);
    if (enabled) {
      console.log(`  👤 Habilitado por: ${enabledBy}`);
      console.log(`  📅 Em: ${enabledAt}`);
      console.log(`  📝 Motivo: ${reason}`);
    }
    
    return config;
  } catch (error) {
    console.error('❌ Erro ao verificar acesso público:', error);
    return { enabled: false };
  }
}

/**
 * Netlify Function principal
 */
exports.handler = async (event, context) => {
  const startTime = Date.now();
  console.log('🚀 ===== INICIANDO VERIFICAÇÃO DE IP (VERSÃO CORRIGIDA) =====');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Método: ${event.httpMethod}`);
  console.log(`📍 URL: ${event.path}`);
  console.log(`🔧 Usando Firebase REST API com fallbacks`);
  
  // Configurar CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ Respondendo a preflight request');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // 1. DETECTAR IPs DO CLIENTE (SEM DUPLICATAS)
    console.log('\n🔍 ETAPA 1: DETECÇÃO DE IPs DO CLIENTE (ÚNICOS)');
    const allClientIPs = extractClientIP(event);
    
    if (allClientIPs.length === 0) {
      console.log('❌ FALHA: Nenhum IP válido detectado');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: false,
          reason: 'IP_NOT_DETECTED',
          message: 'Não foi possível detectar seu endereço IP',
          detectedIPs: [],
          debug: {
            headers: Object.keys(event.headers || {}),
            eventIP: event.ip || 'undefined',
            clientIP: event.clientIP || 'undefined'
          }
        })
      };
    }

    const primaryClientIP = allClientIPs[0].ip;
    const ipType = allClientIPs[0].type;
    const allIPs = allClientIPs.map(ipData => ipData.ip);

    console.log(`🎯 IP PRINCIPAL: ${primaryClientIP} (${ipType})`);
    console.log(`📋 TODOS OS IPs ÚNICOS: ${allIPs.join(', ')}`);

    // 2. VERIFICAR ACESSO PÚBLICO
    console.log('\n🌍 ETAPA 2: VERIFICAÇÃO DE ACESSO PÚBLICO');
    const publicAccess = await checkPublicAccess();
    if (publicAccess.enabled) {
      console.log('✅ ACESSO PÚBLICO HABILITADO - PERMITINDO ACESSO');
      const duration = Date.now() - startTime;
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: true,
          reason: 'PUBLIC_ACCESS_ENABLED',
          clientIP: primaryClientIP,
          ipType,
          allDetectedIPs: allIPs,
          message: 'Acesso público habilitado',
          debug: {
            duration: `${duration}ms`,
            publicAccessConfig: publicAccess,
            method: 'rest_api'
          }
        })
      };
    }

    // 3. VERIFICAR IPs HARDCODED
    console.log('\n🔧 ETAPA 3: VERIFICAÇÃO DE IPs HARDCODED');
    console.log(`📋 IPs hardcoded disponíveis: ${HARDCODED_IPS.join(', ')}`);
    
    const foundInHardcoded = isHardcodedIP(allClientIPs);
    if (foundInHardcoded) {
      console.log('✅ IP ENCONTRADO NA LISTA HARDCODED - PERMITINDO ACESSO');
      const duration = Date.now() - startTime;
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: true,
          reason: 'HARDCODED_IP',
          clientIP: primaryClientIP,
          ipType,
          allDetectedIPs: allIPs,
          message: 'IP autorizado (hardcoded)',
          debug: {
            duration: `${duration}ms`,
            hardcodedIPs: HARDCODED_IPS,
            method: 'rest_api'
          }
        })
      };
    }

    // 4. VERIFICAR IPs DO FIREBASE
    console.log('\n🔥 ETAPA 4: VERIFICAÇÃO DE IPs DO FIREBASE (REST API)');
    const firebaseIPs = await getFirebaseAllowedIPs();
    console.log(`📋 IPs do Firebase carregados: ${firebaseIPs.length}`);
    firebaseIPs.forEach((ip, index) => {
      console.log(`  ${index + 1}. ${ip}`);
    });
    
    // VERIFICAÇÃO CRÍTICA: Se não carregou IPs do Firebase, NEGAR ACESSO
    if (firebaseIPs.length === 0) {
      console.log('🚨 CRÍTICO: Nenhum IP carregado do Firebase - NEGANDO ACESSO POR SEGURANÇA');
      const duration = Date.now() - startTime;
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: false,
          reason: 'FIREBASE_CONNECTION_FAILED',
          clientIP: primaryClientIP,
          ipType,
          allDetectedIPs: allIPs,
          message: 'Falha na conexão com Firebase - acesso negado por segurança',
          debug: {
            duration: `${duration}ms`,
            firebaseError: 'Could not load IPs from Firebase',
            method: 'rest_api_failed'
          }
        })
      };
    }
    
    let foundInFirebase = false;
    let matchedFirebaseIP = null;
    
    console.log('\n🔍 INICIANDO COMPARAÇÕES DETALHADAS:');
    
    // Verificar cada IP detectado contra cada IP do Firebase
    for (let i = 0; i < allClientIPs.length; i++) {
      const clientIPData = allClientIPs[i];
      console.log(`\n👤 Cliente IP ${i + 1}: ${clientIPData.ip} (${clientIPData.type})`);
      
      for (let j = 0; j < firebaseIPs.length; j++) {
        const allowedIP = firebaseIPs[j];
        const allowedType = detectIPType(allowedIP);
        
        console.log(`  🔍 vs Firebase IP ${j + 1}: ${allowedIP} (${allowedType})`);
        
        const match = compareIPs(clientIPData.ip, allowedIP);
        console.log(`    Resultado: ${match ? '✅ MATCH!' : '❌ No match'}`);
        
        if (match) {
          foundInFirebase = true;
          matchedFirebaseIP = allowedIP;
          console.log(`🎉 MATCH ENCONTRADO! Cliente: ${clientIPData.ip} = Firebase: ${allowedIP}`);
          break;
        }
      }
      
      if (foundInFirebase) break;
    }

    if (foundInFirebase) {
      console.log(`✅ IP AUTORIZADO ENCONTRADO NO FIREBASE: ${matchedFirebaseIP}`);
      const duration = Date.now() - startTime;
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: true,
          reason: 'FIREBASE_IP',
          clientIP: primaryClientIP,
          ipType,
          allDetectedIPs: allIPs,
          matchedIP: matchedFirebaseIP,
          message: 'IP autorizado (Firebase)',
          debug: {
            duration: `${duration}ms`,
            firebaseIPsCount: firebaseIPs.length,
            comparisonsPerformed: allClientIPs.length * firebaseIPs.length,
            method: 'rest_api'
          }
        })
      };
    }

    // 5. ACESSO NEGADO - LOG COMPLETO
    console.log('\n❌ ===== ACESSO NEGADO =====');
    console.log(`📋 IPs do cliente testados: ${allIPs.join(', ')}`);
    console.log(`📋 IPs hardcoded disponíveis: ${HARDCODED_IPS.join(', ')}`);
    console.log(`📋 IPs Firebase disponíveis: ${firebaseIPs.join(', ')}`);
    
    console.log('\n🔍 RESUMO DAS COMPARAÇÕES:');
    for (const clientIPData of allClientIPs) {
      console.log(`\n👤 Cliente: ${clientIPData.ip} (${clientIPData.type})`);
      
      // Comparar com hardcoded
      console.log('  🔧 vs Hardcoded:');
      for (const hardcodedIP of HARDCODED_IPS) {
        const match = compareIPs(clientIPData.ip, hardcodedIP);
        console.log(`    ${hardcodedIP}: ${match ? '✅' : '❌'}`);
      }
      
      // Comparar com Firebase
      console.log('  🔥 vs Firebase:');
      for (const firebaseIP of firebaseIPs) {
        const match = compareIPs(clientIPData.ip, firebaseIP);
        console.log(`    ${firebaseIP}: ${match ? '✅' : '❌'}`);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`\n⏱️ Verificação concluída em ${duration}ms`);
    console.log('🚫 RESULTADO FINAL: ACESSO NEGADO');
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        allowed: false,
        reason: 'IP_NOT_AUTHORIZED',
        clientIP: primaryClientIP,
        ipType,
        allDetectedIPs: allIPs,
        availableHardcodedIPs: HARDCODED_IPS,
        availableFirebaseIPs: firebaseIPs,
        message: 'Seu endereço IP não está autorizado a acessar esta plataforma',
        debug: {
          duration: `${duration}ms`,
          totalComparisons: allClientIPs.length * (HARDCODED_IPs.length + firebaseIPs.length),
          firebaseConnection: firebaseIPs.length > 0 ? 'success' : 'failed',
          detectedIPsDetails: allClientIPs,
          method: 'rest_api',
          firebaseUrl: `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}`
        }
      })
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ ERRO CRÍTICO NA VERIFICAÇÃO DE IP:', error);
    console.log(`⏱️ Erro ocorreu após ${duration}ms`);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        allowed: false,
        reason: 'VERIFICATION_ERROR',
        message: 'Erro interno na verificação de IP',
        error: error.message,
        debug: {
          duration: `${duration}ms`,
          errorStack: error.stack,
          method: 'rest_api_fallback'
        }
      })
    };
  }
};