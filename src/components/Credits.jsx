import { useLang } from '../LanguageContext';

export default function Credits() {
  const { t } = useLang();
  const ct = t.credits;

  return (
    <div className="boen-page boen-credits">
      <div className="boen-page__hero">
        <h1>{ct.title}</h1>
      </div>
      <div className="boen-page__content boen-credits__body">
        <p>{ct.built}</p>
        <ul className="boen-credits__list">
          <li>React 18 + Vite</li>
          <li>React Router v6</li>
          <li>Three.js — 3D Globe</li>
          <li>Leaflet + React-Leaflet — Admin Map</li>
          <li>Playfair Display + Inter — Google Fonts</li>
          <li>Picsum Photos — Placeholder images</li>
          <li>OpenStreetMap Nominatim — Geocoding</li>
          <li>CartoDB — Map tiles</li>
        </ul>
        <p className="boen-credits__copy">© {new Date().getFullYear()} BOEN Milano. All rights reserved.</p>
      </div>
    </div>
  );
}
