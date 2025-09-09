import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useTranslation } from '../../utils/i18n';
import { clearVerificationState } from '../../utils/verificationStateManager';

const Login = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Pegar mensagem de sucesso do state (vinda do registro)
  const successMessage = location.state?.message;
  const prefilledEmail = location.state?.email;

  // Preencher email se veio do registro
  useState(() => {
    if (prefilledEmail && !email) {
      setEmail(prefilledEmail);
    }
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validateInputs = () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Por favor, preencha todos os campos.');
      return false;
    }
    if (!validateEmail(trimmedEmail)) {
      setError('Por favor, insira um email válido.');
      return false;
    }
    if (trimmedPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      
      if (!validateInputs()) {
        return;
      }

      setIsLoading(true);

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      await new Promise(resolve => setTimeout(resolve, 500));
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        trimmedPassword
      );

      const user = userCredential.user;
      if (!user) {
        throw new Error('No user data available');
      }

      // Clear any existing verification state for fresh login
      clearVerificationState(user.uid);

      setError('');
      navigate('/', { replace: true });
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      const errorMessages: { [key: string]: string } = {
        'auth/invalid-credential': 'Email ou senha incorretos. Por favor, verifique suas credenciais e tente novamente.',
        'auth/user-disabled': 'Esta conta foi desativada. Entre em contato com o suporte.',
        'auth/too-many-requests': 'Muitas tentativas de login. Por favor, aguarde alguns minutos e tente novamente.',
        'auth/network-request-failed': 'Erro de conexão. Verifique sua internet e tente novamente.',
        'auth/invalid-email': 'O formato do email é inválido.',
        'auth/user-not-found': 'Não existe uma conta com este email.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/popup-closed-by-user': 'O processo de login foi interrompido. Por favor, tente novamente.',
        'auth/operation-not-allowed': 'Este método de login não está habilitado. Entre em contato com o suporte.',
        'auth/requires-recent-login': 'Por favor, faça login novamente para continuar.',
      };

      setError(
        errorMessages[error.code] || 
        'Ocorreu um erro ao fazer login. Por favor, verifique suas credenciais e tente novamente.'
      );
      
    } finally {
      setIsLoading(false);
    }
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
          <h2 className="mt-6 text-3xl font-bold text-white">{t.login}</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {successMessage && (
            <div className="text-green-500 text-center bg-green-900/20 p-3 rounded-md border border-green-800">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="text-red-500 text-center bg-red-900/20 p-3 rounded-md border border-red-800">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t.email}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t.password}
                disabled={isLoading}
                minLength={6}
                autoComplete="current-password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 rounded-md text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Entrando...' : t.login}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <Link 
              to="/forgot-password" 
              className="text-sm text-blue-400 hover:text-blue-500"
              tabIndex={isLoading ? -1 : 0}
            >
              {t.forgotPassword}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;