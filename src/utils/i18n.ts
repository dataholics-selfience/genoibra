export interface Translations {
  // Navigation and Layout
  newChallenge: string;
  pipelineCRM: string;
  challenges: string;
  logout: string;
  profile: string;
  plans: string;
  
  // Authentication
  login: string;
  register: string;
  email: string;
  password: string;
  name: string;
  cpf: string;
  company: string;
  phone: string;
  forgotPassword: string;
  createAccount: string;
  alreadyHaveAccount: string;
  acceptTerms: string;
  verifyEmail: string;
  resendVerification: string;
  backToLogin: string;
  
  // Challenge Creation
  challengeTitle: string;
  challengeDescription: string;
  businessArea: string;
  createChallenge: string;
  
  // Chat Interface
  typeMessage: string;
  selectChallenge: string;
  loading: string;
  
  // Startup List
  startups: string;
  selectStartup: string;
  selected: string;
  saving: string;
  matchScore: string;
  founded: string;
  category: string;
  vertical: string;
  location: string;
  teamSize: string;
  businessModel: string;
  ipoStatus: string;
  website: string;
  linkedin: string;
  facebook: string;
  twitter: string;
  instagram: string;
  
  // Pipeline CRM
  mapped: string;
  contacted: string;
  interviewed: string;
  poc: string;
  emptyPipeline: string;
  exploreStartups: string;
  manageStages: string;
  
  // Contact Management
  contactManagement: string;
  contacts: string;
  addContact: string;
  newContact: string;
  editContact: string;
  deleteContact: string;
  contactName: string;
  contactRole: string;
  emails: string;
  phones: string;
  addEmail: string;
  addPhone: string;
  save: string;
  cancel: string;
  startup: string;
  founder: string;
  
  // Message Composer
  newMessage: string;
  composeMessage: string;
  recipient: string;
  subject: string;
  message: string;
  sendEmail: string;
  sendWhatsApp: string;
  sending: string;
  
  // Timeline
  interactionTimeline: string;
  noInteractions: string;
  firstMessage: string;
  sendFirstMessage: string;
  response: string;
  responseReceived: string;
  
  // Plans
  choosePlan: string;
  currentPlan: string;
  startNow: string;
  initialPlan: string;
  tokens: string;
  free: string;
  mostPopular: string;
  securePayment: string;
  padawanDescription: string;
  jediDescription: string;
  masterJedi: string;
  masterJediDescription: string;
  masterYoda: string;
  masterYodaDescription: string;
  unlockInnovationPower: string;
  padawanPlanError: string;
  errorProcessingRequest: string;
  pciCertified: string;
  fraudProtection: string;
  
  // Profile
  updateProfile: string;
  resetPassword: string;
  deleteAccount: string;
  dangerZone: string;
  confirmDeletion: string;
  typeDelete: string;
  userNotFound: string;
  errorLoadingData: string;
  userNotAuthenticated: string;
  profileUpdatedSuccess: string;
  errorUpdatingProfile: string;
  emailNotFound: string;
  passwordResetEmailSent: string;
  errorSendingPasswordReset: string;
  incorrectPassword: string;
  errorDeletingAccount: string;
  errorDeletingAccountGeneric: string;
  enterPasswordToConfirm: string;
  confirmAccountDeletion: string;
  deleteKeyword: string;
  inFieldBelow: string;
  type: string;
  toConfirm: string;
  deleting: string;
  
  // Token Usage
  tokenUsage: string;
  remaining: string;
  renewalOn: string;
  upgradePlan: string;
  
  // Language Change Message
  languageChangeMessage: string;
  
  // Common
  back: string;
  next: string;
  continue: string;
  confirm: string;
  yes: string;
  no: string;
  close: string;
  open: string;
  edit: string;
  delete: string;
  add: string;
  remove: string;
  search: string;
  filter: string;
  sort: string;
  
  // Messages
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Email Templates
  emailSubjectPrefix: string;
  emailFooterCompany: string;
  emailFooterDescription: string;
  emailFooterWebsite: string;
  emailFooterContact: string;
  emailFooterDisclaimer: string;
  
  // Language
  language: string;
  portuguese: string;
  english: string;
  french: string;
  german: string;
  italian: string;

  // Additional Startup Card Translations
  reasonForChoice: string;
  backToList: string;
  loadingStartups: string;
  loadingTimeline: string;
  startupNotFound: string;
  loadingContacts: string;
  noContactsRegistered: string;
  addFirstContact: string;
  contactAddedSuccess: string;
  errorAddingContact: string;
  contactUpdatedSuccess: string;
  errorUpdatingContact: string;
  contactRemovedSuccess: string;
  errorRemovingContact: string;
  manageContacts: string;
  listContacts: string;
  addWhatsAppNumber: string;
  addPhoneNumber: string;
  invalidPhoneNumber: string;
  whatsAppNumberAddedSuccess: string;
  errorAddingPhoneNumber: string;
  emailRequired: string;
  subjectRequired: string;
  messageRequired: string;
  emailSentSuccess: string;
  whatsAppSentSuccess: string;
  errorSendingMessage: string;
  selectContact: string;
  selectEmail: string;
  selectPhone: string;
  noWhatsAppRegistered: string;
  emailTo: string;
  whatsAppTo: string;
  sentAt: string;
  status: string;
  sent: string;
  delivered: string;
  failed: string;
  processing: string;
  backToPipeline: string;
  backToSavedStartups: string;
  projectPlanning: string;
  expectedResults: string;
  competitiveAdvantages: string;
  proofOfConcept: string;
  phase: string;
  duration: string;
  description: string;
  viewStartupList: string;
  viewCompleteList: string;
  startupListButton: string;
  upgradeButton: string;
  tokenLimitReached: string;
  updatePlan: string;
  processingChallenge: string;
  creatingShortlist: string;
  conductingMarketResearch: string;
  generatingSelectionProcess: string;
  creatingPOCs: string;
  finalizingRecommendations: string;
  searchingStartups: string;
  qualifyingStartups: string;
  researchingMarket: string;
  selectingFinalStartups: string;
  creatingPOCsForChallenge: string;
  finalizingStartupList: string;
}

