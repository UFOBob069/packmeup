import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Link2, Users } from "lucide-react";
import { useAuth } from "../lib/auth";
import { extractJoinToken } from "../lib/share";
import { apiUrl } from "../lib/supabase";

export function JoinTripScreen() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const join = async () => {
    const token = extractJoinToken(input);
    if (!token) {
      setError("Paste a full invite link or token.");
      return;
    }
    if (!session?.access_token) {
      setError("Sign in required.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/mobile/trips/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const payload = (await response.json()) as { tripId?: string; error?: string };
      if (!response.ok || !payload.tripId) {
        throw new Error(payload.error ?? "Could not join trip");
      }
      navigate(`/trips/${payload.tripId}`, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not join trip");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="screen">
      <Link to="/" className="back-link">
        <ArrowLeft size={18} /> Trips
      </Link>

      <section className="workspace-panel join-panel">
        <div className="workspace-panel-heading">
          <Users size={20} />
          <div>
            <h2>Join a trip</h2>
            <p>Paste the invite link someone shared with you</p>
          </div>
        </div>

        <label className="field-label">
          Invite link or token
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://packforvacation.com/trips/join/…"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </label>

        {error && <div className="error-card">{error}</div>}

        <button className="primary-button" disabled={pending || !input.trim()} onClick={() => void join()}>
          <Link2 size={16} />
          {pending ? "Joining…" : "Join trip"}
        </button>
      </section>
    </main>
  );
}
