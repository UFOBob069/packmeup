import { useState } from "react";
import { Luggage, Sparkles } from "lucide-react";
import { useAuth } from "../lib/auth";

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
      <div className="brand-mark">
        <Luggage size={30} />
      </div>
      <p className="eyebrow">
        <Sparkles size={14} />
        AI-powered packing
      </p>
      <h1>PackForVacation.com</h1>
      <p className="login-copy">
        Know exactly what to pack for every traveler, activity, and forecast.
      </p>
      <button className="primary-button google-button" onClick={signIn} disabled={loading}>
        {loading ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && <p className="error-message">{error}</p>}
    </main>
  );
}
