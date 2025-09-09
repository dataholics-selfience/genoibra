import { useState, useEffect } from 'react';
import { Plus, X, FolderClosed, FolderOpen, Rocket, BarChart3, Trash2, Shield } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import UserProfile from './UserProfile';
import LanguageSelector from './LanguageSelector';
import { ChallengeType, StartupListType } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from '../utils/i18n';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  challenges: ChallengeType[];
  currentChallengeId: string | null;
  onSelectChallenge: (challengeId: string) => void;
}

const Sidebar = ({ isOpen, toggleSidebar, challenges, currentChallengeId, onSelectChallenge }: SidebarProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [challengeStartups, setChallengeStartups] = useState<Record<string, StartupListType[]>>({});
  const [savedStartupsCount, setSavedStartupsCount] = useState(0);
  const [deletingChallengeId, setDeletingChallengeId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSudoAdmin, setIsSudoAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (auth.currentUser?.email === 'contact@dataholics.io') {
      setIsAdmin(true);
    }
    if (auth.currentUser?.email === 'daniel.mendes@dataholics.io') {
      setIsSudoAdmin(true);
    }
  }, []);
  useEffect(() => {
    const fetchStartupLists = async () => {
      const startupsByChallenge: Record<string, StartupListType[]> = {};
      for (const challenge of challenges) {
        const q = query(
          collection(db, 'startupLists'),
          where('challengeId', '==', challenge.id)
        );
        const querySnapshot = await getDocs(q);
        startupsByChallenge[challenge.id] = querySnapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() } as StartupListType)
        );
      }
      setChallengeStartups(startupsByChallenge);
    };

    fetchStartupLists();
  }, [challenges]);

  useEffect(() => {
    const fetchSavedStartupsCount = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, 'selectedStartups'),
          where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        setSavedStartupsCount(querySnapshot.size);
      } catch (error) {
        console.error('Error fetching saved startups count:', error);
      }
    };

    fetchSavedStartupsCount();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!auth.currentUser || deletingChallengeId) return;

    setDeletingChallengeId(challengeId);

    try {
      // Delete the challenge
      await deleteDoc(doc(db, 'challenges', challengeId));

      // Delete related messages
      const messagesQuery = query(
        collection(db, 'messages'),
        where('challengeId', '==', challengeId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const deleteMessagesPromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteMessagesPromises);

      // Delete related startup lists
      const startupListsQuery = query(
        collection(db, 'startupLists'),
        where('challengeId', '==', challengeId)
      );
      const startupListsSnapshot = await getDocs(startupListsQuery);
      const deleteStartupListsPromises = startupListsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteStartupListsPromises);

      // If this was the current challenge, navigate to home
      if (currentChallengeId === challengeId) {
        navigate('/');
      }

      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting challenge:', error);
    } finally {
      setDeletingChallengeId(null);
    }
  };

  const formatDate = (date: string) => {
    const challengeDate = new Date(date);
    return format(challengeDate, "MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 ${isOpen ? 'block' : 'hidden'}`}
        onClick={toggleSidebar}
      />

      <div 
        className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-[#1a1b2e] text-gray-300 z-30 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <img 
            src="https://genoi.net/wp-content/uploads/2024/12/Logo-gen.OI-Novo-1-2048x1035.png" 
            alt="Genie Logo" 
            className="h-12"
          />
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white focus:outline-none bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Language Selector */}
        <div className="px-3 py-2 border-b border-gray-800">
          <LanguageSelector />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar">
          <div className="p-3 space-y-2">
            <Link 
              to="/new-challenge"
              className="w-full flex items-center gap-2 text-base font-bold bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white p-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <Plus size={18} />
              <span>{t.newChallenge}</span>
            </Link>

            {/* Admin Interface - Only for contact@dataholics.io */}
            {isAdmin && (
              <Link 
                to="/admin"
                className="w-full flex items-center gap-2 text-base font-medium bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white p-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                <Shield size={18} />
                <span>Sudo Admin</span>
              </Link>
            )}

            {/* Sudo Admin Interface - Only for daniel.mendes@dataholics.io */}
            {isSudoAdmin && (
              <Link 
                to="/sudo-admin"
                className="w-full flex items-center gap-2 text-base font-medium bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white p-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                <Shield size={18} />
                <span>Sudo Admin</span>
              </Link>
            )}
            <Link 
              to="/saved-startups"
              className="w-full flex items-center gap-2 text-base font-medium bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white p-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <BarChart3 size={18} />
              <span>{t.pipelineCRM}</span>
              {savedStartupsCount > 0 && (
                <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  {savedStartupsCount}
                </span>
              )}
            </Link>
          </div>

          <div className="px-3 mb-2">
            <h2 className="text-sm font-normal text-gray-400 mb-2">{t.challenges}</h2>
          </div>

          <nav className="px-3">
            {challenges.map((challenge) => {
              const isActive = currentChallengeId === challenge.id;
              const startups = challengeStartups[challenge.id] || [];
              const isDeleting = deletingChallengeId === challenge.id;
              const showingDeleteConfirm = showDeleteConfirm === challenge.id;
              
              return (
                <div key={challenge.id} className="mb-2">
                  {showingDeleteConfirm ? (
                    <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
                      <p className="text-red-200 text-sm mb-3">
                        Tem certeza que deseja deletar este desafio? Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteChallenge(challenge.id)}
                          disabled={isDeleting}
                          className="flex-1 py-1 px-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white text-xs rounded transition-colors"
                        >
                          {isDeleting ? 'Deletando...' : 'Confirmar'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          disabled={isDeleting}
                          className="flex-1 py-1 px-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white text-xs rounded transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative">
                      <button
                        onClick={() => onSelectChallenge(challenge.id)}
                        className={`w-full flex flex-col text-sm p-2 rounded-lg transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40 text-white'
                            : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <FolderOpen size={14} className="text-blue-400" />
                          ) : (
                            <FolderClosed size={14} className="text-gray-500" />
                          )}
                          <span className="truncate text-left flex-1">{challenge.title}</span>
                          {startups.length > 0 && (
                            <Rocket size={14} className="text-gray-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 pl-6 mt-1">
                          {formatDate(challenge.createdAt)}
                        </div>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(challenge.id);
                        }}
                        className="absolute top-1 right-1 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-red-900/20"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex justify-between items-center">
            <Link to="/profile">
              <UserProfile hideText={false} />
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;