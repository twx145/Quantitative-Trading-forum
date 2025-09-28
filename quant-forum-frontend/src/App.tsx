import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// 导入所有需要的组件
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginModal from './components/LoginModal';
import KycModal from './components/KycModal'; // 引入新的KYC模态框
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';



// --- 配置项 ---
// !! 确保这个地址是你部署的后端Worker地址 !!
const API_BASE_URL = "https://quant-api-worker.TongWX5877.workers.dev";
// 从环境变量中读取Pinata JWT
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;


// --- 更新数据类型以包含Web3字段 ---
interface User {
  id: number;
  public_address: string | null; // 用户可能没有钱包地址
}

interface Post {
  id: number;
  content: string;
  created_at: string;
  author_phone: string;
  is_nft: number; // 0 或 1
  ipfs_cid: string | null;
  transaction_hash: string | null;
}


function App() {
  // --- State 管理 ---
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isKycModalOpen, setKycModalOpen] = useState(false);

  // --- 数据获取 ---
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts`);
      const data = await response.json();
      setPosts(data.success ? data.posts : []);
    } catch (error) {
      console.error("无法加载帖子:", error);
      alert("网络错误，无法加载帖子列表。");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    // 页面加载时，尝试从本地存储恢复用户信息并获取帖子
    const storedUser = localStorage.getItem('quant-forum-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchPosts();
  }, []);

  // --- 事件处理函数 ---
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('quant-forum-user', JSON.stringify(loggedInUser));
    setLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('quant-forum-user');
  };

  const handlePostSubmit = async (content: string, isNft: boolean) => {
    if (!user) return;

    // 分支逻辑: 判断是发布普通帖子还是铸造NFT
    if (isNft) {
      // --- NFT 铸造流程 ---
      // 1. 检查用户是否有钱包地址
      if (!user.public_address) {
        setKycModalOpen(true); // 如果没有，弹出KYC模态框让用户生成
        return; // 中断发布流程
      }

      // 2. 如果有钱包，开始铸造
      try {
        // Step A: 上传内容到 Pinata (IPFS)
        const file = new Blob([content], { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', file, 'post.txt');

        const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${PINATA_JWT}` },
          body: formData,
        });
        const pinataData = await pinataRes.json();
        if (!pinataData.IpfsHash) throw new Error('上传到IPFS失败，请检查Pinata密钥');

        // Step B: 调用后端 /api/mint 接口进行铸造
        const mintRes = await fetch(`${API_BASE_URL}/api/mint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, content, ipfsCid: pinataData.IpfsHash }),
        });
        const mintData = await mintRes.json();

        if (mintData.success) {
          alert(`铸造成功! 交易哈希: ${mintData.transactionHash}`);
          await fetchPosts(); // 刷新帖子列表
        } else {
          throw new Error(mintData.error);
        }
      } catch (error: any) {
        console.error("铸造失败:", error);
        alert(`铸造失败: ${error.message}`);
      }

    } else {
      // --- 普通帖子发布流程 ---
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, content }),
        });
        const data = await response.json();
        if (data.success) {
          await fetchPosts(); // 成功后刷新列表
        } else {
          throw new Error(data.error);
        }
      } catch (error: any) {
        console.error("发布帖子失败:", error);
        alert('网络错误，无法发布: ' + error.message);
      }
    }
  };

  // 当KYC模态框成功生成钱包后被调用
  const handleWalletGenerated = (newAddress: string) => {
    if (user) {
      // 更新前端的user state，添加新的钱包地址
      const updatedUser = { ...user, public_address: newAddress };
      setUser(updatedUser);
      // 同时更新本地存储，以便刷新页面后状态依然存在
      localStorage.setItem('quant-forum-user', JSON.stringify(updatedUser));
    }
    setKycModalOpen(false); // 关闭模态框
    alert('钱包已就绪！现在请重新点击“发布”来完成NFT的铸造。');
  };

  // --- 渲染JSX ---
  return (
    <div className="app">
      {/* 导航栏现在是共享布局的一部分，始终显示 */}
      <Navbar
        user={user}
        onLoginClick={() => setLoginModalOpen(true)}
        onLogoutClick={handleLogout}
      />

      {/* 主内容区 */}
      <div className="app-container">
        <main className="main-content">
          {/* Routes组件会根据URL匹配并渲染对应的Route */}
          <Routes>
            <Route
              path="/"
              element={<HomePage user={user} posts={posts} isLoading={isLoading} handlePostSubmit={handlePostSubmit} />}
            />
            <Route path="/profile" element={<ProfilePage user={user} />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        
        {/* 侧边栏也是共享布局的一部分 */}
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

export default App;