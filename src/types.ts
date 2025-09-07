import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Calendar, Building2, MapPin, Users, Briefcase, Award, 
  Target, Rocket, ArrowLeft, Mail, Globe, Box, Linkedin,
  Facebook, Twitter, Instagram, FolderOpen, Plus, Check, X, BarChart3
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, addDoc, where, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { StartupListType, StartupType, SocialLink } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from '../utils/i18n';
import { Link } from 'react-router-dom';

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

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'mapeada', name: 'Mapeada', color: 'bg-yellow-200 text-yellow-800 border-yellow-300', order: 0 },
  { id: 'selecionada', name: 'Selecionada', color: 'bg-blue-200 text-blue-800 border-blue-300', order: 1 },
  { id: 'contatada', name: 'Contatada', color: 'bg-red-200 text-red-800 border-red-300', order: 2 },
  { id: 'entrevistada', name: 'Entrevistada', color: 'bg-green-200 text-green-800 border-green-300', order: 3 },
  { id: 'poc', name: 'POC', color: 'bg-orange-200 text-orange-800 border-orange-300', order: 4 }
];

const StarRating = ({ rating, dataCompleteness }: { rating: number; dataCompleteness?: number }) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
      <span className="text-3xl font-extrabold text-white">{rating}</span>
      <div className="text-sm text-gray-400 mt-1">{t.matchScore}</div>
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
      {dataCompleteness !== undefined && (
        <div className="text-xs text-blue-400 mt-1">
          {dataCompleteness}% completo
        </div>
      )}
    </div>
  );
};

