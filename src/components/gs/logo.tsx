export function GreenShieldMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="GreenShield logo">
      <defs>
        <linearGradient id="gs-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="0.55" stopColor="#10b981" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#062b23" />
      <path d="M32 9 51 16v15c0 12-8 19.5-19 24C21 50.5 13 43 13 31V16z" fill="url(#gs-mark)" />
      <path d="M40 22c0 11-6.5 17-16 18.5 0-11 6.5-17 16-18.5z" fill="#062b23" opacity="0.92" />
      <path
        d="M22.5 44c3-8 8.5-14 17.5-22"
        stroke="#062b23"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.92"
      />
    </svg>
  );
}
