import { Backpack, Luggage, LogOut, Users } from "lucide-react";
import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { LibraryScreen } from "./screens/LibraryScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { NewTripScreen } from "./screens/NewTripScreen";
import { TripScreen } from "./screens/TripScreen";
import { TripsScreen } from "./screens/TripsScreen";

function LoadingScreen() {
  return (
    <main className="login-screen">
      <div className="brand-mark pulse">
        <Luggage size={30} />
      </div>
      <p>Loading PackForVacation.com…</p>
    </main>
  );
}

function SignedInApp() {
  const { signOut } = useAuth();
  const location = useLocation();
  const showTabs = location.pathname === "/" || ["/gear", "/group"].includes(location.pathname);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="compact-brand">
          <span className="mini-mark">
            <Luggage size={17} />
          </span>
          <span>PackForVacation.com</span>
        </div>
        <button className="icon-button" onClick={() => void signOut()} aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </header>

      <Routes>
        <Route path="/" element={<TripsScreen />} />
        <Route path="/new" element={<NewTripScreen />} />
        <Route path="/trips/:id" element={<TripScreen />} />
        <Route path="/gear" element={<LibraryScreen kind="gear" />} />
        <Route path="/group" element={<LibraryScreen kind="group" />} />
      </Routes>

      {showTabs && (
        <nav className="tab-bar">
          <NavLink to="/" end>
            <Luggage size={21} />
            <span>Trips</span>
          </NavLink>
          <NavLink to="/gear">
            <Backpack size={21} />
            <span>Gear</span>
          </NavLink>
          <NavLink to="/group">
            <Users size={21} />
            <span>Group</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <LoginScreen />;

  return (
    <HashRouter>
      <SignedInApp />
    </HashRouter>
  );
}
