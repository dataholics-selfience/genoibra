import { useState, useEffect } from 'react';
import { Edit2, Plus, Save, X, Trash2, GripVertical } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface PipelineStageManagerProps {
  onStagesUpdate: (stages: PipelineStage[]) => void;
}

const DEFAULT_STAGES: PipelineStage[] = [
  { 
    id: 'mapeada', 
    name: 'Mapeada', 
    color: 'bg-yellow-200 text-yellow-800 border-yellow-300', 
    order: 0
  },
  { 
    id: 'selecionada', 
    name: 'Selecionada', 
    color: 'bg-blue-200 text-blue-800 border-blue-300', 
    order: 1
  },
  { 
    id: 'contatada', 
    name: 'Contatada', 
    color: 'bg-red-200 text-red-800 border-red-300', 
    order: 2
  },
  { 
    id: 'entrevistada', 
    name: 'Entrevistada', 
    color: 'bg-green-200 text-green-800 border-green-300', 
    order: 3
  },
  { 
    id: 'poc', 
    name: 'POC', 
    color: 'bg-orange-200 text-orange-800 border-orange-300', 
    order: 4
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

const DraggableStageItem = ({ 
  stage, 
  editingStage, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete, 
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
          </div>
          <div className="flex gap-2">
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
  const [newStage, setNewStage] = useState<Partial<PipelineStage>>({
    name: '',
    color: COLOR_OPTIONS[0].value
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
      order: stages.length
    };

    const updatedStages = [...stages, stageToAdd];
    await saveStages(updatedStages);
    
    setNewStage({ 
      name: '', 
      color: COLOR_OPTIONS[0].value
    });
    setShowAddStage(false);
  };

  const handleDeleteStage = async (stageId: string) => {
    if (stages.length <= 1) return; // Don't allow deleting the last stage
    
    const updatedStages = stages.filter(stage => stage.id !== stageId);
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
        <p className="text-blue-200 text-sm">
          💡 <strong>Dica:</strong> Arraste os estágios usando o ícone <GripVertical size={16} className="inline mx-1" /> para reordenar a sequência do pipeline.
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
                  color: COLOR_OPTIONS[0].value
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