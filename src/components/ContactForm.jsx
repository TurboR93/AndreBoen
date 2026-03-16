import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const mapMarkerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    }
  })
  return null
}

export default function ContactForm({ onClose }) {
  const [step, setStep] = useState(1) // 1=settore, 2=azienda, 3=mappa paese, 4=dettagli
  const [form, setForm] = useState({
    sector: '',
    company: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    role: '',
    country: '',
    lat: 0,
    lng: 0,
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [mapMarker, setMapMarker] = useState(null)
  const [loadingCountry, setLoadingCountry] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleMapClick = async (latlng) => {
    setMapMarker(latlng)
    setForm(f => ({ ...f, lat: latlng.lat, lng: latlng.lng }))
    setLoadingCountry(true)
    setError('')

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json&accept-language=it`,
        { headers: { 'User-Agent': 'AndreaBoenWineRelations/1.0' } }
      )
      const data = await res.json()
      const country = data.address?.country || ''
      setForm(f => ({ ...f, country }))
    } catch {
      // If geocoding fails, user can type manually
    }
    setLoadingCountry(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.phone && !form.email) {
      setError('Inserisci almeno un recapito: telefono o email')
      return
    }

    const contact = {
      ...form,
      id: Date.now(),
      city: '',
      source: "client-form",
      date: new Date().toISOString()
    }

    const existing = JSON.parse(localStorage.getItem('clientContacts') || '[]')
    existing.push(contact)
    localStorage.setItem('clientContacts', JSON.stringify(existing))

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="contact-form-wrapper">
        <div className="contact-form-card">
          <div className="form-success">
            <div className="success-icon">&#10003;</div>
            <h3>Grazie per averci contattato</h3>
            <p>Andrea Boen Wine Relations vi ricontatterà al più presto.</p>
            <button className="btn btn--secondary" onClick={onClose}>
              Chiudi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="contact-form-wrapper">
      <div className="contact-form-card">
        <button className="form-close" onClick={onClose} aria-label="Chiudi">
          &times;
        </button>

        {/* STEP 1: Settore */}
        {step === 1 && (
          <>
            <h2 className="form-title">Di cosa ti occupi?</h2>
            <p className="form-subtitle">Seleziona il settore di tuo interesse</p>
            <div className="sector-choice">
              <button
                className="sector-btn"
                onClick={() => { setForm({ ...form, sector: 'Wine' }); setStep(2) }}
              >
                <span className="sector-btn__icon">&#127863;</span>
                <span className="sector-btn__label">Wine</span>
              </button>
              <button
                className="sector-btn"
                onClick={() => { setForm({ ...form, sector: 'Spirits' }); setStep(2) }}
              >
                <span className="sector-btn__icon">&#127864;</span>
                <span className="sector-btn__label">Spirits</span>
              </button>
            </div>
          </>
        )}

        {/* STEP 2: Azienda */}
        {step === 2 && (
          <>
            <h2 className="form-title">La tua azienda</h2>
            <p className="form-subtitle">Settore: {form.sector}</p>
            <div className="contact-form">
              <div className="form-group">
                <label htmlFor="company">Azienda rappresentata</label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  required
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Nome dell'azienda"
                  autoFocus
                />
              </div>
              <div className="form-step-actions">
                <button className="btn btn--back" onClick={() => setStep(1)}>
                  Indietro
                </button>
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    if (!form.company.trim()) {
                      setError('Inserisci il nome dell\'azienda')
                      return
                    }
                    setError('')
                    setStep(3)
                  }}
                >
                  Avanti
                </button>
              </div>
              {error && <p className="form-error">{error}</p>}
            </div>
          </>
        )}

        {/* STEP 3: Mappa - seleziona paese */}
        {step === 3 && (
          <>
            <h2 className="form-title">Dove ti trovi?</h2>
            <p className="form-subtitle">Clicca sulla mappa per selezionare il tuo paese</p>
            <div className="form-map-picker">
              <MapContainer
                center={[30, 10]}
                zoom={2}
                className="form-map"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <ClickHandler onMapClick={handleMapClick} />
                {mapMarker && (
                  <Marker position={[mapMarker.lat, mapMarker.lng]} icon={mapMarkerIcon} />
                )}
              </MapContainer>
            </div>
            <div className="contact-form" style={{ marginTop: '0.8rem' }}>
              <div className="form-group">
                <label htmlFor="country">Paese selezionato</label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={loadingCountry ? 'Caricamento...' : form.country}
                  onChange={handleChange}
                  placeholder="Clicca sulla mappa oppure scrivi qui"
                  readOnly={loadingCountry}
                />
              </div>
              <div className="form-step-actions">
                <button className="btn btn--back" onClick={() => setStep(2)}>
                  Indietro
                </button>
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    if (!form.country.trim()) {
                      setError('Seleziona un paese sulla mappa o scrivilo')
                      return
                    }
                    setError('')
                    setStep(4)
                  }}
                >
                  Avanti
                </button>
              </div>
              {error && <p className="form-error">{error}</p>}
            </div>
          </>
        )}

        {/* STEP 4: Dettagli contatto */}
        {step === 4 && (
          <>
            <h2 className="form-title">I tuoi dati</h2>
            <p className="form-subtitle">{form.sector} &middot; {form.company} &middot; {form.country}</p>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Nome</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Il tuo nome"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Cognome</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Il tuo cognome"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Telefono</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+39 ..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="email@esempio.it"
                  />
                </div>
              </div>
              <p className="form-hint">Almeno uno tra telefono e email è obbligatorio</p>

              <div className="form-group">
                <label htmlFor="role">Ruolo</label>
                <input
                  id="role"
                  name="role"
                  type="text"
                  value={form.role}
                  onChange={handleChange}
                  placeholder="Es. Export Manager, Sommelier..."
                />
              </div>

              {error && <p className="form-error">{error}</p>}

              <div className="form-step-actions">
                <button type="button" className="btn btn--back" onClick={() => setStep(3)}>
                  Indietro
                </button>
                <button type="submit" className="btn btn--primary">
                  Invia richiesta
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
