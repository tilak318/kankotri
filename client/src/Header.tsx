import { Link } from 'react-router-dom';
import './App.css'; // Assuming App.css contains global styles or header-specific styles

function Header() {
  return (
    <header className="app-header">
      <Link to="/" className="home-link">
        Home
      </Link>
    </header>
  );
}

export default Header;

