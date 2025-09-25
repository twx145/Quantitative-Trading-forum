// 文件路径: src/app/page.tsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import PostForm from '@/components/PostForm';
import PostCard from '@/components/PostCard';
import AuthModal from '@/components/AuthModal'; // 新的认证弹窗组件
import { Loader2, LogOut } from 'lucide-react';

// --- 类型定义区 ---
interface Post {
  id: number;
  author_address: string;
  content: string;
  post_type: 'web2' | 'web3';
  tx_hash: string | null;
  created_at: string;
}

interface User {
  phoneNumber: string;
  walletAddress: string;
}

interface ApiSuccessResponse {
  posts: Post[];
}

// --- 主页组件 ---
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 获取帖子列表的函数，使用useCallback优化性能
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('获取帖子列表失败');
      }
      const data: ApiSuccessResponse = await response.json();
      setPosts(data.posts || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      toast.error(errorMessage);
      console.error("获取帖子失败:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 在页面加载时，检查本地登录状态并获取帖子
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    fetchPosts();
  }, [fetchPosts]);

  // 处理退出登录
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    toast.success('您已成功退出登录');
  };

  return (
    <>
      {/* 全局通知的容器，放在最外层 */}
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
          style: { background: '#27272a', color: '#fff', border: '1px solid #3f3f46' },
        }}
      />
      
      {/* 登录/注册弹窗，根据状态决定是否显示 */}
      {isAuthModalOpen && <AuthModal setUser={setUser} closeModal={() => setIsAuthModalOpen(false)} />}
      
      <div className="container mx-auto max-w-3xl p-4 md:p-8 text-white min-h-screen">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-cyan-400">QuantDAO</h1>
            <p className="text-gray-400 mt-1">一个属于思想者的Web3社区</p>
          </div>
          {user ? (
            <div className='flex items-center space-x-4'>
              <div className="text-right text-sm">
                <p className="text-gray-400 font-mono">{user.phoneNumber}</p>
                <p className="text-cyan-400 font-mono" title={user.walletAddress}>
                  {`${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 4)}`}
                </p>
              </div>
              <button onClick={handleLogout} title="退出登录" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition">
                <LogOut className='w-5 h-5 text-gray-400'/>
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition">
              注册 / 登录
            </button>
          )}
        </header>

        <main>
          {user ? (
            <PostForm refreshPosts={fetchPosts} />
          ) : (
            <div className="text-center py-10 bg-gray-800/50 border border-gray-700 rounded-lg">
              <p className="text-gray-400">请<button onClick={() => setIsAuthModalOpen(true)} className="text-cyan-400 hover:underline font-bold mx-1">登录或注册</button>后分享您的研究成果。</p>
            </div>
          )}
          
          <div className="border-t border-gray-800 my-10"></div>

          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                <span className="ml-4 text-gray-400">正在加载研究列表...</span>
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p>社区还没有任何研究成果。</p>
                <p>成为第一位思想分享者吧！</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}