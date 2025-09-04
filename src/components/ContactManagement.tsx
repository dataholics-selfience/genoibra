import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, User, Building2, Plus, 
  Edit2, Trash2, Save, X, UserPlus, Linkedin, Instagram
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useTranslation } from '../utils/i18n';
import { validateAndFormatPhone, formatPhoneDisplay } from '../utils/phoneValidation';

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
      instagram?: string;
    };
  };
}

const ContactManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { startupId } = useParams<{ startupId: string }>();
  const [startupData, setStartupData] = useState<StartupData | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: '',
    emails: [''],
    phones: [''],
    linkedin: '',
    instagram: '',
    role: '',
    type: 'startup'
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [phoneErrors, setPhoneErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser || !startupId) {
        navigate('/login');
        return;
      }

      try {
        const startupDoc = await getDoc(doc(db, 'selectedStartups', startupId));
        if (!startupDoc.exists()) {
          console.error('Startup not found');
          return;
        }

        const startup = { id: startupDoc.id, ...startupDoc.data() } as StartupData;
        setStartupData(startup);

        // Initialize contacts with default startup contact and social links
        const existingContacts = startup.startupData.contacts || [];
        const defaultContacts: Contact[] = [];

        // Add startup email contact
        if (startup.startupData.email) {
          defaultContacts.push({
            id: 'default-email',
            name: startup.startupData.name,
            emails: [startup.startupData.email],
            type: 'startup'
          });
        }

        // Add LinkedIn contact if available
        if (startup.startupData.socialLinks?.linkedin) {
          defaultContacts.push({
            id: 'default-linkedin',
            name: `${startup.startupData.name} (LinkedIn)`,
            linkedin: startup.startupData.socialLinks.linkedin,
            emails: startup.startupData.email ? [startup.startupData.email] : [],
            type: 'startup',
            role: 'LinkedIn Profile'
          });
        }

        // Add Instagram contact if available
        if (startup.startupData.socialLinks?.instagram) {
          defaultContacts.push({
            id: 'default-instagram',
            name: `${startup.startupData.name} (Instagram)`,
            instagram: startup.startupData.socialLinks.instagram,
            emails: startup.startupData.email ? [startup.startupData.email] : [],
            type: 'startup',
            role: 'Instagram Profile'
          });
        }
        
        const allContacts = [...defaultContacts, ...existingContacts];
        setContacts(allContacts);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startupId, navigate]);

  const validatePhoneNumber = (phone: string, index: number, isEditing: boolean = false): string | null => {
    if (!phone.trim()) return null;
    
    const validation = validateAndFormatPhone(phone);
    const errorKey = isEditing ? `edit-${index}` : `new-${index}`;
    
    if (!validation.isValid) {
      setPhoneErrors(prev => ({
        ...prev,
        [errorKey]: validation.error || 'Número inválido'
      }));
      return null;
    } else {
      setPhoneErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
      return validation.formattedNumber!;
    }
  };

  const handleAddEmail = (contactData: Partial<Contact>, setContactData: (data: Partial<Contact>) => void) => {
    const emails = contactData.emails || [''];
    setContactData({ ...contactData, emails: [...emails, ''] });
  };

  const handleRemoveEmail = (index: number, contactData: Partial<Contact>, setContactData: (data: Partial<Contact>) => void) => {
    const emails = contactData.emails || [];
    if (emails.length > 1) {
      setContactData({ ...contactData, emails: emails.filter((_, i) => i !== index) });
    }
  };

  const handleAddPhone = (contactData: Partial<Contact>, setContactData: (data: Partial<Contact>) => void) => {
    const phones = contactData.phones || [''];
    setContactData({ ...contactData, phones: [...phones, ''] });
  };

  const handleRemovePhone = (index: number, contactData: Partial<Contact>, setContactData: (data: Partial<Contact>) => void) => {
    const phones = contactData.phones || [];
    if (phones.length > 1) {
      setContactData({ ...contactData, phones: phones.filter((_, i) => i !== index) });
      // Remove error for this phone
      const errorKey = `new-${index}`;
      setPhoneErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handlePhoneChange = (
    index: number, 
    value: string, 
    contactData: Partial<Contact>, 
    setContactData: (data: Partial<Contact>) => void,
    isEditing: boolean = false
  ) => {
    const phones = [...(contactData.phones || [''])];
    phones[index] = value;
    setContactData({ ...contactData, phones });
    
    // Validate phone number
    if (value.trim()) {
      validatePhoneNumber(value, index, isEditing);
    } else {
      const errorKey = isEditing ? `edit-${index}` : `new-${index}`;
      setPhoneErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !startupData || !startupId) return;

    // Validate all phone numbers
    const validatedPhones: string[] = [];
    let hasPhoneErrors = false;

    if (newContact.phones) {
      for (let i = 0; i < newContact.phones.length; i++) {
        const phone = newContact.phones[i];
        if (phone.trim()) {
          const validatedPhone = validatePhoneNumber(phone, i, false);
          if (validatedPhone) {
            validatedPhones.push(validatedPhone);
          } else {
            hasPhoneErrors = true;
          }
        }
      }
    }

    if (hasPhoneErrors) {
      setStatus({ type: 'error', message: 'Corrija os erros nos números de telefone antes de salvar.' });
      return;
    }

    // Build contact object with only defined values
    const contactToAdd: Contact = {
      id: Date.now().toString(),
      name: newContact.name,
      emails: (newContact.emails || []).filter(email => email.trim() !== ''),
      phones: validatedPhones,
      type: newContact.type || 'startup'
    };

    // Only add optional fields if they have values
    if (newContact.linkedin && newContact.linkedin.trim() !== '') {
      contactToAdd.linkedin = newContact.linkedin.trim();
    }
    if (newContact.instagram && newContact.instagram.trim() !== '') {
      contactToAdd.instagram = newContact.instagram.trim();
    }
    if (newContact.role && newContact.role.trim() !== '') {
      contactToAdd.role = newContact.role.trim();
    }

    try {
      const updatedContacts = [...(startupData.startupData.contacts || []), contactToAdd];
      
      await updateDoc(doc(db, 'selectedStartups', startupId), {
        'startupData.contacts': updatedContacts
      });

      setContacts(prev => [...prev, contactToAdd]);
      setNewContact({ 
        name: '', 
        emails: [''], 
        phones: [''], 
        linkedin: '', 
        instagram: '', 
        role: '', 
        type: 'startup' 
      });
      setShowAddContact(false);
      setPhoneErrors({});
      setStatus({ type: 'success', message: t.contactAddedSuccess });
    } catch (error) {
      console.error('Error adding contact:', error);
      setStatus({ type: 'error', message: t.errorAddingContact });
    }
  };

  const handleEditContact = async () => {
    if (!editingContact || !startupData || !startupId) return;

    // Validate all phone numbers
    const validatedPhones: string[] = [];
    let hasPhoneErrors = false;

    if (editingContact.phones) {
      for (let i = 0; i < editingContact.phones.length; i++) {
        const phone = editingContact.phones[i];
        if (phone.trim()) {
          const validatedPhone = validatePhoneNumber(phone, i, true);
          if (validatedPhone) {
            validatedPhones.push(validatedPhone);
          } else {
            hasPhoneErrors = true;
          }
        }
      }
    }

    if (hasPhoneErrors) {
      setStatus({ type: 'error', message: 'Corrija os erros nos números de telefone antes de salvar.' });
      return;
    }

    try {
      // Build updated contact object with only defined values
      const updatedContact: Contact = {
        ...editingContact,
        emails: (editingContact.emails || []).filter(email => email.trim() !== ''),
        phones: validatedPhones
      };

      // Only include optional fields if they have values
      if (editingContact.linkedin && editingContact.linkedin.trim() !== '') {
        updatedContact.linkedin = editingContact.linkedin.trim();
      } else {
        delete updatedContact.linkedin;
      }
      
      if (editingContact.instagram && editingContact.instagram.trim() !== '') {
        updatedContact.instagram = editingContact.instagram.trim();
      } else {
        delete updatedContact.instagram;
      }
      
      if (editingContact.role && editingContact.role.trim() !== '') {
        updatedContact.role = editingContact.role.trim();
      } else {
        delete updatedContact.role;
      }

      const updatedContacts = (startupData.startupData.contacts || []).map(contact =>
        contact.id === editingContact.id ? updatedContact : contact
      );
      
      await updateDoc(doc(db, 'selectedStartups', startupId), {
        'startupData.contacts': updatedContacts
      });

      setContacts(prev => prev.map(contact =>
        contact.id === editingContact.id ? updatedContact : contact
      ));
      
      setEditingContact(null);
      setPhoneErrors({});
      setStatus({ type: 'success', message: t.contactUpdatedSuccess });
    } catch (error) {
      console.error('Error updating contact:', error);
      setStatus({ type: 'error', message: t.errorUpdatingContact });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!startupData || contactId.startsWith('default-') || !startupId) return;

    try {
      const updatedContacts = (startupData.startupData.contacts || []).filter(
        contact => contact.id !== contactId
      );
      
      await updateDoc(doc(db, 'selectedStartups', startupId), {
        'startupData.contacts': updatedContacts
      });

      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      setStatus({ type: 'success', message: t.contactRemovedSuccess });
    } catch (error) {
      console.error('Error deleting contact:', error);
      setStatus({ type: 'error', message: t.errorRemovingContact });
    }
  };

  const handleBack = () => {
    navigate(`/startup/${startupId}/timeline`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">{t.loadingContacts}</div>
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
            <h2 className="text-lg font-medium">{t.contactManagement} - {startupData.startupName}</h2>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* Add Contact Button */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-white">{t.contacts}</h1>
          <button
            onClick={() => setShowAddContact(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <UserPlus size={16} />
            {t.addContact}
          </button>
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

        {/* Add Contact Form */}
        {showAddContact && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">{t.newContact}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder={`${t.contactName} *`}
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder={t.contactRole}
                value={newContact.role}
                onChange={(e) => setNewContact(prev => ({ ...prev, role: e.target.value }))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Multiple Emails */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.emails}</label>
              {(newContact.emails || ['']).map((email, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      const emails = [...(newContact.emails || [''])];
                      emails[index] = e.target.value;
                      setNewContact(prev => ({ ...prev, emails }));
                    }}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {(newContact.emails || []).length > 1 && (
                    <button
                      onClick={() => handleRemoveEmail(index, newContact, setNewContact)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => handleAddEmail(newContact, setNewContact)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                + {t.addEmail}
              </button>
            </div>

            {/* Multiple Phones */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.phones}
                <span className="text-xs text-gray-400 block mt-1">
                  Exemplos: 5511995736666 (Brasil), 41765099123 (Suíça), 12345678901 (EUA)
                </span>
              </label>
              {(newContact.phones || ['']).map((phone, index) => (
                <div key={index} className="mb-2">
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="Telefone/WhatsApp (com código do país)"
                      value={phone}
                      onChange={(e) => handlePhoneChange(index, e.target.value, newContact, setNewContact, false)}
                      className={`flex-1 px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${
                        phoneErrors[`new-${index}`] 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:ring-blue-500'
                      }`}
                    />
                    {(newContact.phones || []).length > 1 && (
                      <button
                        onClick={() => handleRemovePhone(index, newContact, setNewContact)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {phoneErrors[`new-${index}`] && (
                    <p className="text-red-400 text-xs mt-1">{phoneErrors[`new-${index}`]}</p>
                  )}
                </div>
              ))}
              <button
                onClick={() => handleAddPhone(newContact, setNewContact)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                + {t.addPhone}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="url"
                placeholder="LinkedIn"
                value={newContact.linkedin}
                onChange={(e) => setNewContact(prev => ({ ...prev, linkedin: e.target.value }))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="Instagram"
                value={newContact.instagram}
                onChange={(e) => setNewContact(prev => ({ ...prev, instagram: e.target.value }))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <select
                value={newContact.type}
                onChange={(e) => setNewContact(prev => ({ ...prev, type: e.target.value as 'startup' | 'founder' }))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="startup">{t.startup}</option>
                <option value="founder">{t.founder}</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleAddContact}
                  disabled={!newContact.name || Object.keys(phoneErrors).some(key => key.startsWith('new-'))}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Save size={16} />
                  {t.save}
                </button>
                <button
                  onClick={() => {
                    setShowAddContact(false);
                    setNewContact({ 
                      name: '', 
                      emails: [''], 
                      phones: [''], 
                      linkedin: '', 
                      instagram: '', 
                      role: '', 
                      type: 'startup' 
                    });
                    setPhoneErrors({});
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-gray-800 rounded-lg p-6">
              {editingContact?.id === contact.id ? (
                // Edit Form
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder={`${t.contactName} *`}
                    value={editingContact.name}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder={t.contactRole}
                    value={editingContact.role || ''}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, role: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  {/* Multiple Emails in Edit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t.emails}</label>
                    {(editingContact.emails || ['']).map((email, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => {
                            const emails = [...(editingContact.emails || [''])];
                            emails[index] = e.target.value;
                            setEditingContact(prev => prev ? { ...prev, emails } : null);
                          }}
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {(editingContact.emails || []).length > 1 && (
                          <button
                            onClick={() => handleRemoveEmail(index, editingContact, (data) => setEditingContact(data as Contact))}
                            className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddEmail(editingContact, (data) => setEditingContact(data as Contact))}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      + {t.addEmail}
                    </button>
                  </div>

                  {/* Multiple Phones in Edit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.phones}
                      <span className="text-xs text-gray-400 block mt-1">
                        Exemplos: 5511995736666 (Brasil), 41765099123 (Suíça)
                      </span>
                    </label>
                    {(editingContact.phones || ['']).map((phone, index) => (
                      <div key={index} className="mb-2">
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            placeholder="Telefone/WhatsApp (com código do país)"
                            value={phone}
                            onChange={(e) => handlePhoneChange(index, e.target.value, editingContact, (data) => setEditingContact(data as Contact), true)}
                            className={`flex-1 px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${
                              phoneErrors[`edit-${index}`] 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-gray-600 focus:ring-blue-500'
                            }`}
                          />
                          {(editingContact.phones || []).length > 1 && (
                            <button
                              onClick={() => handleRemovePhone(index, editingContact, (data) => setEditingContact(data as Contact))}
                              className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        {phoneErrors[`edit-${index}`] && (
                          <p className="text-red-400 text-xs mt-1">{phoneErrors[`edit-${index}`]}</p>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddPhone(editingContact, (data) => setEditingContact(data as Contact))}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      + {t.addPhone}
                    </button>
                  </div>

                  <input
                    type="url"
                    placeholder="LinkedIn"
                    value={editingContact.linkedin || ''}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, linkedin: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="url"
                    placeholder="Instagram"
                    value={editingContact.instagram || ''}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, instagram: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={editingContact.type}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, type: e.target.value as 'startup' | 'founder' } : null)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="startup">{t.startup}</option>
                    <option value="founder">{t.founder}</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditContact}
                      disabled={Object.keys(phoneErrors).some(key => key.startsWith('edit-'))}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <Save size={16} />
                      {t.save}
                    </button>
                    <button
                      onClick={() => {
                        setEditingContact(null);
                        setPhoneErrors({});
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      <X size={16} />
                      {t.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                // Display Contact
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <User size={24} className="text-blue-400" />
                      <div>
                        <h3 className="font-bold text-white text-lg">{contact.name}</h3>
                        {contact.role && (
                          <p className="text-gray-400 text-sm">{contact.role}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!contact.id.startsWith('default-') && (
                        <>
                          <button
                            onClick={() => setEditingContact(contact)}
                            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {contact.emails && contact.emails.length > 0 && (
                      <div>
                        {contact.emails.map((email, index) => (
                          <div key={index} className="flex items-center gap-3 text-gray-300 mb-1">
                            <Mail size={16} className="text-blue-400" />
                            <span>{email}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {contact.phones && contact.phones.length > 0 && (
                      <div>
                        {contact.phones.map((phone, index) => (
                          <div key={index} className="flex items-center gap-3 text-gray-300 mb-1">
                            <Phone size={16} className="text-green-400" />
                            <span>{formatPhoneDisplay(phone)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {contact.linkedin && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <Linkedin size={16} className="text-blue-500" />
                        <a 
                          href={contact.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          LinkedIn
                        </a>
                      </div>
                    )}
                    {contact.instagram && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <Instagram size={16} className="text-pink-500" />
                        <a 
                          href={contact.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:text-pink-300 transition-colors"
                        >
                          Instagram
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Building2 size={16} className="text-purple-400" />
                      <span className="text-gray-300">
                        {contact.type === 'startup' ? t.startup : t.founder}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {contacts.length === 0 && (
          <div className="text-center py-12">
            <User size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{t.noContactsRegistered}</h3>
            <p className="text-gray-400 mb-6">
              Adicione contatos para facilitar o envio de mensagens
            </p>
            <button
              onClick={() => setShowAddContact(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
            >
              <UserPlus size={20} />
              {t.addFirstContact}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactManagement;