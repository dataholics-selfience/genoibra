import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Calendar, Building2, MapPin, Users, Briefcase, Award, 
  Target, Rocket, ArrowLeft, Mail, Globe, Box, Linkedin,
  Facebook, Twitter, Instagram, Trash2, FolderOpen, Plus, Check, X, BarChart3
} from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, getDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { StartupType, SocialLink } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PipelineStageManager from './PipelineStageManager';
import { validateAndFormatPhone, formatPhoneDisplay } from '../utils/phoneValidation';
import { sendWhatsAppMessage } from '../utils/whatsappInstanceManager';

interface SavedStartupType {
  id: string;
  userId: string;
  userEmail: string;
  challengeId: string;
  challengeTitle: string;
  startupName: string;
  startupData: StartupType;
  selectedAt: string;
  stage: string;
  updatedAt: string;
  source?: string;
  publicRegistrationData?: {
    founderName: string;
    pitchUrl: string;
    registeredAt: string;
    challengeSlug: string;
  };
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  emailTemplate?: string;
  emailSubject?: string;
  whatsappTemplate?: string;
}

const DEFAULT_STAGES: PipelineStage[] = [
  { 
    id: 'inscrita', 
    name: 'Inscrita', 
    color: 'bg-cyan-200 text-cyan-800 border-cyan-300', 
    order: 0,
    emailTemplate: '',
    emailSubject: '',
    whatsappTemplate: ''
  },
  { 
    id: 'mapeada', 
    name: 'Mapeada', 
    color: 'bg-yellow-200 text-yellow-800 border-yellow-300', 
    order: 1,
    emailTemplate: '',
    emailSubject: '',
    whatsappTemplate: ''
  },
  { 
    id: 'selecionada', 
    name: 'Selecionada', 
    color: 'bg-blue-200 text-blue-800 border-blue-300', 
    order: 2,
    emailTemplate: '',
    emailSubject: '',
    whatsappTemplate: ''
  },
  { 
    id: 'contatada', 
    name: 'Contatada', 
    color: 'bg-red-200 text-red-800 border-red-300', 
    order: 3,
    emailTemplate: '',
    emailSubject: '',
    whatsappTemplate: ''
  },
  { 
    id: 'entrevistada', 
    name: 'Entrevistada', 
    color: 'bg-green-200 text-green-800 border-green-300', 
    order: 4,
    emailTemplate: '',
    emailSubject: '',
    whatsappTemplate: ''
  },
  { 
    id: 'poc', 
    name: 'POC', 
    color: 'bg-orange-200 text-orange-800 border-orange-300', 
    order: 5,
    emailTemplate: '',
    emailSubject: '',
    whatsappTemplate: ''
  }
];

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
      <span className="text-3xl font-extrabold text-white">{rating}</span>
      <div className="text-sm text-gray-400 mt-1">Match Score</div>
      <div className="flex items-center gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const SocialLinks = ({ startup, className = "" }: { startup: StartupType; className?: string }) => {
  const links: SocialLink[] = [
    {
      type: 'website',
      url: startup.website,
      icon: Globe,
      label: 'Website'
    },
    {
      type: 'email',
      url: `mailto:${startup.email}`,
      icon: Mail,
      label: 'Email'
    },
    ...(startup.socialLinks?.linkedin ? [{
      type: 'linkedin',
      url: startup.socialLinks.linkedin,
      icon: Linkedin,
      label: 'LinkedIn'
    }] : []),
    ...(startup.socialLinks?.facebook ? [{
      type: 'facebook',
      url: startup.socialLinks.facebook,
      icon: Facebook,
      label: 'Facebook'
    }] : []),
    ...(startup.socialLinks?.twitter ? [{
      type: 'twitter',
      url: startup.socialLinks.twitter,
      icon: Twitter,
      label: 'Twitter'
    }] : []),
    ...(startup.socialLinks?.instagram ? [{
      type: 'instagram',
      url: startup.socialLinks.instagram,
      icon: Instagram,
      label: 'Instagram'
    }] : [])
  ].filter(link => link.url);

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <link.icon size={16} />
          <span>{link.label}</span>
        </a>
      ))}
    </div>
  );
};

