import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, X, Copy, Check, Globe, ExternalLink } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useTranslation } from '../utils/i18n';
import { getWebhookUrl } from '../config/api';
import EnvironmentSelector from './EnvironmentSelector';

const STARTUP_LIST_TOKEN_COST = 30;

const NewChallenge = () => {
  const { t } = useTranslation();
  const [webhookEnvironment, setWebhookEnvironment] = useState<'production' | 'test'>('production');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    businessArea: '',
    companyName: '',
    companyType: 'bradesco', // 'bradesco' ou 'habitante'
    habitanteCompany: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load saved environment from localStorage
    const savedEnvironment = localStorage.getItem('webhook-environment') as 'production' | 'test';
    if (savedEnvironment) {
      setWebhookEnvironment(savedEnvironment);
    }
  }, []);

  const checkAndUpdateTokens = async (cost: number): Promise<boolean> => {
    if (!auth.currentUser) return false;

    try {
      const tokenDoc = await getDoc(doc(db, 'tokenUsage', auth.currentUser.uid));
      if (!tokenDoc.exists()) return false;

      const tokenUsage = tokenDoc.data();
      const remainingTokens = tokenUsage.totalTokens - tokenUsage.usedTokens;

      if (remainingTokens < cost) {
        setError(`Você não tem tokens suficientes. Seu plano ${tokenUsage.plan} possui ${remainingTokens} tokens restantes.`);
        return false;
      }

      await updateDoc(doc(db, 'tokenUsage', auth.currentUser.uid), {
        usedTokens: tokenUsage.usedTokens + cost
      });

      return true;
    } catch (error) {
      console.error('Error checking tokens:', error);
      return false;
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('Usuário não autenticado');
      return;
    }

    setIsSubmitting(true);

    try {
      const hasTokens = await checkAndUpdateTokens(STARTUP_LIST_TOKEN_COST);
      if (!hasTokens) {
        setIsSubmitting(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      if (!userData) {
        setError('Dados do usuário não encontrados');
        return;
      }

      const firstName = userData.name?.split(' ')[0] || '';
      const sessionId = uuidv4().replace(/-/g, '');

      // Determinar qual empresa usar
      const companyToUse = formData.companyType === 'bradesco' 
        ? 'Bradesco' 
        : formData.habitanteCompany || 'Empresa Habitante';

      const challengeData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        company: companyToUse,
        businessArea: formData.businessArea,
        title: formData.title,
        description: formData.description,
        sessionId,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      const challengeRef = await addDoc(collection(db, 'challenges'), challengeData);

      const message = `Eu sou ${firstName}, um profissional gestor antenado nas novidades e que curte uma fala informal e ao mesmo tempo séria nos assuntos relativos ao Desafio. Eu trabalho na empresa ${companyToUse} que atua na área de ${formData.businessArea}. O meu desafio é ${formData.title} e a descrição do desafio é ${formData.description}. Faça uma breve saudação bem humorada e criativa que remete à cultura Geek e que tenha ligação direta com o desafio proposto. Depois, faça de forma direta uma pergunta sobre o ambiente interno de negócios do cliente, ou seja, sobre sua própria infraestrutura tecnológica, sobre sua operação, sobre os valores envolvidos na perda, ou sobre as possibilidades concretas de implantar a inovação nos processos, sistemas, rotinas ou maquinário - pesquise na internet e seja inteligente ao formular uma linha de questionamento bem embasada, conhecendo muito bem a área de atuação e qual empresa o cliente está representando. Uma pergunta inusitada e útil o suficiente para reforçar a descrição do desafio, com enfoque no ambiente interno da ${companyToUse} e seu estágio no quesito de transformação digital.`;

      console.log('Sending webhook message:', {
        sessionId,
        message,
        challengeId: challengeRef.id,
        environment: webhookEnvironment
      });

      const webhookUrl = getWebhookUrl(webhookEnvironment);
      console.log(`🌐 Enviando desafio para webhook ${webhookEnvironment}:`, webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          sessionId,
        }),
      });

      if (!response.ok) {
        console.error('Webhook response error:', await response.text());
        throw new Error('Failed to send initial message');
      }

      await addDoc(collection(db, 'messages'), {
        challengeId: challengeRef.id,
        userId: auth.currentUser.uid,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        hidden: true
      });

      const data = await response.json();
      if (data[0]?.output) {
        await addDoc(collection(db, 'messages'), {
          challengeId: challengeRef.id,
          userId: auth.currentUser.uid,
          role: 'assistant',
          content: data[0].output,
          timestamp: new Date().toISOString()
        });
      }


      navigate('/');
    } catch (error) {
      console.error('Error creating challenge:', error);
      setError('Erro ao criar desafio. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnvironmentChange = (environment: 'production' | 'test') => {
    setWebhookEnvironment(environment);
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <EnvironmentSelector onEnvironmentChange={handleEnvironmentChange} />
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">{t.newChallenge}</h1>
          <div className="w-6" />
        </div>


        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-500 text-center bg-red-900/20 p-3 rounded-md border border-red-800">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.challengeTitle}
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o título do seu desafio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.businessArea}
              </label>
              <input
                type="text"
                name="businessArea"
                value={formData.businessArea}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Tecnologia, Saúde, Educação"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Empresa
              </label>
              <select
                name="companyType"
                value={formData.companyType}
                onChange={handleSelectChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bradesco">Bradesco</option>
                <option value="habitante">Empresa Habitante</option>
              </select>
            </div>

            {formData.companyType === 'habitante' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome da Empresa Habitante
                </label>
                <input
                  type="text"
                  name="habitanteCompany"
                  value={formData.habitanteCompany}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o nome da empresa habitante"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.challengeDescription}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Descreva seu desafio em detalhes"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 rounded-md text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 transition-colors"
          >
            <span>{t.createChallenge}</span>
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewChallenge;