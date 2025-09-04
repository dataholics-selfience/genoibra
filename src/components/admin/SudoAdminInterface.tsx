import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Mail, Shield, 
  CheckCircle, AlertTriangle, Users, Database
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

interface AuthorizedEmail {
  id: string;
  email: string;
  addedBy: string;
  addedAt: string;
  status: 'active' | 'used';
}

const SudoAdminInterface = () => {
  const navigate = useNavigate();
  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
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
      const docRef = await addDoc(collection(db, 'authorizedEmails'), {
        email: emailToAdd,
        addedBy: auth.currentUser?.email,
        addedAt: new Date().toISOString(),
        status: 'active'
      });

      const newAuthorizedEmail: AuthorizedEmail = {
        id: docRef.id,
        email: emailToAdd,
        addedBy: auth.currentUser?.email || '',
        addedAt: new Date().toISOString(),
        status: 'active'
      };

      setAuthorizedEmails(prev => [newAuthorizedEmail, ...prev]);
      setNewEmail('');
      setError('');
      setSuccess('Email autorizado com sucesso!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding authorized email:', error);
      setError('Erro ao autorizar email');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
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
        {/* Add Email Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Plus size={20} />
            Autorizar Novo Email
          </h2>
          
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
          </div>
        </div>

        {/* Authorized Emails List */}
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

        {/* Info Box */}
        <div className="mt-8 bg-purple-900/20 border border-purple-600 rounded-lg p-6">
          <h4 className="text-purple-200 font-medium mb-2 flex items-center gap-2">
            <Shield size={16} />
            Como funciona a restrição de acesso
          </h4>
          <ul className="text-purple-100 text-sm space-y-2">
            <li>• Apenas emails autorizados aqui podem criar contas na plataforma</li>
            <li>• Usuários não autorizados verão uma mensagem de acesso restrito</li>
            <li>• Quando um email autorizado criar conta, o status muda para "Utilizado"</li>
            <li>• Você pode remover emails da lista a qualquer momento</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SudoAdminInterface;