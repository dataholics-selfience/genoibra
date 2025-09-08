import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasActiveLoginVerification } from '../../utils/loginVerificationManager';
import { 
  ArrowLeft, Search, Trash2, Database, Settings, 
  CheckSquare, Square, Loader2, AlertTriangle, 
  Building2, Globe, Mail, Phone, MapPin, Hash
} from 'lucide-react';
import { auth } from '../../firebase';
import { API_CONFIG } from '../../config/api';

interface Startup {
  id: string;
  name: string;
  description: string;
  city: string;
  country: string;
  url: string;
  email: string;
  phone: string;
  metadata_length: number;
}

const AdminInterface = () => {
  const navigate = useNavigate();

  // Check if user is authorized admin and has verification
  useEffect(() => {
    const checkAccess = async () => {
      if (!auth.currentUser || auth.currentUser.email !== 'contact@dataholics.io') {
        navigate('/');
        return;
      }

      try {
        const hasVerification = await hasActiveLoginVerification(auth.currentUser.uid);
        if (!hasVerification) {
          navigate('/verify-login', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        navigate('/verify-login', { replace: true });
        return;
      }
    };

    checkAccess();
  }, [navigate]);

  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedStartups, setSelectedStartups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [environment, setEnvironment] = useState<'test' | 'production'>('test');
  const [error, setError] = useState('');
  const [sessionId] = useState(() => {
    // Generate persistent 24-character hexadecimal sessionId
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  });


  // Load startups on component mount
  useEffect(() => {
    loadStartups();
  }, [environment]);

  const getWebhookUrl = (action: 'list' | 'delete' | 'search') => {
    const webhooks = API_CONFIG.adminWebhooks[environment];
    return webhooks[action] || '';
  };

  const loadStartups = async (searchQuery?: string) => {
    setLoading(true);
    setError('');
    setStartups([]); // Clear existing startups while loading
    
    try {
      const url = searchQuery ? getWebhookUrl('search') : getWebhookUrl('list');
      const payload: any = { sessionId };
      
      if (searchQuery) {
        payload.query = searchQuery;
      }

      console.log(`🔍 Loading startups from ${environment} environment:`, { url, payload });

      // Show loading state and wait for webhook response
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('⏳ Waiting for webhook response...');
      const responseText = await response.text();
      console.log('✅ Webhook response received:', responseText.substring(0, 200) + '...');
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      // Handle different response formats
      let startupData;
      if (Array.isArray(data)) {
        // Check if it's an array with objects containing results
        if (data.length > 0 && data[0] && typeof data[0] === 'object' && data[0].results && Array.isArray(data[0].results)) {
          startupData = data[0].results;
          console.log(`✅ Received array with nested results format with ${startupData.length} startups`);
        } else {
          // Handle direct array response
          startupData = data;
          console.log(`✅ Received direct array format with ${startupData.length} startups`);
        }
      } else if (data && typeof data === 'object' && data.id && data.name !== undefined) {
        // Handle single startup object response
        startupData = [data];
        console.log(`✅ Received single object format, wrapped in array with 1 startup`);
      } else if (data && typeof data === 'object' && data.results && Array.isArray(data.results)) {
        // Handle format: { results: [...] }
        startupData = data.results;
        console.log(`✅ Received results format with ${startupData.length} startups`);
      } else {
        console.error('Invalid response format:', data);
        console.log('Response structure:', JSON.stringify(data, null, 2).substring(0, 500));
        throw new Error('Invalid response format: unable to extract startup data');
      }
      
      // Validate that we have an array of startups
      if (!Array.isArray(startupData)) {
        console.error('Startup data is not an array:', startupData);
        throw new Error('Invalid startup data: results should be an array');
      }
      
      // Log detailed parsing information for debugging
      console.log(`🔍 Parsing details:`, {
        originalDataType: Array.isArray(data) ? 'array' : typeof data,
        originalDataLength: Array.isArray(data) ? data.length : 'N/A',
        hasResults: data && typeof data === 'object' && 'results' in data,
        finalStartupCount: startupData.length,
        firstStartup: startupData[0] ? { id: startupData[0].id, name: startupData[0].name } : 'none'
      });
      
      console.log(`🎯 Successfully processed ${startupData.length} startups, updating UI...`);
      
      // Only update state after successful webhook response
      setStartups(startupData);
      setSelectedStartups(new Set());
      
      console.log(`🖥️ UI updated with ${startupData.length} startups`);
    } catch (error) {
      console.error('Error loading startups:', error);
      setError(`Erro ao carregar startups: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setStartups([]); // Clear startups on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      await loadStartups(searchTerm.trim());
    } else {
      await loadStartups();
    }
  };

  const handleSelectStartup = (startupId: string) => {
    const newSelected = new Set(selectedStartups);
    if (newSelected.has(startupId)) {
      newSelected.delete(startupId);
    } else {
      newSelected.add(startupId);
    }
    setSelectedStartups(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStartups.size === startups.length) {
      setSelectedStartups(new Set());
    } else {
      setSelectedStartups(new Set(startups.map(s => s.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedStartups.size === 0) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja deletar ${selectedStartups.size} startup(s) selecionada(s)? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setError('');

    try {
      const idsToDelete = Array.from(selectedStartups);
      const url = getWebhookUrl('delete');
      
      console.log(`🗑️ Deleting ${idsToDelete.length} startups from ${environment} environment:`, { url, ids: idsToDelete });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          ids: idsToDelete
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ Successfully deleted ${idsToDelete.length} startups`);
      
      // Remove deleted startups from local state
      setStartups(prev => prev.filter(startup => !selectedStartups.has(startup.id)));
      setSelectedStartups(new Set());
      
      // Show success message
      setError('');
      alert(`${idsToDelete.length} startup(s) deletada(s) com sucesso!`);
      
    } catch (error) {
      console.error('Error deleting startups:', error);
      setError(`Erro ao deletar startups: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setDeleting(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    return phone;
  };

  const formatEmail = (email: string) => {
    if (!email) return '-';
    return email;
  };

  const formatLocation = (city: string, country: string) => {
    if (!city && !country) return '-';
    if (!city) return country;
    if (!country) return city;
    return `${city}, ${country}`;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <Database size={24} className="text-red-500" />
              <h1 className="text-2xl font-bold text-white">Sudo Admin</h1>
              <span className="text-sm text-gray-400">- Gerenciamento de Startups</span>
            </div>
          </div>
          
          {/* Environment Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-gray-400" />
              <span className="text-sm text-gray-400">Ambiente:</span>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as 'test' | 'production')}
                className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="test">Teste</option>
                <option value="production">Produção</option>
              </select>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              environment === 'production' 
                ? 'bg-red-900 text-red-200 border border-red-700' 
                : 'bg-yellow-900 text-yellow-200 border border-yellow-700'
            }`}>
              {environment === 'production' ? '🔴 PRODUÇÃO' : '🟡 TESTE'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar startups por nome..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Buscar'}
              </button>
            </div>
          </form>

          {/* Delete Button */}
          <button
            onClick={handleDeleteSelected}
            disabled={selectedStartups.size === 0 || deleting}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedStartups.size === 0 || deleting
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {deleting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Deletando...
              </>
            ) : (
              <>
                <Trash2 size={20} />
                Deletar ({selectedStartups.size})
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-3">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-blue-400" />
                <span className="text-gray-300">Total: {startups.length} startups</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-green-400" />
                <span className="text-gray-300">Selecionadas: {selectedStartups.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-purple-400" />
                <span className="text-gray-300 font-mono text-sm">Session: {sessionId.substring(0, 8)}...</span>
              </div>
            </div>
            
            {startups.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm"
              >
                {selectedStartups.size === startups.length ? (
                  <>
                    <Square size={16} />
                    Desmarcar Todas
                  </>
                ) : (
                  <>
                    <CheckSquare size={16} />
                    Selecionar Todas
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-white">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-lg">Carregando startups...</span>
            </div>
          </div>
        )}

        {/* Startups Grid */}
        {!loading && startups.length > 0 && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-300">
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-400 hover:text-white"
                  >
                    {selectedStartups.size === startups.length ? (
                      <CheckSquare size={18} className="text-blue-400" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </div>
                <div className="col-span-3">Nome</div>
                <div className="col-span-3">Descrição</div>
                <div className="col-span-2">Localização</div>
                <div className="col-span-1">Website</div>
                <div className="col-span-1">Email</div>
                <div className="col-span-1">Metadata</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
              {startups.map((startup) => (
                <div
                  key={startup.id}
                  className={`px-4 py-3 hover:bg-gray-700 transition-colors ${
                    selectedStartups.has(startup.id) ? 'bg-blue-900/30' : ''
                  }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center text-sm">
                    {/* Checkbox */}
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        onClick={() => handleSelectStartup(startup.id)}
                        className="text-gray-400 hover:text-white"
                      >
                        {selectedStartups.has(startup.id) ? (
                          <CheckSquare size={18} className="text-blue-400" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </div>

                    {/* Name */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-blue-400 flex-shrink-0" />
                        <span className="text-white font-medium truncate" title={startup.name}>
                          {startup.name}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="col-span-3">
                      <p className="text-gray-300 truncate" title={startup.description}>
                        {startup.description}
                      </p>
                    </div>

                    {/* Location */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-green-400 flex-shrink-0" />
                        <span className="text-gray-300 truncate" title={formatLocation(startup.city, startup.country)}>
                          {formatLocation(startup.city, startup.country)}
                        </span>
                      </div>
                    </div>

                    {/* Website */}
                    <div className="col-span-1">
                      {startup.url ? (
                        <a
                          href={startup.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title={startup.url}
                        >
                          <Globe size={14} />
                        </a>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="col-span-1">
                      {startup.email ? (
                        <a
                          href={`mailto:${startup.email}`}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title={startup.email}
                        >
                          <Mail size={14} />
                        </a>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>

                    {/* Metadata Length */}
                    <div className="col-span-1">
                      <span className="text-gray-400 font-mono text-xs">
                        {startup.metadata_length ? startup.metadata_length.toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && startups.length === 0 && (
          <div className="text-center py-12">
            <Database size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {searchTerm ? 'Nenhuma startup encontrada' : 'Nenhuma startup carregada'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `Não foram encontradas startups com o termo "${searchTerm}"`
                : 'Clique em "Carregar Startups" para buscar dados do Pinecone'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => loadStartups()}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors mx-auto"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Database size={20} />
                    Carregar Startups
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInterface;