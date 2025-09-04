import { useState, useEffect } from 'react';
import { Edit2, Plus, Save, X, Trash2, GripVertical, MessageSquare, Mail, Smartphone, ArrowLeft, Copy } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  emailTemplate?: string;
  emailSubject?: string;
  whatsappTemplate?: string;
}

interface PipelineStageManagerProps {
  onStagesUpdate: (stages: PipelineStage[]) => void;
}

const DEFAULT_STAGES: PipelineStage[] = [
  { 
    id: 'mapeada', 
    name: 'Mapeada', 
    color: 'bg-yellow-200 text-yellow-800 border-yellow-300', 
    order: 0,
    emailTemplate: '',
    emailSubject: '',
    whatsappTemplate: ''
  },
  { 
    id: 'selecionada', 
    name: 'Selecionada', 
    color: 'bg-blue-200 text-blue-800 border-blue-300', 
    order: 1,
    emailTemplate: '',
    emailSubject: '',
    whatsappTemplate: ''
  },
  { 
    id: 'contatada', 
    name: 'Contatada', 
    color: 'bg-red-200 text-red-800 border-red-300', 
    order: 2,
    emailTemplate: '',
    emailSubject: '',
    whatsappTemplate: ''
  },
  { 
    id: 'entrevistada', 
    name: 'Entrevistada', 
    color: 'bg-green-200 text-green-800 border-green-300', 
    order: 3,
    emailTemplate: '',
    emailSubject: '',
    whatsappTemplate: ''
  },
  { 
    id: 'poc', 
    name: 'POC', 
    color: 'bg-orange-200 text-orange-800 border-orange-300', 
    order: 4,
    emailTemplate: '',
    emailSubject: '',
    whatsappTemplate: ''
  }
];

const COLOR_OPTIONS = [
  { value: 'bg-yellow-200 text-yellow-800 border-yellow-300', label: 'Amarelo' },
  { value: 'bg-blue-200 text-blue-800 border-blue-300', label: 'Azul' },
  { value: 'bg-red-200 text-red-800 border-red-300', label: 'Vermelho' },
  { value: 'bg-green-200 text-green-800 border-green-300', label: 'Verde' },
  { value: 'bg-orange-200 text-orange-800 border-orange-300', label: 'Laranja' },
  { value: 'bg-purple-200 text-purple-800 border-purple-300', label: 'Roxo' },
  { value: 'bg-pink-200 text-pink-800 border-pink-300', label: 'Rosa' },
  { value: 'bg-indigo-200 text-indigo-800 border-indigo-300', label: 'Índigo' },
  { value: 'bg-gray-200 text-gray-800 border-gray-300', label: 'Cinza' }
];

const VARIABLES = [
  { key: '{{startupName}}', label: 'Nome da startup', description: 'Nome da startup selecionada' },
  { key: '{{senderName}}', label: 'Seu nome', description: 'Nome do remetente da mensagem' },
  { key: '{{senderCompany}}', label: 'Sua empresa', description: 'Nome da sua empresa' },
  { key: '{{recipientName}}', label: 'Nome do contato', description: 'Nome do contato da startup' }
];

const DraggableVariable = ({ variable, onDragStart }: { 
  variable: typeof VARIABLES[0]; 
  onDragStart: (variable: string) => void;
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', variable.key);
    onDragStart(variable.key);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(variable.key);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group flex items-center justify-between bg-blue-800/30 border border-blue-600/50 rounded-lg p-3 cursor-move hover:bg-blue-700/40 transition-colors"
    >
      <div className="flex items-center gap-3">
        <GripVertical size={16} className="text-blue-400 group-hover:text-blue-300" />
        <div>
          <code className="text-blue-300 font-mono text-sm">{variable.key}</code>
          <p className="text-blue-200 text-xs mt-1">{variable.description}</p>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 p-1 text-blue-400 hover:text-blue-300 transition-all"
        title="Copiar variável"
      >
        <Copy size={14} />
      </button>
    </div>
  );
};

const MessageTemplatePage = ({ 
  stage, 
  onSave, 
  onBack 
}: { 
  stage: PipelineStage; 
  onSave: (stage: PipelineStage) => void; 
  onBack: () => void; 
}) => {
  const [emailSubject, setEmailSubject] = useState(stage.emailSubject || '');
  const [emailTemplate, setEmailTemplate] = useState(stage.emailTemplate || '');
  const [whatsappTemplate, setWhatsappTemplate] = useState(stage.whatsappTemplate || '');
  const [draggedVariable, setDraggedVariable] = useState<string | null>(null);

  const handleSave = () => {
    onSave({
      ...stage,
      emailSubject,
      emailTemplate,
      whatsappTemplate
    });
    onBack();
  };

  const handleDrop = (e: React.DragEvent, field: 'subject' | 'email' | 'whatsapp') => {
    e.preventDefault();
    const variable = e.dataTransfer.getData('text/plain');
    
    if (variable) {
      const textarea = e.target as HTMLTextAreaElement | HTMLInputElement;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const currentValue = field === 'subject' ? emailSubject : 
                          field === 'email' ? emailTemplate : whatsappTemplate;
      
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      
      if (field === 'subject') {
        setEmailSubject(newValue);
      } else if (field === 'email') {
        setEmailTemplate(newValue);
      } else {
        setWhatsappTemplate(newValue);
      }
      
      // Focus back to textarea and position cursor after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Configurar Mensagens - {stage.name}
            </h1>
            <p className="text-gray-400 mt-1">
              Configure os modelos de mensagens automáticas para este estágio
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Variables Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-6 sticky top-6">
              <h4 className="text-blue-200 font-medium mb-4 flex items-center gap-2">
                <MessageSquare size={20} />
                Variáveis Disponíveis
              </h4>
              <p className="text-blue-300 text-sm mb-4">
                Arraste as variáveis para os campos de texto
              </p>
              <div className="space-y-3">
                {VARIABLES.map((variable) => (
                  <DraggableVariable
                    key={variable.key}
                    variable={variable}
                    onDragStart={setDraggedVariable}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="lg:col-span-3 space-y-8">
            {/* Email Template */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Mail size={24} className="text-blue-400" />
                <h3 className="text-xl font-semibold text-white">Modelo de Email</h3>
              </div>
              
              {/* Email Subject */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assunto do Email
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  onDrop={(e) => handleDrop(e, 'subject')}
                  onDragOver={handleDragOver}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Digite o assunto do email..."
                />
              </div>

              {/* Email Body */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Corpo do Email
                </label>
                <textarea
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  onDrop={(e) => handleDrop(e, 'email')}
                  onDragOver={handleDragOver}
                  rows={15}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm leading-relaxed"
                  placeholder="Digite o modelo de email para esta etapa..."
                />
              </div>
            </div>

            {/* WhatsApp Template */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Smartphone size={24} className="text-green-400" />
                <h3 className="text-xl font-semibold text-white">Modelo de WhatsApp</h3>
              </div>
              <textarea
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                onDrop={(e) => handleDrop(e, 'whatsapp')}
                onDragOver={handleDragOver}
                rows={8}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm leading-relaxed"
                placeholder="Digite o modelo de WhatsApp para esta etapa..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-700">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Save size={18} />
                Salvar Modelos
              </button>
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                <X size={18} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DraggableStageItem = ({ 
  stage, 
  editingStage, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete, 
  onConfigureMessages,
  canDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver
}: {
  stage: PipelineStage;
  editingStage: PipelineStage | null;
  onEdit: (stage: PipelineStage) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (stageId: string) => void;
  onConfigureMessages: (stage: PipelineStage) => void;
  canDelete: boolean;
  onDragStart: (e: React.DragEvent, stage: PipelineStage) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetStage: PipelineStage) => void;
  isDragOver: boolean;
}) => {
  const isEditing = editingStage?.id === stage.id;

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(e, stage);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(e, stage);
  };

  const getColorPreview = (colorClass: string) => {
    const bgColor = colorClass.split(' ')[0].replace('bg-', '');
    return `bg-${bgColor}`;
  };

  const hasTemplates = stage.emailTemplate || stage.whatsappTemplate;

  return (
    <div
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`bg-gray-700 rounded-lg p-4 transition-all ${
        isDragOver ? 'border-2 border-blue-400 bg-blue-900/20' : 'border-2 border-transparent'
      } ${!isEditing ? 'cursor-move' : ''}`}
    >
      {isEditing ? (
        // Edit Form
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <input
            type="text"
            value={editingStage.name}
            onChange={(e) => onEdit({ ...editingStage, name: e.target.value })}
            className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={editingStage.color}
            onChange={(e) => onEdit({ ...editingStage, color: e.target.value })}
            className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {COLOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Save size={16} />
              Salvar
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        // Display Stage
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GripVertical size={20} className="text-gray-400 group-hover:text-gray-300" />
            <span className={`px-3 py-1 rounded-full border font-medium ${stage.color}`}>
              {stage.name}
            </span>
            <div className={`w-6 h-6 rounded-full ${getColorPreview(stage.color)}`} />
            <span className="text-sm text-gray-400">Ordem: {stage.order + 1}</span>
            {hasTemplates && (
              <div className="flex items-center gap-1">
                {stage.emailTemplate && <Mail size={14} className="text-blue-400" />}
                {stage.whatsappTemplate && <Smartphone size={14} className="text-green-400" />}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onConfigureMessages(stage)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
              title="Configurar mensagens automáticas"
            >
              <MessageSquare size={16} />
            </button>
            <button
              onClick={() => onEdit(stage)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Edit2 size={16} />
            </button>
            {canDelete && (
              <button
                onClick={() => onDelete(stage.id)}
                className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PipelineStageManager = ({ onStagesUpdate }: PipelineStageManagerProps) => {
  const [stages, setStages] = useState<PipelineStage[]>(DEFAULT_STAGES);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [showAddStage, setShowAddStage] = useState(false);
  const [showMessagePage, setShowMessagePage] = useState<PipelineStage | null>(null);
  const [newStage, setNewStage] = useState<Partial<PipelineStage>>({
    name: '',
    color: COLOR_OPTIONS[0].value,
    emailTemplate: '',
    emailSubject: '',
    whatsappTemplate: ''
  });
  const [draggedStage, setDraggedStage] = useState<PipelineStage | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  useEffect(() => {
    const loadStages = async () => {
      if (!auth.currentUser) return;

      try {
        const stagesDoc = await getDoc(doc(db, 'pipelineStages', auth.currentUser.uid));
        if (stagesDoc.exists()) {
          const userStages = stagesDoc.data().stages as PipelineStage[];
          // Sort stages by order
          const sortedStages = userStages.sort((a, b) => a.order - b.order);
          setStages(sortedStages);
          onStagesUpdate(sortedStages);
        } else {
          onStagesUpdate(DEFAULT_STAGES);
        }
      } catch (error) {
        console.error('Error loading stages:', error);
        onStagesUpdate(DEFAULT_STAGES);
      }
    };

    loadStages();
  }, [onStagesUpdate]);

  const saveStages = async (updatedStages: PipelineStage[]) => {
    if (!auth.currentUser) return;

    try {
      // Ensure stages have correct order values
      const stagesWithOrder = updatedStages.map((stage, index) => ({
        ...stage,
        order: index
      }));

      await setDoc(doc(db, 'pipelineStages', auth.currentUser.uid), {
        stages: stagesWithOrder,
        updatedAt: new Date().toISOString()
      });
      setStages(stagesWithOrder);
      onStagesUpdate(stagesWithOrder);
    } catch (error) {
      console.error('Error saving stages:', error);
    }
  };

  const handleEditStage = async () => {
    if (!editingStage) return;

    const updatedStages = stages.map(stage =>
      stage.id === editingStage.id ? editingStage : stage
    );
    
    await saveStages(updatedStages);
    setEditingStage(null);
  };

  const handleAddStage = async () => {
    if (!newStage.name) return;

    const stageToAdd: PipelineStage = {
      id: Date.now().toString(),
      name: newStage.name,
      color: newStage.color || COLOR_OPTIONS[0].value,
      order: stages.length,
      emailTemplate: newStage.emailTemplate || '',
      emailSubject: newStage.emailSubject || '',
      whatsappTemplate: newStage.whatsappTemplate || ''
    };

    const updatedStages = [...stages, stageToAdd];
    await saveStages(updatedStages);
    
    setNewStage({ 
      name: '', 
      color: COLOR_OPTIONS[0].value,
      emailTemplate: '',
      emailSubject: '',
      whatsappTemplate: ''
    });
    setShowAddStage(false);
  };

  const handleDeleteStage = async (stageId: string) => {
    if (stages.length <= 1) return; // Don't allow deleting the last stage
    
    const updatedStages = stages.filter(stage => stage.id !== stageId);
    await saveStages(updatedStages);
  };

  const handleConfigureMessages = (stage: PipelineStage) => {
    setShowMessagePage(stage);
  };

  const handleSaveMessageTemplates = async (updatedStage: PipelineStage) => {
    const updatedStages = stages.map(stage =>
      stage.id === updatedStage.id ? updatedStage : stage
    );
    
    await saveStages(updatedStages);
  };

  const handleDragStart = (e: React.DragEvent, stage: PipelineStage) => {
    setDraggedStage(stage);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    
    if (!draggedStage || draggedStage.id === targetStage.id) {
      setDraggedStage(null);
      setDragOverStage(null);
      return;
    }

    const draggedIndex = stages.findIndex(s => s.id === draggedStage.id);
    const targetIndex = stages.findIndex(s => s.id === targetStage.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedStage(null);
      setDragOverStage(null);
      return;
    }

    // Create new array with reordered stages
    const newStages = [...stages];
    const [removed] = newStages.splice(draggedIndex, 1);
    newStages.splice(targetIndex, 0, removed);

    // Update order values
    const reorderedStages = newStages.map((stage, index) => ({
      ...stage,
      order: index
    }));

    await saveStages(reorderedStages);
    setDraggedStage(null);
    setDragOverStage(null);
  };

  const handleStageEdit = (stage: PipelineStage) => {
    setEditingStage({ ...stage });
  };

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  // Show message template page if selected
  if (showMessagePage) {
    return (
      <MessageTemplatePage
        stage={showMessagePage}
        onSave={handleSaveMessageTemplates}
        onBack={() => setShowMessagePage(null)}
      />
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Gerenciar Estágios do Pipeline</h3>
        <button
          onClick={() => setShowAddStage(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo Estágio
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-6">
        <p className="text-blue-200 text-sm mb-2">
          💡 <strong>Dica:</strong> Arraste os estágios usando o ícone <GripVertical size={16} className="inline mx-1" /> para reordenar a sequência do pipeline.
        </p>
        <p className="text-blue-200 text-sm">
          📧 Use o ícone <MessageSquare size={16} className="inline mx-1" /> para configurar mensagens automáticas que serão enviadas quando uma startup for movida para o estágio.
        </p>
      </div>

      {/* Add New Stage Form */}
      {showAddStage && (
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h4 className="text-white font-medium mb-4">Novo Estágio</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome do estágio *"
              value={newStage.name}
              onChange={(e) => setNewStage(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newStage.color}
              onChange={(e) => setNewStage(prev => ({ ...prev, color: e.target.value }))}
              className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {COLOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddStage}
              disabled={!newStage.name}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Save size={16} />
              Salvar
            </button>
            <button
              onClick={() => {
                setShowAddStage(false);
                setNewStage({ 
                  name: '', 
                  color: COLOR_OPTIONS[0].value,
                  emailTemplate: '',
                  emailSubject: '',
                  whatsappTemplate: ''
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Stages List */}
      <div className="space-y-4">
        {sortedStages.map((stage) => (
          <DraggableStageItem
            key={stage.id}
            stage={stage}
            editingStage={editingStage}
            onEdit={handleStageEdit}
            onSave={handleEditStage}
            onCancel={() => setEditingStage(null)}
            onDelete={handleDeleteStage}
            onConfigureMessages={handleConfigureMessages}
            canDelete={stages.length > 1}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragOver={dragOverStage === stage.id}
          />
        ))}
      </div>

      {sortedStages.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">Nenhum estágio configurado</p>
        </div>
      )}
    </div>
  );
};

export default PipelineStageManager;