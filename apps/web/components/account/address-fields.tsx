'use client';

import type { AddressInput, SavedAddress } from '@sweets/types';

export const emptyAddress: AddressInput = {
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

/** Name, mobile and postal address inputs with the right autofill hints. */
export function AddressFields({
  value,
  onChange,
  withContact = true,
}: {
  value: AddressInput;
  onChange: (v: AddressInput) => void;
  /** Off when name and mobile are asked for elsewhere (guest checkout). */
  withContact?: boolean;
}) {
  const field = (
    key: keyof AddressInput,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-cocoa-soft">{label}</span>
      <input
        {...props}
        value={value[key] ?? ''}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        className="input-field"
      />
    </label>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {withContact && field('name', 'Full name', { required: true, autoComplete: 'name' })}
      {withContact &&
        field('phone', 'Mobile number', { required: true, inputMode: 'tel', autoComplete: 'tel' })}
      <div className="sm:col-span-2">
        {field('line1', 'Flat, building, street', {
          required: true,
          autoComplete: 'address-line1',
        })}
      </div>
      <div className="sm:col-span-2">
        {field('line2', 'Landmark (optional)', { autoComplete: 'address-line2' })}
      </div>
      {field('pincode', 'Pincode', {
        required: true,
        inputMode: 'numeric',
        pattern: '\\d{6}',
        maxLength: 6,
        title: '6-digit pincode',
        autoComplete: 'postal-code',
      })}
      {field('city', 'City', { required: true, autoComplete: 'address-level2' })}
      <div className="sm:col-span-2">
        {field('state', 'State', { required: true, autoComplete: 'address-level1' })}
      </div>
    </div>
  );
}

/** One-line summary of an address, e.g. for a picker. */
export function addressLines(
  a: Pick<SavedAddress, 'line1' | 'line2' | 'city' | 'state' | 'pincode'>,
) {
  return [a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).join(', ');
}

export const toAddressInput = (a: SavedAddress): AddressInput => ({
  name: a.name,
  phone: a.phone,
  line1: a.line1,
  line2: a.line2 ?? '',
  city: a.city,
  state: a.state,
  pincode: a.pincode,
});
