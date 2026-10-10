import React from 'react';

/**
 * High-End 3D Isometric Icons for DINÂMICO PRO
 * Designed with metallic gradients, neon red glow, specular highlights, and isometric depth.
 */

export const BatchStack3DIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-lg ${className}`}
  >
    <defs>
      <linearGradient id="p3d-base" x1="10" y1="20" x2="54" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1f1f28" />
        <stop offset="50%" stopColor="#121217" />
        <stop offset="100%" stopColor="#08080a" />
      </linearGradient>

      <linearGradient id="p3d-red-edge" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ff4668" />
        <stop offset="50%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>

      <linearGradient id="p3d-glass" x1="20" y1="12" x2="48" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
      </linearGradient>

      <filter id="p3d-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Bottom Plaque (Layer 3 - Shadow & Depth) */}
    <g transform="translate(0, 10)">
      <path
        d="M32 10 L54 22 L32 34 L10 22 Z"
        fill="#0d0d10"
        stroke="#27272a"
        strokeWidth="1.5"
      />
      <path
        d="M10 22 L32 34 L32 40 L10 28 Z"
        fill="#08080a"
      />
      <path
        d="M54 22 L32 34 L32 40 L54 28 Z"
        fill="#050507"
      />
    </g>

    {/* Middle Plaque (Layer 2) */}
    <g transform="translate(0, 5)">
      <path
        d="M32 10 L54 22 L32 34 L10 22 Z"
        fill="#141419"
        stroke="#ef4444"
        strokeWidth="1.2"
        strokeOpacity="0.4"
      />
      <path
        d="M10 22 L32 34 L32 39 L10 27 Z"
        fill="#0c0c0f"
      />
      <path
        d="M54 22 L32 34 L32 39 L54 27 Z"
        fill="#09090c"
      />
    </g>

    {/* Top Plaque (Main Layer with 3D Bevel & QR Code) */}
    <g>
      {/* Front Face */}
      <path
        d="M32 8 L55 21 L32 34 L9 21 Z"
        fill="url(#p3d-base)"
        stroke="url(#p3d-red-edge)"
        strokeWidth="1.8"
      />

      {/* Thickness Left */}
      <path
        d="M9 21 L32 34 L32 39 L9 26 Z"
        fill="#b91c1c"
        opacity="0.85"
      />

      {/* Thickness Right */}
      <path
        d="M55 21 L32 34 L32 39 L55 26 Z"
        fill="#991b1b"
      />

      {/* Glossy Reflection Highlight */}
      <path
        d="M32 9 L53 21 L32 33 L11 21 Z"
        fill="url(#p3d-glass)"
      />

      {/* Embedded 3D Dynamic QR Code on Top Plaque */}
      <g transform="translate(24, 15) scale(0.65)" filter="url(#p3d-glow)">
        <rect x="0" y="0" width="24" height="24" rx="4" fill="#ffffff" />
        <rect x="3" y="3" width="7" height="7" fill="#09090b" />
        <rect x="5" y="5" width="3" height="3" fill="#ffffff" />
        <rect x="14" y="3" width="7" height="7" fill="#09090b" />
        <rect x="16" y="5" width="3" height="3" fill="#ffffff" />
        <rect x="3" y="14" width="7" height="7" fill="#09090b" />
        <rect x="5" y="16" width="3" height="3" fill="#ffffff" />
        <rect x="14" y="14" width="3" height="3" fill="#ef4444" />
        <rect x="18" y="14" width="3" height="3" fill="#09090b" />
        <rect x="14" y="18" width="7" height="3" fill="#ef4444" />
      </g>

      {/* NFC Waves Accent Indicator */}
      <path
        d="M45 13 C47 14.5 47 17.5 45 19"
        stroke="#ef4444"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M48 11 C51 13 51 19 48 21"
        stroke="#ff4668"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

export const Layers3DIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 40,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M24 6L42 16L24 26L6 16L24 6Z"
      fill="#1c1c24"
      stroke="#ef4444"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M6 24L24 34L42 24"
      stroke="#dc2626"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 32L24 42L42 32"
      stroke="#991b1b"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const QrCodes3DIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 40,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="6" y="6" width="36" height="36" rx="10" fill="#121217" stroke="#27272a" strokeWidth="2" />
    <rect x="12" y="12" width="10" height="10" rx="3" fill="#ef4444" />
    <rect x="26" y="12" width="10" height="10" rx="3" fill="#ffffff" />
    <rect x="12" y="26" width="10" height="10" rx="3" fill="#ffffff" />
    <rect x="26" y="26" width="4" height="4" fill="#ef4444" />
    <rect x="32" y="26" width="4" height="4" fill="#ffffff" />
    <rect x="26" y="32" width="10" height="4" fill="#ef4444" />
  </svg>
);

export const Export3DIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 40,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="8" y="10" width="32" height="30" rx="6" fill="#121217" stroke="#27272a" strokeWidth="2" />
    <path d="M16 6H32" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M24 18V30M24 30L19 25M24 30L29 25" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const AdminShield3DIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 40,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M24 4L38 9V22C38 31 31.5 39.5 24 44C16.5 39.5 10 31 10 22V9L24 4Z"
      fill="#16161e"
      stroke="#ef4444"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path
      d="M24 16V28M18 22H30"
      stroke="#ffffff"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);
