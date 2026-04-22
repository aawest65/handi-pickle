interface PickleballIconProps {
  className?: string;
  size?: number;
}

// Pickleball paddle (rectangular face, short handle) + wiffle ball with holes
export default function PickleballIcon({ className, size = 48 }: PickleballIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-label="Pickleball paddle and ball"
    >
      {/* Paddle face — rounded rectangle, slightly tilted */}
      <g transform="rotate(-30, 50, 50)">
        {/* Paddle face */}
        <rect x="32" y="10" width="36" height="46" rx="14" ry="14" fill="#4ade80" />
        {/* Paddle face inner line detail */}
        <rect x="36" y="14" width="28" height="38" rx="11" ry="11" fill="none" stroke="#166534" strokeWidth="1.5" />
        {/* Handle */}
        <rect x="43" y="55" width="14" height="26" rx="5" ry="5" fill="#92400e" />
        {/* Handle grip wrap lines */}
        <line x1="43" y1="62" x2="57" y2="62" stroke="#78350f" strokeWidth="1.5" />
        <line x1="43" y1="68" x2="57" y2="68" stroke="#78350f" strokeWidth="1.5" />
        <line x1="43" y1="74" x2="57" y2="74" stroke="#78350f" strokeWidth="1.5" />
        {/* Handle end cap */}
        <rect x="43" y="78" width="14" height="3" rx="2" fill="#78350f" />
      </g>

      {/* Wiffle ball — circle with hole pattern */}
      <circle cx="74" cy="72" r="17" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" />
      {/* Holes on the ball */}
      <ellipse cx="68" cy="66" rx="3" ry="2.5" fill="#ca8a04" opacity="0.6" />
      <ellipse cx="78" cy="64" rx="3" ry="2.5" fill="#ca8a04" opacity="0.6" />
      <ellipse cx="72" cy="74" rx="3" ry="2.5" fill="#ca8a04" opacity="0.6" />
      <ellipse cx="81" cy="74" rx="3" ry="2.5" fill="#ca8a04" opacity="0.6" />
      <ellipse cx="66" cy="77" rx="3" ry="2.5" fill="#ca8a04" opacity="0.6" />
      <ellipse cx="75" cy="83" rx="3" ry="2.5" fill="#ca8a04" opacity="0.6" />
    </svg>
  );
}
