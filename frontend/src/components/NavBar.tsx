import { Link } from 'react-router-dom';
import '../styles/NavBar.css';

interface NavBarProps {
  onLogout: () => void;
}

export function NavBar({ onLogout }: NavBarProps) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="nav-bar">
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
} 