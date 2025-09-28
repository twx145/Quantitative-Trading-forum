import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiLogIn, FiLogOut, FiBarChart2, FiUser, FiInfo, FiSettings } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

interface User { id: number; }
interface NavbarProps { user: User | null; onLoginClick: () => void; onLogoutClick: () => void; }

const Navbar: React.FC<NavbarProps> = ({ user, onLoginClick, onLogoutClick }) => {
  const { t } = useTranslation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <FiBarChart2 size={28} />
          <h1>{t('navbar.brand')}</h1>
        </Link>
        <div className="navbar-user">
          <NavLink to="/about" className="nav-icon-link">
            <FiInfo size={22} />
            <span className="tooltip-text">{t('navbar.about')}</span>
          </NavLink>

          {user && (
            <>
              <NavLink to="/profile" className="nav-icon-link">
                <FiUser size={22} />
                <span className="tooltip-text">{t('navbar.my')}</span>
              </NavLink>
              <NavLink to="/settings" className="nav-icon-link">
                <FiSettings size={22} />
                <span className="tooltip-text">{t('navbar.settings')}</span>
              </NavLink>
            </>
          )}

          {user ? (
            <button className="button button-outline" onClick={onLogoutClick}>
              <FiLogOut />
              <span>{t('navbar.logout')}</span>
            </button>
          ) : (
            <button className="button" onClick={onLoginClick}>
              <FiLogIn />
              <span>{t('navbar.login')}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;