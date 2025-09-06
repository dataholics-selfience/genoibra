import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useTranslation } from '../../utils/i18n';
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Shield, XCircle, Mail } from 'lucide-react';

interface RegistrationToken {
  id: string;
  slug?: string;
  token?: string;
  verificationCode: string;
  email: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'used' | 'expired';
  codeVerified: boolean;
}

const SlugRegister = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState<RegistrationToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    company: 'bradesco',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    validateSlug();
  }, [slug]);

  const handleVerifyCode = async () => {
    if (!tokenData || !verificationCode.trim()) {
      setError('Por favor, digite o código de verificação');
      return;
    }

    setVerifyingCode(true);
    setError('');

    try {
      if (verificationCode.toUpperCase() === tokenData.verificationCode) {
        // Código correto - marcar como verificado
        await updateDoc(doc(db, 'registrationTokens', tokenData.id), {
          codeVerified: true,
          codeVerifiedAt: new Date().toISOString()
        });
        
        setCodeVerified(true);
        setError('');
      } else {
        setError('Código de verificação incorreto. Verifique o código enviado por email.');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const validateSlug = async () => {
    if (!slug) {
      setError('Link inválido ou não fornecido');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Validando slug:', slug);

      // Buscar token no Firestore usando tanto slug quanto token
      let q = query(
        collection(db, 'registrationTokens'),
        where('slug', '==', slug)
      );
      let querySnapshot = await getDocs(q);
      
      // Se não encontrou por slug, tentar por token (para compatibilidade)
      if (querySnapshot.empty) {
        console.log('🔍 Não encontrado por slug, tentando por token...');
        q = query(
          collection(db, 'registrationTokens'),
          where('token', '==', slug)
        );
        querySnapshot = await getDocs(q);
      }
      
      if (querySnapshot.empty) {
        console.log('❌ Token não encontrado no banco de dados');
        setError('Link não encontrado ou inválido');
        setLoading(false);
        return;
      }
      
      const tokenDoc = querySnapshot.docs[0];
      const data = { id: tokenDoc.id, ...tokenDoc.data() } as RegistrationToken;
      console.log('✅ Token encontrado:', { id: data.id, email: data.email, status: data.status });
      setTokenData(data);

      // Verificar se token expirou
      const now = new Date();
      const expiresAt = new Date(data.expiresAt);
      
      if (now > expiresAt) {
        console.log('⏰ Token expirado');
        setError('Este link de cadastro expirou. Solicite um novo convite ao administrador.');
        setLoading(false);
        return;
      }

      // Verificar se token já foi usado
      if (data.status === 'used') {
        console.log('🚫 Token já foi usado');
        setError('Este link de cadastro já foi utilizado. Cada link só pode ser usado uma vez.');
        setLoading(false);
        return;
      }

      // Verificar se já existe uma conta com este email
      const existingUserQuery = query(
        collection(db, 'users'),
        where('email', '==', data.email.toLowerCase())
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);
      
      if (!existingUserSnapshot.empty) {
        console.log('👤 Usuário já existe');
        setError('Já existe uma conta cadastrada com este email.');
        setLoading(false);
        return;
      }

      // Verificar se email foi deletado anteriormente
      const deletedUserQuery = query(
        collection(db, 'deletedUsers'),
        where('email', '==', data.email.toLowerCase())
      );
      const deletedUserSnapshot = await getDocs(deletedUserQuery);
      
      if (!deletedUserSnapshot.empty) {
        console.log('🗑️ Email foi deletado anteriormente');
        setError('Este email foi utilizado anteriormente e não pode ser reutilizado.');
        setLoading(false);
        return;
      }

      // Verificar se código já foi verificado
      if (data.codeVerified) {
        console.log('✅ Código já verificado anteriormente');
        setCodeVerified(true);
      }

      // Token válido - permitir cadastro
      console.log('✅ Token válido, permitindo cadastro');
      setError('');
      
    } catch (error) {
      console.error('Error validating slug:', error);
      setError('Erro ao validar link de registro');
    } finally {
      setLoading(false);
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

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }

    if (!formData.cpf.trim()) {
      setError('CPF é obrigatório');
      return false;
    }

    if (!formData.phone.trim()) {
      setError('Telefone é obrigatório');
      return false;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    if (!formData.terms) {
      setError('Você precisa aceitar os termos de uso para continuar');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenData || !codeVerified) {
      setError('Código de verificação não confirmado');
      return;
    }

    if (!validateForm()) {
      return;
    }
    
    setError('');
    setIsSubmitting(true);

    try {
      console.log('🚀 Iniciando processo de cadastro...');

      // Verificar novamente se token ainda é válido
      const tokenQuery = query(
        collection(db, 'registrationTokens'),
        where(tokenData.slug ? 'slug' : 'token', '==', slug)
      );
      const tokenSnapshot = await getDocs(tokenQuery);
      
      if (tokenSnapshot.empty) {
        setError('Token não encontrado');
        setIsSubmitting(false);
        return;
      }

      const currentTokenData = tokenSnapshot.docs[0].data() as RegistrationToken;
      
      if (currentTokenData.status === 'used') {
        setError('Este token já foi utilizado');
        setIsSubmitting(false);
        return;
      }

      if (new Date() > new Date(currentTokenData.expiresAt)) {
        setError('Este token expirou');
        setIsSubmitting(false);
        return;
      }

      if (!currentTokenData.codeVerified) {
        setError('Código de verificação não confirmado');
        setIsSubmitting(false);
        return;
      }

      console.log('📧 Criando usuário no Firebase Auth...');

      // Criar usuário no Firebase Auth com o email do token
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        tokenData.email, // Usar email do token, não do formulário
        formData.password
      );
      const user = userCredential.user;

      console.log('✅ Usuário criado no Firebase Auth:', user.uid);

      const transactionId = crypto.randomUUID();
      const now = new Date();
      const expirationDate = new Date(now.setMonth(now.getMonth() + 1));

      // Criar dados do usuário
      const userData = {
        uid: user.uid,
        name: formData.name.trim(),
        cpf: formData.cpf.trim(),
        company: formData.company.trim(),
        email: tokenData.email.toLowerCase(), // Email do token
        phone: formData.phone.trim(),
        plan: 'Padawan',
        acceptedTerms: true,
        createdAt: new Date().toISOString(),
        termsAcceptanceId: transactionId,
        registrationMethod: 'email_invite',
        registrationSlug: slug,
        emailVerified: true // Marcar como verificado automaticamente
      };

      console.log('💾 Salvando dados do usuário no Firestore...');
      await setDoc(doc(db, 'users', user.uid), userData);

      // Criar registro de tokens
      console.log('🎫 Criando registro de tokens...');
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
      console.log('📋 Criando registros GDPR...');
      await setDoc(doc(collection(db, 'gdprCompliance'), transactionId), {
        uid: user.uid,
        email: tokenData.email.toLowerCase(),
        type: 'terms_acceptance',
        acceptedTerms: true,
        acceptedAt: new Date().toISOString(),
        transactionId,
        registrationMethod: 'email_invite'
      });

      await setDoc(doc(collection(db, 'gdprCompliance'), crypto.randomUUID()), {
        uid: user.uid,
        email: tokenData.email.toLowerCase(),
        type: 'registration',
        registeredAt: new Date().toISOString(),
        transactionId: crypto.randomUUID(),
        registrationMethod: 'email_invite'
      });

      // Marcar token como usado
      console.log('✅ Marcando token como usado...');
      await updateDoc(doc(db, 'registrationTokens', tokenData.id), {
        status: 'used',
        usedAt: new Date().toISOString(),
        usedBy: user.uid
      });

      console.log('🎉 Cadastro concluído com sucesso! Redirecionando para login...');

      // Fazer logout para garantir que o usuário faça login novamente
      await auth.signOut();

      // Redirecionar para login com mensagem de sucesso
      navigate('/login', { 
        state: { 
          message: 'Cadastro realizado com sucesso! Faça login para acessar a plataforma.',
          email: tokenData.email
        }
      });

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
        <div className="text-white text-xl">Validando convite...</div>
      </div>
    );
  }

  if (error && !tokenData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-900/50 text-red-200 p-6 rounded-lg border border-red-800">
            <XCircle size={64} className="mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Convite Inválido</h2>
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
          <h1 className="text-2xl font-bold text-white">Cadastro por Convite</h1>
        </div>

        {tokenData && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} className="text-green-400" />
              <div>
                <h3 className="text-white font-medium">Convite Válido</h3>
                <p className="text-gray-400 text-sm">{tokenData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-yellow-300 bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
              <Clock size={16} />
              <span>Este convite expira em: {formatTimeRemaining(tokenData.expiresAt)}</span>
            </div>
          </div>
        )}

        {/* Verificação de Código */}
        {tokenData && !codeVerified && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Verificação de Código</h2>
              <p className="text-gray-400 text-sm">
                Um código de verificação foi enviado para <strong>{tokenData.email}</strong>. 
                Digite o código para prosseguir com o cadastro.
              </p>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="text-red-500 text-center bg-red-900/20 p-3 rounded-md border border-red-800">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código de Verificação
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="XXXXXX"
                  maxLength={6}
                  disabled={verifyingCode}
                />
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={verifyingCode || !verificationCode.trim()}
                className={`w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 rounded-md text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                  verifyingCode || !verificationCode.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {verifyingCode ? 'Verificando...' : 'Verificar Código'}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={16} className="text-blue-400" />
                  <span className="text-blue-200 font-medium">Não recebeu o código?</span>
                </div>
                <ul className="text-blue-100 text-sm space-y-1">
                  <li>• Verifique sua caixa de entrada e spam</li>
                  <li>• O código tem 6 caracteres alfanuméricos</li>
                  <li>• O código expira junto com o convite</li>
                  <li>• Entre em contato com o administrador se necessário</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Formulário de Cadastro - só aparece após verificação do código */}
        {codeVerified && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center mb-6">
            <img 
              src="https://genoi.net/wp-content/uploads/2024/12/Logo-gen.OI-Novo-1-2048x1035.png" 
              alt="Genie Logo" 
              className="mx-auto h-16 mb-4"
            />
            <h2 className="text-xl font-bold text-white">Complete seu Cadastro</h2>
            <p className="text-gray-400 text-sm mt-2">
              Você foi convidado para criar uma conta com o email: <strong>{tokenData?.email}</strong>
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-green-400 text-sm font-medium">Código verificado com sucesso!</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome completo *"
                disabled={isSubmitting}
              />
              
              <input
                type="text"
                name="cpf"
                required
                value={formData.cpf}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CPF *"
                disabled={isSubmitting}
              />
              
              <select
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Telefone *"
                disabled={isSubmitting}
              />
              
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Senha (mínimo 6 caracteres) *"
                minLength={6}
                disabled={isSubmitting}
              />

              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirmar senha *"
                minLength={6}
                disabled={isSubmitting}
              />
              
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  required
                  disabled={isSubmitting}
                />
                <label className="block text-sm text-gray-300">
                  Declaro que faço parte do Bradesco ou inovaBra habitat e aceito os termos de uso da plataforma *
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

          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-blue-400" />
                <span className="text-blue-200 font-medium">Informações Importantes</span>
              </div>
              <ul className="text-blue-100 text-sm space-y-1">
                <li>• Você deve usar o email autorizado: <strong>{tokenData?.email}</strong></li>
                <li>• Este convite expira em {tokenData ? formatTimeRemaining(tokenData.expiresAt) : 'tempo indeterminado'}</li>
                <li>• Cada convite só pode ser usado uma vez</li>
                <li>• Após o cadastro, você será redirecionado para fazer login</li>
              </ul>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default SlugRegister;