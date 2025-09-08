import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasActiveLoginVerification } from '../../utils/loginVerificationManager';
import { 
  ArrowLeft, Plus, Trash2, Shield, 
  CheckCircle, AlertTriangle, QrCode, Copy, Clock, Mail, Users
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import QRCode from 'qrcode';

interface RegistrationToken {
  id: string;
  token: string;
  email: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'used' | 'expired';
  qrCodeUrl?: string;
  registrationUrl?: string;
}

const SudoAdminInterface = () => {
  const navigate = useNavigate();

  // Check if user is authorized sudo admin and has verification
  useEffect(() => {
    const checkAccess = async () => {
      if (!auth.currentUser || auth.currentUser.email !== 'daniel.mendes@dataholics.io') {
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

  const [registrationTokens, setRegistrationTokens] = useState<RegistrationToken[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQRModal, setShowQRModal] = useState<RegistrationToken | null>(null);


  // Load registration tokens
  useEffect(() => {
    loadRegistrationTokens();
  }, []);

  const loadRegistrationTokens = async () => {
    setLoading(true);
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
      setError('Erro ao carregar tokens de registro');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const generateRegistrationToken = async (email: string) => {
    const slug = crypto.randomUUID();
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // Código de 6 caracteres
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 horas
    
    // Usar domínio correto baseado no ambiente
    const isProduction = window.location.hostname === 'www.genoiapp.com' || window.location.hostname === 'genoiapp.com';
    const baseUrl = isProduction ? 'https://www.genoiapp.com' : window.location.origin;
    const registrationUrl = `${baseUrl}/invite/${slug}`;
    
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
        slug,
        token: slug, // Manter compatibilidade
        verificationCode,
        email: email.toLowerCase(),
        createdBy: auth.currentUser?.email || '',
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'active' as const,
        codeVerified: false,
        qrCodeUrl: qrCodeDataUrl,
        registrationUrl
      };

      const docRef = await addDoc(collection(db, 'registrationTokens'), tokenData);
      
      // Enviar email com código de verificação
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Acesso - Gen.OI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <img src="https://genoi.net/wp-content/uploads/2024/12/Logo-gen.OI-Novo-1-2048x1035.png" alt="Gen.OI" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Gen.OI - Código de Acesso</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Você foi convidado para a Gen.OI!</h2>
              <p style="margin-bottom: 25px;">
                Você recebeu um convite para criar uma conta na plataforma Gen.OI. 
                Para prosseguir com o cadastro, você precisará do código de verificação abaixo:
              </p>
              
              <div style="background: #f0f8ff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                <h3 style="color: #667eea; margin: 0 0 10px 0;">Seu Código de Verificação:</h3>
                <div style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 4px; font-family: monospace;">
                  ${verificationCode}
                </div>
              </div>
              
              <p style="margin-bottom: 20px;">
                <strong>Como usar:</strong>
              </p>
              <ol style="margin-bottom: 25px; padding-left: 20px;">
                <li>Acesse o link de cadastro: <a href="${registrationUrl}" style="color: #667eea;">${registrationUrl}</a></li>
                <li>Digite o código de verificação: <strong>${verificationCode}</strong></li>
                <li>Complete seu cadastro com suas informações pessoais</li>
              </ol>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Importante:</strong> Este código expira em 12 horas e só pode ser usado uma vez. 
                  Mantenha-o seguro e não compartilhe com terceiros.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
              <div style="font-size: 14px; color: #666;">
                <p style="color: #d32f2f; font-weight: bold;">
                  Atenção: Este e-mail é confidencial e não pode ser encaminhado externamente nem para outros usuários do banco ou do Habitat.
                </p>
              </div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>Esta mensagem foi enviada através da plataforma Gen.OI de inovação aberta.</p>
          </div>
        </body>
        </html>
      `;

      const emailPayload = {
        to: [{ 
          email: email.toLowerCase(), 
          name: email.split('@')[0] 
        }],
        from: { 
          email: 'contact@genoi.com.br', 
          name: 'Gen.OI - Acesso Temporário' 
        },
        subject: `Código de Acesso Gen.OI: ${verificationCode}`,
        html: emailHtml,
        text: `Seu código de verificação Gen.OI: ${verificationCode}\n\nAcesse: ${registrationUrl}\n\nEste código expira em 12 horas.`,
        reply_to: { 
          email: 'contact@genoi.net', 
          name: 'Gen.OI - Suporte' 
        },
        tags: ['admin', 'registration-code'],
        metadata: { 
          tokenId: docRef.id,
          verificationCode,
          registrationType: 'temporary_access'
        }
      };

      console.log('Enviando email com código de verificação:', { email, verificationCode });
      await addDoc(collection(db, 'emails'), emailPayload);
      
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

    // Check if email already has an active token
    const existingActiveToken = registrationTokens.find(
      token => token.email === emailToAdd && 
      token.status === 'active' && 
      !isTokenExpired(token.expiresAt)
    );
    
    if (existingActiveToken) {
      setError('Este email já possui um token ativo. Aguarde a expiração ou remova o token existente.');
      return;
    }

    // Check if email was already used
    const usedToken = registrationTokens.find(
      token => token.email === emailToAdd && token.status === 'used'
    );
    
    if (usedToken) {
      setError('Este email já foi utilizado para cadastro. Não é possível gerar novo token.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const registrationToken = await generateRegistrationToken(emailToAdd);
      
      setNewEmail('');
      setSuccess('Token de registro gerado com sucesso! QR Code criado.');
      setShowQRModal(registrationToken);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding email and generating token:', error);
      setError('Erro ao gerar token de registro');
    } finally {
      setLoading(false);
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

  const activeTokens = registrationTokens.filter(t => t.status === 'active' && !isTokenExpired(t.expiresAt));
  const usedTokens = registrationTokens.filter(t => t.status === 'used');
  const expiredTokens = registrationTokens.filter(t => isTokenExpired(t.expiresAt) || t.status === 'expired');

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
              <span className="text-sm text-gray-400">- Gerenciamento de Acesso com QR Code</span>
            </div>
          </div>
          
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-900 text-purple-200 border border-purple-700">
            🔒 ACESSO RESTRITO
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Add Email Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <QrCode size={20} />
            Gerar Acesso Temporário com QR Code
          </h2>
          <p className="text-gray-300 text-sm mb-4">
            Crie um token único com QR code que expira em 12 horas. O usuário só poderá se cadastrar com o email específico autorizado.
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
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                loading || !newEmail.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <QrCode size={20} />
                  Gerar QR Code
                </>
              )}
            </button>
          </form>
        </div>

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
            <div className="flex items-center gap-2">
              <QrCode size={16} className="text-blue-400" />
              <span className="text-gray-300">Total: {registrationTokens.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-gray-300">Ativos: {activeTokens.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              <span className="text-gray-300">Utilizados: {usedTokens.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-red-400" />
              <span className="text-gray-300">Expirados: {expiredTokens.length}</span>
            </div>
          </div>
        </div>

        {/* Registration Tokens List */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <QrCode size={20} />
              Tokens de Registro Temporário
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
                          <div className="text-xs text-gray-500 font-mono">
                            Token: {token.token.substring(0, 8)}...
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
                            title="Remover Token"
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

        {/* Info Box */}
        <div className="mt-8 bg-purple-900/20 border border-purple-600 rounded-lg p-6">
          <h4 className="text-purple-200 font-medium mb-2 flex items-center gap-2">
            <Shield size={16} />
            Como funciona o sistema de acesso temporário
          </h4>
          <ul className="text-purple-100 text-sm space-y-2">
            <li>• Cada email gera um token único com QR code válido por 12 horas</li>
            <li>• O usuário só pode se cadastrar com o email específico do token</li>
            <li>• Tentativas de cadastro com email diferente são bloqueadas</li>
            <li>• Após uso ou expiração, o token fica permanentemente inválido</li>
            <li>• Emails já utilizados não podem gerar novos tokens</li>
            <li>• Sistema previne fraudes e garante controle total de acesso</li>
          </ul>
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
                
                <div className="text-sm text-gray-300 mb-4 space-y-1">
                  <p><strong>Email autorizado:</strong> {showQRModal.email}</p>
                  <p><strong>Status:</strong> {getTokenStatus(showQRModal).text}</p>
                  <p><strong>Criado:</strong> {formatDate(showQRModal.createdAt)}</p>
                  <p><strong>Expira:</strong> {formatDate(showQRModal.expiresAt)}</p>
                  {getTokenStatus(showQRModal).text === 'Ativo' && (
                    <p className="text-yellow-300"><strong>Tempo restante:</strong> {formatTimeRemaining(showQRModal.expiresAt)}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => copyToClipboard(showQRModal.registrationUrl || '')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Copy size={16} />
                    Copiar URL de Registro
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