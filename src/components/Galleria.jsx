import { useLang } from '../LanguageContext';

// Placeholder gallery items using picsum
const ITEMS = [
  { id: 1, label: 'Vinitaly 2024', seed: 10 },
  { id: 2, label: 'B2B Milano', seed: 20 },
  { id: 3, label: 'Tokyo Wine Fair', seed: 30 },
  { id: 4, label: 'Prowein Düsseldorf', seed: 40 },
  { id: 5, label: 'Incontro NY', seed: 50 },
  { id: 6, label: 'Dubai HORECA', seed: 60 },
  { id: 7, label: 'Shanghai Expo', seed: 70 },
  { id: 8, label: 'Evento Milano', seed: 80 },
  { id: 9, label: 'Seoul Tasting', seed: 90 },
];

export default function Galleria() {
  const { t } = useLang();
  const gt = t.galleria;

  return (
    <div className="boen-page boen-galleria">
      <div className="boen-page__hero">
        <h1>{gt.title}</h1>
        <p className="boen-page__hero-subtitle">{gt.subtitle}</p>
      </div>

      <div className="boen-galleria__grid">
        {ITEMS.map(item => (
          <div key={item.id} className="boen-gallery-card">
            <img
              src={`https://picsum.photos/seed/${item.seed}/600/400`}
              alt={item.label}
              loading="lazy"
            />
            <div className="boen-gallery-card__label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
