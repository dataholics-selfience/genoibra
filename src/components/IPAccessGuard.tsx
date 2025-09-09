import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Globe, Lock, Wifi, WifiOff } from 'lucide-react';
import { IPRestrictionService, IPVerificationResult } from '../utils/ipRestrictionService';

interface IPAccessGuardProps {
  children: React.ReactNode;
  onAccessDenied?: () => void;
}

const AccessDeniedPage = ({ result }: { result: IPVerificationResult }) => {
  const getReasonMessage = (reason: string) => {
    switch (reason) {
      case 'IP_NOT_DETECTED':
        return 'Não foi possível detectar seu endereço IP';
      case 'IP_NOT_AUTHORIZED':
        return 'Seu endereço IP não está autorizado';
      case 'INVALID_IP_FORMAT':
        return 'Formato de IP inválido detectado';
      case 'VERIFICATION_FAILED':
        return 'Falha na verificação de segurança';
      case 'NETWORK_ERROR':
        return 'Erro de conectividade';
      default:
        return 'Acesso negado por motivos de segurança';
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'NETWORK_ERROR':
        return <WifiOff size={64} className="text-red-400" />;
      case 'IP_NOT_DETECTED':
        return <Wifi size={64} className="text-yellow-400" />;
      default:
        return <Shield size={64} className="text-red-400" />;
    }
  };

  const handleContactSupport = () => {
    const message = encodeURIComponent(
      `Olá! Estou tentando acessar a plataforma Gen.OI mas meu IP não está autorizado.\n\nMeu IP: ${result.clientIP || 'Não detectado'}\nMotivo: ${getReasonMessage(result.reason)}\n\nPoderia me ajudar a liberar o acesso?`
    );
    const whatsappUrl = `https://wa.me/5511995736666?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 border border-red-800/50 shadow-2xl">
          {getReasonIcon(result.reason)}
          
          <h1 className="text-2xl font-bold text-white mt-6 mb-4">
            Acesso Restrito
          </h1>
          
          <p className="text-gray-300 mb-6 leading-relaxed">
            {getReasonMessage(result.reason)}
          </p>

          {result.clientIP && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Globe size={16} className="text-blue-400" />
                <span className="text-blue-200 font-medium">Seu IP:</span>
              </div>
              <code className="text-white font-mono text-lg">{result.clientIP}</code>
              {result.ipType && (
                <div className="text-xs text-gray-400 mt-1">
                  Tipo: {result.ipType.toUpperCase()}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleContactSupport}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Shield size={20} />
              Solicitar Acesso via WhatsApp
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={16} className="text-blue-400" />
                <span className="text-blue-200 font-medium text-sm">Segurança</span>
              </div>
              <p className="text-blue-100 text-xs leading-relaxed">
                Esta plataforma possui controle de acesso por IP para garantir a segurança dos dados. 
                Apenas endereços IP autorizados podem acessar o sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const IPAccessGuard = ({ children, onAccessDenied }: IPAccessGuardProps) => {
  const [verificationResult, setVerificationResult] = useState<IPVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const verifyAccess = async () => {
    try {
      setIsVerifying(true);
      console.log('🔐 Iniciando verificação de acesso por IP...');
      
      const result = await IPRestrictionService.verifyCurrentIP();
      setVerificationResult(result);
      
      if (!result.allowed) {
        console.log('❌ Acesso negado:', result);
        onAccessDenied?.();
      } else {
        console.log('✅ Acesso autorizado:', result);
      }
    } catch (error) {
      console.error('❌ Erro na verificação de acesso:', error);
      setVerificationResult({
        allowed: false,
        reason: 'VERIFICATION_ERROR',
        message: 'Erro ao verificar permissões de acesso'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifyAccess();
  }, []);

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mx-auto w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Verificando Acesso</h2>
          <p className="text-gray-400">Validando permissões de segurança...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (verificationResult && !verificationResult.allowed) {
    return <AccessDeniedPage result={verificationResult} />;
  }

  // Access granted
  return <>{children}</>;
};

export default IPAccessGuard;