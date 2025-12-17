import React from 'react'

export default function Logo({ variant = 'default', size = 'medium' }) {
  const sizeMap = {
    small: { width: 32, height: 32, fontSize: '0.75rem' },
    medium: { width: 40, height: 40, fontSize: '0.9rem' },
    large: { width: 64, height: 64, fontSize: '1.2rem' },
    xl: { width: 96, height: 96, fontSize: '1.8rem' },
  }

  const dimensions = sizeMap[size] || sizeMap.medium
  const gradientId = `logo-${variant}-${size}`

  const LogoIcon = () => (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-icon"
    >
      {/* Eagle head - simplified flat design */}
      <path
        d="M8 12C8 10 10 8 12 8C14 8 16 10 16 12C16 14 14 16 12 16C10 16 8 14 8 12Z"
        fill={`url(#eagleGradient-${gradientId})`}
      />
      {/* Eye with glow */}
      <circle cx="11" cy="11" r="2" fill="#A855F7" />
      <circle cx="11" cy="11" r="1" fill="#FFFFFF" />
      {/* Sparkle above eye */}
      <circle cx="11" cy="8" r="1.5" fill="#FFFFFF" opacity="0.9" />
      {/* Beak */}
      <path d="M14 12L16 13L14 14Z" fill="#E5E7EB" />
      {/* Wing - simplified layered feathers */}
      <path
        d="M18 10C20 8 24 10 26 14C24 12 22 10 20 10C19 10 18.5 10 18 10Z"
        fill={`url(#wingGradient1-${gradientId})`}
      />
      <path
        d="M20 12C22 10 26 12 28 16C26 14 24 12 22 12C21 12 20.5 12 20 12Z"
        fill={`url(#wingGradient2-${gradientId})`}
      />
      <path
        d="M22 14C24 12 28 14 30 18C28 16 26 14 24 14C23 14 22.5 14 22 14Z"
        fill={`url(#wingGradient3-${gradientId})`}
      />
      {/* Gradients */}
      <defs>
        <linearGradient id={`eagleGradient-${gradientId}`} x1="8" y1="8" x2="16" y2="16">
          <stop offset="0%" stopColor="#E5E7EB" />
          <stop offset="100%" stopColor="#D1D5DB" />
        </linearGradient>
        <linearGradient id={`wingGradient1-${gradientId}`} x1="18" y1="10" x2="26" y2="14">
          <stop offset="0%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id={`wingGradient2-${gradientId}`} x1="20" y1="12" x2="28" y2="16">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
        <linearGradient id={`wingGradient3-${gradientId}`} x1="22" y1="14" x2="30" y2="18">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#E9D5FF" />
        </linearGradient>
      </defs>
    </svg>
  )

  if (variant === 'icon-only') {
    return <LogoIcon />
  }

  return (
    <div className={`logo-container logo-${size}`} style={{ fontSize: dimensions.fontSize }}>
      <LogoIcon />
      <span className="logo-text" style={{ fontSize: dimensions.fontSize }}>
        INNOCRAWL
      </span>
    </div>
  )
}

