import { useState } from 'react';
import { useLang } from '../LanguageContext';

const ALL_COUNTRIES = [
  'USA', 'Germany', 'Japan', 'UK', 'Canada', 'France', 'Switzerland',
  'China', 'UAE', 'South Korea', 'Brazil', 'Australia', 'Netherlands',
  'Belgium', 'Spain', 'Sweden', 'Denmark', 'Norway', 'Singapore', 'Hong Kong',
];

const CATEGORIES = ['WINE', 'FOOD', 'SPIRITS', 'OLIVE OIL'];

function MultiSelect({ options, value, onChange, placeholder }) {
  function toggle(opt) {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  }
  return (
    <div className="boen-multiselect">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          className={`boen-multiselect__chip ${value.includes(opt) ? 'boen-multiselect__chip--selected' : ''}`}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const API_URL = '/api/send.php';

export default function Buyer() {
  const { t } = useLang();
  const bt = t.buyer;
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    company: '',
    country: '',
    types: [],
    markets: [],
    categories: [],
    preferences: '',
    priceRange: '',
    volume: '',
    notes: '',
  });

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSending(true);
    setError('');
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('boenBuyers') || '[]');
    existing.push({ ...form, date: new Date().toISOString() });
    localStorage.setItem('boenBuyers', JSON.stringify(existing));
    // Send email
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'buyer', ...form }),
      });
      if (!res.ok) throw new Error('Invio fallito');
    } catch {
      setError(bt.error || 'Errore durante l\'invio email, ma i dati sono stati salvati.');
    } finally {
      setSending(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="boen-page boen-buyer">
      <div className="boen-buyer__intro boen-page__hero--buyer">
        <h1>{bt.title}</h1>
        <p className="boen-buyer__subtitle">{bt.subtitle}</p>
        <p className="boen-buyer__description">{bt.description}</p>
      </div>

      <div className="boen-buyer__form-wrap">
        <h2>{bt.formTitle}</h2>
        {submitted ? (
          <div className="boen-buyer__success">
            <div className="boen-modal__success-icon">✓</div>
            <p>{bt.success}</p>
          </div>
        ) : (
          <form className="boen-form" onSubmit={handleSubmit}>
            <div className="boen-form__row">
              <div className="boen-form__field">
                <label>{bt.company}</label>
                <input value={form.company} onChange={e => set('company', e.target.value)} required />
              </div>
              <div className="boen-form__field">
                <label>{bt.country}</label>
                <select value={form.country} onChange={e => set('country', e.target.value)} required>
                  <option value="">—</option>
                  {ALL_COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="boen-form__field">
              <label>{bt.type}</label>
              <MultiSelect options={bt.types} value={form.types} onChange={v => set('types', v)} />
            </div>

            <div className="boen-form__field">
              <label>{bt.markets}</label>
              <MultiSelect options={ALL_COUNTRIES} value={form.markets} onChange={v => set('markets', v)} />
            </div>

            <div className="boen-form__field">
              <label>{bt.categories}</label>
              <MultiSelect options={CATEGORIES} value={form.categories} onChange={v => set('categories', v)} />
            </div>

            <div className="boen-form__field">
              <label>{bt.preferences}</label>
              <textarea rows={3} value={form.preferences} onChange={e => set('preferences', e.target.value)} />
            </div>

            <div className="boen-form__row">
              <div className="boen-form__field">
                <label>{bt.priceRange}</label>
                <select value={form.priceRange} onChange={e => set('priceRange', e.target.value)}>
                  <option value="">—</option>
                  {bt.priceRanges.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="boen-form__field">
                <label>{bt.volume}</label>
                <select value={form.volume} onChange={e => set('volume', e.target.value)}>
                  <option value="">—</option>
                  {bt.volumes.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="boen-form__field">
              <label>{bt.notes}</label>
              <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            {error && <p style={{ color: '#c0392b', margin: '0 0 12px' }}>{error}</p>}
            <button type="submit" className="boen-btn boen-btn--gold boen-btn--full" disabled={sending}>
              {sending ? '...' : bt.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
