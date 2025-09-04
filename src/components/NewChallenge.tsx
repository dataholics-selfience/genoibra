import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, X, Copy, Check, Globe, ExternalLink } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useTranslation } from '../utils/i18n';

const STARTUP_LIST_TOKEN_COST = 30;

const NewChallenge = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    businessArea: '',
    companyName: '',
    logoFile: null as File | null,
    logoPreview: '',
    deadline: '',
    slug: '',
    isPublic: false
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const navigate = useNavigate();

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
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'title' && { slug: generateSlug(value) })
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        logoFile: file,
        logoPreview: event.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const removeLogo = () => {
    setFormData(prev => ({
      ...prev,
      logoFile: null,
      logoPreview: ''
    }));
  };

  const copyPublicUrl = async () => {
    if (!formData.slug) return;
    
    const url = `${window.location.origin}/desafio/${formData.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (error) {
      console.error('Error copying URL:', error);
    }
  };

  const openPublicPage = () => {
    if (!formData.slug) return;
    const url = `${window.location.origin}/desafio/${formData.slug}`;
    window.open(url, '_blank');
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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

      // Convert logo to base64 if uploaded
      let logoBase64 = '';
      if (formData.logoFile) {
        logoBase64 = await convertImageToBase64(formData.logoFile);
      }

      const challengeData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        company: userData.company,
        businessArea: formData.businessArea,
        title: formData.title,
        description: formData.description,
        companyName: formData.companyName || userData.company,
        logoBase64: logoBase64,
        deadline: formData.deadline,
        slug: formData.slug,
        isPublic: formData.isPublic,
        sessionId,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      const challengeRef = await addDoc(collection(db, 'challenges'), challengeData);

      const message = `Eu sou ${firstName}, um profissional gestor antenado nas novidades e que curte uma fala informal e ao mesmo tempo séria nos assuntos relativos ao Desafio. Eu trabalho na empresa ${userData.company || ''} que atua na área de ${formData.businessArea}. O meu desafio é ${formData.title} e a descrição do desafio é ${formData.description}. Faça uma breve saudação bem humorada e criativa que remete à cultura Geek e que tenha ligação direta com o desafio proposto. Depois, faça de forma direta uma pergunta sobre o ambiente interno de negócios do cliente, ou seja, sobre sua própria infraestrutura tecnológica, sobre sua operação, sobre os valores envolvidos na perda, ou sobre as possibilidades concretas de implantar a inovação nos processos, sistemas, rotinas ou maquinário - pesquise na internet e seja inteligente ao formular uma linha de questionamento bem embasada, conhecendo muito bem a área de atuação e qual empresa o cliente está representando. Uma pergunta inusitada e útil o suficiente para reforçar a descrição do desafio, com enfoque no ambiente interno da ${userData.company || ''} e seu estágio no quesito de transformação digital.`;

      console.log('Sending webhook message:', {
        sessionId,
        message,
        challengeId: challengeRef.id
      });

      const response = await fetch('https://primary-production-2e3b.up.railway.app/webhook/production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      if (formData.isPublic) {
        // Show success message with public URL
        const publicUrl = `${window.location.origin}/desafio/${formData.slug}`;
        alert(`Desafio criado com sucesso! Página pública disponível em: ${publicUrl}`);
      }

      navigate('/');
    } catch (error) {
      console.error('Error creating challenge:', error);
      setError('Erro ao criar desafio. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const publicUrl = formData.slug ? `${window.location.origin}/desafio/${formData.slug}` : '';

  return (
    <div className="min-h-screen bg-black p-4">
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

        {/* Public URL Display */}
        {formData.isPublic && formData.slug && (
          <div className="mb-8 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-600/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="text-blue-400" size={24} />
              <h3 className="text-lg font-bold text-white">Página Pública do Desafio</h3>
            </div>
            
            <div className="bg-black/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-400">URL da página:</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-blue-300 bg-gray-800 px-3 py-2 rounded text-sm font-mono break-all">
                  {publicUrl}
                </code>
                <button
                  onClick={copyPublicUrl}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  title="Copiar URL"
                >
                  {urlCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <button
                  onClick={openPublicPage}
                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                  title="Abrir página"
                >
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-blue-200">
              Esta URL será onde as startups poderão se inscrever no seu desafio. 
              Compartilhe este link após criar o desafio.
            </p>
          </div>
        )}

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

            {/* Seção para Desafio Público */}
            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-300">
                  Criar página pública para receber inscrições de startups
                </label>
              </div>

              {formData.isPublic && (
                <div className="space-y-4 bg-gray-800/50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome da Empresa (para exibição pública)
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome da empresa que aparecerá na página pública"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Logo da Empresa
                    </label>
                    
                    {!formData.logoPreview ? (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-400">
                              <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG, GIF até 5MB</p>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                          <img
                            src={formData.logoPreview}
                            alt="Logo preview"
                            className="w-16 h-16 object-contain rounded"
                          />
                          <div className="flex-1">
                            <p className="text-white font-medium">{formData.logoFile?.name}</p>
                            <p className="text-gray-400 text-sm">
                              {formData.logoFile && (formData.logoFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Prazo para Inscrições
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      URL da Página (slug)
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-400 text-sm mr-2 whitespace-nowrap">{window.location.origin}/desafio/</span>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="meu-desafio"
                      />
                    </div>
                    {formData.slug && (
                      <p className="text-xs text-gray-400 mt-1">
                        Página será criada em: <span className="text-blue-400">{publicUrl}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
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