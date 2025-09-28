import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // 加载翻译文件的后端
  .use(HttpBackend)
  // 自动检测用户语言
  .use(LanguageDetector)
  // 将i18n实例传递给react-i18next
  .use(initReactI18next)
  // 初始化i18next
  .init({
    // 支持的语言
    supportedLngs: ['en', 'zh-CN'],
    // 如果用户语言的翻译不存在，则使用的默认语言
    fallbackLng: 'en',
    // 默认命名空间
    defaultNS: 'translation',
    // 配置语言检测器
    detection: {
      // 检测顺序
      order: ['localStorage', 'navigator', 'htmlTag'],
      // 在localStorage中存储语言的键
      caches: ['localStorage'],
      lookupLocalStorage: 'quantforum-i18next-lng', // 避免与设置冲突
    },
    // 为React配置
    react: {
      // 使用Suspense来处理加载
      useSuspense: true,
    },
    // 调试模式 (在生产环境中应设置为false)
    debug: true, 
  });

export default i18n;