import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import MarkerPopup from './MarkerPopup'
import Logo from './Logo'
import { initialPoints } from '../data/points'

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const clientIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'client-marker'
})

function MapController({ flyTo }) {
  const map = useMap()

  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lng], 12, { duration: 0.8 })
    }
  }, [flyTo, map])

  return null
}

function FitBounds({ points, enabled }) {
  const map = useMap()

  useEffect(() => {
    if (!enabled) return
    const valid = points.filter(p => p.lat && p.lng)
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 })
    }
  }, [points, map, enabled])

  return null
}

export default function AdminMap({ onLogout, user }) {
  const [clientContacts, setClientContacts] = useState([])
  const [search, setSearch] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [flyTo, setFlyTo] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [fitKey, setFitKey] = useState(0)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('clientContacts') || '[]')
    setClientContacts(stored)
  }, [])

  const allPoints = useMemo(
    () => [...initialPoints, ...clientContacts],
    [clientContacts]
  )

  const countries = useMemo(() => {
    const set = new Set(allPoints.map(p => p.country).filter(Boolean))
    return [...set].sort()
  }, [allPoints])

  const cities = useMemo(() => {
    let pts = allPoints
    if (filterCountry) pts = pts.filter(p => p.country === filterCountry)
    const set = new Set(pts.map(p => p.city).filter(Boolean))
    return [...set].sort()
  }, [allPoints, filterCountry])

  const filtered = useMemo(() => {
    let result = allPoints
    if (filterCountry) result = result.filter(p => p.country === filterCountry)
    if (filterCity) result = result.filter(p => p.city === filterCity)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.company.toLowerCase().includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.role && p.role.toLowerCase().includes(q))
      )
    }
    return result
  }, [allPoints, filterCountry, filterCity, search])

  const mappable = useMemo(
    () => filtered.filter(p => p.lat && p.lng),
    [filtered]
  )

  // Fit bounds when filters change
  useEffect(() => {
    setFitKey(k => k + 1)
    setSelectedId(null)
    setFlyTo(null)
  }, [filterCountry, filterCity, search])

  const handleContactClick = (point) => {
    setSelectedId(point.id)
    if (point.lat && point.lng) {
      setFlyTo({ lat: point.lat, lng: point.lng, _ts: Date.now() })
    }
  }

  const resetFilters = () => {
    setSearch('')
    setFilterCountry('')
    setFilterCity('')
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <Logo compact />
        <div className="admin__header-right">
          <span className="admin__user">Bentornato, {user.name}</span>
          <button className="btn btn--logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin__body">
        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar--collapsed'}`}>
          <button
            className="sidebar__toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Chiudi sidebar' : 'Apri sidebar'}
          >
            {sidebarOpen ? '\u2039' : '\u203A'}
          </button>

          {sidebarOpen && (
            <>
              <div className="sidebar__header">
                <h2 className="sidebar__title">Contatti</h2>
                <div className="sidebar__stats">
                  <span className="sidebar__stat">
                    <strong>{filtered.length}</strong> / {allPoints.length}
                  </span>
                  {clientContacts.length > 0 && (
                    <span className="sidebar__stat sidebar__stat--new">
                      {clientContacts.length} nuovi
                    </span>
                  )}
                </div>
              </div>

              <div className="sidebar__filters">
                <input
                  type="text"
                  className="sidebar__search"
                  placeholder="Cerca nome, azienda, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="sidebar__filter-row">
                  <select
                    className="sidebar__select"
                    value={filterCountry}
                    onChange={(e) => { setFilterCountry(e.target.value); setFilterCity('') }}
                  >
                    <option value="">Tutti i paesi</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    className="sidebar__select"
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                  >
                    <option value="">Tutte le città</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {(search || filterCountry || filterCity) && (
                  <button className="sidebar__reset" onClick={resetFilters}>
                    Rimuovi filtri
                  </button>
                )}
              </div>

              <ul className="sidebar__list">
                {filtered.map((point) => (
                  <li
                    key={point.source === 'client-form' ? `c-${point.id}` : point.id}
                    className={`sidebar__item ${selectedId === point.id ? 'sidebar__item--active' : ''} ${point.source === 'client-form' ? 'sidebar__item--new' : ''}`}
                    onClick={() => handleContactClick(point)}
                  >
                    <div className="sidebar__item-company">{point.company}</div>
                    <div className="sidebar__item-name">
                      {point.firstName} {point.lastName}
                    </div>
                    <div className="sidebar__item-meta">
                      {point.city && <span>{point.city}</span>}
                      {point.city && point.country && <span> &middot; </span>}
                      <span>{point.country}</span>
                    </div>
                    {point.source === 'client-form' && (
                      <span className="sidebar__item-badge">nuovo</span>
                    )}
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="sidebar__empty">Nessun contatto trovato</li>
                )}
              </ul>
            </>
          )}
        </aside>

        {/* MAP */}
        <div className="admin__map-container">
          <MapContainer
            center={[46.0, 13.0]}
            zoom={7}
            className="admin__map"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <FitBounds points={mappable} enabled={fitKey} />
            <MapController flyTo={flyTo} />
            {mappable.map((point) => {
              const isClient = point.source === 'client-form'
              const key = isClient ? `client-${point.id}` : point.id
              return (
                <Marker
                  key={key}
                  position={[point.lat, point.lng]}
                  icon={isClient ? clientIcon : defaultIcon}
                  eventHandlers={{
                    click: () => setSelectedId(point.id)
                  }}
                >
                  <Popup>
                    <MarkerPopup point={point} />
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
