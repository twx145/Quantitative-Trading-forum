import React from 'react';
import { FiUser, FiInfo } from 'react-icons/fi';
// 1. 导入我们的格式化函数
import { formatUserId } from '../utils/formatters'; 

// User 和 SidebarProps interfaces 保持不变
interface User { id: number; }
interface SidebarProps { user: User | null; }

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  return (
    <aside className="sidebar">
      {user && (
        <div className="card sidebar-card">
          <div className="sidebar-header">
            <FiUser />
            <h3>我的信息</h3>
          </div>
          {/* 2. 在这里使用格式化函数 */}
          <p><strong>用户ID:</strong> #{formatUserId(user.id)}</p>
          <p><strong>身份:</strong> 社区成员</p>
        </div>
      )}
      <div className="card sidebar-card">
        <div className="sidebar-header">
          <FiInfo />
          <h3>社区公告</h3>
        </div>
        <p>欢迎来到QuantForum！这是一个专注于量化投资研究与交流的社区。</p>
        <p>请遵守社区规则，文明交流。</p>
      </div>
    </aside>
  );
};

export default Sidebar;