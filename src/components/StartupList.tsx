import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Calendar, Building2, MapPin, Users, Briefcase, Award, 
  Target, Rocket, ArrowLeft, Globe, Box, Linkedin,
  Facebook, Twitter, Instagram, Heart, HeartOff, Filter, 
  SortAsc, SortDesc, Download, FileText, Search, X, 
  CheckCircle, AlertCircle, Plus, Trash2, Edit2, Save
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { StartupType, StartupListType, SocialLink } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2pdf from 'html2pdf.js';
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
      <span className="ml-2 text-white font-bold">{rating}</span>
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
  onUnsave,
  onViewDetails 
}: { 
  startup: StartupType;
  onSave: (startup: StartupType) => void;
  isSaved: boolean;
  onUnsave: (startup: StartupType) => void;
  onViewDetails: (startup: StartupType) => void;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      if (isSaved) {
        await onUnsave(startup);
      } else {
        await onSave(startup);
      }
    } catch (error) {
      console.error('Error processing save/unsave:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardClick = () => {
    onViewDetails(startup);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 hover:from-gray-800 hover:to-gray-700 transition-all duration-300 cursor-pointer border border-gray-700 hover:border-gray-600 shadow-lg hover:shadow-xl"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">{startup.name}</h3>
            <button
              onClick={handleSaveClick}
              disabled={isProcessing}
              className={`p-2 rounded-full transition-all ${
                isProcessing
                  ? 'text-gray-500 cursor-not-allowed'
                  : isSaved
                  ? 'text-red-500 hover:text-red-400 hover:bg-red-900/20'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-900/20'
              }`}
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : isSaved ? (
                <Heart size={24} className="fill-current" />
              ) : (
                <HeartOff size={24} />
              )}
            </button>
          </div>
          <SocialLinks startup={startup} />
        </div>
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center ml-4">
          <span className="text-3xl font-extrabold text-white">{startup.rating}</span>
          <div className="text-sm text-gray-400 mt-1">Match Score</div>
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
    </div>
  );
};

