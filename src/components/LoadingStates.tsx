import { useState, useEffect } from 'react';
import { Brain, Rocket, Search, Code, ListChecks, Target } from 'lucide-react';
import { useTranslation } from '../utils/i18n';

const LoadingStates = () => {
  const { t } = useTranslation();
  const [currentState, setCurrentState] = useState(0);

  const loadingStates = [
    {
      icon: Brain,
      text: t.searchingStartups,
      color: 'text-blue-400'
    },
    {
      icon: ListChecks,
      text: t.qualifyingStartups,
      color: 'text-purple-400'
    },
    {
      icon: Search,
      text: t.researchingMarket,
      color: 'text-green-400'
    },
    {
      icon: Target,
      text: t.selectingFinalStartups,
      color: 'text-yellow-400'
    },
    {
      icon: Code,
      text: t.creatingPOCsForChallenge,
      color: 'text-pink-400'
    },
    {
      icon: Rocket,
      text: t.finalizingStartupList,
      color: 'text-emerald-400'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentState((prev) => (prev + 1) % loadingStates.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [loadingStates.length]);

  const CurrentIcon = loadingStates[currentState].icon;

  return (
    <div className="flex items-center gap-4 bg-gray-800/50 p-6 rounded-lg transform transition-all duration-500 animate-fade-in">
      <CurrentIcon 
        className={`w-8 h-8 ${loadingStates[currentState].color} animate-pulse transform transition-all duration-500 scale-110`} 
      />
      <span className="text-lg text-gray-300 animate-fade-in transition-all duration-500">
        {loadingStates[currentState].text}
      </span>
    </div>
  );
};

export { LoadingStates };