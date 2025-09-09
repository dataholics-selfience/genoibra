const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (will use environment variables in production)
let adminApp;
let db;

try {
  if (!adminApp) {
    adminApp = initializeApp();
    db = getFirestore(adminApp);
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

// Hardcoded allowed IPs for immediate access (removidos conforme solicitado)
const HARDCODED_IPS = [
  '127.0.0.1',
  '::1'
];

/**
 * Extrai o IP real do cliente considerando proxies e CDNs
 */
function extractClientIP(event) {
  const headers = event.headers || {};
  
  // Lista de headers em ordem de prioridade
  const ipHeaders = [
    'x-nf-client-connection-ip',  // Netlify específico
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

  console.log('📋 Headers disponíveis:', Object.keys(headers));

  for (const header of ipHeaders) {
    const value = headers[header];
    if (value) {
      // x-forwarded-for pode ter múltiplos IPs separados por vírgula
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        console.log(`✅ IP extraído do header ${header}: ${ip}`);
        return ip;
      }
    }
  }

  // Fallback para IP do evento (menos confiável)
  const eventIP = event.ip || event.clientIP;
  if (eventIP) {
    console.log(`⚠️ IP extraído do evento (fallback): ${eventIP}`);
    return eventIP;
  }

  console.log('❌ Não foi possível extrair IP do cliente');
  return null;
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
 * Compara dois IPs considerando normalização
 */
function compareIPs(clientIP, allowedIP) {
  if (!clientIP || !allowedIP) return false;
  
  const clientType = detectIPType(clientIP);
  const allowedType = detectIPType(allowedIP);
  
  console.log(`🔍 Comparando IPs: ${clientIP} (${clientType}) vs ${allowedIP} (${allowedType})`);
  
  // Se tipos diferentes, não podem ser iguais
  if (clientType !== allowedType) {
    return false;
  }
  
  if (clientType === 'ipv4') {
    // Comparação direta para IPv4
    const match = clientIP.trim() === allowedIP.trim();
    console.log(`IPv4 match: ${clientIP} === ${allowedIP} = ${match}`);
    return match;
  }
  
  if (clientType === 'ipv6') {
    // Normalizar ambos os IPv6 antes de comparar
    const normalizedClient = normalizeIPv6(clientIP);
    const normalizedAllowed = normalizeIPv6(allowedIP);
    const match = normalizedClient === normalizedAllowed;
    console.log(`IPv6 match: ${normalizedClient} === ${normalizedAllowed} = ${match}`);
    return match;
  }
  
  return false;
}

/**
 * Verifica se IP está na lista hardcoded
 */
function isHardcodedIP(clientIP) {
  return HARDCODED_IPS.some(allowedIP => {
    const match = compareIPs(clientIP, allowedIP);
    if (match) {
      console.log(`✅ IP hardcoded encontrado: ${clientIP} = ${allowedIP}`);
    }
    return match;
  });
}

/**
 * Busca IPs permitidos no Firebase
 */
async function getFirebaseAllowedIPs() {
  if (!db) {
    console.log('⚠️ Firebase não inicializado, usando apenas IPs hardcoded');
    return [];
  }

  try {
    console.log('🔍 Buscando IPs permitidos no Firebase...');
    const allowedIPsRef = db.collection('allowedIPs');
    const snapshot = await allowedIPsRef.where('active', '==', true).get();
    
    const ips = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      ips.push({
        ip: data.ip,
        type: data.type,
        description: data.description,
        addedBy: data.addedBy
      });
    });
    
    console.log(`📋 IPs do Firebase carregados: ${ips.length}`);
    ips.forEach(ipData => {
      console.log(`  - ${ipData.ip} (${ipData.type}) - ${ipData.description}`);
    });
    
    return ips.map(ipData => ipData.ip);
  } catch (error) {
    console.error('❌ Erro ao buscar IPs do Firebase:', error);
    return [];
  }
}

/**
 * Verifica configuração de acesso público
 */
async function checkPublicAccess() {
  if (!db) return { enabled: false };

  try {
    const configRef = db.collection('systemConfig').doc('publicAccess');
    const configDoc = await configRef.get();
    
    if (configDoc.exists) {
      const config = configDoc.data();
      console.log(`🌍 Configuração de acesso público: ${config.enabled ? 'HABILITADO' : 'DESABILITADO'}`);
      return config;
    }
    
    return { enabled: false };
  } catch (error) {
    console.error('❌ Erro ao verificar acesso público:', error);
    return { enabled: false };
  }
}

/**
 * Detecta múltiplos IPs do cliente (IPv4 e IPv6)
 */
function detectAllClientIPs(event) {
  const headers = event.headers || {};
  const detectedIPs = new Set();
  
  // Lista de headers para verificar
  const ipHeaders = [
    'x-nf-client-connection-ip',
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'true-client-ip'
  ];

  console.log('🔍 Detectando todos os IPs possíveis...');

  // Extrair IPs de todos os headers
  for (const header of ipHeaders) {
    const value = headers[header];
    if (value) {
      // Pode ter múltiplos IPs separados por vírgula
      const ips = value.split(',').map(ip => ip.trim()).filter(ip => ip && ip !== 'unknown');
      ips.forEach(ip => {
        const type = detectIPType(ip);
        if (type !== 'invalid') {
          detectedIPs.add(ip);
          console.log(`  📍 ${header}: ${ip} (${type})`);
        }
      });
    }
  }

  // Adicionar IP do evento como fallback
  const eventIP = event.ip || event.clientIP;
  if (eventIP) {
    const type = detectIPType(eventIP);
    if (type !== 'invalid') {
      detectedIPs.add(eventIP);
      console.log(`  📍 event.ip: ${eventIP} (${type})`);
    }
  }

  const allIPs = Array.from(detectedIPs);
  console.log(`🎯 Total de IPs detectados: ${allIPs.length}`, allIPs);
  
  return allIPs;
}

/**
 * Netlify Function principal
 */
exports.handler = async (event, context) => {
  // Configurar CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    console.log('🔐 Iniciando verificação de IP...');
    console.log('📋 Headers recebidos:', JSON.stringify(event.headers, null, 2));
    
    // Detectar todos os IPs possíveis do cliente
    const allClientIPs = detectAllClientIPs(event);
    
    if (allClientIPs.length === 0) {
      console.log('❌ Nenhum IP válido detectado');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: false,
          reason: 'IP_NOT_DETECTED',
          message: 'Não foi possível detectar seu endereço IP',
          detectedIPs: []
        })
      };
    }

    console.log(`🔍 IPs detectados do cliente:`, allClientIPs);
    
    // Usar o primeiro IP válido como principal
    const primaryClientIP = allClientIPs[0];
    const ipType = detectIPType(primaryClientIP);

    console.log(`🎯 IP principal: ${primaryClientIP} (${ipType})`);

    // Verificar acesso público primeiro
    const publicAccess = await checkPublicAccess();
    if (publicAccess.enabled) {
      console.log('🌍 Acesso público habilitado - permitindo acesso');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: true,
          reason: 'PUBLIC_ACCESS_ENABLED',
          clientIP: primaryClientIP,
          ipType,
          allDetectedIPs: allClientIPs,
          message: 'Acesso público habilitado'
        })
      };
    }

    // Verificar IPs hardcoded
    let foundInHardcoded = false;
    for (const clientIP of allClientIPs) {
      if (isHardcodedIP(clientIP)) {
        console.log(`✅ IP encontrado na lista hardcoded: ${clientIP}`);
        foundInHardcoded = true;
        break;
      }
    }

    if (foundInHardcoded) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: true,
          reason: 'HARDCODED_IP',
          clientIP: primaryClientIP,
          ipType,
          allDetectedIPs: allClientIPs,
          message: 'IP autorizado (hardcoded)'
        })
      };
    }

    // Verificar IPs do Firebase
    const firebaseIPs = await getFirebaseAllowedIPs();
    console.log(`🔍 IPs do Firebase para verificação:`, firebaseIPs);
    
    let foundInFirebase = false;
    let matchedFirebaseIP = null;
    
    // Verificar cada IP detectado contra cada IP do Firebase
    for (const clientIP of allClientIPs) {
      for (const allowedIP of firebaseIPs) {
        if (compareIPs(clientIP, allowedIP)) {
          console.log(`✅ MATCH ENCONTRADO! Cliente: ${clientIP} = Firebase: ${allowedIP}`);
          foundInFirebase = true;
          matchedFirebaseIP = allowedIP;
          break;
        }
      }
      if (foundInFirebase) break;
    }

    if (foundInFirebase) {
      console.log(`✅ IP autorizado encontrado no Firebase: ${matchedFirebaseIP}`);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: true,
          reason: 'FIREBASE_IP',
          clientIP: primaryClientIP,
          ipType,
          allDetectedIPs: allClientIPs,
          matchedIP: matchedFirebaseIP,
          message: 'IP autorizado (Firebase)'
        })
      };
    }

    // IP não autorizado - log detalhado para debug
    console.log(`❌ ACESSO NEGADO - IP não autorizado`);
    console.log(`📋 IPs do cliente testados:`, allClientIPs);
    console.log(`📋 IPs hardcoded disponíveis:`, HARDCODED_IPS);
    console.log(`📋 IPs Firebase disponíveis:`, firebaseIPs);
    
    // Log de todas as comparações para debug
    console.log(`🔍 DETALHES DAS COMPARAÇÕES:`);
    for (const clientIP of allClientIPs) {
      console.log(`  Cliente: ${clientIP} (${detectIPType(clientIP)})`);
      
      // Comparar com hardcoded
      for (const hardcodedIP of HARDCODED_IPS) {
        const match = compareIPs(clientIP, hardcodedIP);
        console.log(`    vs Hardcoded ${hardcodedIP}: ${match}`);
      }
      
      // Comparar com Firebase
      for (const firebaseIP of firebaseIPs) {
        const match = compareIPs(clientIP, firebaseIP);
        console.log(`    vs Firebase ${firebaseIP}: ${match}`);
      }
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        allowed: false,
        reason: 'IP_NOT_AUTHORIZED',
        clientIP: primaryClientIP,
        ipType,
        allDetectedIPs: allClientIPs,
        availableHardcodedIPs: HARDCODED_IPS,
        availableFirebaseIPs: firebaseIPs,
        message: 'Seu endereço IP não está autorizado a acessar esta plataforma'
      })
    };

  } catch (error) {
    console.error('❌ Erro na verificação de IP:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        allowed: false,
        reason: 'VERIFICATION_ERROR',
        message: 'Erro interno na verificação de IP',
        error: error.message
      })
    };
  }
};