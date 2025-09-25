// 文件路径: src/app/page.tsx (已重构)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Toaster } from 'react-hot-toast'; // 引入通知容器
import WalletButton from '@/components/WalletButton';
import PostForm from '@/components/PostForm';
import PostCard from '@/components/PostCard';
import { Loader2 } from 'lucide-react';

// --- 类型定义区 ---
interface Post {
  id: number;
  author_address: string;
  content: string;
  post_type: 'web2' | 'web3';
  tx_hash: string | null;
  created_at: string;
}
interface ApiSuccessResponse {
  posts: Post[];
}

declare global {
  interface Window {
    ethereum: ethers.Eip1193Provider;
  }
}

// --- 主页组件 ---
export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 连接钱包
  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert("请安装MetaMask钱包插件！");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } catch (err) {
      console.error("连接钱包失败:", err);
    }
  }, []);

  // 2. 获取帖子列表
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/posts');
      const data: ApiSuccessResponse = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("获取帖子失败:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 页面加载时自动获取一次帖子
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <>
      {/* 全局通知的容器，放在最外层 */}
      <Toaster position="top-center" reverseOrder={false} toastOptions={{
        className: '',
        style: {
          background: '#333',
          color: '#fff',
        },
      }}/>
      
      <div className="container mx-auto max-w-3xl p-4 md:p-8 text-white min-h-screen">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-cyan-400">QuantDAO</h1>
            <p className="text-gray-400 mt-1">一个去中心化身份的投研社区</p>
          </div>
          <WalletButton account={account} connectWallet={connectWallet} />
        </header>

        <main>
          <PostForm account={account} refreshPosts={fetchPosts} />

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
                <p>连接钱包，成为第一位思想分享者吧！</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}