const ProjectTimeline = ({ planning }: { planning: StartupListType['projectPlanning'] }) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-purple-500 before:to-pink-500">
      {(planning || []).map((phase, index) => (
        <div key={index} className="relative flex items-start gap-6 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-blue-600 bg-gray-900 text-blue-600 font-bold">
            {index + 1}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm text-blue-400">{phase.duration}</span>
            <h3 className="text-xl font-bold text-white mb-2">{phase.phase}</h3>
            <p className="text-gray-400">{phase.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const ResultsSection = ({ data }: { data: StartupListType }) => {
  const { t } = useTranslation();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 p-6 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-4">{t.expectedResults}</h3>
        <ul className="space-y-4">
          {(data.expectedResults || []).map((result, index) => (
            <li key={index} className="flex items-start gap-3">
              <Target className="text-blue-400 mt-1" size={20} />
              <span className="text-gray-300">{result}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-6 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-4">{t.competitiveAdvantages}</h3>
        <ul className="space-y-4">
          {(data.competitiveAdvantages || []).map((advantage, index) => (
            <li key={index} className="flex items-start gap-3">
              <Award className="text-purple-400 mt-1" size={20} />
              <span className="text-gray-300">{advantage}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const SocialLinks = ({ startup, className = "" }: { startup: StartupType; className?: string }) => {
  const { t } = useTranslation();
  
  const links: SocialLink[] = [
    {
      type: 'website',
      url: startup.website,
      icon: Globe,
      label: t.website
    },
    {
      type: 'email',
      url: `mailto:${startup.email}`,
      icon: Mail,
      label: t.email
    },
    ...(startup.linkedin && startup.linkedin !== 'NÃO DIVULGADO' ? [{
      type: 'linkedin',
      url: startup.linkedin,
      icon: Linkedin,
      label: t.linkedin
    }] : []),
    ...(startup.founderLinkedIn && startup.founderLinkedIn !== 'NÃO DIVULGADO' ? [{
      type: 'linkedin',
      url: startup.founderLinkedIn,
      icon: Linkedin,
      label: `${t.linkedin} - ${startup.founder}`
    }] : [])
  ].filter(link => link.url && link.url !== 'NÃO DIVULGADO');

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
  onClick, 
  challengeTitle, 
  challengeId,
  onStartupSaved 
}: { 
  startup: StartupType; 
  onClick: () => void;
  challengeTitle: string;
  challengeId: string;
  onStartupSaved: () => void;
}) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [savedStartup, setSavedStartup] = useState<SavedStartupType | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(DEFAULT_STAGES);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!auth.currentUser) return;
      
      try {
        const q = query(
          collection(db, 'selectedStartups'),
          where('userId', '==', auth.currentUser.uid),
          where('startupName', '==', startup.name)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const savedData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as SavedStartupType;
          setSavedStartup(savedData);
        }
      } catch (error) {
        console.error('Error checking if startup is saved:', error);
      }
    };

    checkIfSaved();
  }, [startup.name]);

  useEffect(() => {
    const loadStages = async () => {
      if (!auth.currentUser) return;

      try {
        const stagesDoc = await getDocs(query(collection(db, 'pipelineStages'), where('userId', '==', auth.currentUser.uid)));
        if (!stagesDoc.empty) {
          const userStages = stagesDoc.docs[0].data().stages as PipelineStage[];
          const sortedStages = userStages.sort((a, b) => a.order - b.order);
          setPipelineStages(sortedStages);
        }
      } catch (error) {
        console.error('Error loading stages:', error);
      }
    };

    loadStages();
  }, []);

  const handleSelectStartup = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!auth.currentUser || isSaving) return;

    setIsSaving(true);

    try {
      if (savedStartup) {
        // Remove startup
        await deleteDoc(doc(db, 'selectedStartups', savedStartup.id));
        setSavedStartup(null);
      } else {
        // Add startup with "mapeada" stage
        const docRef = await addDoc(collection(db, 'selectedStartups'), {
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
        
        const newSavedStartup = {
          id: docRef.id,
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email || '',
          challengeId,
          challengeTitle,
          startupName: startup.name,
          startupData: startup,
          selectedAt: new Date().toISOString(),
          stage: 'mapeada',
          updatedAt: new Date().toISOString()
        };
        
        setSavedStartup(newSavedStartup);
      }

      onStartupSaved();
    } catch (error) {
      console.error('Error saving/removing startup:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentStage = () => {
    if (!savedStartup) return null;
    return pipelineStages.find(stage => stage.id === savedStartup.stage);
  };

  const currentStage = getCurrentStage();

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                #{startup.sequentialNumber}
              </span>
              <h2 className="text-xl font-bold text-white">{startup.name}</h2>
            </div>
            <button
              onClick={handleSelectStartup}
              disabled={isSaving}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                savedStartup
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : isSaving
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {savedStartup ? (
                <>
                  <X size={16} />
                  {t.removeFromPipeline || 'Remover'}
                </>
              ) : isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  {t.saving}
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {t.selectStartup}
                </>
              )}
            </button>
          </div>
          {currentStage && (
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${currentStage.color}`}>
                {currentStage.name}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Fundador:</span>
            <span className="text-white">{startup.founder}</span>
          </div>
          <SocialLinks startup={startup} />
        </div>
        <StarRating rating={startup.rating} dataCompleteness={startup.dataCompleteness} />
      </div>
      <p className="text-gray-400 mb-6">{startup.description}</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="text-blue-400" size={16} />
            {startup.foundedYear}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Building2 className="text-purple-400" size={16} />
            {startup.category}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Box className="text-pink-400" size={16} />
            {startup.vertical}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <MapPin className="text-emerald-400" size={16} />
            {startup.city}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="text-blue-400" size={16} />
            {startup.teamSize}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Briefcase className="text-purple-400" size={16} />
            {startup.businessModel}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Globe className="text-pink-400" size={16} />
            {startup.ipoStatus}
          </div>
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

const StartupDetailCard = ({ startup }: { startup: StartupType }) => {
  const { t } = useTranslation();
  const [savedStartup, setSavedStartup] = useState<SavedStartupType | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(DEFAULT_STAGES);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!auth.currentUser) return;
      
      try {
        const q = query(
          collection(db, 'selectedStartups'),
          where('userId', '==', auth.currentUser.uid),
          where('startupName', '==', startup.name)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const savedData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as SavedStartupType;
          setSavedStartup(savedData);
        }
      } catch (error) {
        console.error('Error checking if startup is saved:', error);
      }
    };

    checkIfSaved();
  }, [startup.name]);

  useEffect(() => {
    const loadStages = async () => {
      if (!auth.currentUser) return;

      try {
        const stagesDoc = await getDocs(query(collection(db, 'pipelineStages'), where('userId', '==', auth.currentUser.uid)));
        if (!stagesDoc.empty) {
          const userStages = stagesDoc.docs[0].data().stages as PipelineStage[];
          const sortedStages = userStages.sort((a, b) => a.order - b.order);
          setPipelineStages(sortedStages);
        }
      } catch (error) {
        console.error('Error loading stages:', error);
      }
    };

    loadStages();
  }, []);

  const handleSelectStartup = async () => {
    if (!auth.currentUser || isSaving) return;

    setIsSaving(true);

    try {
      if (savedStartup) {
        // Remove startup
        await deleteDoc(doc(db, 'selectedStartups', savedStartup.id));
        setSavedStartup(null);
      } else {
        // Add startup with "mapeada" stage
        const docRef = await addDoc(collection(db, 'selectedStartups'), {
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
          challengeId: 'detail-view',
          challengeTitle: 'Visualização Individual',
          startupName: startup.name,
          startupData: startup,
          selectedAt: new Date().toISOString(),
          stage: 'mapeada',
          updatedAt: new Date().toISOString()
        });
        
        const newSavedStartup = {
          id: docRef.id,
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email || '',
          challengeId: 'detail-view',
          challengeTitle: 'Visualização Individual',
          startupName: startup.name,
          startupData: startup,
          selectedAt: new Date().toISOString(),
          stage: 'mapeada',
          updatedAt: new Date().toISOString()
        };
        
        setSavedStartup(newSavedStartup);
      }
    } catch (error) {
      console.error('Error saving/removing startup:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentStage = () => {
    if (!savedStartup) return null;
    return pipelineStages.find(stage => stage.id === savedStartup.stage);
  };

  const currentStage = getCurrentStage();
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{startup.name}</h2>
            <button
              onClick={handleSelectStartup}
              disabled={isSaving}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                savedStartup
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : isSaving
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {savedStartup ? (
                <>
                  <X size={16} />
                  {t.removeFromPipeline || 'Remover'}
                </>
              ) : isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  {t.saving}
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {t.selectStartup}
                </>
              )}
            </button>
          </div>
          {currentStage && (
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${currentStage.color}`}>
                {currentStage.name}
              </span>
            </div>
          )}
          <SocialLinks startup={startup} />
        </div>
        <StarRating rating={startup.rating} />
      </div>
      <p className="text-gray-400 mb-6">{startup.description}</p>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-300">
          <Calendar className="text-blue-400" size={16} />
          <span className="text-gray-400">{t.founded}:</span>
          {startup.foundedYear}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Building2 className="text-purple-400" size={16} />
          <span className="text-gray-400">{t.category}:</span>
          {startup.category}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Box className="text-pink-400" size={16} />
          <span className="text-gray-400">{t.vertical}:</span>
          {startup.vertical}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <MapPin className="text-emerald-400" size={16} />
          <span className="text-gray-400">{t.location}:</span>
          {startup.city}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Users className="text-blue-400" size={16} />
          <span className="text-gray-400">{t.teamSize}:</span>
          {startup.teamSize}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Briefcase className="text-purple-400" size={16} />
          <span className="text-gray-400">{t.businessModel}:</span>
          {startup.businessModel}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Globe className="text-pink-400" size={16} />
          <span className="text-gray-400">{t.ipoStatus}:</span>
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
  const [startupData, setStartupData] = useState<StartupListType | null>(null);
  const [selectedStartup, setSelectedStartup] = useState<StartupType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchStartupData = async () => {
      try {
        const q = query(
          collection(db, 'startupLists'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setStartupData({ id: doc.id, ...doc.data() } as StartupListType);
        }
      } catch (error) {
        console.error('Error fetching startup data:', error);
      }
    };

    fetchStartupData();
  }, []);

  const handleStartupClick = (startup: StartupType) => {
    setSelectedStartup(startup);
  };

  const handleBack = () => {
    if (selectedStartup) {
      setSelectedStartup(null);
    } else {
      navigate(-1);
    }
  };

  const handleStartupSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!startupData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">{t.loadingStartups}</div>
      </div>
    );
  }

  const formattedDate = startupData.createdAt 
    ? format(new Date(startupData.createdAt), "dd/MM/yyyy", { locale: ptBR })
    : '';

  if (selectedStartup) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white mb-8"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.backToList}
          </button>

          <StartupDetailCard startup={selectedStartup} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
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
            <h2 className="text-lg font-medium">{startupData.challengeTitle}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{formattedDate}</span>
            <Link
              to="/saved-startups"
              className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
            >
              <BarChart3 size={16} />
              Pipeline CRM
            </Link>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16" key={refreshKey}>
            {startupData.startups.map((startup, index) => (
              <StartupCard
                key={index}
                startup={startup}
                onClick={() => handleStartupClick(startup)}
                challengeTitle={startupData.challengeTitle}
                challengeId={startupData.id}
                onStartupSaved={handleStartupSaved}
              />
            ))}
          </div>

          <div className="space-y-16">
            <section>
              <h2 className="text-2xl font-bold text-white mb-8">{t.proofOfConcept}</h2>
              <ProjectTimeline planning={startupData.projectPlanning} />
            </section>

            <section>
              <ResultsSection data={startupData} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupList;