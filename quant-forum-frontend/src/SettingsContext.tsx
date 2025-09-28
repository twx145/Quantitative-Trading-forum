import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// 1. 定义设置的类型
type FontSize = 'small' | 'medium' | 'large';
type Theme = 'stars' | 'light' | 'dark';

export interface Settings {
  language: string;
  fontSize: FontSize;
  theme: Theme;
}

// 2. 定义Context值的类型
interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

// 3. 创建Context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// 4. 创建Provider组件，这是所有魔法发生的地方
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();

  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const savedSettings = localStorage.getItem('quantforum-settings');
      const defaults = { language: 'zh-CN', fontSize: 'medium', theme: 'stars' };
      return savedSettings ? { ...defaults, ...JSON.parse(savedSettings) } : defaults;
    } catch {
      return { language: 'zh-CN', fontSize: 'medium', theme: 'stars' };
    }
  });

  useEffect(() => {
    // 同步Context的语言设置到i18next
    if (settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
    }
    // 将设置保存到本地存储
    localStorage.setItem('quantforum-settings', JSON.stringify(settings));
  }, [settings, i18n]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

// 5. 创建自定义钩子，方便组件使用
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings 必须在 SettingsProvider 内部使用');
  }
  return context;
};