export const translations: Record<string, Translations> = {
  pt: {
    // Navigation and Layout
    newChallenge: 'Novo desafio',
    pipelineCRM: 'Pipeline CRM',
    challenges: 'Desafios',
    logout: 'Sair',
    profile: 'Perfil',
    plans: 'Planos',
    
    // Authentication
    login: 'Login',
    register: 'Criar Conta',
    email: 'Email',
    password: 'Senha',
    name: 'Nome completo',
    cpf: 'CPF',
    company: 'Empresa',
    phone: 'Celular',
    forgotPassword: 'Esqueceu a senha?',
    createAccount: 'CRIAR CONTA',
    alreadyHaveAccount: 'Já tem uma conta? Faça login',
    acceptTerms: 'Li e aceito os termos de uso',
    verifyEmail: 'Verifique seu Email',
    resendVerification: 'Reenviar email de verificação',
    backToLogin: 'Voltar para o Login',
    
    // Challenge Creation
    challengeTitle: 'Título do Desafio',
    challengeDescription: 'Descrição do Desafio',
    businessArea: 'Área de atuação da empresa',
    createChallenge: 'Criar Desafio',
    
    // Chat Interface
    typeMessage: 'Digite uma mensagem...',
    selectChallenge: 'Selecione um desafio para começar',
    loading: 'Carregando...',
    
    // Startup List
    startups: 'Startups',
    selectStartup: 'Selecionar startup',
    selected: 'Selecionada',
    saving: 'Salvando...',
    matchScore: 'Match Score',
    founded: 'Fundação',
    category: 'Categoria',
    vertical: 'Vertical',
    location: 'Localização',
    teamSize: 'Tamanho da Equipe',
    businessModel: 'Modelo de Negócio',
    ipoStatus: 'Status IPO',
    website: 'Website',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    twitter: 'Twitter',
    instagram: 'Instagram',
    
    // Pipeline CRM
    mapped: 'Mapeada',
    contacted: 'Contatada',
    interviewed: 'Entrevistada',
    poc: 'POC',
    emptyPipeline: 'Pipeline vazio',
    exploreStartups: 'Explorar Startups',
    manageStages: 'Gerenciar Estágios',
    
    // Contact Management
    contactManagement: 'Gestão de Contatos',
    contacts: 'Contatos',
    addContact: 'Adicionar Contato',
    newContact: 'Novo Contato',
    editContact: 'Editar Contato',
    deleteContact: 'Remover Contato',
    contactName: 'Nome',
    contactRole: 'Cargo/Função',
    emails: 'Emails',
    phones: 'Telefones/WhatsApp',
    addEmail: 'Adicionar outro email',
    addPhone: 'Adicionar outro telefone',
    save: 'Salvar',
    cancel: 'Cancelar',
    startup: 'Startup',
    founder: 'Fundador',
    
    // Message Composer
    newMessage: 'Nova Mensagem',
    composeMessage: 'Compor Mensagem',
    recipient: 'Destinatário',
    subject: 'Assunto',
    message: 'Mensagem',
    sendEmail: 'Enviar Email',
    sendWhatsApp: 'Enviar WhatsApp',
    sending: 'Enviando...',
    
    // Timeline
    interactionTimeline: 'Timeline de Interações',
    noInteractions: 'Nenhuma interação ainda',
    firstMessage: 'Comece a interação com esta startup enviando sua primeira mensagem',
    sendFirstMessage: 'Enviar Primeira Mensagem',
    response: 'Resposta',
    responseReceived: 'Resposta recebida',
    
    // Plans
    choosePlan: 'Escolha seu plano',
    currentPlan: 'Plano atual',
    startNow: 'Começar agora',
    initialPlan: 'Plano inicial',
    tokens: 'tokens',
    free: 'Grátis',
    mostPopular: 'Mais popular',
    securePayment: 'Pagamento Seguro SSL',
    padawanDescription: 'Plano para iniciantes que estão começando no caminho da inovação',
    jediDescription: 'Plano para o guerreiro que está aprendendo as artes da inovação por IA',
    masterJedi: 'Mestre Jedi',
    masterJediDescription: 'Plano para o Jedi que se superou, e agora pode derrotar as forças da inércia inovativa',
    masterYoda: 'Mestre Yoda',
    masterYodaDescription: 'Plano para o inovador que enfrentou batalhas e está preparado para defender as forças da disrupção',
    unlockInnovationPower: 'Desbloqueie o poder da inovação com nossos planos personalizados',
    padawanPlanError: 'O plano Padawan é o plano inicial e não pode ser contratado. Por favor, escolha outro plano.',
    errorProcessingRequest: 'Erro ao processar sua solicitação. Por favor, tente novamente.',
    pciCertified: 'Certificado PCI DSS',
    fraudProtection: 'Proteção Antifraude',
    
    // Profile
    updateProfile: 'Atualizar Perfil',
    resetPassword: 'Redefinir Senha',
    deleteAccount: 'Apagar conta',
    dangerZone: 'Zona de Perigo',
    confirmDeletion: 'Confirmar Deleção',
    typeDelete: 'Digite DELETAR',
    userNotFound: 'Usuário não encontrado',
    errorLoadingData: 'Erro ao carregar dados',
    userNotAuthenticated: 'Usuário não autenticado',
    profileUpdatedSuccess: 'Perfil atualizado com sucesso!',
    errorUpdatingProfile: 'Erro ao atualizar perfil',
    emailNotFound: 'Email não encontrado',
    passwordResetEmailSent: 'Email de redefinição de senha enviado!',
    errorSendingPasswordReset: 'Erro ao enviar email de redefinição',
    incorrectPassword: 'Senha incorreta. Por favor, tente novamente.',
    errorDeletingAccount: 'Erro ao deletar a conta',
    errorDeletingAccountGeneric: 'Erro ao deletar conta. Por favor, tente novamente.',
    enterPasswordToConfirm: 'Por favor, insira sua senha para confirmar a deleção da conta:',
    confirmAccountDeletion: 'Para confirmar a deleção da conta e anonimização dos dados, digite',
    deleteKeyword: 'DELETAR',
    inFieldBelow: 'no campo abaixo',
    type: 'Digite',
    toConfirm: 'para confirmar',
    deleting: 'Deletando...',
    
    // Token Usage
    tokenUsage: 'Uso de Tokens',
    remaining: 'restantes',
    renewalOn: 'Renovação em',
    upgradePlan: 'Atualizar plano',
    
    // Language Change Message
    languageChangeMessage: 'Poderia por favor mudar o idioma que fala comigo, e iniciar o questionário?',
    
    // Common
    back: 'Voltar',
    next: 'Próximo',
    continue: 'Continuar',
    confirm: 'Confirmar',
    yes: 'Sim',
    no: 'Não',
    close: 'Fechar',
    open: 'Abrir',
    edit: 'Editar',
    delete: 'Deletar',
    add: 'Adicionar',
    remove: 'Remover',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    
    // Messages
    success: 'Sucesso',
    error: 'Erro',
    warning: 'Aviso',
    info: 'Informação',
    
    // Email Templates
    emailSubjectPrefix: 'A {company} deseja contatar a {startup} - ',
    emailFooterCompany: 'Gen.OI',
    emailFooterDescription: 'Conectando empresas às melhores startups do mundo',
    emailFooterWebsite: 'genoi.net',
    emailFooterContact: 'contact@genoi.net',
    emailFooterDisclaimer: 'Esta mensagem foi enviada através da plataforma Gen.OI de inovação aberta.',
    
    // Language
    language: 'Idioma',
    portuguese: 'Português',
    english: 'Inglês',
    french: 'Francês',
    german: 'Alemão',
    italian: 'Italiano',

    // Additional Startup Card Translations
    reasonForChoice: 'Motivo da escolha',
    backToList: 'Voltar para lista',
    loadingStartups: 'Carregando startups...',
    loadingTimeline: 'Carregando timeline...',
    startupNotFound: 'Startup não encontrada',
    loadingContacts: 'Carregando contatos...',
    noContactsRegistered: 'Nenhum contato cadastrado',
    addFirstContact: 'Adicionar Primeiro Contato',
    contactAddedSuccess: 'Contato adicionado com sucesso!',
    errorAddingContact: 'Erro ao adicionar contato',
    contactUpdatedSuccess: 'Contato atualizado com sucesso!',
    errorUpdatingContact: 'Erro ao atualizar contato',
    contactRemovedSuccess: 'Contato removido com sucesso!',
    errorRemovingContact: 'Erro ao remover contato',
    manageContacts: 'Gerenciar Contatos',
    listContacts: 'Lista de Contatos',
    addWhatsAppNumber: 'Adicionar Número do WhatsApp',
    addPhoneNumber: 'Adicionar número de WhatsApp',
    invalidPhoneNumber: 'Número de telefone inválido para WhatsApp',
    whatsAppNumberAddedSuccess: 'Número de WhatsApp adicionado com sucesso!',
    errorAddingPhoneNumber: 'Erro ao adicionar número de WhatsApp',
    emailRequired: 'Email do destinatário é obrigatório',
    subjectRequired: 'Assunto é obrigatório para emails',
    messageRequired: 'Mensagem é obrigatória',
    emailSentSuccess: 'Email enviado com sucesso!',
    whatsAppSentSuccess: 'Mensagem WhatsApp enviada com sucesso!',
    errorSendingMessage: 'Erro ao enviar mensagem',
    selectContact: 'Selecione um contato',
    selectEmail: 'Selecionar Email',
    selectPhone: 'Selecionar Telefone',
    noWhatsAppRegistered: 'Sem WhatsApp cadastrado',
    emailTo: 'Para: ',
    whatsAppTo: 'WhatsApp: ',
    sentAt: 'Enviado em',
    status: 'Status',
    sent: 'Enviado',
    delivered: 'Entregue',
    failed: 'Falhou',
    processing: 'Processando',
    backToPipeline: 'Voltar para pipeline',
    backToSavedStartups: 'Voltar para startups salvas',
    projectPlanning: 'Planejamento do Projeto',
    expectedResults: 'Resultados Esperados',
    competitiveAdvantages: 'Vantagens Competitivas',
    proofOfConcept: 'Provas de conceito',
    phase: 'Fase',
    duration: 'Duração',
    description: 'Descrição',
    viewStartupList: 'Ver Lista de Startups',
    viewCompleteList: 'Ver lista completa',
    startupListButton: 'Ver Lista de Startups',
    upgradeButton: 'Atualizar Plano',
    tokenLimitReached: 'Você atingiu o limite de tokens do seu plano',
    updatePlan: 'Atualize seu plano para continuar inovando!',
    processingChallenge: 'Processando desafio e buscando entre milhares de startups...',
    creatingShortlist: 'Criando uma short list de startups qualificadas',
    conductingMarketResearch: 'Realizando uma pesquisa de mercado e do desafio',
    generatingSelectionProcess: 'Gerando um processo seletivo final de startups',
    creatingPOCs: 'Criando as POCs para solucionar o desafio',
    finalizingRecommendations: 'Finalizando a lista de indicação de startups para seu desafio!',
    searchingStartups: 'Processando desafio e buscando entre milhares de startups...',
    qualifyingStartups: 'Criando uma short list de startups qualificadas',
    researchingMarket: 'Realizando uma pesquisa de mercado e do desafio',
    selectingFinalStartups: 'Gerando um processo seletivo final de startups',
    creatingPOCsForChallenge: 'Criando as POCs para solucionar o desafio',
    finalizingStartupList: 'Finalizando a lista de indicação de startups para seu desafio!',
  },
  
  en: {
    // Navigation and Layout
    newChallenge: 'New challenge',
    pipelineCRM: 'Pipeline CRM',
    challenges: 'Challenges',
    logout: 'Logout',
    profile: 'Profile',
    plans: 'Plans',
    
    // Authentication
    login: 'Login',
    register: 'Create Account',
    email: 'Email',
    password: 'Password',
    name: 'Full name',
    cpf: 'Tax ID',
    company: 'Company',
    phone: 'Phone',
    forgotPassword: 'Forgot password?',
    createAccount: 'CREATE ACCOUNT',
    alreadyHaveAccount: 'Already have an account? Sign in',
    acceptTerms: 'I have read and accept the terms of use',
    verifyEmail: 'Verify your Email',
    resendVerification: 'Resend verification email',
    backToLogin: 'Back to Login',
    
    // Challenge Creation
    challengeTitle: 'Challenge Title',
    challengeDescription: 'Challenge Description',
    businessArea: 'Company business area',
    createChallenge: 'Create Challenge',
    
    // Chat Interface
    typeMessage: 'Type a message...',
    selectChallenge: 'Select a challenge to start',
    loading: 'Loading...',
    
    // Startup List
    startups: 'Startups',
    selectStartup: 'Select startup',
    selected: 'Selected',
    saving: 'Saving...',
    matchScore: 'Match Score',
    founded: 'Founded',
    category: 'Category',
    vertical: 'Vertical',
    location: 'Location',
    teamSize: 'Team Size',
    businessModel: 'Business Model',
    ipoStatus: 'IPO Status',
    website: 'Website',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    twitter: 'Twitter',
    instagram: 'Instagram',
    
    // Pipeline CRM
    mapped: 'Mapped',
    contacted: 'Contacted',
    interviewed: 'Interviewed',
    poc: 'POC',
    emptyPipeline: 'Empty pipeline',
    exploreStartups: 'Explore Startups',
    manageStages: 'Manage Stages',
    
    // Contact Management
    contactManagement: 'Contact Management',
    contacts: 'Contacts',
    addContact: 'Add Contact',
    newContact: 'New Contact',
    editContact: 'Edit Contact',
    deleteContact: 'Delete Contact',
    contactName: 'Name',
    contactRole: 'Role/Position',
    emails: 'Emails',
    phones: 'Phones/WhatsApp',
    addEmail: 'Add another email',
    addPhone: 'Add another phone',
    save: 'Save',
    cancel: 'Cancel',
    startup: 'Startup',
    founder: 'Founder',
    
    // Message Composer
    newMessage: 'New Message',
    composeMessage: 'Compose Message',
    recipient: 'Recipient',
    subject: 'Subject',
    message: 'Message',
    sendEmail: 'Send Email',
    sendWhatsApp: 'Send WhatsApp',
    sending: 'Sending...',
    
    // Timeline
    interactionTimeline: 'Interaction Timeline',
    noInteractions: 'No interactions yet',
    firstMessage: 'Start interacting with this startup by sending your first message',
    sendFirstMessage: 'Send First Message',
    response: 'Response',
    responseReceived: 'Response received',
    
    // Plans
    choosePlan: 'Choose your plan',
    currentPlan: 'Current plan',
    startNow: 'Start now',
    initialPlan: 'Initial plan',
    tokens: 'tokens',
    free: 'Free',
    mostPopular: 'Most popular',
    securePayment: 'Secure SSL Payment',
    padawanDescription: 'Plan for beginners starting their innovation journey',
    jediDescription: 'Plan for warriors learning the arts of AI innovation',
    masterJedi: 'Master Jedi',
    masterJediDescription: 'Plan for Jedis who have overcome and can now defeat the forces of innovative inertia',
    masterYoda: 'Master Yoda',
    masterYodaDescription: 'Plan for innovators who have faced battles and are ready to defend the forces of disruption',
    unlockInnovationPower: 'Unlock the power of innovation with our personalized plans',
    padawanPlanError: 'The Padawan plan is the initial plan and cannot be purchased. Please choose another plan.',
    errorProcessingRequest: 'Error processing your request. Please try again.',
    pciCertified: 'PCI DSS Certified',
    fraudProtection: 'Fraud Protection',
    
    // Profile
    updateProfile: 'Update Profile',
    resetPassword: 'Reset Password',
    deleteAccount: 'Delete account',
    dangerZone: 'Danger Zone',
    confirmDeletion: 'Confirm Deletion',
    typeDelete: 'Type DELETE',
    userNotFound: 'User not found',
    errorLoadingData: 'Error loading data',
    userNotAuthenticated: 'User not authenticated',
    profileUpdatedSuccess: 'Profile updated successfully!',
    errorUpdatingProfile: 'Error updating profile',
    emailNotFound: 'Email not found',
    passwordResetEmailSent: 'Password reset email sent!',
    errorSendingPasswordReset: 'Error sending password reset email',
    incorrectPassword: 'Incorrect password. Please try again.',
    errorDeletingAccount: 'Error deleting account',
    errorDeletingAccountGeneric: 'Error deleting account. Please try again.',
    enterPasswordToConfirm: 'Please enter your password to confirm account deletion:',
    confirmAccountDeletion: 'To confirm account deletion and data anonymization, type',
    deleteKeyword: 'DELETE',
    inFieldBelow: 'in the field below',
    type: 'Type',
    toConfirm: 'to confirm',
    deleting: 'Deleting...',
    
    // Token Usage
    tokenUsage: 'Token Usage',
    remaining: 'remaining',
    renewalOn: 'Renewal on',
    upgradePlan: 'Upgrade plan',
    
    // Language Change Message
    languageChangeMessage: 'Could you please change the language you speak to me, to english and begin the questionare?',
    
    // Common
    back: 'Back',
    next: 'Next',
    continue: 'Continue',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    open: 'Open',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    remove: 'Remove',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    
    // Messages
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    
    // Email Templates
    emailSubjectPrefix: '{company} wants to contact {startup} - ',
    emailFooterCompany: 'Gen.OI',
    emailFooterDescription: 'Connecting companies to the world\'s best startups',
    emailFooterWebsite: 'genoi.net',
    emailFooterContact: 'contact@genoi.net',
    emailFooterDisclaimer: 'This message was sent through the Gen.OI open innovation platform.',
    
    // Language
    language: 'Language',
    portuguese: 'Portuguese',
    english: 'English',
    french: 'French',
    german: 'German',
    italian: 'Italian',

    // Additional Startup Card Translations
    reasonForChoice: 'Reason for choice',
    backToList: 'Back to list',
    loadingStartups: 'Loading startups...',
    loadingTimeline: 'Loading timeline...',
    startupNotFound: 'Startup not found',
    loadingContacts: 'Loading contacts...',
    noContactsRegistered: 'No contacts registered',
    addFirstContact: 'Add First Contact',
    contactAddedSuccess: 'Contact added successfully!',
    errorAddingContact: 'Error adding contact',
    contactUpdatedSuccess: 'Contact updated successfully!',
    errorUpdatingContact: 'Error updating contact',
    contactRemovedSuccess: 'Contact removed successfully!',
    errorRemovingContact: 'Error removing contact',
    manageContacts: 'Manage Contacts',
    listContacts: 'Contact List',
    addWhatsAppNumber: 'Add WhatsApp Number',
    addPhoneNumber: 'Add WhatsApp number',
    invalidPhoneNumber: 'Invalid phone number for WhatsApp',
    whatsAppNumberAddedSuccess: 'WhatsApp number added successfully!',
    errorAddingPhoneNumber: 'Error adding WhatsApp number',
    emailRequired: 'Recipient email is required',
    subjectRequired: 'Subject is required for emails',
    messageRequired: 'Message is required',
    emailSentSuccess: 'Email sent successfully!',
    whatsAppSentSuccess: 'WhatsApp message sent successfully!',
    errorSendingMessage: 'Error sending message',
    selectContact: 'Select a contact',
    selectEmail: 'Select Email',
    selectPhone: 'Select Phone',
    noWhatsAppRegistered: 'No WhatsApp registered',
    emailTo: 'To: ',
    whatsAppTo: 'WhatsApp: ',
    sentAt: 'Sent at',
    status: 'Status',
    sent: 'Sent',
    delivered: 'Delivered',
    failed: 'Failed',
    processing: 'Processing',
    backToPipeline: 'Back to pipeline',
    backToSavedStartups: 'Back to saved startups',
    projectPlanning: 'Project Planning',
    expectedResults: 'Expected Results',
    competitiveAdvantages: 'Competitive Advantages',
    proofOfConcept: 'Proof of concept',
    phase: 'Phase',
    duration: 'Duration',
    description: 'Description',
    viewStartupList: 'View Startup List',
    viewCompleteList: 'View complete list',
    startupListButton: 'View Startup List',
    upgradeButton: 'Upgrade Plan',
    tokenLimitReached: 'You have reached your plan\'s token limit',
    updatePlan: 'Upgrade your plan to continue innovating!',
    processingChallenge: 'Processing challenge and searching among thousands of startups...',
    creatingShortlist: 'Creating a shortlist of qualified startups',
    conductingMarketResearch: 'Conducting market and challenge research',
    generatingSelectionProcess: 'Generating final startup selection process',
    creatingPOCs: 'Creating POCs to solve the challenge',
    finalizingRecommendations: 'Finalizing startup recommendation list for your challenge!',
    searchingStartups: 'Processing challenge and searching among thousands of startups...',
    qualifyingStartups: 'Creating a shortlist of qualified startups',
    researchingMarket: 'Conducting market and challenge research',
    selectingFinalStartups: 'Generating final startup selection process',
    creatingPOCsForChallenge: 'Creating POCs to solve the challenge',
    finalizingStartupList: 'Finalizing startup recommendation list for your challenge!',
  },
  
  fr: {
    // Navigation and Layout
    newChallenge: 'Nouveau défi',
    pipelineCRM: 'Pipeline CRM',
    challenges: 'Défis',
    logout: 'Déconnexion',
    profile: 'Profil',
    plans: 'Plans',
    
    // Authentication
    login: 'Connexion',
    register: 'Créer un compte',
    email: 'Email',
    password: 'Mot de passe',
    name: 'Nom complet',
    cpf: 'ID fiscal',
    company: 'Entreprise',
    phone: 'Téléphone',
    forgotPassword: 'Mot de passe oublié?',
    createAccount: 'CRÉER UN COMPTE',
    alreadyHaveAccount: 'Vous avez déjà un compte? Connectez-vous',
    acceptTerms: 'J\'ai lu et j\'accepte les conditions d\'utilisation',
    verifyEmail: 'Vérifiez votre email',
    resendVerification: 'Renvoyer l\'email de vérification',
    backToLogin: 'Retour à la connexion',
    
    // Challenge Creation
    challengeTitle: 'Titre du défi',
    challengeDescription: 'Description du défi',
    businessArea: 'Secteur d\'activité de l\'entreprise',
    createChallenge: 'Créer un défi',
    
    // Chat Interface
    typeMessage: 'Tapez un message...',
    selectChallenge: 'Sélectionnez un défi pour commencer',
    loading: 'Chargement...',
    
    // Startup List
    startups: 'Startups',
    selectStartup: 'Sélectionner startup',
    selected: 'Sélectionnée',
    saving: 'Sauvegarde...',
    matchScore: 'Score de correspondance',
    founded: 'Fondée',
    category: 'Catégorie',
    vertical: 'Vertical',
    location: 'Localisation',
    teamSize: 'Taille de l\'équipe',
    businessModel: 'Modèle d\'affaires',
    ipoStatus: 'Statut IPO',
    website: 'Site web',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    twitter: 'Twitter',
    instagram: 'Instagram',
    
    // Pipeline CRM
    mapped: 'Cartographiée',
    contacted: 'Contactée',
    interviewed: 'Interviewée',
    poc: 'POC',
    emptyPipeline: 'Pipeline vide',
    exploreStartups: 'Explorer les startups',
    manageStages: 'Gérer les étapes',
    
    // Contact Management
    contactManagement: 'Gestion des contacts',
    contacts: 'Contacts',
    addContact: 'Ajouter un contact',
    newContact: 'Nouveau contact',
    editContact: 'Modifier le contact',
    deleteContact: 'Supprimer le contact',
    contactName: 'Nom',
    contactRole: 'Rôle/Poste',
    emails: 'Emails',
    phones: 'Téléphones/WhatsApp',
    addEmail: 'Ajouter un autre email',
    addPhone: 'Ajouter un autre téléphone',
    save: 'Sauvegarder',
    cancel: 'Annuler',
    startup: 'Startup',
    founder: 'Fondateur',
    
    // Message Composer
    newMessage: 'Nouveau message',
    composeMessage: 'Composer un message',
    recipient: 'Destinataire',
    subject: 'Sujet',
    message: 'Message',
    sendEmail: 'Envoyer un email',
    sendWhatsApp: 'Envoyer WhatsApp',
    sending: 'Envoi...',
    
    // Timeline
    interactionTimeline: 'Chronologie des interactions',
    noInteractions: 'Aucune interaction encore',
    firstMessage: 'Commencez à interagir avec cette startup en envoyant votre premier message',
    sendFirstMessage: 'Envoyer le premier message',
    response: 'Réponse',
    responseReceived: 'Réponse reçue',
    
    // Plans
    choosePlan: 'Choisissez votre plan',
    currentPlan: 'Plan actuel',
    startNow: 'Commencer maintenant',
    initialPlan: 'Plan initial',
    tokens: 'jetons',
    free: 'Gratuit',
    mostPopular: 'Le plus populaire',
    securePayment: 'Paiement sécurisé SSL',
    padawanDescription: 'Plan pour les débutants qui commencent leur parcours d\'innovation',
    jediDescription: 'Plan pour les guerriers qui apprennent les arts de l\'innovation IA',
    masterJedi: 'Maître Jedi',
    masterJediDescription: 'Plan pour les Jedis qui ont surmonté et peuvent maintenant vaincre les forces d\'inertie innovante',
    masterYoda: 'Maître Yoda',
    masterYodaDescription: 'Plan pour les innovateurs qui ont affronté des batailles et sont prêts à défendre les forces de disruption',
    unlockInnovationPower: 'Débloquez le pouvoir de l\'innovation avec nos plans personnalisés',
    padawanPlanError: 'Le plan Padawan est le plan initial et ne peut pas être acheté. Veuillez choisir un autre plan.',
    errorProcessingRequest: 'Erreur lors du traitement de votre demande. Veuillez réessayer.',
    pciCertified: 'Certifié PCI DSS',
    fraudProtection: 'Protection contre la fraude',
    
    // Profile
    updateProfile: 'Mettre à jour le profil',
    resetPassword: 'Réinitialiser le mot de passe',
    deleteAccount: 'Supprimer le compte',
    dangerZone: 'Zone de danger',
    confirmDeletion: 'Confirmer la suppression',
    typeDelete: 'Tapez SUPPRIMER',
    userNotFound: 'Utilisateur non trouvé',
    errorLoadingData: 'Erreur lors du chargement des données',
    userNotAuthenticated: 'Utilisateur non authentifié',
    profileUpdatedSuccess: 'Profil mis à jour avec succès!',
    errorUpdatingProfile: 'Erreur lors de la mise à jour du profil',
    emailNotFound: 'Email non trouvé',
    passwordResetEmailSent: 'Email de réinitialisation du mot de passe envoyé!',
    errorSendingPasswordReset: 'Erreur lors de l\'envoi de l\'email de réinitialisation',
    incorrectPassword: 'Mot de passe incorrect. Veuillez réessayer.',
    errorDeletingAccount: 'Erreur lors de la suppression du compte',
    errorDeletingAccountGeneric: 'Erreur lors de la suppression du compte. Veuillez réessayer.',
    enterPasswordToConfirm: 'Veuillez entrer votre mot de passe pour confirmer la suppression du compte:',
    confirmAccountDeletion: 'Pour confirmer la suppression du compte et l\'anonymisation des données, tapez',
    deleteKeyword: 'SUPPRIMER',
    inFieldBelow: 'dans le champ ci-dessous',
    type: 'Tapez',
    toConfirm: 'pour confirmer',
    deleting: 'Suppression...',
    
    // Token Usage
    tokenUsage: 'Utilisation des jetons',
    remaining: 'restants',
    renewalOn: 'Renouvellement le',
    upgradePlan: 'Mettre à niveau le plan',
    
    // Language Change Message
    languageChangeMessage: 'Pourriez-vous changer la langue en français et commencer le questionnaire ?',
    
    // Common
    back: 'Retour',
    next: 'Suivant',
    continue: 'Continuer',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    close: 'Fermer',
    open: 'Ouvrir',
    edit: 'Modifier',
    delete: 'Supprimer',
    add: 'Ajouter',
    remove: 'Retirer',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    
    // Messages
    success: 'Succès',
    error: 'Erreur',
    warning: 'Avertissement',
    info: 'Information',
    
    // Email Templates
    emailSubjectPrefix: '{company} souhaite contacter {startup} - ',
    emailFooterCompany: 'Gen.OI',
    emailFooterDescription: 'Connecter les entreprises aux meilleures startups du monde',
    emailFooterWebsite: 'genoi.net',
    emailFooterContact: 'contact@genoi.net',
    emailFooterDisclaimer: 'Ce message a été envoyé via la plateforme d\'innovation ouverte Gen.OI.',
    
    // Language
    language: 'Langue',
    portuguese: 'Portugais',
    english: 'Anglais',
    french: 'Français',
    german: 'Allemand',
    italian: 'Italien',

    // Additional Startup Card Translations
    reasonForChoice: 'Raison du choix',
    backToList: 'Retour à la liste',
    loadingStartups: 'Chargement des startups...',
    loadingTimeline: 'Chargement de la chronologie...',
    startupNotFound: 'Startup non trouvée',
    loadingContacts: 'Chargement des contacts...',
    noContactsRegistered: 'Aucun contact enregistré',
    addFirstContact: 'Ajouter le premier contact',
    contactAddedSuccess: 'Contact ajouté avec succès!',
    errorAddingContact: 'Erreur lors de l\'ajout du contact',
    contactUpdatedSuccess: 'Contact mis à jour avec succès!',
    errorUpdatingContact: 'Erreur lors de la mise à jour du contact',
    contactRemovedSuccess: 'Contact supprimé avec succès!',
    errorRemovingContact: 'Erreur lors de la suppression du contact',
    manageContacts: 'Gérer les contacts',
    listContacts: 'Liste des contacts',
    addWhatsAppNumber: 'Ajouter un numéro WhatsApp',
    addPhoneNumber: 'Ajouter un numéro WhatsApp',
    invalidPhoneNumber: 'Numéro de téléphone invalide pour WhatsApp',
    whatsAppNumberAddedSuccess: 'Numéro WhatsApp ajouté avec succès!',
    errorAddingPhoneNumber: 'Erreur lors de l\'ajout du numéro WhatsApp',
    emailRequired: 'L\'email du destinataire est requis',
    subjectRequired: 'Le sujet est requis pour les emails',
    messageRequired: 'Le message est requis',
    emailSentSuccess: 'Email envoyé avec succès!',
    whatsAppSentSuccess: 'Message WhatsApp envoyé avec succès!',
    errorSendingMessage: 'Erreur lors de l\'envoi du message',
    selectContact: 'Sélectionner un contact',
    selectEmail: 'Sélectionner un email',
    selectPhone: 'Sélectionner un téléphone',
    noWhatsAppRegistered: 'Aucun WhatsApp enregistré',
    emailTo: 'À: ',
    whatsAppTo: 'WhatsApp: ',
    sentAt: 'Envoyé le',
    status: 'Statut',
    sent: 'Envoyé',
    delivered: 'Livré',
    failed: 'Échoué',
    processing: 'Traitement',
    backToPipeline: 'Retour au pipeline',
    backToSavedStartups: 'Retour aux startups sauvegardées',
    projectPlanning: 'Planification du projet',
    expectedResults: 'Résultats attendus',
    competitiveAdvantages: 'Avantages concurrentiels',
    proofOfConcept: 'Preuve de concept',
    phase: 'Phase',
    duration: 'Durée',
    description: 'Description',
    viewStartupList: 'Voir la liste des startups',
    viewCompleteList: 'Voir la liste complète',
    startupListButton: 'Voir la liste des startups',
    upgradeButton: 'Mettre à niveau le plan',
    tokenLimitReached: 'Vous avez atteint la limite de jetons de votre plan',
    updatePlan: 'Mettez à niveau votre plan pour continuer à innover!',
    processingChallenge: 'Traitement du défi et recherche parmi des milliers de startups...',
    creatingShortlist: 'Création d\'une liste restreinte de startups qualifiées',
    conductingMarketResearch: 'Réalisation d\'une étude de marché et du défi',
    generatingSelectionProcess: 'Génération du processus de sélection final des startups',
    creatingPOCs: 'Création des POCs pour résoudre le défi',
    finalizingRecommendations: 'Finalisation de la liste de recommandations de startups pour votre défi!',
    searchingStartups: 'Traitement du défi et recherche parmi des milliers de startups...',
    qualifyingStartups: 'Création d\'une liste restreinte de startups qualifiées',
    researchingMarket: 'Réalisation d\'une étude de marché et du défi',
    selectingFinalStartups: 'Génération du processus de sélection final des startups',
    creatingPOCsForChallenge: 'Création des POCs pour résoudre le défi',
    finalizingStartupList: 'Finalisation de la liste de recommandations de startups pour votre défi!',
  },
  
  de: {
    // Navigation and Layout
    newChallenge: 'Neue Herausforderung',
    pipelineCRM: 'Pipeline CRM',
    challenges: 'Herausforderungen',
    logout: 'Abmelden',
    profile: 'Profil',
    plans: 'Pläne',
    
    // Authentication
    login: 'Anmelden',
    register: 'Konto erstellen',
    email: 'E-Mail',
    password: 'Passwort',
    name: 'Vollständiger Name',
    cpf: 'Steuer-ID',
    company: 'Unternehmen',
    phone: 'Telefon',
    forgotPassword: 'Passwort vergessen?',
    createAccount: 'KONTO ERSTELLEN',
    alreadyHaveAccount: 'Haben Sie bereits ein Konto? Anmelden',
    acceptTerms: 'Ich habe die Nutzungsbedingungen gelesen und akzeptiert',
    verifyEmail: 'E-Mail verifizieren',
    resendVerification: 'Bestätigungs-E-Mail erneut senden',
    backToLogin: 'Zurück zur Anmeldung',
    
    // Challenge Creation
    challengeTitle: 'Herausforderungstitel',
    challengeDescription: 'Herausforderungsbeschreibung',
    businessArea: 'Geschäftsbereich des Unternehmens',
    createChallenge: 'Herausforderung erstellen',
    
    // Chat Interface
    typeMessage: 'Nachricht eingeben...',
    selectChallenge: 'Wählen Sie eine Herausforderung zum Starten',
    loading: 'Laden...',
    
    // Startup List
    startups: 'Startups',
    selectStartup: 'Startup auswählen',
    selected: 'Ausgewählt',
    saving: 'Speichern...',
    matchScore: 'Match-Score',
    founded: 'Gegründet',
    category: 'Kategorie',
    vertical: 'Vertikal',
    location: 'Standort',
    teamSize: 'Teamgröße',
    businessModel: 'Geschäftsmodell',
    ipoStatus: 'IPO-Status',
    website: 'Website',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    twitter: 'Twitter',
    instagram: 'Instagram',
    
    // Pipeline CRM
    mapped: 'Kartiert',
    contacted: 'Kontaktiert',
    interviewed: 'Interviewt',
    poc: 'POC',
    emptyPipeline: 'Leere Pipeline',
    exploreStartups: 'Startups erkunden',
    manageStages: 'Phasen verwalten',
    
    // Contact Management
    contactManagement: 'Kontaktverwaltung',
    contacts: 'Kontakte',
    addContact: 'Kontakt hinzufügen',
    newContact: 'Neuer Kontakt',
    editContact: 'Kontakt bearbeiten',
    deleteContact: 'Kontakt löschen',
    contactName: 'Name',
    contactRole: 'Rolle/Position',
    emails: 'E-Mails',
    phones: 'Telefone/WhatsApp',
    addEmail: 'Weitere E-Mail hinzufügen',
    addPhone: 'Weiteres Telefon hinzufügen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    startup: 'Startup',
    founder: 'Gründer',
    
    // Message Composer
    newMessage: 'Neue Nachricht',
    composeMessage: 'Nachricht verfassen',
    recipient: 'Empfänger',
    subject: 'Betreff',
    message: 'Nachricht',
    sendEmail: 'E-Mail senden',
    sendWhatsApp: 'WhatsApp senden',
    sending: 'Senden...',
    
    // Timeline
    interactionTimeline: 'Interaktions-Timeline',
    noInteractions: 'Noch keine Interaktionen',
    firstMessage: 'Beginnen Sie die Interaktion mit diesem Startup, indem Sie Ihre erste Nachricht senden',
    sendFirstMessage: 'Erste Nachricht senden',
    response: 'Antwort',
    responseReceived: 'Antwort erhalten',
    
    // Plans
    choosePlan: 'Wählen Sie Ihren Plan',
    currentPlan: 'Aktueller Plan',
    startNow: 'Jetzt starten',
    initialPlan: 'Anfangsplan',
    tokens: 'Token',
    free: 'Kostenlos',
    mostPopular: 'Am beliebtesten',
    securePayment: 'Sichere SSL-Zahlung',
    padawanDescription: 'Plan für Anfänger, die ihre Innovationsreise beginnen',
    jediDescription: 'Plan für Krieger, die die Künste der KI-Innovation erlernen',
    masterJedi: 'Meister Jedi',
    masterJediDescription: 'Plan für Jedis, die überwunden haben und nun die Kräfte der innovativen Trägheit besiegen können',
    masterYoda: 'Meister Yoda',
    masterYodaDescription: 'Plan für Innovatoren, die Schlachten erlebt haben und bereit sind, die Kräfte der Disruption zu verteidigen',
    unlockInnovationPower: 'Entfesseln Sie die Kraft der Innovation mit unseren personalisierten Plänen',
    padawanPlanError: 'Der Padawan-Plan ist der Anfangsplan und kann nicht gekauft werden. Bitte wählen Sie einen anderen Plan.',
    errorProcessingRequest: 'Fehler bei der Bearbeitung Ihrer Anfrage. Bitte versuchen Sie es erneut.',
    pciCertified: 'PCI DSS zertifiziert',
    fraudProtection: 'Betrugsschutz',
    
    // Profile
    updateProfile: 'Profil aktualisieren',
    resetPassword: 'Passwort zurücksetzen',
    deleteAccount: 'Konto löschen',
    dangerZone: 'Gefahrenzone',
    confirmDeletion: 'Löschung bestätigen',
    typeDelete: 'LÖSCHEN eingeben',
    userNotFound: 'Benutzer nicht gefunden',
    errorLoadingData: 'Fehler beim Laden der Daten',
    userNotAuthenticated: 'Benutzer nicht authentifiziert',
    profileUpdatedSuccess: 'Profil erfolgreich aktualisiert!',
    errorUpdatingProfile: 'Fehler beim Aktualisieren des Profils',
    emailNotFound: 'E-Mail nicht gefunden',
    passwordResetEmailSent: 'Passwort-Reset-E-Mail gesendet!',
    errorSendingPasswordReset: 'Fehler beim Senden der Passwort-Reset-E-Mail',
    incorrectPassword: 'Falsches Passwort. Bitte versuchen Sie es erneut.',
    errorDeletingAccount: 'Fehler beim Löschen des Kontos',
    errorDeletingAccountGeneric: 'Fehler beim Löschen des Kontos. Bitte versuchen Sie es erneut.',
    enterPasswordToConfirm: 'Bitte geben Sie Ihr Passwort ein, um die Kontolöschung zu bestätigen:',
    confirmAccountDeletion: 'Um die Kontolöschung und Datenanonymisierung zu bestätigen, geben Sie',
    deleteKeyword: 'LÖSCHEN',
    inFieldBelow: 'in das Feld unten ein',
    type: 'Geben Sie',
    toConfirm: 'zur Bestätigung ein',
    deleting: 'Löschen...',
    
    // Token Usage
    tokenUsage: 'Token-Nutzung',
    remaining: 'verbleibend',
    renewalOn: 'Erneuerung am',
    upgradePlan: 'Plan upgraden',
    
    // Language Change Message
    languageChangeMessage: 'Könnten Sie bitte die Sprache auf Deutsch umstellen und mit dem Fragebogen beginnen?',
    
    // Common
    back: 'Zurück',
    next: 'Weiter',
    continue: 'Fortfahren',
    confirm: 'Bestätigen',
    yes: 'Ja',
    no: 'Nein',
    close: 'Schließen',
    open: 'Öffnen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    add: 'Hinzufügen',
    remove: 'Entfernen',
    search: 'Suchen',
    filter: 'Filtern',
    sort: 'Sortieren',
    
    // Messages
    success: 'Erfolg',
    error: 'Fehler',
    warning: 'Warnung',
    info: 'Information',
    
    // Email Templates
    emailSubjectPrefix: '{company} möchte {startup} kontaktieren - ',
    emailFooterCompany: 'Gen.OI',
    emailFooterDescription: 'Unternehmen mit den besten Startups der Welt verbinden',
    emailFooterWebsite: 'genoi.net',
    emailFooterContact: 'contact@genoi.net',
    emailFooterDisclaimer: 'Diese Nachricht wurde über die Gen.OI Open Innovation Plattform gesendet.',
    
    // Language
    language: 'Sprache',
    portuguese: 'Portugiesisch',
    english: 'Englisch',
    french: 'Französisch',
    german: 'Deutsch',
    italian: 'Italienisch',

    // Additional Startup Card Translations
    reasonForChoice: 'Grund für die Wahl',
    backToList: 'Zurück zur Liste',
    loadingStartups: 'Startups laden...',
    loadingTimeline: 'Timeline laden...',
    startupNotFound: 'Startup nicht gefunden',
    loadingContacts: 'Kontakte laden...',
    noContactsRegistered: 'Keine Kontakte registriert',
    addFirstContact: 'Ersten Kontakt hinzufügen',
    contactAddedSuccess: 'Kontakt erfolgreich hinzugefügt!',
    errorAddingContact: 'Fehler beim Hinzufügen des Kontakts',
    contactUpdatedSuccess: 'Kontakt erfolgreich aktualisiert!',
    errorUpdatingContact: 'Fehler beim Aktualisieren des Kontakts',
    contactRemovedSuccess: 'Kontakt erfolgreich entfernt!',
    errorRemovingContact: 'Fehler beim Entfernen des Kontakts',
    manageContacts: 'Kontakte verwalten',
    listContacts: 'Kontaktliste',
    addWhatsAppNumber: 'WhatsApp-Nummer hinzufügen',
    addPhoneNumber: 'WhatsApp-Nummer hinzufügen',
    invalidPhoneNumber: 'Ungültige Telefonnummer für WhatsApp',
    whatsAppNumberAddedSuccess: 'WhatsApp-Nummer erfolgreich hinzugefügt!',
    errorAddingPhoneNumber: 'Fehler beim Hinzufügen der WhatsApp-Nummer',
    emailRequired: 'Empfänger-E-Mail ist erforderlich',
    subjectRequired: 'Betreff ist für E-Mails erforderlich',
    messageRequired: 'Nachricht ist erforderlich',
    emailSentSuccess: 'E-Mail erfolgreich gesendet!',
    whatsAppSentSuccess: 'WhatsApp-Nachricht erfolgreich gesendet!',
    errorSendingMessage: 'Fehler beim Senden der Nachricht',
    selectContact: 'Kontakt auswählen',
    selectEmail: 'E-Mail auswählen',
    selectPhone: 'Telefon auswählen',
    noWhatsAppRegistered: 'Kein WhatsApp registriert',
    emailTo: 'An: ',
    whatsAppTo: 'WhatsApp: ',
    sentAt: 'Gesendet am',
    status: 'Status',
    sent: 'Gesendet',
    delivered: 'Zugestellt',
    failed: 'Fehlgeschlagen',
    processing: 'Verarbeitung',
    backToPipeline: 'Zurück zur Pipeline',
    backToSavedStartups: 'Zurück zu gespeicherten Startups',
    projectPlanning: 'Projektplanung',
    expectedResults: 'Erwartete Ergebnisse',
    competitiveAdvantages: 'Wettbewerbsvorteile',
    proofOfConcept: 'Proof of Concept',
    phase: 'Phase',
    duration: 'Dauer',
    description: 'Beschreibung',
    viewStartupList: 'Startup-Liste anzeigen',
    viewCompleteList: 'Vollständige Liste anzeigen',
    startupListButton: 'Startup-Liste anzeigen',
    upgradeButton: 'Plan upgraden',
    tokenLimitReached: 'Sie haben das Token-Limit Ihres Plans erreicht',
    updatePlan: 'Upgraden Sie Ihren Plan, um weiter zu innovieren!',
    processingChallenge: 'Herausforderung verarbeiten und unter Tausenden von Startups suchen...',
    creatingShortlist: 'Erstellen einer Shortlist qualifizierter Startups',
    conductingMarketResearch: 'Durchführung von Markt- und Herausforderungsforschung',
    generatingSelectionProcess: 'Generierung des finalen Startup-Auswahlprozesses',
    creatingPOCs: 'Erstellen von POCs zur Lösung der Herausforderung',
    finalizingRecommendations: 'Finalisierung der Startup-Empfehlungsliste für Ihre Herausforderung!',
    searchingStartups: 'Herausforderung verarbeiten und unter Tausenden von Startups suchen...',
    qualifyingStartups: 'Erstellen einer Shortlist qualifizierter Startups',
    researchingMarket: 'Durchführung von Markt- und Herausforderungsforschung',
    selectingFinalStartups: 'Generierung des finalen Startup-Auswahlprozesses',
    creatingPOCsForChallenge: 'Erstellen von POCs zur Lösung der Herausforderung',
    finalizingStartupList: 'Finalisierung der Startup-Empfehlungsliste für Ihre Herausforderung!',
  },
  
  it: {
    // Navigation and Layout
    newChallenge: 'Nuova sfida',
    pipelineCRM: 'Pipeline CRM',
    challenges: 'Sfide',
    logout: 'Disconnetti',
    profile: 'Profilo',
    plans: 'Piani',
    
    // Authentication
    login: 'Accedi',
    register: 'Crea account',
    email: 'Email',
    password: 'Password',
    name: 'Nome completo',
    cpf: 'ID fiscale',
    company: 'Azienda',
    phone: 'Telefono',
    forgotPassword: 'Password dimenticata?',
    createAccount: 'CREA ACCOUNT',
    alreadyHaveAccount: 'Hai già un account? Accedi',
    acceptTerms: 'Ho letto e accetto i termini di utilizzo',
    verifyEmail: 'Verifica la tua email',
    resendVerification: 'Invia nuovamente email di verifica',
    backToLogin: 'Torna al login',
    
    // Challenge Creation
    challengeTitle: 'Titolo della sfida',
    challengeDescription: 'Descrizione della sfida',
    businessArea: 'Area di business dell\'azienda',
    createChallenge: 'Crea sfida',
    
    // Chat Interface
    typeMessage: 'Digita un messaggio...',
    selectChallenge: 'Seleziona una sfida per iniziare',
    loading: 'Caricamento...',
    
    // Startup List
    startups: 'Startup',
    selectStartup: 'Seleziona startup',
    selected: 'Selezionata',
    saving: 'Salvando...',
    matchScore: 'Punteggio di corrispondenza',
    founded: 'Fondata',
    category: 'Categoria',
    vertical: 'Verticale',
    location: 'Posizione',
    teamSize: 'Dimensione del team',
    businessModel: 'Modello di business',
    ipoStatus: 'Stato IPO',
    website: 'Sito web',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    twitter: 'Twitter',
    instagram: 'Instagram',
    
    // Pipeline CRM
    mapped: 'Mappata',
    contacted: 'Contattata',
    interviewed: 'Intervistata',
    poc: 'POC',
    emptyPipeline: 'Pipeline vuota',
    exploreStartups: 'Esplora startup',
    manageStages: 'Gestisci fasi',
    
    // Contact Management
    contactManagement: 'Gestione contatti',
    contacts: 'Contatti',
    addContact: 'Aggiungi contatto',
    newContact: 'Nuovo contatto',
    editContact: 'Modifica contatto',
    deleteContact: 'Elimina contatto',
    contactName: 'Nome',
    contactRole: 'Ruolo/Posizione',
    emails: 'Email',
    phones: 'Telefoni/WhatsApp',
    addEmail: 'Aggiungi un\'altra email',
    addPhone: 'Aggiungi un altro telefono',
    save: 'Salva',
    cancel: 'Annulla',
    startup: 'Startup',
    founder: 'Fondatore',
    
    // Message Composer
    newMessage: 'Nuovo messaggio',
    composeMessage: 'Componi messaggio',
    recipient: 'Destinatario',
    subject: 'Oggetto',
    message: 'Messaggio',
    sendEmail: 'Invia email',
    sendWhatsApp: 'Invia WhatsApp',
    sending: 'Invio...',
    
    // Timeline
    interactionTimeline: 'Timeline delle interazioni',
    noInteractions: 'Nessuna interazione ancora',
    firstMessage: 'Inizia a interagire con questa startup inviando il tuo primo messaggio',
    sendFirstMessage: 'Invia primo messaggio',
    response: 'Risposta',
    responseReceived: 'Risposta ricevuta',
    
    // Plans
    choosePlan: 'Scegli il tuo piano',
    currentPlan: 'Piano attuale',
    startNow: 'Inizia ora',
    initialPlan: 'Piano iniziale',
    tokens: 'token',
    free: 'Gratuito',
    mostPopular: 'Più popolare',
    securePayment: 'Pagamento sicuro SSL',
    padawanDescription: 'Piano per principianti che iniziano il loro percorso di innovazione',
    jediDescription: 'Piano per guerrieri che imparano le arti dell\'innovazione AI',
    masterJedi: 'Maestro Jedi',
    masterJediDescription: 'Piano per Jedi che hanno superato e ora possono sconfiggere le forze dell\'inerzia innovativa',
    masterYoda: 'Maestro Yoda',
    masterYodaDescription: 'Piano per innovatori che hanno affrontato battaglie e sono pronti a difendere le forze della disruption',
    unlockInnovationPower: 'Sblocca il potere dell\'innovazione con i nostri piani personalizzati',
    padawanPlanError: 'Il piano Padawan è il piano iniziale e non può essere acquistato. Si prega di scegliere un altro piano.',
    errorProcessingRequest: 'Errore nell\'elaborazione della richiesta. Si prega di riprovare.',
    pciCertified: 'Certificato PCI DSS',
    fraudProtection: 'Protezione dalle frodi',
    
    // Profile
    updateProfile: 'Aggiorna profilo',
    resetPassword: 'Reimposta password',
    deleteAccount: 'Elimina account',
    dangerZone: 'Zona di pericolo',
    confirmDeletion: 'Conferma eliminazione',
    typeDelete: 'Digita ELIMINA',
    userNotFound: 'Utente non trovato',
    errorLoadingData: 'Errore nel caricamento dei dati',
    userNotAuthenticated: 'Utente non autenticato',
    profileUpdatedSuccess: 'Profilo aggiornato con successo!',
    errorUpdatingProfile: 'Errore nell\'aggiornamento del profilo',
    emailNotFound: 'Email non trovata',
    passwordResetEmailSent: 'Email di reset password inviata!',
    errorSendingPasswordReset: 'Errore nell\'invio dell\'email di reset password',
    incorrectPassword: 'Password errata. Si prega di riprovare.',
    errorDeletingAccount: 'Errore nell\'eliminazione dell\'account',
    errorDeletingAccountGeneric: 'Errore nell\'eliminazione dell\'account. Si prega di riprovare.',
    enterPasswordToConfirm: 'Si prega di inserire la password per confermare l\'eliminazione dell\'account:',
    confirmAccountDeletion: 'Per confermare l\'eliminazione dell\'account e l\'anonimizzazione dei dati, digita',
    deleteKeyword: 'ELIMINA',
    inFieldBelow: 'nel campo sottostante',
    type: 'Digita',
    toConfirm: 'per confermare',
    deleting: 'Eliminazione...',
    
    // Token Usage
    tokenUsage: 'Utilizzo token',
    remaining: 'rimanenti',
    renewalOn: 'Rinnovo il',
    upgradePlan: 'Aggiorna piano',
    
    // Language Change Message
    languageChangeMessage: 'Potresti cambiare la lingua in italiano e iniziare il questionario?',
    
    // Common
    back: 'Indietro',
    next: 'Avanti',
    continue: 'Continua',
    confirm: 'Conferma',
    yes: 'Sì',
    no: 'No',
    close: 'Chiudi',
    open: 'Apri',
    edit: 'Modifica',
    delete: 'Elimina',
    add: 'Aggiungi',
    remove: 'Rimuovi',
    search: 'Cerca',
    filter: 'Filtra',
    sort: 'Ordina',
    
    // Messages
    success: 'Successo',
    error: 'Errore',
    warning: 'Avviso',
    info: 'Informazione',
    
    // Email Templates
    emailSubjectPrefix: '{company} vuole contattare {startup} - ',
    emailFooterCompany: 'Gen.OI',
    emailFooterDescription: 'Collegare le aziende alle migliori startup del mondo',
    emailFooterWebsite: 'genoi.net',
    emailFooterContact: 'contact@genoi.net',
    emailFooterDisclaimer: 'Questo messaggio è stato inviato tramite la piattaforma di innovazione aperta Gen.OI.',
    
    // Language
    language: 'Lingua',
    portuguese: 'Portoghese',
    english: 'Inglese',
    french: 'Francese',
    german: 'Tedesco',
    italian: 'Italiano',

    // Additional Startup Card Translations
    reasonForChoice: 'Motivo della scelta',
    backToList: 'Torna alla lista',
    loadingStartups: 'Caricamento startup...',
    loadingTimeline: 'Caricamento timeline...',
    startupNotFound: 'Startup non trovata',
    loadingContacts: 'Caricamento contatti...',
    noContactsRegistered: 'Nessun contatto registrato',
    addFirstContact: 'Aggiungi primo contatto',
    contactAddedSuccess: 'Contatto aggiunto con successo!',
    errorAddingContact: 'Errore nell\'aggiunta del contatto',
    contactUpdatedSuccess: 'Contatto aggiornato con successo!',
    errorUpdatingContact: 'Errore nell\'aggiornamento del contatto',
    contactRemovedSuccess: 'Contatto rimosso con successo!',
    errorRemovingContact: 'Errore nella rimozione del contatto',
    manageContacts: 'Gestisci contatti',
    listContacts: 'Lista contatti',
    addWhatsAppNumber: 'Aggiungi numero WhatsApp',
    addPhoneNumber: 'Aggiungi numero WhatsApp',
    invalidPhoneNumber: 'Numero di telefono non valido per WhatsApp',
    whatsAppNumberAddedSuccess: 'Numero WhatsApp aggiunto con successo!',
    errorAddingPhoneNumber: 'Errore nell\'aggiunta del numero WhatsApp',
    emailRequired: 'L\'email del destinatario è richiesta',
    subjectRequired: 'L\'oggetto è richiesto per le email',
    messageRequired: 'Il messaggio è richiesto',
    emailSentSuccess: 'Email inviata con successo!',
    whatsAppSentSuccess: 'Messaggio WhatsApp inviato con successo!',
    errorSendingMessage: 'Errore nell\'invio del messaggio',
    selectContact: 'Seleziona un contatto',
    selectEmail: 'Seleziona email',
    selectPhone: 'Seleziona telefono',
    noWhatsAppRegistered: 'Nessun WhatsApp registrato',
    emailTo: 'A: ',
    whatsAppTo: 'WhatsApp: ',
    sentAt: 'Inviato il',
    status: 'Stato',
    sent: 'Inviato',
    delivered: 'Consegnato',
    failed: 'Fallito',
    processing: 'Elaborazione',
    backToPipeline: 'Torna alla pipeline',
    backToSavedStartups: 'Torna alle startup salvate',
    projectPlanning: 'Pianificazione del progetto',
    expectedResults: 'Risultati attesi',
    competitiveAdvantages: 'Vantaggi competitivi',
    proofOfConcept: 'Proof of concept',
    phase: 'Fase',
    duration: 'Durata',
    description: 'Descrizione',
    viewStartupList: 'Visualizza lista startup',
    viewCompleteList: 'Visualizza lista completa',
    startupListButton: 'Visualizza lista startup',
    upgradeButton: 'Aggiorna piano',
    tokenLimitReached: 'Hai raggiunto il limite di token del tuo piano',
    updatePlan: 'Aggiorna il tuo piano per continuare a innovare!',
    processingChallenge: 'Elaborazione della sfida e ricerca tra migliaia di startup...',
    creatingShortlist: 'Creazione di una shortlist di startup qualificate',
    conductingMarketResearch: 'Conduzione di ricerca di mercato e della sfida',
    generatingSelectionProcess: 'Generazione del processo di selezione finale delle startup',
    creatingPOCs: 'Creazione di POC per risolvere la sfida',
    finalizingRecommendations: 'Finalizzazione della lista di raccomandazioni startup per la tua sfida!',
    searchingStartups: 'Elaborazione della sfida e ricerca tra migliaia di startup...',
    qualifyingStartups: 'Creazione di una shortlist di startup qualificate',
    researchingMarket: 'Conduzione di ricerca di mercato e della sfida',
    selectingFinalStartups: 'Generazione del processo di selezione finale delle startup',
    creatingPOCsForChallenge: 'Creazione di POC per risolvere la sfida',
    finalizingStartupList: 'Finalizzazione della lista di raccomandazioni startup per la tua sfida!',
  },
};

