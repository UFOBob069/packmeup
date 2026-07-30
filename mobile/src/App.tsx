import { Backpack, LogOut, Luggage, Users } from "lucide-react";
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { AccountScreen } from "./screens/AccountScreen";
import { LibraryScreen } from "./screens/LibraryScreen";
import { JoinTripScreen } from "./screens/JoinTripScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { NewTripScreen } from "./screens/NewTripScreen";
import { PrivacyScreen } from "./screens/PrivacyScreen";
import { TermsScreen } from "./screens/TermsScreen";
import { TripScreen } from "./screens/TripScreen";
import { TripsScreen } from "./screens/TripsScreen";

function LoadingScreen() {
  return (
    <main className="login-screen loading-screen">
      <img className="brand-mark pulse" src="/brand/logo.png" alt="" width={60} height={60} />
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
          <img className="mini-mark" src="/brand/logo.png" alt="" width={32} height={32} />
          <span>PackForVacation.com</span>
        </div>
        <div className="header-actions">
          <Link to="/account" className="text-link">
            Account
          </Link>
          <button className="icon-button" onClick={() => void signOut()} aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<TripsScreen />} />
        <Route path="/new" element={<NewTripScreen />} />
        <Route path="/join" element={<JoinTripScreen />} />
        <Route path="/account" element={<AccountScreen />} />
        <Route path="/privacy" element={<PrivacyScreen backTo="/account" backLabel="Account" />} />
        <Route path="/terms" element={<TermsScreen backTo="/account" backLabel="Account" />} />
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

function SignedOutApp() {
  return (
    <Routes>
      <Route path="/privacy" element={<PrivacyScreen backTo="/" backLabel="Sign in" />} />
      <Route path="/terms" element={<TermsScreen />} />
      <Route path="*" element={<LoginScreen />} />
    </Routes>
  );
}

export default function App() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return <HashRouter>{session ? <SignedInApp /> : <SignedOutApp />}</HashRouter>;
}
