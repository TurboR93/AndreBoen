import { useLang } from '../LanguageContext';

export default function Mission() {
  const { t } = useLang();
  const mt = t.mission;

  const values = [
    { title: mt.v1title, text: mt.v1text, icon: '🏆' },
    { title: mt.v2title, text: mt.v2text, icon: '🤝' },
    { title: mt.v3title, text: mt.v3text, icon: '📊' },
  ];

  return (
    <div className="boen-page boen-mission">
      <div className="boen-page__hero">
        <h1>{mt.title}</h1>
      </div>

      <div className="boen-page__content">
        <section className="boen-mission__section">
          <h2>{mt.who}</h2>
          <p>{mt.whoText}</p>
        </section>

        <section className="boen-mission__section">
          <h2>{mt.role}</h2>
          <p>{mt.roleText}</p>
        </section>

        <section className="boen-mission__section">
          <h2>{mt.values}</h2>
          <div className="boen-mission__values">
            {values.map(v => (
              <div key={v.title} className="boen-mission__value-card">
                <div className="boen-mission__value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
