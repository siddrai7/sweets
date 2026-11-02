import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const UserIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
export const BagIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 8h14l-1 13H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);
export const MenuIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const ChevronDown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const ChevronLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);
export const ChevronRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const MinusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);
export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const TrashIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);
export const SunIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const DropIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
  </svg>
);
export const LeafIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z" />
    <path d="M5 19 13 11" />
  </svg>
);
export const HandIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v7c0 4.4-3 8-7 8-2.5 0-4-1.2-5.6-3.4L3 15.2a1.6 1.6 0 0 1 2.5-2L8 15" />
  </svg>
);
export const TruckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);
export const ShieldIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const PhoneIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);
export const MailIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
export const PinIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const QuoteIcon = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M9.5 6C6.5 7 4 9.8 4 13.5V18h6v-6H7c0-2 1.2-3.6 3.2-4.4L9.5 6Zm10 0c-3 1-5.5 3.8-5.5 7.5V18h6v-6h-3c0-2 1.2-3.6 3.2-4.4L19.5 6Z" />
  </svg>
);
export const InstagramIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
);
export const FacebookIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" />
  </svg>
);

/** Indian food-safety veg mark: green dot in a green square. */
export function VegMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-label="Vegetarian" role="img">
      <rect
        x="0.75"
        y="0.75"
        width="12.5"
        height="12.5"
        rx="1.5"
        fill="none"
        stroke="#15803d"
        strokeWidth="1.5"
      />
      <circle cx="7" cy="7" r="3.2" fill="#15803d" />
    </svg>
  );
}
