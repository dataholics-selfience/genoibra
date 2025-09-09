import { Handler } from '@netlify/functions';

interface AllowedIP {
  id: string;
  ip: string;
  description?: string;
  addedBy: string;
  addedAt: string;
  type: 'ipv4' | 'ipv6';
  active: boolean;
}

interface PublicAccessConfig {
  enabled: boolean;
  enabledBy?: string;
  enabledAt?: string;
  reason?: string;
}

// Função para detectar tipo de IP
function detectIPType(ip: string): 'ipv4' | 'ipv6' | 'invalid' {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  
  if (ipv4Pattern.test(ip)) {
    // Validar ranges IPv4
    const parts = ip.split('.').map(Number);
    if (parts.every(part => part >= 0 && part <= 255)) {
      return 'ipv4';
    }
  }
  
  if (ipv6Pattern.test(ip) || ip.includes('::')) {
    return 'ipv6';
  }
  
  return 'invalid';
}

// Função para normalizar IPv6
function normalizeIPv6(ip: string): string {
  // Simplificação básica - em produção usar biblioteca específica
  return ip.toLowerCase().replace(/^::ffff:/, ''); // Remove IPv4-mapped prefix
}

// Função para extrair IP real do request
function extractClientIP(headers: Record<string, string | undefined>): string {
  // Ordem de prioridade para headers de IP
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-cluster-client-ip',
    'forwarded'
  ];

  for (const header of ipHeaders) {
    const value = headers[header];
    if (value) {
      // x-forwarded-for pode conter múltiplos IPs separados por vírgula
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        return ip;
      }
    }
  }

  // Fallback para IP do Netlify
  return headers['x-nf-client-connection-ip'] || 'unknown';
}

export const handler: Handler = async (event, context) => {
  // Configurar CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Extrair IP do cliente
    const clientIP = extractClientIP(event.headers);
    
    console.log('🔍 Verificando acesso por IP:', {
      clientIP,
      headers: {
        'x-forwarded-for': event.headers['x-forwarded-for'],
        'x-real-ip': event.headers['x-real-ip'],
        'x-nf-client-connection-ip': event.headers['x-nf-client-connection-ip']
      }
    });

    if (clientIP === 'unknown') {
      console.log('❌ Não foi possível determinar o IP do cliente');
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: false,
          reason: 'IP_NOT_DETECTED',
          message: 'Não foi possível determinar seu endereço IP'
        })
      };
    }

    // Simular busca no Firebase (em produção, usar Firebase Admin SDK)
    // Por enquanto, vamos usar uma lista hardcoded para demonstração
    const allowedIPs: AllowedIP[] = [
      {
        id: '1',
        ip: '127.0.0.1',
        description: 'Localhost',
        addedBy: 'system',
        addedAt: new Date().toISOString(),
        type: 'ipv4',
        active: true
      },
      {
        id: '2',
        ip: '::1',
        description: 'IPv6 Localhost',
        addedBy: 'system',
        addedAt: new Date().toISOString(),
        type: 'ipv6',
        active: true
      }
    ];

    // Verificar configuração de acesso público
    const publicAccess: PublicAccessConfig = {
      enabled: false // Por padrão, acesso restrito
    };

    // Se acesso público está habilitado, permitir qualquer IP
    if (publicAccess.enabled) {
      console.log('🌍 Acesso público habilitado - permitindo qualquer IP');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: true,
          reason: 'PUBLIC_ACCESS_ENABLED',
          clientIP,
          message: 'Acesso público habilitado'
        })
      };
    }

    // Normalizar IP para comparação
    let normalizedClientIP = clientIP;
    const ipType = detectIPType(clientIP);
    
    if (ipType === 'ipv6') {
      normalizedClientIP = normalizeIPv6(clientIP);
    } else if (ipType === 'invalid') {
      console.log('❌ Formato de IP inválido:', clientIP);
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: false,
          reason: 'INVALID_IP_FORMAT',
          clientIP,
          message: 'Formato de IP inválido'
        })
      };
    }

    // Verificar se IP está na lista de permitidos
    const isAllowed = allowedIPs.some(allowedIP => {
      if (!allowedIP.active) return false;
      
      let normalizedAllowedIP = allowedIP.ip;
      if (allowedIP.type === 'ipv6') {
        normalizedAllowedIP = normalizeIPv6(allowedIP.ip);
      }
      
      return normalizedAllowedIP === normalizedClientIP;
    });

    if (isAllowed) {
      console.log('✅ IP autorizado:', clientIP);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: true,
          reason: 'IP_AUTHORIZED',
          clientIP,
          ipType,
          message: 'Acesso autorizado'
        })
      };
    } else {
      console.log('❌ IP não autorizado:', clientIP);
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          allowed: false,
          reason: 'IP_NOT_AUTHORIZED',
          clientIP,
          ipType,
          message: 'Seu endereço IP não está autorizado a acessar esta plataforma'
        })
      };
    }

  } catch (error) {
    console.error('❌ Erro na verificação de IP:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        allowed: false,
        reason: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor'
      })
    };
  }
};