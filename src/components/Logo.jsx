export default function Logo({ compact = false }) {
  return (
    <div className={`logo ${compact ? 'logo--compact' : ''}`}>
      <svg viewBox="0 0 400 120" className="logo-svg">
        {/* Decorative grape vine element */}
        <g transform="translate(30, 20)" opacity="0.85">
          <circle cx="0" cy="0" r="5" fill="#722F37" />
          <circle cx="9" cy="3" r="5" fill="#722F37" />
          <circle cx="-9" cy="3" r="5" fill="#722F37" />
          <circle cx="4.5" cy="11" r="5" fill="#722F37" />
          <circle cx="-4.5" cy="11" r="5" fill="#722F37" />
          <circle cx="0" cy="19" r="5" fill="#722F37" />
          <path d="M0,-5 Q10,-20 5,-30" stroke="#5a6e3a" strokeWidth="1.5" fill="none" />
          <path d="M5,-30 Q15,-25 20,-30 Q15,-35 5,-30" fill="#5a6e3a" opacity="0.7" />
        </g>

        {/* Main text */}
        <text
          x="200"
          y="48"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="36"
          fontWeight="700"
          fill="#722F37"
          letterSpacing="6"
        >
          ANDREA BOEN
        </text>

        {/* Decorative line */}
        <line x1="100" y1="62" x2="300" y2="62" stroke="#C5A572" strokeWidth="1" />

        {/* Subtitle */}
        <text
          x="200"
          y="85"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="18"
          fontWeight="400"
          fill="#C5A572"
          letterSpacing="8"
        >
          Wine Relations
        </text>
      </svg>
    </div>
  )
}
