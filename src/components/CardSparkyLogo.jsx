export default function CardSparkyLogo({ size = 36, onDark = true }) {
  const back   = onDark ? 'rgba(255,255,255,0.18)' : '#c7d2f0'
  const mid    = onDark ? 'rgba(255,255,255,0.30)' : '#9baedd'
  const stroke = onDark ? 'rgba(255,255,255,0.12)' : 'rgba(27,42,107,0.2)'

  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* Back card */}
      <g transform="rotate(-12, 15, 21)">
        <rect x="5" y="8" width="18" height="24" rx="2.5" fill={back} stroke={stroke} strokeWidth="0.75" />
      </g>

      {/* Middle card */}
      <g transform="rotate(-5, 15, 21)">
        <rect x="5" y="8" width="18" height="24" rx="2.5" fill={mid} stroke={stroke} strokeWidth="0.75" />
      </g>

      {/* Front card base — white */}
      <rect x="5" y="8" width="18" height="24" rx="2.5" fill="white" stroke="rgba(27,42,107,0.18)" strokeWidth="0.75" />

      {/* 1. Navy header band */}
      <rect x="5" y="8" width="18" height="7" rx="0" fill="#1b2a6b" />
      {/* clip top corners to match card radius */}
      <rect x="5" y="8" width="18" height="2.5" rx="2.5" fill="#1b2a6b" />
      {/* header lines in white */}
      <rect x="8" y="11"  width="12" height="1.2" rx="0.6" fill="rgba(255,255,255,0.8)" />
      <rect x="8" y="13.2" width="8"  height="1"   rx="0.5" fill="rgba(255,255,255,0.45)" />

      {/* 2. Photo area — light gray rectangle */}
      <rect x="7" y="16" width="14" height="10" rx="1" fill="#e8edf5" />
      {/* CS initials centered in photo area — suggesting player silhouette */}
      <text
        x="14" y="24"
        textAnchor="middle"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800"
        fontSize="7.5"
        letterSpacing="-0.3"
        fill="#1b2a6b"
        opacity="0.7"
      >CS</text>

      {/* 3. Navy name plate at bottom */}
      <rect x="5" y="26" width="18" height="6" rx="0" fill="#1b2a6b" />
      {/* clip bottom corners */}
      <rect x="5" y="28.5" width="18" height="2.5" rx="2.5" fill="#1b2a6b" />
      {/* name plate text line */}
      <rect x="8" y="27.5" width="10" height="1" rx="0.5" fill="rgba(255,255,255,0.6)" />
      <rect x="8" y="29.5" width="7"  height="0.8" rx="0.4" fill="rgba(255,255,255,0.35)" />

      {/* 5. Foil corner accent — amber triangle bottom-right */}
      <path d="M20 29 L23 26 L23 32 Z" fill="#f59e0b" opacity="0.85" />

      {/* Amber spark — top-right corner */}
      <g transform="translate(19, 3)">
        <ellipse cx="4.5" cy="5" rx="4.5" ry="4.5" fill="rgba(245,158,11,0.20)" />
        <path d="M5.5 1 L3 5.5 H5.5 L2.5 10.5 L8.5 4.5 H6 L7.5 1 Z" fill="#f59e0b" />
        <line x1="4.5" y1="-0.5" x2="4.5" y2="-2"   stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
        <line x1="8"   y1="1"    x2="9.2"  y2="-0.2" stroke="#f59e0b" strokeWidth="1"   strokeLinecap="round" opacity="0.6" />
        <line x1="1"   y1="1"    x2="-0.2" y2="-0.2" stroke="#f59e0b" strokeWidth="1"   strokeLinecap="round" opacity="0.6" />
      </g>

    </svg>
  )
}
