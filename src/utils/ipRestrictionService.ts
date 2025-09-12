import { collection, addDoc, deleteDoc, doc, getDocs, setDoc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export interface AllowedIP {
  id: string;
  ip: string;
  description?: string;
  addedBy: string;
  addedAt: string;
  type: 'ipv4' | 'ipv6' | 'ipv4_range' | 'ipv6_range';
  active: boolean;
}

export interface PublicAccessConfig {
  enabled: boolean;
  enabledBy?: string;
  enabledAt?: string;
  reason?: string;
}

export interface IPVerificationResult {
  allowed: boolean;
  reason: string;
  clientIP?: string;
  ipType?: string;
  allDetectedIPs?: string[];
  matchedIP?: string;
  availableHardcodedIPs?: string[];
  availableFirebaseIPs?: string[];
  message: string;
}

/**
 * Serviço para gerenciamento de restrições de IP
 */
export class IPRestrictionService {
  
  /**
   * Verifica se o IP atual está autorizado
   */
  static async verifyCurrentIP(): Promise<IPVerificationResult> {
    try {
      console.log('🔍 Verificando IP atual via Netlify Function...');
      
      const response = await fetch('/.netlify/functions/verify-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // In development, if function is not available, allow access
        if (import.meta.env.DEV && response.status === 404) {
          console.warn('⚠️ Desenvolvimento: Netlify Function não disponível, permitindo acesso');
          return {
            allowed: true,
            reason: 'DEVELOPMENT_MODE',
            clientIP: 'localhost',
            message: 'Desenvolvimento local - verificação de IP desabilitada'
          };
        }
        
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na verificação de IP:', response.status, errorData);
        
        return {
          allowed: false,
          reason: 'VERIFICATION_FAILED',
          message: errorData.message || 'Falha na verificação de IP'
        };
      }

      const result = await response.json();
      console.log('✅ Resultado da verificação de IP:', {
        allowed: result.allowed,
        reason: result.reason,
        clientIP: result.clientIP,
        ipType: result.ipType,
        allDetectedIPs: result.allDetectedIPs,
        matchedIP: result.matchedIP,
        debug: result.debug
      });
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao verificar IP:', error);
      return {
        allowed: false,
        reason: 'NETWORK_ERROR',
        message: 'Erro de rede ao verificar IP'
      };
    }
  }

  /**
   * Busca todos os IPs permitidos
   */
  static async getAllowedIPs(): Promise<AllowedIP[]> {
    try {
      console.log('📋 Buscando IPs permitidos...');
      const q = query(
        collection(db, 'allowedIPs'),
        orderBy('addedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const ips = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AllowedIP[];
      
      console.log(`✅ IPs carregados: ${ips.length}`);
      ips.forEach((ip, index) => {
        console.log(`  ${index + 1}. ${ip.ip} (${ip.type}) - ${ip.description}`);
      });
      
      return ips;
    } catch (error) {
      console.error('Erro ao buscar IPs permitidos:', error);
      return [];
    }
  }

  /**
   * Adiciona um novo IP à lista de permitidos
   */
  static async addAllowedIP(
    ip: string, 
    description: string, 
    addedBy: string
  ): Promise<{ success: boolean; error?: string; ipData?: AllowedIP }> {
    try {
      console.log(`➕ Tentando adicionar IP: ${ip.trim()}`);
      
      // Validar formato do IP
      const ipType = this.detectIPType(ip);
      console.log(`🔍 Tipo detectado: ${ipType}`);
      
      if (ipType === 'invalid') {
        console.log(`❌ IP inválido: ${ip}`);
        return {
          success: false,
          error: 'Formato de IP inválido. Use IPv4 (ex: 192.168.1.1) ou IPv6 (ex: 2001:db8::1)'
        };
      }

      // Verificar se IP já existe
      console.log('🔍 Verificando se IP já existe...');
      const existingQuery = query(
        collection(db, 'allowedIPs'),
        where('ip', '==', ip.trim())
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        console.log(`⚠️ IP já existe: ${ip.trim()}`);
        return {
          success: false,
          error: 'Este IP já está cadastrado na lista de permitidos'
        };
      }

      // Adicionar novo IP
      console.log('💾 Salvando IP no Firebase...');
      const ipData: Omit<AllowedIP, 'id'> = {
        ip: ip.trim(),
        description: description.trim(),
        addedBy,
        addedAt: new Date().toISOString(),
        type: ipType,
        active: true
      };

      const docRef = await addDoc(collection(db, 'allowedIPs'), ipData);
      
      console.log('✅ IP adicionado com sucesso:', { 
        id: docRef.id, 
        ip: ip.trim(), 
        type: ipType,
        description: description.trim()
      });
      
      return {
        success: true,
        ipData: { id: docRef.id, ...ipData }
      };
    } catch (error) {
      console.error('Erro ao adicionar IP:', error);
      return {
        success: false,
        error: 'Erro interno ao adicionar IP'
      };
    }
  }

  /**
   * Remove um IP da lista de permitidos
   */
  static async removeAllowedIP(ipId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🗑️ Iniciando remoção do IP com ID: ${ipId}`);
      
      // Verificar se o documento existe antes de deletar
      const docRef = doc(db, 'allowedIPs', ipId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log(`⚠️ Documento não encontrado: ${ipId}`);
        return {
          success: false,
          error: 'IP não encontrado na base de dados'
        };
      }
      
      const ipData = docSnap.data();
      console.log(`📄 Documento encontrado:`, { id: ipId, ip: ipData.ip, description: ipData.description });
      
      await deleteDoc(doc(db, 'allowedIPs', ipId));
      
      console.log(`✅ IP removido com sucesso:`, { id: ipId, ip: ipData.ip });
      
      // Aguardar um pouco para garantir que a exclusão foi processada
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar se realmente foi deletado
      const verifyDoc = await getDoc(docRef);
      if (verifyDoc.exists()) {
        console.error(`❌ ERRO: Documento ainda existe após exclusão!`);
        return {
          success: false,
          error: 'Falha na exclusão - documento ainda existe'
        };
      }
      
      console.log(`✅ Exclusão confirmada - documento não existe mais`);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao remover IP:', error);
      return {
        success: false,
        error: 'Erro interno ao remover IP'
      };
    }
  }

  /**
   * Obtém configuração de acesso público
   */
  static async getPublicAccessConfig(): Promise<PublicAccessConfig> {
    try {
      const configDoc = await getDoc(doc(db, 'systemConfig', 'publicAccess'));
      if (configDoc.exists()) {
        return configDoc.data() as PublicAccessConfig;
      }
      
      // Configuração padrão
      return { enabled: false };
    } catch (error) {
      console.error('Erro ao buscar configuração de acesso público:', error);
      return { enabled: false };
    }
  }

  /**
   * Atualiza configuração de acesso público
   */
  static async updatePublicAccess(
    enabled: boolean, 
    enabledBy: string, 
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const config: PublicAccessConfig = {
        enabled,
        enabledBy,
        enabledAt: new Date().toISOString(),
        reason: reason || ''
      };

      await setDoc(doc(db, 'systemConfig', 'publicAccess'), config);
      
      console.log('✅ Configuração de acesso público atualizada:', config);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar acesso público:', error);
      return {
        success: false,
        error: 'Erro interno ao atualizar configuração'
      };
    }
  }

  /**
   * Detecta tipo de IP
   */
  private static detectIPType(ip: string): 'ipv4' | 'ipv6' | 'ipv4_range' | 'ipv6_range' | 'invalid' {
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
    
    // IPv4 pattern
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = cleanIP.match(ipv4Pattern);
    
    if (ipv4Match) {
      // Validar ranges IPv4
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
   * Valida formato de IP
   */
  static validateIPFormat(ip: string): { valid: boolean; type?: 'ipv4' | 'ipv6' | 'ipv4_range' | 'ipv6_range'; error?: string } {
    const trimmedIP = ip.trim();
    
    if (!trimmedIP) {
      return { valid: false, error: 'IP não pode estar vazio' };
    }

    const type = this.detectIPType(trimmedIP);
    
    if (type === 'invalid') {
      return { 
        valid: false, 
        error: 'Formato de IP inválido. Exemplos válidos:\n• IPv4: 192.168.1.1\n• IPv6: 2001:db8::1, ::1\n• Range IPv4: 192.168.1.0/24\n• Range IPv6: 2001:db8::/32' 
      };
    }

    return { valid: true, type };
  }

  /**
   * Verifica se um IP está dentro de um range CIDR
   */
  static isIPInRange(ip: string, range: string): boolean {
    if (!range.includes('/')) {
      // Se não é um range, fazer comparação direta
      return ip === range;
    }

    const [rangeIP, prefixStr] = range.split('/');
    const prefix = parseInt(prefixStr);

    // IPv4 range check
    if (this.detectIPType(ip) === 'ipv4' && this.detectIPType(rangeIP) === 'ipv4') {
      return this.isIPv4InRange(ip, rangeIP, prefix);
    }

    // IPv6 range check
    if (this.detectIPType(ip) === 'ipv6' && this.detectIPType(rangeIP) === 'ipv6') {
      return this.isIPv6InRange(ip, rangeIP, prefix);
    }

    return false;
  }

  /**
   * Verifica se um IPv4 está dentro de um range CIDR
   */
  private static isIPv4InRange(ip: string, rangeIP: string, prefix: number): boolean {
    const ipToNumber = (ipStr: string): number => {
      const parts = ipStr.split('.').map(Number);
      return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
    };

    const ipNum = ipToNumber(ip);
    const rangeNum = ipToNumber(rangeIP);
    const mask = ~((1 << (32 - prefix)) - 1);

    return (ipNum & mask) === (rangeNum & mask);
  }

  /**
   * Verifica se um IPv6 está dentro de um range CIDR (implementação simplificada)
   */
  private static isIPv6InRange(ip: string, rangeIP: string, prefix: number): boolean {
    // Para IPv6, implementação simplificada
    // Em produção, seria recomendado usar uma biblioteca especializada
    
    // Normalizar ambos os IPs
    const normalizeIPv6 = (ipv6: string): string => {
      // Expandir :: para zeros completos
      if (ipv6.includes('::')) {
        const parts = ipv6.split('::');
        const leftParts = parts[0] ? parts[0].split(':').filter(p => p !== '') : [];
        const rightParts = parts[1] ? parts[1].split(':').filter(p => p !== '') : [];
        const missingParts = 8 - leftParts.length - rightParts.length;
        
        if (missingParts > 0) {
          const middleParts = Array(missingParts).fill('0000');
          const allParts = [...leftParts, ...middleParts, ...rightParts];
          return allParts.map(part => part.padStart(4, '0')).join(':');
        }
      }
      
      // Normalizar cada parte para 4 dígitos
      const parts = ipv6.split(':');
      if (parts.length === 8) {
        return parts.map(part => part.padStart(4, '0')).join(':');
      }
      
      return ipv6;
    };

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
}