import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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

function PageTransition({ children }) {
  const location = useLocation();
  const ref = useRef(null);
  const prevKey = useRef(location.key);

  useEffect(() => {
    if (location.key !== prevKey.current) {
      prevKey.current = location.key;
      const el = ref.current;
      if (!el) return;
      el.classList.remove('boen-page-enter');
      void el.offsetWidth; // force reflow
      el.classList.add('boen-page-enter');
    }
  }, [location.key]);

  return (
    <div ref={ref} className="boen-page-transition boen-page-enter">
      {children}
    </div>
  );
}

function PublicLayout({ children }) {
  const navigate = useNavigate();
  return (
    <div className="boen-app">
      <BoenHeader />
      <main className="boen-main">
        <Suspense fallback={<div className="boen-loading">…</div>}>
          <PageTransition>{children}</PageTransition>
        </Suspense>
      </main>
      <footer className="boen-footer">
        <span>© {new Date().getFullYear()} BOEN Milano</span>
        <button className="boen-footer__admin-link" onClick={() => navigate('/area-riservata')}>
          Area Riservata
        </button>
      </footer>
    </div>
  );
}

function AdminRoute({ user, onLogin, onLogout }) {
  if (!user || user.role !== 'admin') {
    return <Login onLogin={onLogin} onClose={null} />;
  }
  return <AdminMap user={user} onLogout={onLogout} />;
}

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <LanguageProvider>
      <HashRouter>
        <Routes>
          <Route path="/area-riservata" element={
            <AdminRoute
              user={user}
              onLogin={userData => setUser(userData)}
              onLogout={() => setUser(null)}
            />
          } />
          <Route path="*" element={
            <PublicLayout>
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
          } />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  );
}
