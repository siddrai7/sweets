/** Guest orders placed on this device, so they can be found again from "Track order". */
const KEY = 'sweets.guestOrders';

export interface GuestOrderRef {
  orderNumber: string;
  token: string;
  placedAt: string;
}

export function guestOrders(): GuestOrderRef[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as GuestOrderRef[];
  } catch {
    return [];
  }
}

export function rememberGuestOrder(orderNumber: string, token: string) {
  try {
    const rest = guestOrders().filter((o) => o.orderNumber !== orderNumber);
    const next = [{ orderNumber, token, placedAt: new Date().toISOString() }, ...rest].slice(0, 10);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}
