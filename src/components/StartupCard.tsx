import { useState } from 'react';
import { StartupType } from '../types';
import html2canvas from 'html2canvas';

interface StartupCardProps {
  startup: StartupType;
  challengeTitle: string;
  onClose: () => void;
}

const StartupCard = ({ startup, challengeTitle, onClose }: StartupCardProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatValue = (value: any, fallback: string = 'NÃO DIVULGADO'): string => {
    if (!value || value === 'NÃO DIVULGADO' || value === 'N/A' || value === '') {
      return fallback;
    }
    return String(value);
  };

  const formatList = (list: any[], fallback: string = 'NÃO DIVULGADO'): string => {
    if (!Array.isArray(list) || list.length === 0) {
      return fallback;
    }
    return list.filter(item => item && item !== 'NÃO DIVULGADO').join(', ') || fallback;
  };

  const formatFounders = (founders: any[]): string => {
    if (!Array.isArray(founders) || founders.length === 0) {
      return formatValue(startup.founder, 'NÃO DIVULGADO');
    }
    
    return founders.map(founder => {
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

  const generateCard = async () => {
    setIsGenerating(true);
    
    try {
      const cardElement = document.getElementById('startup-card-content');
      if (!cardElement) {
        console.error('Card element not found');
        return;
      }

      // Configurações para alta qualidade
      const canvas = await html2canvas(cardElement, {
        scale: 3, // Alta resolução
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#f8f9fa',
        width: 1200,
        height: 800,
        scrollX: 0,
        scrollY: 0
      });

      // Converter para blob e fazer download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${startup.name.replace(/[^a-zA-Z0-9]/g, '_')}_card.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Error generating card:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">{challengeTitle}</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={generateCard}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isGenerating
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  Gerando...
                </>
              ) : (
                'Gerar Card'
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6">
          <div 
            id="startup-card-content"
            className="bg-gray-100 p-8 rounded-lg"
            style={{ 
              width: '1200px', 
              height: '800px',
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              lineHeight: '1.4',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-red-600 mb-2">
                  {challengeTitle}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-red-600 font-bold text-lg">inovabra</span>
                <span className="text-red-600 font-bold text-lg">bradesco</span>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6 h-full">
              {/* Left Column - Logo and Basic Info */}
              <div className="col-span-3">
                {/* Logo Placeholder */}
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-xl">
                    {startup.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Basic Info */}
                <div className="space-y-3 text-sm">
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
                    <span className="text-gray-700">{formatValue(startup.city)}</span>
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

              {/* Middle Column - Investment Info */}
              <div className="col-span-4 space-y-3 text-sm">
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
              <div className="col-span-5">
                <div className="bg-gray-200 rounded-lg p-4 h-full">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Oportunidades</h3>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {formatOpportunities()}
                  </div>
                </div>
              </div>

              {/* Bottom Section - Solution and Problem */}
              <div className="col-span-12 mt-6 space-y-4">
                {/* Solution */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">SOLUÇÃO</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {startup.description.length > 400 
                      ? `${startup.description.substring(0, 400)}...`
                      : startup.description
                    }
                  </p>
                </div>

                {/* Problem */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">QUAL O PROBLEMA RESOLVE</h3>
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

                {/* Founders */}
                {startup.fundadores && startup.fundadores.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">FUNDADORES</h3>
                    <div className="text-sm text-gray-700 leading-relaxed">
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
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 left-8 right-8 flex justify-between items-center text-xs text-gray-500">
              <span>Fonte: Gen.OI</span>
              <span>Gerado em: {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupCard;