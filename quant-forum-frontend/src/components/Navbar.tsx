import React from 'react';
import { Link, NavLink } from 'react-router-dom'; // 导入 Link 和 NavLink
import { FiLogIn, FiLogOut, FiBarChart2, FiUser, FiInfo } from 'react-icons/fi'; // 导入新图标

// User 和 NavbarProps interfaces 保持不变
interface User { id: number; }
interface NavbarProps { user: User | null; onLoginClick: () => void; onLogoutClick: () => void; }

const Navbar: React.FC<NavbarProps> = ({ user, onLoginClick, onLogoutClick }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo 现在是一个指向首页的链接 */}
        <Link to="/" className="navbar-brand">
          <FiBarChart2 size={28} />
          <h1>QuantForum</h1>
        </Link>
        <div className="navbar-user">
          {/* 新增的导航图标 */}
          <NavLink to="/about" className="nav-icon-link">
            <FiInfo size={22} />
            <span className="tooltip-text">关于我们</span>
          </NavLink>

          {/* “我的”图标只在登录后显示 */}
          {user && (
            <NavLink to="/profile" className="nav-icon-link">
              <FiUser size={22} />
              <span className="tooltip-text">我的</span>
            </NavLink>
          )}

          {/* 登录/登出逻辑 */}
          {user ? (
            <>
              <span className="user-id-display">ID: {user.id}</span>
              <button className="button button-outline" onClick={onLogoutClick}>
                <FiLogOut />
                <span>登出</span>
              </button>
            </>
          ) : (
            <button className="button" onClick={onLoginClick}>
              <FiLogIn />
              <span>登录 / 注册</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;