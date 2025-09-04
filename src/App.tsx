import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { initializeLanguage } from './utils/i18n';
import Layout from './components/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import UserManagement from './components/UserProfile/UserManagement';
import NewChallenge from './components/NewChallenge';
import Plans from './components/Plans';
import EmailVerification from './components/auth/EmailVerification';
import AccountDeleted from './components/AccountDeleted';
import StartupList from './components/StartupList';
import SavedStartups from './components/SavedStartups';
import StartupInteractionTimeline from './components/StartupInteractionTimeline';
import ContactManagement from './components/ContactManagement';
import MessageComposer from './components/MessageComposer';
import PublicChallenge from './components/PublicChallenge';
import AdminInterface from './components/admin/AdminInterface';
import JediSuccess from './pages/plans/success/jedi';
import MestreJediSuccess from './pages/plans/success/mestrejedi';
import MestreYodaSuccess from './pages/plans/success/mestreyoda';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [languageInitialized, setLanguageInitialized] = useState(false);

  useEffect(() => {
    // Initialize language detection
    const initLang = async () => {
      try {
        await initializeLanguage();
      } catch (error) {
        console.error('Language initialization failed:', error);
      } finally {
        setLanguageInitialized(true);
      }
    };

    initLang();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().disabled) {
            await signOut(auth);
            setUser(null);
          } else {
            setUser(user);
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading || !languageInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Challenge Route - No authentication required */}
        <Route path="/desafio/:slug" element={<PublicChallenge />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" replace />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        
        {/* Protected Routes */}
        <Route path="/profile" element={user?.emailVerified ? <UserManagement /> : <Navigate to="/verify-email" replace />} />
        <Route path="/new-challenge" element={user?.emailVerified ? <NewChallenge /> : <Navigate to="/verify-email" replace />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/startups" element={user?.emailVerified ? <StartupList /> : <Navigate to="/verify-email" replace />} />
        <Route path="/saved-startups" element={user?.emailVerified ? <SavedStartups /> : <Navigate to="/verify-email" replace />} />
        <Route 
          path="/startup/:startupId/timeline" 
          element={
            user?.emailVerified ? (
              <StartupInteractionTimeline onBack={() => window.history.back()} />
            ) : (
              <Navigate to="/verify-email" replace />
            )
          } 
        />
        <Route path="/startup/:startupId/contacts" element={user?.emailVerified ? <ContactManagement /> : <Navigate to="/verify-email" replace />} />
        <Route path="/startup/:startupId/message" element={user?.emailVerified ? <MessageComposer /> : <Navigate to="/verify-email" replace />} />
        <Route path="/account-deleted" element={<AccountDeleted />} />
        <Route path="/plans/success/jedi" element={<JediSuccess />} />
        <Route path="/plans/success/mestrejedi" element={<MestreJediSuccess />} />
        <Route path="/plans/success/mestreyoda" element={<MestreYodaSuccess />} />
        
        {/* Admin Route - Only for contact@dataholics.io */}
        <Route 
          path="/admin" 
          element={
            user?.emailVerified && user?.email === 'contact@dataholics.io' ? (
              <AdminInterface />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Default Route */}
        <Route path="/" element={
          user ? (
            user.emailVerified ? (
              <Layout />
            ) : (
              <Navigate to="/verify-email" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;