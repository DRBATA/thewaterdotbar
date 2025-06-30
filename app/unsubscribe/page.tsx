import { Suspense } from 'react';
import { UnsubscribeForm } from './unsubscribe-form';

// The main page component is now a pure Server Component.
const UnsubscribePage = () => {
  return (
    <div style={styles.container}>
      <Suspense fallback={<div style={styles.card}><p style={styles.text}>Loading...</p></div>}>
        <UnsubscribeForm />
      </Suspense>
    </div>
  );
};

export default UnsubscribePage;

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'sans-serif',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '500px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '20px',
  },
  text: {
    fontSize: '16px',
    color: '#374151',
  },
};
