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
  const [loading, setLoading] = useState(true);
  const [currentChallengeTitle, setCurrentChallengeTitle] = useState<string>('');

  useEffect(() => {
    const fetchStartupLists = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        // Pegar o ID do desafio atual do localStorage
        const currentChallengeId = localStorage.getItem('current-challenge-id');
        
        let q;
        if (currentChallengeId) {
          // Buscar apenas listas do desafio atual
          q = query(
            collection(db, 'startupLists'),
            where('userId', '==', auth.currentUser.uid),
            where('challengeId', '==', currentChallengeId),
            orderBy('createdAt', 'desc')
          );
        } else {
          // Fallback: buscar todas as listas do usuário
          q = query(
            collection(db, 'startupLists'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
          );
        }
        
        const querySnapshot = await getDocs(q);
        const lists = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StartupListType[];
        
        setStartupLists(lists);
        
        // Definir o título do desafio baseado na primeira lista encontrada
        if (lists.length > 0) {
          setCurrentChallengeTitle(lists[0].challengeTitle || 'Lista de Startups');
        } else {
          setCurrentChallengeTitle('Lista de Startups');
        }
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
    setCurrentChallengeTitle(challengeTitle);
  };

  const handleBack = () => {
    if (selectedStartup) {
      setSelectedStartup(null);
    } else {
      // Voltar para o chat mantendo o desafio atual
      navigate('/');
    }
  };

  const handleSaveStartup = async (startup: StartupType, challengeId: string, challengeTitle: string) => {
    if (!auth.currentUser) return;

    try {
      // Check if startup is already saved
      const existingQuery = query(
        collection(db, 'selectedStartups'),
        where('userId', '==', auth.currentUser.uid),
        where('startupName', '==', startup.name)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        alert('Esta startup já foi salva no seu pipeline!');
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

      alert('Startup salva no pipeline com sucesso!');
    } catch (error) {
      console.error('Error saving startup:', error);
      alert('Erro ao salvar startup');
    }
  };

  const handleRemoveList = async (listId: string) => {
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
        <div className="text-white">Carregando startups...</div>
      </div>
    );
  }

  // Show startup detail card
  if (selectedStartup) {
    return (
      <StartupCard
        startup={selectedStartup}
        challengeTitle={currentChallengeTitle}
        onClose={() => setSelectedStartup(null)}
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
            <h2 className="text-lg font-medium">{currentChallengeTitle}</h2>
          </div>
          <div className="text-sm text-gray-400">
            {startupLists.reduce((total, list) => total + (list.startups?.length || 0), 0)} startups
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {startupLists.length === 0 ? (
            <div className="text-center py-16">
              <Rocket size={64} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhuma startup encontrada</h3>
              <p className="text-gray-400 mb-6">
                Você ainda não tem listas de startups para este desafio. 
                Volte ao chat e peça para a Genie gerar uma lista de startups.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Voltar ao Chat
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {startupLists.map((list) => (
                <div key={list.id} className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{list.challengeTitle}</h3>
                        <p className="text-sm text-gray-400">
                          Gerada em {format(new Date(list.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">
                          {list.startups?.length || 0} startups
                        </span>
                        <button
                          onClick={() => handleRemoveList(list.id)}
                          className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {list.ratingExplanation && (
                    <div className="px-6 py-4 bg-blue-900/20 border-b border-gray-700">
                      <p className="text-blue-200 text-sm">{list.ratingExplanation}</p>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(list.startups || []).map((startup, index) => (
                        <div
                          key={index}
                          onClick={() => handleStartupClick(startup, list.challengeTitle)}
                          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 cursor-pointer hover:from-gray-800 hover:to-gray-700 transition-all duration-300 border border-gray-700 hover:border-gray-600"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-3">
                              <h4 className="text-xl font-bold text-white">{startup.name}</h4>
                              <SocialLinks startup={startup} />
                            </div>
                            <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
                              <span className="text-3xl font-extrabold text-white">{startup.rating}</span>
                              <div className="text-sm text-gray-400 mt-1">Match</div>
                              <StarRating rating={startup.rating} />
                            </div>
                          </div>
                          <p className="text-gray-400 mb-6 line-clamp-3">{startup.description}</p>
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
                          <div className="mt-4 flex justify-between items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveStartup(startup, list.challengeId, list.challengeTitle);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                              <Plus size={16} />
                              Salvar no Pipeline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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