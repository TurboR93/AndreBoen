import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import MarkerPopup from './MarkerPopup'
import Logo from './Logo'
import { initialPoints } from '../data/points'
import { generateOrders } from '../data/orders'

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

function generateArc(from, to, segments = 40) {
  const points = []
  const dx = to.lng - from.lng
  const dy = to.lat - from.lat
  const dist = Math.sqrt(dx * dx + dy * dy)
  const bulge = Math.min(dist * 0.3, 25)

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const lat = from.lat + dy * t
    const lng = from.lng + dx * t
    const arc = Math.sin(t * Math.PI) * bulge
    const nx = -dy / dist
    const ny = dx / dist
    points.push([lat + nx * arc, lng + ny * arc])
  }
  return points
}

const statusColors = {
  delivered: '#2e7d32',
  transit: '#e65100',
  preparing: '#1565c0',
}

export default function AdminMap({ onLogout, user }) {
  const [clientContacts, setClientContacts] = useState([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [flyTo, setFlyTo] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [fitKey, setFitKey] = useState(0)
  const [mobileView, setMobileView] = useState('list')

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

  const mappable = useMemo(
    () => filtered.filter(p => p.lat && p.lng),
    [filtered]
  )

  const arcs = useMemo(() => {
    const result = []
    mappable.forEach(point => {
      const orders = generateOrders(point.id)
      orders.forEach((order, i) => {
        const from = { lat: order.originLat, lng: order.originLng }
        const to = { lat: point.lat, lng: point.lng }
        const dx = Math.abs(from.lat - to.lat) + Math.abs(from.lng - to.lng)
        if (dx < 0.5) return // skip arcs too short (same area)
        result.push({
          key: `${point.id}-${i}`,
          positions: generateArc(from, to),
          color: statusColors[order.status.cls],
          to,
        })
      })
    })
    return result
  }, [mappable]
  )

  // Fit bounds when filters change
  useEffect(() => {
    setFitKey(k => k + 1)
    setSelectedId(null)
    setFlyTo(null)
  }, [search])

  const handleContactClick = (point) => {
    setSelectedId(point.id)
    if (point.lat && point.lng) {
      setFlyTo({ lat: point.lat, lng: point.lng, _ts: Date.now() })
      setMobileView('map')
    }
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

      {/* Mobile tab bar */}
      <div className="mobile-tabs">
        <button
          className={`mobile-tabs__btn ${mobileView === 'list' ? 'mobile-tabs__btn--active' : ''}`}
          onClick={() => setMobileView('list')}
        >
          Contatti
        </button>
        <button
          className={`mobile-tabs__btn ${mobileView === 'map' ? 'mobile-tabs__btn--active' : ''}`}
          onClick={() => setMobileView('map')}
        >
          Mappa
        </button>
      </div>

      <div className="admin__body">
        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar--collapsed'} ${mobileView === 'map' ? 'sidebar--mobile-hidden' : ''}`}>
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
                  {(() => {
                    const newCount = allPoints.filter(p => p.source === 'client-form').length
                    return newCount > 0 && (
                      <span className="sidebar__stat sidebar__stat--new">
                        {newCount} nuovi
                      </span>
                    )
                  })()}
                </div>
              </div>

              <div className="sidebar__filters">
                <input
                  type="text"
                  className="sidebar__search"
                  placeholder="Cerca nome, azienda, città, paese..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="sidebar__reset" onClick={() => setSearch('')}>
                    Rimuovi filtro
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
        <div className={`admin__map-container ${mobileView === 'list' ? 'map--mobile-hidden' : ''}`}>
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
            {/* Arc lines */}
            {arcs.map((arc) => (
              <Polyline
                key={arc.key}
                positions={arc.positions}
                pathOptions={{
                  color: arc.color,
                  weight: 1.5,
                  opacity: 0.4,
                  dashArray: '6 4',
                }}
              />
            ))}
            {/* Contact markers */}
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
                  <Popup maxWidth={420} minWidth={220}>
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
