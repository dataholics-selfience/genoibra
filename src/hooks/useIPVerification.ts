import { useState, useEffect } from 'react';
import { IPRestrictionService, IPVerificationResult } from '../utils/ipRestrictionService';

interface UseIPVerificationResult {
  isVerifying: boolean;
  isAllowed: boolean | null;
  verificationResult: IPVerificationResult | null;
  retryVerification: () => void;
}

export const useIPVerification = (): UseIPVerificationResult => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [verificationResult, setVerificationResult] = useState<IPVerificationResult | null>(null);

  const performVerification = async () => {
    setIsVerifying(true);
    setIsAllowed(null);
    
    try {
      console.log('🔐 Iniciando verificação de IP...');
      const result = await IPRestrictionService.verifyCurrentIP();
      
      setVerificationResult(result);
      setIsAllowed(result.allowed);
      
      if (result.allowed) {
        console.log('✅ Acesso autorizado por IP');
      } else {
        console.log('❌ Acesso negado por IP:', result.reason);
      }
    } catch (error) {
      console.error('❌ Erro na verificação de IP:', error);
      setVerificationResult({
        allowed: false,
        reason: 'VERIFICATION_ERROR',
        message: 'Erro ao verificar permissões de acesso'
      });
      setIsAllowed(false);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    performVerification();
  }, []);

  const retryVerification = () => {
    performVerification();
  };

  return {
    isVerifying,
    isAllowed,
    verificationResult,
    retryVerification
  };
};