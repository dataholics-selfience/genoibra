import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Calendar, Building2, MapPin, Users, Briefcase, Award, 
  Target, Rocket, ArrowLeft, Globe, Box, Linkedin,
  Facebook, Twitter, Instagram, Heart, HeartOff, CheckCircle, X
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { StartupType, StartupListType, SocialLink } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from '../utils/i18n';

const formatValue = (value: any, fallback: string = 'Não informado'): string => {
  if (!value || value === 'NÃO DIVULGADO' || value === 'N/A' || value === '') {
    return fallback;
  }
  return String(value);
};

const formatList = (list: any[], fallback: string = 'Nenhum informado'): string => {
  if (!Array.isArray(list) || list.length === 0) {
    return fallback;
  }
  const filteredList = list.filter(item => item && item !== 'NÃO DIVULGADO' && item !== 'N/A');
  return filteredList.length > 0 ? filteredList.join(', ') : fallback;
};

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
      <span className="text-3xl font-extrabold text-white">{rating}</span>
      <div className="text-sm text-gray-400 mt-1">Match Score</div>
      <div className="flex items-center gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const SocialLinks = ({ startup, className = "" }: { startup: StartupType; className?: string }) => {
  const links: SocialLink[] = [
    {
      type: 'website',
      url: startup.website,
      icon: Globe,
      label: 'Website'
    },
    {
      type: 'email',
      url: `mailto:${startup.email}`,
      icon: Mail,
      label: 'Email'
    },
    ...(startup.socialLinks?.linkedin ? [{
      type: 'linkedin',
      url: startup.socialLinks.linkedin,
      icon: Linkedin,
      label: 'LinkedIn'
    }] : []),
    ...(startup.socialLinks?.facebook ? [{
      type: 'facebook',
      url: startup.socialLinks.facebook,
      icon: Facebook,
      label: 'Facebook'
    }] : []),
    ...(startup.socialLinks?.twitter ? [{
      type: 'twitter',
      url: startup.socialLinks.twitter,
      icon: Twitter,
      label: 'Twitter'
    }] : []),
    ...(startup.socialLinks?.instagram ? [{
      type: 'instagram',
      url: startup.socialLinks.instagram,
      icon: Instagram,
      label: 'Instagram'
    }] : [])
  ].filter(link => link.url);

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <link.icon size={16} />
          <span>{link.label}</span>
        </a>
      ))}
    </div>
  );
};

