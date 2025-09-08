import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { initializeLanguage } from './utils/i18n';
import { needsLoginVerification, clearVerificationState } from './utils/verificationStateManager';
import Layout from './components/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import UserManagement from './components/UserProfile/UserManagement';
import NewChallenge from './components/NewChallenge';
import AccountDeleted from './components/AccountDeleted';
import StartupList from './components/StartupList';
import SavedStartups from './components/SavedStartups';
import AdminInterface from './components/admin/AdminInterface';
import SudoAdminInterface from './components/admin/SudoAdminInterface';
import TokenRegister from './components/auth/TokenRegister';
import SlugRegister from './components/auth/SlugRegister';
import PublicChallenge from './components/PublicChallenge';
import LoginVerification from './components/auth/LoginVerification';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [languageInitialized, setLanguageInitialized] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

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
            setNeedsVerification(false);
            clearVerificationState(user.uid);
          } else {
            setUser(user);
            // Check if user needs verification based on time and session
            const needsVerification = needsLoginVerification(user.uid);
            setNeedsVerification(needsVerification);
            
            console.log(`🔐 Verificação de login necessária: ${needsVerification ? 'SIM' : 'NÃO'}`);
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          setUser(user);
          // On error, require verification to be safe
          setNeedsVerification(true);
        }
      } else {
        setUser(null);
        setNeedsVerification(false);
        // Clear verification state on logout
        if (user) {
          clearVerificationState(user.uid);
        }
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
        {/* Authentication Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
        <Route path="/register/:token" element={!user ? <TokenRegister /> : <Navigate to="/" replace />} />
        <Route path="/invite/:slug" element={!user ? <SlugRegister /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" replace />} />
        <Route path="/challenge/:slug" element={<PublicChallenge />} />
        
        {/* Login Verification Route - Required for all authenticated users */}
        <Route 
          path="/verify-login" 
          element={
            user && needsVerification ? (
              <LoginVerification />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/profile" 
          element={
            user ? (
              needsVerification ? <Navigate to="/verify-login" replace /> : <UserManagement />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/new-challenge" 
          element={
            user ? (
              needsVerification ? <Navigate to="/verify-login" replace /> : <NewChallenge />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/startups" 
          element={
            user ? (
              needsVerification ? <Navigate to="/verify-login" replace /> : <StartupList />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/saved-startups" 
          element={
            user ? (
              needsVerification ? <Navigate to="/verify-login" replace /> : <SavedStartups />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="/account-deleted" element={<AccountDeleted />} />
        
        {/* Admin Route - Only for contact@dataholics.io */}
        <Route 
          path="/admin" 
          element={
            user ? (
              user?.email === 'contact@dataholics.io' ? (
                needsVerification ? <Navigate to="/verify-login" replace /> : <AdminInterface />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Sudo Admin Route - Only for daniel.mendes@dataholics.io */}
        <Route 
          path="/sudo-admin" 
          element={
            user ? (
              user?.email === 'daniel.mendes@dataholics.io' ? (
                needsVerification ? <Navigate to="/verify-login" replace /> : <SudoAdminInterface />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Default Route */}
        <Route path="/" element={
          user ? (
            needsVerification ? <Navigate to="/verify-login" replace /> : <Layout />
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