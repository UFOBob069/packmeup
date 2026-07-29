import { useEffect, useRef, useState } from "react";
import { Plus, Send, Sparkles } from "lucide-react";
import { useAuth } from "../lib/auth";
import { apiUrl, supabase } from "../lib/supabase";
import type { ChatMessage, PackingCategory } from "../types";

interface Suggestion {
  item_name: string;
  quantity: number;
  category: PackingCategory;
  shared: boolean;
  traveler_name: string | null;
}

interface PackingHelpPanelProps {
  tripId: string;
  onItemsChanged: () => Promise<void> | void;
}

const PROMPTS = [
  "Am I missing anything?",
  "Make this fit in a carry-on",
  "Add a golf day",
  "Reduce overpacking",
];

export function PackingHelpPanel({ tripId, onItemsChanged }: PackingHelpPanelProps) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion[]>>({});
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("trip_id", tripId)
      .eq("channel", "ai")
      .order("created_at");
    setMessages((data ?? []) as ChatMessage[]);
  };

  useEffect(() => {
    void load();
  }, [tripId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending || !session?.access_token) return;
    setPending(true);
    setError(null);
    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        trip_id: tripId,
        user_id: session.user.id,
        role: "user",
        content: trimmed,
        channel: "ai",
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch(`${apiUrl}/api/mobile/trips/${tripId}/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });
      const payload = (await response.json()) as {
        message?: string;
        suggestions?: Suggestion[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Packing Help failed");

      await load();
      if (payload.message) {
        const assistantId = `assist-${Date.now()}`;
        setSuggestions((prev) => ({ ...prev, [assistantId]: payload.suggestions ?? [] }));
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => !m.id.startsWith("temp-"));
          return [
            ...withoutTemp,
            {
              id: assistantId,
              trip_id: tripId,
              user_id: null,
              role: "assistant",
              content: payload.message!,
              channel: "ai",
              created_at: new Date().toISOString(),
            },
          ];
        });
      }
      await onItemsChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Packing Help failed");
      await load();
    } finally {
      setPending(false);
    }
  };

  const addSuggestion = async (suggestion: Suggestion) => {
    const { error: insertError } = await supabase.from("packing_items").insert({
      trip_id: tripId,
      item_name: suggestion.item_name,
      category: suggestion.category,
      quantity: suggestion.quantity,
      packed: false,
      shared: suggestion.shared,
      user_id: session?.user.id ?? null,
      traveler_id: null,
      sort_order: 999,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    await onItemsChanged();
  };

  return (
    <section className="chat-panel help-panel">
      <div className="chat-panel-header">
        <Sparkles size={18} />
        <div>
          <strong>Packing Help</strong>
          <small>Ask for gear ideas — tap to add suggestions</small>
        </div>
      </div>

      <div className="chat-panel-body" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <Sparkles size={28} />
            <p>Ask about carry-on limits, activities, pets, or missing items.</p>
            <div className="prompt-chips">
              {PROMPTS.map((prompt) => (
                <button key={prompt} type="button" onClick={() => void send(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.role === "user" ? "mine" : ""}`}>
            <small>{msg.role === "user" ? "You" : "Packing expert"}</small>
            <p>{msg.content}</p>
            {msg.role === "assistant" && suggestions[msg.id]?.length ? (
              <div className="suggestion-chips">
                {suggestions[msg.id].map((suggestion) => (
                  <button
                    key={`${suggestion.item_name}-${suggestion.traveler_name}`}
                    type="button"
                    onClick={() => void addSuggestion(suggestion)}
                  >
                    <Plus size={12} />
                    {suggestion.quantity > 1 ? `${suggestion.quantity}× ` : ""}
                    {suggestion.item_name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {pending && <div className="chat-bubble">Thinking…</div>}
        {error && <div className="error-card">{error}</div>}
      </div>

      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about what to pack…"
          disabled={pending}
        />
        <button type="submit" className="icon-button primary-icon" disabled={pending || !input.trim()}>
          <Send size={17} />
        </button>
      </form>
    </section>
  );
}