// Language detection based on IP geolocation
export const detectLanguageFromIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country_code?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'br': 'pt',
      'pt': 'pt',
      'us': 'en',
      'gb': 'en',
      'ca': 'en',
      'au': 'en',
      'nz': 'en',
      'ie': 'en',
      'za': 'en',
      'fr': 'fr',
      'be': 'fr',
      'ch': 'fr',
      'mc': 'fr',
      'de': 'de',
      'at': 'de',
      'it': 'it',
      'sm': 'it',
      'va': 'it',
    };
    
    return languageMap[countryCode] || 'en'; // Default to English
  } catch (error) {
    console.error('Error detecting language from IP:', error);
    return 'en'; // Default to English on error
  }
};

// Get browser language as fallback
export const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0];
  const supportedLanguages = ['pt', 'en', 'fr', 'de', 'it'];
  return supportedLanguages.includes(browserLang) ? browserLang : 'en';
};

// Initialize language
export const initializeLanguage = async (): Promise<string> => {
  // Check if user has a saved language preference
  const savedLanguage = localStorage.getItem('genoi-language');
  if (savedLanguage && translations[savedLanguage]) {
    return savedLanguage;
  }
  
  // Try to detect from IP
  try {
    const detectedLanguage = await detectLanguageFromIP();
    if (translations[detectedLanguage]) {
      localStorage.setItem('genoi-language', detectedLanguage);
      return detectedLanguage;
    }
  } catch (error) {
    console.error('IP language detection failed:', error);
  }
  
  // Fallback to browser language
  const browserLanguage = getBrowserLanguage();
  localStorage.setItem('genoi-language', browserLanguage);
  return browserLanguage;
};

