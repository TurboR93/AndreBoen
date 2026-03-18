import { useState } from 'react';
import { useLang } from '../LanguageContext';
import ServiceForm from './ServiceForm';

export default function Servizi() {
  const { t } = useLang();
  const st = t.servizi;
  const [showForm, setShowForm] = useState(false);
  const [formService, setFormService] = useState('');

  const services = [
    { title: st.s1title, text: st.s1text, icon: '🌍', key: st.s1title },
    { title: st.s2title, text: st.s2text, icon: '🤝', key: st.s2title },
    { title: st.s3title, text: st.s3text, icon: '🎪', key: st.s3title },
    { title: st.s4title, text: st.s4text, icon: '🏛️', key: st.s4title },
  ];

  function openForm(serviceTitle) {
    setFormService(serviceTitle);
    setShowForm(true);
  }

  return (
    <div className="boen-page boen-servizi">
      <div className="boen-page__hero boen-page__hero--servizi">
        <h1>{st.title}</h1>
        <p className="boen-page__hero-subtitle">{st.subtitle}</p>
      </div>

      <div className="boen-servizi__grid">
        {services.map(s => (
          <div key={s.key} className="boen-service-card">
            <div className="boen-service-card__icon">{s.icon}</div>
            <h2 className="boen-service-card__title">{s.title}</h2>
            <p className="boen-service-card__text">{s.text}</p>
            <button
              className="boen-btn boen-btn--outline"
              onClick={() => openForm(s.title)}
            >
              {st.cta}
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <ServiceForm
          preMarket=""
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
