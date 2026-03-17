import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLang } from '../LanguageContext';

export default function BoenHeader() {
  const { t, lang, toggleLang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/', label: t.nav.home },
    { to: '/mission', label: t.nav.mission },
    { to: '/servizi', label: t.nav.servizi },
    { to: '/mercati', label: t.nav.mercati },
    { to: '/buyer', label: t.nav.buyer },
    { to: '/galleria', label: t.nav.galleria },
    { to: '/contatti', label: t.nav.contatti },
  ];

  return (
    <header className="boen-header">
      <div className="boen-header__inner">
        <div className="boen-header__logo" onClick={() => navigate('/')}>
          <span className="boen-header__logo-main">BOEN</span>
          <span className="boen-header__logo-sub">Milano</span>
        </div>

        <nav className={`boen-nav ${menuOpen ? 'boen-nav--open' : ''}`}>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `boen-nav__link ${isActive ? 'boen-nav__link--active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="boen-header__actions">
          <button className="boen-lang-toggle" onClick={toggleLang} title="Switch language">
            {lang === 'it' ? 'EN' : 'IT'}
          </button>
          <button
            className="boen-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
