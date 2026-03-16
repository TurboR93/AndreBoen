import { useState, useCallback } from 'react'
import Logo from './Logo'
import ZoomAnimation from './ZoomAnimation'
import ContactForm from './ContactForm'

export default function ClientLanding({ onLoginClick }) {
  const [animDone, setAnimDone] = useState(
    () => sessionStorage.getItem('zoomSeen') === 'true'
  )
  const [showForm, setShowForm] = useState(false)

  const handleAnimComplete = useCallback(() => {
    setAnimDone(true)
  }, [])

  return (
    <div className="landing">
      {/* Background vineyard image */}
      <div className="landing__bg" />
      <div className="landing__overlay" />

      {/* Zoom animation (only first visit) */}
      {!animDone && <ZoomAnimation onComplete={handleAnimComplete} />}

      {/* Main content */}
      <div className={`landing__content ${animDone ? 'landing__content--visible' : ''}`}>
        <Logo />

        <p className="landing__tagline">
          Colleghiamo i migliori produttori vinicoli italiani con il mondo
        </p>

        <button
          className="btn btn--cta"
          onClick={() => setShowForm(true)}
        >
          Contatta Andrea Boen Wine Relations
        </button>
      </div>

      {/* Contact form modal */}
      {showForm && <ContactForm onClose={() => setShowForm(false)} />}

      {/* Admin access link */}
      <button className="landing__admin-link" onClick={onLoginClick}>
        Area Riservata
      </button>
    </div>
  )
}
