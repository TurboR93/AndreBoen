import { useState } from 'react';
import { useLang } from '../LanguageContext';

const CATEGORIES = ['WINE', 'FOOD', 'SPIRITS', 'OLIVE OIL'];

export default function ServiceForm({ preMarket = '', onClose }) {
  const { t } = useLang();
  const ft = t.form;
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company: '',
    contact: '',
    email: '',
    phone: '',
    vat: '',
    category: '',
    market: preMarket,
    service: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    ['company', 'contact', 'email', 'phone', 'vat'].forEach(f => {
      if (!form[f].trim()) e[f] = ft.required;
    });
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const existing = JSON.parse(localStorage.getItem('boenLeads') || '[]');
    existing.push({ ...form, date: new Date().toISOString() });
    localStorage.setItem('boenLeads', JSON.stringify(existing));
    setSubmitted(true);
  }

  return (
    <div className="boen-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="boen-modal">
        <button className="boen-modal__close" onClick={onClose}>×</button>

        {submitted ? (
          <div className="boen-modal__success">
            <div className="boen-modal__success-icon">✓</div>
            <p className="boen-modal__success-title">{ft.successTitle}</p>
            <p className="boen-modal__success-body">{ft.successBody}</p>
            <button className="boen-btn boen-btn--gold" onClick={onClose}>OK</button>
          </div>
        ) : (
          <>
            <h2 className="boen-modal__title">{ft.title}</h2>
            <form className="boen-form" onSubmit={handleSubmit} noValidate>
              <div className="boen-form__row">
                <div className="boen-form__field">
                  <label>{ft.company} *</label>
                  <input value={form.company} onChange={e => set('company', e.target.value)} />
                  {errors.company && <span className="boen-form__error">{errors.company}</span>}
                </div>
                <div className="boen-form__field">
                  <label>{ft.contact} *</label>
                  <input value={form.contact} onChange={e => set('contact', e.target.value)} />
                  {errors.contact && <span className="boen-form__error">{errors.contact}</span>}
                </div>
              </div>
              <div className="boen-form__row">
                <div className="boen-form__field">
                  <label>{ft.email} *</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                  {errors.email && <span className="boen-form__error">{errors.email}</span>}
                </div>
                <div className="boen-form__field">
                  <label>{ft.phone} *</label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  {errors.phone && <span className="boen-form__error">{errors.phone}</span>}
                </div>
              </div>
              <div className="boen-form__row">
                <div className="boen-form__field">
                  <label>{ft.vat} *</label>
                  <input value={form.vat} onChange={e => set('vat', e.target.value)} />
                  {errors.vat && <span className="boen-form__error">{errors.vat}</span>}
                </div>
                <div className="boen-form__field">
                  <label>{ft.category}</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}>
                    <option value="">—</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="boen-form__row">
                <div className="boen-form__field">
                  <label>{ft.market}</label>
                  <input value={form.market} onChange={e => set('market', e.target.value)} />
                </div>
                <div className="boen-form__field">
                  <label>{ft.service}</label>
                  <select value={form.service} onChange={e => set('service', e.target.value)}>
                    <option value="">—</option>
                    {ft.services.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="boen-form__field">
                <label>{ft.description}</label>
                <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <button type="submit" className="boen-btn boen-btn--gold boen-btn--full">{ft.submit}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
