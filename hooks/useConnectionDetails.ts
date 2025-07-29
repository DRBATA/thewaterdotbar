import { useCallback, useEffect, useState } from 'react';
import { ConnectionDetails } from '@/app/api/avatar-connection/route';

export default function useConnectionDetails() {
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(() => {
    setConnectionDetails(null);
    fetch('/api/avatar-connection')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.serverUrl) {
          setConnectionDetails(data);
        } else {
          console.error('Failed to fetch valid connection details:', data);
        }
      })
      .catch((error) => {
        console.error('Error fetching connection details:', error);
      });
  }, []);

  useEffect(() => {
    fetchConnectionDetails();
  }, [fetchConnectionDetails]);

  return { connectionDetails, refreshConnectionDetails: fetchConnectionDetails };
}
