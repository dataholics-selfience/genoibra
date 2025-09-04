/**
 * Utilitários para gerenciamento de mensagens no chat
 */

export const MESSAGE_DISPLAY_DELAY = 100;
export const SCROLL_DELAY = 50;

/**
 * Força a atualização da interface de mensagens
 */
export const forceMessageUpdate = (setterFunction: (fn: (prev: number) => number) => void) => {
  setterFunction(prev => prev + 1);
};

/**
 * Scroll suave para o final das mensagens com delay
 */
export const scrollToBottomWithDelay = (
  messagesEndRef: React.RefObject<HTMLDivElement>, 
  delay: number = SCROLL_DELAY
) => {
  setTimeout(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, delay);
};

/**
 * Verifica se uma mensagem contém botões especiais
 */
export const hasSpecialButtons = (content: string): boolean => {
  return content.includes('<startup-list-button>') || content.includes('<upgrade-plan-button>');
};

/**
 * Extrai o conteúdo antes dos botões especiais
 */
export const extractMessageContent = (content: string): string => {
  if (content.includes('<startup-list-button>')) {
    return content.split('<startup-list-button>')[0];
  }
  if (content.includes('<upgrade-plan-button>')) {
    return content.split('<upgrade-plan-button>')[0];
  }
  return content;
};

/**
 * Gera uma chave única para renderização de mensagens
 */
export const generateMessageKey = (messageId: string, timestamp: string, renderKey: number): string => {
  return `${messageId}-${timestamp}-${renderKey}`;
};