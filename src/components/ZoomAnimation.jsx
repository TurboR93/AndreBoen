import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import italyGeo from '../data/italy-geo.json'

export default function ZoomAnimation({ onComplete }) {
  const [phase, setPhase] = useState('idle')
  const [fading, setFading] = useState(false)
  const mapRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (sessionStorage.getItem('zoomSeen')) {
      setPhase('done')
      onComplete()
      return
    }
    setPhase('zooming')
  }, [onComplete])

  useEffect(() => {
    if (phase !== 'zooming') return
    if (!containerRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
      zoomAnimation: true,
      fadeAnimation: true,
    }).setView([20, 0], 2)

    mapRef.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
    }).addTo(map)

    // HD Italy overlay
    L.geoJSON(italyGeo, {
      style: {
        color: '#C5A572',
        weight: 2.5,
        fillColor: '#722F37',
        fillOpacity: 0.5,
        opacity: 1,
      }
    }).addTo(map)

    // Quick flyTo Italy — fast transition to minimize pixelation
    const t1 = setTimeout(() => {
      map.flyTo([42.0, 12.5], 6, {
        duration: 1.8,
        easeLinearity: 0.2,
      })
    }, 500)

    // Fade out after holding on Italy
    const t2 = setTimeout(() => setFading(true), 4000)

    const t3 = setTimeout(() => {
      setPhase('done')
      sessionStorage.setItem('zoomSeen', 'true')
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      onComplete()
    }, 4700)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [phase, onComplete])

  if (phase === 'done') return null

  return (
    <div className={`zoom-overlay ${fading ? 'zoom-overlay--fading' : ''}`}>
      <div className="zoom-map-container" ref={containerRef} />
      <div className="zoom-text">
        <span className="zoom-text-line">Wine connects the world</span>
      </div>
    </div>
  )
}
