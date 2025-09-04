import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, MessageSquare, Mail, Phone, 
  Send, User, Building2, Clock, CheckCircle, AlertCircle,
  Smartphone, Globe, Plus, Users, Edit
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from '../utils/i18n';

interface StartupData {
  id: string;
  userId: string;
  userEmail: string;
  challengeId: string;
  challengeTitle: string;
  startupName: string;
  startupData: {
    name: string;
    email: string;
    website: string;
    description: string;
    category: string;
    vertical: string;
    foundedYear: string;
    teamSize: string;
    businessModel: string;
    city: string;
    rating: number;
    reasonForChoice: string;
    socialLinks?: {
      linkedin?: string;
      facebook?: string;
      twitter?: string;
      instagram?: string;
    };
    contacts?: Contact[];
  };
  selectedAt: string;
  stage: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  name: string;
  emails?: string[];
  phones?: string[];
  linkedin?: string;
  instagram?: string;
  role?: string;
  type: 'startup' | 'founder';
}

interface CRMMessage {
  id: string;
  startupId: string;
  userId: string;
  senderName: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientType: 'startup' | 'founder';
  messageType: 'email' | 'whatsapp';
  subject?: string;
  message: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
  response?: string;
  responseAt?: string;
}

interface StartupInteractionTimelineProps {
  onBack: () => void;
}

const StartupInteractionTimeline = ({ onBack }: StartupInteractionTimelineProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { startupId } = useParams<{ startupId: string }>();
  const [startupData, setStartupData] = useState<StartupData | null>(null);
  const [messages, setMessages] = useState<CRMMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!auth.currentUser || !startupId) return [];

    try {
      const messagesQuery = query(
        collection(db, 'crmMessages'),
        where('startupId', '==', startupId)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const allMessages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CRMMessage[];

      const userMessages = allMessages.filter(message => message.userId === auth.currentUser?.uid);
      userMessages.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      
      return userMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      // Validate startupId before making any Firebase calls
      if (!startupId || typeof startupId !== 'string' || startupId.trim() === '') {
        console.error('Invalid startupId:', startupId);
        navigate('/saved-startups');
        return;
      }

      try {
        const startupDoc = await getDoc(doc(db, 'selectedStartups', startupId));
        if (!startupDoc.exists()) {
          console.error('Startup not found');
          navigate('/saved-startups');
          return;
        }

        const startup = { id: startupDoc.id, ...startupDoc.data() } as StartupData;
        setStartupData(startup);

        const messagesList = await fetchMessages();
        setMessages(messagesList);
      } catch (error) {
        console.error('Error fetching data:', error);
        navigate('/saved-startups');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startupId, navigate]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail size={16} className="text-blue-400" />;
      case 'whatsapp':
        return <Smartphone size={16} className="text-green-400" />;
      default:
        return <MessageSquare size={16} className="text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-yellow-400" />;
    }
  };

  const formatPhoneDisplay = (phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
      const areaCode = cleanPhone.substring(2, 4);
      const firstPart = cleanPhone.substring(4, 9);
      const secondPart = cleanPhone.substring(9);
      return `+55 ${areaCode} ${firstPart}-${secondPart}`;
    } else if (cleanPhone.length === 11) {
      const areaCode = cleanPhone.substring(0, 2);
      const firstPart = cleanPhone.substring(2, 7);
      const secondPart = cleanPhone.substring(7);
      return `${areaCode} ${firstPart}-${secondPart}`;
    }
    
    return phone;
  };

  const handleContactsList = () => {
    navigate(`/startup/${startupId}/contacts`);
  };

  const handleNewMessage = () => {
    navigate(`/startup/${startupId}/message`);
  };

  const handleBackToSavedStartups = () => {
    navigate('/saved-startups');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">{t.loadingTimeline}</div>
      </div>
    );
  }

  if (!startupData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">{t.startupNotFound}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="flex flex-col p-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToSavedStartups}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-gray-400" />
              <h2 className="text-lg font-medium">{startupData.startupName}</h2>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleContactsList}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Users size={14} />
              {t.listContacts}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        {/* Timeline Section */}
        <div className="bg-gray-800 rounded-lg p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-bold text-white">{t.interactionTimeline}</h3>
            <button
              onClick={handleNewMessage}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm lg:text-base"
            >
              <Edit size={16} />
              {t.newMessage}
            </button>
          </div>
          
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare size={64} className="text-gray-600 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">{t.noInteractions}</h4>
              <p className="text-gray-400 mb-6">
                {t.firstMessage}
              </p>
              <button
                onClick={handleNewMessage}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors mx-auto"
              >
                <Edit size={20} />
                {t.sendFirstMessage}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="border-l-4 border-blue-500 pl-4 lg:pl-6 py-4 bg-gray-700 rounded-r-lg">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3">
                      {getMessageIcon(message.messageType)}
                      <span className="font-medium text-white text-base lg:text-lg">
                        {message.messageType === 'email' ? 'Email' : 'WhatsApp'} {t.emailTo} {message.recipientName}
                      </span>
                      {getStatusIcon(message.status)}
                    </div>
                    <span className="text-sm text-gray-400">
                      {formatDate(message.sentAt)}
                    </span>
                  </div>
                  
                  {message.subject && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-400">{t.subject}: </span>
                      <span className="text-white font-medium">{message.subject}</span>
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <span className="text-sm text-gray-400">
                      {message.messageType === 'email' ? `${t.emailTo}` : `${t.whatsAppTo}`}
                    </span>
                    <span className="text-white">
                      {message.messageType === 'email' 
                        ? message.recipientEmail 
                        : message.recipientPhone ? formatPhoneDisplay(message.recipientPhone) : 'N/A'
                      }
                    </span>
                  </div>
                  
                  <div className="bg-gray-600 rounded-lg p-4 mb-3">
                    <p className="text-gray-100 whitespace-pre-wrap leading-relaxed">{message.message}</p>
                  </div>
                  
                  {message.response && (
                    <div className="mt-4 p-4 bg-green-900/30 border border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <User size={16} className="text-green-400" />
                        <span className="text-sm text-green-400 font-medium">{t.responseReceived}</span>
                        <span className="text-xs text-gray-400">
                          {message.responseAt && formatDate(message.responseAt)}
                        </span>
                      </div>
                      <p className="text-gray-100">{message.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartupInteractionTimeline;