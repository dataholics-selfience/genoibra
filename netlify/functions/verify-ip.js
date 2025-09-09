const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
let adminApp;
let db;

try {
  // Check if Firebase Admin is already initialized
  const { getApps } = require('firebase-admin/app');
  const existingApps = getApps();
  
  if (existingApps.length === 0) {
    console.log('🔥 Inicializando Firebase Admin...');
    
    // Try to initialize with service account if available
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: 'genoibra-5ed82'
      });
    } else {
      // Initialize with default credentials (works in Netlify with environment variables)
      adminApp = initializeApp({
        projectId: 'genoibra-5ed82'
      });
    }
    
    db = getFirestore(adminApp);
    console.log('✅ Firebase Admin inicializado com sucesso');
  } else {
    adminApp = existingApps[0];
    db = getFirestore(adminApp);
    console.log('✅ Firebase Admin já estava inicializado');
  }
} catch (error) {
  console.error('❌ Erro na inicialização do Firebase Admin:', error);
  console.log('Environment variables available:', Object.keys(process.env).filter(key => key.includes('FIREBASE')));
}

// Hardcoded IPs apenas para desenvolvimento local
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

  const detectedIPs = [];

  for (const header of ipHeaders) {
    const value = headers[header];
    if (value) {
      console.log(`🔍 Processando header ${header}: ${value}`);
      
      // x-forwarded-for pode ter múltiplos IPs separados por vírgula
      const ips = value.split(',').map(ip => ip.trim()).filter(ip => ip && ip !== 'unknown');
      
      for (const ip of ips) {
        const type = detectIPType(ip);
        if (type !== 'invalid') {
          detectedIPs.push({ ip, type, source: header });
          console.log(`  ✅ IP válido encontrado: ${ip} (${type}) via ${header}`);
        } else {
          console.log(`  ❌ IP inválido ignorado: ${ip} via ${header}`);
        }
      }
    }
  }

  // Fallback para IP do evento (menos confiável)
  const eventIP = event.ip || event.clientIP;
  if (eventIP) {
    const type = detectIPType(eventIP);
    if (type !== 'invalid') {
      detectedIPs.push({ ip: eventIP, type, source: 'event' });
      console.log(`⚠️ IP do evento (fallback): ${eventIP} (${type})`);
    }
  }

  console.log(`🎯 TOTAL DE IPs DETECTADOS: ${detectedIPs.length}`);
  detectedIPs.forEach((ipData, index) => {
    console.log(`  ${index + 1}. ${ipData.ip} (${ipData.type}) - fonte: ${ipData.source}`);
  });

  return detectedIPs;
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
    console.log(`❌ Tipos diferentes: ${clientType} vs ${allowedType}`);
    return false;
  }
  
  if (clientType === 'ipv4') {
    // Comparação direta para IPv4
    const match = clientIP.trim() === allowedIP.trim();
    console.log(`IPv4 match: "${clientIP}" === "${allowedIP}" = ${match}`);
    return match;
  }
  
  if (clientType === 'ipv6') {
    // Normalizar ambos os IPv6 antes de comparar
    const normalizedClient = normalizeIPv6(clientIP);
    const normalizedAllowed = normalizeIPv6(allowedIP);
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
 * Busca IPs permitidos no Firebase com retry e logs detalhados
 */
async function getFirebaseAllowedIPs() {
  if (!db) {
    console.log('⚠️ Firebase não inicializado, usando apenas IPs hardcoded');
    return [];
  }

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Tentativa ${attempt}/${maxRetries} - Buscando IPs permitidos no Firebase...`);
      
      const allowedIPsRef = db.collection('allowedIPs');
      const snapshot = await allowedIPsRef.where('active', '==', true).get();
      
      console.log(`📊 Firebase query executada com sucesso. Documentos encontrados: ${snapshot.size}`);
      
      const ips = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        ips.push({
          id: doc.id,
          ip: data.ip,
          type: data.type,
          description: data.description,
          addedBy: data.addedBy,
          addedAt: data.addedAt
        });
        console.log(`  📄 Documento ${doc.id}: ${data.ip} (${data.type}) - ${data.description}`);
      });
      
      console.log(`✅ Total de IPs carregados do Firebase: ${ips.length}`);
      return ips.map(ipData => ipData.ip);
      
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
  return [];
}

/**
 * Verifica configuração de acesso público
 */
async function checkPublicAccess() {
  if (!db) {
    console.log('⚠️ Firebase não inicializado para verificar acesso público');
    return { enabled: false };
  }

  try {
    console.log('🌍 Verificando configuração de acesso público...');
    const configRef = db.collection('systemConfig').doc('publicAccess');
    const configDoc = await configRef.get();
    
    if (configDoc.exists) {
      const config = configDoc.data();
      console.log(`🌍 Acesso público: ${config.enabled ? 'HABILITADO' : 'DESABILITADO'}`);
      if (config.enabled) {
        console.log(`  👤 Habilitado por: ${config.enabledBy}`);
        console.log(`  📅 Em: ${config.enabledAt}`);
        console.log(`  📝 Motivo: ${config.reason}`);
      }
      return config;
    }
    
    console.log('🌍 Documento de configuração não existe - acesso público DESABILITADO');
    return { enabled: false };
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
  console.log('🚀 ===== INICIANDO VERIFICAÇÃO DE IP =====');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Método: ${event.httpMethod}`);
  console.log(`📍 URL: ${event.path}`);
  
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
    // 1. DETECTAR IPs DO CLIENTE
    console.log('\n🔍 ETAPA 1: DETECÇÃO DE IPs DO CLIENTE');
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
    console.log(`📋 TODOS OS IPs: ${allIPs.join(', ')}`);

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
            publicAccessConfig: publicAccess
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
            hardcodedIPs: HARDCODED_IPS
          }
        })
      };
    }

    // 4. VERIFICAR IPs DO FIREBASE
    console.log('\n🔥 ETAPA 4: VERIFICAÇÃO DE IPs DO FIREBASE');
    const firebaseIPs = await getFirebaseAllowedIPs();
    console.log(`📋 IPs do Firebase carregados: ${firebaseIPs.length}`);
    firebaseIPs.forEach((ip, index) => {
      console.log(`  ${index + 1}. ${ip}`);
    });
    
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
            comparisonsPerformed: allClientIPs.length * firebaseIPs.length
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
          totalComparisons: allClientIPs.length * (HARDCODED_IPS.length + firebaseIPs.length),
          firebaseConnection: db ? 'connected' : 'failed',
          detectedIPsDetails: allClientIPs
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
          firebaseInitialized: !!db
        }
      })
    };
  }
};