import React, { useState, type FormEvent, useEffect } from 'react';
import Spinner from './Spinner';

interface User {
  id: number;
  public_address: string | null;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  apiUrl: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess, apiUrl }) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // 每次打开模态框时，重置状态
  useEffect(() => {
    if (isOpen) {
      setPhoneInput('');
      setMode('login');
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      alert('请输入手机号');
      return;
    }
    setIsLoading(true);

    const endpoint = mode === 'login' ? '/api/login' : '/api/register';
    
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      });

      const data = await response.json();

      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert(`${mode === 'login' ? '登录' : '注册'}失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {isLoading && <Spinner />}
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        
        <div className="modal-tabs">
          <button onClick={() => setMode('login')} className={mode === 'login' ? 'active' : ''}>
            登录
          </button>
          <button onClick={() => setMode('register')} className={mode === 'register' ? 'active' : ''}>
            注册
          </button>
        </div>

        <h2 className="modal-title">{mode === 'login' ? '欢迎回来' : '创建新账户'}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="输入手机号"
            disabled={isLoading}
            autoFocus
          />
          <button type="submit" className="button" disabled={isLoading}>
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;