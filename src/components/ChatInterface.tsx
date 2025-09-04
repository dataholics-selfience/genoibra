import { useState, useRef, useEffect } from 'react';
import { Menu, SendHorizontal, Rocket, FolderOpen, Pencil, Mic, MicOff, BarChart3 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { MessageType, ChallengeType, TokenUsageType, StartupListType } from '../types';
import { LoadingStates } from './LoadingStates';
import { useTranslation } from '../utils/i18n';

interface ChatInterfaceProps {
  messages: MessageType[];
  addMessage: (message: Omit<MessageType, 'id' | 'timestamp'>) => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  currentChallenge: ChallengeType | undefined;
}

const MESSAGE_TOKEN_COST = 2;
const STARTUP_LIST_TOKEN_COST = 50;

// Declare speech recognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const ChatInterface = ({ messages, addMessage, toggleSidebar, isSidebarOpen, currentChallenge }: ChatInterfaceProps) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userInitials, setUserInitials] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsageType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: ''
  });
  const [responseDelay, setResponseDelay] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [forceRender, setForceRender] = useState(0);
  
  const responseTimer = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-scroll when loading animation appears
  useEffect(() => {
    if (isLoading && responseDelay > 0) {
      scrollToBottom();
    }
  }, [isLoading, responseDelay]);

  // Force re-render when user returns to page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setForceRender(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'pt-BR';
      
      recognitionInstance.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
      };
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setInput(prev => prev + finalTranscript);
          if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
          }
        }
      };
      
      recognitionInstance.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert('Permissão de microfone negada. Por favor, permita o acesso ao microfone.');
        }
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();
        if (userData?.name) {
          const initials = userData.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          setUserInitials(initials);
        }

        const tokenDoc = await getDoc(doc(db, 'tokenUsage', auth.currentUser.uid));
        if (tokenDoc.exists()) {
          setTokenUsage(tokenDoc.data() as TokenUsageType);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const checkAndUpdateTokens = async (cost: number): Promise<boolean> => {
    if (!auth.currentUser || !tokenUsage) return false;

    const remainingTokens = tokenUsage.totalTokens - tokenUsage.usedTokens;
    if (remainingTokens < cost) {
      await addMessage({
        role: 'assistant',
        content: `${t.tokenLimitReached} ${tokenUsage.plan}. ${t.updatePlan}\n\n<upgrade-plan-button>${t.upgradeButton}</upgrade-plan-button>`
      });
      return false;
    }

    await updateDoc(doc(db, 'tokenUsage', auth.currentUser.uid), {
      usedTokens: tokenUsage.usedTokens + cost
    });

    setTokenUsage(prev => prev ? {
      ...prev,
      usedTokens: prev.usedTokens + cost
    } : null);

    return true;
  };

  const extractStartupData = (content: string) => {
    try {
      const startMatch = content.indexOf('<startup cards>');
      const endMatch = content.indexOf('</startup cards>');
      
      if (startMatch === -1 || endMatch === -1) return null;
      
      const jsonStr = content.substring(startMatch + 15, endMatch).trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing startup data:', error);
      return null;
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChallenge || !auth.currentUser) return;

    try {
      await updateDoc(doc(db, 'challenges', currentChallenge.id), {
        title: editData.title,
        description: editData.description
      });

      const updateMessage = `Gostaria de atualizar o desafio ${editData.title} com mais informações da descrição: ${editData.description}. Quero que reprocesse esse novo título e descrição e todo histórico deste chat, e me faça uma pergunta sobre minha infra estrutura interna da empresa, para enriquecer o desafio proposto. Seja bem humorada, comece com um trocadilho engraçado envolvendo o desafio e a cultura geek, e depois faça a pergunta inteligente. Seja breve e não passe de 2 parágrafos.`;

      await handleSubmit(e, updateMessage);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating challenge:', error);
    }
  };

  const handleMicrophoneClick = () => {
    if (!recognition) {
      alert('Seu navegador não suporta reconhecimento de voz. Tente usar Chrome ou Edge.');
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        alert('Erro ao iniciar o reconhecimento de voz. Verifique as permissões do microfone.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent, overrideMessage?: string) => {
    e.preventDefault();
    if (!currentChallenge || !auth.currentUser) {
      navigate('/new-challenge');
      return;
    }
    
    const messageToSend = overrideMessage || input.trim();
    if (messageToSend && !isLoading) {
      setInput('');
      setIsLoading(true);
      
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.disabled = true;
      }

      try {
        const hasTokens = await checkAndUpdateTokens(MESSAGE_TOKEN_COST);
        if (!hasTokens) {
          setIsLoading(false);
          if (inputRef.current) {
            inputRef.current.disabled = false;
          }
          return;
        }

        if (!overrideMessage) {
          await addMessage({ role: 'user', content: messageToSend });
          scrollToBottom();
        }
        
        responseTimer.current = setTimeout(() => {
          setResponseDelay(prev => prev + 1);
          scrollToBottom();
        }, 3000);

        const response = await fetch('https://primary-production-2e3b.up.railway.app/webhook/production', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageToSend,
            sessionId: currentChallenge.sessionId,
          }),
        });

        if (responseTimer.current) {
          clearTimeout(responseTimer.current);
        }
        setResponseDelay(0);

        if (!response.ok) {
          throw new Error('Failed to send message to webhook');
        }

        const data = await response.json();
        if (data[0]?.output) {
          const aiResponse = data[0].output;
          const startupData = extractStartupData(aiResponse);

          if (startupData) {
            const hasEnoughTokens = await checkAndUpdateTokens(STARTUP_LIST_TOKEN_COST);
            if (!hasEnoughTokens) {
              setIsLoading(false);
              if (inputRef.current) {
                inputRef.current.disabled = false;
              }
              return;
            }

            await addDoc(collection(db, 'startupLists'), {
              userId: auth.currentUser.uid,
              userEmail: auth.currentUser.email,
              challengeId: currentChallenge.id,
              challengeTitle: currentChallenge.title,
              ...startupData,
              createdAt: new Date().toISOString()
            });

            await addMessage({
              role: 'assistant',
              content: `${t.viewCompleteList}\n\n<startup-list-button>${t.startupListButton}</startup-list-button>`,
              hidden: false
            });

            // Force re-render to ensure startup cards display properly
            setForceRender(prev => prev + 1);
          } else {
            await addMessage({ 
              role: 'assistant', 
              content: aiResponse,
              hidden: overrideMessage ? true : false
            });
            scrollToBottom();
          }
        }
      } catch (error) {
        console.error('Error in chat:', error);
        await addMessage({
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
        });
        scrollToBottom();
      } finally {
        setIsLoading(false);
        if (responseTimer.current) {
          clearTimeout(responseTimer.current);
        }
        setResponseDelay(0);
        if (inputRef.current) {
          inputRef.current.disabled = false;
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputClick = () => {
    if (!currentChallenge) {
      navigate('/new-challenge');
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    setInput(target.value);
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const renderMessage = (message: MessageType) => {
    if (message.content.includes('<startup-list-button>')) {
      return (
        <div className="space-y-4" key={`${message.id}-${forceRender}`}>
          <p className="text-lg font-semibold">{message.content.split('<startup-list-button>')[0]}</p>
          <Link
            to="/startups"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Rocket size={20} />
            {t.viewStartupList}
          </Link>
        </div>
      );
    }

    if (message.content.includes('<upgrade-plan-button>')) {
      return (
        <div className="space-y-4" key={`${message.id}-${forceRender}`}>
          <p className="text-lg font-semibold">{message.content.split('<upgrade-plan-button>')[0]}</p>
          <Link
            to="/plans"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            {t.upgradeButton}
          </Link>
        </div>
      );
    }

    return <p className="whitespace-pre-wrap text-lg font-semibold" key={`${message.id}-${forceRender}`}>{message.content}</p>;
  };

  const visibleMessages = messages.filter(message => !message.hidden);

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden w-full">
      {/* Header - Fixed at top */}
      <div className="flex flex-col p-3 border-b border-border flex-shrink-0 w-full bg-black">
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={toggleSidebar}
            className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white focus:outline-none bg-gray-800 rounded-lg border-2 border-gray-700 hover:border-gray-600 transition-all"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2 flex-1 ml-4">
            <FolderOpen size={20} className="text-gray-400" />
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="flex-1 space-y-2">
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t.challengeTitle}
                />
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={t.challengeDescription}
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                  >
                    {t.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
                  >
                    {t.cancel}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between flex-1">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-medium">{currentChallenge?.title}</h2>
                  <button
                    onClick={() => {
                      setEditData({
                        title: currentChallenge?.title || '',
                        description: currentChallenge?.description || ''
                      });
                      setIsEditing(true);
                    }}
                    className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <StartupListIcons challengeId={currentChallenge?.id} />
                  <Link
                    to="/saved-startups"
                    className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <BarChart3 size={16} />
                    Pipeline CRM
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar w-full">
        {visibleMessages.map((message) => (
          <div
            key={`${message.id}-${forceRender}`}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
          >
            <div
              className={`max-w-3xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-900 text-white ml-8'
                  : 'bg-gray-800 text-gray-100 mr-8'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-semibold mr-2">
                    AI
                  </div>
                  <span className="font-medium">Genie</span>
                </div>
              )}
              {message.role === 'user' && (
                <div className="flex items-center mb-2 justify-end">
                  <span className="font-medium mr-2">{t.you || 'Você'}</span>
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold">
                    {userInitials}
                  </div>
                </div>
              )}
              {renderMessage(message)}
            </div>
          </div>
        ))}
        {isLoading && responseDelay > 0 && (
          <div className="flex justify-start w-full">
            <div className="max-w-3xl w-full mr-8">
              <LoadingStates />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-border p-4 bg-black flex-shrink-0 w-full">
        <form onSubmit={handleSubmit} className="relative w-full max-w-none">
          <div className="relative" style={{ width: '95%', margin: '0 auto' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onClick={handleInputClick}
              placeholder={currentChallenge ? t.typeMessage : t.selectChallenge}
              className="w-full py-3 pl-4 pr-20 bg-gray-800 border border-gray-700 rounded-lg resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-[200px] text-gray-100 text-lg font-semibold"
              rows={1}
              disabled={isLoading}
            />
            <div className="absolute right-2 bottom-2.5 flex items-center gap-2">
              {recognition && (
                <button
                  type="button"
                  onClick={handleMicrophoneClick}
                  disabled={isLoading}
                  className={`p-1.5 rounded-md transition-colors ${
                    isRecording
                      ? 'text-red-500 bg-red-100 hover:bg-red-200'
                      : 'text-gray-500 hover:text-gray-400 hover:bg-gray-700'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-1.5 rounded-md transition-colors ${
                  input.trim() && !isLoading ? 'text-blue-500 hover:bg-gray-700' : 'text-gray-500'
                }`}
              >
                <SendHorizontal size={20} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const StartupListIcons = ({ challengeId }: { challengeId?: string }) => {
  const [startupLists, setStartupLists] = useState<StartupListType[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchStartupLists = async () => {
      if (!challengeId) return;
      
      try {
        const q = query(
          collection(db, 'startupLists'),
          where('challengeId', '==', challengeId)
        );
        const querySnapshot = await getDocs(q);
        setStartupLists(querySnapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() } as StartupListType)
        ));
      } catch (error) {
        console.error('Error fetching startup lists:', error);
      }
    };

    fetchStartupLists();
  }, [challengeId]);

  if (!startupLists.length) return null;

  const visibleLists = showAll ? startupLists : startupLists.slice(0, 3);

  return (
    <div className="flex -space-x-2">
      {visibleLists.map((list) => (
        <Link
          key={list.id}
          to="/startups"
          className="relative group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center border-2 border-gray-900 hover:border-blue-500 transition-colors shadow-lg hover:shadow-xl">
            <Rocket size={14} className="text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {list.startups?.length || 0}
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {list.startups?.length || 0} startups
          </div>
        </Link>
      ))}
      {!showAll && startupLists.length > 3 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border-2 border-gray-900 hover:border-gray-700 transition-colors text-gray-400 hover:text-white text-xs font-medium shadow-lg hover:shadow-xl"
        >
          +{startupLists.length - 3}
        </button>
      )}
    </div>
  );
};

export default ChatInterface;