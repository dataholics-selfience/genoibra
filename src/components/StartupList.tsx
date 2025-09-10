import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Calendar, Building2, MapPin, Users, Briefcase, Award, Edit, Save, X,
  Target, Rocket, ArrowLeft, Mail, Globe, Box, Linkedin,
  Facebook, Twitter, Instagram, FolderOpen, Plus, Check, BarChart3, Download,
  Phone, DollarSign, TrendingUp, CheckCircle, AlertCircle
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, addDoc, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { StartupListType, StartupType, SocialLink } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from '../utils/i18n';
import { Link } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

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

const StarRating = ({ rating }: { rating: number }) => {
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
    ...(startup.socialLinks?.linkedin ? [{
      type: 'linkedin',
      url: startup.socialLinks.linkedin,
      icon: Linkedin,
      label: t.linkedin
    }] : []),
    ...(startup.socialLinks?.facebook ? [{
      type: 'facebook',
      url: startup.socialLinks.facebook,
      icon: Facebook,
      label: t.facebook
    }] : []),
    ...(startup.socialLinks?.twitter ? [{
      type: 'twitter',
      url: startup.socialLinks.twitter,
      icon: Twitter,
      label: t.twitter
    }] : []),
    ...(startup.socialLinks?.instagram ? [{
      type: 'instagram',
      url: startup.socialLinks.instagram,
      icon: Instagram,
      label: t.instagram
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

const formatValue = (value: any, fallback: string = 'Não informado'): string => {
  if (!value || value === 'NÃO DIVULGADO' || value === 'N/A' || value === '') {
    return fallback;
  }
  return String(value);
};

const StartupCard = ({ 
  startup, 
  onClick, 
  challengeTitle, 
  challengeId,
  onStartupSaved,
  onStartupUpdated
}: { 
  startup: StartupType; 
  onClick: () => void;
  challengeTitle: string;
  challengeId: string;
  onStartupSaved: () => void;
  onStartupUpdated: (updatedStartup: StartupType) => void;
}) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [savedStartup, setSavedStartup] = useState<SavedStartupType | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(DEFAULT_STAGES);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<StartupType>(startup);

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

  const handleSaveEdit = async () => {
    try {
      onStartupUpdated(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating startup:', error);
    }
  };

  const handleEditChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSelectStartup = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!auth.currentUser || isSaving) return;

    setIsSaving(true);

    try {
      if (savedStartup) {
        await deleteDoc(doc(db, 'selectedStartups', savedStartup.id));
        setSavedStartup(null);
      } else {
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
  const displayData = isEditing ? editData : startup;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 hover:scale-105 transition-transform">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => handleEditChange('name', e.target.value)}
                className="text-xl font-bold bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h2 
                className="text-xl font-bold text-white cursor-pointer hover:text-blue-300"
                onClick={onClick}
              >
                {displayData.name}
              </h2>
            )}
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-bold">
                #{displayData.sequentialNumber || 'N/A'}
              </span>
              {displayData.websiteValidated && (
                <CheckCircle size={16} className="text-green-400" title="Website validado" />
              )}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-gray-400 hover:text-white p-1 rounded"
            >
              {isEditing ? <X size={16} /> : <Edit size={16} />}
            </button>
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
          <SocialLinks startup={displayData} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <StarRating rating={displayData.rating} />
          {isEditing && (
            <select
              value={editData.rating}
              onChange={(e) => handleEditChange('rating', parseInt(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <textarea
          value={editData.description}
          onChange={(e) => handleEditChange('description', e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-300 mb-6 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      ) : (
        <p className="text-gray-400 mb-6 cursor-pointer hover:text-gray-300" onClick={onClick}>
          {formatValue(displayData.description)}
        </p>
      )}
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="text-blue-400" size={16} />
            {isEditing ? (
              <input
                type="text"
                value={editData.foundedYear}
                onChange={(e) => handleEditChange('foundedYear', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              formatValue(displayData.foundedYear)
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Building2 className="text-purple-400" size={16} />
            {isEditing ? (
              <input
                type="text"
                value={editData.category}
                onChange={(e) => handleEditChange('category', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              formatValue(displayData.category)
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Box className="text-pink-400" size={16} />
            {isEditing ? (
              <input
                type="text"
                value={editData.vertical}
                onChange={(e) => handleEditChange('vertical', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              formatValue(displayData.vertical)
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <MapPin className="text-emerald-400" size={16} />
            {isEditing ? (
              <input
                type="text"
                value={editData.city}
                onChange={(e) => handleEditChange('city', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              formatValue(displayData.city)
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="text-blue-400" size={16} />
            {isEditing ? (
              <input
                type="text"
                value={editData.teamSize}
                onChange={(e) => handleEditChange('teamSize', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              formatValue(displayData.teamSize)
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Briefcase className="text-purple-400" size={16} />
            {isEditing ? (
              <input
                type="text"
                value={editData.businessModel}
                onChange={(e) => handleEditChange('businessModel', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              formatValue(displayData.businessModel)
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Globe className="text-pink-400" size={16} />
            {isEditing ? (
              <select
                value={editData.ipoStatus}
                onChange={(e) => handleEditChange('ipoStatus', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="acquired">Acquired</option>
                <option value="NÃO DIVULGADO">Não Divulgado</option>
              </select>
            ) : (
              formatValue(displayData.ipoStatus)
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <TrendingUp className="text-yellow-400" size={16} />
            <span className="text-sm">
              Completude: {displayData.dataCompleteness || 50}%
            </span>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-3 mb-4">
        {displayData.employees && displayData.employees !== 'NÃO DIVULGADO' && (
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="text-green-400" size={16} />
            <span className="text-sm">Funcionários: {formatValue(displayData.employees)}</span>
          </div>
        )}
        {displayData.stage && displayData.stage !== 'NÃO DIVULGADO' && (
          <div className="flex items-center gap-2 text-gray-300">
            <Rocket className="text-orange-400" size={16} />
            <span className="text-sm">Estágio: {formatValue(displayData.stage)}</span>
          </div>
        )}
        {displayData.founder && displayData.founder !== 'NÃO DIVULGADO' && (
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="text-purple-400" size={16} />
            <span className="text-sm">Fundador: {formatValue(displayData.founder)}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {displayData.tags && displayData.tags !== 'NÃO DIVULGADO' && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {displayData.tags.split(',').map((tag, index) => (
              <span key={index} className="bg-blue-900/50 text-blue-200 px-2 py-1 rounded-full text-xs">
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {isEditing && (
        <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
          <button
            onClick={handleSaveEdit}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Save size={16} />
            Salvar
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditData(startup);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <X size={16} />
            Cancelar
          </button>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="bg-gray-800 rounded-lg p-4">
          {isEditing ? (
            <textarea
              value={editData.reasonForChoice}
              onChange={(e) => handleEditChange('reasonForChoice', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Razão da escolha..."
            />
          ) : (
            <p className="text-gray-400">{formatValue(displayData.reasonForChoice, 'Razão da escolha não informada')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const StartupDetailCard = ({ 
  startup, 
  onStartupUpdated 
}: { 
  startup: StartupType;
  onStartupUpdated: (updatedStartup: StartupType) => void;
}) => {
  const { t } = useTranslation();
  const [savedStartup, setSavedStartup] = useState<SavedStartupType | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(DEFAULT_STAGES);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<StartupType>(startup);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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

  const handleSaveEdit = async () => {
    try {
      onStartupUpdated(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating startup:', error);
    }
  };

  const handleEditChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFounderChange = (index: number, field: string, value: string) => {
    const updatedFounders = [...(editData.fundadores || [])];
    if (!updatedFounders[index]) {
      updatedFounders[index] = { nome: '', formacao: '', experiencia: '', perfil: '' };
    }
    updatedFounders[index] = {
      ...updatedFounders[index],
      [field]: value
    };
    setEditData(prev => ({
      ...prev,
      fundadores: updatedFounders
    }));
  };

  const addFounder = () => {
    setEditData(prev => ({
      ...prev,
      fundadores: [
        ...(prev.fundadores || []),
        { nome: '', formacao: '', experiencia: '', perfil: '' }
      ]
    }));
  };

  const removeFounder = (index: number) => {
    setEditData(prev => ({
      ...prev,
      fundadores: (prev.fundadores || []).filter((_, i) => i !== index)
    }));
  };

  const handleSelectStartup = async () => {
    if (!auth.currentUser || isSaving) return;

    setIsSaving(true);

    try {
      if (savedStartup) {
        await deleteDoc(doc(db, 'selectedStartups', savedStartup.id));
        setSavedStartup(null);
      } else {
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

  const exportToPDF = async () => {
    setIsExportingPDF(true);
    
    try {
      const element = document.getElementById('startup-detail-content');
      if (!element) {
        console.error('Element not found for PDF export');
        return;
      }

      const opt = {
        margin: 1,
        filename: `${startup.name.replace(/[^a-zA-Z0-9]/g, '_')}_startup_profile.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getCurrentStage = () => {
    if (!savedStartup) return null;
    return pipelineStages.find(stage => stage.id === savedStartup.stage);
  };

  const currentStage = getCurrentStage();
  const displayData = isEditing ? editData : startup;
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6">
      {/* Header with actions */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => handleEditChange('name', e.target.value)}
                className="text-2xl font-bold bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h2 className="text-2xl font-bold text-white">{displayData.name}</h2>
            )}
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-bold">
                #{displayData.sequentialNumber || 'N/A'}
              </span>
              {displayData.websiteValidated && (
                <CheckCircle size={16} className="text-green-400" title="Website validado" />
              )}
            </div>
          </div>
          {currentStage && (
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${currentStage.color}`}>
                {currentStage.name}
              </span>
            </div>
          )}
          <SocialLinks startup={displayData} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              {isEditing ? <X size={16} /> : <Edit size={16} />}
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
            <button
              onClick={exportToPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              {isExportingPDF ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {isExportingPDF ? 'Gerando...' : 'Salvar PDF'}
            </button>
            <button
              onClick={handleSelectStartup}
              disabled={isSaving}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                savedStartup
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : isSaving
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
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
          <StarRating rating={displayData.rating} />
          {isEditing && (
            <select
              value={editData.rating}
              onChange={(e) => handleEditChange('rating', parseInt(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* PDF Export Content */}
      <div id="startup-detail-content" className="space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Descrição</h3>
          {isEditing ? (
            <textarea
              value={editData.description}
              onChange={(e) => handleEditChange('description', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          ) : (
            <p className="text-gray-400">{formatValue(displayData.description)}</p>
          )}
        </div>

        {/* Basic Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-md font-bold text-white">Informações Básicas</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="text-blue-400" size={16} />
                <span className="text-gray-400">Fundação:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.foundedYear}
                    onChange={(e) => handleEditChange('foundedYear', e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  formatValue(displayData.foundedYear)
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Building2 className="text-purple-400" size={16} />
                <span className="text-gray-400">Categoria:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.category}
                    onChange={(e) => handleEditChange('category', e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  formatValue(displayData.category)
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Box className="text-pink-400" size={16} />
                <span className="text-gray-400">Vertical:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.vertical}
                    onChange={(e) => handleEditChange('vertical', e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  formatValue(displayData.vertical)
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="text-emerald-400" size={16} />
                <span className="text-gray-400">Localização:</span>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editData.city}
                      onChange={(e) => handleEditChange('city', e.target.value)}
                      placeholder="Cidade"
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={editData.state}
                      onChange={(e) => handleEditChange('state', e.target.value)}
                      placeholder="Estado"
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={editData.country}
                      onChange={(e) => handleEditChange('country', e.target.value)}
                      placeholder="País"
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <span>
                    {formatValue(displayData.city)}
                    {displayData.state && displayData.state !== 'NÃO DIVULGADO' && `, ${displayData.state}`}
                    {displayData.country && displayData.country !== 'NÃO DIVULGADO' && `, ${displayData.country}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-bold text-white">Dados Operacionais</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-300">
                <Users className="text-blue-400" size={16} />
                <span className="text-gray-400">Tamanho da Equipe:</span