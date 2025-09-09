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

// Hardcoded allowed IPs for immediate access
const HARDCODED_IPS = [
  '186.204.58.149',
  '2804:14c:64:89fb::d5b8',
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

  for (const header of ipHeaders) {
    const value = headers[header];
    if (value) {
      // x-forwarded-for pode ter múltiplos IPs separados por vírgula
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        console.log(`IP extraído do header ${header}: ${ip}`);
        return ip;
      }
    }
  }

  // Fallback para IP do evento (menos confiável)
  const eventIP = event.ip || event.clientIP;
  if (eventIP) {
    console.log(`IP extraído do evento: ${eventIP}`);
    return eventIP;
  }

  console.log('❌ Não foi possível extrair IP do cliente');
  return null;
}

/**
 * Normaliza IPv6 para comparação
 */
function normalizeIPv6(ip) {
  if (!ip.includes(':')) return ip;
  
  try {
    // Remove espaços e converte para lowercase
    let normalized = ip.trim().toLowerCase();
    
    // Expandir :: para zeros
    if (normalized.includes('::')) {
      const parts = normalized.split('::');
      const leftParts = parts[0] ? parts[0].split(':') : [];
      const rightParts = parts[1] ? parts[1].split(':') : [];
      const missingParts = 8 - leftParts.length - rightParts.length;
      
      const middleParts = Array(missingParts).fill('0000');
      const allParts = [...leftParts, ...middleParts, ...rightParts];
      
      normalized = allParts.map(part => part.padStart(4, '0')).join(':');
    }
    
    return normalized;
  } catch (error) {
    console.error('Erro ao normalizar IPv6:', error);
    return ip;
  }
}

/**
 * Detecta tipo de IP
 */
function detectIPType(ip) {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$|^::1$|^::$|^[0-9a-fA-F]{1,4}(:[0-9a-fA-F]{0,4}){1,7}$/;
  
  if (ipv4Pattern.test(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.every(part => part >= 0 && part <= 255)) {
      return 'ipv4';
    }
  }
  
  if (ipv6Pattern.test(ip) || ip.includes('::') || /^[0-9a-fA-F:]+$/.test(ip)) {
    return 'ipv6';
  }
  
  return 'invalid';
}

/**
 * Verifica se IP está na lista hardcoded
 */
function isHardcodedIP(clientIP) {
  const normalizedClientIP = detectIPType(clientIP) === 'ipv6' 
    ? normalizeIPv6(clientIP) 
    : clientIP;

  return HARDCODED_IPS.some(allowedIP => {
    const normalizedAllowedIP = detectIPType(allowedIP) === 'ipv6' 
      ? normalizeIPv6(allowedIP) 
      : allowedIP;
    
    const match = normalizedClientIP === normalizedAllowedIP;
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
    const allowedIPsRef = db.collection('allowedIPs');
    const snapshot = await allowedIPsRef.where('active', '==', true).get();
    
    const ips = [];
    snapshot.forEach(doc => {
      ips.push(doc.data().ip);
    });
    
    console.log(`📋 IPs do Firebase carregados: ${ips.length}`);
    return ips;
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
    
    // Extrair IP do cliente
    const clientIP = extractClientIP(event);
    
    if (!clientIP) {
      console.log('❌ IP do cliente não detectado');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: false,
          reason: 'IP_NOT_DETECTED',
          message: 'Não foi possível detectar seu endereço IP'
        })
      };
    }

    console.log(`🔍 IP do cliente detectado: ${clientIP}`);
    
    // Detectar tipo de IP
    const ipType = detectIPType(clientIP);
    if (ipType === 'invalid') {
      console.log(`❌ Formato de IP inválido: ${clientIP}`);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: false,
          reason: 'INVALID_IP_FORMAT',
          clientIP,
          message: 'Formato de IP inválido detectado'
        })
      };
    }

    console.log(`📋 Tipo de IP: ${ipType}`);

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
          clientIP,
          ipType,
          message: 'Acesso público habilitado'
        })
      };
    }

    // Verificar IPs hardcoded primeiro
    if (isHardcodedIP(clientIP)) {
      console.log('✅ IP encontrado na lista hardcoded');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: true,
          reason: 'HARDCODED_IP',
          clientIP,
          ipType,
          message: 'IP autorizado (hardcoded)'
        })
      };
    }

    // Verificar IPs do Firebase
    const firebaseIPs = await getFirebaseAllowedIPs();
    const normalizedClientIP = ipType === 'ipv6' ? normalizeIPv6(clientIP) : clientIP;
    
    const isFirebaseAllowed = firebaseIPs.some(allowedIP => {
      const normalizedAllowedIP = detectIPType(allowedIP) === 'ipv6' 
        ? normalizeIPv6(allowedIP) 
        : allowedIP;
      
      const match = normalizedClientIP === normalizedAllowedIP;
      if (match) {
        console.log(`✅ IP Firebase encontrado: ${clientIP} = ${allowedIP}`);
      }
      return match;
    });

    if (isFirebaseAllowed) {
      console.log('✅ IP encontrado no Firebase');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: true,
          reason: 'FIREBASE_IP',
          clientIP,
          ipType,
          message: 'IP autorizado (Firebase)'
        })
      };
    }

    // IP não autorizado
    console.log(`❌ IP não autorizado: ${clientIP}`);
    console.log(`📋 IPs hardcoded verificados: ${HARDCODED_IPS.join(', ')}`);
    console.log(`📋 IPs Firebase verificados: ${firebaseIPs.join(', ')}`);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        allowed: false,
        reason: 'IP_NOT_AUTHORIZED',
        clientIP,
        ipType,
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
        message: 'Erro interno na verificação de IP'
      })
    };
  }
};