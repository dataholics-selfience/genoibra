import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { 
  Shield, 
  Mail, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { markUserAsVerified } from '../../utils/verificationStateManager';

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

const LoginVerification = () => {
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [currentVerification, setCurrentVerification] = useState<LoginVerification | null>(null);
  const [hasInitialCode, setHasInitialCode] = useState(false);

  // Countdown timers
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            setAttempts(0); // Reset attempts after cooldown
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownTime]);

  // Check if user is authenticated and send initial code
  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    // Send initial verification code only once
    if (!hasInitialCode) {
      sendVerificationCode();
      setHasInitialCode(true);
    }
  }, [navigate, hasInitialCode]);

  const generateVerificationCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const sendVerificationCode = async () => {
    if (!auth.currentUser || sendingCode) return;

    // Check cooldown
    if (cooldownTime > 0) {
      setError(`Aguarde ${formatTime(cooldownTime)} antes de solicitar um novo código.`);
      return;
    }

    // Check attempts limit
    if (attempts >= 3) {
      setCooldownTime(300); // 5 minutes cooldown
      setError('Limite de tentativas excedido. Aguarde 5 minutos antes de tentar novamente.');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const verificationCode = generateVerificationCode();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

      console.log('📧 Enviando código de verificação de login:', { 
        email: auth.currentUser.email, 
        code: verificationCode 
      });

      // Save verification in Firestore
      const verificationData = {
        userId: auth.currentUser.uid,
        email: auth.currentUser.email!,
        verificationCode,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'active' as const,
        attempts: attempts + 1,
        lastAttemptAt: now.toISOString()
      };

      const docRef = await addDoc(collection(db, 'loginVerifications'), verificationData);
      
      setCurrentVerification({
        id: docRef.id,
        ...verificationData
      });

      // Send email with verification code
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Verificação de Login - Gen.OI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <img src="https://genoi.net/wp-content/uploads/2024/12/Logo-gen.OI-Novo-1-2048x1035.png" alt="Gen.OI" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Gen.OI - Verificação de Segurança</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">🔐 Verificação de Segurança</h2>
              <p style="margin-bottom: 25px;">
                Para garantir a segurança da sua conta, digite o código de verificação abaixo na plataforma:
              </p>
              
              <div style="background: #f0f8ff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                <h3 style="color: #667eea; margin: 0 0 10px 0;">Seu Código de Verificação:</h3>
                <div style="font-size: 36px; font-weight: bold; color: #333; letter-spacing: 6px; font-family: monospace;">
                  ${verificationCode}
                </div>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Importante:</strong> Este código expira em 5 minutos. 
                  Se não conseguir usar a tempo, você pode solicitar um novo código.
                </p>
              </div>
              
              <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #721c24; font-size: 14px;">
                  <strong>🚨 Segurança:</strong> Se você não solicitou este código, ignore este email. 
                  Nunca compartilhe este código com terceiros.
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
          email: auth.currentUser.email!, 
          name: auth.currentUser.email!.split('@')[0] 
        }],
        from: { 
          email: 'contact@genoi.com.br', 
          name: 'Gen.OI - Verificação de Segurança' 
        },
        subject: `🔐 Código de Verificação Gen.OI: ${verificationCode}`,
        html: emailHtml,
        text: `Código de verificação de segurança Gen.OI: ${verificationCode}\n\nEste código expira em 5 minutos.\n\nSe você não solicitou este código, ignore este email.`,
        reply_to: { 
          email: 'contact@genoi.net', 
          name: 'Gen.OI - Suporte' 
        },
        tags: ['security', 'login-verification'],
        metadata: { 
          userId: auth.currentUser.uid,
          verificationCode,
          loginVerification: true,
          attempt: attempts + 1
        }
      };

      console.log('Enviando email de verificação de login:', { 
        email: auth.currentUser.email, 
        code: verificationCode,
        attempt: attempts + 1
      });
      
      await addDoc(collection(db, 'emails'), emailPayload);

      setAttempts(prev => prev + 1);
      setCountdown(300); // 5 minutes
      setSuccess('Código de verificação enviado! Verifique seu email.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Error sending verification code:', error);
      setError('Erro ao enviar código de verificação. Tente novamente.');
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!auth.currentUser || !currentVerification || !verificationCode.trim()) {
      setError('Por favor, digite o código de verificação');
      return;
    }

    setVerifyingCode(true);
    setError('');

    try {
      // Check if verification is still valid
      const now = new Date();
      const expiresAt = new Date(currentVerification.expiresAt);
      
      if (now > expiresAt) {
        setError('Código expirado. Solicite um novo código.');
        setCountdown(0);
        setVerifyingCode(false);
        return;
      }

      // Check if code is correct
      if (verificationCode.toUpperCase() !== currentVerification.verificationCode) {
        setError('Código de verificação incorreto.');
        setVerifyingCode(false);
        return;
      }

      console.log('✅ Código de verificação correto, permitindo acesso...');

      // Mark verification as used
      await updateDoc(doc(db, 'loginVerifications', currentVerification.id), {
        status: 'used',
        verifiedAt: new Date().toISOString()
      });

      // Record successful verification in GDPR compliance
      await addDoc(collection(db, 'gdprCompliance'), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        type: 'login_verification',
        verifiedAt: new Date().toISOString(),
        transactionId: crypto.randomUUID()
      });

      // Mark user as verified in local storage
      markUserAsVerified(auth.currentUser.uid);

      console.log('🎉 Verificação de login concluída com sucesso!');
      
      // Redirect to dashboard
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const canRequestNewCode = () => {
    return cooldownTime === 0 && attempts < 3 && countdown === 0;
  };

  const handleRequestNewCode = () => {
    if (canRequestNewCode()) {
      sendVerificationCode();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="https://genoi.net/wp-content/uploads/2024/12/Logo-gen.OI-Novo-1-2048x1035.png" 
            alt="Genie Logo" 
            className="mx-auto h-16 mb-6"
          />
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield size={32} className="text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Verificação de Segurança</h1>
          </div>
          <p className="text-gray-400">
            Para garantir a segurança da sua conta, enviamos um código de verificação para seu email.
          </p>
        </div>

        {/* User Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Mail size={20} className="text-blue-400" />
            <div>
              <p className="text-white font-medium">Código enviado para:</p>
              <p className="text-gray-400 text-sm">{auth.currentUser?.email}</p>
            </div>
          </div>
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

        {/* Verification Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código de Verificação
                {countdown > 0 && (
                  <span className="text-yellow-400 ml-2">
                    (Expira em {formatTime(countdown)})
                  </span>
                )}
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="XXXXXX"
                maxLength={6}
                disabled={verifyingCode || countdown === 0}
              />
            </div>

            <button
              onClick={verifyCode}
              disabled={verifyingCode || !verificationCode.trim() || countdown === 0}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                verifyingCode || !verificationCode.trim() || countdown === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {verifyingCode ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </div>
              ) : (
                'Verificar Código'
              )}
            </button>
          </div>
        </div>

        {/* Request New Code */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-4">
              Não recebeu o código ou ele expirou?
            </p>
            
            {cooldownTime > 0 ? (
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock size={16} className="text-red-400" />
                  <span className="text-red-200 font-medium">Aguarde para tentar novamente</span>
                </div>
                <p className="text-red-100 text-sm">
                  Tempo restante: {formatTime(cooldownTime)}
                </p>
              </div>
            ) : (
              <button
                onClick={handleRequestNewCode}
                disabled={sendingCode || !canRequestNewCode()}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  sendingCode || !canRequestNewCode()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {sendingCode ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Enviar Novo Código ({3 - attempts} tentativas restantes)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-6">
          <h4 className="text-blue-200 font-medium mb-2 flex items-center gap-2">
            <Shield size={16} />
            Instruções de Segurança
          </h4>
          <ul className="text-blue-100 text-sm space-y-1">
            <li>• O código tem 6 caracteres e expira em 5 minutos</li>
            <li>• Você tem até 3 tentativas para solicitar novos códigos</li>
            <li>• Após 3 tentativas, aguarde 5 minutos para tentar novamente</li>
            <li>• Nunca compartilhe este código com terceiros</li>
            <li>• Se não solicitou este código, ignore o email</li>
          </ul>
        </div>

        {/* Logout Option */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mx-auto"
          >
            <ArrowLeft size={16} />
            Sair e voltar ao login
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginVerification;