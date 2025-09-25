// 文件路径: src/components/PostForm.tsx (已修复TypeScript类型错误)

"use client";

import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';

// --- 类型定义区 (开始) ---

// 为API成功返回的数据定义“说明书”
// message 总是存在，txHash 只在Web3上链成功时存在，所以是可选的
interface ApiPostSuccessResponse {
  message: string;
  txHash?: string; 
}

// 为API失败返回的数据定义“说明书”
interface ApiErrorResponse {
  error: string;
}

// --- 类型定义区 (结束) ---

interface PostFormProps {
  account: string | null;
  refreshPosts: () => void;
}

export default function PostForm({ account, refreshPosts }: PostFormProps) {
  const [content, setContent] = useState('');
  const [isMintMode, setIsMintMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content) {
      toast.error('内容不能为空！');
      return;
    }
    if (!account) {
      toast.error('请先连接您的钱包以确认身份。');
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading(isMintMode ? '正在请求上链存证...' : '正在发布普通帖子...');

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

      // 已修复：我们不在 response.ok 的分支里处理JSON解析
      if (!response.ok) {
        // 如果请求失败，我们明确告诉TS，响应体是ApiErrorResponse类型
        const result = await response.json() as ApiErrorResponse;
        throw new Error(result.error || '提交帖子失败');
      }

      // 如果请求成功，我们明确告诉TS，响应体是ApiPostSuccessResponse类型
      const result = await response.json() as ApiPostSuccessResponse;

      // 使用可选链操作符 `?.` 来安全地访问可能不存在的 txHash
      const successMessage = isMintMode 
        ? `存证成功！交易哈希: ${result.txHash?.substring(0, 10)}...` 
        : '帖子发布成功！';
      
      toast.success(successMessage, { id: toastId });
      
      setContent('');
      setIsMintMode(false);
      refreshPosts();

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '发生了一个未知错误';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-lg mb-10">
      <h2 className="text-xl font-semibold mb-4 text-white">发表您的研究成果</h2>
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享您的洞见、分析或发现..."
          className="w-full p-3 rounded bg-gray-900 border border-gray-600 h-28 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          disabled={isSubmitting}
        />
      </div>
      <div className="my-4">
        <label className="flex items-center text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isMintMode}
            onChange={(e) => setIsMintMode(e.target.checked)}
            className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
          />
          <span className="ml-3">作为知识产权上链存证 (由平台支付服务费)</span>
        </label>
      </div>
      <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting || !account}>
        {isSubmitting ? '正在提交...' : (isMintMode ? '发布并上链存证' : '发布普通帖子')}
      </button>
    </form>
  );
}