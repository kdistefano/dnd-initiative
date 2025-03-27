import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { EncounterList } from './pages/EncounterList';
import { EncounterEdit } from './pages/EncounterEdit';
import { EncounterRun } from './pages/EncounterRun';
import { EncounterPrepare } from './pages/EncounterPrepare';
import { NavBar } from './components/NavBar';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const handleLogin = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {token && <NavBar onLogout={handleLogout} />}
        <Routes>
          <Route
            path="/login"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/"
            element={
              token ? (
                <EncounterList />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/encounters/new"
            element={
              token ? (
                <EncounterEdit />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/encounters/:id/edit"
            element={
              token ? (
                <EncounterEdit />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/encounters/:id/prepare"
            element={
              token ? (
                <EncounterPrepare token={token} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/encounters/:id/run"
            element={
              token ? (
                <EncounterRun />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 