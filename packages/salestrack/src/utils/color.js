// packages/salestrack/src/utils/color.js
export function getContrastingTextColor(hex) {
    if (!hex) return '#111827'; // gray-900 fallback
    let c = hex.trim();
    if (c.startsWith('#')) c = c.slice(1);
    if (c.length === 3) c = c.split('').map(ch => ch + ch).join(''); // e.g. #abc
    if (c.length !== 6) return '#111827';
  
    const r = parseInt(c.slice(0,2), 16);
    const g = parseInt(c.slice(2,4), 16);
    const b = parseInt(c.slice(4,6), 16);
  
    // relative luminance
    const srgb = [r,g,b].map(v=>{
      const x = v/255;
      return x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4);
    });
    const L = 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
  
    return L > 0.5 ? '#111827' : '#FFFFFF'; // light bg -> dark text, else white
  }
  