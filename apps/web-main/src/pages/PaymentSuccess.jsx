// Cipta fail baru: src/pages/PaymentSuccess.jsx

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@suite/auth'; // Anggap hang ada hook ni
import {apiAuth} from '@suite/api-clients';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshEntitlements } = useAuth(); // Kita akan bincang pasal ni di bawah

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [error, setError] = useState('');

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setError('No session ID found. Please contact support.');
      return;
    }

    const verifySession = async () => {
      try {
        // Hantar sessionId ke backend untuk pengesahan
        await apiAuth.post('/billing/verify-session', { sessionId });

        // Jika berjaya, kemas kini state dan data pengguna
        setStatus('success');
        
        // PENTING: Panggil fungsi untuk fetch semula data user terkini
        if (refreshEntitlements) {
          await refreshEntitlements(); 
        }

        // Redirect selepas 5 saat
        setTimeout(() => {
          navigate('/'); // Bawa ke dashboard utama
        }, 5000);

      } catch (err) {
        setStatus('error');
        const errorMessage = err.response?.data?.error || 'Payment could not be verified.';
        setError(errorMessage);
      }
    };

    verifySession();
  }, [sessionId, navigate, refreshEntitlements]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <h1 className="text-2xl font-bold mt-4">Verifying Payment...</h1>
            <p className="text-slate-600 mt-2">Please wait, we are confirming your transaction.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mt-4">Payment Successful!</h1>
            <p className="text-slate-600 mt-2">
              Thank you for your subscription. Your access has been granted. You will be redirected shortly.
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mt-4">Verification Failed</h1>
            <p className="text-red-600 mt-2">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}