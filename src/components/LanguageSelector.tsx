import { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useTranslation } from '../utils/i18n';

const LanguageSelector = () => {
  const { t, language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'pt', name: t.portuguese, flag: '🇧🇷' },
    { code: 'en', name: t.english, flag: '🇺🇸' },
    { code: 'fr', name: t.french, flag: '🇫🇷' },
    { code: 'de', name: t.german, flag: '🇩🇪' },
    { code: 'it', name: t.italian, flag: '🇮🇹' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full p-3 text-gray-300 hover:bg-gray-900 hover:text-white rounded-lg transition-all"
      >
        <Globe size={16} className="text-gray-500" />
        <span className="flex-1 text-left text-sm">{currentLanguage?.flag} {currentLanguage?.name}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex items-center gap-3 w-full p-3 text-left hover:bg-gray-700 transition-colors ${
                language === lang.code ? 'bg-gray-700 text-white' : 'text-gray-300'
              } first:rounded-t-lg last:rounded-b-lg`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;