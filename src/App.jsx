import { useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './LanguageContext';
import BoenHeader from './components/BoenHeader';
import Login from './components/Login';
import AdminMap from './components/AdminMap';

const Home = lazy(() => import('./components/Home'));
const Mission = lazy(() => import('./components/Mission'));
const Servizi = lazy(() => import('./components/Servizi'));
const Mercati = lazy(() => import('./components/Mercati'));
const Buyer = lazy(() => import('./components/Buyer'));
const Galleria = lazy(() => import('./components/Galleria'));
const Contatti = lazy(() => import('./components/Contatti'));
const Credits = lazy(() => import('./components/Credits'));

function PublicLayout({ children, onAdminClick }) {
  return (
    <div className="boen-app">
      <BoenHeader />
      <main className="boen-main">
        <Suspense fallback={<div className="boen-loading">…</div>}>
          {children}
        </Suspense>
      </main>
      <footer className="boen-footer">
        <span>© {new Date().getFullYear()} BOEN Milano</span>
        <button className="boen-footer__admin-link" onClick={onAdminClick}>
          Area Riservata
        </button>
      </footer>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  if (user?.role === 'admin') {
    return <AdminMap user={user} onLogout={() => setUser(null)} />;
  }

  return (
    <LanguageProvider>
      <HashRouter>
        <PublicLayout onAdminClick={() => setShowLogin(true)}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mission" element={<Mission />} />
            <Route path="/servizi" element={<Servizi />} />
            <Route path="/mercati" element={<Mercati />} />
            <Route path="/buyer" element={<Buyer />} />
            <Route path="/galleria" element={<Galleria />} />
            <Route path="/contatti" element={<Contatti />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PublicLayout>

        {showLogin && (
          <Login
            onLogin={userData => { setUser(userData); setShowLogin(false); }}
            onClose={() => setShowLogin(false)}
          />
        )}
      </HashRouter>
    </LanguageProvider>
  );
}
