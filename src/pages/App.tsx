import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';

// Placeholder for your actual Dashboard component
// TODO: Import your existing Dashboard component here. 
// Example: import Dashboard from './pages/Dashboard';
const Dashboard = () => {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Main Dashboard</h1>
      <p>Welcome to the unified project.</p>
      
      <div style={{ marginTop: '2rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Quick Links</h3>
        <ul style={{ lineHeight: '2rem' }}>
          <li><a href="/login" style={{ color: 'blue' }}>Login Page</a></li>
          {/* Update these links to point to your actual CRM routes */}
          <li><a href="/crm/dashboard" style={{ color: 'blue' }}>CRM Dashboard</a></li>
          <li><a href="/crm/calls" style={{ color: 'blue' }}>CRM Calls</a></li>
        </ul>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        
        {/* Add your CRM routes here, e.g.: */}
        {/* <Route path="/crm/dashboard" element={<CrmDashboard />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;