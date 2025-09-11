import { useState, useEffect } from 'react';
import { Download, X, Edit2, Save, Check, Plus, Minus } from 'lucide-react';
import { StartupType } from '../types';
import { doc, updateDoc, collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


interface StartupCardGeneratorProps {
  startup: StartupType;
  challengeTitle: string;
  onClose: () => void;
  startupId: string;
  onStartupUpdated?: (updatedStartup: StartupType) => void;
}

const StartupCardGenerator = ({ startup, challengeTitle, onClose, startupId, onStartupUpdated }: StartupCardGeneratorProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<StartupType>({ ...startup });
  const [editChallengeTitle, setEditChallengeTitle] = useState(challengeTitle);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedStartup, setSavedStartup] = useState<any>(null);

  useEffect(() => {
    // Component initialization
  }, []);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setLogoPreview(base64);
        handleEditChange('logoBase64', base64);
        
        // Auto-save logo to database immediately
        saveLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveLogo = async (logoBase64: string) => {
    if (!auth.currentUser || !startupId) return;

    try {
      console.log('💾 Salvando logo no banco de dados...');
      
      if (startupId.startsWith('temp-')) {
        // Update startup list
        const startupListsQuery = query(
          collection(db, 'startupLists'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        
        const startupListSnapshot = await getDocs(startupListsQuery);
        if (!startupListSnapshot.empty) {
          const startupListDoc = startupListSnapshot.docs[0];
          const startupListData = startupListDoc.data() as any;
          
          const updatedStartups = (startupListData.startups || []).map((s: any) => 
            s.name === editData.name ? { ...s, logoBase64 } : s
          );
          
          await updateDoc(doc(db, 'startupLists', startupListDoc.id), {
            startups: updatedStartups,
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        // Update selected startup
        await updateDoc(doc(db, 'selectedStartups', startupId), {
          'startupData.logoBase64': logoBase64,
          updatedAt: new Date().toISOString()
        });
      }
      
      console.log('✅ Logo salvo com sucesso no banco de dados');
    } catch (error) {
      console.error('Erro ao salvar logo:', error);
    }
  };

  const handleEditChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent] || {},
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

  // Função simplificada de salvamento - sempre cria nova entrada
  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      // Check authentication first
      if (!auth.currentUser) {
        console.log('User not authenticated, redirecting to login');
        window.location.href = '/login';
        return;
      }

      // Check if startupId is available
      if (!startupId) {
        throw new Error('ID da startup não encontrado');
      }

      console.log('Salvando dados da startup:', { startupId, hasEditData: !!editData });
      
      // Check if this is a temporary ID (startup not yet saved to pipeline)
      if (startupId.startsWith('temp-')) {
        console.log('Temporary ID detected, saving to startup list instead');
        
        // Find the startup list document and update the specific startup
        const startupListsQuery = query(
          collection(db, 'startupLists'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        
        const startupListSnapshot = await getDocs(startupListsQuery);
        if (!startupListSnapshot.empty) {
          const startupListDoc = startupListSnapshot.docs[0];
          const startupListData = startupListDoc.data() as any;
          
          // Update the specific startup in the array
          const updatedStartups = (startupListData.startups || []).map((s: any) => 
            s.name === editData.name ? editData : s
          );
          
          await updateDoc(doc(db, 'startupLists', startupListDoc.id), {
            startups: updatedStartups,
            updatedAt: new Date().toISOString()
          });
          
          console.log('Startup updated in startup list');
        }
      } else {
        // This is a real ID from selectedStartups collection
        await updateDoc(doc(db, 'selectedStartups', startupId), {
          startupData: editData,
          updatedAt: new Date().toISOString()
        });
        
        console.log('Startup updated in selected startups');
      }

      // Update local state to reflect changes immediately
      console.log('🔄 Updating local state with saved data');
      
      // Notify parent component about the update
      if (onStartupUpdated) {
        console.log('📢 Notifying parent component of startup update:', editData.name);
        onStartupUpdated(editData);
      }
      
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('✅ Save operation completed successfully');

    } catch (error) {
      console.error('Error updating startup:', error);
      setError(`Erro ao salvar alterações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Update displayData to use editData when editing is complete
  const displayData = editData;

  const formatValue = (value: any, fallback: string = 'NÃO DIVULGADO'): string => {
    if (!value || value === 'NÃO DIVULGADO' || value === 'N/A' || value === '') {
      return fallback;
    }
    return String(value);
  };

  const formatOpportunities = (): string => {
    const genericOpportunities = [
      `Análises prescritivas para decisões de sucessão, promoção e retenção.`,
      `Estruturação de projetos de dados em RH com foco em desenvolvimento de talentos.`,
      `Insights para engajamento e cultura organizacional.`
    ];
    
    return genericOpportunities.map((opp, index) => `${index + 1}. ${opp}`).join('\n\n');
  };


  const exportToPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const cardElement = document.getElementById('startup-card-content');
      if (!cardElement) {
        console.error('Card element not found');
        setError('Elemento do card não encontrado');
        return;
      }

      console.log('🎨 Gerando canvas do card...');
      
      // Generate high-quality canvas
      const canvas = await html2canvas(cardElement, {
        scale: 2, // High resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1200,
        height: 800,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure all images are loaded in the cloned document
          const images = clonedDoc.querySelectorAll('img');
          images.forEach((img) => {
            img.style.display = 'block';
            // Force load external images for PDF
            if (img.src.includes('genoi.net')) {
              img.crossOrigin = 'anonymous';
            }
          });
        }
      });

      console.log('📄 Criando PDF...');
      
      // Create PDF in landscape format
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit A4 landscape
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Add canvas to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Generate filename
      const fileName = `${displayData.name.replace(/[^a-zA-Z0-9]/g, '_')}_card.pdf`;
      
      console.log('💾 Fazendo download do PDF...');
      
      // Download PDF
      pdf.save(fileName);
      
      console.log('✅ PDF gerado e baixado com sucesso!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditData({ ...startup });
    setEditChallengeTitle(challengeTitle);
    setLogoPreview(null);
    setError(null);
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
                <button 
                  onClick={() => setError(null)}
                  className="text-red-800 hover:text-red-900"
                >
                  <X size={12} />
                </button>
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
                  disabled={isSaving || !startupId}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isSaving || !startupId
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
                      {!startupId ? 'ID não encontrado' : 'Salvar'}
                    </>
                  )}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <X size={16} />
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Edit2 size={16} />
                Editar
              </button>
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
              fontSize: '16.1px',
              lineHeight: '1.4',
              position: 'relative',
              margin: '0 auto'
            }}
          >
            {/* Header */}
            <div className="bg-white p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-red-600">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editChallengeTitle}
                      onChange={(e) => setEditChallengeTitle(e.target.value)}
                      className="text-2xl font-bold bg-white border border-gray-300 rounded px-2 py-1 text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    challengeTitle || 'Employee Experience e People Analytics'
                  )}
                </h1>
                <div className="flex items-center gap-6">
                  <img 
                    src={INOVABRA_LOGO}
                    alt="Inovabra Bradesco" 
                    style={{ height: '44.5px', width: 'auto', objectFit: 'contain' }}
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
              <div className="grid grid-cols-12 gap-6 mb-6">
                {/* Left Column - Logo and Basic Info */}
                <div className="col-span-3">
                  {/* Logo */}
                  <div className={`mb-4 ${isEditing ? 'relative -top-9' : ''}`} style={{ width: '184px', height: '184px' }}>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="text-xs text-gray-600 w-full mb-2"
                        />
                        <div className="border-2 border-dashed border-gray-400 rounded flex items-center justify-center" style={{ width: '184px', height: '184px' }}>
                          {logoPreview || displayData.logoBase64 ? (
                            <img 
                              src={logoPreview || displayData.logoBase64} 
                              alt="Logo" 
                             className="rounded"
                             style={{ maxWidth: '184px', maxHeight: '184px', width: 'auto', height: 'auto', objectFit: 'contain' }}
                             crossOrigin="anonymous"
                            />
                          ) : (
                            <span className="text-gray-500 text-xs">Logo</span>
                          )}
                        </div>
                      </div>
                    ) : displayData.logoBase64 ? (
                      <img 
                        src={displayData.logoBase64} 
                        alt="Logo" 
                       className="rounded"
                       style={{ maxWidth: '184px', maxHeight: '184px', width: 'auto', height: 'auto', objectFit: 'contain' }}
                       crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="bg-red-600 rounded-full flex items-center justify-center" style={{ width: '184px', height: '184px' }}>
                        <span className="text-white font-bold" style={{ fontSize: '74px' }}>
                          {displayData.name?.charAt(0)?.toUpperCase() || 'S'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-bold text-gray-800">NOME: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.name || ''}
                          onChange={(e) => handleEditChange('name', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-700">{displayData.name}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">SITE: </span>
                      {isEditing ? (
                        <input
                          type="url"
                          value={editData.website || ''}
                          onChange={(e) => handleEditChange('website', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-blue-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-blue-600">{formatValue(displayData.website)}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">SEDE: </span>
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editData.city || ''}
                            onChange={(e) => handleEditChange('city', e.target.value)}
                            placeholder="Cidade"
                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={editData.state || ''}
                            onChange={(e) => handleEditChange('state', e.target.value)}
                            placeholder="Estado"
                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-700">
                          {formatValue(displayData.city)}
                          {displayData.state && displayData.state !== 'NÃO DIVULGADO' && `, ${displayData.state}`}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">FUNDADOR: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.founder || ''}
                          onChange={(e) => handleEditChange('founder', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-700">
                          {displayData.fundadores && displayData.fundadores.length > 0 
                            ? displayData.fundadores.map(f => f.nome).filter(n => n).join(', ')
                            : formatValue(displayData.founder)
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle Column - Financial Info */}
                <div className="col-span-5 space-y-2 text-sm">
                  <br />
                  <br />                  
                  <br />
                  <br />
                  <br />                  
                  <br />
                  <br />
                  <br />                  
                  <br />
                  <div>
                    <span className="font-bold text-gray-800">INVESTIMENTOS: </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.solution?.investimentos || ''}
                        onChange={(e) => handleEditChange('solution.investimentos', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-700">
                        {formatValue(displayData.solution?.investimentos)}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">STAGE: </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.stage || editData.solution?.stage || ''}
                        onChange={(e) => handleEditChange('stage', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-700">
                        {formatValue(displayData.stage || displayData.solution?.stage)}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">COLABORADORES: </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.employees || ''}
                        onChange={(e) => handleEditChange('employees', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-700">
                        {formatValue(displayData.employees)}
                      </span>
                    )}
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
                  {isEditing ? (
                    <textarea
                      value={editData.description || ''}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {displayData.description && displayData.description.length > 400 
                        ? `${displayData.description.substring(0, 400)}...`
                        : displayData.description || 'Descrição não disponível'
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Founders */}
              {displayData.fundadores && displayData.fundadores.length > 0 && (
                <div className="mb-6">
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
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {displayData.fundadores.map((founder, index) => (
                      <div key={index} className="mb-2 relative">
                        {isEditing ? (
                          <div className="space-y-1 border border-gray-300 rounded p-2 relative">
                            {displayData.fundadores && displayData.fundadores.length > 1 && (
                              <button
                                onClick={() => removeFounder(index)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                              >
                                <Minus size={10} />
                              </button>
                            )}
                            <input
                              type="text"
                              value={founder.nome || ''}
                              onChange={(e) => handleFounderChange(index, 'nome', e.target.value)}
                              placeholder="Nome do fundador"
                              className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={founder.formacao || ''}
                              onChange={(e) => handleFounderChange(index, 'formacao', e.target.value)}
                              placeholder="Formação"
                              className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={founder.experiencia || ''}
                              onChange={(e) => handleFounderChange(index, 'experiencia', e.target.value)}
                              placeholder="Experiência"
                              className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <div>
                            <strong>{founder.nome}</strong>
                            {founder.formacao && (
                              <span>, formado em {founder.formacao}</span>
                            )}
                            {founder.experiencia && (
                              <span>. {founder.experiencia}</span>
                            )}
                          </div>
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