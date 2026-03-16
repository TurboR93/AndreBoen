// Wine names paired with their Italian origin region
const wineOrigins = [
  { wine: 'Cabernet Sauvignon', origin: 'Veneto',    lat: 45.44, lng: 11.00 },
  { wine: 'Merlot',             origin: 'Friuli',    lat: 46.07, lng: 13.23 },
  { wine: 'Pinot Grigio',       origin: 'Trentino',  lat: 46.07, lng: 11.12 },
  { wine: 'Prosecco',           origin: 'Veneto',    lat: 45.90, lng: 12.00 },
  { wine: 'Amarone',            origin: 'Veneto',    lat: 45.52, lng: 10.97 },
  { wine: 'Barolo',             origin: 'Piemonte',  lat: 44.61, lng: 7.94 },
  { wine: 'Chianti',            origin: 'Toscana',   lat: 43.46, lng: 11.25 },
  { wine: 'Nebbiolo',           origin: 'Piemonte',  lat: 44.70, lng: 8.03 },
  { wine: 'Valpolicella',       origin: 'Veneto',    lat: 45.51, lng: 10.88 },
  { wine: 'Soave',              origin: 'Veneto',    lat: 45.42, lng: 11.25 },
  { wine: 'Franciacorta',       origin: 'Lombardia', lat: 45.60, lng: 10.00 },
  { wine: 'Brunello',           origin: 'Toscana',   lat: 43.06, lng: 11.49 },
  { wine: 'Primitivo',          origin: 'Puglia',    lat: 40.64, lng: 17.94 },
  { wine: 'Vermentino',         origin: 'Sardegna',  lat: 40.83, lng: 9.12 },
  { wine: 'Ribolla Gialla',     origin: 'Friuli',    lat: 45.94, lng: 13.62 },
  { wine: 'Refosco',            origin: 'Friuli',    lat: 45.89, lng: 13.51 },
  { wine: 'Lugana',             origin: 'Lombardia', lat: 45.44, lng: 10.63 },
  { wine: 'Gewürztraminer',     origin: 'Alto Adige',lat: 46.67, lng: 11.35 },
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

export function generateOrders(pointId) {
  const rand = seededRandom(pointId * 137 + 42)
  const count = 3
  const orders = []
  for (let i = 0; i < count; i++) {
    const wo = wineOrigins[Math.floor(rand() * wineOrigins.length)]
    const qty = Math.floor(rand() * 45) + 5
    const status = statuses[Math.floor(rand() * statuses.length)]
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
    const month = months[Math.floor(rand() * 12)]
    const year = rand() > 0.4 ? '2026' : '2025'
    orders.push({
      wine: wo.wine,
      origin: wo.origin,
      originLat: wo.lat,
      originLng: wo.lng,
      qty,
      status,
      date: `${month} ${year}`,
    })
  }
  return orders
}
