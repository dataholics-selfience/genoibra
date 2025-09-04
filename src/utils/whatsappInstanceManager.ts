import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Configuração das instâncias da Evolution API
export const EVOLUTION_INSTANCES = [
  {
    id: 1,
    instanceKey: '215D70C6CC83-4EE4-B55A-DE7D4146CBF1',
    name: 'Instância 1'
  },
  {
    id: 2,
    instanceKey: 'CDE0592169A6-46D4-94CA-1C1F98E0598D',
    name: 'Instância 2'
  },
  {
    id: 3,
    instanceKey: '1A9C5557C2EA-479C-B3C5-E7CFD84553EB',
    name: 'Instância 3'
  }
];

export const EVOLUTION_API_CONFIG = {
  baseUrl: 'https://evolution-api-production-f719.up.railway.app'
};

interface StartupInstanceMapping {
  startupId: string;
  instanceId: number;
  instanceKey: string;
  assignedAt: string;
  userId: string;
}

interface UserInstanceCounter {
  userId: string;
  lastUsedInstance: number;
  updatedAt: string;
}

/**
 * Verifica se é a primeira mensagem WhatsApp do usuário para uma startup
 */
async function isFirstWhatsAppMessage(startupId: string, userId: string): Promise<boolean> {
  try {
    console.log(`🔍 Verificando se é primeira mensagem WhatsApp para startup: ${startupId}, usuário: ${userId}`);

    const q = query(
      collection(db, 'crmMessages'),
      where('startupId', '==', startupId),
      where('userId', '==', userId),
      where('messageType', '==', 'whatsapp')
    );

    const querySnapshot = await getDocs(q);
    const isFirst = querySnapshot.empty;

    console.log(`${isFirst ? '🆕' : '🔄'} ${isFirst ? 'Primeira' : 'Mensagem subsequente'} mensagem WhatsApp para esta startup`);
    
    return isFirst;
  } catch (error) {
    console.error('Erro ao verificar primeira mensagem:', error);
    // Em caso de erro, assumir que é primeira mensagem para garantir o complemento
    return true;
  }
}

/**
 * Obtém a próxima instância em sequência para um usuário
 */
async function getNextInstanceForUser(userId: string): Promise<number> {
  try {
    const counterDoc = await getDoc(doc(db, 'userInstanceCounters', userId));
    
    if (!counterDoc.exists()) {
      // Primeiro uso do usuário - começar com instância 1
      await setDoc(doc(db, 'userInstanceCounters', userId), {
        userId,
        lastUsedInstance: 1,
        updatedAt: new Date().toISOString()
      });
      return 1;
    }

    const data = counterDoc.data() as UserInstanceCounter;
    const nextInstance = (data.lastUsedInstance % 3) + 1; // Sequência: 1, 2, 3, 1, 2, 3...

    // Atualizar contador
    await setDoc(doc(db, 'userInstanceCounters', userId), {
      userId,
      lastUsedInstance: nextInstance,
      updatedAt: new Date().toISOString()
    });

    return nextInstance;
  } catch (error) {
    console.error('Erro ao obter próxima instância:', error);
    // Em caso de erro, retornar instância 1 como fallback
    return 1;
  }
}

/**
 * Obtém ou atribui uma instância para uma startup específica
 */
