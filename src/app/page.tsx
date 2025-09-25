// 文件路径: src/app/page.tsx (已修复)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import PostForm from '@/components/PostForm';
import PostCard from '@/components/PostCard';
import AuthModal from '@/components/AuthModal';
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
interface User { phoneNumber: string; walletAddress: string; }
interface ApiSuccessResponse { posts: Post[]; }


// --- 主页组件 ---
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/posts');
      const data: ApiSuccessResponse = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("获取帖子失败:", err);
      toast.error("无法加载帖子列表");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        // 如果本地数据格式错误，则清除
        localStorage.clear();
      }
    }
    fetchPosts();
  }, [fetchPosts]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    toast.success('您已成功退出登录');
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{
        style: { background: '#333', color: '#fff' },
      }}/>
      
      {/* 关键修复点：确保AuthModal在主逻辑之外，避免嵌套 */}
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
                <p className="text-gray-400 font-mono" title={user.phoneNumber}>欢迎您</p>
                <p className="text-cyan-400 font-mono" title={user.walletAddress}>{`${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 4)}`}</p>
              </div>
              <button onClick={handleLogout} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition" title="退出登录"><LogOut className='w-5 h-5'/></button>
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg">
              注册 / 登录
            </button>
          )}
        </header>

        <main>
          {user ? <PostForm user={user} refreshPosts={fetchPosts} /> : (
            <div className="text-center py-10 bg-gray-800 rounded-lg">
              <p className="text-gray-400">请<button onClick={() => setIsAuthModalOpen(true)} className="text-cyan-400 underline mx-1 font-semibold">登录或注册</button>后分享您的研究成果。</p>
            </div>
          )}
          
          <div className="mt-10">
            <h3 className="text-2xl font-semibold mb-6 border-l-4 border-cyan-500 pl-4">社区最新研究</h3>
            <div className="space-y-6">
              {isLoading ? (
                 <div className="flex justify-center items-center py-10">
                   <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                 </div>
              ) : posts.length > 0 ? (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>社区还没有任何研究成果。</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}