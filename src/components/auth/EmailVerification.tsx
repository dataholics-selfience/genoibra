import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { Clock, Mail, CheckCircle, AlertTriangle } from 'lucide-react';

interface VerificationCode {
  id: string;
  userId: string;
  email: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'used' | 'expired';
  attempts: number;
}

const EmailVerification = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeAttempts, setCodeAttempts] = useState(0);
  const [canRequestCode, setCanRequestCode] = useState(true);
  const [waitTime, setWaitTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // Countdown for code expiration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Wait time countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (waitTime > 0) {
      timer = setInterval(() => {
        setWaitTime(prev => {
          if (prev <= 1) {
            setCanRequestCode(true);
            setCodeAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [waitTime]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const generateVerificationCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const sendVerificationCode = async () => {
    if (!auth.currentUser || !canRequestCode || isSendingCode) return;

    setIsSendingCode(true);
    setError('');
    setSuccess('');

    try {
      const code = generateVerificationCode();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutos

      // Save verification code to Firestore
      const codeData = {
        userId: auth.currentUser.uid,
        email: auth.currentUser.email!,
        code,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'active' as const,
        attempts: codeAttempts + 1
      };

      await addDoc(collection(db, 'verificationCodes'), codeData);

      // Send email with verification code
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Verificação - Gen.OI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <img src="https://genoi.net/wp-content/uploads/2024/12/Logo-gen.OI-Novo-1-2048x1035.png" alt="Gen.OI" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Gen.OI - Código de Verificação</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Código de Verificação de Login</h2>
              <p style="margin-bottom: 25px;">
                Para acessar sua conta Gen.OI, use o código de verificação abaixo:
              </p>
              
              <div style="background: #f0f8ff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                <h3 style="color: #667eea; margin: 0 0 10px 0;">Seu Código:</h3>
                <div style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 4px; font-family: monospace;">
                  ${code}
                </div>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Importante:</strong> Este código expira em 5 minutos. 
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
          email: auth.currentUser.email!, 
          name: auth.currentUser.email!.split('@')[0] 
        }],
        from: { 
          email: 'contact@genoi.com.br', 
          name: 'Gen.OI - Verificação de Login' 
        },
        subject: `Código de Verificação Gen.OI: ${code}`,
        html: emailHtml,
        text: `Seu código de verificação Gen.OI: ${code}\n\nEste código expira em 5 minutos.`,
        reply_to: { 
          email: 'contact@genoi.net', 
          name: 'Gen.OI - Suporte' 
        },
        tags: ['auth', 'verification-code'],
        metadata: { 
          userId: auth.currentUser.uid,
          verificationCode: code,
          loginVerification: true
        }
      };

      await addDoc(collection(db, 'emails'), emailPayload);

      setCodeAttempts(prev => prev + 1);
      setCountdown(300); // 5 minutos
      setSuccess('Código enviado! Verifique seu email.');

      // Check if reached max attempts
      if (codeAttempts + 1 >= 5) {
        setCanRequestCode(false);
        setWaitTime(300); // 5 minutos de espera
      }

    } catch (error) {
      console.error('Error sending verification code:', error);
      setError('Erro ao enviar código de verificação. Tente novamente.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!auth.currentUser || !verificationCode.trim()) {
      setError('Por favor, digite o código de verificação');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Find active verification code for this user
      const q = query(
        collection(db, 'verificationCodes'),
        where('userId', '==', auth.currentUser.uid),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Nenhum código ativo encontrado. Solicite um novo código.');
        setIsVerifying(false);
        return;
      }

      // Get the most recent code
      const codes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VerificationCode[];
      
      const latestCode = codes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      // Check if code expired
      const now = new Date();
      const expiresAt = new Date(latestCode.expiresAt);
      
      if (now > expiresAt) {
        setError('Código expirado. Solicite um novo código.');
        setCountdown(0);
        setIsVerifying(false);
        return;
      }

      // Check if code is correct
      if (verificationCode.toUpperCase() !== latestCode.code) {
        setError('Código de verificação incorreto.');
        setIsVerifying(false);
        return;
      }

      // Code is correct - mark as used and proceed
      await setDoc(doc(db, 'verificationCodes', latestCode.id), {
        ...latestCode,
        status: 'used',
        usedAt: new Date().toISOString()
      });

      // Record successful verification
      await setDoc(doc(collection(db, 'gdprCompliance'), crypto.randomUUID()), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        type: 'login_verification',
        verifiedAt: new Date().toISOString(),
        transactionId: crypto.randomUUID()
      });

      // Navigate to main app
      navigate('/', { replace: true });

    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value.toUpperCase());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyCode();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <img 
            src="https://genoi.net/wp-content/uploads/2024/12/Logo-gen.OI-Novo-1-2048x1035.png" 
            alt="Genie Logo" 
            className="mx-auto h-24"
          />
          <h2 className="mt-6 text-3xl font-bold text-white">Verificação de Login</h2>
          <p className="mt-2 text-gray-400">
            Para sua segurança, enviamos um código de verificação para seu email.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 text-red-200 p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-600 text-green-200 p-4 rounded-lg flex items-center gap-3">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Send Code Button */}
        {countdown === 0 ? (
          <button
            onClick={sendVerificationCode}
            disabled={isSendingCode || !canRequestCode}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isSendingCode || !canRequestCode
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSendingCode ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                Enviando código...
              </div>
            ) : !canRequestCode ? (
              <div className="flex items-center justify-center gap-2">
                <Clock size={20} />
                Aguarde {formatTime(waitTime)} para solicitar novo código
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Mail size={20} />
                {codeAttempts === 0 ? 'Enviar Código de Verificação' : `Enviar Novo Código (${codeAttempts}/5)`}
              </div>
            )}
          </button>
        ) : (
          <div className="space-y-4">
            {/* Verification Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código de Verificação
                <span className="text-yellow-400 ml-2">
                  (Expira em {formatTime(countdown)})
                </span>
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="XXXXXX"
                maxLength={6}
                disabled={isVerifying}
              />
            </div>

            {/* Verify Button */}
            <button
              onClick={verifyCode}
              disabled={isVerifying || !verificationCode.trim()}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isVerifying || !verificationCode.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isVerifying ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </div>
              ) : (
                'Verificar e Entrar'
              )}
            </button>

            {/* Request New Code */}
            {canRequestCode && (
              <button
                onClick={sendVerificationCode}
                disabled={isSendingCode}
                className="w-full py-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
              >
                {isSendingCode ? 'Enviando...' : `Solicitar novo código (${codeAttempts}/5)`}
              </button>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={16} className="text-blue-400" />
            <span className="text-blue-200 font-medium">Instruções</span>
          </div>
          <ul className="text-blue-100 text-sm space-y-1 text-left">
            <li>• Clique em "Enviar Código" para receber o código por email</li>
            <li>• Digite o código de 6 caracteres no campo acima</li>
            <li>• O código expira em 5 minutos</li>
            <li>• Você pode solicitar até 5 códigos por sessão</li>
            <li>• Após 5 tentativas, aguarde 5 minutos para tentar novamente</li>
          </ul>
        </div>

        {/* Logout Button */}
        {error && (
          <div className="bg-red-900/50 text-red-200 p-4 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 rounded-md text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;