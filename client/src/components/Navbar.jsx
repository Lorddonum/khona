import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import UserAuthModal from './UserAuthModal';
import './Navbar.css';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'ع' },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { totalItems } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('khona_theme') || 'dark');
  const [showAuth, setShowAuth] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [userMenuOpen]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('khona_theme', next);
  };

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('khona_lang', code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/products', label: t('nav.products') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="main-navbar">
        <div className="container navbar__inner">
          {/* Logo */}
          <Link to="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>
            <img src="/khona.png" alt="Khona" className="navbar__logo-img" />
            <span className="navbar__logo-text">KHONA</span>
          </Link>

          {/* Desktop links */}
          <ul className="navbar__links">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Right actions */}
          <div className="navbar__actions">
            {/* Language switcher */}
            <div className="navbar__lang">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  className={`navbar__lang-btn ${i18n.language === l.code ? 'active' : ''}`}
                  onClick={() => changeLang(l.code)}
                  id={`lang-${l.code}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Cart */}
            <Link to="/cart" className="navbar__cart" id="cart-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {totalItems > 0 && (
                <span className="navbar__cart-badge">{totalItems}</span>
              )}
            </Link>

            {/* User button */}
            {user ? (
              <div className="navbar__user" onClick={(e) => { e.stopPropagation(); setUserMenuOpen((p) => !p); }}>
                <button className="navbar__user-btn" id="user-menu-btn" aria-label="User menu">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  <span className="navbar__user-name">{user.username}</span>
                </button>
                {userMenuOpen && (
                  <div className="navbar__user-dropdown">
                    <span className="navbar__user-role">{user.role}</span>
                    {isAdmin && (
                      <Link to="/khona-admin-secure/dashboard" className="navbar__user-item" onClick={() => setUserMenuOpen(false)}>
                        Admin Panel
                      </Link>
                    )}
                    <button className="navbar__user-item navbar__user-item--danger" onClick={logout} id="logout-btn">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="navbar__signin-btn"
                onClick={() => setShowAuth(true)}
                id="signin-btn"
              >
                Sign In
              </button>
            )}

            {/* Theme toggle */}
            <button
              className="navbar__theme-toggle"
              onClick={toggleTheme}
              id="theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Hamburger */}
            <button
              className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              id="hamburger-btn"
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="navbar__mobile">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `navbar__mobile-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}
            {!user && (
              <button
                className="navbar__mobile-link"
                style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 500 }}
                onClick={() => { setMenuOpen(false); setShowAuth(true); }}
              >
                Sign In / Register
              </button>
            )}
            {user && (
              <button
                className="navbar__mobile-link"
                style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}
                onClick={logout}
              >
                Sign Out ({user.username})
              </button>
            )}
            <div className="navbar__mobile-lang">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  className={`navbar__lang-btn ${i18n.language === l.code ? 'active' : ''}`}
                  onClick={() => changeLang(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Auth modal */}
      {showAuth && (
        <UserAuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
