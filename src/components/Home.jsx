import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import Globe3D from './Globe3D';

const CATEGORIES = [
  { key: 'wine', emoji: '🍷', label: 'WINE' },
  { key: 'food', emoji: '🍝', label: 'FOOD' },
  { key: 'spirits', emoji: '🥃', label: 'SPIRITS' },
  { key: 'oil', emoji: '🫒', label: 'OLIVE OIL' },
];

export default function Home() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  function handleCategory(cat) {
    navigate(`/mercati?cat=${cat.key}`);
  }

  return (
    <div className="boen-home">
      <section className="boen-hero">
        <div className="boen-hero__globe">
          <Globe3D markers={[]} passive satelliteTexture zoomIn onZoomComplete={() => setShowContent(true)} />
        </div>
        <div className="boen-hero__overlay" />
        {showContent && (
          <div className="boen-hero__content boen-hero__content--banner">
            <div className="boen-hero__logo">
              <span className="boen-hero__logo-main">BOEN</span>
              <em className="boen-hero__logo-sub">Milano</em>
            </div>
            <h1 className="boen-hero__claim">{t.home.claim}</h1>
            <p className="boen-hero__subtitle">{t.home.subtitle}</p>
            <button
              className="boen-btn boen-btn--gold"
              onClick={() => navigate('/mercati')}
            >
              {t.home.discover}
            </button>
          </div>
        )}
      </section>

      <section className="boen-categories">
        <p className="boen-categories__label">{t.home.selectCategory}</p>
        <div className="boen-categories__grid">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className="boen-category-card"
              onClick={() => handleCategory(cat)}
            >
              <span className="boen-category-card__emoji">{cat.emoji}</span>
              <span className="boen-category-card__label">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
