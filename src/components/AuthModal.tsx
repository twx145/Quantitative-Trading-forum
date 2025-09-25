// 文件路径: src/components/AuthModal.tsx (已修复)
"use client";
import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

// 定义清晰的API响应类型
interface LoginSuccessResponse {
  token: string;
  user: { phoneNumber: string; walletAddress: string; };
}
interface ApiErrorResponse {
  error: string;
}
interface AuthModalProps {
  closeModal: () => void;
  setUser: (user: { phoneNumber: string; walletAddress: string }) => void;
}

export default function AuthModal({ closeModal, setUser }: AuthModalProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 关键修复点：将 handleSubmit 从 PostForm 移到这里，并确保它只处理认证逻辑
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // 阻止表单的默认提交行为
    setIsLoading(true);
    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        // 断言 data 的类型为 ApiErrorResponse
        throw new Error((data as ApiErrorResponse).error || '操作失败');
      }

      if (isRegisterMode) {
        toast.success('注册成功！请登录。');
        setIsRegisterMode(false); // 注册成功后自动切换到登录模式
      } else {
        // 断言 data 的类型为 LoginSuccessResponse
        const successData = data as LoginSuccessResponse;
        toast.success('登录成功！');
        localStorage.setItem('jwt_token', successData.token);
        localStorage.setItem('user_data', JSON.stringify(successData.user));
        setUser(successData.user);
        closeModal();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '操作失败';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-sm relative shadow-2xl animate-slide-up">
        <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-white transition"><X /></button>
        <h2 className="text-2xl font-bold mb-6 text-center text-white">{isRegisterMode ? '创建账户' : '登录社区'}</h2>
        
        {/* 这个form是独立的，只负责自己的提交 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="tel" placeholder="手机号" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full p-3 rounded bg-gray-900 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
          <input type="password" placeholder="密码 (至少6位)" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded bg-gray-900 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" required minLength={6} />
          <button type="submit" disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition">
            {isLoading ? '处理中...' : (isRegisterMode ? '注册' : '登录')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          {isRegisterMode ? '已经有账户了？' : '还没有账户？'}
          {/* 关键修复点：这个切换按钮明确指定 type="button"，防止它意外提交任何表单 */}
          <button type="button" onClick={() => setIsRegisterMode(!isRegisterMode)} className="text-cyan-400 hover:underline ml-1 font-semibold">
            {isRegisterMode ? '立即登录' : '立即注册'}
          </button>
        </p>
      </div>
    </div>
  );
}