import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Mail, Shield, 
  CheckCircle, AlertTriangle, Users, Database, QrCode, Copy, Clock
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import QRCode from 'qrcode';

interface AuthorizedEmail {
  id: string;
  email: string;
  addedBy: string;
  addedAt: string;
  status: 'active' | 'used';
}

interface RegistrationToken {
  id: string;
  token: string;
  email: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'used' | 'expired';
  qrCodeUrl?: string;
}
const SudoAdminInterface = () => {
  const navigate = useNavigate();
  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmail[]>([]);
  const [registrationTokens, setRegistrationTokens] = useState<RegistrationToken[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQRModal, setShowQRModal] = useState<RegistrationToken | null>(null);
  const [activeTab, setActiveTab] = useState<'emails' | 'tokens'>('emails');

  // Check if user is authorized sudo admin
  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.email !== 'daniel.mendes@dataholics.io') {
      navigate('/');
      return;
    }
  }, [navigate]);

  // Load authorized emails
  useEffect(() => {
    loadAuthorizedEmails();
    loadRegistrationTokens();
  }, []);

  const loadAuthorizedEmails = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'authorizedEmails'),
        orderBy('addedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const emails = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuthorizedEmail[];
      
      setAuthorizedEmails(emails);
    } catch (error) {
      console.error('Error loading authorized emails:', error);
      setError('Erro ao carregar emails autorizados');
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrationTokens = async () => {
    try {
      const q = query(
        collection(db, 'registrationTokens'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const tokens = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RegistrationToken[];
      
      setRegistrationTokens(tokens);
    } catch (error) {
      console.error('Error loading registration tokens:', error);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const generateRegistrationToken = async (email: string) => {
    const token = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 horas
    
    const registrationUrl = `${window.location.origin}/register/${token}`;
    
    try {
      // Gerar QR Code
      const qrCodeDataUrl = await QRCode.toDataURL(registrationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const tokenData = {
        token,
        email: email.toLowerCase(),
        createdBy: auth.currentUser?.email || '',
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'active' as const,
        qrCodeUrl: qrCodeDataUrl,
        registrationUrl
      };

      const docRef = await addDoc(collection(db, 'registrationTokens'), tokenData);
      
      const newToken: RegistrationToken = {
        id: docRef.id,
        ...tokenData
      };

      setRegistrationTokens(prev => [newToken, ...prev]);
      return newToken;
    } catch (error) {
      console.error('Error generating registration token:', error);
      throw error;
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      setError('Por favor, insira um email');
      return;
    }

    if (!validateEmail(newEmail)) {
      setError('Por favor, insira um email válido');
      return;
    }

    const emailToAdd = newEmail.trim().toLowerCase();

    // Check if email already exists
    const existingEmail = authorizedEmails.find(item => item.email === emailToAdd);
    if (existingEmail) {
      setError('Este email já está autorizado');
      return;
    }

    try {
      // Gerar token de registro com QR code
      const registrationToken = await generateRegistrationToken(emailToAdd);
      
      setNewEmail('');
      setError('');
      setSuccess('Token de registro gerado com sucesso! QR Code criado.');
      setShowQRModal(registrationToken);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding authorized email:', error);
      setError('Erro ao gerar token de registro');
    }
  };

  const handleDeleteToken = async (tokenId: string, email: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover o token de registro para "${email}"?`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'registrationTokens', tokenId));
      setRegistrationTokens(prev => prev.filter(item => item.id !== tokenId));
      setSuccess('Token de registro removido');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting registration token:', error);
      setError('Erro ao remover token');
    }
  };

  const handleDeleteEmail = async (emailId: string, email: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover a autorização do email "${email}"?`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'authorizedEmails', emailId));
      setAuthorizedEmails(prev => prev.filter(item => item.id !== emailId));
      setSuccess('Email removido da lista de autorizados');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting authorized email:', error);
      setError('Erro ao remover email');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('URL copiada para a área de transferência!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setError('Erro ao copiar URL');
    }
  };

  const isTokenExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const getTokenStatus = (token: RegistrationToken) => {
    if (token.status === 'used') return { text: 'Utilizado', color: 'bg-blue-900 text-blue-200 border-blue-700' };
    if (isTokenExpired(token.expiresAt)) return { text: 'Expirado', color: 'bg-red-900 text-red-200 border-red-700' };
    return { text: 'Ativo', color: 'bg-green-900 text-green-200 border-green-700' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m restantes`;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-purple-500" />
              <h1 className="text-2xl font-bold text-white">Sudo Admin</h1>
              <span className="text-sm text-gray-400">- Gerenciamento de Acesso</span>
            </div>
          </div>
          
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-900 text-purple-200 border border-purple-700">
            🔒 ACESSO RESTRITO
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('emails')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'emails'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Mail size={16} className="inline mr-2" />
            Emails Autorizados
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'tokens'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <QrCode size={16} className="inline mr-2" />
            Tokens de Registro
          </button>
        </div>

        {/* Add Email Form */}
        {activeTab === 'tokens' && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <QrCode size={20} />
              Gerar Token de Registro com QR Code
            </h2>
            <p className="text-gray-300 text-sm mb-4">
              Crie um token único com QR code que expira em 12 horas. O usuário precisará confirmar o email antes de acessar o cadastro.
            </p>
            
            <form onSubmit={handleAddEmail} className="flex gap-4">
              <div className="flex-1">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Digite o email para gerar token de registro..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newEmail.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  loading || !newEmail.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <QrCode size={20} />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'emails' && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Plus size={20} />
            Autorizar Novo Email
          </h2>
          <p className="text-gray-300 text-sm mb-4">
            Método tradicional: adiciona email diretamente à lista de autorizados.
          </p>
          
          <form onSubmit={handleAddEmail} className="flex gap-4">
            <div className="flex-1">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Digite o email para autorizar..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newEmail.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                loading || !newEmail.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <Plus size={20} />
            </button>
          </form>
        </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-3">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-600 text-green-200 p-4 rounded-lg mb-6 flex items-center gap-3">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Stats */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-6">
            {activeTab === 'emails' ? (
              <>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-400" />
                  <span className="text-gray-300">Total Autorizados: {authorizedEmails.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-gray-300">
                    Ativos: {authorizedEmails.filter(e => e.status === 'active').length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-purple-400" />
                  <span className="text-gray-300">
                    Utilizados: {authorizedEmails.filter(e => e.status === 'used').length}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <QrCode size={16} className="text-blue-400" />
                  <span className="text-gray-300">Total Tokens: {registrationTokens.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-gray-300">
                    Ativos: {registrationTokens.filter(t => t.status === 'active' && !isTokenExpired(t.expiresAt)).length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-red-400" />
                  <span className="text-gray-300">
                    Expirados: {registrationTokens.filter(t => isTokenExpired(t.expiresAt)).length}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'emails' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail size={20} />
              Emails Autorizados
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-white">Carregando...</div>
            </div>
          ) : authorizedEmails.length === 0 ? (
            <div className="text-center py-12">
              <Mail size={64} className="text-gray-600 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Nenhum email autorizado</h4>
              <p className="text-gray-400">
                Adicione emails para permitir que usuários criem contas na plataforma.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {authorizedEmails.map((item) => (
                <div key={item.id} className="px-6 py-4 hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Mail size={20} className="text-blue-400" />
                      <div>
                        <div className="text-white font-medium">{item.email}</div>
                        <div className="text-sm text-gray-400">
                          Adicionado em {formatDate(item.addedAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'active' 
                          ? 'bg-green-900 text-green-200 border border-green-700'
                          : 'bg-blue-900 text-blue-200 border border-blue-700'
                      }`}>
                        {item.status === 'active' ? 'Ativo' : 'Utilizado'}
                      </span>
                      
                      <button
                        onClick={() => handleDeleteEmail(item.id, item.email)}
                        className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-600 transition-colors"
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
        )}

        {/* Registration Tokens List */}
        {activeTab === 'tokens' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <QrCode size={20} />
                Tokens de Registro
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-white">Carregando...</div>
              </div>
            ) : registrationTokens.length === 0 ? (
              <div className="text-center py-12">
                <QrCode size={64} className="text-gray-600 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">Nenhum token gerado</h4>
                <p className="text-gray-400">
                  Gere tokens de registro com QR code para permitir cadastros temporários.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {registrationTokens.map((token) => {
                  const status = getTokenStatus(token);
                  return (
                    <div key={token.id} className="px-6 py-4 hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <QrCode size={20} className="text-purple-400" />
                          <div>
                            <div className="text-white font-medium">{token.email}</div>
                            <div className="text-sm text-gray-400">
                              Criado em {formatDate(token.createdAt)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {status.text === 'Ativo' ? formatTimeRemaining(token.expiresAt) : `Expira em ${formatDate(token.expiresAt)}`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                            {status.text}
                          </span>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowQRModal(token)}
                              className="text-gray-400 hover:text-purple-400 p-2 rounded-lg hover:bg-gray-600 transition-colors"
                              title="Ver QR Code"
                            >
                              <QrCode size={16} />
                            </button>
                            <button
                              onClick={() => copyToClipboard(token.registrationUrl || '')}
                              className="text-gray-400 hover:text-blue-400 p-2 rounded-lg hover:bg-gray-600 transition-colors"
                              title="Copiar URL"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteToken(token.id, token.email)}
                              className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-purple-900/20 border border-purple-600 rounded-lg p-6">
          <h4 className="text-purple-200 font-medium mb-2 flex items-center gap-2">
            <Shield size={16} />
            {activeTab === 'emails' ? 'Como funciona a restrição de acesso' : 'Como funcionam os tokens de registro'}
          </h4>
          {activeTab === 'emails' ? (
            <ul className="text-purple-100 text-sm space-y-2">
              <li>• Apenas emails autorizados aqui podem criar contas na plataforma</li>
              <li>• Usuários não autorizados verão uma mensagem de acesso restrito</li>
              <li>• Quando um email autorizado criar conta, o status muda para "Utilizado"</li>
              <li>• Você pode remover emails da lista a qualquer momento</li>
            </ul>
          ) : (
            <ul className="text-purple-100 text-sm space-y-2">
              <li>• Tokens geram URLs únicas com QR code que expiram em 12 horas</li>
              <li>• O usuário deve confirmar o email antes de acessar o cadastro</li>
              <li>• Cada token só pode ser usado uma vez</li>
              <li>• Tokens expirados são automaticamente invalidados</li>
              <li>• Ideal para convites temporários e controle de acesso</li>
            </ul>
          )}
        </div>

        {/* QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">QR Code de Registro</h3>
                <button
                  onClick={() => setShowQRModal(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg mb-4 inline-block">
                  <img 
                    src={showQRModal.qrCodeUrl} 
                    alt="QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                
                <div className="text-sm text-gray-300 mb-4">
                  <p><strong>Email:</strong> {showQRModal.email}</p>
                  <p><strong>Status:</strong> {getTokenStatus(showQRModal).text}</p>
                  <p><strong>Expira:</strong> {formatDate(showQRModal.expiresAt)}</p>
                  {getTokenStatus(showQRModal).text === 'Ativo' && (
                    <p><strong>Tempo restante:</strong> {formatTimeRemaining(showQRModal.expiresAt)}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => copyToClipboard(showQRModal.registrationUrl || '')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Copy size={16} />
                    Copiar URL
                  </button>
                  
                  <button
                    onClick={() => setShowQRModal(null)}
                    className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SudoAdminInterface;