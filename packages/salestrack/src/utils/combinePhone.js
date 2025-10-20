// packages/salestrack/src/utils/phone.js
export function combinePhone(cc, phone) {
    const ccDigits = String(cc ?? '').replace(/\D+/g, '');      // '60'
    const pDigits  = String(phone ?? '').replace(/\D+/g, '');   // '123456789'
    if (!ccDigits && !pDigits) return { display: null, digits: '' };
    const digits = `${ccDigits}${pDigits}`;                     // '60123456789'
    const display = `${ccDigits ? `+${ccDigits}` : ''}${pDigits}`.trim(); // '+60123456789'
    return { display, digits };
  }
  