const StartupCard = ({ startup, onSave, isSaved }: { startup: StartupType; onSave: () => void; isSaved: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave();
  };

  return (
    <div 
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 cursor-pointer hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-700 hover:border-gray-600"
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">{startup.name}</h3>
            <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-bold">
              #{startup.sequentialNumber}
            </span>
            {startup.websiteValidated && (
              <CheckCircle size={16} className="text-green-500" />
            )}
          </div>
          <SocialLinks startup={startup} />
        </div>
        <div className="flex items-center gap-3">
          <StarRating rating={startup.rating} />
          <button
            onClick={handleSaveClick}
            className={`p-2 rounded-full transition-colors ${
              isSaved 
                ? 'text-red-500 hover:text-red-400' 
                : 'text-gray-400 hover:text-red-500'
            }`}
          >
            {isSaved ? <HeartOff size={24} /> : <Heart size={24} />}
          </button>
        </div>
      </div>

      <p className="text-gray-400 mb-6">{startup.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="text-blue-400" size={16} />
            <span className="text-gray-400">Fundação:</span>
            {startup.foundedYear}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Building2 className="text-purple-400" size={16} />
            <span className="text-gray-400">Categoria:</span>
            {startup.category}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Box className="text-pink-400" size={16} />
            <span className="text-gray-400">Vertical:</span>
            {startup.vertical}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <MapPin className="text-emerald-400" size={16} />
            <span className="text-gray-400">Localização:</span>
            {startup.city}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="text-blue-400" size={16} />
            <span className="text-gray-400">Tamanho da Equipe:</span>
            {startup.teamSize}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Briefcase className="text-purple-400" size={16} />
            <span className="text-gray-400">Modelo de Negócio:</span>
            {startup.businessModel}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Globe className="text-pink-400" size={16} />
            <span className="text-gray-400">Status IPO:</span>
            {startup.ipoStatus}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-300">
            <CheckCircle className="text-green-400" size={16} />
            <span className="text-gray-400">Website validado:</span>
            {startup.websiteValidated ? 'Sim' : 'Não'}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Building2 className="text-orange-400" size={16} />
            <span className="text-gray-400">Razão social:</span>
            {formatValue(startup.legalName)}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Linkedin className="text-blue-500" size={16} />
            <span className="text-gray-400">LinkedIn do fundador:</span>
            {formatValue(startup.founderLinkedIn)}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="text-cyan-400" size={16} />
            <span className="text-gray-400">Funcionários:</span>
            {formatValue(startup.employees)}
          </div>
          {startup.solution?.numeroColaboradores && (
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="text-indigo-400" size={16} />
              <span className="text-gray-400">Número de colaboradores:</span>
              {formatValue(startup.solution.numeroColaboradores)}
            </div>
          )}
        </div>
      </div>

      {/* Principais pontos fortes */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-gray-300 mb-2">
          <Award className="text-yellow-400" size={16} />
          <span className="text-gray-400">Principais pontos fortes:</span>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-300 text-sm">
            {formatList(startup.keyStrengths)}
          </p>
        </div>
      </div>

      {/* Parceiros */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-gray-300 mb-2">
          <Building2 className="text-blue-400" size={16} />
          <span className="text-gray-400">Parceiros:</span>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-300 text-sm">
            {formatList(startup.parceiros)}
          </p>
        </div>
      </div>

      {/* Oportunidades */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-gray-300 mb-2">
          <Target className="text-green-400" size={16} />
          <span className="text-gray-400">Oportunidades:</span>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-300 text-sm">
            {formatList(startup.oportunidades)}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Por que foi escolhida:</h4>
            <p className="text-gray-400">{startup.reasonForChoice}</p>
          </div>
          
          {startup.fundadores && startup.fundadores.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Fundadores:</h4>
              <div className="space-y-3">
                {startup.fundadores.map((founder, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h5 className="text-blue-400 font-medium">{formatValue(founder.nome)}</h5>
                    <p className="text-gray-400 text-sm">Formação: {formatValue(founder.formacao)}</p>
                    <p className="text-gray-400 text-sm">Experiência: {formatValue(founder.experiencia)}</p>
                    <p className="text-gray-400 text-sm">Perfil: {formatValue(founder.perfil)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {startup.solution && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Detalhes da Solução:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Porte:</span>
                  <span className="text-white ml-2">{formatValue(startup.solution.porte)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Investimentos:</span>
                  <span className="text-white ml-2">{formatValue(startup.solution.investimentos)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Recebeu Aporte:</span>
                  <span className="text-white ml-2">{formatValue(startup.solution.recebeuAporte)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Valuation:</span>
                  <span className="text-white ml-2">{formatValue(startup.solution.valuation)}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-400">Principais Clientes:</span>
                  <span className="text-white ml-2">{formatValue(startup.solution.principaisClientes)}</span>
                </div>
              </div>
            </div>
          )}

          {startup.problemaSolve && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Problema que Resolve:</h4>
              <p className="text-gray-400">{startup.problemaSolve}</p>
            </div>
          )}

          {startup.technologies && startup.technologies !== 'NÃO DIVULGADO' && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Tecnologias:</h4>
              <p className="text-gray-400">{startup.technologies}</p>
            </div>
          )}

          {startup.tags && startup.tags !== 'NÃO DIVULGADO' && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {startup.tags.split(',').map((tag, index) => (
                  <span key={index} className="bg-blue-600 text-blue-100 px-3 py-1 rounded-full text-sm">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StartupList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [startupLists, setStartupLists] = useState<StartupListType[]>([]);
  const [savedStartups, setSavedStartups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        // Fetch startup lists
        const q = query(
          collection(db, 'startupLists'),
          where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const lists = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StartupListType[];
        
        // Sort by creation date (newest first)
        lists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setStartupLists(lists);

        // Fetch saved startups
        const savedQuery = query(
          collection(db, 'selectedStartups'),
          where('userId', '==', auth.currentUser.uid)
        );
        const savedSnapshot = await getDocs(savedQuery);
        const savedNames = new Set(savedSnapshot.docs.map(doc => doc.data().startupName));
        setSavedStartups(savedNames);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleSaveStartup = async (startup: StartupType, challengeId: string, challengeTitle: string) => {
    if (!auth.currentUser) return;

    const isCurrentlySaved = savedStartups.has(startup.name);

    try {
      if (isCurrentlySaved) {
        // Remove from saved startups
        const savedQuery = query(
          collection(db, 'selectedStartups'),
          where('userId', '==', auth.currentUser.uid),
          where('startupName', '==', startup.name)
        );
        const savedSnapshot = await getDocs(savedQuery);
        
        for (const doc of savedSnapshot.docs) {
          await deleteDoc(doc.ref);
        }

        setSavedStartups(prev => {
          const newSet = new Set(prev);
          newSet.delete(startup.name);
          return newSet;
        });
      } else {
        // Add to saved startups
        await addDoc(collection(db, 'selectedStartups'), {
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
          challengeId,
          challengeTitle,
          startupName: startup.name,
          startupData: startup,
          selectedAt: new Date().toISOString(),
          stage: 'mapeada',
          updatedAt: new Date().toISOString()
        });

        setSavedStartups(prev => new Set([...prev, startup.name]));
      }
    } catch (error) {
      console.error('Error saving startup:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando startups...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex flex-col p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-gray-300 hover:text-white focus:outline-none"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 ml-4">
            <Rocket size={20} className="text-gray-400" />
            <h2 className="text-lg font-medium">{t.startupRecommendations}</h2>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {startupLists.length === 0 ? (
            <div className="text-center py-16">
              <Rocket size={64} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhuma lista de startups encontrada</h3>
              <p className="text-gray-400 mb-6">
                Crie um desafio e converse com a IA para gerar recomendações de startups.
              </p>
              <button
                onClick={() => navigate('/new-challenge')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Criar Desafio
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {startupLists.map((list) => (
                <div key={list.id} className="space-y-6">
                  {/* List Header */}
                  <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-white">{list.challengeTitle}</h2>
                      <span className="text-sm text-blue-200">
                        {formatDate(list.createdAt)}
                      </span>
                    </div>
                    
                    {list.ratingExplanation && (
                      <p className="text-blue-100 mb-4">{list.ratingExplanation}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Project Planning */}
                      {list.projectPlanning && list.projectPlanning.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Target size={16} />
                            Planejamento do Projeto
                          </h4>
                          <div className="space-y-2">
                            {list.projectPlanning.map((phase, index) => (
                              <div key={index} className="bg-blue-800/30 rounded-lg p-3">
                                <h5 className="text-blue-200 font-medium text-sm">{phase.phase}</h5>
                                <p className="text-blue-100 text-xs">{phase.duration}</p>
                                <p className="text-blue-100 text-xs mt-1">{phase.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expected Results */}
                      {list.expectedResults && list.expectedResults.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Award size={16} />
                            Resultados Esperados
                          </h4>
                          <ul className="space-y-1">
                            {list.expectedResults.map((result, index) => (
                              <li key={index} className="text-blue-100 text-sm flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                {result}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Competitive Advantages */}
                      {list.competitiveAdvantages && list.competitiveAdvantages.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Star size={16} />
                            Vantagens Competitivas
                          </h4>
                          <ul className="space-y-1">
                            {list.competitiveAdvantages.map((advantage, index) => (
                              <li key={index} className="text-blue-100 text-sm flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                {advantage}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Startups Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {list.startups?.map((startup) => (
                      <StartupCard
                        key={`${startup.name}-${startup.sequentialNumber}`}
                        startup={startup}
                        onSave={() => handleSaveStartup(startup, list.challengeId || list.id, list.challengeTitle)}
                        isSaved={savedStartups.has(startup.name)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartupList;