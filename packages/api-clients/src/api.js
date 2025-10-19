import axios from 'axios';

// 1. Dapatkan URL API dari environment variables
//    Untuk Vite, ia guna VITE_...
const API_URL = import.meta.env.VITE_SERVER || 'https://localhost:3001/api';

// 2. Cipta satu 'instance' axios dengan konfigurasi asas
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. INTERCEPTOR REQUEST (Paling Penting)
//    Kod ni akan berjalan SEBELUM setiap request dihantar.
api.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage (atau di mana saja hang simpan)
    const token = localStorage.getItem('accessToken');
    
    // Jika token wujud, masukkan dalam header Authorization
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Kalau ada error masa nak set up request, hantar error tu
    return Promise.reject(error);
  }
);

// 4. INTERCEPTOR RESPONSE (Bonus untuk Error Handling)
//    Kod ni akan berjalan SELEPAS setiap response diterima.
api.interceptors.response.use(
  // Kalau response berjaya (status 2xx), pulangkan saja response tu
  (response) => response,
  
  // Kalau response gagal (status 4xx, 5xx), kita boleh handle di sini
  (error) => {
    // Cek jika error tu sebab token tak sah (Unauthorized)
    if (error.response && error.response.status === 401) {
      // Token tak sah atau dah expired!
      console.error("Unauthorized! Logging out.");
      
      // Buang token yang tak sah dari simpanan
      localStorage.removeItem('accessToken');
      
      // Redirect pengguna ke laman login
      // (Cara paling simple, tak perlukan react-router)
      window.location.href = '/login';
    }
    
    // Untuk semua error lain, pulangkan saja supaya komponen boleh handle
    return Promise.reject(error);
  }
);

export default api;