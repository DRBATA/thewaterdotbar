'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

// This component contains the actual logic and uses the client-side hooks.
const UnsubscribeForm = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState('unsubscribing'); // 'unsubscribing', 'success', 'error', 'invalid'
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email) {
      setStatus('invalid');
      return;
    }

    const handleUnsubscribe = async () => {
      try {
        const response = await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const result = await response.json();

        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setError(result.error || 'An unexpected error occurred.');
        }
      } catch (err) {
        setStatus('error');
        setError('Failed to connect to the server.');
      }
    };

    handleUnsubscribe();
  }, [email]);

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>Unsubscribe</h1>
      {status === 'unsubscribing' && <p style={styles.text}>Processing your request...</p>}
      {status === 'success' && (
        <p style={styles.text}>
          You have been successfully unsubscribed. You will no longer receive marketing emails from us.
        </p>
      )}
      {status === 'error' && (
        <p style={{ ...styles.text, ...styles.errorText }}>
          <strong>Error:</strong> {error}
        </p>
      )}
      {status === 'invalid' && (
        <p style={{ ...styles.text, ...styles.errorText }}>
          Invalid unsubscribe link. Please check the URL and try again.
        </p>
      )}
    </div>
  );
};

// The main page component now wraps the client component in Suspense.
const UnsubscribePage = () => {
  return (
    <div style={styles.container}>
      <Suspense fallback={<div style={styles.card}><p style={styles.text}>Loading...</p></div>}>
        <UnsubscribeForm />
      </Suspense>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'sans-serif',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center' as const,
    maxWidth: '500px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  text: {
    fontSize: '16px',
    color: '#374151',
  },
  errorText: {
    color: '#d9534f', // A standard error red color
  },
};
