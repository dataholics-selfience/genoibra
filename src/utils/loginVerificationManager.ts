import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

interface LoginVerification {
  id: string;
  userId: string;
  email: string;
  verificationCode: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'used' | 'expired';
  attempts: number;
  lastAttemptAt?: string;
}

/**
 * Verifica se o usuário tem uma verificação de login ativa e válida
 */
export async function hasActiveLoginVerification(userId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'loginVerifications'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }

    const verification = querySnapshot.docs[0].data() as LoginVerification;
    const now = new Date();
    const expiresAt = new Date(verification.expiresAt);
    
    // Check if verification is still valid
    if (now <= expiresAt) {
      return true;
    }

    // Mark as expired if time has passed
    await updateDoc(doc(db, 'loginVerifications', querySnapshot.docs[0].id), {
      status: 'expired'
    });

    return false;
  } catch (error) {
    console.error('Error checking active login verification:', error);
    return false;
  }
}

/**
 * Marca uma verificação como usada
 */
export async function markVerificationAsUsed(verificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'loginVerifications', verificationId), {
      status: 'used',
      verifiedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking verification as used:', error);
    throw error;
  }
}

/**
 * Obtém o número de tentativas de verificação do usuário nas últimas 24 horas
 */
export async function getUserVerificationAttempts(userId: string): Promise<number> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const q = query(
      collection(db, 'loginVerifications'),
      where('userId', '==', userId),
      where('createdAt', '>=', yesterday.toISOString())
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting user verification attempts:', error);
    return 0;
  }
}

/**
 * Limpa verificações expiradas do usuário
 */
export async function cleanupExpiredVerifications(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'loginVerifications'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    const now = new Date();

    const updatePromises = querySnapshot.docs
      .filter(doc => {
        const verification = doc.data() as LoginVerification;
        return now > new Date(verification.expiresAt);
      })
      .map(doc => 
        updateDoc(doc.ref, { status: 'expired' })
      );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error cleaning up expired verifications:', error);
  }
}