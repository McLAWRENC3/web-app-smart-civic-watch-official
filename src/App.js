import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './assets/styles/theme';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Dashboard from './pages/dashboard/Dashboard';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import LoginSignup from './pages/LoginSignup';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Debug logging
      console.log('Auth state changed. User:', user);
      if (user) {
        console.log('User is logged in. Redirecting to dashboard...');
      } else {
        console.log('No user found. Redirecting to auth...');
      }
    });

    return () => unsubscribe();
  }, []);

  // Debug logging for current state
  console.log('Current state - loading:', loading, 'user:', user);

  if (loading) {
    console.log('Showing loading state...');
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: theme.palette.background.default
        }}>
          <p>Loading application...</p>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Auth route - only accessible when not logged in */}
        <Route 
          path="/auth" 
          element={!user ? <LoginSignup /> : <Navigate to="/dashboard" replace />} 
        />

        {/* Protected routes - only accessible when logged in */}
        <Route 
          path="/*" 
          element={
            user ? (
              <div style={{ display: 'flex' }}>
                <Sidebar collapsed={collapsed} />
                <main
                  style={{
                    flexGrow: 1,
                    padding: '24px',
                    marginLeft: collapsed ? '80px' : '250px',
                    transition: 'margin-left 0.3s ease',
                    backgroundColor: '#f5f5f5',
                    minHeight: '100vh',
                  }}
                >
                  <Topbar onMenuClick={() => setCollapsed(!collapsed)} />
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Root redirect */}
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} 
        />
      </Routes>
    </ThemeProvider>
  );
}