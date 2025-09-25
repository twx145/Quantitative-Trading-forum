// 文件路径: src/components/PostForm.tsx (已修复)
"use client";
import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';

interface PostFormProps {
  refreshPosts: () => void;
  // 新增：明确接收User对象，而不仅仅是walletAddress
  user: { phoneNumber: string; walletAddress: string };
}

// 定义清晰的API响应类型
interface PostSuccessResponse {
  message: string;
  txHash?: string;
}
interface ApiErrorResponse {
  error: string;
}

export default function PostForm({ refreshPosts, user }: PostFormProps) {
  const [content, setContent] = useState('');
  const [isMintMode, setIsMintMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content) {
      toast.error('分享内容不能为空！');
      return;
    }

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      toast.error('登录状态已失效，请重新登录。');
      // 这里可以触发一个重新登录的流程
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(isMintMode ? '正在请求上链存证...' : '正在发布普通帖子...');

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 传递认证Token
        },
        body: JSON.stringify({
          type: isMintMode ? 'web3' : 'web2',
          content: content,
        }),
      });

      if (!response.ok) {
        const errorResult = await response.json() as ApiErrorResponse;
        throw new Error(errorResult.error || '提交帖子失败');
      }
      
      const successResult = await response.json() as PostSuccessResponse;
      const successMessage = isMintMode 
        ? `存证成功！交易哈希: ${successResult.txHash?.substring(0, 10)}...` 
        : '帖子发布成功！';
        
      toast.success(successMessage, { id: toastId });
      setContent('');
      setIsMintMode(false);
      refreshPosts(); // 刷新帖子列表

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '发生了一个未知错误';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-lg mb-10">
      <h2 className="text-xl font-semibold mb-4 text-white">
        欢迎, <span className="font-mono text-cyan-400">{user.phoneNumber}</span>!
      </h2>
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
      <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50" disabled={isSubmitting}>
        {isSubmitting ? '正在提交...' : (isMintMode ? '发布并上链存证' : '发布普通帖子')}
      </button>
    </form>
  );
}