// FUNÇÃO CRÍTICA REFATORADA: ENVIAR MENSAGENS AUTOMÁTICAS PARA TODOS OS CONTATOS
const sendAutomaticMessages = async (
  startup: SavedStartupType, 
  stage: PipelineStage,
  senderName: string,
  senderCompany: string
) => {
  console.log(`🚀 INICIANDO ENVIO DE MENSAGENS AUTOMÁTICAS:`, {
    startup: startup.startupName,
    stage: stage.name,
    hasEmailTemplate: !!(stage.emailTemplate && stage.emailTemplate.trim()),
    hasWhatsAppTemplate: !!(stage.whatsappTemplate && stage.whatsappTemplate.trim()),
    timestamp: new Date().toISOString()
  });

  // Verificar se há templates configurados
  const hasEmailTemplate = stage.emailTemplate && stage.emailTemplate.trim();
  const hasWhatsAppTemplate = stage.whatsappTemplate && stage.whatsappTemplate.trim();

  if (!hasEmailTemplate && !hasWhatsAppTemplate) {
    console.log(`⚠️ NENHUM TEMPLATE CONFIGURADO para o estágio ${stage.name} - pulando envio`);
    return {
      emailsSent: 0,
      whatsappsSent: 0,
      emailsFailed: 0,
      whatsappsFailed: 0,
      totalContacts: 0,
      skipped: true,
      reason: 'Nenhum template configurado'
    };
  }

  // Coletar todos os contatos disponíveis
  const allContacts = [];
  
  // 1. Contato principal da startup (email padrão)
  if (startup.startupData.email) {
    allContacts.push({
      id: 'startup-main',
      name: startup.startupData.name,
      emails: [startup.startupData.email],
      phones: [],
      type: 'startup' as const
    });
  }

  // 2. Contatos das redes sociais (apenas se tiverem email)
  if (startup.startupData.socialLinks?.linkedin && startup.startupData.email) {
    allContacts.push({
      id: 'startup-linkedin',
      name: `${startup.startupData.name} (LinkedIn)`,
      emails: [startup.startupData.email],
      phones: [],
      linkedin: startup.startupData.socialLinks.linkedin,
      type: 'startup' as const,
      role: 'LinkedIn Profile'
    });
  }

  if (startup.startupData.socialLinks?.instagram && startup.startupData.email) {
    allContacts.push({
      id: 'startup-instagram',
      name: `${startup.startupData.name} (Instagram)`,
      emails: [startup.startupData.email],
      phones: [],
      instagram: startup.startupData.socialLinks.instagram,
      type: 'startup' as const,
      role: 'Instagram Profile'
    });
  }

  // 3. Contatos adicionais cadastrados pelo usuário
  if (startup.startupData.contacts && startup.startupData.contacts.length > 0) {
    allContacts.push(...startup.startupData.contacts);
  }

  console.log(`📋 TOTAL DE CONTATOS ENCONTRADOS: ${allContacts.length}`, {
    contacts: allContacts.map(c => ({ 
      name: c.name, 
      emails: c.emails?.length || 0, 
      phones: c.phones?.length || 0 
    }))
  });

  const results = {
    emailsSent: 0,
    whatsappsSent: 0,
    emailsFailed: 0,
    whatsappsFailed: 0,
    totalContacts: allContacts.length,
    skipped: false
  };

  // Processar cada contato
  for (const contact of allContacts) {
    console.log(`📞 PROCESSANDO CONTATO: ${contact.name}`);

    // ENVIAR EMAILS (apenas se há template de email configurado)
    if (hasEmailTemplate && contact.emails && contact.emails.length > 0) {
      for (const email of contact.emails) {
        if (email && email.trim()) {
          console.log(`📧 Tentando enviar email para: ${email}`);
          const emailResult = await sendEmailToContact(
            startup,
            stage,
            contact,
            email,
            senderName,
            senderCompany
          );
          
          if (emailResult.success) {
            results.emailsSent++;
            console.log(`✅ EMAIL ENVIADO: ${email}`);
          } else {
            results.emailsFailed++;
            console.log(`❌ FALHA NO EMAIL: ${email} - ${emailResult.reason}`);
          }
        }
      }
    } else if (hasEmailTemplate) {
      console.log(`⚠️ Template de email configurado, mas contato ${contact.name} não tem emails`);
    }

    // ENVIAR WHATSAPP (apenas se há template de WhatsApp configurado)
    if (hasWhatsAppTemplate && contact.phones && contact.phones.length > 0) {
      for (const phone of contact.phones) {
        if (phone && phone.trim()) {
          console.log(`📱 Tentando enviar WhatsApp para: ${phone}`);
          const whatsappResult = await sendWhatsAppToContact(
            startup,
            stage,
            contact,
            phone,
            senderName,
            senderCompany
          );
          
          if (whatsappResult.success) {
            results.whatsappsSent++;
            console.log(`✅ WHATSAPP ENVIADO: ${phone}`);
          } else {
            results.whatsappsFailed++;
            console.log(`❌ FALHA NO WHATSAPP: ${phone} - ${whatsappResult.reason}`);
          }
        }
      }
    } else if (hasWhatsAppTemplate) {
      console.log(`⚠️ Template de WhatsApp configurado, mas contato ${contact.name} não tem telefones`);
    }
  }

  console.log(`📊 RESULTADO FINAL DO ENVIO AUTOMÁTICO:`, results);
  return results;
};

