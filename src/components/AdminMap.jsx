import { useEffect, useState, useMemo } from 'react'
import Globe3D from './Globe3D'
import { initialPoints } from '../data/points'

const mockAgents = [
  { id: 'a1', firstName: 'Marco', lastName: 'Visentin', region: 'Veneto', city: 'Verona', phone: '+39 345 678 1234', email: 'm.visentin@boen.it', sectors: ['wine', 'spirits'], clients: 18, status: 'active' },
  { id: 'a2', firstName: 'Sara', lastName: 'Colombo', region: 'Lombardia', city: 'Milano', phone: '+39 338 912 3456', email: 's.colombo@boen.it', sectors: ['wine', 'food'], clients: 12, status: 'active' },
  { id: 'a3', firstName: 'Luca', lastName: 'Ferretti', region: 'Toscana', city: 'Firenze', phone: '+39 347 234 5678', email: 'l.ferretti@boen.it', sectors: ['wine', 'olive oil'], clients: 15, status: 'active' },
  { id: 'a4', firstName: 'Giulia', lastName: 'Moretti', region: 'Friuli Venezia Giulia', city: 'Udine', phone: '+39 340 567 8901', email: 'g.moretti@boen.it', sectors: ['wine'], clients: 10, status: 'active' },
  { id: 'a5', firstName: 'Andrea', lastName: 'Rossi', region: 'Piemonte', city: 'Torino', phone: '+39 333 890 1234', email: 'a.rossi@boen.it', sectors: ['wine', 'spirits'], clients: 14, status: 'active' },
  { id: 'a6', firstName: 'Elena', lastName: 'Bianchi', region: 'Emilia-Romagna', city: 'Bologna', phone: '+39 349 123 4567', email: 'e.bianchi@boen.it', sectors: ['food', 'wine'], clients: 9, status: 'active' },
  { id: 'a7', firstName: 'Roberto', lastName: 'Zanetti', region: 'Trentino-Alto Adige', city: 'Trento', phone: '+39 342 456 7890', email: 'r.zanetti@boen.it', sectors: ['wine', 'spirits'], clients: 7, status: 'onboarding' },
  { id: 'a8', firstName: 'Francesca', lastName: 'De Luca', region: 'Puglia & Campania', city: 'Napoli', phone: '+39 351 789 0123', email: 'f.deluca@boen.it', sectors: ['olive oil', 'wine'], clients: 11, status: 'active' },
  { id: 'a9', firstName: 'Davide', lastName: 'Conti', region: 'Sicilia & Sardegna', city: 'Palermo', phone: '+39 346 012 3456', email: 'd.conti@boen.it', sectors: ['wine', 'olive oil'], clients: 6, status: 'onboarding' },
  { id: 'a10', firstName: 'Chiara', lastName: 'Pellegrini', region: 'Lazio & Abruzzo', city: 'Roma', phone: '+39 339 345 6789', email: 'c.pellegrini@boen.it', sectors: ['food', 'wine'], clients: 8, status: 'active' },
]

const SECTOR_LABELS = { wine: 'Wine', food: 'Food', spirits: 'Spirits', 'olive oil': 'Olive Oil' }

