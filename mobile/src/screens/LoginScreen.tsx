import { useState } from "react";
import {
  CalendarDays,
  CloudRain,
  CloudSun,
  Luggage,
  PawPrint,
  Shirt,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "../lib/auth";

const previewTiles = [
  { icon: Luggage, label: "Packing", detail: "91%" },
  { icon: Shirt, label: "Outfits", detail: "12 looks" },
  { icon: CloudRain, label: "Weather", detail: "Rain Friday" },
  { icon: CalendarDays, label: "Calendar", detail: "3 events" },
  { icon: PawPrint, label: "Andre", detail: "List ready" },
  { icon: Users, label: "Shared", detail: "3 invited" },
  { icon: ShoppingCart, label: "Groceries", detail: "23 items" },
];

export function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in");
      setLoading(false);
    }
  };

  return (
    <main className="login-screen">
      <div className="mobile-hero-copy">
        <p className="eyebrow">
          <Sparkles size={14} />
          AI trip preparation, reimagined
        </p>
        <h1>
          Prepare for <span>every trip.</span>
        </h1>
        <p>
          Packing, weather, plans, people, pets, and everything before departure — together in
          one place.
        </p>
      </div>

      <div className="mobile-workspace-preview" aria-label="Example trip workspace">
        <div className="preview-window-bar">
          <i />
          <i />
          <i />
        </div>
        <div className="preview-cover">
          <img
            src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=82"
            alt=""
          />
          <div className="preview-cover-content">
            <div>
              <strong>Smoky Mountains Cabin</strong>
              <span>July 12–16 · 4 travelers</span>
            </div>
            <span className="preview-weather">
              <CloudSun size={16} /> 82°
            </span>
          </div>
        </div>
        <div className="preview-body">
          <div className="preview-progress">
            <span>91%</span>
            <div>
              <strong>Packing progress</strong>
              <small>You're almost ready to go</small>
            </div>
          </div>
          <div className="preview-grid">
            {previewTiles.map(({ icon: Icon, label, detail }) => (
              <div key={label}>
                <Icon size={15} />
                <strong>{label}</strong>
                <small>{detail}</small>
              </div>
            ))}
          </div>
          <div className="preview-ai-toast">
            <Sparkles size={16} />
            <p>
              <strong>Forecast changed</strong>
              <span>Rain jacket and waterproof boots added.</span>
            </p>
          </div>
        </div>
      </div>

      <div className="login-content product-login-content">
        <div className="brand-mark">
          <Luggage size={27} />
        </div>
        <h2>Start preparing your trip</h2>
        <p className="login-copy">Your personalized workspace is ready in about a minute.</p>
        <button className="primary-button google-button" onClick={signIn} disabled={loading}>
          {loading ? "Opening Google…" : "Continue with Google"}
        </button>
        {error && <p className="error-message">{error}</p>}
      </div>
    </main>
  );
}
