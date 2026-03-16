import { useState } from 'react'

const wines = [
  'Cabernet Sauvignon', 'Merlot', 'Pinot Grigio', 'Prosecco',
  'Amarone', 'Barolo', 'Chianti', 'Nebbiolo', 'Valpolicella',
  'Soave', 'Franciacorta', 'Brunello', 'Primitivo', 'Vermentino',
  'Ribolla Gialla', 'Refosco', 'Lugana', 'Gewürztraminer'
]

const destinations = [
  'Germania', 'USA', 'UK', 'Giappone', 'Canada',
  'Svizzera', 'Francia', 'Danimarca', 'Svezia', 'Australia',
  'Brasile', 'Cina', 'Corea del Sud', 'Norvegia', 'Belgio'
]

const statuses = [
  { label: 'Consegnato', cls: 'delivered' },
  { label: 'In transito', cls: 'transit' },
  { label: 'In preparazione', cls: 'preparing' },
]

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 7) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateOrders(pointId) {
  const rand = seededRandom(pointId * 137 + 42)
  const count = 3
  const orders = []
  for (let i = 0; i < count; i++) {
    const wine = wines[Math.floor(rand() * wines.length)]
    const qty = Math.floor(rand() * 45) + 5
    const dest = destinations[Math.floor(rand() * destinations.length)]
    const status = statuses[Math.floor(rand() * statuses.length)]
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
    const month = months[Math.floor(rand() * 12)]
    const year = rand() > 0.4 ? '2026' : '2025'
    orders.push({ wine, qty, dest, status, date: `${month} ${year}` })
  }
  return orders
}

export default function MarkerPopup({ point }) {
  const [expanded, setExpanded] = useState(false)
  const orders = generateOrders(point.id)

  return (
    <div className={`marker-popup ${expanded ? 'marker-popup--expanded' : ''}`}>
      {/* Main card */}
      <div
        className={`marker-popup__card ${expanded ? 'marker-popup__card--compact' : ''}`}
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
      >
        <h3 className="marker-popup__company">{point.company}</h3>
        {!expanded && (
          <>
            <div className="marker-popup__divider" />
            <div className="marker-popup__detail">
              <span className="marker-popup__label">Nome:</span>
              <span>{point.firstName} {point.lastName}</span>
            </div>
            <div className="marker-popup__detail">
              <span className="marker-popup__label">Ruolo:</span>
              <span>{point.role}</span>
            </div>
            <div className="marker-popup__detail">
              <span className="marker-popup__label">Tel:</span>
              <span>{point.phone}</span>
            </div>
            <div className="marker-popup__detail">
              <span className="marker-popup__label">Email:</span>
              <span>{point.email}</span>
            </div>
            {point.city && (
              <div className="marker-popup__detail">
                <span className="marker-popup__label">Città:</span>
                <span>{point.city}</span>
              </div>
            )}
            {point.country && (
              <div className="marker-popup__detail">
                <span className="marker-popup__label">Paese:</span>
                <span>{point.country}</span>
              </div>
            )}
          </>
        )}
        {expanded && (
          <div className="marker-popup__contact-line">
            {point.firstName} {point.lastName} &middot; {point.city || point.country}
          </div>
        )}
        {point.source === 'client-form' && (
          <div className="marker-popup__badge">Nuovo contatto</div>
        )}
        <div className="marker-popup__expand-hint">
          {expanded ? 'chiudi ordini' : 'mostra ordini export'}
        </div>
      </div>

      {/* Branching orders */}
      {expanded && (
        <div className="marker-popup__branch">
          {/* Tree connector */}
          <div className="marker-popup__trunk" />
          <div className="marker-popup__branches">
            <div className="marker-popup__branch-line marker-popup__branch-line--left" />
            <div className="marker-popup__branch-line marker-popup__branch-line--center" />
            <div className="marker-popup__branch-line marker-popup__branch-line--right" />
          </div>

          {/* Order cards */}
          <div className="marker-popup__orders">
            {orders.map((order, i) => (
              <div key={i} className="order-card">
                <div className={`order-card__status order-card__status--${order.status.cls}`}>
                  {order.status.label}
                </div>
                <div className="order-card__wine">{order.wine}</div>
                <div className="order-card__qty">{order.qty} bancali</div>
                <div className="order-card__meta">
                  <span>{order.dest}</span>
                  <span>{order.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
