import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const DashboardIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="7" height="8" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
    <rect x="13.5" y="12.5" width="7" height="8" rx="1.5" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
  </Icon>
);

export const OrdersIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3.5h12v17l-2.5-1.6-2 1.6-1.5-1.6-1.5 1.6-2-1.6L6 20.500z" />
    <path d="M9 8.500h6M9 12.500h6" />
  </Icon>
);

export const ReturnsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8.500 5 4 9.500 8.500 14" />
    <path d="M4 9.500h10a6 6 0 0 1 0 12h-3" />
  </Icon>
);

export const ProductsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 20 7.500v9L12 21l-8-4.500v-9z" />
    <path d="M4 7.500 12 12l8-4.500M12 12v9" />
  </Icon>
);

export const CategoriesIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.500 12.200V5a1.500 1.500 0 0 1 1.500-1.500h7.200L20.500 11.800a1.500 1.500 0 0 1 0 2.100l-6.600 6.600a1.500 1.500 0 0 1-2.100 0z" />
    <circle cx="8" cy="8" r="1.300" />
  </Icon>
);

export const InventoryIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.500 21 8l-9 4.500L3 8z" />
    <path d="m3 12 9 4.500 9-4.500M3 16l9 4.500 9-4.500" />
  </Icon>
);

export const PurchaseIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="4.500" width="14" height="16" rx="2" />
    <path d="M9 4.500V3.500h6v1M9 10h6M9 14h6M9 17.500h3" />
  </Icon>
);

export const VendorsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9.500 5.500 4h13L20 9.500" />
    <path d="M4 9.500a2.700 2.700 0 0 0 5.300 0 2.700 2.700 0 0 0 5.400 0 2.700 2.700 0 0 0 5.300 0" />
    <path d="M5.500 12.500V20h13v-7.500M10 20v-4.500h4V20" />
  </Icon>
);

export const CouponsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.500 9V6.500A1.500 1.500 0 0 1 5 5h14a1.500 1.500 0 0 1 1.500 1.500V9a3 3 0 0 0 0 6v2.500A1.500 1.500 0 0 1 19 19H5a1.500 1.500 0 0 1-1.500-1.500V15a3 3 0 0 0 0-6z" />
    <path d="m9.500 14.500 5-5" />
    <circle cx="9.700" cy="9.700" r="0.600" />
    <circle cx="14.300" cy="14.300" r="0.600" />
  </Icon>
);

export const ReviewsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 3.500 2.600 5.400 5.900.800-4.300 4.100 1.100 5.900L12 16.900l-5.300 2.800 1.100-5.900L3.500 9.700l5.900-.800z" />
  </Icon>
);

export const DeliveryIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6.500h10.500v10H3zM13.500 10h4l3.500 3.500v3h-7.500" />
    <circle cx="7" cy="17.500" r="1.800" />
    <circle cx="17" cy="17.500" r="1.800" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.500" />
    <path d="m16 16 4.500 4.500" />
  </Icon>
);

export const UsersIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8.500" r="3.500" />
    <path d="M2.500 20a6.500 6.500 0 0 1 13 0M16 5.300a3.500 3.500 0 0 1 0 6.400M18 14.200a6.500 6.500 0 0 1 3.500 5.800" />
  </Icon>
);

export const RupeeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4.500h10M7 9h10M7 4.500h3.500a4.500 4.500 0 0 1 0 9H7l7.500 7" />
  </Icon>
);

export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.500" />
    <path d="M12 7.500V12l3 2" />
  </Icon>
);

export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4 21 19.500H3z" />
    <path d="M12 10v4.500M12 17.200v.100" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.500 12h15M13.500 6l6 6-6 6" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
);

export const SignOutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 4.500h4A1.500 1.500 0 0 1 19.500 6v12a1.500 1.500 0 0 1-1.500 1.500h-4M10 8l-4 4 4 4M6 12h9" />
  </Icon>
);

export const InboxIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.500 13.500 6 5h12l2.500 8.500V18A1.500 1.500 0 0 1 19 19.500H5A1.500 1.500 0 0 1 3.500 18z" />
    <path d="M3.500 13.500H8.500a3.500 3.500 0 0 0 7 0h5" />
  </Icon>
);
