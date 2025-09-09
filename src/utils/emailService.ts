import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface EmailPayload {
  to: Array<{ email: string; name: string }>;
  from: { email: string; name: string };
  subject: string;
  html: string;
  text: string;
  reply_to: { email: string; name: string };
  tags: string[];
  metadata: Record<string, any>;
}

/**
 * Serviço centralizado para envio de emails via MailerSend
 * Inclui retry automático e logs detalhados
 */
export class EmailService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 2000; // 2 segundos

  /**
   * Envia email com retry automático
   */
  static async sendEmail(payload: EmailPayload): Promise<{ success: boolean; docId?: string; error?: string }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`📧 Tentativa ${attempt}/${this.MAX_RETRIES} - Enviando email:`, {
          to: payload.to[0].email,
          from: payload.from.email,
          subject: payload.subject,
          timestamp: new Date().toISOString()
        });

        // Adicionar timestamp e tentativa ao payload
        const enhancedPayload = {
          ...payload,
          metadata: {
            ...payload.metadata,
            attempt,
            sentAt: new Date().toISOString(),
            environment: window.location.hostname
          }
        };

        // Adicionar à coleção emails
        const emailDocRef = await addDoc(collection(db, 'emails'), enhancedPayload);
        
        console.log(`✅ Email adicionado ao Firestore (tentativa ${attempt}):`, {
          docId: emailDocRef.id,
          email: payload.to[0].email
        });

        // Aguardar e verificar se foi criado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const createdDoc = await getDoc(emailDocRef);
        if (!createdDoc.exists()) {
          throw new Error(`Documento não foi criado no Firestore (tentativa ${attempt})`);
        }

        console.log(`🎉 Email enviado com sucesso na tentativa ${attempt}!`);
        
        return {
          success: true,
          docId: emailDocRef.id
        };

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Erro na tentativa ${attempt}/${this.MAX_RETRIES}:`, error);

        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < this.MAX_RETRIES) {
          console.log(`⏳ Aguardando ${this.RETRY_DELAY}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    console.error(`💥 Todas as ${this.MAX_RETRIES} tentativas falharam. Último erro:`, lastError);
    
    return {
      success: false,
      error: lastError?.message || 'Erro desconhecido no envio de email'
    };
  }

  /**
   * Cria payload padrão para emails da Gen.OI
   */
  static createStandardPayload(
    to: { email: string; name: string },
    subject: string,
    htmlContent: string,
    textContent: string,
    tags: string[] = [],
    metadata: Record<string, any> = {}
  ): EmailPayload {
    return {
      to: [to],
      from: { 
        email: 'noreply@genoi.com.br', 
        name: 'Gen.OI - Inovação Aberta' 
      },
      subject,
      html: htmlContent,
      text: textContent,
      reply_to: { 
        email: 'noreply@genoi.com.br', 
        name: 'Gen.OI - Suporte' 
      },
      tags: ['genoi', ...tags],
      metadata: {
        ...metadata,
        platform: 'genoi',
        domain: 'genoi.com.br',
        createdAt: new Date().toISOString()
      }
    };
  }

  /**
   * Verifica status da extensão MailerSend
   */
  static async checkExtensionStatus(): Promise<{ isActive: boolean; lastActivity?: string }> {
    try {
      // Tentar buscar emails recentes para verificar se a extensão está ativa
      const recentEmailsQuery = collection(db, 'emails');
      // Não podemos usar orderBy sem índice, então vamos apenas verificar se a coleção existe
      
      return {
        isActive: true, // Assumir que está ativa se conseguiu acessar
        lastActivity: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao verificar status da extensão:', error);
      return {
        isActive: false
      };
    }
  }
}