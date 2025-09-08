import { useState, useEffect } from 'react';
import { Settings, Globe, TestTube } from 'lucide-react';
import { auth } from '../firebase';

interface EnvironmentSelectorProps {
  onEnvironmentChange: (environment: 'production' | 'test') => void;
}

const EnvironmentSelector = ({ onEnvironmentChange }: EnvironmentSelectorProps) => {
  const [environment, setEnvironment] = useState<'production' | 'test'>('production');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show for daniel.mendes@dataholics.io
    if (auth.currentUser?.email === 'daniel.mendes@dataholics.io') {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    // Load saved environment from localStorage
    const savedEnvironment = localStorage.getItem('webhook-environment') as 'production' | 'test';
    if (savedEnvironment) {
      setEnvironment(savedEnvironment);
      onEnvironmentChange(savedEnvironment);
    }
  }, [onEnvironmentChange]);

  const handleToggle = () => {
    const newEnvironment = environment === 'production' ? 'test' : 'production';
    setEnvironment(newEnvironment);
    localStorage.setItem('webhook-environment', newEnvironment);
    onEnvironmentChange(newEnvironment);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <Settings size={16} className="text-gray-400" />
          <span className="text-sm text-gray-300">Webhook:</span>
          
          {/* Apple-style toggle switch */}
          <div className="relative">
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                environment === 'production' ? 'bg-green-600' : 'bg-blue-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  environment === 'production' ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {environment === 'production' ? (
              <>
                <Globe size={16} className="text-green-400" />
                <span className="text-sm font-medium text-green-400">Produção</span>
              </>
            ) : (
              <>
                <TestTube size={16} className="text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Teste</span>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          {environment === 'production' 
            ? 'n8n.genoiapp.com/webhook/production'
            : 'n8n.genoiapp.com/webhook-test/production'
          }
        </div>
      </div>
    </div>
  );
};

export default EnvironmentSelector;