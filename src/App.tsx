import React from 'react';
import './index.css';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';

// Import actual CRM components
// @ts-ignore
import UserLevel from './pages/UserLevelFlow.jsx';
// @ts-ignore
import ApplicationLevel from './pages/ApplicationLevelFlow.jsx';
// @ts-ignore
import MyActivity from './pages/MyActivity.jsx';
// @ts-ignore
import * as DashboardModule from './pages/Dashboard';

// Handle both default and named exports for Dashboard
const Dashboard = DashboardModule.default || DashboardModule.Dashboard || (() => <div style={{padding: 20}}>Error: Dashboard component not found in export.</div>);

// Safe AuthProvider wrapper that renders children even if AuthProvider is missing/undefined
const SafeAuthProvider = ({ children }: { children: any }) => <>{children}</>;

// Set the global base URL for axios to point to your backend
axios.defaults.baseURL = 'https://main-crm-backend.onrender.com';
// axios.defaults.baseURL = 'http://localhost:4000';

// Protected Route Component
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Error Boundary to catch crashes (like missing Contexts)
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#dc2626', backgroundColor: '#fee2e2', margin: '1rem', borderRadius: '8px' }}>
          <h2 style={{marginTop: 0}}>Something went wrong loading this component.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Layout component to provide consistent Navigation across all pages
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
  };

  const getButtonStyle = (path: string) => {
    const isActive = location.pathname === path;
    return {
      backgroundColor: isActive ? '#2563eb' : 'white',
      color: isActive ? 'white' : '#374151',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      border: isActive ? 'none' : '1px solid #d1d5db',
      cursor: 'pointer',
      textDecoration: 'none',
      fontWeight: 500,
    };
  };

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
      <header style={{ 
        backgroundColor: 'white',
        borderBottom: '1px solid #eee', 
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 10, color: '#111827' }}>KOVON Dashboard</h1>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button style={getButtonStyle('/')}>
              Dashboard
            </button>
          </Link>
          <Link to="/crm/user-level" style={{ textDecoration: 'none' }}>
            <button style={getButtonStyle('/crm/user-level')}>
              User Level
            </button>
          </Link>
          <Link to="/crm/application-level" style={{ textDecoration: 'none' }}>
            <button style={getButtonStyle('/crm/application-level')}>
              Application Level
            </button>
          </Link>
          <Link to="/crm/my-activity" style={{ textDecoration: 'none' }}>
            <button style={getButtonStyle('/crm/my-activity')}>
              My Activity
            </button>
          </Link>
          <button 
            onClick={handleLogout}
            style={{ backgroundColor: '#dc2626', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </header>
      
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout>
              <ErrorBoundary>
                <SafeAuthProvider>
                  <Dashboard />
                </SafeAuthProvider>
              </ErrorBoundary>
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/crm/user-level" element={<PrivateRoute><Layout><UserLevel /></Layout></PrivateRoute>} />
        <Route path="/crm/application-level" element={<PrivateRoute><Layout><ApplicationLevel /></Layout></PrivateRoute>} />
        <Route path="/crm/my-activity" element={<PrivateRoute><Layout><MyActivity /></Layout></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;