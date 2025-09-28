import React from 'react';
import { FiMonitor, FiType, FiGlobe } from 'react-icons/fi';
import { useSettings } from '../SettingsContext';
import { useTranslation } from 'react-i18next'; // 导入钩子

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation(); // 使用 t 函数

  return (
    <div className="card settings-page-layout">
      {/* --- Language Section --- */}
      <div className="setting-section">
        <div className="setting-header">
          <FiGlobe />
          <h3>{t('settings.language_label')}</h3>
        </div>
        <div className="setting-options">
          <button
            className={`button ${settings.language === 'zh-CN' ? '' : 'button-outline'}`}
            onClick={() => updateSettings({ language: 'zh-CN' })}
          >
            简体中文
          </button>
          <button
            className={`button ${settings.language === 'en' ? '' : 'button-outline'}`}
            onClick={() => updateSettings({ language: 'en' })}
          >
            English
          </button>
        </div>
      </div>

      {/* --- Font Size Section --- */}
      <div className="setting-section">
        <div className="setting-header">
          <FiType />
          <h3>{t('settings.fontsize_label')}</h3>
        </div>
        <div className="setting-options">
          <button className={`button ${settings.fontSize === 'small' ? '' : 'button-outline'}`} onClick={() => updateSettings({ fontSize: 'small' })} > {t('settings.fonts.small')} </button>
          <button className={`button ${settings.fontSize === 'medium' ? '' : 'button-outline'}`} onClick={() => updateSettings({ fontSize: 'medium' })} > {t('settings.fonts.medium')} </button>
          <button className={`button ${settings.fontSize === 'large' ? '' : 'button-outline'}`} onClick={() => updateSettings({ fontSize: 'large' })} > {t('settings.fonts.large')} </button>
        </div>
      </div>

      {/* --- Theme Section --- */}
      <div className="setting-section">
        <div className="setting-header">
          <FiMonitor />
          <h3>{t('settings.theme_label')}</h3>
        </div>
        <div className="setting-options">
          <button className={`button ${settings.theme === 'stars' ? '' : 'button-outline'}`} onClick={() => updateSettings({ theme: 'stars' })} > {t('settings.themes.stars')} </button>
          <button className={`button ${settings.theme === 'dark' ? '' : 'button-outline'}`} onClick={() => updateSettings({ theme: 'dark' })} > {t('settings.themes.dark')} </button>
          <button className={`button ${settings.theme === 'light' ? '' : 'button-outline'}`} onClick={() => updateSettings({ theme: 'light' })} > {t('settings.themes.light')} </button>
        </div>
      </div>
    </div>
  );
};


export default SettingsPage;