import { useEffect, useState, useMemo } from 'react'
import Globe3D from './Globe3D'
import { initialPoints } from '../data/points'

export default function AdminMap({ onLogout, user }) {
  const [clientContacts, setClientContacts] = useState([])
  const [search, setSearch] = useState('')
  const [mobileView, setMobileView] = useState('list')
  const [flyTo, setFlyTo] = useState(null)

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

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.company.toLowerCase().includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.country && p.country.toLowerCase().includes(q)) ||
        (p.role && p.role.toLowerCase().includes(q))
      )
    }

    return result.sort((a, b) => {
      const aNew = a.source === 'client-form' ? 1 : 0
      const bNew = b.source === 'client-form' ? 1 : 0
      return bNew - aNew
    })
  }, [allPoints, search])

  // Globe markers: all contacts with lat/lng, with status for animation
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
    setSearch(marker.company || '')
    setMobileView('list')
  }

  function handleContactClick(point) {
    if (point.lat && point.lng) {
      setFlyTo({ lat: point.lat, lng: point.lng, _ts: Date.now() })
      setMobileView('map')
    }
  }

  return (
    <div className="boen-admin">
      {/* Header */}
      <header className="boen-admin__header">
        <div className="boen-admin__logo">
          <span className="boen-header__logo-main">BOEN</span>
          <span className="boen-header__logo-sub">Milano</span>
        </div>
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
          Contatti
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
            {search && (
              <button
                className="boen-admin__reset"
                onClick={() => setSearch('')}
              >
                Rimuovi filtro
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
        </aside>
      </div>
    </div>
  )
}
