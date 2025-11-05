import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'en-sw' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.log': 'Log Tasks',
    'nav.history': 'History',
    'nav.logout': 'Logout',
    
    // Categories
    'category.kuoga': 'Bathing',
    'category.kufua': 'Laundry',
    'category.kusafisha': 'Cleaning',
    'category.kupika': 'Cooking',
    
    // Common
    'common.points': 'Points',
    'common.today': 'Today',
    'common.total': 'Total',
    'common.simple': 'Simple Mode',
    'common.advanced': 'Advanced Mode',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.select_date': 'Select Date',
    
    // Tasks
    'task.completed': 'Task completed!',
    'task.uncompleted': 'Task uncompleted',
  },
  'en-sw': {
    'nav.dashboard': 'Dashboard',
    'nav.log': 'Log Tasks',
    'nav.history': 'History',
    'nav.logout': 'Logout',
    
    'category.kuoga': 'Kuoga (Bathing)',
    'category.kufua': 'Kufua (Laundry)',
    'category.kusafisha': 'Kusafisha (Cleaning)',
    'category.kupika': 'Kupika (Cooking)',
    
    'common.points': 'Pointi',
    'common.today': 'Leo',
    'common.total': 'Jumla',
    'common.simple': 'Rahisi Mode',
    'common.advanced': 'Advanced Mode',
    'common.save': 'Hifadhi',
    'common.cancel': 'Ghairi',
    'common.select_date': 'Chagua Tarehe',
    
    'task.completed': 'Kazi imekamilika!',
    'task.uncompleted': 'Kazi haijafanywa',
  },
  sw: {
    'nav.dashboard': 'Dashibodi',
    'nav.log': 'Rekodi Kazi',
    'nav.history': 'Historia',
    'nav.logout': 'Toka',
    
    'category.kuoga': 'Kuoga',
    'category.kufua': 'Kufua',
    'category.kusafisha': 'Kusafisha',
    'category.kupika': 'Kupika',
    
    'common.points': 'Pointi',
    'common.today': 'Leo',
    'common.total': 'Jumla',
    'common.simple': 'Rahisi',
    'common.advanced': 'Ya Kina',
    'common.save': 'Hifadhi',
    'common.cancel': 'Ghairi',
    'common.select_date': 'Chagua Tarehe',
    
    'task.completed': 'Kazi imekamilika!',
    'task.uncompleted': 'Kazi haijafanywa',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('fourk-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('fourk-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
