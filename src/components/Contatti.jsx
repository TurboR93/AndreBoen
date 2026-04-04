import { useState } from 'react';
import { useLang } from '../LanguageContext';

const API_URL = '/api/send.php';

export default function Contatti() {
  const { t } = useLang();
  const ct = t.contatti;
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contatti', ...form }),
      });
      if (!res.ok) throw new Error('Invio fallito');
      setSubmitted(true);
    } catch {
      setError(ct.error || 'Errore durante l\'invio. Riprova.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="boen-page boen-contatti">
      <div className="boen-page__hero boen-page__hero--contatti">
        <h1>{ct.title}</h1>
        <p className="boen-page__hero-subtitle">{ct.subtitle}</p>
      </div>

      <div className="boen-contatti__body">
        <div className="boen-contatti__info">
          <div className="boen-contatti__info-item">
            <span className="boen-contatti__info-icon">📍</span>
            <div>
              <strong>BOEN Milano</strong>
              <p>Milano, Italia</p>
            </div>
          </div>
          <div className="boen-contatti__info-item">
            <span className="boen-contatti__info-icon">✉️</span>
            <div>
              <strong>Email</strong>
              <p>info@boen.milano</p>
            </div>
          </div>
          <div className="boen-contatti__info-item">
            <span className="boen-contatti__info-icon">📞</span>
            <div>
              <strong>Telefono</strong>
              <p>+39 02 0000 0000</p>
            </div>
          </div>
        </div>

        <div className="boen-contatti__form-wrap">
          {submitted ? (
            <div className="boen-buyer__success">
              <div className="boen-modal__success-icon">✓</div>
              <p>{ct.success}</p>
            </div>
          ) : (
            <form className="boen-form" onSubmit={handleSubmit}>
              <div className="boen-form__field">
                <label>{ct.name}</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="boen-form__field">
                <label>{ct.email}</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="boen-form__field">
                <label>{ct.message}</label>
                <textarea rows={5} value={form.message} onChange={e => set('message', e.target.value)} required />
              </div>
              {error && <p style={{ color: '#c0392b', margin: '0 0 12px' }}>{error}</p>}
              <button type="submit" className="boen-btn boen-btn--gold boen-btn--full" disabled={sending}>
                {sending ? '...' : ct.send}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
