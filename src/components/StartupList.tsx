import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Calendar, Building2, MapPin, Users, Briefcase, Award, 
  Target, Rocket, ArrowLeft, Globe, Box, Linkedin,
  Facebook, Twitter, Instagram, Heart, HeartOff, CheckCircle, Shield
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { StartupType, StartupListType, SocialLink } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from '../utils/i18n';

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

const StartupCard = ({ 
  startup, 
  onSave, 
  isSaved, 
  onUnsave 
}: { 
  startup: StartupType;
  onSave: (startup: StartupType) => void;
  isSaved: boolean;
  onUnsave: (startup: StartupType) => void;
}) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isToggling) return;

    setIsToggling(true);

    try {
      if (isSaved) {
        await onUnsave(startup);
      } else {
        await onSave(startup);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const formatValue = (value: any, fallback: string = 'Não informado'): string => {
    if (!value || value === 'NÃO DIVULGADO' || value === 'N/A' || value === '') {
      return fallback;
    }
    return String(value);
  };

  const formatList = (list: any[], fallback: string = 'Não informado'): string => {
    if (!Array.isArray(list) || list.length === 0) {
      return fallback;
    }
    const filteredList = list.filter(item => item && item !== 'NÃO DIVULGADO');
    return filteredList.length > 0 ? filteredList.join(', ') : fallback;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-700 hover:border-gray-600">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{startup.name}</h2>
            {startup.websiteValidated && (
              <CheckCircle size={20} className="text-green-400" title="Website validado" />
            )}
          </div>
          <SocialLinks startup={startup} />
        </div>
        <div className="flex items-center gap-3">
          <StarRating rating={startup.rating} />
          <button
            onClick={handleToggleSave}
            disabled={isToggling}
            className={`p-2 rounded-full transition-all ${
              isToggling
                ? 'text-gray-500 cursor-not-allowed'
                : isSaved
                ? 'text-red-500 hover:text-red-400 hover:bg-red-900/20'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-900/20'
            }`}
          >
            {isToggling ? (
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : isSaved ? (
              <Heart size={24} className="fill-current" />
            ) : (
              <HeartOff size={24} />
            )}
          </button>
        </div>
      </div>

      <p className="text-gray-400 mb-6">{startup.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="text-blue-400" size={16} />
            <span className="text-gray-400">Fundação:</span>
            {formatValue(startup.foundedYear)}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Building2 className="text-purple-400" size={16} />
            <span className="text-gray-400">Categoria:</span>
            {formatValue(startup.category)}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Box className="text-pink-400" size={16} />
            <span className="text-gray-400">Vertical:</span>
            {formatValue(startup.vertical)}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <MapPin className="text-emerald-400" size={16} />
            <span className="text-gray-400">Localização:</span>
            {formatValue(startup.city)}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="text-blue-400" size={16} />
            <span className="text-gray-400">Equipe:</span>
            {formatValue(startup.teamSize)}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Briefcase className="text-purple-400" size={16} />
            <span className="text-gray-400">Modelo:</span>
            {formatValue(startup.businessModel)}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Globe className="text-pink-400" size={16} />
            <span className="text-gray-400">IPO:</span>
            {formatValue(startup.ipoStatus)}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Shield className="text-green-400" size={16} />
            <span className="text-gray-400">Razão Social:</span>
            {formatValue(startup.legalName)}
          </div>
        </div>
      </div>

      {/* Key Strengths */}
      {startup.keyStrengths && startup.keyStrengths.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Principais Pontos Fortes:</h4>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-gray-300 text-sm">{formatList(startup.keyStrengths)}</p>
          </div>
        </div>
      )}

      {/* Partners */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Parceiros:</h4>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-300 text-sm">{formatList(startup.parceiros)}</p>
        </div>
      </div>

      {/* Opportunities */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Oportunidades:</h4>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-300 text-sm">{formatList(startup.oportunidades)}</p>
        </div>
      </div>

      {/* Solution Details */}
      {startup.solution && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Detalhes da Solução:</h4>
          <div className="bg-gray-800 rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Colaboradores:</span>
              <span className="text-gray-300">{formatValue(startup.solution.numeroColaboradores)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Porte:</span>
              <span className="text-gray-300">{formatValue(startup.solution.porte)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Investimentos:</span>
              <span className="text-gray-300">{formatValue(startup.solution.investimentos)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Founder LinkedIn */}
      {startup.founderLinkedIn && startup.founderLinkedIn !== 'NÃO DIVULGADO' && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">LinkedIn do Fundador:</h4>
          <div className="bg-gray-800 rounded-lg p-3">
            <a 
              href={startup.founderLinkedIn} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Linkedin size={16} />
              Ver perfil do fundador
            </a>
          </div>
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
  const [selectedList, setSelectedList] = useState<StartupListType | null>(null);

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
        const lists = querySnapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() } as StartupListType)
        );
        
        // Sort by creation date (newest first)
        lists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setStartupLists(lists);

        // Set the most recent list as selected by default
        if (lists.length > 0) {
          setSelectedList(lists[0]);
        }

        // Fetch saved startups
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
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleSaveStartup = async (startup: StartupType) => {
    if (!auth.currentUser || !selectedList) return;

    try {
      await addDoc(collection(db, 'selectedStartups'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        challengeId: selectedList.challengeId || '',
        challengeTitle: selectedList.challengeTitle,
        startupName: startup.name,
        startupData: startup,
        selectedAt: new Date().toISOString(),
        stage: 'mapeada',
        updatedAt: new Date().toISOString()
      });

      setSavedStartups(prev => new Set([...prev, startup.name]));
    } catch (error) {
      console.error('Error saving startup:', error);
    }
  };

  const handleUnsaveStartup = async (startup: StartupType) => {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, 'selectedStartups'),
        where('userId', '==', auth.currentUser.uid),
        where('startupName', '==', startup.name)
      );
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      setSavedStartups(prev => {
        const newSet = new Set(prev);
        newSet.delete(startup.name);
        return newSet;
      });
    } catch (error) {
      console.error('Error unsaving startup:', error);
    }
  };

  const formatDate = (date: string) => {
    const listDate = new Date(date);
    return format(listDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando startups...</div>
      </div>
    );
  }

  if (startupLists.length === 0) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <button
              onClick={handleBack}
              className="text-gray-300 hover:text-white mr-4"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-white">Lista de Startups</h1>
          </div>
          
          <div className="text-center py-16">
            <Rocket size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma lista encontrada</h3>
            <p className="text-gray-400 mb-6">
              Você ainda não gerou nenhuma lista de startups. Crie um desafio para começar!
            </p>
            <button
              onClick={() => navigate('/new-challenge')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Criar Desafio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="text-gray-300 hover:text-white mr-4"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-white">Lista de Startups</h1>
          </div>
        </div>

        {/* List Selector */}
        {startupLists.length > 1 && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Selecione uma lista de startups:
            </label>
            <select
              value={selectedList?.id || ''}
              onChange={(e) => {
                const list = startupLists.find(l => l.id === e.target.value);
                setSelectedList(list || null);
              }}
              className="w-full max-w-md px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {startupLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.challengeTitle} - {formatDate(list.createdAt)}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedList && (
          <>
            {/* List Info */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-2">{selectedList.challengeTitle}</h2>
              <p className="text-gray-400 mb-4">{selectedList.ratingExplanation}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Criada em {formatDate(selectedList.createdAt)}</span>
                <span>•</span>
                <span>{selectedList.startups?.length || 0} startups</span>
              </div>
            </div>

            {/* Startups Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {selectedList.startups?.map((startup) => (
                <StartupCard
                  key={startup.name}
                  startup={startup}
                  onSave={handleSaveStartup}
                  isSaved={savedStartups.has(startup.name)}
                  onUnsave={handleUnsaveStartup}
                />
              )) || []}
            </div>

            {/* Project Planning */}
            {selectedList.projectPlanning && selectedList.projectPlanning.length > 0 && (
              <div className="mt-12 bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Target size={20} className="text-blue-400" />
                  Planejamento do Projeto
                </h3>
                <div className="space-y-4">
                  {selectedList.projectPlanning.map((phase, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white">{phase.phase}</h4>
                        <span className="text-blue-400 font-medium">{phase.duration}</span>
                      </div>
                      <p className="text-gray-300">{phase.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expected Results */}
            {selectedList.expectedResults && selectedList.expectedResults.length > 0 && (
              <div className="mt-8 bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Award size={20} className="text-green-400" />
                  Resultados Esperados
                </h3>
                <ul className="space-y-2">
                  {selectedList.expectedResults.map((result, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-300">
                      <span className="text-green-400 mt-1">•</span>
                      {result}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Competitive Advantages */}
            {selectedList.competitiveAdvantages && selectedList.competitiveAdvantages.length > 0 && (
              <div className="mt-8 bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Target size={20} className="text-purple-400" />
                  Vantagens Competitivas
                </h3>
                <ul className="space-y-2">
                  {selectedList.competitiveAdvantages.map((advantage, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-300">
                      <span className="text-purple-400 mt-1">•</span>
                      {advantage}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StartupList;