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
      
      // In development, skip IP verification if Netlify Functions are not available
      if (import.meta.env.DEV) {
        console.warn('⚠️ Desenvolvimento: Verificação de IP desabilitada');
        return {
          allowed: true,
          ip: 'localhost',
          reason: 'Desenvolvimento local'
        };
      }

      const response = await fetch('/.netlify/functions/verify-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na verificação de IP:', response.status, errorData);
        
        return {
          allowed: false,
          reason: 'VERIFICATION_FAILED',
          message: errorData.message || 'Falha na verificação de IP'
        };
      }

      const result = await response.json();
      console.log('✅ Resultado da verificação de IP:', result);
      
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
      const q = query(
        collection(db, 'allowedIPs'),
        orderBy('addedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AllowedIP[];
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
      // Validar formato do IP
      const ipType = this.detectIPType(ip);
      if (ipType === 'invalid') {
        return {
          success: false,
          error: 'Formato de IP inválido. Use IPv4 (ex: 192.168.1.1) ou IPv6 (ex: 2001:db8::1)'
        };
      }

      // Verificar se IP já existe
      const existingQuery = query(
        collection(db, 'allowedIPs'),
        where('ip', '==', ip.trim())
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        return {
          success: false,
          error: 'Este IP já está cadastrado na lista de permitidos'
        };
      }

      // Adicionar novo IP
      const ipData: Omit<AllowedIP, 'id'> = {
        ip: ip.trim(),
        description: description.trim(),
        addedBy,
        addedAt: new Date().toISOString(),
        type: ipType,
        active: true
      };

      const docRef = await addDoc(collection(db, 'allowedIPs'), ipData);
      
      console.log('✅ IP adicionado com sucesso:', { id: docRef.id, ip: ip.trim() });
      
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
  private static detectIPType(ip: string): 'ipv4' | 'ipv6' | 'invalid' {
    // IPv4 pattern
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^([0-9a-fA-F]{1,4}:){1,7}:$|^:([0-9a-fA-F]{1,4}:){1,7}$/;
    
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
        error: 'Formato de IP inválido. Exemplos válidos:\n• IPv4: 192.168.1.1\n• IPv6: 2001:db8::1 ou ::1' 
      };
    }

    return { valid: true, type };
  }
}