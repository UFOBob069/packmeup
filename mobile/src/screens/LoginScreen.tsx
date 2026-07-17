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
      <div className="login-collage" aria-hidden="true">
        <img
          className="login-photo login-photo-beach"
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80"
          alt=""
        />
        <img
          className="login-photo login-photo-mountain"
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=700&q=80"
          alt=""
        />
        <img
          className="login-photo login-photo-city"
          src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=700&q=80"
          alt=""
        />
        <img
          className="login-photo login-photo-road"
          src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=700&q=80"
          alt=""
        />
      </div>

      <div className="login-content">
        <div className="brand-mark">
          <Luggage size={27} />
        </div>
        <p className="eyebrow">
          <Sparkles size={14} />
          AI-powered packing
        </p>
        <h1>
          PackForVacation<span>.com</span>
        </h1>
        <p className="login-copy">
          Dream about the trip. We&apos;ll remember what to pack.
        </p>
        <button className="primary-button google-button" onClick={signIn} disabled={loading}>
          {loading ? "Opening Google…" : "Continue with Google"}
        </button>
        {error && <p className="error-message">{error}</p>}
        <a className="unsplash-credit" href="https://unsplash.com">
          Travel photos via Unsplash
        </a>
      </div>
    </main>
  );
}
