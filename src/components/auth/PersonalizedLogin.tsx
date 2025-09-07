import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { ArrowLeft, Mail, Clock, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

interface LoginToken {
  id: string;
  userId: string;
  email: string;
  loginSlug: string;
  verificationCode: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'used' | 'expired';
  verified: boolean;
}

interface UserData {
  uid: string;
  email: string;
  name: string;
  loginSlug: string;
  disabled?: boolean;
}

const PersonalizedLogin = () => {
  const { loginSlug } = useParams<{ loginSlug: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [formData, setFormData] = useState({
    password: '',
    verificationCode: ''
  });

  // Countdown timer for code expiration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCodeSent(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    validateLoginSlug();
  }, [loginSlug]);

  const validateLoginSlug = async () => {
    if (!loginSlug) {
      setError('URL de login inválida');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Validando slug de login:', loginSlug);

      // Buscar usuário pelo loginSlug
      const q = query(
        collection(db, 'users'),
        where('loginSlug', '==', loginSlug)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('❌ Usuário não encontrado para slug:', loginSlug);
        setError('URL de login não encontrada ou inválida');
        setLoading(false);
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const user = { ...userDoc.data() } as UserData;
      
      // Verificar se conta está desabilitada
      if (user.disabled) {
        console.log('🚫 Conta desabilitada:', user.email);
        setError('Esta conta foi desativada. Entre em contato com o administrador.');
        setLoading(false);
        return;
      }

      console.log('✅ Usuário encontrado:', { email: user.email, slug: user.loginSlug });
      setUserData(user);
      setError('');
      
    } catch (error) {
      console.error('Error validating login slug:', error);
      setError('Erro ao validar URL de login');
    } finally {
      setLoading(false);
    }
  };

  const generateVerificationCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const sendVerificationCode = async () => {
    if (!userData || sendingCode) return;

    setSendingCode(true);
    setError('');

    try {
      const verificationCode = generateVerificationCode();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutos

      console.log('📧 Enviando código de verificação:', { email: userData.email, code: verificationCode });

      // Salvar código no Firestore
      const loginTokenData = {
        userId: userData.uid,
        email: userData.email,
        loginSlug: loginSlug!,
        verificationCode,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'active' as const,
        verified: false
      };

      await addDoc(collection(db, 'loginTokens'), loginTokenData);

      // Enviar email com código
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Login - Gen.OI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <img src="https://genoi.net/wp-content/uploads/2024/12/Logo-gen.OI-Novo-1-2048x1035.png" alt="Gen.OI" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Gen.OI - Código de Login</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Código de Verificação para Login</h2>
              <p style="margin-bottom: 25px;">
                Você solicitou acesso à sua conta Gen.OI. Use o código abaixo para completar seu login:
              </p>
              
              <div style="background: #f0f8ff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                <h3 style="color: #667eea; margin: 0 0 10px 0;">Seu Código de Login:</h3>
                <div style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 4px; font-family: monospace;">
                  ${verificationCode}
                </div>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Importante:</strong> Este código expira em 3 minutos. 
                  Se não conseguir usar a tempo, solicite um novo código.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
              <div style="font-size: 14px; color: #666;">
                <p style="color: #d32f2f; font-weight: bold;">
                  Atenção: Este e-mail é confidencial e não pode ser encaminhado externamente nem para outros usuários do banco ou do Habitat.
                </p>
              </div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>Esta mensagem foi enviada através da plataforma Gen.OI de inovação aberta.</p>
          </div>
        </body>
        </html>
      `;

      const emailPayload = {
        to: [{ 
          email: userData.email, 
          name: userData.email.split('@')[0] 
        }],
        from: { 
          email: 'contact@genoi.com.br', 
          name: 'Gen.OI - Código de Login' 
        },
        subject: `Código de Login Gen.OI: ${verificationCode}`,
        html: emailHtml,
        text: `Seu código de login Gen.OI: ${verificationCode}\n\nEste código expira em 3 minutos.`,
        reply_to: { 
          email: 'contact@genoi.net', 
          name: 'Gen.OI - Suporte' 
        },
        tags: ['auth', 'login-code'],
        metadata: { 
          userId: userData.uid,
          verificationCode,
          loginSlug: loginSlug!,
          loginAttempt: true
        }
      };

      console.log('Enviando email com código de login:', { email: userData.email, code: verificationCode });
      await addDoc(collection(db, 'emails'), emailPayload);

      setCodeSent(true);
      setCountdown(180); // 3 minutos
      setSuccess('Código enviado! Verifique seu email.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Error sending verification code:', error);
      setError('Erro ao enviar código de verificação. Tente novamente.');
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCodeAndLogin = async () => {
    if (!userData || !formData.verificationCode.trim() || !formData.password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setVerifyingCode(true);
    setError('');

    try {
      // Buscar código ativo mais recente para este usuário
      const q = query(
        collection(db, 'loginTokens'),
        where('userId', '==', userData.uid),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Nenhum código ativo encontrado. Solicite um novo código.');
        setVerifyingCode(false);
        return;
      }

      // Pegar o código mais recente
      const loginTokens = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LoginToken[];
      
      const latestToken = loginTokens.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      // Verificar se código expirou
      const now = new Date();
      const expiresAt = new Date(latestToken.expiresAt);
      
      if (now > expiresAt) {
        setError('Código expirado. Solicite um novo código.');
        setCodeSent(false);
        setCountdown(0);
        setVerifyingCode(false);
        return;
      }

      // Verificar se código está correto
      if (formData.verificationCode.toUpperCase() !== latestToken.verificationCode) {
        setError('Código de verificação incorreto.');
        setVerifyingCode(false);
        return;
      }

      console.log('✅ Código verificado com sucesso, tentando login...');

      // Código correto - tentar fazer login
      setLoggingIn(true);
      
      try {
        await signInWithEmailAndPassword(auth, userData.email, formData.password);
        
        // Marcar código como usado
        await addDoc(collection(db, 'loginTokens'), {
          ...latestToken,
          status: 'used',
          verified: true,
          usedAt: new Date().toISOString()
        });

        console.log('🎉 Login realizado com sucesso!');
        navigate('/', { replace: true });
        
      } catch (loginError: any) {
        console.error('Login error:', loginError);
        
        const errorMessages: { [key: string]: string } = {
          'auth/invalid-credential': 'Senha incorreta. Por favor, verifique sua senha.',
          'auth/user-disabled': 'Esta conta foi desativada. Entre em contato com o suporte.',
          'auth/too-many-requests': 'Muitas tentativas de login. Aguarde alguns minutos.',
          'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
          'auth/user-not-found': 'Usuário não encontrado.',
          'auth/wrong-password': 'Senha incorreta.',
        };

        setError(
          errorMessages[loginError.code] || 
          'Erro ao fazer login. Verifique sua senha e tente novamente.'
        );
      }
      
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setVerifyingCode(false);
      setLoggingIn(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Validando acesso...</div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-900/50 text-red-200 p-6 rounded-lg border border-red-800">
            <AlertTriangle size={64} className="mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 mx-auto text-blue-400 hover:text-blue-300"
            >
              <ArrowLeft size={16} />
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-300 hover:text-white mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">Login Personalizado</h1>
        </div>

        {userData && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={24} className="text-blue-400" />
              <div>
                <h3 className="text-white font-medium">Acesso Autorizado</h3>
                <p className="text-gray-400 text-sm">{userData.email}</p>
              </div>
            </div>
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3">
              <p className="text-blue-100 text-sm">
                Esta é sua URL personalizada de login. Mantenha-a segura e não compartilhe com terceiros.
              </p>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center mb-6">
            <img 
              src="https://genoi.net/wp-content/uploads/2024/12/Logo-gen.OI-Novo-1-2048x1035.png" 
              alt="Genie Logo" 
              className="mx-auto h-16 mb-4"
            />
            <h2 className="text-xl font-bold text-white">Fazer Login</h2>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-900/50 border border-red-600 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-3">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-900/50 border border-green-600 text-green-200 p-4 rounded-lg mb-6 flex items-center gap-3">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Email (locked) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={userData?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite sua senha"
                disabled={loggingIn}
              />
            </div>

            {/* Send Code Button */}
            {!codeSent ? (
              <button
                onClick={sendVerificationCode}
                disabled={sendingCode || !formData.password.trim()}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  sendingCode || !formData.password.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {sendingCode ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    Enviando código...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Mail size={20} />
                    Enviar Código por Email
                  </div>
                )}
              </button>
            ) : (
              <>
                {/* Verification Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Código de Verificação *
                    {countdown > 0 && (
                      <span className="text-yellow-400 ml-2">
                        (Expira em {formatTime(countdown)})
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="verificationCode"
                    value={formData.verificationCode}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="XXXXXX"
                    maxLength={6}
                    disabled={verifyingCode || loggingIn}
                  />
                </div>

                {/* Login Button */}
                <button
                  onClick={verifyCodeAndLogin}
                  disabled={verifyingCode || loggingIn || !formData.verificationCode.trim() || !formData.password.trim()}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    verifyingCode || loggingIn || !formData.verificationCode.trim() || !formData.password.trim()
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {verifyingCode ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      Verificando código...
                    </div>
                  ) : loggingIn ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      Fazendo login...
                    </div>
                  ) : (
                    'Entrar'
                  )}
                </button>

                {/* Request New Code */}
                {countdown === 0 && (
                  <button
                    onClick={() => {
                      setCodeSent(false);
                      setFormData(prev => ({ ...prev, verificationCode: '' }));
                    }}
                    className="w-full py-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                  >
                    Solicitar novo código
                  </button>
                )}
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-blue-400" />
                <span className="text-blue-200 font-medium">Como funciona</span>
              </div>
              <ul className="text-blue-100 text-sm space-y-1">
                <li>• Digite sua senha e clique em "Enviar Código por Email"</li>
                <li>• Verifique seu email e digite o código de 6 caracteres</li>
                <li>• O código expira em 3 minutos</li>
                <li>• Clique em "Entrar" para acessar a plataforma</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedLogin;