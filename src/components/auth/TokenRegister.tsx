import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, collection, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../utils/i18n';
import { ArrowLeft, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface RegistrationToken {
  id: string;
  token: string;
  email: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'used' | 'expired';
  emailConfirmed?: boolean;
}

const TokenRegister = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState<RegistrationToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'validate' | 'confirm-email' | 'register'>('validate');
  const [emailConfirmationCode, setEmailConfirmationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    company: 'bradesco',
    phone: '',
    password: '',
    terms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('Token inválido');
      setLoading(false);
      return;
    }

    try {
      // Buscar token no Firestore
      const tokensRef = collection(db, 'registrationTokens');
      const tokenQuery = await getDoc(doc(tokensRef, token));
      
      if (!tokenQuery.exists()) {
        // Tentar buscar por campo token
        const { getDocs, query, where } = await import('firebase/firestore');
        const q = query(tokensRef, where('token', '==', token));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('Token não encontrado');
          setLoading(false);
          return;
        }
        
        const tokenDoc = querySnapshot.docs[0];
        const data = { id: tokenDoc.id, ...tokenDoc.data() } as RegistrationToken;
        setTokenData(data);
      } else {
        const data = { id: tokenQuery.id, ...tokenQuery.data() } as RegistrationToken;
        setTokenData(data);
      }

      // Verificar se token expirou
      const now = new Date();
      const expiresAt = new Date(tokenData?.expiresAt || '');
      
      if (now > expiresAt) {
        setError('Token expirado');
        setLoading(false);
        return;
      }

      // Verificar se token já foi usado
      if (tokenData?.status === 'used') {
        setError('Token já foi utilizado');
        setLoading(false);
        return;
      }

      // Se chegou até aqui, token é válido
      if (tokenData?.emailConfirmed) {
        setStep('register');
      } else {
        setStep('confirm-email');
        await sendEmailConfirmation();
      }
      
    } catch (error) {
      console.error('Error validating token:', error);
      setError('Erro ao validar token');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailConfirmation = async () => {
    if (!tokenData) return;

    try {
      // Gerar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      // Aqui você enviaria o email com o código
      // Por enquanto, vamos simular mostrando o código na tela para desenvolvimento
      console.log(`Código de confirmação para ${tokenData.email}: ${code}`);
      
      // Em produção, você enviaria via MailerSend ou outro serviço
      // await sendConfirmationEmail(tokenData.email, code);
      
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      setError('Erro ao enviar email de confirmação');
    }
  };

  const handleEmailConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (emailConfirmationCode !== generatedCode) {
      setError('Código incorreto');
      return;
    }

    try {
      // Marcar email como confirmado
      if (tokenData) {
        await updateDoc(doc(db, 'registrationTokens', tokenData.id), {
          emailConfirmed: true
        });
        
        setStep('register');
        setError('');
      }
    } catch (error) {
      console.error('Error confirming email:', error);
      setError('Erro ao confirmar email');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.terms) {
      setError('Você precisa aceitar os termos de uso para continuar.');
      return;
    }

    if (!tokenData) {
      setError('Token inválido');
      return;
    }
    
    setError('');
    setIsSubmitting(true);

    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        tokenData.email, 
        formData.password
      );
      const user = userCredential.user;

      const transactionId = crypto.randomUUID();
      const now = new Date();
      const expirationDate = new Date(now.setMonth(now.getMonth() + 1));

      // Criar dados do usuário
      const userData = {
        uid: user.uid,
        name: formData.name.trim(),
        cpf: formData.cpf.trim(),
        company: formData.company.trim(),
        email: tokenData.email.toLowerCase(),
        phone: formData.phone.trim(),
        plan: 'Padawan',
        acceptedTerms: true,
        createdAt: new Date().toISOString(),
        termsAcceptanceId: transactionId,
        registrationMethod: 'token'
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      // Criar registro de tokens
      await setDoc(doc(db, 'tokenUsage', user.uid), {
        uid: user.uid,
        email: tokenData.email.toLowerCase(),
        plan: 'Padawan',
        totalTokens: 100000,
        usedTokens: 0,
        lastUpdated: new Date().toISOString(),
        expirationDate: expirationDate.toISOString()
      });

      // Registros de conformidade GDPR
      await setDoc(doc(collection(db, 'gdprCompliance'), transactionId), {
        uid: user.uid,
        email: tokenData.email.toLowerCase(),
        type: 'terms_acceptance',
        acceptedTerms: true,
        acceptedAt: new Date().toISOString(),
        transactionId,
        registrationMethod: 'token'
      });

      await setDoc(doc(collection(db, 'gdprCompliance'), crypto.randomUUID()), {
        uid: user.uid,
        email: tokenData.email.toLowerCase(),
        type: 'registration',
        registeredAt: new Date().toISOString(),
        transactionId: crypto.randomUUID(),
        registrationMethod: 'token'
      });

      // Marcar token como usado
      await updateDoc(doc(db, 'registrationTokens', tokenData.id), {
        status: 'used',
        usedAt: new Date().toISOString(),
        usedBy: user.uid
      });

      // Enviar email de verificação
      await sendEmailVerification(user);

      navigate('/verify-email');

    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso.');
      } else if (error.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Erro ao criar conta. Por favor, tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m restantes`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Validando token...</div>
      </div>
    );
  }

  if (error && !tokenData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-900/50 text-red-200 p-6 rounded-lg border border-red-800">
            <AlertTriangle size={64} className="mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Token Inválido</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 mx-auto text-blue-400 hover:text-blue-300"
            >
              <ArrowLeft size={16} />
              Voltar ao login
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
            onClick={() => navigate('/login')}
            className="text-gray-300 hover:text-white mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">
            {step === 'confirm-email' ? 'Confirmar Email' : 'Criar Conta'}
          </h1>
        </div>

        {tokenData && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} className="text-green-400" />
              <div>
                <h3 className="text-white font-medium">Token Válido</h3>
                <p className="text-gray-400 text-sm">{tokenData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock size={16} />
              <span>{formatTimeRemaining(tokenData.expiresAt)}</span>
            </div>
          </div>
        )}

        {step === 'confirm-email' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Confirme seu Email</h3>
            <p className="text-gray-300 mb-4">
              Enviamos um código de confirmação para <strong>{tokenData?.email}</strong>. 
              Digite o código abaixo para continuar.
            </p>
            
            {/* Mostrar código para desenvolvimento */}
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-4">
              <p className="text-yellow-200 text-sm">
                <strong>Código de desenvolvimento:</strong> {generatedCode}
              </p>
            </div>

            <form onSubmit={handleEmailConfirmation} className="space-y-4">
              {error && (
                <div className="text-red-500 text-center bg-red-900/20 p-3 rounded-md border border-red-800">
                  {error}
                </div>
              )}

              <input
                type="text"
                value={emailConfirmationCode}
                onChange={(e) => setEmailConfirmationCode(e.target.value)}
                placeholder="Digite o código de 6 dígitos"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
                required
              />

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirmar Email
              </button>
            </form>
          </div>
        )}

        {step === 'register' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-red-500 text-center bg-red-900/20 p-3 rounded-md border border-red-800">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome completo"
                disabled={isSubmitting}
              />
              
              <input
                type="text"
                name="cpf"
                required
                value={formData.cpf}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CPF"
                disabled={isSubmitting}
              />
              
              <select
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="bradesco">Bradesco</option>
                <option value="habitat">Habitat</option>
              </select>
              
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Telefone"
                disabled={isSubmitting}
              />
              
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Senha (mínimo 6 caracteres)"
                minLength={6}
                disabled={isSubmitting}
              />
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                  disabled={isSubmitting}
                />
                <label className="ml-2 block text-sm text-gray-300">
                  Declaro que faço parte do Bradesco ou inovaBra habitat
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.terms}
              className={`w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 rounded-md text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                isSubmitting || !formData.terms ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default TokenRegister;