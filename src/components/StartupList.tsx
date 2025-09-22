import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Calendar, Building2, MapPin, Users, Briefcase, Award, 
  Target, Rocket, ArrowLeft, Globe, Box, Linkedin,
  Facebook, Twitter, Instagram, Trash2, FolderOpen, Plus, Check, X
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { StartupType, StartupListType, SocialLink, ChallengeType } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from '../utils/i18n';

interface SavedStartupType {
  id: string;
  userId: string;
  userEmail: string;
  challengeId: string;
  challengeTitle: string;
  startupName: string;
  startupData: StartupType;
  selectedAt: string;
  stage: string;
  updatedAt: string;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
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
      <span className="ml-2 text-sm text-gray-400">({rating})</span>
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

const StartupCard = ({ 
  startup, 
  onSave, 
  isSaved, 
  onViewDetail,
  challengeTitle 
}: { 
  startup: StartupType;
  onSave: (startup: StartupType) => void;
  isSaved: boolean;
  onViewDetail: (startup: StartupType) => void;
  challengeTitle: string;
}) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (saving || isSaved) return;

    setSaving(true);
    await onSave(startup);
    setSaving(false);
  };

  const handleCardClick = () => {
    onViewDetail(startup);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 hover:from-gray-800 hover:to-gray-700 transition-all cursor-pointer border border-gray-700 hover:border-gray-600 shadow-lg hover:shadow-xl"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">{startup.name}</h3>
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
              #{startup.sequentialNumber || 'N/A'}
            </span>
          </div>
          <SocialLinks startup={startup} />
        </div>
        <div className="text-right">
          <StarRating rating={startup.rating} />
        </div>
      </div>

      <p className="text-gray-400 mb-6 line-clamp-3">{startup.description}</p>

      <div className="space-y-3 mb-6">
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

      <div className="mb-4 pt-4 border-t border-gray-700">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400">{startup.reasonForChoice}</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || isSaved}
        className={`w-full py-3 px-4 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl ${
          isSaved
            ? 'bg-green-600 text-white cursor-default'
            : saving
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
        }`}
      >
        {isSaved ? (
          <div className="flex items-center justify-center gap-2">
            <Check size={20} />
            {t.savedToPipeline}
          </div>
        ) : saving ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            {t.saving}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Plus size={20} />
            {t.saveToPipeline}
          </div>
        )}
      </button>
    </div>
  );
};

const StartupDetailCard = ({ startup, onBack, challengeTitle }: { startup: StartupType; onBack: () => void; challengeTitle: string }) => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">{startup.name}</h2>
          <SocialLinks startup={startup} />
        </div>
        <StarRating rating={startup.rating} />
      </div>
      <p className="text-gray-400 mb-6">{startup.description}</p>
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
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400">{startup.reasonForChoice}</p>
        </div>
      </div>
    </div>
  );
};

