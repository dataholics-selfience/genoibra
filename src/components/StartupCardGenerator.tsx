import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { StartupType } from '../types';
import html2pdf from 'html2pdf.js';

interface StartupCardGeneratorProps {
  startup: StartupType;
  challengeTitle: string;
  onClose: () => void;
}

const StartupCardGenerator = ({ startup, challengeTitle, onClose }: StartupCardGeneratorProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const formatValue = (value: any, fallback: string = 'NÃO DIVULGADO'): string => {
    if (!value || value === 'NÃO DIVULGADO' || value === 'N/A' || value === '') {
      return fallback;
    }
    return String(value);
  };

  const formatFounders = (): string => {
    if (!startup.fundadores || startup.fundadores.length === 0) {
      return formatValue(startup.founder, 'NÃO DIVULGADO');
    }
    
    return startup.fundadores.map(founder => {
      const parts = [];
      if (founder.nome) parts.push(founder.nome);
      if (founder.formacao) parts.push(`formado em ${founder.formacao}`);
      if (founder.experiencia) parts.push(`com experiência em ${founder.experiencia}`);
      return parts.join(': ');
    }).join('\n• ');
  };

  const formatOpportunities = (): string => {
    if (startup.oportunidades && Array.isArray(startup.oportunidades) && startup.oportunidades.length > 0) {
      return startup.oportunidades
        .filter(opp => opp && opp !== 'NÃO DIVULGADO')
        .map((opp, index) => `${index + 1}. ${opp}`)
        .join('\n\n');
    }
    
    // Fallback para oportunidades genéricas baseadas na categoria/vertical
    const genericOpportunities = [
      `Análises prescritivas para decisões de sucessão, promoção e retenção.`,
      `Estruturação de projetos de dados em RH com foco em desenvolvimento de talentos.`,
      `Insights para engajamento e cultura organizacional.`
    ];
    
    return genericOpportunities.map((opp, index) => `${index + 1}. ${opp}`).join('\n\n');
  };

  const formatFoundersSection = (): JSX.Element => {
    if (!startup.fundadores || startup.fundadores.length === 0) {
      return (
        <div className="mb-2">
          <span className="font-semibold">• {formatValue(startup.founder)}</span>
        </div>
      );
    }
    
    return (
      <>
        {startup.fundadores.map((founder, index) => (
          <div key={index} className="mb-2">
            <span className="font-semibold">• {formatValue(founder.nome)}: </span>
            {founder.formacao && (
              <span>formado em {founder.formacao}</span>
            )}
            {founder.experiencia && (
              <span>, com experiência em {founder.experiencia}</span>
            )}
            {founder.perfil && (
              <span>. {founder.perfil}</span>
            )}
          </div>
        ))}
      </>
    );
  };

  const exportToPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const cardElement = document.getElementById('startup-card-content');
      if (!cardElement) {
        console.error('Card element not found');
        return;
      }

      const opt = {
        margin: 0.5,
        filename: `${startup.name.replace(/[^a-zA-Z0-9]/g, '_')}_card.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          backgroundColor: '#ffffff',
          width: 1200,
          height: 800
        },
        jsPDF: { 
          unit: 'in', 
          format: [11.69, 8.27], // A4 landscape
          orientation: 'landscape' 
        }
      };

      await html2pdf().set(opt).from(cardElement).save();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-800">Card da Startup</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={exportToPDF}
              disabled={isGeneratingPDF}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isGeneratingPDF
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isGeneratingPDF ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Salvar PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6 bg-gray-100">
          <div 
            id="startup-card-content"
            className="bg-white rounded-lg shadow-lg"
            style={{ 
              width: '1200px', 
              height: '800px',
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              lineHeight: '1.4',
              position: 'relative',
              margin: '0 auto'
            }}
          >
            {/* Header */}
            <div className="bg-white p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-red-600">
                  {challengeTitle || 'Employee Experience e People Analytics'}
                </h1>
                <div className="flex items-center gap-6">
                  <span className="text-red-600 font-bold text-lg">inovabra</span>
                  <span className="text-red-600 font-bold text-lg">bradesco</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
              <div className="grid grid-cols-12 gap-6 mb-6">
                {/* Left Column - Logo and Basic Info */}
                <div className="col-span-3">
                  {/* Logo Placeholder */}
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-xl">
                      {startup.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-bold text-gray-800">NOME: </span>
                      <span className="text-gray-700">{startup.name}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">SITE: </span>
                      <span className="text-blue-600">{formatValue(startup.website)}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">SEDE: </span>
                      <span className="text-gray-700">
                        {formatValue(startup.city)}
                        {startup.state && startup.state !== 'NÃO DIVULGADO' && `, ${startup.state}`}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">FUNDADOR: </span>
                      <span className="text-gray-700">
                        {startup.fundadores && startup.fundadores.length > 0 
                          ? startup.fundadores.map(f => f.nome).filter(n => n).join(', ')
                          : formatValue(startup.founder)
                        }
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">PORTE: </span>
                      <span className="text-gray-700">
                        {formatValue(startup.solution?.porte || startup.teamSize)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Column - Financial Info */}
                <div className="col-span-5 space-y-2 text-sm">
                  <div>
                    <span className="font-bold text-gray-800">INVESTIMENTOS: </span>
                    <span className="text-gray-700">
                      {formatValue(startup.solution?.investimentos)}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">RECEBEU APORTE: </span>
                    <span className="text-gray-700">
                      {formatValue(startup.solution?.recebeuAporte)}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">STAGE: </span>
                    <span className="text-gray-700">
                      {formatValue(startup.stage || startup.solution?.stage)}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">VALUATION: </span>
                    <span className="text-gray-700">
                      {formatValue(startup.solution?.valuation)}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">PRINCIPAIS CLIENTES: </span>
                    <span className="text-gray-700">
                      {formatValue(startup.solution?.principaisClientes)}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">NÚMEROS DE COLABORADORES: </span>
                    <span className="text-gray-700">
                      {formatValue(startup.solution?.numeroColaboradores || startup.employees)}
                    </span>
                  </div>
                </div>

                {/* Right Column - Opportunities */}
                <div className="col-span-4">
                  <div className="bg-gray-100 rounded-lg p-4 h-full">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Oportunidades</h3>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {formatOpportunities()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Solution Section */}
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">SOLUÇÃO</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {startup.description}
                  </p>
                </div>
              </div>

              {/* Problem Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">QUAL O PROBLEMA RESOLVE</h3>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {formatValue(startup.problemaSolve) !== 'NÃO DIVULGADO' ? (
                    <p>{startup.problemaSolve}</p>
                  ) : (
                    <div>
                      <p className="mb-2">
                        A {startup.name} trabalha com gestão da experiência do colaborador (Employee Experience). 
                        Ela combina psicologia organizacional, ciência de dados e tecnologia visando:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Medir e entender a jornada dos colaboradores desde o onboarding até o desligamento.</li>
                        <li>Aplicar pesquisas organizacionais personalizadas.</li>
                        <li>Gerar insights com base em dados reais para melhorar o clima, engajamento e cultura organizacional.</li>
                        <li>Oferecer serviços de consultoria estratégica em RH e People Analytics.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Founders Section */}
              {(startup.fundadores && startup.fundadores.length > 0) || startup.founder ? (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">FUNDADORES</h3>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {formatFoundersSection()}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-xs text-gray-500 border-t border-gray-200 pt-4">
              <span>Fonte: Gen.OI</span>
              <span>Gerado em: {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupCardGenerator;