import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Calendar, Building2, MapPin, Users, Briefcase, Award, 
  Target, Rocket, ArrowLeft, Globe, Box, Linkedin,
  Facebook, Twitter, Instagram, Trash2, FolderOpen, Plus, Check, X
} from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { StartupType, SocialLink, StartupListType } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StartupCard from './StartupCard';
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
      <span className="ml-2 text-white font-bold">{rating}/5</span>
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

const StartupList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [startupLists, setStartupLists] = useState<StartupListType[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<StartupType | null>(null);
  const [selectedChallengeTitle, setSelectedChallengeTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [savingStartup, setSavingStartup] = useState<string | null>(null);

  useEffect(() => {
    const fetchStartupLists = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        const q = query(
          collection(db, 'startupLists'),
          where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const lists = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StartupListType[];
        
        // Sort in memory to avoid composite index requirement
        lists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setStartupLists(lists);
      } catch (error) {
        console.error('Error fetching startup lists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStartupLists();
  }, [navigate]);

  const handleStartupClick = (startup: StartupType, challengeTitle: string) => {
    setSelectedStartup(startup);
    setSelectedChallengeTitle(challengeTitle);
  };

  const handleBack = () => {
    if (selectedStartup) {
      setSelectedStartup(null);
      setSelectedChallengeTitle('');
    } else {
      navigate('/');
    }
  };

  const handleSaveStartup = async (startup: StartupType, challengeId: string, challengeTitle: string) => {
    if (!auth.currentUser || savingStartup === startup.name) return;

    setSavingStartup(startup.name);

    try {
      // Check if startup is already saved
      const existingQuery = query(
        collection(db, 'selectedStartups'),
        where('userId', '==', auth.currentUser.uid),
        where('startupName', '==', startup.name)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        console.log('Startup already saved');
        setSavingStartup(null);
        return;
      }

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

      console.log('Startup saved successfully');
    } catch (error) {
      console.error('Error saving startup:', error);
    } finally {
      setSavingStartup(null);
    }
  };

  const handleRemoveStartupList = async (listId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja remover esta lista de startups?');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'startupLists', listId));
      setStartupLists(prev => prev.filter(list => list.id !== listId));
    } catch (error) {
      console.error('Error removing startup list:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando listas de startups...</div>
      </div>
    );
  }

  // Show startup detail card
  if (selectedStartup) {
    return (
      <StartupCard 
        startup={selectedStartup} 
        challengeTitle={selectedChallengeTitle}
        onClose={handleBack}
      />
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
            <h2 className="text-lg font-medium">{t.startupLists}</h2>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {startupLists.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen size={64} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhuma lista encontrada</h3>
              <p className="text-gray-400 mb-6">
                Você ainda não tem listas de startups. Crie um desafio para gerar sua primeira lista.
              </p>
              <button
                onClick={() => navigate('/new-challenge')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Criar Desafio
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {startupLists.map((list) => (
                <div key={list.id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{list.challengeTitle}</h3>
                      <p className="text-gray-400 text-sm">
                        Criada em {format(new Date(list.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-blue-400 text-sm">
                        {list.startups?.length || 0} startups encontradas
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveStartupList(list.id)}
                      className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {list.ratingExplanation && (
                    <div className="bg-gray-700 rounded-lg p-4 mb-6">
                      <h4 className="text-white font-medium mb-2">Explicação dos Ratings</h4>
                      <p className="text-gray-300 text-sm">{list.ratingExplanation}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(list.startups || []).map((startup, index) => (
                      <div
                        key={index}
                        onClick={() => handleStartupClick(startup, list.challengeTitle)}
                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 cursor-pointer hover:from-gray-800 hover:to-gray-700 transition-all duration-300 border border-gray-700 hover:border-gray-600"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-3">
                            <h4 className="text-lg font-bold text-white">{startup.name}</h4>
                            <SocialLinks startup={startup} />
                          </div>
                          <div className="text-right">
                            <StarRating rating={startup.rating} />
                            <span className="text-xs text-gray-500 mt-1 block">
                              #{startup.sequentialNumber || index + 1}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-400 mb-4 text-sm line-clamp-3">{startup.description}</p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Calendar className="text-blue-400" size={14} />
                            <span className="text-gray-400">Fundação:</span>
                            {startup.foundedYear}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Building2 className="text-purple-400" size={14} />
                            <span className="text-gray-400">Categoria:</span>
                            {startup.category}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Box className="text-pink-400" size={14} />
                            <span className="text-gray-400">Vertical:</span>
                            {startup.vertical}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <MapPin className="text-emerald-400" size={14} />
                            <span className="text-gray-400">Localização:</span>
                            {startup.city}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Users className="text-blue-400" size={14} />
                            <span className="text-gray-400">Equipe:</span>
                            {startup.teamSize}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Briefcase className="text-purple-400" size={14} />
                            <span className="text-gray-400">Modelo:</span>
                            {startup.businessModel}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Globe className="text-pink-400" size={14} />
                            <span className="text-gray-400">IPO:</span>
                            {startup.ipoStatus}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-700">
                          <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-gray-400 text-sm">{startup.reasonForChoice}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveStartup(startup, list.challengeId || '', list.challengeTitle);
                            }}
                            disabled={savingStartup === startup.name}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                              savingStartup === startup.name
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                          >
                            {savingStartup === startup.name ? (
                              <>
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              <>
                                <Plus size={16} />
                                Salvar no Pipeline
                              </>
                            )}
                          </button>
                        </div>
                      </div>
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