export async function getInstanceForStartup(startupId: string, userId: string): Promise<{
  instanceId: number;
  instanceKey: string;
  isNewAssignment: boolean;
}> {
  try {
    console.log(`🔍 Buscando instância para startup: ${startupId}, usuário: ${userId}`);

    // Verificar se já existe uma instância atribuída para esta startup
    const q = query(
      collection(db, 'startupInstanceMappings'),
      where('startupId', '==', startupId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Startup já tem instância atribuída
      const mapping = querySnapshot.docs[0].data() as StartupInstanceMapping;
      const instance = EVOLUTION_INSTANCES.find(inst => inst.id === mapping.instanceId);
      
      if (instance) {
        console.log(`✅ Instância existente encontrada: ${instance.name} (${instance.instanceKey})`);
        return {
          instanceId: mapping.instanceId,
          instanceKey: mapping.instanceKey,
          isNewAssignment: false
        };
      }
    }

    // Startup não tem instância - atribuir próxima em sequência
    const nextInstanceId = await getNextInstanceForUser(userId);
    const instance = EVOLUTION_INSTANCES.find(inst => inst.id === nextInstanceId);
    
    if (!instance) {
      throw new Error(`Instância ${nextInstanceId} não encontrada`);
    }

    // Salvar mapeamento
    const mappingId = `${startupId}_${userId}`;
    await setDoc(doc(db, 'startupInstanceMappings', mappingId), {
      startupId,
      instanceId: instance.id,
      instanceKey: instance.instanceKey,
      assignedAt: new Date().toISOString(),
      userId
    });

    console.log(`🆕 Nova instância atribuída: ${instance.name} (${instance.instanceKey}) para startup ${startupId}`);

    return {
      instanceId: instance.id,
      instanceKey: instance.instanceKey,
      isNewAssignment: true
    };

  } catch (error) {
    console.error('Erro ao obter instância para startup:', error);
    
    // Fallback para instância 1 em caso de erro
    const fallbackInstance = EVOLUTION_INSTANCES[0];
    return {
      instanceId: fallbackInstance.id,
      instanceKey: fallbackInstance.instanceKey,
      isNewAssignment: false
    };
  }
}

/**
 * Envia mensagem WhatsApp usando a instância correta para a startup
 */
export async function sendWhatsAppMessage(
  startupId: string,
  userId: string,
  phoneNumber: string,
  message: string,
  senderCompany?: string,
  startupName?: string
): Promise<{
  success: boolean;
  instanceUsed?: string;
  error?: string;
  response?: any;
  isFirstMessage?: boolean;
}> {
  try {
    console.log(`📱 Iniciando envio de WhatsApp para startup: ${startupId}`);

    // Verificar se é primeira mensagem
    const isFirst = await isFirstWhatsAppMessage(startupId, userId);

    // Obter instância para esta startup
    const { instanceKey, isNewAssignment } = await getInstanceForStartup(startupId, userId);
    
    console.log(`📡 Usando instância: ${instanceKey} ${isNewAssignment ? '(nova atribuição)' : '(existente)'}`);

    // Preparar mensagem final
    let finalMessage = message;
    
    // Adicionar complemento apenas na primeira mensagem
    if (isFirst && senderCompany && startupName) {
      finalMessage += `\n\nMensagem enviada pela genoi.net pelo cliente ${senderCompany} para a ${startupName}`;
      console.log(`📝 Complemento adicionado à primeira mensagem para ${startupName}`);
    } else if (!isFirst) {
      console.log(`📝 Mensagem subsequente - sem complemento`);
    }

    // Payload para Evolution API
    const payload = {
      number: phoneNumber,
      text: finalMessage
    };

    console.log(`🚀 Enviando mensagem via Evolution API:`, {
      url: `${EVOLUTION_API_CONFIG.baseUrl}/message/sendText/${instanceKey}`,
      isFirstMessage: isFirst,
      hasComplement: isFirst && senderCompany && startupName
    });

    // Enviar via Evolution API
    const response = await fetch(
      `${EVOLUTION_API_CONFIG.baseUrl}/message/sendText/${instanceKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': instanceKey
        },
        body: JSON.stringify(payload)
      }
    );

    if (response.ok) {
      const responseData = await response.json();
      console.log(`✅ WhatsApp enviado com sucesso via instância ${instanceKey}:`, responseData);
      
      return {
        success: true,
        instanceUsed: instanceKey,
        response: responseData,
        isFirstMessage: isFirst
      };
    } else {
      const errorText = await response.text();
      console.error(`❌ Erro na Evolution API (${instanceKey}):`, errorText);
      
      return {
        success: false,
        error: `Erro na Evolution API: ${response.status} - ${errorText}`,
        instanceUsed: instanceKey,
        isFirstMessage: isFirst
      };
    }

  } catch (error) {
    console.error('❌ Erro geral no envio de WhatsApp:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Obtém estatísticas de uso das instâncias
 */
export async function getInstanceUsageStats(): Promise<{
  totalMappings: number;
  instanceDistribution: Record<number, number>;
  recentMappings: StartupInstanceMapping[];
}> {
  try {
    const q = query(collection(db, 'startupInstanceMappings'));
    const querySnapshot = await getDocs(q);
    
    const mappings = querySnapshot.docs.map(doc => doc.data() as StartupInstanceMapping);
    
    // Contar distribuição por instância
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    mappings.forEach(mapping => {
      distribution[mapping.instanceId] = (distribution[mapping.instanceId] || 0) + 1;
    });

    // Pegar os 10 mapeamentos mais recentes
    const recentMappings = mappings
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
      .slice(0, 10);

    return {
      totalMappings: mappings.length,
      instanceDistribution: distribution,
      recentMappings
    };

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return {
      totalMappings: 0,
      instanceDistribution: { 1: 0, 2: 0, 3: 0 },
      recentMappings: []
    };
  }
}

/**
 * Remove mapeamento de instância para uma startup (para testes)
 */
export async function removeStartupInstanceMapping(startupId: string, userId: string): Promise<boolean> {
  try {
    const mappingId = `${startupId}_${userId}`;
    await setDoc(doc(db, 'startupInstanceMappings', mappingId), {
      deleted: true,
      deletedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log(`🗑️ Mapeamento removido para startup: ${startupId}`);
    return true;
  } catch (error) {
    console.error('Erro ao remover mapeamento:', error);
    return false;
  }
}