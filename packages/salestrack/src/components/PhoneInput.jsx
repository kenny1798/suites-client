// packages/salestrack/src/components/PhoneInput.jsx
import React from 'react';
import countries from '../data/countries'; // your country.js list
import { cleanPhone } from '../utils/phone';

export default function PhoneInput({ label = 'Phone', value, onChange, required }) {
  const cc = value?.phonecc || '';
  const iso = value?.iso || 'MY';
  const phone = value?.phone || '';

  function handleIsoChange(e) {
    const nextIso = e.target.value;
    const found = countries.find(c => c.isoCode === nextIso);
    onChange?.({
      iso: nextIso,
      phonecc: found?.dialCode || '',
      phone,
    });
  }

  function handlePhoneChange(e) {
    const sanitized = cleanPhone(e.target.value);
    onChange?.({
      iso,
      phonecc: cc,
      phone: sanitized,
    });
  }

  return (
    <label className="space-y-1 w-full">
      <div className="text-sm text-gray-700">
        {label}
      </div>

      {/* Group: country select + phone input “stuck” together */}
      <div className="flex items-center rounded-lg border bg-white overflow-hidden">
        {/* Country selector (compact) */}
        <div className="flex items-center px-2">
          <img
            src={countries.find(c => c.isoCode === iso)?.flag}
            alt={iso}
            className="w-5 h-5 rounded-sm mr-1"
          />
          <select
            value={iso}
            onChange={handleIsoChange}
            className="bg-transparent outline-none text-sm pr-1"
          >
            {countries.map(c => (
              <option key={c.isoCode} value={c.isoCode}>
                {c.isoCode}
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <span className="w-px h-6 bg-gray-200" />

        {/* Phone input */}
        <input
          required={required}
          value={phone}
          onChange={handlePhoneChange}
          placeholder="Phone number"
          className="flex-1 px-3 py-2 outline-none"
        />
      </div>

      {/* Tiny helper text showing dial code (like your screenshot) */}
      {cc && (
        <div className="text-xs text-gray-500 mt-0.5">
          Current dial code: {cc}
        </div>
      )}
    </label>
  );
}
