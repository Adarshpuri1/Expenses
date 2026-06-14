import React, { useEffect } from 'react';
import AppRoutes from './routes';
import { useAuthStore } from './store';

function App() {
  const { fetchCurrentUser, accessToken } = useAuthStore();

  useEffect(() => {
    // Try to fetch current user if token exists
    if (accessToken) {
      fetchCurrentUser();
    }
  }, [accessToken, fetchCurrentUser]);

  return <AppRoutes />;
}

export default App;
