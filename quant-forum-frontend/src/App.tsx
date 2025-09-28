import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// 1. 导入我们创建的全局 Context Provider 和 hook
import { SettingsProvider, useSettings } from './SettingsContext';

// 2. 导入所有需要的组件、页面和统一的类型
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginModal from './components/LoginModal';
import KycModal from './components/KycModal';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage'; // 确保导入了设置页面
import { type User, type Post } from './types'; // 从 types.ts 导入

// --- 全局配置项 ---
const API_BASE_URL = "https://quant-api-worker.TongWX5877.workers.dev";
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;


/**
 * AppContent 组件
 * 这个组件包含了应用的所有核心UI和业务逻辑。
 * 它在 SettingsProvider 内部被渲染，因此可以安全地使用 useSettings hook。
 */
function AppContent() {
  // 从全局 Context 中获取设置，用于动态应用主题和字体
  const { settings } = useSettings();

  // --- 所有应用级别的 State 都放在这里 ---
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isKycModalOpen, setKycModalOpen] = useState(false);

  // --- 数据获取与业务逻辑函数 ---

  // 从后端获取所有帖子
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts`);
      if (!response.ok) throw new Error(`服务器错误: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setPosts([...data.posts]); // 使用新数组强制刷新
      } else {
        throw new Error(data.error || "获取帖子失败");
      }
    } catch (error) {
      console.error("无法加载帖子:", error);
      alert("网络错误，无法加载帖子列表。");
    } finally {
      setIsLoading(false);
    }
  };

  // 在组件首次挂载时，从本地存储恢复用户并加载帖子
  useEffect(() => {
    const storedUser = localStorage.getItem('quant-forum-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchPosts();
  }, []); // 空依赖数组确保只运行一次

  // 登录成功后的回调
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('quant-forum-user', JSON.stringify(loggedInUser));
    setLoginModalOpen(false);
  };

  // 登出
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('quant-forum-user');
  };

  // 生成钱包后的回调
  const handleWalletGenerated = (newAddress: string) => {
    if (user) {
      const updatedUser = { ...user, public_address: newAddress };
      setUser(updatedUser);
      localStorage.setItem('quant-forum-user', JSON.stringify(updatedUser));
    }
    setKycModalOpen(false);
    alert('钱包已就绪！现在请重新点击“发布”来完成NFT的铸造。');
  };

  // 提交新帖子（普通或NFT）
  const handlePostSubmit = async (content: string, isNft: boolean) => {
    if (!user) return;

    try {
      if (isNft) {
        // --- NFT 铸造流程 ---
        if (!user.public_address) {
          setKycModalOpen(true);
          return;
        }
        
        const file = new Blob([content], { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', file, 'post.txt');
        const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${PINATA_JWT}` },
          body: formData,
        });
        const pinataData = await pinataRes.json();
        if (!pinataData.IpfsHash) throw new Error('上传到IPFS失败');
        
        const mintRes = await fetch(`${API_BASE_URL}/api/mint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, content, ipfsCid: pinataData.IpfsHash }),
        });
        const mintData = await mintRes.json();
        if (!mintData.success) throw new Error(mintData.error);
        
        alert(`铸造成功! 交易哈希: ${mintData.transactionHash}`);

      } else {
        // --- 普通帖子发布流程 ---
        const response = await fetch(`${API_BASE_URL}/api/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, content }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
      }
      
      // [核心] 无论操作是否成功，都从服务器重新拉取最新列表，保证数据一致性
      await fetchPosts();

    } catch (error: any) {
      console.error("提交失败:", error);
      alert(`操作失败: ${error.message}`);
    }
  };

  // --- 渲染UI ---
  return (
    // 将从Context获取的设置动态应用为CSS类名
    <div className={`app theme-${settings.theme} font-size-${settings.fontSize}`}>
      <Navbar
        user={user}
        onLoginClick={() => setLoginModalOpen(true)}
        onLogoutClick={handleLogout}
      />
      <div className="app-container">
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<HomePage user={user} posts={posts} isLoading={isLoading} handlePostSubmit={handlePostSubmit} />}
            />
            <Route path="/profile" element={<ProfilePage user={user} />} />
            <Route path="/about" element={<AboutPage />} />
            {/* [核心] 设置页面的路由，现在可以被正确渲染了 */}
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <Sidebar user={user} />
      </div>

      {/* 全局模态框 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        apiUrl={API_BASE_URL}
      />
      {user && (
        <KycModal
          isOpen={isKycModalOpen}
          onClose={() => setKycModalOpen(false)}
          onWalletGenerated={handleWalletGenerated}
          apiUrl={API_BASE_URL}
          userId={user.id}
        />
      )}
    </div>
  );
}

/**
 * App 组件 (顶层)
 * 它的唯一职责就是渲染 SettingsProvider，为整个应用提供全局设置。
 */
function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;