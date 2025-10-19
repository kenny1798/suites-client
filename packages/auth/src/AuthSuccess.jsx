import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';
import { apiAuth } from '@suite/api-clients'; // 1. Import apiAuth untuk dapatkan profil

export function AuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, logout } = useAuth(); // 2. Guna 'login', bukan 'loginWithToken'
  const [message, setMessage] = useState('Authenticating, please wait...');

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token');

    const authenticate = async () => {
      try {
        if (!token) {
          throw new Error('No authentication token found in URL.');
        }

        // 3. Simpan token dalam localStorage dulu
        localStorage.setItem('accessToken', token);

        // 4. Guna token tu untuk dapatkan maklumat profil pengguna dari backend
        const profileResponse = await apiAuth.get('/user/profile');
        if (!profileResponse.data) {
          throw new Error('Could not fetch user profile with the provided token.');
        }

        // 5. Sekarang baru panggil fungsi 'login' dengan format objek yang betul
        await login({ token, profile: profileResponse.data });
        
        // Redirect ke dashboard selepas semuanya berjaya
        navigate('/', { replace: true });

      } catch (e) {
        console.error('Auth success failed:', e);
        setMessage(e.message || 'Authentication failed.');
        logout(); // Logout jika ada sebarang masalah
        // (Pilihan) Redirect ke login selepas beberapa saat
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    authenticate();
  }, []); // useEffect ni hanya perlu jalan sekali sahaja

  return <div className="p-4 text-center">{message}</div>;
}