'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'

  useEffect(() => {
    if (!email) {
      setStatus('error');
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          throw new Error('Failed to unsubscribe');
        }

        setStatus('success');
      } catch (error) {
        console.error(error);
        setStatus('error');
      }
    };

    unsubscribe();
  }, [email]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>The Water Bar</h1>
        {
          status === 'loading' && (
            <p style={styles.text}>Unsubscribing you now...</p>
          )
        }
        {
          status === 'success' && (
            <p style={styles.text}>You have been successfully unsubscribed from our marketing emails.</p>
          )
        }
        {
          status === 'error' && (
            <p style={styles.text}>Something went wrong. Please try again or contact support.</p>
          )
        }
      </div>
    </div>
  );
}

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
};
