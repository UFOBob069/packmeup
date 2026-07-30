import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { apiUrl } from "../lib/supabase";

export function AccountScreen() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = confirm.trim().toUpperCase() === "DELETE";

  const deleteAccount = async () => {
    if (!ready || !session?.access_token) return;
    if (
      !window.confirm(
        "Delete your account and all trips you own? This cannot be undone."
      )
    ) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/mobile/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `Could not delete account (${response.status})`);
      }
      await signOut();
      navigate("/", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete account");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="screen">
      <Link to="/" className="back-link">
        <ArrowLeft size={18} /> Trips
      </Link>

      <p className="eyebrow">Account</p>
      <h1>Your account</h1>
      <p className="privacy-intro">
        Signed in as {session?.user.email ?? "your Google account"}.
      </p>

      <section className="workspace-panel danger-panel">
        <div className="workspace-panel-heading">
          <Trash2 size={20} />
          <div>
            <h2>Delete account</h2>
            <p>Permanently remove your account and trips you own</p>
          </div>
        </div>
        <p className="day-plan-hint">
          Type DELETE to confirm. You can also do this on the web at packforvacation.com/account/delete.
        </p>
        <input
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="Type DELETE"
          autoCapitalize="characters"
          autoCorrect="off"
        />
        {error ? <div className="error-card">{error}</div> : null}
        <button
          type="button"
          className="primary-button danger-button"
          disabled={!ready || pending}
          onClick={() => void deleteAccount()}
        >
          {pending ? "Deleting…" : "Delete my account"}
        </button>
      </section>

      <div className="account-links">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms of Service</Link>
        <a href="mailto:partners@packforvacation.com">Support</a>
      </div>
    </main>
  );
}
