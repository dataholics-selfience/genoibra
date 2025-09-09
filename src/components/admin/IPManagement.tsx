import { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Shield, Globe, AlertTriangle, 
  CheckCircle, Copy, Eye, EyeOff, Wifi, Lock
} from 'lucide-react';
import { auth } from '../../firebase';
import { IPRestrictionService, AllowedIP, PublicAccessConfig } from '../../utils/ipRestrictionService';

const IPManagement = () => {
  const [allowedIPs, setAllowedIPs] = useState<AllowedIP[]>([]);
  const [publicAccess, setPublicAccess] = useState<PublicAccessConfig>({ enabled: false });
  const [newIP, setNewIP] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserIPs, setCurrentUserIPs] = useState<string[]>([]);
  const [showCurrentIP, setShowCurrentIP] = useState(false);

  useEffect(() => {
    loadData();
    detectCurrentIP();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ips, config] = await Promise.all([
        IPRestrictionService.getAllowedIPs(),
        IPRestrictionService.getPublicAccessConfig()
      ]);
      
      setAllowedIPs(ips);
      setPublicAccess(config);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar configurações de IP');
    } finally {
      setLoading(false);
    }
  };

  const detectCurrentIP = async () => {
    try {
      console.log('🔍 Detectando IP atual do administrador...');
      const result = await IPRestrictionService.verifyCurrentIP();
      console.log('📊 Resultado completo da detecção:', {
        allowed: result.allowed,
        reason: result.reason,
        clientIP: result.clientIP,
        ipType: result.ipType,
        allDetectedIPs: result.allDetectedIPs,
        availableFirebaseIPs: result.availableFirebaseIPs,
        debug: result.debug
      });
      
      if (result.allDetectedIPs && result.allDetectedIPs.length > 0) {
        setCurrentUserIPs(result.allDetectedIPs);
        console.log(`✅ IPs detectados: ${result.allDetectedIPs.join(', ')}`);
      } else if (result.clientIP) {
        setCurrentUserIPs([result.clientIP]);
        console.log(`✅ IP principal detectado: ${result.clientIP}`);
      } else {
        console.log('⚠️ Nenhum IP detectado - verificar logs da Netlify Function');
      }
    } catch (error) {
      console.error('Erro ao detectar IP atual:', error);
    }
  };

  const handleAddIP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newIP.trim()) {
      setError('Por favor, insira um endereço IP');
      return;
    }

    // Validar formato antes de enviar
    const validation = IPRestrictionService.validateIPFormat(newIP.trim());
    if (!validation.valid) {
      setError(validation.error || 'Formato de IP inválido');
      return;
    }
    if (!auth.currentUser?.email) {
      setError('Usuário não autenticado');
      return;
    }

    setAdding(true);
    setError('');

    try {
      console.log(`➕ Adicionando IP: ${newIP.trim()} (${validation.type})`);
      
      const result = await IPRestrictionService.addAllowedIP(
        newIP.trim(),
        newDescription.trim() || 'Sem descrição',
        auth.currentUser.email
      );

      if (result.success && result.ipData) {
        console.log('✅ IP adicionado com sucesso:', result.ipData);
        setAllowedIPs(prev => [result.ipData!, ...prev]);
        setNewIP('');
        setNewDescription('');
        setSuccess('IP adicionado com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        console.error('❌ Falha ao adicionar IP:', result.error);
        setError(result.error || 'Erro ao adicionar IP');
      }
    } catch (error) {
      console.error('Erro ao adicionar IP:', error);
      setError('Erro interno ao adicionar IP');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveIP = async (ipId: string, ipAddress: string) => {
    console.log(`🗑️ Tentando remover IP: ${ipAddress} (ID: ${ipId})`);
    
    const confirmed = window.confirm(
      `Tem certeza que deseja remover o IP "${ipAddress}" da lista de permitidos?\n\nAtenção: Se este for seu IP atual, você perderá acesso à plataforma!\n\nApós a remoção, aguarde 30 segundos antes de testar o acesso.`
    );

    if (!confirmed) return;

    setError('');
    
    try {
      console.log(`🚀 Iniciando processo de remoção...`);
      const result = await IPRestrictionService.removeAllowedIP(ipId);
      
      if (result.success) {
        console.log(`✅ IP removido com sucesso do Firebase`);
        setAllowedIPs(prev => prev.filter(ip => ip.id !== ipId));
        setSuccess('IP removido com sucesso! Aguarde 30 segundos para que a mudança seja aplicada.');
        setTimeout(() => setSuccess(''), 3000);
        
        // Aguardar mais tempo e recarregar para confirmar exclusão
        console.log(`🔄 Aguardando 5 segundos e recarregando lista para confirmar exclusão...`);
        setTimeout(() => {
          loadData();
        }, 5000);
      } else {
        console.error(`❌ Falha na remoção:`, result.error);
        setError(result.error || 'Erro ao remover IP');
      }
    } catch (error) {
      console.error('Erro ao remover IP:', error);
      setError('Erro interno ao remover IP');
    }
  };

  const handleTogglePublicAccess = async () => {
    if (!auth.currentUser?.email) {
      setError('Usuário não autenticado');
      return;
    }

    const newState = !publicAccess.enabled;
    const reason = newState 
      ? 'Acesso público habilitado temporariamente pelo administrador'
      : 'Acesso público desabilitado - retornando ao controle por IP';

    try {
      const result = await IPRestrictionService.updatePublicAccess(
        newState,
        auth.currentUser.email,
        reason
      );

      if (result.success) {
        setPublicAccess({
          enabled: newState,
          enabledBy: auth.currentUser.email,
          enabledAt: new Date().toISOString(),
          reason
        });
        
        setSuccess(newState ? 'Acesso público habilitado!' : 'Acesso público desabilitado!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Erro ao atualizar configuração');
      }
    } catch (error) {
      console.error('Erro ao alterar acesso público:', error);
      setError('Erro interno ao alterar configuração');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('IP copiado para a área de transferência!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const addCurrentIP = (ip: string) => {
    if (ip) {
      setNewIP(ip);
      const ipType = IPRestrictionService.validateIPFormat(ip).type || 'unknown';
      setNewDescription(`IP atual do administrador (${auth.currentUser?.email}) - ${ipType.toUpperCase()}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getIPTypeIcon = (type: 'ipv4' | 'ipv6') => {
    return type === 'ipv4' ? (
      <span className="text-xs bg-blue-600 text-blue-100 px-2 py-1 rounded-full">IPv4</span>
    ) : (
      <span className="text-xs bg-purple-600 text-purple-100 px-2 py-1 rounded-full">IPv6</span>
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-white">Carregando configurações de IP...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-900/50 border border-red-600 text-red-200 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-600 text-green-200 p-4 rounded-lg flex items-center gap-3">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Public Access Toggle */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Globe size={24} className={publicAccess.enabled ? 'text-green-400' : 'text-gray-400'} />
            <div>
              <h3 className="text-lg font-bold text-white">Acesso Público</h3>
              <p className="text-gray-400 text-sm">
                {publicAccess.enabled 
                  ? 'Qualquer IP pode acessar a plataforma' 
                  : 'Apenas IPs autorizados podem acessar'
                }
              </p>
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={handleTogglePublicAccess}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                publicAccess.enabled ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  publicAccess.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {publicAccess.enabled && (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-yellow-400" />
              <span className="text-yellow-200 font-medium">Atenção: Acesso Público Ativo</span>
            </div>
            <p className="text-yellow-100 text-sm mb-2">
              O controle de IP está temporariamente desabilitado. Qualquer pessoa pode acessar a plataforma.
            </p>
            {publicAccess.enabledBy && (
              <div className="text-xs text-yellow-200">
                <p>Habilitado por: {publicAccess.enabledBy}</p>
                {publicAccess.enabledAt && (
                  <p>Em: {formatDate(publicAccess.enabledAt)}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current IP Detection */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Wifi size={24} className="text-blue-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Seu IP Atual</h3>
              <p className="text-gray-400 text-sm">IP detectado para sua conexão</p>
            </div>
          </div>
          <button
            onClick={() => setShowCurrentIP(!showCurrentIP)}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {showCurrentIP ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {showCurrentIP && currentUserIPs.length > 0 && (
          <div className="space-y-3 mb-4">
            {currentUserIPs.map((ip, index) => {
              const ipType = IPRestrictionService.validateIPFormat(ip).type || 'unknown';
              const isAlreadyAdded = allowedIPs.some(allowedIP => allowedIP.ip === ip);
              
              return (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <code className="text-white font-mono text-lg">{ip}</code>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ipType === 'ipv4' 
                          ? 'bg-blue-600 text-blue-100' 
                          : 'bg-purple-600 text-purple-100'
                      }`}>
                        {ipType.toUpperCase()}
                      </span>
                      {isAlreadyAdded && (
                        <span className="text-xs bg-green-600 text-green-100 px-2 py-1 rounded-full">
                          ✅ Já adicionado
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(ip)}
                        className="text-gray-400 hover:text-white p-1 rounded"
                        title="Copiar IP"
                      >
                        <Copy size={16} />
                      </button>
                      {!isAlreadyAdded && (
                        <button
                          onClick={() => addCurrentIP(ip)}
                          className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 bg-blue-900/30 rounded"
                          title="Adicionar à lista de permitidos"
                        >
                          Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add IP Form */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plus size={20} />
          Adicionar IP Autorizado
        </h3>
        
        <form onSubmit={handleAddIP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Endereço IP *
            </label>
            <input
              type="text"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              placeholder="192.168.1.1 ou 2001:db8::1"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={adding}
            />
            <p className="text-xs text-gray-400 mt-1">
              Exemplos: 192.168.1.1 (IPv4) ou 2001:db8::1 (IPv6)
            </p>
            {newIP.trim() && (
              <div className="mt-2">
                {(() => {
                  const validation = IPRestrictionService.validateIPFormat(newIP.trim());
                  return validation.valid ? (
                    <div className="flex items-center gap-2 text-green-400 text-xs">
                      <CheckCircle size={12} />
                      <span>IP válido ({validation.type?.toUpperCase()})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                      <AlertTriangle size={12} />
                      <span>{validation.error}</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição
            </label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Ex: Escritório principal, Casa do CEO, etc."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={adding}
            />
          </div>

          <button
            type="submit"
            disabled={adding || !newIP.trim()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              adding || !newIP.trim()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {adding ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus size={20} />
                Adicionar IP
              </>
            )}
          </button>
        </form>
      </div>

      {/* IPs List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield size={20} />
              IPs Autorizados ({allowedIPs.length})
            </h3>
            {publicAccess.enabled && (
              <span className="text-xs bg-yellow-600 text-yellow-100 px-3 py-1 rounded-full">
                Controle Desabilitado
              </span>
            )}
          </div>
        </div>

        {allowedIPs.length === 0 ? (
          <div className="text-center py-12">
            <Lock size={64} className="text-gray-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-white mb-2">Nenhum IP Autorizado</h4>
            <p className="text-gray-400 mb-6">
              Adicione endereços IP para permitir acesso à plataforma.
            </p>
            <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-200 text-sm">
                <strong>⚠️ Cuidado:</strong> Sem IPs autorizados e com acesso público desabilitado, 
                ninguém conseguirá acessar a plataforma!
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {allowedIPs.map((ip) => (
              <div key={ip.id} className="px-6 py-4 hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3 mb-1">
                        <code className="text-white font-mono text-lg">{ip.ip}</code>
                        {getIPTypeIcon(ip.type)}
                        {currentUserIPs.includes(ip.ip) && (
                          <span className="text-xs bg-green-600 text-green-100 px-2 py-1 rounded-full">
                            🎯 Seu IP
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {ip.description}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Adicionado por {ip.addedBy} em {formatDate(ip.addedAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(ip.ip)}
                      className="text-gray-400 hover:text-blue-400 p-2 rounded-lg hover:bg-gray-600 transition-colors"
                      title="Copiar IP"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveIP(ip.id, ip.ip)}
                      className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-600 transition-colors"
                      title="Remover IP"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-6">
        <h4 className="text-blue-200 font-medium mb-3 flex items-center gap-2">
          <Shield size={16} />
          Informações de Segurança
        </h4>
        <ul className="text-blue-100 text-sm space-y-2">
          <li>• A verificação de IP acontece a cada login e acesso ao admin</li>
          <li>• IPs não autorizados são bloqueados automaticamente</li>
          <li>• A verificação é feita via Netlify Functions para máxima segurança</li>
          <li>• Suporte completo para IPv4 e IPv6</li>
          <li>• O toggle "Acesso Público" desabilita temporariamente todas as restrições</li>
          <li>• Logs de acesso são mantidos para auditoria</li>
          <li>• 🔍 <strong>Debug:</strong> Verifique os logs da Netlify Function para troubleshooting</li>
        </ul>
        
        <div className="mt-4 pt-4 border-t border-blue-700">
          <h5 className="text-blue-200 font-medium mb-2">🛠️ Troubleshooting</h5>
          <div className="text-blue-100 text-xs space-y-1">
            <p>• <strong>Logs da Netlify:</strong> Vá em Netlify Dashboard → Functions → verify-ip → View logs</p>
            <p>• <strong>Console do navegador:</strong> Abra DevTools (F12) para ver logs detalhados</p>
            <p>• <strong>Firebase REST API:</strong> Agora usa REST API em vez do Admin SDK</p>
            <p>• IPs IPv6 são normalizados automaticamente para comparação</p>
            <p>• Use o botão "Adicionar" ao lado do seu IP atual para garantir formato correto</p>
            <p>• <strong>Debug:</strong> Verifique se os IPs aparecem nos logs como "carregados do Firebase"</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-blue-700">
          <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={16} className="text-blue-400" />
              <span className="text-blue-200 font-medium text-sm">Segurança</span>
            </div>
            <p className="text-blue-100 text-xs leading-relaxed">
              Esta plataforma possui controle de acesso por IP para garantir a segurança dos dados. 
              Apenas endereços IP autorizados podem acessar o sistema. Mudanças podem levar até 30 segundos para serem aplicadas.
            </p>
          </div>
          
          {/* Botão de emergência para habilitar acesso público */}
          <div className="mt-4">
            <button
              onClick={async () => {
                const confirmed = window.confirm(
                  'EMERGÊNCIA: Habilitar acesso público temporariamente?\n\nIsso permitirá que qualquer IP acesse a plataforma. Use apenas em caso de emergência!'
                );
                if (confirmed && auth.currentUser?.email) {
                  try {
                    await IPRestrictionService.updatePublicAccess(
                      true,
                      auth.currentUser.email,
                      'Acesso público habilitado em emergência via interface'
                    );
                    window.location.reload();
                  } catch (error) {
                    console.error('Erro ao habilitar acesso público:', error);
                  }
                }
              }}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              🚨 EMERGÊNCIA: Habilitar Acesso Público
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPManagement;