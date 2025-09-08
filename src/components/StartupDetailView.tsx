import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Star, Calendar, Building2, MapPin, Users, Briefcase, Award, 
  Globe, Mail, ArrowLeft, Edit2, Save, X, Phone, Linkedin,
  User, Target, TrendingUp, DollarSign, CheckCircle, Download,
  Box, Rocket, Plus, ExternalLink, Shield
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { StartupType } from '../types';
import { useTranslation } from '../utils/i18n';
import html2pdf from 'html2pdf.js';

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
  return list.filter(item => item && item !== 'NÃO DIVULGADO').join(', ') || fallback;
};
const StartupDetailView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { startupId } = useParams<{ startupId: string }>();
  const [startup, setStartup] = useState<StartupType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<StartupType | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    const fetchStartup = async () => {
      if (!auth.currentUser || !startupId) {
        navigate('/login');
        return;
      }

      try {
        const startupDoc = await getDoc(doc(db, 'selectedStartups', startupId));
        if (!startupDoc.exists()) {
          setError('Startup não encontrada');
          return;
        }

        const startupData = startupDoc.data().startupData as StartupType;
        setStartup(startupData);
        setEditData(startupData);
      } catch (error) {
        console.error('Error fetching startup:', error);
        setError('Erro ao carregar dados da startup');
      } finally {
        setLoading(false);
      }
    };

    fetchStartup();
  }, [startupId, navigate]);

  const handleSave = async () => {
    if (!editData || !startupId || !auth.currentUser) return;

    setSaving(true);
    setError('');

    try {
      await updateDoc(doc(db, 'selectedStartups', startupId), {
        startupData: editData,
        updatedAt: new Date().toISOString()
      });

      setStartup(editData);
      setIsEditing(false);
      setSuccess('Dados da startup atualizados com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating startup:', error);
      setError('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (!editData) return;

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditData(prev => prev ? {
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      } : null);
    } else {
      setEditData(prev => prev ? {
        ...prev,
        [field]: value
      } : null);
    }
  };

  const handleFounderChange = (index: number, field: string, value: string) => {
    if (!editData) return;

    const updatedFounders = [...(editData.fundadores || [])];
    if (!updatedFounders[index]) {
      updatedFounders[index] = { nome: '', formacao: '', experiencia: '', perfil: '' };
    }
    updatedFounders[index] = {
      ...updatedFounders[index],
      [field]: value
    };

    setEditData(prev => prev ? {
      ...prev,
      fundadores: updatedFounders
    } : null);
  };

  const addFounder = () => {
    if (!editData) return;

    setEditData(prev => prev ? {
      ...prev,
      fundadores: [
        ...(prev.fundadores || []),
        {
          nome: '',
          formacao: '',
          experiencia: '',
          perfil: ''
        }
      ]
    } : null);
  };

  const removeFounder = (index: number) => {
    if (!editData || !editData.fundadores || editData.fundadores.length <= 1) return;

    setEditData(prev => prev ? {
      ...prev,
      fundadores: prev.fundadores?.filter((_, i) => i !== index) || []
    } : null);
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
        filename: `${startup?.name.replace(/[^a-zA-Z0-9]/g, '_')}_startup_profile.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError('Erro ao exportar PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleBack = () => {
    navigate('/startups');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando dados da startup...</div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Startup não encontrada</div>
      </div>
    );
  }

  const displayData = isEditing ? editData! : startup;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="flex flex-col p-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-gray-300 hover:text-white focus:outline-none"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 ml-4">
            <Building2 size={20} className="text-gray-400" />
            <h2 className="text-lg font-medium">{displayData.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(startup);
                    setError('');
                  }}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                  Cancelar
                </button>
              </>
            ) : (
              <>
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
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* Status Messages */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-600 text-green-200 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* PDF Export Content */}
        <div id="startup-detail-content" className="bg-white text-black p-8 rounded-lg">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div className="border-b border-gray-300 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData?.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="text-3xl font-bold bg-gray-100 border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <h1 className="text-3xl font-bold text-black">{displayData.name}</h1>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-bold">
                        #{displayData.sequentialNumber || 'N/A'}
                      </span>
                      {displayData.websiteValidated && (
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
                            star <= displayData.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-2xl font-bold text-black">{displayData.rating}/5</div>
                    <div className="text-sm text-gray-600">Match Score</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xl font-bold text-black mb-4">Descrição</h3>
                {isEditing ? (
                  <textarea
                    value={editData?.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">{formatValue(displayData.description)}</p>
                )}
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-xl font-bold text-black mb-4">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Categoria</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData?.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-black">{formatValue(displayData.category)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Vertical</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData?.vertical}
                          onChange={(e) => handleInputChange('vertical', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-black">{formatValue(displayData.vertical)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Ano de Fundação</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData?.foundedYear}
                          onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-black">{formatValue(displayData.foundedYear)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Website Validado</label>
                      {isEditing ? (
                        <select
                          value={editData?.websiteValidated ? 'true' : 'false'}
                          onChange={(e) => handleInputChange('websiteValidated', e.target.value === 'true')}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="true">Sim</option>
                          <option value="false">Não</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          {displayData.websiteValidated ? (
                            <>
                              <CheckCircle size={16} className="text-green-600" />
                              <span className="text-black">Sim</span>
                            </>
                          ) : (
                            <>
                              <X size={16} className="text-red-600" />
                              <span className="text-black">Não</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Modelo de Negócio</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData?.businessModel}
                          onChange={(e) => handleInputChange('businessModel', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-black">{formatValue(displayData.businessModel)}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Localização</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editData?.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            placeholder="Cidade"
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={editData?.state}
                            onChange={(e) => handleInputChange('state', e.target.value)}
                            placeholder="Estado"
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={editData?.country}
                            onChange={(e) => handleInputChange('country', e.target.value)}
                            placeholder="País"
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <p className="text-black">
                          {formatValue(displayData.city)}
                          {displayData.state && displayData.state !== 'NÃO DIVULGADO' && `, ${displayData.state}`}
                          {displayData.country && displayData.country !== 'NÃO DIVULGADO' && `, ${displayData.country}`}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Tamanho da Equipe</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData?.teamSize}
                          onChange={(e) => handleInputChange('teamSize', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-black">{formatValue(displayData.teamSize)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Funcionários</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData?.employees}
                          onChange={(e) => handleInputChange('employees', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-black">{formatValue(displayData.employees)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Status IPO</label>
                      {isEditing ? (
                        <select
                          value={editData?.ipoStatus}
                          onChange={(e) => handleInputChange('ipoStatus', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="private">Private</option>
                          <option value="public">Public</option>
                          <option value="acquired">Acquired</option>
                          <option value="NÃO DIVULGADO">Não Divulgado</option>
                        </select>
                      ) : (
                        <p className="text-black">{formatValue(displayData.ipoStatus)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Strengths */}
              {displayData.keyStrengths && displayData.keyStrengths.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-black mb-4">Principais Pontos Fortes</h3>
                  {isEditing ? (
                    <textarea
                      value={Array.isArray(editData?.keyStrengths) ? editData.keyStrengths.join(', ') : ''}
                      onChange={(e) => handleInputChange('keyStrengths', e.target.value.split(', ').filter(s => s.trim()))}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Separar por vírgulas"
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <ul className="list-disc list-inside space-y-1">
                        {displayData.keyStrengths.filter(strength => strength && strength !== 'NÃO DIVULGADO').map((strength, index) => (
                          <li key={index} className="text-black">{strength}</li>
                        ))}
                        {displayData.keyStrengths.filter(strength => strength && strength !== 'NÃO DIVULGADO').length === 0 && (
                          <li className="text-gray-600">Não informado</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Partners */}
              <div>
                <h3 className="text-xl font-bold text-black mb-4">Parceiros</h3>
                {isEditing ? (
                  <textarea
                    value={Array.isArray(editData?.parceiros) ? editData.parceiros.join(', ') : ''}
                    onChange={(e) => handleInputChange('parceiros', e.target.value.split(', ').filter(s => s.trim()))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Separar por vírgulas"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-black">{formatList(displayData.parceiros)}</p>
                  </div>
                )}
              </div>

              {/* Opportunities */}
              <div>
                <h3 className="text-xl font-bold text-black mb-4">Oportunidades</h3>
                {isEditing ? (
                  <textarea
                    value={Array.isArray(editData?.oportunidades) ? editData.oportunidades.join(', ') : ''}
                    onChange={(e) => handleInputChange('oportunidades', e.target.value.split(', ').filter(s => s.trim()))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Separar por vírgulas"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-black">{formatList(displayData.oportunidades)}</p>
                  </div>
                )}
              </div>

              {/* Problem Solution */}
              <div>
                <h3 className="text-xl font-bold text-black mb-4">Problema que Resolve</h3>
                {isEditing ? (
                  <textarea
                    value={editData?.problemaSolve}
                    onChange={(e) => handleInputChange('problemaSolve', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">{formatValue(displayData.problemaSolve)}</p>
                )}
              </div>

              {/* Solution Details */}
              {displayData.solution && (
                <div>
                  <h3 className="text-xl font-bold text-black mb-4">Detalhes da Solução</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Porte</label>
                      {isEditing ? (
                        <select
                          value={editData?.solution?.porte}
                          onChange={(e) => handleInputChange('solution.porte', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Pequeno">Pequeno</option>
                          <option value="Médio">Médio</option>
                          <option value="Grande">Grande</option>
                          <option value="NÃO DIVULGADO">Não Divulgado</option>
                        </select>
                      ) : (
                        <p className="text-black">{formatValue(displayData.solution.porte)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Número de Colaboradores</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData?.solution?.numeroColaboradores}
                          onChange={(e) => handleInputChange('solution.numeroColaboradores', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-black">{formatValue(displayData.solution.numeroColaboradores)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Investimentos</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData?.solution?.investimentos}
                          onChange={(e) => handleInputChange('solution.investimentos', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-black">{formatValue(displayData.solution.investimentos)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Recebeu Aporte</label>
                      {isEditing ? (
                        <select
                          value={editData?.solution?.recebeuAporte}
                          onChange={(e) => handleInputChange('solution.recebeuAporte', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="NÃO DIVULGADO">Não Divulgado</option>
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                        </select>
                      ) : (
                        <p className="text-black">{formatValue(displayData.solution.recebeuAporte)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Valuation</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData?.solution?.valuation}
                          onChange={(e) => handleInputChange('solution.valuation', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-black">{formatValue(displayData.solution.valuation)}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Principais Clientes</label>
                      {isEditing ? (
                        <textarea
                          value={editData?.solution?.principaisClientes}
                          onChange={(e) => handleInputChange('solution.principaisClientes', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      ) : (
                        <p className="text-black">{formatValue(displayData.solution.principaisClientes)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Founders */}
              {displayData.fundadores && displayData.fundadores.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-black">Fundadores</h3>
                    {isEditing && (
                      <button
                        onClick={addFounder}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Plus size={16} />
                        Adicionar
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {displayData.fundadores.map((founder, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-black font-medium">Fundador {index + 1}</h4>
                          {isEditing && displayData.fundadores && displayData.fundadores.length > 1 && (
                            <button
                              onClick={() => removeFounder(index)}
                              className="text-red-600 hover:text-red-700 p-1 rounded"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={founder.nome}
                                onChange={(e) => handleFounderChange(index, 'nome', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <p className="text-black">{formatValue(founder.nome)}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Formação</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={founder.formacao}
                                onChange={(e) => handleFounderChange(index, 'formacao', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <p className="text-black">{formatValue(founder.formacao)}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Experiência</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={founder.experiencia}
                                onChange={(e) => handleFounderChange(index, 'experiencia', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <p className="text-black">{formatValue(founder.experiencia)}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Perfil</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={founder.perfil}
                                onChange={(e) => handleFounderChange(index, 'perfil', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <p className="text-black">{formatValue(founder.perfil)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technologies and Tags */}
              <div>
                <h3 className="text-xl font-bold text-black mb-4">Tecnologias e Tags</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Tecnologias</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData?.technologies}
                        onChange={(e) => handleInputChange('technologies', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-black">{formatValue(displayData.technologies)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Tags</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData?.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        placeholder="Separar por vírgulas"
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {displayData.tags && displayData.tags !== 'NÃO DIVULGADO' ? (
                          displayData.tags.split(',').map((tag, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-200">
                              {tag.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-600">Nenhuma tag informada</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-black mb-4">Contato</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-blue-600" size={20} />
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData?.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <a href={`mailto:${displayData.email}`} className="text-blue-600 hover:text-blue-700">
                        {formatValue(displayData.email)}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="text-green-600" size={20} />
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData?.telefone}
                        onChange={(e) => handleInputChange('telefone', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-black">
                        {formatValue(displayData.telefone)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="text-green-600" size={20} />
                    <span className="text-gray-600 text-sm">Celular:</span>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData?.celular}
                        onChange={(e) => handleInputChange('celular', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-black">
                        {formatValue(displayData.celular)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Globe className="text-purple-600" size={20} />
                    {isEditing ? (
                      <input
                        type="url"
                        value={editData?.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <a href={displayData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                        Website {displayData.websiteValidated && <CheckCircle size={14} className="inline ml-1 text-green-600" />}
                      </a>
                    )}
                  </div>

                  {displayData.linkedin && displayData.linkedin !== 'NÃO DIVULGADO' && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="text-blue-700" size={20} />
                      {isEditing ? (
                        <input
                          type="url"
                          value={editData?.linkedin}
                          onChange={(e) => handleInputChange('linkedin', e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <a href={displayData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                          LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </div>
                  {displayData.founderLinkedIn && displayData.founderLinkedIn !== 'NÃO DIVULGADO' && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="text-blue-700" size={20} />
                      <span className="text-gray-600 text-sm">Fundador:</span>
                      {isEditing ? (
                        <input
                          type="url"
                          value={editData?.founderLinkedIn}
                          onChange={(e) => handleInputChange('founderLinkedIn', e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <a href={displayData.founderLinkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                          LinkedIn do Fundador
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )}
              </div>

              {/* Key Metrics */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-black mb-4">Métricas</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Rating</span>
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <select
                          value={editData?.rating}
                          onChange={(e) => handleInputChange('rating', parseInt(e.target.value))}
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      ) : (
                        <>
                          <span className="text-black font-bold">{displayData.rating}</span>
                          <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completude dos Dados</span>
                    <span className="text-black font-bold">{displayData.dataCompleteness || 50}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Website Validado</span>
                    <span className={`font-bold ${displayData.websiteValidated ? 'text-green-600' : 'text-red-600'}`}>
                      {displayData.websiteValidated ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Information */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-black mb-4">Informações Legais</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Razão Social</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData?.legalName}
                        onChange={(e) => handleInputChange('legalName', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-black">{formatValue(displayData.legalName)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StartupDetailView;