// Função para enviar email para um contato específico
const sendEmailToContact = async (
  startup: SavedStartupType,
  stage: PipelineStage,
  contact: any,
  email: string,
  senderName: string,
  senderCompany: string
) => {
  try {
    // Processar template com variáveis
    let processedMessage = stage.emailTemplate!
      .replace(/\{\{startupName\}\}/g, startup.startupName)
      .replace(/\{\{senderName\}\}/g, senderName)
      .replace(/\{\{senderCompany\}\}/g, senderCompany)
      .replace(/\{\{recipientName\}\}/g, contact.name);

    let processedSubject = (stage.emailSubject || `${senderCompany} - ${stage.name}`)
      .replace(/\{\{startupName\}\}/g, startup.startupName)
      .replace(/\{\{senderName\}\}/g, senderName)
      .replace(/\{\{senderCompany\}\}/g, senderCompany)
      .replace(/\{\{recipientName\}\}/g, contact.name);

    // Criar HTML do email
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
              ${processedMessage}
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
          <p>Esta mensagem foi enviada automaticamente através da plataforma Gen.OI de inovação aberta.</p>
        </div>
      </body>
      </html>
    `;

    // Payload para MailerSend
    const emailPayload = {
      to: [{ 
        email: email, 
        name: contact.name 
      }],
      from: { 
        email: 'contact@genoi.com.br', 
        name: 'Gen.OI - Inovação Aberta' 
      },
      subject: processedSubject,
      html: emailHtml,
      text: processedMessage,
      reply_to: { 
        email: 'contact@genoi.net', 
        name: 'Gen.OI - Suporte' 
      },
      tags: ['crm', 'automatic-message', 'stage-change', stage.id],
      metadata: { 
        startupId: startup.id, 
        userId: startup.userId,
        stageId: stage.id,
        contactId: contact.id,
        automatic: true,
        messageType: 'stage_change_email',
        timestamp: new Date().toISOString()
      }
    };

    console.log(`📧 Enviando email automático via MailerSend:`, {
      to: email,
      subject: processedSubject,
      stage: stage.name
    });

    // Enviar via MailerSend Firebase Extension
    await addDoc(collection(db, 'emails'), emailPayload);

    // Salvar no CRM
    await addDoc(collection(db, 'crmMessages'), {
      startupId: startup.id,
      userId: startup.userId,
      senderName,
      recipientName: contact.name,
      recipientEmail: email,
      recipientType: contact.type || 'startup',
      messageType: 'email',
      subject: processedSubject,
      message: processedMessage,
      sentAt: new Date().toISOString(),
      status: 'sent',
      automatic: true,
      stageId: stage.id,
      stageName: stage.name,
      contactId: contact.id,
      messageCategory: 'stage_change'
    });

    return { success: true, type: 'email' };

  } catch (error) {
    console.error(`❌ ERRO NO ENVIO DE EMAIL AUTOMÁTICO para ${email}:`, error);
    return { success: false, reason: 'exception', error: error.message };
  }
};

// Função para enviar WhatsApp para um contato específico
const sendWhatsAppToContact = async (
  startup: SavedStartupType,
  stage: PipelineStage,
  contact: any,
  phone: string,
  senderName: string,
  senderCompany: string
) => {
  try {
    // Validar número de telefone antes de enviar
    const validation = validateAndFormatPhone(phone);
    if (!validation.isValid) {
      console.error(`❌ NÚMERO INVÁLIDO: ${phone} - ${validation.error}`);
      return { success: false, reason: 'invalid_phone', error: validation.error };
    }

    // Processar template com variáveis
    let processedMessage = stage.whatsappTemplate!
      .replace(/\{\{startupName\}\}/g, startup.startupName)
      .replace(/\{\{senderName\}\}/g, senderName)
      .replace(/\{\{senderCompany\}\}/g, senderCompany)
      .replace(/\{\{recipientName\}\}/g, contact.name);

    // Usar o número validado e formatado
    const formattedPhone = validation.formattedNumber!;
    
    console.log(`📱 Enviando WhatsApp automático para startup ${startup.id} via sistema de instâncias`);
    
    // Enviar via sistema de instâncias (sem complemento automático para mensagens automáticas de estágio)
    const whatsappResult = await sendWhatsAppMessage(
      startup.id,
      startup.userId,
      formattedPhone,
      processedMessage
      // Não passar senderCompany e startupName para evitar complemento em mensagens automáticas
    );

    if (whatsappResult.success) {
      // Salvar no CRM
      await addDoc(collection(db, 'crmMessages'), {
        startupId: startup.id,
        userId: startup.userId,
        senderName,
        recipientName: contact.name,
        recipientPhone: formattedPhone,
        recipientType: contact.type || 'startup',
        messageType: 'whatsapp',
        message: processedMessage,
        sentAt: new Date().toISOString(),
        status: 'sent',
        automatic: true,
        stageId: stage.id,
        stageName: stage.name,
        contactId: contact.id,
        messageCategory: 'stage_change',
        whatsappInstance: whatsappResult.instanceUsed
      });

      return { success: true, type: 'whatsapp', instanceUsed: whatsappResult.instanceUsed };
    } else {
      console.error(`❌ FALHA NA EVOLUTION API para ${phone}:`, whatsappResult.error);
      return { success: false, reason: 'api_error', error: whatsappResult.error };
    }

  } catch (error) {
    console.error(`❌ ERRO NO ENVIO DE WHATSAPP AUTOMÁTICO para ${phone}:`, error);
    return { success: false, reason: 'exception', error: error.message };
  }
};

const DraggableStartupCard = ({ 
  startup, 
  onRemove,
  onClick
}: { 
  startup: SavedStartupType;
  onRemove: (id: string) => void;
  onClick: () => void;
}) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isRemoving) return;

    setIsRemoving(true);

    try {
      await deleteDoc(doc(db, 'selectedStartups', startup.id));
      onRemove(startup.id);
    } catch (error) {
      console.error('Error removing startup:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', startup.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleCardClick}
      className="bg-gray-700 rounded-lg p-3 mb-2 cursor-pointer hover:bg-gray-600 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className={`w-2 h-2 rounded-full opacity-50 group-hover:opacity-100 transition-opacity ${
            startup.source === 'public_registration' ? 'bg-cyan-400' : 'bg-blue-400'
          }`} />
          <span className="text-white font-medium text-sm truncate">{startup.startupName}</span>
          {startup.source === 'public_registration' && (
            <span className="text-xs bg-cyan-600 text-cyan-100 px-2 py-1 rounded-full">
              Inscrita
            </span>
          )}
        </div>
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className={`p-1 rounded text-xs ${
            isRemoving
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
          }`}
        >
          {isRemoving ? '...' : <Trash2 size={12} />}
        </button>
      </div>
    </div>
  );
};

const PipelineStage = ({ 
  stage, 
  startups, 
  onDrop, 
  onStartupClick,
  onRemoveStartup,
  onDeleteStage,
  onCustomizeMessage,
  canDeleteStage
}: { 
  stage: PipelineStage;
  startups: SavedStartupType[];
  onDrop: (startupId: string, newStage: string) => void;
  onStartupClick: (startupId: string) => void;
  onRemoveStartup: (id: string) => void;
  onDeleteStage: (stageId: string) => void;
  onCustomizeMessage: (stage: PipelineStage) => void;
  canDeleteStage: boolean;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const startupId = e.dataTransfer.getData('text/plain');
    if (startupId) {
      onDrop(startupId, stage.id);
    }
  };

  const handleDeleteStage = () => {
    if (startups.length > 0) {
      setShowDeleteConfirm(true);
    } else {
      onDeleteStage(stage.id);
    }
  };

  const confirmDeleteStage = () => {
    onDeleteStage(stage.id);
    setShowDeleteConfirm(false);
  };

  const hasTemplates = stage.emailTemplate || stage.whatsappTemplate;
  const publicRegistrations = startups.filter(s => s.source === 'public_registration').length;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-4 min-h-[300px] transition-all ${
        isDragOver 
          ? 'border-blue-400 bg-blue-900/20' 
          : 'border-gray-600 bg-gray-800/50'
      }`}
    >
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <h3 className={`font-bold text-lg px-3 py-1 rounded-full border ${stage.color} flex items-center gap-2`}>
            {stage.name}
            <span className="text-sm font-normal">({startups.length})</span>
            {publicRegistrations > 0 && (
              <span className="text-xs bg-cyan-600 text-cyan-100 px-2 py-1 rounded-full ml-2">
                {publicRegistrations} inscritas
              </span>
            )}
          </h3>
          {canDeleteStage && stage.id !== 'inscrita' && (
            <button
              onClick={handleDeleteStage}
              className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-gray-700 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        
        {/* Template Configuration Button */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onCustomizeMessage(stage)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
            title="Configurar mensagens automáticas"
          >
            <Mail size={14} />
            Configurar Mensagens
            {hasTemplates && (
              <div className="flex items-center gap-1 ml-2">
                {stage.emailTemplate && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
                {stage.whatsappTemplate && <div className="w-2 h-2 bg-green-400 rounded-full" />}
              </div>
            )}
          </button>
          
          {hasTemplates && (
            <div className="text-xs text-gray-400 px-3">
              ✨ Mensagens automáticas configuradas
              {stage.emailTemplate && stage.whatsappTemplate && ' (Email + WhatsApp)'}
              {stage.emailTemplate && !stage.whatsappTemplate && ' (Email)'}
              {!stage.emailTemplate && stage.whatsappTemplate && ' (WhatsApp)'}
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        {startups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Plus size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {stage.id === 'inscrita' 
                ? 'Startups inscritas aparecerão aqui automaticamente'
                : 'Arraste startups aqui'
              }
            </p>
            {hasTemplates && (
              <p className="text-xs text-blue-400 mt-2">
                Mensagens automáticas serão enviadas
              </p>
            )}
          </div>
        ) : (
          startups.map((startup) => (
            <DraggableStartupCard
              key={startup.id}
              startup={startup}
              onRemove={onRemoveStartup}
              onClick={() => onStartupClick(startup.id)}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-300 mb-6">
              Este estágio possui {startups.length} startup{startups.length !== 1 ? 's' : ''} mapeada{startups.length !== 1 ? 's' : ''}. 
              Ao excluir o estágio, você perderá essas startups do pipeline. Deseja continuar?
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmDeleteStage}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sim, Excluir
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PipelineBoard = ({ 
  startups, 
  stages,
  onStageChange, 
  onStartupClick,
  onRemoveStartup,
  onDeleteStage,
  onCustomizeMessage
}: { 
  startups: SavedStartupType[];
  stages: PipelineStage[];
  onStageChange: (startupId: string, newStage: string) => void;
  onStartupClick: (startupId: string) => void;
  onRemoveStartup: (id: string) => void;
  onDeleteStage: (stageId: string) => void;
  onCustomizeMessage: (stage: PipelineStage) => void;
}) => {
  const [sendingMessages, setSendingMessages] = useState<string | null>(null);
  const [messageResults, setMessageResults] = useState<any>(null);

  const handleDrop = async (startupId: string, newStage: string) => {
    console.log(`🎯 INICIANDO MUDANÇA DE ESTÁGIO COM MENSAGENS AUTOMÁTICAS:`, {
      startupId,
      newStage,
      timestamp: new Date().toISOString()
    });

    setSendingMessages(startupId);
    setMessageResults(null);

    try {
      const startup = startups.find(s => s.id === startupId);
      if (!startup) {
        console.error(`❌ STARTUP NÃO ENCONTRADA: ${startupId}`);
        return;
      }

      // Verificar se é mudança real de estágio
      if (startup.stage === newStage) {
        console.log(`⚠️ STARTUP JÁ ESTÁ NO ESTÁGIO ${newStage} - não enviando mensagens`);
        return;
      }

      console.log(`📋 STARTUP ENCONTRADA:`, {
        name: startup.startupName,
        currentStage: startup.stage,
        newStage,
        totalContacts: (startup.startupData.contacts?.length || 0) + 1
      });

      // Atualizar estágio no banco PRIMEIRO
      await updateDoc(doc(db, 'selectedStartups', startupId), {
        stage: newStage,
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ ESTÁGIO ATUALIZADO NO BANCO DE DADOS`);

      // Buscar dados do usuário
      const userDoc = await getDoc(doc(db, 'users', startup.userId));
      const userData = userDoc.data();
      const senderName = userData?.name || '';
      const senderCompany = userData?.company || '';

      console.log(`👤 DADOS DO USUÁRIO:`, {
        senderName,
        senderCompany,
        userId: startup.userId
      });

      // Buscar configuração do estágio
      const stageConfig = stages.find(s => s.id === newStage);
      if (!stageConfig) {
        console.error(`❌ CONFIGURAÇÃO DO ESTÁGIO NÃO ENCONTRADA: ${newStage}`);
        onStageChange(startupId, newStage);
        return;
      }

      console.log(`⚙️ CONFIGURAÇÃO DO ESTÁGIO ENCONTRADA:`, {
        stageName: stageConfig.name,
        hasEmailTemplate: !!(stageConfig.emailTemplate && stageConfig.emailTemplate.trim()),
        hasWhatsAppTemplate: !!(stageConfig.whatsappTemplate && stageConfig.whatsappTemplate.trim())
      });

      // ENVIAR MENSAGENS AUTOMÁTICAS PARA TODOS OS CONTATOS
      const results = await sendAutomaticMessages(
        startup,
        stageConfig,
        senderName,
        senderCompany
      );

      console.log(`📊 RESULTADO FINAL DOS ENVIOS AUTOMÁTICOS:`, results);

      // Atualizar UI
      onStageChange(startupId, newStage);

      // Armazenar resultados para exibir notificação
      setMessageResults(results);

      // Mostrar notificação de sucesso se mensagens foram enviadas
      if (results.emailsSent > 0 || results.whatsappsSent > 0) {
        const successMessages = [];
        if (results.emailsSent > 0) {
          successMessages.push(`${results.emailsSent} email${results.emailsSent > 1 ? 's' : ''}`);
        }
        if (results.whatsappsSent > 0) {
          successMessages.push(`${results.whatsappsSent} WhatsApp${results.whatsappsSent > 1 ? 's' : ''}`);
        }
        
        console.log(`🎉 MENSAGENS AUTOMÁTICAS ENVIADAS: ${successMessages.join(' e ')} para ${startup.startupName} no estágio ${stageConfig.name}`);
      } else if (results.skipped) {
        console.log(`⚠️ ENVIO PULADO: ${results.reason}`);
      } else {
        console.log(`⚠️ NENHUMA MENSAGEM ENVIADA - verifique se há contatos com email/telefone`);
      }

      if (results.emailsFailed > 0 || results.whatsappsFailed > 0) {
        console.log(`⚠️ ALGUMAS MENSAGENS FALHARAM: ${results.emailsFailed} emails e ${results.whatsappsFailed} WhatsApps`);
      }

    } catch (error) {
      console.error(`❌ ERRO GERAL NA MUDANÇA DE ESTÁGIO:`, error);
    } finally {
      setSendingMessages(null);
      // Limpar resultados após 5 segundos
      setTimeout(() => setMessageResults(null), 5000);
    }
  };

  return (
    <>
      {/* Loading overlay quando enviando mensagens */}
      {sendingMessages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 text-center">
            <div className="animate-spin mx-auto w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Enviando Mensagens Automáticas</h3>
            <p className="text-gray-300">
              Processando templates e enviando mensagens para todos os contatos da startup...
            </p>
          </div>
        </div>
      )}

      {/* Notification de resultados */}
      {messageResults && !sendingMessages && (
        <div className="fixed top-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-sm z-40 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {messageResults.skipped ? (
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
              ) : messageResults.emailsSent > 0 || messageResults.whatsappsSent > 0 ? (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                  <X size={16} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium text-sm mb-1">
                {messageResults.skipped ? 'Mensagens Puladas' : 'Mensagens Enviadas'}
              </h4>
              {messageResults.skipped ? (
                <p className="text-gray-300 text-xs">{messageResults.reason}</p>
              ) : (
                <div className="text-gray-300 text-xs space-y-1">
                  {messageResults.emailsSent > 0 && (
                    <div>✅ {messageResults.emailsSent} email{messageResults.emailsSent > 1 ? 's' : ''}</div>
                  )}
                  {messageResults.whatsappsSent > 0 && (
                    <div>✅ {messageResults.whatsappsSent} WhatsApp{messageResults.whatsappsSent > 1 ? 's' : ''}</div>
                  )}
                  {messageResults.emailsFailed > 0 && (
                    <div>❌ {messageResults.emailsFailed} email{messageResults.emailsFailed > 1 ? 's' : ''} falharam</div>
                  )}
                  {messageResults.whatsappsFailed > 0 && (
                    <div>❌ {messageResults.whatsappsFailed} WhatsApp{messageResults.whatsappsFailed > 1 ? 's' : ''} falharam</div>
                  )}
                  {messageResults.emailsSent === 0 && messageResults.whatsappsSent === 0 && !messageResults.skipped && (
                    <div>Nenhuma mensagem enviada - verifique contatos</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Layout - One stage per row */}
      <div className="grid grid-cols-1 gap-6 lg:hidden">
        {stages.map((stage) => {
          const stageStartups = startups.filter(startup => startup.stage === stage.id);
          
          return (
            <PipelineStage
              key={stage.id}
              stage={stage}
              startups={stageStartups}
              onDrop={handleDrop}
              onStartupClick={onStartupClick}
              onRemoveStartup={onRemoveStartup}
              onDeleteStage={onDeleteStage}
              onCustomizeMessage={onCustomizeMessage}
              canDeleteStage={stages.length > 1}
            />
          );
        })}
      </div>
      
      {/* Desktop Layout - Multiple columns */}
      <div className="hidden lg:grid gap-6" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
        {stages.map((stage) => {
          const stageStartups = startups.filter(startup => startup.stage === stage.id);
          
          return (
            <PipelineStage
              key={stage.id}
              stage={stage}
              startups={stageStartups}
              onDrop={handleDrop}
              onStartupClick={onStartupClick}
              onRemoveStartup={onRemoveStartup}
              onDeleteStage={onDeleteStage}
              onCustomizeMessage={onCustomizeMessage}
              canDeleteStage={stages.length > 1}
            />
          );
        })}
      </div>
    </>
  );
};

const StartupDetailCard = ({ startup }: { startup: StartupType }) => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">{startup.name}</h2>
          <SocialLinks startup={startup} />
        </div>
        <StarRating rating={startup.rating} />
      </div>
      <p className="text-gray-400 mb-6">{startup.description}</p>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-300">
          <Calendar className="text-blue-400" size={16} />
          <span className="text-gray-400">Fundação:</span>
          {startup.foundedYear}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Building2 className="text-purple-400" size={16} />
          <span className="text-gray-400">Categoria:</span>
          {startup.category}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Box className="text-pink-400" size={16} />
          <span className="text-gray-400">Vertical:</span>
          {startup.vertical}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <MapPin className="text-emerald-400" size={16} />
          <span className="text-gray-400">Localização:</span>
          {startup.city}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Users className="text-blue-400" size={16} />
          <span className="text-gray-400">Tamanho da Equipe:</span>
          {startup.teamSize}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Briefcase className="text-purple-400" size={16} />
          <span className="text-gray-400">Modelo de Negócio:</span>
          {startup.businessModel}
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Globe className="text-pink-400" size={16} />
          <span className="text-gray-400">Status IPO:</span>
          {startup.ipoStatus}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400">{startup.reasonForChoice}</p>
        </div>
      </div>
    </div>
  );
};

const SavedStartups = () => {
  const navigate = useNavigate();
  const [savedStartups, setSavedStartups] = useState<SavedStartupType[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<StartupType | null>(null);
  const [loading, setLoading] = useState(true);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(DEFAULT_STAGES);
  const [showStageManager, setShowStageManager] = useState(false);

  useEffect(() => {
    const fetchSavedStartups = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        const q = query(
          collection(db, 'selectedStartups'),
          where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const startups = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SavedStartupType[];
        
        // Sort in memory by updatedAt descending
        startups.sort((a, b) => new Date(b.updatedAt || b.selectedAt).getTime() - new Date(a.updatedAt || a.selectedAt).getTime());
        
        setSavedStartups(startups);
      } catch (error) {
        console.error('Error fetching saved startups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedStartups();
  }, [navigate]);

  const handleStartupClick = (startup: StartupType) => {
    setSelectedStartup(startup);
  };

  const handleStartupInteractionClick = (startupId: string) => {
    navigate(`/startup/${startupId}/timeline`);
  };

  const handleBack = () => {
    if (selectedStartup) {
      setSelectedStartup(null);
    } else {
      // Always navigate back to chat when in Pipeline CRM
      navigate('/');
    }
  };

  const handleRemoveStartup = (removedId: string) => {
    setSavedStartups(prev => prev.filter(startup => startup.id !== removedId));
  };

  const handleStageChange = (startupId: string, newStage: string) => {
    setSavedStartups(prev => prev.map(startup => 
      startup.id === startupId 
        ? { ...startup, stage: newStage, updatedAt: new Date().toISOString() }
        : startup
    ));
  };

  const handleStagesUpdate = (stages: PipelineStage[]) => {
    setPipelineStages(stages);
  };

  const handleDeleteStage = async (stageId: string) => {
    // Não permitir deletar o estágio "Inscrita"
    if (stageId === 'inscrita') {
      console.log('⚠️ Não é possível deletar o estágio "Inscrita" - é necessário para inscrições públicas');
      return;
    }

    // Remove startups from deleted stage
    const startupsToRemove = savedStartups.filter(startup => startup.stage === stageId);
    
    try {
      // Delete startups from Firestore
      await Promise.all(
        startupsToRemove.map(startup => 
          deleteDoc(doc(db, 'selectedStartups', startup.id))
        )
      );

      // Update local state
      setSavedStartups(prev => prev.filter(startup => startup.stage !== stageId));
      
      // Update stages
      const updatedStages = pipelineStages.filter(stage => stage.id !== stageId);
      setPipelineStages(updatedStages);
    } catch (error) {
      console.error('Error deleting stage and startups:', error);
    }
  };

  const handleCustomizeMessage = (stage: PipelineStage) => {
    // Navigate to the stage manager with the specific stage selected for editing
    setShowStageManager(true);
  };

  // Calculate total startup count
  const totalStartupCount = savedStartups.length;
  const publicRegistrations = savedStartups.filter(s => s.source === 'public_registration').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando pipeline...</div>
      </div>
    );
  }

  // Show startup detail card
  if (selectedStartup) {
    return (
      <div className="min-h-screen bg-black p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white mb-8"
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar para pipeline
          </button>

          <StartupDetailCard startup={selectedStartup} />
        </div>
      </div>
    );
  }

  // Show stage manager only
  if (showStageManager) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex flex-col p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowStageManager(false)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2 flex-1 ml-4">
              <Mail size={20} className="text-gray-400" />
              <h2 className="text-lg font-medium">Configurar Mensagens Automáticas</h2>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <PipelineStageManager onStagesUpdate={handleStagesUpdate} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex flex-col p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-gray-300 hover:text-white focus:outline-none"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 ml-4">
            <FolderOpen size={20} className="text-gray-400" />
            <h2 className="text-lg font-medium">Pipeline CRM</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400 space-x-4">
              <span>{totalStartupCount} startup{totalStartupCount !== 1 ? 's' : ''}</span>
              {publicRegistrations > 0 && (
                <span className="text-cyan-400">
                  {publicRegistrations} inscrita{publicRegistrations !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowStageManager(true)}
              className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              <Mail size={16} />
              Configurar Mensagens
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {totalStartupCount === 0 ? (
            <div className="text-center py-16">
              <FolderOpen size={64} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Pipeline vazio</h3>
              <p className="text-gray-400 mb-6">
                Você ainda não tem startups no seu pipeline. Explore as listas de startups e adicione suas favoritas, 
                ou aguarde inscrições em seus desafios públicos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/startups')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Explorar Startups
                </button>
                <button
                  onClick={() => navigate('/new-challenge')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Criar Desafio Público
                </button>
              </div>
            </div>
          ) : (
            <>
              {publicRegistrations > 0 && (
                <div className="mb-6 bg-cyan-900/20 border border-cyan-600 rounded-lg p-4">
                  <h3 className="text-cyan-200 font-medium mb-2 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Inscrições Automáticas Ativas
                  </h3>
                  <p className="text-cyan-100 text-sm">
                    {publicRegistrations} startup{publicRegistrations !== 1 ? 's' : ''} se inscreveu{publicRegistrations === 1 ? '' : 'ram'} 
                    automaticamente através de desafios públicos e foi{publicRegistrations === 1 ? '' : 'ram'} adicionada{publicRegistrations === 1 ? '' : 's'} 
                    ao estágio "Inscrita".
                  </p>
                </div>
              )}
              
              <PipelineBoard
                startups={savedStartups}
                stages={pipelineStages}
                onStageChange={handleStageChange}
                onStartupClick={handleStartupInteractionClick}
                onRemoveStartup={handleRemoveStartup}
                onDeleteStage={handleDeleteStage}
                onCustomizeMessage={handleCustomizeMessage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedStartups;