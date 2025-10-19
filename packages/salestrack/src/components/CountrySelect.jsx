// packages/salestrack/src/components/CountrySelect.jsx
import React from 'react';
import countries from '../data/countries'; // sesuaikan path import anda

export default function CountrySelect({ value = '60', onChange, id, required }) {
  return (
    <label className="space-y-1 w-full">
      <div className="text-sm text-gray-700">Phone Country Code *</div>
      <select
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 bg-white"
      >
        {countries.map((c) => (
          <option key={c.isoCode} value={c.dialCode}>
            +{c.dialCode} — {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
