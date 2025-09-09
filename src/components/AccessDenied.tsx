import { Shield, AlertTriangle, Globe, Lock, Wifi, WifiOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  reason?: string;
  clientIP?: string;
  ipType?: string;
  message?: string;
}

const AccessDenied = ({ 
  reason = 'IP_NOT_AUTHORIZED', 
  clientIP, 
  ipType, 
  message = 'Seu endereço IP não está autorizado a acessar esta plataforma' 
}: AccessDeniedProps) => {
  const navigate = useNavigate();

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
    const supportMessage = encodeURIComponent(
      `Olá! Estou tentando acessar a plataforma Gen.OI mas meu IP não está autorizado.\n\nMeu IP: ${clientIP || 'Não detectado'}\nMotivo: ${getReasonMessage(reason)}\n\nPoderia me ajudar a liberar o acesso?`
    );
    const whatsappUrl = `https://wa.me/5511995736666?text=${supportMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 border border-red-800/50 shadow-2xl">
          {getReasonIcon(reason)}
          
          <h1 className="text-2xl font-bold text-white mt-6 mb-4">
            Acesso Restrito
          </h1>
          
          <p className="text-gray-300 mb-6 leading-relaxed">
            {message || getReasonMessage(reason)}
          </p>

          {clientIP && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Globe size={16} className="text-blue-400" />
                <span className="text-blue-200 font-medium">Seu IP:</span>
              </div>
              <code className="text-white font-mono text-lg">{clientIP}</code>
              {ipType && (
                <div className="text-xs text-gray-400 mt-1">
                  Tipo: {ipType.toUpperCase()}
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
            
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={handleGoHome}
                className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft size={16} />
                Início
              </button>
            </div>
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

export default AccessDenied;