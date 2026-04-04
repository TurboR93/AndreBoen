import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import Globe3D from './Globe3D';
import ServiceForm from './ServiceForm';
import { networkCountries } from '../data/countries';

export default function Mercati() {
  const { t, lang } = useLang();
  const mt = t.mercati;
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('cat') || '';
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formMarket, setFormMarket] = useState('');

  const categoryLabel = useMemo(() => {
    const map = { wine: 'WINE', food: 'FOOD', spirits: 'SPIRITS', oil: 'OLIVE OIL' };
    return map[activeCategory] || '';
  }, [activeCategory]);

  function handleMarkerClick(country) {
    setSelectedCountry(country);
  }

  function handleFormCTA() {
    const name = lang === 'it' ? selectedCountry.nameIt : selectedCountry.name;
    setFormMarket(name);
    setShowForm(true);
  }

  return (
    <div className="boen-mercati">
      <div className="boen-mercati__header">
        <h1>{mt.title}</h1>
        <p className="boen-mercati__subtitle">{mt.subtitle}</p>
        {categoryLabel && (
          <div className="boen-mercati__filter">
            <span className="boen-mercati__filter-label">{mt.filterLabel}:</span>
            <span className="boen-mercati__filter-value">{categoryLabel}</span>
          </div>
        )}
      </div>

      <div className="boen-mercati__body">
        <div className="boen-mercati__globe-wrap">
          <Globe3D markers={networkCountries} onMarkerClick={handleMarkerClick} satelliteTexture flyTo={selectedCountry} />
          <p className="boen-mercati__hint">
            {lang === 'it' ? 'Clicca sui pin per esplorare i mercati' : 'Click the pins to explore markets'}
          </p>
        </div>

        <div className="boen-mercati__sidebar">
          <div className="boen-mercati__legend">
            <div className="boen-mercati__legend-item">
              <span className="boen-mercati__dot boen-mercati__dot--active" />
              {mt.networkActive}
            </div>
            <div className="boen-mercati__legend-item">
              <span className="boen-mercati__dot boen-mercati__dot--dev" />
              {mt.networkDev}
            </div>
          </div>

          <div className="boen-mercati__country-list">
            {networkCountries.map(c => (
              <button
                key={c.name}
                className={`boen-mercati__country-item ${selectedCountry?.name === c.name ? 'boen-mercati__country-item--active' : ''}`}
                onClick={() => setSelectedCountry(c)}
              >
                <span className={`boen-mercati__dot boen-mercati__dot--${c.status === 'active' ? 'active' : 'dev'}`} />
                <span>{lang === 'it' ? c.nameIt : c.name}</span>
              </button>
            ))}
          </div>

          {selectedCountry && (
            <div className="boen-mercati__popup">
              <h3>{lang === 'it' ? selectedCountry.nameIt : selectedCountry.name}</h3>
              <div className={`boen-mercati__status boen-mercati__status--${selectedCountry.status}`}>
                {selectedCountry.status === 'active' ? mt.active : mt.developing}
              </div>
              <p className="boen-mercati__contacts-label">{mt.contacts}:</p>
              <ul className="boen-mercati__contacts-list">
                {selectedCountry.contacts.map(c => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <button className="boen-btn boen-btn--gold boen-btn--full" onClick={handleFormCTA}>
                {mt.cta}
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <ServiceForm preMarket={formMarket} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
