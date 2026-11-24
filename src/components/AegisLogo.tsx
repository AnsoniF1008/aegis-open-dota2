import React from 'react';

interface AegisLogoProps {
  size?: number;
  className?: string;
}

export const AegisLogo: React.FC<AegisLogoProps> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M18 3L31 8.5V17.5C31 25.1 25.4 30.8 18 33C10.6 30.8 5 25.1 5 17.5V8.5L18 3Z"
      fill="#161A22"
      stroke="#D9A441"
      strokeWidth="2"
    />
    <path
      d="M18 7.5L26.5 11.2V17.3C26.5 22.6 22.8 26.8 18 28.5C13.2 26.8 9.5 22.6 9.5 17.3V11.2L18 7.5Z"
      fill="#E23D28"
      fillOpacity="0.18"
      stroke="#E23D28"
      strokeWidth="1.4"
    />
    <path
      d="M18 11L22.5 18L18 25L13.5 18L18 11Z"
      fill="#D9A441"
    />
  </svg>
);

export const DeterministicTicketQr: React.FC<{ code: string; size?: number }> = ({
  code,
  size = 84,
}) => {
  const cells = 9;
  let hash = 2166136261;
  for (let i = 0; i < code.length; i += 1) {
    hash ^= code.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const rects: React.ReactNode[] = [];
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      const isCorner =
        (x < 3 && y < 3) || (x >= cells - 3 && y < 3) || (x < 3 && y >= cells - 3);
      const isCornerCenter =
        (x === 1 && y === 1) || (x === cells - 2 && y === 1) || (x === 1 && y === cells - 2);
      const isCornerBorder =
        isCorner &&
        (x === 0 || x === 2 || x === cells - 3 || x === cells - 1 || y === 0 || y === 2 || y === cells - 3 || y === cells - 1);

      const bitIndex = (y * cells + x) % 31;
      const active = isCorner ? isCornerCenter || isCornerBorder : Boolean((hash >> bitIndex) & 1);

      if (active) {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x * 10 + 4}
            y={y * 10 + 4}
            width="8"
            height="8"
            rx="1.5"
            fill="#F3EFE6"
          />
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cells * 10 + 6} ${cells * 10 + 6}`}
      className="rounded-lg bg-[#0B0D10] p-1 border border-white/10"
      aria-label={`Código visual del ticket ${code}`}
    >
      {rects}
    </svg>
  );
};