// Set language and send webhook message
export const setLanguage = async (language: string): Promise<void> => {
  if (!translations[language]) return;
  
  const previousLanguage = getCurrentLanguage();
  localStorage.setItem('genoi-language', language);
  
  // Only send webhook if language actually changed and user is authenticated
  if (previousLanguage !== language) {
    await sendLanguageChangeMessage(language);
  }
  
  window.location.reload(); // Reload to apply new language
};

// Send language change message to webhook
const sendLanguageChangeMessage = async (newLanguage: string): Promise<void> => {
  try {
    // Import auth and other dependencies dynamically to avoid circular imports
    const { auth } = await import('../firebase');
    const { addDoc, collection } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    if (!auth.currentUser) return;
    
    // Get current challenge from localStorage or other source
    const currentChallengeId = localStorage.getItem('current-challenge-id');
    if (!currentChallengeId) return;
    
    const message = translations[newLanguage].languageChangeMessage;
    
    // Send to webhook
    const response = await fetch('https://primary-production-2e3b.up.railway.app/webhook/production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId: currentChallengeId,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Save hidden user message
      await addDoc(collection(db, 'messages'), {
        challengeId: currentChallengeId,
        userId: auth.currentUser.uid,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        hidden: true
      });

      // Save AI response
      if (data[0]?.output) {
        await addDoc(collection(db, 'messages'), {
          challengeId: currentChallengeId,
          userId: auth.currentUser.uid,
          role: 'assistant',
          content: data[0].output,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error sending language change message:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return localStorage.getItem('genoi-language') || 'en';
};

// Get translations for current language
export const getTranslations = (language?: string): Translations => {
  const currentLang = language || getCurrentLanguage();
  return translations[currentLang] || translations.en;
};

// Translation hook
export const useTranslation = () => {
  const currentLanguage = getCurrentLanguage();
  const t = getTranslations(currentLanguage);
  
  return {
    t,
    language: currentLanguage,
    setLanguage,
    availableLanguages: Object.keys(translations),
  };
};