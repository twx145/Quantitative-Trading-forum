import React from 'react';
import { FiUserCheck } from 'react-icons/fi';

interface User {
  id: number;
  public_address: string | null;
}

interface ProfilePageProps {
  user: User | null;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>请先登录</h2>
        <p>登录后才能查看您的个人信息。</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <FiUserCheck size={40} color="var(--primary-color)" />
        <h2 style={{ margin: 0 }}>我的信息</h2>
      </div>
      <p><strong>用户 ID:</strong> {user.id}</p>
      <p><strong>链上钱包地址:</strong></p>
      {user.public_address ? (
        <p style={{ wordBreak: 'break-all', color: 'var(--text-secondary-color)' }}>{user.public_address}</p>
      ) : (
        <p style={{ color: 'var(--text-secondary-color)' }}>您还未生成钱包，尝试发布一篇NFT帖子即可生成。</p>
      )}
    </div>
  );
};

export default ProfilePage;