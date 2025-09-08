/**
 * Gerenciador de estado de verificação de login
 * Controla quando o usuário precisa passar pela verificação de segurança
 */

interface VerificationState {
  needsVerification: boolean;
  lastVerificationTime?: string;
  sessionId?: string;
}

const VERIFICATION_STORAGE_KEY = 'login_verification_state';
const VERIFICATION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Verifica se o usuário precisa de verificação de login
 */
export function needsLoginVerification(userId: string): boolean {
  try {
    const stored = localStorage.getItem(`${VERIFICATION_STORAGE_KEY}_${userId}`);
    
    if (!stored) {
      return true; // Primeira vez, precisa verificar
    }

    const state: VerificationState = JSON.parse(stored);
    
    if (!state.lastVerificationTime) {
      return true;
    }

    const lastVerification = new Date(state.lastVerificationTime);
    const now = new Date();
    const timeDiff = now.getTime() - lastVerification.getTime();

    // Se passou mais de 24 horas, precisa verificar novamente
    return timeDiff > VERIFICATION_DURATION;
  } catch (error) {
    console.error('Error checking verification state:', error);
    return true; // Em caso de erro, exigir verificação
  }
}

/**
 * Marca que o usuário foi verificado com sucesso
 */
export function markUserAsVerified(userId: string): void {
  try {
    const state: VerificationState = {
      needsVerification: false,
      lastVerificationTime: new Date().toISOString(),
      sessionId: crypto.randomUUID()
    };

    localStorage.setItem(`${VERIFICATION_STORAGE_KEY}_${userId}`, JSON.stringify(state));
  } catch (error) {
    console.error('Error marking user as verified:', error);
  }
}

/**
 * Limpa o estado de verificação (usado no logout)
 */
export function clearVerificationState(userId: string): void {
  try {
    localStorage.removeItem(`${VERIFICATION_STORAGE_KEY}_${userId}`);
  } catch (error) {
    console.error('Error clearing verification state:', error);
  }
}

/**
 * Força uma nova verificação (usado quando há suspeita de segurança)
 */
export function forceNewVerification(userId: string): void {
  try {
    clearVerificationState(userId);
  } catch (error) {
    console.error('Error forcing new verification:', error);
  }
}