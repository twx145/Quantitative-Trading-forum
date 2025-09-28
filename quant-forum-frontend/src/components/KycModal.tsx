import React, { useState } from 'react';
import { FiShield } from 'react-icons/fi';
import Spinner from './Spinner';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletGenerated: (newAddress: string) => void;
  apiUrl: string;
  userId: number;
}

const KycModal: React.FC<KycModalProps> = ({ isOpen, onClose, onWalletGenerated, apiUrl, userId }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/generate-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.success) {
        alert('钱包已成功生成！现在你可以铸造NFT了。');
        onWalletGenerated(data.public_address);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert(`生成钱包失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {isLoading && <Spinner />}
        <div style={{ textAlign: 'center' }}>
          <FiShield size={48} color="var(--primary-color)" />
          <h2 className="modal-title">开启Web3之旅</h2>
          <p style={{ color: 'var(--text-secondary-color)', marginBottom: '2rem' }}>
            铸造NFT需要一个链上身份。我们将为您免费创建一个安全的钱包地址用于接收数字藏品。此过程为模拟实名认证。
          </p>
          <button className="button" onClick={handleGenerate} disabled={isLoading}>
            我同意，生成我的链上钱包
          </button>
        </div>
      </div>
    </div>
  );
};

export default KycModal;