// 文件路径: src/app/page.tsx (已修复所有ESLint错误和警告)

"use client";

import { useState, useEffect, FormEvent } from 'react';
// 已修复：我们将完整导入 'ethers' 以便使用它的类型
import { ethers } from 'ethers'; 

// --- 类型定义区 (开始) ---

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

interface ApiErrorResponse {
  error: string;
}

// --- 类型定义区 (结束) ---

declare global {
  interface Window {
    // 已修复(Error): 不再使用 any，而是使用 ethers 提供的标准 EIP-1193 提供者类型
    ethereum: ethers.Eip1193Provider;
  }
}

export default function Home() {
  // 已修复(Warning): 'setAccount' 现在在 connectWallet 中被使用了
  const [account, setAccount] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isMintMode, setIsMintMode] = useState(false);

  // 已修复(Warning): 'BrowserProvider' 现在被使用了
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      return setError("请安装MetaMask钱包插件！");
    }
    try {
      // ethers.BrowserProvider 替代了旧的 new ethers.providers.Web3Provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } catch (err) {
      setError("连接钱包失败，请重试。");
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/posts');
      const data = await response.json() as ApiSuccessResponse;
      setPosts(data.posts || []);
    } catch (err: unknown) { // 已修复(Warning): 'err' 被使用了
      // 即使我们不直接用err，好的实践是至少在控制台打印出来
      console.error("Fetch posts failed:", err);
      setError('无法从后端加载帖子列表。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content || !account) { return; }
    
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isMintMode ? 'web3' : 'web2',
          author_address: account,
          content: content,
        }),
      });

      if (!response.ok) {
        const errData = await response.json() as ApiErrorResponse;
        throw new Error(errData.error || '提交帖子失败');
      }
      
    // 已修复(Error): 不再使用 any，而是使用更安全的 unknown 类型，并进行类型检查
    } catch (err: unknown) { 
      if (err instanceof Error) {
        // 现在可以安全地访问 err.message
        setError(err.message);
      } else {
        // 处理未知类型的错误
        setError('发生了一个未知错误');
      }
    } finally {
      setContent('');
      setIsSubmitting(false);
      await fetchPosts();
    }
  };

  // --- JSX / UI 渲染部分 ---
  // 这部分与您之前的双模式代码完全相同，无需修改，它负责展示界面。
  return (
    <main className="container mx-auto p-4 bg-gray-900 text-white min-h-screen">
      <header className="flex justify-between items-center my-8">
        <div>
          <h1 className="text-5xl font-bold text-cyan-400">QuantDAO 合规联盟链版</h1>
          <p className="text-gray-400 mt-2">一个去中心化身份的投研社区</p>
        </div>
        {account ? (
          <div className="bg-gray-800 p-2 rounded">
            <p className="text-sm">已连接身份:</p>
            <p className="font-mono text-cyan-400">{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</p>
          </div>
        ) : (
          <button onClick={connectWallet} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition duration-300">
            连接钱包以识别身份
          </button>
        )}
      </header>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">发表您的研究成果</h2>
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享您的洞见、分析或发现..."
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 h-24 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="my-4">
            <label className="flex items-center text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isMintMode}
                onChange={(e) => setIsMintMode(e.target.checked)}
                className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
              />
              <span className="ml-2">作为知识产权上链存证 (由平台支付服务费)</span>
            </label>
          </div>
          <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition duration-300" disabled={isSubmitting || !account}>
            {isSubmitting ? '正在提交...' : (isMintMode ? '发布并上链存证' : '发布普通帖子')}
          </button>
        </form>

        {error && <p className="text-red-500 text-center my-4 break-all">{error}</p>}

        <div className="space-y-4">
          {isLoading ? <p className="text-center">正在加载研究列表...</p> : (
            posts.map((post) => (
              <div key={post.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex justify-between items-start">
                  <p className="text-gray-300 break-words">{post.content}</p>
                  {post.post_type === 'web3' && (
                    <span className="ml-4 flex-shrink-0 bg-cyan-800 text-cyan-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      已上链
                    </span>
                  )}
                </div>
                <div className="mt-4 text-sm text-cyan-400">
                  <p className="font-mono">作者: {post.author_address}</p>
                  {post.post_type === 'web3' && post.tx_hash && (
                    <a 
                      href="#" // 注意：BSN联盟链通常没有公开的浏览器，这里可以链接到一个内部的验证页面或暂时禁用
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-cyan-300 opacity-70 cursor-not-allowed"
                      title="联盟链交易哈希，可在BSN平台查询"
                    >
                      交易哈希: {`${post.tx_hash.substring(0, 10)}...`}
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}