const StartupList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [startupLists, setStartupLists] = useState<StartupListType[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<StartupType | null>(null);
  const [savedStartups, setSavedStartups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeType | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        // Buscar o desafio atual do localStorage
        const currentChallengeId = localStorage.getItem('current-challenge-id');
        
        if (currentChallengeId) {
          // Buscar dados do desafio atual
          const challengeDoc = await getDoc(doc(db, 'challenges', currentChallengeId));
          if (challengeDoc.exists()) {
            setCurrentChallenge({ id: challengeDoc.id, ...challengeDoc.data() } as ChallengeType);
          }

          // Buscar listas de startups para o desafio atual
          const q = query(
            collection(db, 'startupLists'),
            where('userId', '==', auth.currentUser.uid),
            where('challengeId', '==', currentChallengeId)
          );
          const querySnapshot = await getDocs(q);
          const lists = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as StartupListType[];
          
          setStartupLists(lists);
        } else {
          // Se não há desafio atual, buscar todas as listas do usuário
          const q = query(
            collection(db, 'startupLists'),
            where('userId', '==', auth.currentUser.uid)
          );
          const querySnapshot = await getDocs(q);
          const lists = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as StartupListType[];
          
          setStartupLists(lists);
        }

        // Buscar startups já salvas
        const savedQuery = query(
          collection(db, 'selectedStartups'),
          where('userId', '==', auth.currentUser.uid)
        );
        const savedSnapshot = await getDocs(savedQuery);
        const savedNames = new Set(
          savedSnapshot.docs.map(doc => doc.data().startupName)
        );
        setSavedStartups(savedNames);

      } catch (error) {
        console.error('Error fetching startup lists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleSaveStartup = async (startup: StartupType) => {
    if (!auth.currentUser || !currentChallenge) return;

    try {
      const startupData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        challengeId: currentChallenge.id,
        challengeTitle: currentChallenge.title, // Usar o título atual do desafio
        startupName: startup.name,
        startupData: startup,
        selectedAt: new Date().toISOString(),
        stage: 'mapeada',
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'selectedStartups'), startupData);
      setSavedStartups(prev => new Set([...prev, startup.name]));
    } catch (error) {
      console.error('Error saving startup:', error);
    }
  };

  const handleStartupClick = (startup: StartupType) => {
    setSelectedStartup(startup);
  };

  const handleBack = () => {
    if (selectedStartup) {
      setSelectedStartup(null);
    } else {
      // Voltar para o chat interface do desafio atual
      if (currentChallenge) {
        navigate('/', { state: { challengeId: currentChallenge.id } });
      } else {
        // Fallback: tentar usar o challengeId do localStorage
        const storedChallengeId = localStorage.getItem('current-challenge-id');
        if (storedChallengeId) {
          navigate('/', { state: { challengeId: storedChallengeId } });
        } else {
          navigate('/');
        }
      }
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Obter o título correto para exibir
  const getDisplayTitle = () => {
    if (currentChallenge) {
      return currentChallenge.title;
    }
    
    // Fallback: usar o título da primeira lista se não há desafio atual
    if (startupLists.length > 0) {
      return startupLists[0].challengeTitle;
    }
    
    return 'Lista de Startups';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando startups...</div>
      </div>
    );
  }

  // Show startup detail card
  if (selectedStartup) {
    return (
      <div className="min-h-screen bg-black p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white mb-8"
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar para lista
          </button>

          <StartupDetailCard 
            startup={selectedStartup} 
            onBack={handleBack}
            challengeTitle={getDisplayTitle()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="flex flex-col p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-gray-300 hover:text-white focus:outline-none"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 ml-4">
            <FolderOpen size={20} className="text-gray-400" />
            <h2 className="text-lg font-medium">{getDisplayTitle()}</h2>
          </div>
          <div className="text-sm text-gray-400">
            {startupLists.reduce((total, list) => total + (list.startups?.length || 0), 0)} startups
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {startupLists.length === 0 ? (
            <EmptyStartupListSection navigate={navigate} />
          ) : (
            <div className="space-y-8">
              {startupLists.map((list) => (
                <div key={list.id} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {list.challengeTitle}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Gerada em {formatDate(list.createdAt)} • {list.startups?.length || 0} startups
                      </p>
                    </div>
                  </div>

                  {list.ratingExplanation && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Explicação dos Ratings</h4>
                      <p className="text-gray-300 text-sm">{list.ratingExplanation}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {(list.startups || []).map((startup) => (
                      <StartupCard
                        key={`${list.id}-${startup.name}`}
                        startup={startup}
                        onSave={handleSaveStartup}
                        isSaved={savedStartups.has(startup.name)}
                        onViewDetail={handleStartupClick}
                        challengeTitle={getDisplayTitle()}
                      />
                    ))}
                  </div>

                  {list.projectPlanning && list.projectPlanning.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Target size={20} className="text-blue-400" />
                        Planejamento do Projeto
                      </h4>
                      <div className="space-y-4">
                        {list.projectPlanning.map((phase, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4">
                            <h5 className="text-white font-medium">{phase.phase}</h5>
                            <p className="text-gray-400 text-sm">{phase.duration}</p>
                            <p className="text-gray-300">{phase.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {list.expectedResults && list.expectedResults.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Award size={20} className="text-green-400" />
                        Resultados Esperados
                      </h4>
                      <ul className="space-y-2">
                        {list.expectedResults.map((result, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check size={16} className="text-green-400 mt-1 flex-shrink-0" />
                            <span className="text-gray-300">{result}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {list.competitiveAdvantages && list.competitiveAdvantages.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Rocket size={20} className="text-purple-400" />
                        Vantagens Competitivas
                      </h4>
                      <ul className="space-y-2">
                        {list.competitiveAdvantages.map((advantage, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Star size={16} className="text-purple-400 mt-1 flex-shrink-0" />
                            <span className="text-gray-300">{advantage}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyStartupListSection = ({ navigate }: { navigate: (path: string) => void }) => {
  const { t } = useTranslation();
  const [challenges, setChallenges] = useState<ChallengeType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, 'challenges'),
          where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const userChallenges = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChallengeType[];
        setChallenges(userChallenges);
      } catch (error) {
        console.error('Error fetching challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-pulse text-white text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <FolderOpen size={64} className="text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">Nenhuma startup encontrada</h3>
      <p className="text-gray-400 mb-6">
        Você ainda não gerou listas de startups. Crie desafios e interaja com a IA para receber recomendações.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {challenges.length > 0 && (
          <div className="flex flex-col gap-3 mb-4">
            <h4 className="text-lg font-medium text-white">Seus Desafios:</h4>
            <div className="flex flex-wrap gap-3 justify-center">
              {challenges.map((challenge) => (
                <button
                  key={challenge.id}
                  onClick={() => navigate('/', { state: { challengeId: challenge.id } })}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Target size={20} />
                  {challenge.title}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => navigate('/new-challenge')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Criar Desafio
        </button>
      </div>
    </div>
  );
};

export default StartupList;