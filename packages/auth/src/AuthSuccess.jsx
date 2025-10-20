// pages/AuthSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';
import { apiAuth } from '@suite/api-clients';

function pickRedirect(location) {
  const qs = new URLSearchParams(location.search);
  let raw = qs.get('redirect') || localStorage.getItem('postLoginRedirect') || '/';
  // sanitize – only same-origin paths
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try { const u = new URL(raw); raw = `${u.pathname}${u.search}${u.hash}`; } catch { raw = '/'; }
  }
  return raw.startsWith('/') ? raw : '/';
}

export function AuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [message, setMessage] = useState('Authenticating, please wait...');

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token');
    const redirectTo = pickRedirect(location);

    (async () => {
      try {
        if (!token) throw new Error('No authentication token found in URL.');

        // store token so apiAuth has it
        localStorage.setItem('accessToken', token);

        // fetch profile using that token
        const profileResponse = await apiAuth.get('/user/profile');
        if (!profileResponse.data) throw new Error('Could not fetch user profile with the provided token.');

        // hydrate app auth
        await login({ token, profile: profileResponse.data });

        // clean & go
        localStorage.removeItem('postLoginRedirect');
        navigate(redirectTo, { replace: true });
      } catch (e) {
        console.error('Auth success failed:', e);
        setMessage(e.message || 'Authentication failed.');
        logout();
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    })();
  }, []); // run once

  return <div className="p-4 text-center">{message}</div>;
}
