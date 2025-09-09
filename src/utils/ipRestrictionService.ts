import { collection, addDoc, deleteDoc, doc, getDocs, setDoc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export interface AllowedIP {
  id: string;
  ip: string;
  description?: string;
  addedBy: string;
  addedAt: string;
  type: 'ipv4' | 'ipv6';
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
      await deleteDoc(doc(db, 'allowedIPs', ipId));
      console.log('✅ IP removido com sucesso:', ipId);
      
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
  static detectIPType(ip: string): 'ipv4' | 'ipv6' | 'invalid' {
    if (!ip) return 'invalid';
    
    const cleanIP = ip.trim();
    
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
  static validateIPFormat(ip: string): { valid: boolean; type?: 'ipv4' | 'ipv6'; error?: string } {
    const trimmedIP = ip.trim();
    
    if (!trimmedIP) {
      return { valid: false, error: 'IP não pode estar vazio' };
    }

    const type = this.detectIPType(trimmedIP);
    
    if (type === 'invalid') {
      return { 
        valid: false, 
        error: 'Formato de IP inválido. Exemplos válidos:\n• IPv4: 192.168.1.1\n• IPv6: 2001:db8::1, ::1, ou ::ffff:192.168.1.1' 
      };
    }

    return { valid: true, type };
  }
}