export default function AdminMap({ onLogout, user }) {
  const [clientContacts, setClientContacts] = useState([])
  const [search, setSearch] = useState('')
  const [mobileView, setMobileView] = useState('list')
  const [flyTo, setFlyTo] = useState(null)
  const [activeView, setActiveView] = useState('contacts') // 'contacts' | 'agents'
  const [sectorFilter, setSectorFilter] = useState('')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('clientContacts') || '[]')
    setClientContacts(stored)
  }, [])

  const allPoints = useMemo(
    () => [...initialPoints, ...clientContacts],
    [clientContacts]
  )

  const filtered = useMemo(() => {
    let result = allPoints

    if (sectorFilter) {
      result = result.filter(p => p.sector === sectorFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.company.toLowerCase().includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.country && p.country.toLowerCase().includes(q)) ||
        (p.role && p.role.toLowerCase().includes(q)) ||
        (p.sector && p.sector.toLowerCase().includes(q))
      )
    }

    return result.sort((a, b) => {
      const aNew = a.source === 'client-form' ? 1 : 0
      const bNew = b.source === 'client-form' ? 1 : 0
      return bNew - aNew
    })
  }, [allPoints, search, sectorFilter])

  const filteredAgents = useMemo(() => {
    if (!search.trim()) return mockAgents
    const q = search.toLowerCase()
    return mockAgents.filter(a =>
      a.firstName.toLowerCase().includes(q) ||
      a.lastName.toLowerCase().includes(q) ||
      a.region.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.sectors.some(s => s.includes(q))
    )
  }, [search])

  const globeMarkers = useMemo(
    () => allPoints
      .filter(p => p.lat && p.lng)
      .map(p => ({
        ...p,
        status: p.source === 'client-form' ? 'developing' : 'active',
        name: p.company,
      })),
    [allPoints]
  )

  const newCount = useMemo(
    () => allPoints.filter(p => p.source === 'client-form').length,
    [allPoints]
  )

  function handleMarkerClick(marker) {
    setActiveView('contacts')
    setSearch(marker.company || '')
    setMobileView('list')
  }

  function handleContactClick(point) {
    if (point.lat && point.lng) {
      setFlyTo({ lat: point.lat, lng: point.lng, _ts: Date.now() })
      setMobileView('map')
    }
  }

  function switchView(view) {
    setActiveView(view)
    setSearch('')
    setSectorFilter('')
  }

  return (
    <div className="boen-admin">
      {/* Header */}
      <header className="boen-admin__header">
        <div className="boen-admin__logo">
          <span className="boen-header__logo-main">BOEN</span>
          <span className="boen-header__logo-sub">Milano</span>
        </div>

        <nav className="boen-admin__nav">
          <button
            className={`boen-admin__nav-btn ${activeView === 'contacts' ? 'boen-admin__nav-btn--active' : ''}`}
            onClick={() => switchView('contacts')}
          >
            Contatti
          </button>
          <button
            className={`boen-admin__nav-btn ${activeView === 'agents' ? 'boen-admin__nav-btn--active' : ''}`}
            onClick={() => switchView('agents')}
          >
            Agenti
          </button>
        </nav>

        <div className="boen-admin__header-right">
          <span className="boen-admin__user">Bentornato, {user.name}</span>
          <button className="boen-admin__logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="boen-admin__tabs">
        <button
          className={`boen-admin__tab ${mobileView === 'list' ? 'boen-admin__tab--active' : ''}`}
          onClick={() => setMobileView('list')}
        >
          {activeView === 'contacts' ? 'Contatti' : 'Agenti'}
        </button>
        <button
          className={`boen-admin__tab ${mobileView === 'map' ? 'boen-admin__tab--active' : ''}`}
          onClick={() => setMobileView('map')}
        >
          Globo
        </button>
      </div>

      <div className="boen-admin__body">
        {/* Globe */}
        <div className={`boen-admin__globe-wrap ${mobileView === 'list' ? 'boen-admin__globe-wrap--mobile-hidden' : ''}`}>
          <Globe3D markers={globeMarkers} onMarkerClick={handleMarkerClick} dotSize={0.012} rotationSpeed={0.0004} flyTo={flyTo} showSectors />
          <p className="boen-admin__hint">Clicca sui pin per filtrare i contatti</p>
        </div>

        {/* Sidebar */}
        <aside className={`boen-admin__sidebar ${mobileView === 'map' ? 'boen-admin__sidebar--mobile-hidden' : ''}`}>

          {/* ── CONTACTS VIEW ── */}
          {activeView === 'contacts' && (
            <>
              <div className="boen-admin__sidebar-header">
                <h2 className="boen-admin__sidebar-title">Contatti</h2>
                <div className="boen-admin__stats">
                  <span className="boen-admin__stat">
                    <strong>{filtered.length}</strong> / {allPoints.length}
                  </span>
                  {newCount > 0 && (
                    <span className="boen-admin__stat boen-admin__stat--new">
                      {newCount} nuovi
                    </span>
                  )}
                </div>
              </div>

              <div className="boen-admin__filters">
                <input
                  type="text"
                  className="boen-admin__search"
                  placeholder="Cerca nome, azienda, città..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="boen-admin__sector-filters">
                  {['wine', 'food', 'spirits', 'olive oil'].map(s => (
                    <button
                      key={s}
                      className={`boen-admin__sector-btn boen-admin__sector-btn--${s.replace(' ', '-')} ${sectorFilter === s ? 'boen-admin__sector-btn--active' : ''}`}
                      onClick={() => setSectorFilter(sectorFilter === s ? '' : s)}
                    >
                      {SECTOR_LABELS[s]}
                    </button>
                  ))}
                </div>
                {(search || sectorFilter) && (
                  <button
                    className="boen-admin__reset"
                    onClick={() => { setSearch(''); setSectorFilter('') }}
                  >
                    Rimuovi filtri
                  </button>
                )}
              </div>

              <ul className="boen-admin__list">
                {filtered.map((point) => (
                  <li
                    key={point.source === 'client-form' ? `c-${point.id}` : point.id}
                    className={`boen-admin__item ${point.source === 'client-form' ? 'boen-admin__item--new' : ''}`}
                    onClick={() => handleContactClick(point)}
                  >
                    <div className="boen-admin__item-company">{point.company}</div>
                    <div className="boen-admin__item-name">
                      {point.firstName} {point.lastName}
                      {point.role && <span className="boen-admin__item-role"> &middot; {point.role}</span>}
                    </div>
                    <div className="boen-admin__item-meta">
                      {point.city && <span>{point.city}</span>}
                      {point.city && point.country && <span> &middot; </span>}
                      <span>{point.country}</span>
                    </div>
                    <div className="boen-admin__item-contact">
                      {point.email && <a href={`mailto:${point.email}`}>{point.email}</a>}
                      {point.phone && <span>{point.phone}</span>}
                    </div>
                    {point.sector && (
                      <span className={`boen-admin__sector boen-admin__sector--${point.sector.replace(' ', '-')}`}>
                        {point.sector}
                      </span>
                    )}
                    {point.source === 'client-form' && (
                      <span className="boen-admin__item-badge">nuovo</span>
                    )}
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="boen-admin__empty">Nessun contatto trovato</li>
                )}
              </ul>
            </>
          )}

          {/* ── AGENTS VIEW ── */}
          {activeView === 'agents' && (
            <>
              <div className="boen-admin__sidebar-header">
                <h2 className="boen-admin__sidebar-title">Agenti Italia</h2>
                <div className="boen-admin__stats">
                  <span className="boen-admin__stat">
                    <strong>{filteredAgents.length}</strong> agenti
                  </span>
                </div>
              </div>

              <div className="boen-admin__filters">
                <input
                  type="text"
                  className="boen-admin__search"
                  placeholder="Cerca agente, regione..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <ul className="boen-admin__list">
                {filteredAgents.map((agent) => (
                  <li key={agent.id} className="boen-admin__item boen-admin__item--agent">
                    <div className="boen-admin__item-company">
                      {agent.firstName} {agent.lastName}
                    </div>
                    <div className="boen-admin__item-name">
                      {agent.region}
                      <span className="boen-admin__item-role"> &middot; {agent.city}</span>
                    </div>
                    <div className="boen-admin__agent-meta">
                      <span className={`boen-admin__agent-status boen-admin__agent-status--${agent.status}`}>
                        {agent.status === 'active' ? 'Attivo' : 'In onboarding'}
                      </span>
                      <span className="boen-admin__agent-clients">{agent.clients} clienti</span>
                    </div>
                    <div className="boen-admin__agent-sectors">
                      {agent.sectors.map(s => (
                        <span key={s} className={`boen-admin__sector boen-admin__sector--${s.replace(' ', '-')}`}>
                          {SECTOR_LABELS[s] || s}
                        </span>
                      ))}
                    </div>
                    <div className="boen-admin__item-contact">
                      <a href={`mailto:${agent.email}`}>{agent.email}</a>
                      <span>{agent.phone}</span>
                    </div>
                  </li>
                ))}
                {filteredAgents.length === 0 && (
                  <li className="boen-admin__empty">Nessun agente trovato</li>
                )}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