const StartupDetailCard = ({ startup, onBack }: { startup: StartupType; onBack: () => void }) => {
  const { t } = useTranslation();
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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

  return (
    <div className="min-h-screen bg-black p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.backToList || 'Voltar para lista'}
          </button>
          <button
            onClick={exportToPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {isExportingPDF ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isExportingPDF ? 'Gerando...' : 'Salvar PDF'}
          </button>
        </div>

        <div id="startup-detail-content" className="bg-white text-black p-8 rounded-lg">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-black">{startup.name}</h1>
              <SocialLinks startup={startup} />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={24}
                    className={`${
                      star <= startup.rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-2xl font-bold text-black">{startup.rating}/5</div>
              <div className="text-sm text-gray-600">Match Score</div>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6 leading-relaxed">{startup.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="text-blue-600" size={16} />
                <span className="font-medium">Fundação:</span>
                {startup.foundedYear}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Building2 className="text-purple-600" size={16} />
                <span className="font-medium">Categoria:</span>
                {startup.category}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Box className="text-pink-600" size={16} />
                <span className="font-medium">Vertical:</span>
                {startup.vertical}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="text-emerald-600" size={16} />
                <span className="font-medium">Localização:</span>
                {startup.city}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="text-blue-600" size={16} />
                <span className="font-medium">Tamanho da Equipe:</span>
                {startup.teamSize}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Briefcase className="text-purple-600" size={16} />
                <span className="font-medium">Modelo de Negócio:</span>
                {startup.businessModel}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-300 pt-6">
            <h3 className="text-lg font-bold text-black mb-3">Razão da Escolha</h3>
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-gray-700">{startup.reasonForChoice}</p>
            </div>
          </div>
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
  const [savedStartups, setSavedStartups] = useState<SavedStartupType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'foundedYear'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterVertical, setFilterVertical] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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
        
        setStartupLists(lists);

        // Fetch saved startups
        const savedQuery = query(
          collection(db, 'selectedStartups'),
          where('userId', '==', auth.currentUser.uid)
        );
        const savedSnapshot = await getDocs(savedQuery);
        const saved = savedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SavedStartupType[];
        
        setSavedStartups(saved);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const getAllStartups = (): StartupType[] => {
    const allStartups: StartupType[] = [];
    let sequentialNumber = 1;

    startupLists.forEach(list => {
      if (list.startups && Array.isArray(list.startups)) {
        list.startups.forEach(startup => {
          allStartups.push({
            ...startup,
            sequentialNumber: sequentialNumber++
          });
        });
      }
    });

    return allStartups;
  };

  const getFilteredAndSortedStartups = (): StartupType[] => {
    let startups = getAllStartups();

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      startups = startups.filter(startup =>
        startup.name.toLowerCase().includes(term) ||
        startup.description.toLowerCase().includes(term) ||
        startup.category.toLowerCase().includes(term) ||
        startup.vertical.toLowerCase().includes(term) ||
        startup.city.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (filterCategory) {
      startups = startups.filter(startup => startup.category === filterCategory);
    }

    // Apply vertical filter
    if (filterVertical) {
      startups = startups.filter(startup => startup.vertical === filterVertical);
    }

    // Apply sorting
    startups.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'foundedYear':
          aValue = parseInt(a.foundedYear) || 0;
          bValue = parseInt(b.foundedYear) || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return startups;
  };

  const getUniqueCategories = (): string[] => {
    const categories = new Set<string>();
    getAllStartups().forEach(startup => {
      if (startup.category) categories.add(startup.category);
    });
    return Array.from(categories).sort();
  };

  const getUniqueVerticals = (): string[] => {
    const verticals = new Set<string>();
    getAllStartups().forEach(startup => {
      if (startup.vertical) verticals.add(startup.vertical);
    });
    return Array.from(verticals).sort();
  };

  const isStartupSaved = (startup: StartupType): boolean => {
    return savedStartups.some(saved => saved.startupName === startup.name);
  };

  const handleSaveStartup = async (startup: StartupType) => {
    if (!auth.currentUser) return;

    try {
      // Find the challenge this startup belongs to
      const parentList = startupLists.find(list => 
        list.startups && list.startups.some(s => s.name === startup.name)
      );

      if (!parentList) {
        console.error('Parent challenge not found for startup:', startup.name);
        return;
      }

      const savedStartupData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        challengeId: parentList.challengeId || parentList.id,
        challengeTitle: parentList.challengeTitle,
        startupName: startup.name,
        startupData: startup,
        selectedAt: new Date().toISOString(),
        stage: 'mapeada',
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'selectedStartups'), savedStartupData);
      
      setSavedStartups(prev => [...prev, {
        id: docRef.id,
        ...savedStartupData
      }]);

    } catch (error) {
      console.error('Error saving startup:', error);
    }
  };

  const handleUnsaveStartup = async (startup: StartupType) => {
    if (!auth.currentUser) return;

    try {
      const savedStartup = savedStartups.find(saved => saved.startupName === startup.name);
      if (!savedStartup) return;

      await deleteDoc(doc(db, 'selectedStartups', savedStartup.id));
      setSavedStartups(prev => prev.filter(saved => saved.id !== savedStartup.id));
    } catch (error) {
      console.error('Error unsaving startup:', error);
    }
  };

  const handleViewDetails = (startup: StartupType) => {
    setSelectedStartup(startup);
  };

  const handleBack = () => {
    if (selectedStartup) {
      setSelectedStartup(null);
    } else {
      navigate('/');
    }
  };

  const exportAllToPDF = async () => {
    setIsExportingPDF(true);
    
    try {
      const startups = getFilteredAndSortedStartups();
      
      // Create a temporary element with all startups
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.color = 'black';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.padding = '20px';

      const htmlContent = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="color: #333; margin: 0; font-size: 28px;">Lista de Startups Recomendadas</h1>
          <p style="color: #666; margin: 10px 0 0 0;">Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          <p style="color: #666; margin: 5px 0 0 0;">Total: ${startups.length} startups</p>
        </div>
        
        ${startups.map((startup, index) => `
          <div style="margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; padding: 20px; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
              <div>
                <h2 style="color: #333; margin: 0 0 10px 0; font-size: 20px;">${startup.name}</h2>
                <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 10px;">
                  <span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                    #${startup.sequentialNumber || index + 1}
                  </span>
                  ${startup.websiteValidated ? '<span style="color: #10b981; font-size: 12px;">✓ Verificado</span>' : ''}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 24px; font-weight: bold; color: #333;">${startup.rating}/5</div>
                <div style="font-size: 12px; color: #666;">Match Score</div>
                <div style="display: flex; gap: 2px; margin-top: 5px;">
                  ${[1, 2, 3, 4, 5].map(star => 
                    `<span style="color: ${star <= startup.rating ? '#fbbf24' : '#d1d5db'};">★</span>`
                  ).join('')}
                </div>
              </div>
            </div>
            
            <p style="color: #555; margin-bottom: 15px; line-height: 1.6;">${startup.description}</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div>
                <div style="margin-bottom: 8px;"><strong>Fundação:</strong> ${startup.foundedYear}</div>
                <div style="margin-bottom: 8px;"><strong>Categoria:</strong> ${startup.category}</div>
                <div style="margin-bottom: 8px;"><strong>Vertical:</strong> ${startup.vertical}</div>
                <div style="margin-bottom: 8px;"><strong>Localização:</strong> ${startup.city}</div>
              </div>
              <div>
                <div style="margin-bottom: 8px;"><strong>Equipe:</strong> ${startup.teamSize}</div>
                <div style="margin-bottom: 8px;"><strong>Modelo:</strong> ${startup.businessModel}</div>
                <div style="margin-bottom: 8px;"><strong>Status IPO:</strong> ${startup.ipoStatus}</div>
                <div style="margin-bottom: 8px;"><strong>Website:</strong> <a href="${startup.website}" style="color: #3b82f6;">${startup.website}</a></div>
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Razão da Escolha:</h4>
              <p style="margin: 0; color: #555; line-height: 1.5;">${startup.reasonForChoice}</p>
            </div>
          </div>
        `).join('')}
      `;

      tempDiv.innerHTML = htmlContent;
      document.body.appendChild(tempDiv);

      const opt = {
        margin: 0.5,
        filename: `startups_recomendadas_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait'
        }
      };

      await html2pdf().set(opt).from(tempDiv).save();
      
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterVertical('');
    setSortBy('rating');
    setSortOrder('desc');
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
    return <StartupDetailCard startup={selectedStartup} onBack={handleBack} />;
  }

  const filteredStartups = getFilteredAndSortedStartups();
  const categories = getUniqueCategories();
  const verticals = getUniqueVerticals();

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
            <Rocket size={20} className="text-gray-400" />
            <h2 className="text-lg font-medium">{t.recommendedStartups}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{filteredStartups.length} startups</span>
            <button
              onClick={exportAllToPDF}
              disabled={isExportingPDF || filteredStartups.length === 0}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              {isExportingPDF ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              {isExportingPDF ? 'Gerando...' : 'Exportar PDF'}
            </button>
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
                Você ainda não tem listas de startups. Crie um desafio para receber recomendações personalizadas.
              </p>
              <button
                onClick={() => navigate('/new-challenge')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Criar Desafio
              </button>
            </div>
          ) : (
            <>
              {/* Filters and Search */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Search */}
                  <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar startups..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  {/* Vertical Filter */}
                  <select
                    value={filterVertical}
                    onChange={(e) => setFilterVertical(e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os verticais</option>
                    {verticals.map(vertical => (
                      <option key={vertical} value={vertical}>{vertical}</option>
                    ))}
                  </select>

                  {/* Sort */}
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'rating' | 'name' | 'foundedYear')}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="rating">Rating</option>
                      <option value="name">Nome</option>
                      <option value="foundedYear">Ano</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-colors"
                    >
                      {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                    </button>
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchTerm || filterCategory || filterVertical || sortBy !== 'rating' || sortOrder !== 'desc') && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                  >
                    <X size={14} />
                    Limpar filtros
                  </button>
                )}
              </div>

              {/* Startups Grid */}
              {filteredStartups.length === 0 ? (
                <div className="text-center py-16">
                  <Search size={64} className="text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Nenhuma startup encontrada</h3>
                  <p className="text-gray-400 mb-6">
                    Tente ajustar os filtros ou termos de busca para encontrar startups.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Limpar Filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredStartups.map((startup) => (
                    <StartupCard
                      key={`${startup.name}-${startup.sequentialNumber}`}
                      startup={startup}
                      onSave={handleSaveStartup}
                      isSaved={isStartupSaved(startup)}
                      onUnsave={handleUnsaveStartup}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartupList;