import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../utils/i18n';
import { ArrowLeft } from 'lucide-react';

interface GoogleUser {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
}

const GoogleRegisterComplete = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const googleUser = location.state?.googleUser as GoogleUser;

  const [formData, setFormData] = useState({
    cpf: '',
    company: '',
    phone: '',
    terms: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Se não há dados do Google ou usuário não está autenticado, redirecionar
    if (!googleUser || !auth.currentUser) {
      navigate('/login');
    }
  }, [googleUser, navigate]);

  const checkDeletedUser = async (email: string) => {
    const q = query(
      collection(db, 'deletedUsers'),
      where('email', '==', email.toLowerCase().trim())
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.terms) {
      setError('Você precisa aceitar os termos de uso para continuar.');
      return;
    }

    if (!googleUser || !auth.currentUser) {
      setError('Erro na autenticação. Por favor, tente novamente.');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      // Verificar se o email foi deletado anteriormente
      const isDeleted = await checkDeletedUser(googleUser.email);
      if (isDeleted) {
        setError('Email e dados já excluídos da plataforma');
        setIsLoading(false);
        return;
      }

      const transactionId = crypto.randomUUID();
      const now = new Date();
      const expirationDate = new Date(now.setMonth(now.getMonth() + 1));

      // Criar dados do usuário
      const userData = {
        uid: googleUser.uid,
        name: googleUser.name,
        cpf: formData.cpf.trim(),
        company: formData.company.trim(),
        email: googleUser.email.toLowerCase(),
        phone: formData.phone.trim(),
        plan: 'Padawan',
        acceptedTerms: true,
        createdAt: new Date().toISOString(),
        termsAcceptanceId: transactionId,
        authProvider: 'google',
        photoURL: googleUser.photoURL || null
      };

      // Salvar usuário no Firestore
      await setDoc(doc(db, 'users', googleUser.uid), userData);

      // Criar registro de tokens
      await setDoc(doc(db, 'tokenUsage', googleUser.uid), {
        uid: googleUser.uid,
        email: googleUser.email.toLowerCase(),
        plan: 'Padawan',
        totalTokens: 100,
        usedTokens: 0,
        lastUpdated: new Date().toISOString(),
        expirationDate: expirationDate.toISOString()
      });

      // Registros de conformidade GDPR
      await setDoc(doc(collection(db, 'gdprCompliance'), transactionId), {
        uid: googleUser.uid,
        email: googleUser.email.toLowerCase(),
        type: 'terms_acceptance',
        acceptedTerms: true,
        acceptedAt: new Date().toISOString(),
        transactionId,
        authProvider: 'google'
      });

      await setDoc(doc(collection(db, 'gdprCompliance'), crypto.randomUUID()), {
        uid: googleUser.uid,
        email: googleUser.email.toLowerCase(),
        type: 'registration',
        registeredAt: new Date().toISOString(),
        transactionId: crypto.randomUUID(),
        authProvider: 'google'
      });

      // Redirecionar para a página principal
      navigate('/', { replace: true });

    } catch (error: any) {
      console.error('Registration completion error:', error);
      setError('Erro ao completar cadastro. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBack = () => {
    // Fazer logout e voltar para login
    auth.signOut();
    navigate('/login');
  };

  if (!googleUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={handleBack}
            className="text-gray-300 hover:text-white mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">Complete seu Cadastro</h1>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {googleUser.photoURL && (
              <img 
                src={googleUser.photoURL} 
                alt="Profile" 
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <h3 className="text-white font-medium">{googleUser.name}</h3>
              <p className="text-gray-400 text-sm">{googleUser.email}</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm">
            Bem-vindo! Para completar seu cadastro, precisamos de algumas informações adicionais.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-500 text-center bg-red-900/20 p-3 rounded-md border border-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              name="cpf"
              required
              value={formData.cpf}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.cpf}
              disabled={isLoading}
            />
            
            <input
              type="text"
              name="company"
              required
              value={formData.company}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.company}
              disabled={isLoading}
            />
            
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.phone}
              disabled={isLoading}
            />
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
                disabled={isLoading}
              />
              <label className="ml-2 block text-sm text-gray-300">
                {t.acceptTerms}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.terms}
            className={`w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 rounded-md text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              isLoading || !formData.terms ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Completando cadastro...' : 'Completar Cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GoogleRegisterComplete;