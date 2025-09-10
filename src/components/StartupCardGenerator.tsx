import { useState } from 'react';
import { Download, X, Edit2, Save, Upload, Check, Plus, Minus } from 'lucide-react';
import { StartupType } from '../types';
import html2pdf from 'html2pdf.js';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface StartupCardGeneratorProps {
  startup: StartupType;
  challengeTitle: string;
  onClose: () => void;
  startupId: string;
}

const StartupCardGenerator = ({ startup, challengeTitle, onClose, startupId }: StartupCardGeneratorProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<StartupType>(startup);
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleInputChange = (field: string, value: string) => {
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoFile(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setError(null);
    
    console.log('🔍 Debug save - startupId:', startupId);
    console.log('🔍 Debug save - auth.currentUser:', auth.currentUser?.uid);
    console.log('🔍 Debug save - startupId type:', typeof startupId);
    console.log('🔍 Debug save - startupId length:', startupId?.length);
    
    if (!auth.currentUser) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }
    
    if (!startupId || startupId.trim() === '') {
      setError(`ID da startup não encontrado. startupId recebido: ${startupId}`);
      return;
    }

    setIsSaving(true);

    try {
      // Update the startupData field within the selectedStartups document
      const updateData: any = {
        startupData: {
          ...editData,
          logoBase64: logoFile || editData.logoBase64
        },
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'selectedStartups', startupId), updateData);

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
        setError(null);
      }, 2000);

    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      setError('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const addFounder = () => {
    const newFounder = { nome: '', formacao: '', experiencia: '', perfil: '' };
    const currentFounders = editData.fundadores || [];
    setEditData(prev => ({
      ...prev,
      fundadores: [...currentFounders, newFounder]
    }));
  };

  const removeFounder = (index: number) => {
    const currentFounders = editData.fundadores || [];
    if (currentFounders.length > 1) {
      const updatedFounders = currentFounders.filter((_, i) => i !== index);
      setEditData(prev => ({
        ...prev,
        fundadores: updatedFounders
      }));
    }
  };

  const displayData = isEditing ? editData : startup;

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
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1200,
          height: 800,
          logging: false,
          removeContainer: true
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
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                <X size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600">
                <Check size={16} />
                <span className="text-sm">Salvo!</span>
              </div>
            )}
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isSaving
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Salvar
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(startup);
                    setLogoFile(null);
                    setError(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <X size={16} />
                  Cancelar
                </button>
              </>
            ) : (
              <>
              </>
            )}
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
                  <div style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '18px' }}>inovabra</span>
                    <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '18px' }}>bradesco</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
              <div className="grid grid-cols-12 gap-6 mb-6">
                {/* Left Column - Logo and Basic Info */}
                <div className="col-span-3">
                  {/* Logo Placeholder */}
                  <div className="w-16 h-16 mb-4">
                    {startup.logoBase64 ? (
                      <img 
                        src={startup.logoBase64} 
                        alt="Logo" 
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {startup.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
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
                  <br />
                  <br />
                  <br />
                  <br />
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
                    {startup.description.length > 400 
                      ? `${startup.description.substring(0, 400)}...`
                      : startup.description
                    }
                  </p>
                </div>
              </div>

              {/* Founders Section */}
              {displayData.fundadores && displayData.fundadores.length > 0 && (
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-800">FUNDADORES</h3>
                      {isEditing && (
                        <button
                          onClick={addFounder}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          <Plus size={12} />
                          Adicionar
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      {displayData.fundadores.map((founder, index) => (
                        <div key={index} className="mb-2">
                          {isEditing ? (
                            <div className="space-y-1 relative">
                              {displayData.fundadores && displayData.fundadores.length > 1 && (
                                <button
                                  onClick={() => removeFounder(index)}
                                  className="absolute -right-6 top-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Remover fundador"
                                >
                                  <Minus size={14} />
                                </button>
                              )}
                              <input
                                type="text"
                                value={founder.nome || ''}
                                onChange={(e) => {
                                  const updatedFounders = [...(editData.fundadores || [])];
                                  updatedFounders[index] = { ...updatedFounders[index], nome: e.target.value };
                                  setEditData(prev => ({ ...prev, fundadores: updatedFounders }));
                                }}
                                placeholder="Nome do fundador"
                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <input
                                type="text"
                                value={founder.formacao || ''}
                                onChange={(e) => {
                                  const updatedFounders = [...(editData.fundadores || [])];
                                  updatedFounders[index] = { ...updatedFounders[index], formacao: e.target.value };
                                  setEditData(prev => ({ ...prev, fundadores: updatedFounders }));
                                }}
                                placeholder="Formação"
                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <input
                                type="text"
                                value={founder.experiencia || ''}
                                onChange={(e) => {
                                  const updatedFounders = [...(editData.fundadores || [])];
                                  updatedFounders[index] = { ...updatedFounders[index], experiencia: e.target.value };
                                  setEditData(prev => ({ ...prev, fundadores: updatedFounders }));
                                }}
                                placeholder="Experiência"
                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <input
                                type="text"
                                value={founder.perfil || ''}
                                onChange={(e) => {
                                  const updatedFounders = [...(editData.fundadores || [])];
                                  updatedFounders[index] = { ...updatedFounders[index], perfil: e.target.value };
                                  setEditData(prev => ({ ...prev, fundadores: updatedFounders }));
                                }}
                                placeholder="Perfil adicional"
                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    {displayData.fundadores.map((founder, index) => (
                      <div key={index} className="mb-2">
                        {isEditing ? (
                          <div className="space-y-1 relative">
                            {displayData.fundadores && displayData.fundadores.length > 1 && (
                              <button
                                onClick={() => removeFounder(index)}
                                className="absolute -right-6 top-1 text-red-600 hover:text-red-800 transition-colors"
                                title="Remover fundador"
                              >
                                <Minus size={14} />
                              </button>
                            )}
                            <input
                              type="text"
                              value={founder.nome || ''}
                              onChange={(e) => {
                                const updatedFounders = [...(editData.fundadores || [])];
                                updatedFounders[index] = { ...updatedFounders[index], nome: e.target.value };
                                setEditData(prev => ({ ...prev, fundadores: updatedFounders }));
                              }}
                              placeholder="Nome do fundador"
                              className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={founder.formacao || ''}
                              onChange={(e) => {
                                const updatedFounders = [...(editData.fundadores || [])];
                                updatedFounders[index] = { ...updatedFounders[index], formacao: e.target.value };
                                setEditData(prev => ({ ...prev, fundadores: updatedFounders }));
                              }}
                              placeholder="Formação"
                              className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={founder.experiencia || ''}
                              onChange={(e) => {
                                const updatedFounders = [...(editData.fundadores || [])];
                                updatedFounders[index] = { ...updatedFounders[index], experiencia: e.target.value };
                                setEditData(prev => ({ ...prev, fundadores: updatedFounders }));
                              }}
                              placeholder="Experiência"
                              className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={founder.perfil || ''}
                              onChange={(e) => {
                                const updatedFounders = [...(editData.fundadores || [])];
                                updatedFounders[index] = { ...updatedFounders[index], perfil: e.target.value };
                                setEditData(prev => ({ ...prev, fundadores: updatedFounders }));
                              }}
                              placeholder="Perfil adicional"
                              className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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