import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../utils/i18n';
import { MessageSquare } from 'lucide-react';

// Modal de acesso restrito
const RestrictedAccessModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent('Olá! Gostaria de solicitar acesso à plataforma Gen.OI. Poderia me ajudar?');
    const whatsappUrl = `https://wa.me/5511995736666?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-700">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} className="text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4">Acesso Restrito</h3>
          <p className="text-gray-300 mb-6">
            Esta plataforma possui acesso restrito. Apenas usuários autorizados podem criar contas.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Entre em contato conosco para solicitar acesso à plataforma.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleWhatsAppContact}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Contatar via WhatsApp
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    company: 'bradesco', // Default para Bradesco
    email: '',
    phone: '',
    password: '',
    terms: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const navigate = useNavigate();

  const checkDeletedUser = async (email: string) => {
    const q = query(
      collection(db, 'deletedUsers'),
      where('email', '==', email.toLowerCase().trim())
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const checkAuthorizedEmail = async (email: string) => {
    const q = query(
      collection(db, 'authorizedEmails'),
      where('email', '==', email.toLowerCase().trim()),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty ? querySnapshot.docs[0] : null;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.terms) {
      setError('Você precisa aceitar os termos de uso para continuar.');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      const isDeleted = await checkDeletedUser(formData.email);
      if (isDeleted) {
        setError('Email e dados já excluídos da plataforma');
        setIsLoading(false);
        return;
      }

      // Check if email is authorized
      const authorizedDoc = await checkAuthorizedEmail(formData.email);
      if (!authorizedDoc) {
        setShowRestrictedModal(true);
        setIsLoading(false);
        return;
      }
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email.trim(), 
        formData.password
      );
      const user = userCredential.user;

      const transactionId = crypto.randomUUID();
      const now = new Date();
      const expirationDate = new Date(now.setMonth(now.getMonth() + 1));

      const userData = {
        uid: user.uid,
        name: formData.name.trim(),
        cpf: formData.cpf.trim(),
        company: formData.company.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        plan: 'Padawan',
        acceptedTerms: true,
        createdAt: new Date().toISOString(),
        termsAcceptanceId: transactionId
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      await setDoc(doc(db, 'tokenUsage', user.uid), {
        uid: user.uid,
        email: formData.email.trim().toLowerCase(),
        plan: 'Padawan',
        totalTokens: 100000,
        usedTokens: 0,
        lastUpdated: new Date().toISOString(),
        expirationDate: expirationDate.toISOString()
      });

      await setDoc(doc(collection(db, 'gdprCompliance'), transactionId), {
        uid: user.uid,
        email: formData.email.trim().toLowerCase(),
        type: 'terms_acceptance',
        acceptedTerms: true,
        acceptedAt: new Date().toISOString(),
        transactionId
      });

      await setDoc(doc(collection(db, 'gdprCompliance'), crypto.randomUUID()), {
        uid: user.uid,
        email: formData.email.trim().toLowerCase(),
        type: 'registration',
        registeredAt: new Date().toISOString(),
        transactionId: crypto.randomUUID()
      });

      // Mark email as used
      await updateDoc(doc(db, 'authorizedEmails', authorizedDoc.id), {
        status: 'used',
        usedAt: new Date().toISOString(),
        usedBy: user.uid
      });
      await sendEmailVerification(user);

      navigate('/verify-email');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso. Por favor, use outro email ou faça login.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email inválido. Por favor, verifique o email informado.');
      } else if (error.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Erro ao criar conta. Por favor, tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <RestrictedAccessModal 
        isOpen={showRestrictedModal} 
        onClose={() => setShowRestrictedModal(false)} 
      />
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src="https://genoi.net/wp-content/uploads/2024/12/Logo-gen.OI-Novo-1-2048x1035.png" alt="Genie Logo" className="mx-auto h-24" />
          <h2 className="mt-6 text-3xl font-bold text-white">{t.register}</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-center bg-red-900/20 p-3 rounded-md">{error}</div>}
          <div className="space-y-4">
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.name}
            />
            <input
              type="text"
              name="cpf"
              required
              value={formData.cpf}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.cpf}
            />
            <select
              name="company"
              value={formData.company}
              onChange={handleSelectChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bradesco">Bradesco</option>
              <option value="habitat">Habitat</option>
            </select>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.email}
            />
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.phone}
            />
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.password}
              minLength={6}
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
              />
              <label className="ml-2 block text-sm text-gray-300">
                Declaro que faço parte do Bradesco ou inovaBra habitat
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !formData.terms}
              className={`w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 rounded-md text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading || !formData.terms ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Criando conta...' : t.register}
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-lg text-blue-400 hover:text-blue-500 font-medium">
              {t.alreadyHaveAccount}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;