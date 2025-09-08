import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Calendar, Building2, MapPin, Users, Briefcase, Award, 
  Target, Rocket, ArrowLeft, Globe, Box, Linkedin,
  Facebook, Twitter, Instagram, Trash2, FolderOpen, Plus, Check, X, BarChart3
  Mail, Phone, User, TrendingUp, DollarSign, CheckCircle, Download,
  Shield, Code, Tag, Zap, ExternalLink
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { StartupType, StartupListType, SocialLink } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from '../utils/i18n';
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

const formatValue = (value: any, fallback: string = 'Não informado'): string => {
  if (!value || value === 'NÃO DIVULGADO' || value === 'N/A' || value === '') {
    return fallback;
  }
  return String(value);
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
  ].filter(link => link.url && link.url !== 'mailto:' && !link.url.includes('NÃO DIVULGADO'));

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
  isSaved, 
  onToggleSave,
  onClick
}: { 
  startup: StartupType;
  isSaved: boolean;
  onToggleSave: (startup: StartupType) => void;
  onClick: () => void;
}) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isToggling) return;

    setIsToggling(true);
    await onToggleSave(startup);
    setIsToggling(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 cursor-pointer hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-700 hover:border-gray-600"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">{startup.name}</h3>
            <div className="flex items-center gap-2">
              {startup.sequentialNumber && (
                <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full font-bold">
                  #{startup.sequentialNumber}
                </span>
              )}
              {startup.websiteValidated && (
                <CheckCircle size={16} className="text-green-500" title="Website Validado" />
              )}
            </div>
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

      <p className="text-gray-400 mb-6 leading-relaxed">{startup.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
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
            {startup.state && startup.state !== 'NÃO DIVULGADO' && `, ${startup.state}`}
            {startup.country && startup.country !== 'NÃO DIVULGADO' && `, ${startup.country}`}
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
            <TrendingUp className="text-pink-400" size={16} />
            <span className="text-gray-400">Status IPO:</span>
            {formatValue(startup.ipoStatus)}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Award className="text-yellow-400" size={16} />
            <span className="text-gray-400">Funcionários:</span>
            {formatValue(startup.employees)}
          </div>
        </div>
      </div>

      {/* Additional Fields */}
      <div className="space-y-3 mb-6">
        {startup.legalName && startup.legalName !== 'NÃO DIVULGADO' && (
          <div className="flex items-center gap-2 text-gray-300">
            <Shield className="text-blue-400" size={16} />
            <span className="text-gray-400">Razão Social:</span>
            {startup.legalName}
          </div>
        )}
        
        {startup.founder && startup.founder !== 'NÃO DIVULGADO' && (
          <div className="flex items-center gap-2 text-gray-300">
            <User className="text-green-400" size={16} />
            <span className="text-gray-400">Fundador:</span>
            {startup.founder}
          </div>
        )}

        {startup.founderLinkedIn && startup.founderLinkedIn !== 'NÃO DIVULGADO' && (
          <div className="flex items-center gap-2 text-gray-300">
            <Linkedin className="text-blue-500" size={16} />
            <span className="text-gray-400">LinkedIn do Fundador:</span>
            <a 
              href={startup.founderLinkedIn} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Ver perfil
            </a>
          </div>
        )}

        {startup.stage && startup.stage !== 'NÃO DIVULGADO' && (
          <div className="flex items-center gap-2 text-gray-300">
            <Target className="text-purple-400" size={16} />
            <span className="text-gray-400">Estágio:</span>
            {startup.stage}
          </div>
        )}

        {startup.technologies && startup.technologies !== 'NÃO DIVULGADO' && (
          <div className="flex items-center gap-2 text-gray-300">
            <Code className="text-cyan-400" size={16} />
            <span className="text-gray-400">Tecnologias:</span>
            {startup.technologies}
          </div>
        )}

        {startup.dataCompleteness && (
          <div className="flex items-center gap-2 text-gray-300">
            <BarChart3 className="text-orange-400" size={16} />
            <span className="text-gray-400">Completude dos Dados:</span>
            <span className="text-orange-400 font-bold">{startup.dataCompleteness}%</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {startup.tags && startup.tags !== 'NÃO DIVULGADO' && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="text-pink-400" size={16} />
            <span className="text-gray-400 text-sm">Tags:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {startup.tags.split(',').map((tag, index) => (
              <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs border border-gray-600">
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Strengths */}
      {startup.keyStrengths && startup.keyStrengths.length > 0 && startup.keyStrengths[0] !== 'NÃO DIVULGADO' && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-yellow-400" size={16} />
            <span className="text-gray-400 text-sm">Principais Forças:</span>
          </div>
          <div className="space-y-1">
            {startup.keyStrengths.map((strength, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-gray-300 text-sm">{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solution Details */}
      {startup.solution && (
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Building2 className="text-blue-400" size={16} />
            Detalhes da Solução
          </h4>
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            {startup.solution.porte && startup.solution.porte !== 'NÃO DIVULGADO' && (
              <div className="flex justify-between">
                <span className="text-gray-400">Porte:</span>
                <span className="text-white">{startup.solution.porte}</span>
              </div>
            )}
            {startup.solution.investimentos && startup.solution.investimentos !== 'NÃO DIVULGADO' && (
              <div className="flex justify-between">
                <span className="text-gray-400">Investimentos:</span>
                <span className="text-white">{startup.solution.investimentos}</span>
              </div>
            )}
            {startup.solution.recebeuAporte && startup.solution.recebeuAporte !== 'NÃO DIVULGADO' && (
              <div className="flex justify-between">
                <span className="text-gray-400">Recebeu Aporte:</span>
                <span className="text-white">{startup.solution.recebeuAporte}</span>
              </div>
            )}
            {startup.solution.valuation && startup.solution.valuation !== 'NÃO DIVULGADO' && (
              <div className="flex justify-between">
                <span className="text-gray-400">Valuation:</span>
                <span className="text-white">{startup.solution.valuation}</span>
              </div>
            )}
            {startup.solution.principaisClientes && startup.solution.principaisClientes !== 'NÃO DIVULGADO' && (
              <div className="flex justify-between">
                <span className="text-gray-400">Principais Clientes:</span>
                <span className="text-white">{startup.solution.principaisClientes}</span>
              </div>
            )}
            {startup.solution.numeroColaboradores && startup.solution.numeroColaboradores !== 'NÃO DIVULGADO' && (
              <div className="flex justify-between">
                <span className="text-gray-400">Colaboradores:</span>
                <span className="text-white">{startup.solution.numeroColaboradores}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Founders */}
      {startup.fundadores && startup.fundadores.length > 0 && (
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <User className="text-green-400" size={16} />
            Fundadores
          </h4>
          <div className="space-y-3">
            {startup.fundadores.map((founder, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-3">
                <div className="font-medium text-white mb-1">{formatValue(founder.nome)}</div>
                {founder.formacao && founder.formacao !== 'NÃO DIVULGADO' && (
                  <div className="text-sm text-gray-400">Formação: {founder.formacao}</div>
                )}
                {founder.experiencia && founder.experiencia !== 'NÃO DIVULGADO' && (
                  <div className="text-sm text-gray-400">Experiência: {founder.experiencia}</div>
                )}
                {founder.perfil && founder.perfil !== 'NÃO DIVULGADO' && (
                  <div className="text-sm text-gray-400">Perfil: {founder.perfil}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partners */}
      {startup.parceiros && startup.parceiros.length > 0 && (
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Users className="text-purple-400" size={16} />
            Parceiros
          </h4>
          <div className="space-y-2">
            {startup.parceiros.map((partner, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-3">
                <span className="text-gray-300">{typeof partner === 'string' ? partner : JSON.stringify(partner)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {startup.oportunidades && startup.oportunidades.length > 0 && (
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Target className="text-yellow-400" size={16} />
            Oportunidades
          </h4>
          <div className="space-y-2">
            {startup.oportunidades.map((opportunity, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-3">
                <span className="text-gray-300">{typeof opportunity === 'string' ? opportunity : JSON.stringify(opportunity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problem Solution */}
      {startup.problemaSolve && startup.problemaSolve !== 'NÃO DIVULGADO' && (
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Target className="text-red-400" size={16} />
            Problema que Resolve
          </h4>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-300 leading-relaxed">{startup.problemaSolve}</p>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Razão da Escolha</h4>
          <p className="text-gray-400">{formatValue(startup.reasonForChoice, 'Razão da escolha não informada')}</p>
        </div>
      </div>
    </div>
  );
};

const StartupDetailCard = ({ startup, onBack }: { startup: StartupType; onBack: () => void }) => {
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
            Voltar para lista
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

        {/* PDF Export Content */}
        <div id="startup-detail-content" className="bg-white text-black p-8 rounded-lg">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div className="border-b border-gray-300 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-black">{startup.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                      {startup.sequentialNumber && (
                        <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-bold">
                          #{startup.sequentialNumber}
                        </span>
                      )}
                      {startup.websiteValidated && (
                        <CheckCircle size={16} className="text-green-600" />
                      )}
                    </div>
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
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xl font-bold text-black mb-4">Descrição</h3>
                <p className="text-gray-700 leading-relaxed">{formatValue(startup.description)}</p>
              </div>

              {/* Problem Solution */}
              {startup.problemaSolve && startup.problemaSolve !== 'NÃO DIVULGADO' && (
                <div>
                  <h3 className="text-xl font-bold text-black mb-4">Problema que Resolve</h3>
                  <p className="text-gray-700 leading-relaxed">{startup.problemaSolve}</p>
                </div>
              )}

              {/* Basic Information */}
              <div>
                <h3 className="text-xl font-bold text-black mb-4">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Categoria</label>
                      <p className="text-black">{formatValue(startup.category)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Vertical</label>
                      <p className="text-black">{formatValue(startup.vertical)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Ano de Fundação</label>
                      <p className="text-black">{formatValue(startup.foundedYear)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Modelo de Negócio</label>
                      <p className="text-black">{formatValue(startup.businessModel)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Estágio</label>
                      <p className="text-black">{formatValue(startup.stage)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Localização</label>
                      <p className="text-black">
                        {formatValue(startup.city)}
                        {startup.state && startup.state !== 'NÃO DIVULGADO' && `, ${startup.state}`}
                        {startup.country && startup.country !== 'NÃO DIVULGADO' && `, ${startup.country}`}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Tamanho da Equipe</label>
                      <p className="text-black">{formatValue(startup.teamSize)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Funcionários</label>
                      <p className="text-black">{formatValue(startup.employees)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Status IPO</label>
                      <p className="text-black">{formatValue(startup.ipoStatus)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Completude dos Dados</label>
                      <p className="text-black">{startup.dataCompleteness || 50}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technologies and Tags */}
              <div>
                <h3 className="text-xl font-bold text-black mb-4">Tecnologias e Tags</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Tecnologias</label>
                    <p className="text-black">{formatValue(startup.technologies)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Tags</label>
                    {startup.tags && startup.tags !== 'NÃO DIVULGADO' ? (
                      <div className="flex flex-wrap gap-2">
                        {startup.tags.split(',').map((tag, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-200">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">Nenhuma tag informada</p>
                    )}
                  </div>

                  {startup.keyStrengths && startup.keyStrengths.length > 0 && startup.keyStrengths[0] !== 'NÃO DIVULGADO' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Principais Forças</label>
                      <div className="space-y-1">
                        {startup.keyStrengths.map((strength, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            <span className="text-black">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Solution Details */}
              {startup.solution && (
                <div>
                  <h3 className="text-xl font-bold text-black mb-4">Detalhes da Solução</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Porte</label>
                      <p className="text-black">{formatValue(startup.solution.porte)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Investimentos</label>
                      <p className="text-black">{formatValue(startup.solution.investimentos)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Recebeu Aporte</label>
                      <p className="text-black">{formatValue(startup.solution.recebeuAporte)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Valuation</label>
                      <p className="text-black">{formatValue(startup.solution.valuation)}</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Principais Clientes</label>
                      <p className="text-black">{formatValue(startup.solution.principaisClientes)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Número de Colaboradores</label>
                      <p className="text-black">{formatValue(startup.solution.numeroColaboradores)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Founders */}
              {startup.fundadores && startup.fundadores.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-black mb-4">Fundadores</h3>
                  <div className="space-y-4">
                    {startup.fundadores.map((founder, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-black font-medium mb-3">Fundador {index + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                            <p className="text-black">{formatValue(founder.nome)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Formação</label>
                            <p className="text-black">{formatValue(founder.formacao)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Experiência</label>
                            <p className="text-black">{formatValue(founder.experiencia)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Perfil</label>
                            <p className="text-black">{formatValue(founder.perfil)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Partners */}
              {startup.parceiros && startup.parceiros.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-black mb-4">Parceiros</h3>
                  <div className="space-y-2">
                    {startup.parceiros.map((partner, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-black">{typeof partner === 'string' ? partner : JSON.stringify(partner)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunities */}
              {startup.oportunidades && startup.oportunidades.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-black mb-4">Oportunidades</h3>
                  <div className="space-y-2">
                    {startup.oportunidades.map((opportunity, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-black">{typeof opportunity === 'string' ? opportunity : JSON.stringify(opportunity)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-black mb-4">Contato</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-blue-600" size={20} />
                    <a href={`mailto:${startup.email}`} className="text-blue-600 hover:text-blue-700">
                      {formatValue(startup.email)}
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="text-green-600" size={20} />
                    <span className="text-black">
                      {formatValue(startup.telefone)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="text-green-600" size={20} />
                    <span className="text-gray-600 text-sm">Celular:</span>
                    <span className="text-black">
                      {formatValue(startup.celular)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Globe className="text-purple-600" size={20} />
                    <a href={startup.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                      Website {startup.websiteValidated && <CheckCircle size={14} className="inline ml-1 text-green-600" />}
                    </a>
                  </div>

                  {startup.linkedin && startup.linkedin !== 'NÃO DIVULGADO' && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="text-blue-700" size={20} />
                      <a href={startup.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                        LinkedIn
                      </a>
                    </div>
                  )}

                  {startup.founderLinkedIn && startup.founderLinkedIn !== 'NÃO DIVULGADO' && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="text-blue-700" size={20} />
                      <span className="text-gray-600 text-sm">Fundador:</span>
                      <a href={startup.founderLinkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                        LinkedIn do Fundador
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-black mb-4">Métricas</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Rating</span>
                    <div className="flex items-center gap-1">
                      <span className="text-black font-bold">{startup.rating}</span>
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completude dos Dados</span>
                    <span className="text-black font-bold">{startup.dataCompleteness || 50}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Website Validado</span>
                    <span className={`font-bold ${startup.websiteValidated ? 'text-green-600' : 'text-red-600'}`}>
                      {startup.websiteValidated ? 'Sim' : 'Não'}
                    </span>
                  </div>

                  {startup.sequentialNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Número Sequencial</span>
                      <span className="text-black font-bold">#{startup.sequentialNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Information */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-black mb-4">Informações Legais</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Razão Social</label>
                    <p className="text-black">{formatValue(startup.legalName)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Fundador Principal</label>
                    <p className="text-black">{formatValue(startup.founder)}</p>
                  </div>
                </div>
              </div>

              {/* Technologies */}
              {startup.technologies && startup.technologies !== 'NÃO DIVULGADO' && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-black mb-4">Tecnologias</h3>
                  <p className="text-black">{startup.technologies}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reason for Choice */}
          <div className="mt-8 pt-6 border-t border-gray-300">
            <h3 className="text-xl font-bold text-black mb-4">Razão da Escolha</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700">{formatValue(startup.reasonForChoice, 'Razão da escolha não informada')}</p>
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
  const [savedStartups, setSavedStartups] = useState<SavedStartupType[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<StartupType | null>(null);
  const [loading, setLoading] = useState(true);
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
        const lists = querySnapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() } as StartupListType)
        );
        
        // Sort by creation date (most recent first)
        lists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setStartupLists(lists);

        // Fetch saved startups
        const savedQuery = query(
          collection(db, 'selectedStartups'),
          where('userId', '==', auth.currentUser.uid)
        );
        const savedSnapshot = await getDocs(savedQuery);
        const saved = savedSnapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() } as SavedStartupType)
        );
        setSavedStartups(saved);
      } catch (error) {
        console.error('Error fetching startup lists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleStartupClick = (startup: StartupType) => {
    setSelectedStartup(startup);
  };

  const handleBack = () => {
    if (selectedStartup) {
      setSelectedStartup(null);
    } else {
      navigate('/');
    }
  };

  const toggleSaveStartup = async (startup: StartupType) => {
    if (!auth.currentUser) return;

    const existingSaved = savedStartups.find(
      saved => saved.startupName === startup.name
    );

    if (existingSaved) {
      // Remove from saved
      try {
        await deleteDoc(doc(db, 'selectedStartups', existingSaved.id));
        setSavedStartups(prev => prev.filter(saved => saved.id !== existingSaved.id));
      } catch (error) {
        console.error('Error removing startup:', error);
      }
    } else {
      // Add to saved
      try {
        const currentList = startupLists[0]; // Get the most recent list
        if (!currentList) return;

        const savedData = {
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
          challengeId: currentList.challengeId,
          challengeTitle: currentList.challengeTitle,
          startupName: startup.name,
          startupData: startup,
          selectedAt: new Date().toISOString(),
          stage: 'mapeada',
          updatedAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'selectedStartups'), savedData);
        setSavedStartups(prev => [...prev, { id: docRef.id, ...savedData }]);
      } catch (error) {
        console.error('Error saving startup:', error);
      }
    }
  };

  const isStartupSaved = (startupName: string) => {
    return savedStartups.some(saved => saved.startupName === startupName);
  };

  const exportAllToPDF = async () => {
    setIsExportingPDF(true);
    
    try {
      const element = document.getElementById('startup-list-content');
      if (!element) {
        console.error('Element not found for PDF export');
        return;
      }

      const opt = {
        margin: 1,
        filename: `startup_list_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
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

  // Get all startups from all lists
  const allStartups = startupLists.flatMap(list => list.startups || []);

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
            <h2 className="text-lg font-medium">{t.startupList}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {allStartups.length} startup{allStartups.length !== 1 ? 's' : ''}
            </span>
            {allStartups.length > 0 && (
              <button
                onClick={exportAllToPDF}
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
            )}
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {startupLists.length === 0 ? (
            <div className="text-center py-16">
              <Rocket size={64} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhuma lista de startups</h3>
              <p className="text-gray-400 mb-6">
                Você ainda não gerou nenhuma lista de startups. Crie um desafio para começar.
              </p>
              <button
                onClick={() => navigate('/new-challenge')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Criar Desafio
              </button>
            </div>
          ) : (
            <div id="startup-list-content">
              {startupLists.map((list, listIndex) => (
                <div key={list.id} className="mb-12">
                  {/* List Header */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-white">{list.challengeTitle}</h2>
                      <span className="text-sm text-gray-400">
                        {format(new Date(list.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    
                    {list.ratingExplanation && (
                      <p className="text-gray-300 mb-4">{list.ratingExplanation}</p>
                    )}

                    {/* Project Planning */}
                    {list.projectPlanning && list.projectPlanning.length > 0 && (
                      <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-bold text-white mb-4">Planejamento do Projeto</h3>
                        <div className="space-y-4">
                          {list.projectPlanning.map((phase, index) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4">
                              <h4 className="font-medium text-white">{phase.phase}</h4>
                              <p className="text-sm text-gray-400 mb-1">Duração: {phase.duration}</p>
                              <p className="text-gray-300">{phase.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expected Results and Competitive Advantages */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {list.expectedResults && list.expectedResults.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-6">
                          <h3 className="text-lg font-bold text-white mb-4">Resultados Esperados</h3>
                          <ul className="space-y-2">
                            {list.expectedResults.map((result, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Target size={16} className="text-green-400 mt-1 flex-shrink-0" />
                                <span className="text-gray-300">{result}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {list.competitiveAdvantages && list.competitiveAdvantages.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-6">
                          <h3 className="text-lg font-bold text-white mb-4">Vantagens Competitivas</h3>
                          <ul className="space-y-2">
                            {list.competitiveAdvantages.map((advantage, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Award size={16} className="text-yellow-400 mt-1 flex-shrink-0" />
                                <span className="text-gray-300">{advantage}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Startups Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {(list.startups || []).map((startup) => (
                      <StartupCard
                        key={`${listIndex}-${startup.sequentialNumber || startup.name}`}
                        startup={startup}
                        isSaved={isStartupSaved(startup.name)}
                        onToggleSave={toggleSaveStartup}
                        onClick={() => handleStartupClick(startup)}
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