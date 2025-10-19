// src/utils/phone.js (atau atas sekali dalam ContactsPage.jsx)
export function cleanPhone(raw) {
    const digitsOnly = String(raw || '').replace(/\D+/g, ''); // tinggalkan digit sahaja
    const noLeadingZeros = digitsOnly.replace(/^0+/, '');     // buang leading zeros
    return noLeadingZeros; // kalau kosong, kembali ''
  }
  