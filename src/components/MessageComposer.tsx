import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, Send, Smartphone, 
  User, Building2, Clock, CheckCircle, AlertCircle,
  Globe, Plus, Users, Edit, ChevronDown, Linkedin, Instagram
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  query,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useTranslation } from '../utils/i18n';
import { validateAndFormatPhone, formatPhoneDisplay } from '../utils/phoneValidation';
import { sendWhatsAppMessage } from '../utils/whatsappInstanceManager';

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

interface StartupData {
  id: string;
  startupName: string;
  startupData: {
    name: string;
    email: string;
    contacts?: Contact[];
    socialLinks?: {
      linkedin?: string;
      facebook?: string;
      twitter?: string;
      instagram?: string;
    };
  };
}

const MessageComposer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { startupId } = useParams<{ startupId: string }>();
  const [startupData, setStartupData] = useState<StartupData | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageType, setMessageType] = useState<'email' | 'whatsapp'>('email');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(0);
  const [selectedPhoneIndex, setSelectedPhoneIndex] = useState(0);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderCompany, setSenderCompany] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser || !startupId) {
        navigate('/login');
        return;
      }

      try {
        // Fetch startup data
        const startupDoc = await getDoc(doc(db, 'selectedStartups', startupId));
        if (!startupDoc.exists()) {
          console.error('Startup not found');
          return;
        }

        const startup = { id: startupDoc.id, ...startupDoc.data() } as StartupData;
        setStartupData(startup);

        // Initialize contacts with startup email and social links
        const existingContacts = startup.startupData.contacts || [];
        const defaultContacts: Contact[] = [];

        // Add startup email contact
        if (startup.startupData.email) {
          defaultContacts.push({
            id: 'startup-email',
            name: startup.startupData.name,
            emails: [startup.startupData.email],
            type: 'startup'
          });
        }

        // Add LinkedIn contacts from social links
        if (startup.startupData.socialLinks?.linkedin) {
          defaultContacts.push({
            id: 'startup-linkedin',
            name: `${startup.startupData.name} (LinkedIn)`,
            emails: startup.startupData.email ? [startup.startupData.email] : [],
            linkedin: startup.startupData.socialLinks.linkedin,
            type: 'startup',
            role: 'LinkedIn Profile'
          });
        }

        // Add Instagram contacts from social links
        if (startup.startupData.socialLinks?.instagram) {
          defaultContacts.push({
            id: 'startup-instagram',
            name: `${startup.startupData.name} (Instagram)`,
            emails: startup.startupData.email ? [startup.startupData.email] : [],
            instagram: startup.startupData.socialLinks.instagram,
            type: 'startup',
            role: 'Instagram Profile'
          });
        }

        const allContacts = [...defaultContacts, ...existingContacts];
        setContacts(allContacts);
        
        if (allContacts.length > 0) {
          setSelectedContact(allContacts[0]);
        }

        // Fetch user data for sender name and auto-generate subject
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSenderName(userData.name || '');
          setSenderCompany(userData.company || '');
          
          // Auto-generate subject for email
          if (messageType === 'email') {
            const company = userData.company || '';
            setSubject(`A ${company} deseja contatar a ${startup.startupData.name} - `);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startupId, navigate]);

  // Update subject when message type or startup changes
  useEffect(() => {
    if (messageType === 'email' && startupData && senderCompany) {
      setSubject(`A ${senderCompany} deseja contatar a ${startupData.startupData.name} - `);
    }
  }, [messageType, startupData, senderCompany]);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setSelectedEmailIndex(0);
    setSelectedPhoneIndex(0);
    setShowContactDropdown(false);
    
    // Show phone input if WhatsApp is selected but contact has no phone
    if (messageType === 'whatsapp' && (!contact.phones || contact.phones.length === 0)) {
      setShowPhoneInput(true);
    } else {
      setShowPhoneInput(false);
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    setNewPhoneNumber(value);
    
    if (value.trim()) {
      const validation = validateAndFormatPhone(value);
      if (!validation.isValid) {
        setPhoneError(validation.error || 'Número inválido');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  };

  const handleAddPhoneNumber = async () => {
    if (!selectedContact || !newPhoneNumber.trim() || !startupData) return;

    const validation = validateAndFormatPhone(newPhoneNumber);
    
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Número inválido');
      return;
    }

    try {
      // Update the contact with the new phone number
      const updatedContact = { 
        ...selectedContact, 
        phones: [...(selectedContact.phones || []), validation.formattedNumber!]
      };
      
      if (selectedContact.id.startsWith('startup-')) {
        // For default contacts, add to the contacts array
        const updatedContacts = [...(startupData.startupData.contacts || []), {
          ...updatedContact,
          id: Date.now().toString()
        }];
        
        await updateDoc(doc(db, 'selectedStartups', startupData.id), {
          'startupData.contacts': updatedContacts
        });
      } else {
        // Update existing contact
        const updatedContacts = (startupData.startupData.contacts || []).map(contact =>
          contact.id === selectedContact.id ? updatedContact : contact
        );
        
        await updateDoc(doc(db, 'selectedStartups', startupData.id), {
          'startupData.contacts': updatedContacts
        });
      }

      setSelectedContact(updatedContact);
      setContacts(prev => prev.map(contact => 
        contact.id === selectedContact.id ? updatedContact : contact
      ));
      setNewPhoneNumber('');
      setPhoneError('');
      setShowPhoneInput(false);
      setStatus({ type: 'success', message: t.whatsAppNumberAddedSuccess });
    } catch (error) {
      console.error('Error adding phone number:', error);
      setStatus({ type: 'error', message: t.errorAddingPhoneNumber });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !auth.currentUser || !startupData || !selectedContact) return;

    if (messageType === 'email' && !subject.trim()) {
      setStatus({ type: 'error', message: t.subjectRequired });
      return;
    }

    const selectedEmail = selectedContact.emails?.[selectedEmailIndex];
    const selectedPhone = selectedContact.phones?.[selectedPhoneIndex];

    if (messageType === 'email' && !selectedEmail) {
      setStatus({ type: 'error', message: t.emailRequired });
      return;
    }

    if (messageType === 'whatsapp' && !selectedPhone) {
      setStatus({ type: 'error', message: t.invalidPhoneNumber });
      return;
    }

    // Validate WhatsApp number
    if (messageType === 'whatsapp' && selectedPhone) {
      const validation = validateAndFormatPhone(selectedPhone);
      if (!validation.isValid) {
        setStatus({ type: 'error', message: `Número de WhatsApp inválido: ${validation.error}` });
        return;
      }
    }

    setIsSending(true);
    setStatus(null);

    try {
      let success = false;
      let errorMessage = '';
      let finalMessage = message.trim();
      let instanceUsed = '';
      let isFirstMessage = false;

      if (messageType === 'whatsapp') {
        // Send via Evolution API with instance management
        const validation = validateAndFormatPhone(selectedPhone!);
        const formattedPhone = validation.formattedNumber!;
        
        console.log(`🚀 Enviando WhatsApp para startup ${startupData.id} via sistema de instâncias`);
        
        const whatsappResult = await sendWhatsAppMessage(
          startupData.id,
          auth.currentUser.uid,
          formattedPhone,
          finalMessage,
          senderCompany,
          startupData.startupName
        );

        if (whatsappResult.success) {
          success = true;
          instanceUsed = whatsappResult.instanceUsed || '';
          isFirstMessage = whatsappResult.isFirstMessage || false;
          console.log(`✅ WhatsApp enviado com sucesso via instância: ${instanceUsed} (primeira mensagem: ${isFirstMessage})`);
        } else {
          errorMessage = whatsappResult.error || 'Falha no envio do WhatsApp';
          console.error(`❌ Falha no envio do WhatsApp:`, whatsappResult.error);
        }
      } else {
        // Send email via MailerSend Firebase Extension
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mensagem da Gen.OI</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <img src="https://genoi.net/wp-content/uploads/2024/12/Logo-gen.OI-Novo-1-2048x1035.png" alt="Gen.OI" style="height: 60px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Gen.OI - Inovação Aberta</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="white-space: pre-wrap; margin-bottom: 25px; font-size: 16px;">
                  ${finalMessage}
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                <div style="font-size: 14px; color: #666;">
                  <p><strong>Atenciosamente,</strong><br>
                  ${senderName}, ${senderCompany}</p>
                  <p style="margin-top: 20px;">
                    <strong>Gen.OI</strong><br>
                    Conectando empresas às melhores startups do mundo<br>
                    🌐 <a href="https://genoi.net" style="color: #667eea;">genoi.net</a><br>
                    📧 <a href="mailto:contact@genoi.net" style="color: #667eea;">contact@genoi.net</a>
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
            email: selectedEmail!, 
            name: selectedContact.name 
          }],
          from: { 
            email: 'contact@genoi.com.br', 
            name: 'Gen.OI - Inovação Aberta' 
          },
          subject: subject.trim(),
          html: emailHtml,
          text: finalMessage,
          reply_to: { 
            email: 'contact@genoi.net', 
            name: 'Gen.OI - Suporte' 
          },
          tags: ['crm', 'startup-interaction'],
          metadata: { 
            startupId: startupData.id, 
            userId: auth.currentUser.uid,
            recipientType: selectedContact.type,
            timestamp: new Date().toISOString()
          }
        };

        console.log('Sending email via MailerSend extension:', emailPayload);

        await addDoc(collection(db, 'emails'), emailPayload);
        success = true;
      }

      if (success) {
        // Save message to CRM
        const messageData: any = {
          startupId: startupData.id,
          userId: auth.currentUser.uid,
          senderName,
          recipientName: selectedContact.name,
          recipientType: selectedContact.type,
          messageType,
          message: finalMessage,
          sentAt: new Date().toISOString(),
          status: 'sent' as const
        };

        if (messageType === 'email' && selectedEmail) {
          messageData.recipientEmail = selectedEmail;
        }
        if (messageType === 'whatsapp' && selectedPhone) {
          const validation = validateAndFormatPhone(selectedPhone);
          messageData.recipientPhone = validation.formattedNumber!;
          if (instanceUsed) {
            messageData.whatsappInstance = instanceUsed;
          }
          if (isFirstMessage !== undefined) {
            messageData.isFirstMessage = isFirstMessage;
          }
        }
        if (messageType === 'email' && subject.trim()) {
          messageData.subject = subject.trim();
        }

        await addDoc(collection(db, 'crmMessages'), messageData);

        const successMessage = messageType === 'email' 
          ? t.emailSentSuccess 
          : `${t.whatsAppSentSuccess}${instanceUsed ? ` (Instância: ${instanceUsed})` : ''}${isFirstMessage ? ' - Primeira mensagem com complemento' : ' - Mensagem subsequente'}`;

        setStatus({ 
          type: 'success', 
          message: successMessage
        });

        // Navigate back to timeline immediately
        navigate(`/startup/${startupId}/timeline`);
      } else {
        throw new Error(errorMessage || 'Falha no envio');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : t.errorSendingMessage
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    navigate(`/startup/${startupId}/timeline`);
  };

  const handleManageContacts = () => {
    navigate(`/startup/${startupId}/contacts`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">{t.loading}</div>
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
          <button
            onClick={handleBack}
            className="text-gray-300 hover:text-white focus:outline-none"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 ml-4">
            <Building2 size={20} className="text-gray-400" />
            <h2 className="text-lg font-medium">{t.newMessage} - {startupData.startupName}</h2>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <h1 className="text-xl lg:text-2xl font-bold text-white">{t.composeMessage}</h1>
            <button
              onClick={handleManageContacts}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Users size={16} />
              {t.manageContacts}
            </button>
          </div>

          {/* Message Type Selection */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMessageType('email')}
              className={`flex items-center gap-2 px-4 lg:px-6 py-3 rounded-lg transition-colors ${
                messageType === 'email'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Mail size={20} />
              Email
            </button>
            <button
              onClick={() => setMessageType('whatsapp')}
              className={`flex items-center gap-2 px-4 lg:px-6 py-3 rounded-lg transition-colors ${
                messageType === 'whatsapp'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Smartphone size={20} />
              WhatsApp
            </button>
          </div>

          {/* Contact Selection Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {t.recipient}
            </label>
            <div className="relative">
              <button
                onClick={() => setShowContactDropdown(!showContactDropdown)}
                className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <User size={20} className="text-blue-400" />
                  <div className="text-left">
                    <div className="font-medium">{selectedContact?.name || t.selectContact}</div>
                    {selectedContact && (
                      <div className="text-sm text-gray-400">
                        {messageType === 'email' && selectedContact.emails && selectedContact.emails.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Mail size={12} />
                            {selectedContact.emails[selectedEmailIndex]}
                            {selectedContact.emails.length > 1 && (
                              <span className="text-xs">({selectedEmailIndex + 1}/{selectedContact.emails.length})</span>
                            )}
                          </div>
                        )}
                        {messageType === 'whatsapp' && selectedContact.phones && selectedContact.phones.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Phone size={12} />
                            {formatPhoneDisplay(selectedContact.phones[selectedPhoneIndex])}
                            {selectedContact.phones.length > 1 && (
                              <span className="text-xs">({selectedPhoneIndex + 1}/{selectedContact.phones.length})</span>
                            )}
                          </div>
                        )}
                        {selectedContact.role && (
                          <div className="text-xs">{selectedContact.role}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown size={20} className="text-gray-400" />
              </button>

              {showContactDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleContactSelect(contact)}
                      className="w-full p-4 text-left hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <User size={16} className="text-blue-400" />
                        <div className="flex-1">
                          <div className="font-medium text-white">{contact.name}</div>
                          {contact.role && (
                            <div className="text-sm text-gray-400">{contact.role}</div>
                          )}
                          {messageType === 'email' && contact.emails && contact.emails.length > 0 && (
                            <div className="text-sm text-gray-300 flex items-center gap-1">
                              <Mail size={12} />
                              {contact.emails[0]}
                              {contact.emails.length > 1 && (
                                <span className="text-xs">+{contact.emails.length - 1} mais</span>
                              )}
                            </div>
                          )}
                          {messageType === 'whatsapp' && contact.phones && contact.phones.length > 0 && (
                            <div className="text-sm text-gray-300 flex items-center gap-1">
                              <Phone size={12} />
                              {formatPhoneDisplay(contact.phones[0])}
                              {contact.phones.length > 1 && (
                                <span className="text-xs">+{contact.phones.length - 1} mais</span>
                              )}
                            </div>
                          )}
                          {messageType === 'whatsapp' && (!contact.phones || contact.phones.length === 0) && (
                            <div className="text-sm text-yellow-400">{t.noWhatsAppRegistered}</div>
                          )}
                          {contact.linkedin && (
                            <div className="text-xs text-blue-400 flex items-center gap-1">
                              <Linkedin size={10} />
                              LinkedIn
                            </div>
                          )}
                          {contact.instagram && (
                            <div className="text-xs text-pink-400 flex items-center gap-1">
                              <Instagram size={10} />
                              Instagram
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {contact.type === 'startup' ? t.startup : t.founder}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Email/Phone Selection for contacts with multiple options */}
          {selectedContact && messageType === 'email' && selectedContact.emails && selectedContact.emails.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.selectEmail}
              </label>
              <select
                value={selectedEmailIndex}
                onChange={(e) => setSelectedEmailIndex(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectedContact.emails.map((email, index) => (
                  <option key={index} value={index}>
                    {email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedContact && messageType === 'whatsapp' && selectedContact.phones && selectedContact.phones.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.selectPhone}
              </label>
              <select
                value={selectedPhoneIndex}
                onChange={(e) => setSelectedPhoneIndex(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectedContact.phones.map((phone, index) => (
                  <option key={index} value={index}>
                    {formatPhoneDisplay(phone)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Phone Number Input for WhatsApp */}
          {showPhoneInput && (
            <div className="mb-6 bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
              <h4 className="text-yellow-400 font-medium mb-3">{t.addWhatsAppNumber}</h4>
              <p className="text-sm text-gray-300 mb-3">
                Exemplos de números válidos:
                <br />• Brasil: 5511995736666
                <br />• Suíça: 41765099123
                <br />• EUA: 12345678901
                <br />• Reino Unido: 447700900123
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="tel"
                    value={newPhoneNumber}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    placeholder="Digite o número com código do país"
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${
                      phoneError 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-600 focus:ring-blue-500'
                    }`}
                  />
                  {phoneError && (
                    <p className="text-red-400 text-xs mt-1">{phoneError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddPhoneNumber}
                    disabled={!newPhoneNumber.trim() || !!phoneError}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
                  >
                    {t.add}
                  </button>
                  <button
                    onClick={() => {
                      setShowPhoneInput(false);
                      setNewPhoneNumber('');
                      setPhoneError('');
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subject (only for email) */}
          {messageType === 'email' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.subject} *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`A ${senderCompany} deseja contatar a ${startupData.startupName} - `}
              />
            </div>
          )}

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.message} *
              {messageType === 'whatsapp' && (
                <span className="text-xs text-blue-400 block mt-1">
                  💡 O complemento "Mensagem enviada pela genoi.net..." será adicionado automaticamente apenas na primeira mensagem para esta startup
                </span>
              )}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={`Digite sua mensagem ${messageType === 'whatsapp' ? 'do WhatsApp' : 'de email'}...`}
            />
          </div>

          {/* Status Messages */}
          {status && (
            <div className={`mb-6 p-4 rounded-lg ${
              status.type === 'success' 
                ? 'bg-green-900/50 text-green-200 border border-green-800' 
                : 'bg-red-900/50 text-red-200 border border-red-800'
            }`}>
              {status.message}
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSendMessage}
              disabled={isSending || !message.trim() || (messageType === 'email' && !subject.trim()) || !selectedContact}
              className={`flex items-center gap-2 px-6 lg:px-8 py-3 rounded-lg font-medium transition-colors ${
                isSending || !message.trim() || (messageType === 'email' && !subject.trim()) || !selectedContact
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : messageType === 'email'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  {t.sending}
                </>
              ) : (
                <>
                  <Send size={20} />
                  {messageType === 'email' ? t.sendEmail : t.sendWhatsApp}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageComposer;