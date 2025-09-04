import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { format, addDays } from 'date-fns';
import { ptBR, enUS, fr, de, it } from 'date-fns/locale';
import { useTranslation } from '../utils/i18n';

interface TokenUsageChartProps {
  totalTokens: number;
  usedTokens: number;
}

const TokenUsageChart = ({ totalTokens, usedTokens }: TokenUsageChartProps) => {
  const { t, language } = useTranslation();
  const [renewalDate, setRenewalDate] = useState<Date | null>(null);
  const percentage = Math.min((usedTokens / totalTokens) * 100, 100);
  const remainingTokens = totalTokens - usedTokens;

  const getLocale = () => {
    switch (language) {
      case 'pt': return ptBR;
      case 'fr': return fr;
      case 'de': return de;
      case 'it': return it;
      default: return enUS;
    }
  };

  useEffect(() => {
    const fetchRenewalDate = async () => {
      if (!auth.currentUser) return;
      
      try {
        const tokenDoc = await getDoc(doc(db, 'tokenUsage', auth.currentUser.uid));
        if (tokenDoc.exists()) {
          const lastUpdated = new Date(tokenDoc.data().lastUpdated);
          setRenewalDate(addDays(lastUpdated, 30));
        }
      } catch (error) {
        console.error('Error fetching renewal date:', error);
      }
    };

    fetchRenewalDate();
  }, []);

  const getFormattedRenewalDate = () => {
    if (!renewalDate) return null;
    
    switch (language) {
      case 'pt':
        return format(renewalDate, "dd 'de' MMMM", { locale: ptBR });
      case 'fr':
        return format(renewalDate, "dd MMMM", { locale: fr });
      case 'de':
        return format(renewalDate, "dd. MMMM", { locale: de });
      case 'it':
        return format(renewalDate, "dd MMMM", { locale: it });
      default:
        return format(renewalDate, "MMMM dd", { locale: enUS });
    }
  };

  const formattedRenewalDate = getFormattedRenewalDate();

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{t.tokenUsage || 'Uso de Tokens'}</span>
        <span className="text-sm text-blue-400">{remainingTokens} {t.remaining || 'restantes'}</span>
      </div>
      
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${100 - percentage}%` }}
        />
      </div>

      {formattedRenewalDate && (
        <div className="mt-2 text-xs text-gray-500">
          {t.renewalOn || 'Renovação em'} {formattedRenewalDate}
        </div>
      )}

      <Link 
        to="/plans" 
        className="mt-3 block text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        {t.upgradePlan || 'Atualizar plano'}
      </Link>
    </div>
  );
};

export default TokenUsageChart;