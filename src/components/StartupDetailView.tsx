import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Star, Calendar, Building2, MapPin, Users, Briefcase, Award, 
  Globe, Mail, ArrowLeft, Edit2, Save, X, Phone, Linkedin,
  User, Target, TrendingUp, DollarSign, CheckCircle
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { StartupType } from '../types';
import { useTranslation } from '../utils/i18n';

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

    const updatedFounders = [...editData.fundadores];
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
        ...prev.fundadores,
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
    if (!editData || editData.fundadores.length <= 1) return;

    setEditData(prev => prev ? {
      ...prev,
      fundadores: prev.fundadores.filter((_, i) => i !== index)
    } : null);
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
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Edit2 size={16} />
                Editar
              </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Informações Básicas</h3>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-bold">
                    #{displayData.sequentialNumber}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className={`${
                          star <= displayData.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white">{displayData.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white">{displayData.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Vertical</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.vertical}
                        onChange={(e) => handleInputChange('vertical', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white">{displayData.vertical}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Ano de Fundação</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.foundedYear}
                        onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white">{displayData.foundedYear}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Modelo de Negócio</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.businessModel}
                        onChange={(e) => handleInputChange('businessModel', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white">{displayData.businessModel}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Localização</label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={displayData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Cidade"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={displayData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="Estado"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={displayData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          placeholder="País"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <p className="text-white">
                        {displayData.city}
                        {displayData.state && displayData.state !== 'NÃO DIVULGADO' && `, ${displayData.state}`}
                        {displayData.country && displayData.country !== 'NÃO DIVULGADO' && `, ${displayData.country}`}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Funcionários</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.employees}
                        onChange={(e) => handleInputChange('employees', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white">{displayData.employees}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status IPO</label>
                    {isEditing ? (
                      <select
                        value={displayData.ipoStatus}
                        onChange={(e) => handleInputChange('ipoStatus', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                        <option value="acquired">Acquired</option>
                        <option value="NÃO DIVULGADO">Não Divulgado</option>
                      </select>
                    ) : (
                      <p className="text-white">{displayData.ipoStatus}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Estágio</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.stage}
                        onChange={(e) => handleInputChange('stage', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white">{displayData.stage !== 'NÃO DIVULGADO' ? displayData.stage : 'Não informado'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Completude dos Dados</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${displayData.dataCompleteness}%` }}
                        />
                      </div>
                      <span className="text-white font-medium">{displayData.dataCompleteness}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Descrição</h3>
              {isEditing ? (
                <textarea
                  value={displayData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              ) : (
                <p className="text-gray-300 leading-relaxed">{displayData.description}</p>
              )}
            </div>

            {/* Problem Solution */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Problema que Resolve</h3>
              {isEditing ? (
                <textarea
                  value={displayData.problemaSolve}
                  onChange={(e) => handleInputChange('problemaSolve', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              ) : (
                <p className="text-gray-300 leading-relaxed">{displayData.problemaSolve}</p>
              )}
            </div>

            {/* Founders */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Fundadores</h3>
                {isEditing && (
                  <button
                    onClick={addFounder}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <User size={16} />
                    Adicionar
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {displayData.fundadores.map((founder, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">Fundador {index + 1}</h4>
                      {isEditing && displayData.fundadores.length > 1 && (
                        <button
                          onClick={() => removeFounder(index)}
                          className="text-red-400 hover:text-red-300 p-1 rounded"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={founder.nome}
                            onChange={(e) => handleFounderChange(index, 'nome', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-white">{founder.nome}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Formação</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={founder.formacao}
                            onChange={(e) => handleFounderChange(index, 'formacao', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-white">{founder.formacao !== 'NÃO DIVULGADO' ? founder.formacao : 'Não informado'}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Experiência</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={founder.experiencia}
                            onChange={(e) => handleFounderChange(index, 'experiencia', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-white">{founder.experiencia !== 'NÃO DIVULGADO' ? founder.experiencia : 'Não informado'}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Perfil</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={founder.perfil}
                            onChange={(e) => handleFounderChange(index, 'perfil', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-white">{founder.perfil !== 'NÃO DIVULGADO' ? founder.perfil : 'Não informado'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Solution Details */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Detalhes da Solução</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Porte</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData.solution.porte}
                      onChange={(e) => handleInputChange('solution.porte', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white">{displayData.solution.porte !== 'NÃO DIVULGADO' ? displayData.solution.porte : 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Investimentos</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData.solution.investimentos}
                      onChange={(e) => handleInputChange('solution.investimentos', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white">{displayData.solution.investimentos !== 'NÃO DIVULGADO' ? displayData.solution.investimentos : 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Recebeu Aporte</label>
                  {isEditing ? (
                    <select
                      value={displayData.solution.recebeuAporte}
                      onChange={(e) => handleInputChange('solution.recebeuAporte', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="NÃO DIVULGADO">Não Divulgado</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  ) : (
                    <p className="text-white">{displayData.solution.recebeuAporte !== 'NÃO DIVULGADO' ? displayData.solution.recebeuAporte : 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Valuation</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData.solution.valuation}
                      onChange={(e) => handleInputChange('solution.valuation', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white">{displayData.solution.valuation !== 'NÃO DIVULGADO' ? displayData.solution.valuation : 'Não informado'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Principais Clientes</label>
                  {isEditing ? (
                    <textarea
                      value={displayData.solution.principaisClientes}
                      onChange={(e) => handleInputChange('solution.principaisClientes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  ) : (
                    <p className="text-white">{displayData.solution.principaisClientes !== 'NÃO DIVULGADO' ? displayData.solution.principaisClientes : 'Não informado'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Technologies and Tags */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Tecnologias e Tags</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tecnologias</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData.technologies}
                      onChange={(e) => handleInputChange('technologies', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white">{displayData.technologies !== 'NÃO DIVULGADO' ? displayData.technologies : 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="Separar por vírgulas"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {displayData.tags && displayData.tags !== 'NÃO DIVULGADO' ? (
                        displayData.tags.split(',').map((tag, index) => (
                          <span key={index} className="bg-blue-900/50 text-blue-200 px-3 py-1 rounded-full text-sm">
                            {tag.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">Nenhuma tag informada</span>
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
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Contato</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="text-blue-400" size={20} />
                  {isEditing ? (
                    <input
                      type="email"
                      value={displayData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <a href={`mailto:${displayData.email}`} className="text-blue-400 hover:text-blue-300">
                      {displayData.email}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-green-400" size={20} />
                  {isEditing ? (
                    <input
                      type="tel"
                      value={displayData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-white">
                      {displayData.telefone !== 'NÃO DIVULGADO' ? displayData.telefone : 'Não informado'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-green-400" size={20} />
                  <span className="text-gray-400 text-sm">Celular:</span>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={displayData.celular}
                      onChange={(e) => handleInputChange('celular', e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-white">
                      {displayData.celular !== 'NÃO DIVULGADO' ? displayData.celular : 'Não informado'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Globe className="text-purple-400" size={20} />
                  {isEditing ? (
                    <input
                      type="url"
                      value={displayData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <a href={displayData.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      Website {displayData.websiteValidated && <CheckCircle size={14} className="inline ml-1 text-green-400" />}
                    </a>
                  )}
                </div>

                {displayData.linkedin && displayData.linkedin !== 'NÃO DIVULGADO' && (
                  <div className="flex items-center gap-3">
                    <Linkedin className="text-blue-500" size={20} />
                    {isEditing ? (
                      <input
                        type="url"
                        value={displayData.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <a href={displayData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        LinkedIn
                      </a>
                    )}
                  </div>
                )}

                {displayData.founderLinkedIn && displayData.founderLinkedIn !== 'NÃO DIVULGADO' && (
                  <div className="flex items-center gap-3">
                    <Linkedin className="text-blue-500" size={20} />
                    <span className="text-gray-400 text-sm">Fundador:</span>
                    {isEditing ? (
                      <input
                        type="url"
                        value={displayData.founderLinkedIn}
                        onChange={(e) => handleInputChange('founderLinkedIn', e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <a href={displayData.founderLinkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        LinkedIn
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Métricas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Rating</span>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <select
                        value={displayData.rating}
                        onChange={(e) => handleInputChange('rating', parseInt(e.target.value))}
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <span className="text-white font-bold">{displayData.rating}</span>
                        <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Completude</span>
                  <span className="text-white font-bold">{displayData.dataCompleteness}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Website Validado</span>
                  <span className={`font-bold ${displayData.websiteValidated ? 'text-green-400' : 'text-red-400'}`}>
                    {displayData.websiteValidated ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </div>

            {/* Legal Information */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Informações Legais</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Razão Social</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData.legalName}
                      onChange={(e) => handleInputChange('legalName', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white">{displayData.legalName !== 'NÃO DIVULGADO' ? displayData.legalName : 'Não informado'}</p>
                  )}
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