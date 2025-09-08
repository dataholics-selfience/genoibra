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
  const validItems = list.filter(item => item && item !== 'NÃO DIVULGADO');
  return validItems.length > 0 ? validItems.join(', ') : fallback;
};

const StartupCard = ({ startup, onSave, isSaved }: { startup: StartupType; onSave: () => void; isSaved: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  return (
    <div 
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 cursor-pointer hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{startup.name}</h2>
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
            onClick={handleSave}
            disabled={saving}
            className={`p-3 rounded-full transition-all ${
              isSaved
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {saving ? (
              <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            ) : isSaved ? (
              <HeartOff size={24} />
            ) : (
              <Heart size={24} />
            )}
          </button>
        </div>
      </div>

      <p className="text-gray-400 mb-6">{startup.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
        <div className="flex items-center gap-2 text-gray-300">
          <Users className="text-blue-400" size={16} />
          <span className="text-gray-400">Tamanho da Equipe:</span>
          {formatValue(startup.teamSize)}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Briefcase className="text-purple-400" size={16} />
          <span className="text-gray-400">Modelo de Negócio:</span>
          {formatValue(startup.businessModel)}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Globe className="text-pink-400" size={16} />
          <span className="text-gray-400">Status IPO:</span>
          {formatValue(startup.ipoStatus)}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <CheckCircle className="text-green-400" size={16} />
          <span className="text-gray-400">Website validado:</span>
          {startup.websiteValidated ? 'Sim' : 'Não'}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 border-t border-gray-700 pt-6">
          {/* Razão Social */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Razão Social</h4>
            <p className="text-gray-300">{formatValue(startup.legalName)}</p>
          </div>

          {/* LinkedIn do Fundador */}
          {startup.founderLinkedIn && startup.founderLinkedIn !== 'NÃO DIVULGADO' && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">LinkedIn do Fundador</h4>
              <a 
                href={startup.founderLinkedIn} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {startup.founderLinkedIn}
              </a>
            </div>
          )}

          {/* Principais Pontos Fortes */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Principais Pontos Fortes</h4>
            {startup.keyStrengths && Array.isArray(startup.keyStrengths) && startup.keyStrengths.length > 0 ? (
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                {startup.keyStrengths.filter(strength => strength && strength !== 'NÃO DIVULGADO').map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
                {startup.keyStrengths.filter(strength => strength && strength !== 'NÃO DIVULGADO').length === 0 && (
                  <p className="text-gray-400">Não informado</p>
                )}
              </ul>
            ) : (
              <p className="text-gray-400">Não informado</p>
            )}
          </div>

          {/* Parceiros */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Parceiros</h4>
            <p className="text-gray-300">{formatList(startup.parceiros, 'Nenhum informado')}</p>
          </div>

          {/* Oportunidades */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Oportunidades</h4>
            <p className="text-gray-300">{formatList(startup.oportunidades, 'Nenhuma informada')}</p>
          </div>

          {/* Detalhes da Solução */}
          {startup.solution && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Detalhes da Solução</h4>
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Porte:</span>
                    <span className="text-white ml-2">{formatValue(startup.solution.porte)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Número de colaboradores:</span>
                    <span className="text-white ml-2">{formatValue(startup.solution.numeroColaboradores)}</span>
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
            </div>
          )}

          {/* Problema que Resolve */}
          {startup.problemaSolve && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Problema que Resolve</h4>
              <p className="text-gray-300">{formatValue(startup.problemaSolve)}</p>
            </div>
          )}

          {/* Fundadores */}
          {startup.fundadores && startup.fundadores.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Fundadores</h4>
              <div className="space-y-3">
                {startup.fundadores.map((founder, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-2">{formatValue(founder.nome, `Fundador ${index + 1}`)}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Formação:</span>
                        <span className="text-gray-300 ml-2">{formatValue(founder.formacao)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Experiência:</span>
                        <span className="text-gray-300 ml-2">{formatValue(founder.experiencia)}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-400">Perfil:</span>
                        <span className="text-gray-300 ml-2">{formatValue(founder.perfil)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Razão da Escolha */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-2">Por que foi escolhida</h4>
            <p className="text-gray-400">{formatValue(startup.reasonForChoice)}</p>
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

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        // Fetch startup lists for current user
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
        console.error('Error fetching startup lists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleSaveStartup = async (startup: StartupType, challengeId: string, challengeTitle: string) => {
    if (!auth.currentUser) return;

    try {
      const isCurrentlySaved = savedStartups.has(startup.name);
      
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
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma startup encontrada</h3>
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
          <div className="text-sm text-gray-400">
            {startupLists.reduce((total, list) => total + (list.startups?.length || 0), 0)} startups encontradas
          </div>
        </div>

        <div className="space-y-12">
          {startupLists.map((list) => (
            <div key={list.id} className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">{list.challengeTitle}</h2>
                  <span className="text-sm text-gray-400">
                    {format(new Date(list.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                
                {list.ratingExplanation && (
                  <p className="text-gray-400 mb-4">{list.ratingExplanation}</p>
                )}

                {/* Project Planning */}
                {list.projectPlanning && list.projectPlanning.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Planejamento do Projeto</h3>
                    <div className="space-y-3">
                      {list.projectPlanning.map((phase, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Target size={16} className="text-blue-400" />
                            <h4 className="font-medium text-white">{phase.phase}</h4>
                            <span className="text-sm text-gray-400">({phase.duration})</span>
                          </div>
                          <p className="text-gray-300 text-sm">{phase.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expected Results */}
                {list.expectedResults && list.expectedResults.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Resultados Esperados</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {list.expectedResults.map((result, index) => (
                        <li key={index}>{result}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Competitive Advantages */}
                {list.competitiveAdvantages && list.competitiveAdvantages.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Vantagens Competitivas</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {list.competitiveAdvantages.map((advantage, index) => (
                        <li key={index}>{advantage}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Startups Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {list.startups?.map((startup) => (
                  <StartupCard
                    key={`${startup.name}-${list.id}`}
                    startup={startup}
                    onSave={() => handleSaveStartup(startup, list.challengeId || list.id, list.challengeTitle)}
                    isSaved={savedStartups.has(startup.name)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StartupList;