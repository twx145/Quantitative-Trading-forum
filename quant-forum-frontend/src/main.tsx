import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import './utils/i18n.ts'; // 导入并运行i18next的配置

// 创建一个与你的主题匹配的加载组件
const ThemedSuspenseFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#1a0f2a', // 你的午夜紫背景色
  }}>
    <div className="spinner"></div> {/* 复用你的spinner样式 */}
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<ThemedSuspenseFallback />}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Suspense>
  </StrictMode>,
);