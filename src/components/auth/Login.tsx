import { MessageSquare } from 'lucide-react';

const Login = () => {
  const handleWhatsAppContact = () => {
    const message = encodeURIComponent('Olá! Gostaria de solicitar acesso à plataforma Gen.OI. Poderia me ajudar?');
    const whatsappUrl = `https://wa.me/5511995736666?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img 
            src="https://genoi.net/wp-content/uploads/2024/12/Logo-gen.OI-Novo-1-2048x1035.png" 
            alt="Genie Logo" 
            className="mx-auto h-24"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'fallback-logo.png';
            }}
          />
          <h2 className="mt-6 text-3xl font-bold text-white">Acesso Restrito</h2>
          <p className="mt-4 text-gray-400 text-lg">
            Esta é uma plataforma privada de inovação aberta.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Como obter acesso?</h3>
            <p className="text-gray-300 mb-6">
              Para acessar a plataforma Gen.OI, você precisa ser autorizado por um administrador. 
              Entre em contato conosco para solicitar seu acesso personalizado.
            </p>
            <button
              onClick={handleWhatsAppContact}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-lg"
            >
              Solicitar Acesso via WhatsApp
            </button>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
          <h4 className="text-blue-200 font-medium mb-2">💡 Informações Importantes</h4>
          <ul className="text-blue-100 text-sm space-y-1">
            <li>• Cada usuário recebe uma URL personalizada de login</li>
            <li>• O acesso é protegido por códigos de verificação por email</li>
            <li>• Apenas usuários autorizados podem criar contas</li>
            <li>• Entre em contato para solicitar seu acesso</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;