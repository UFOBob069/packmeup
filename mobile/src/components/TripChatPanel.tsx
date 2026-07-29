import { useEffect, useMemo, useRef, useState } from "react";
import { MessagesSquare, Send, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { ChatMessage, TripMember } from "../types";

interface TripChatPanelProps {
  tripId: string;
  destination: string;
  currentUserId: string;
  members: TripMember[];
  onInvite?: () => void;
}

function displayName(member: TripMember) {
  return member.profile?.name?.trim() || member.profile?.email || "Traveler";
}

export function TripChatPanel({
  tripId,
  destination,
  currentUserId,
  members,
  onInvite,
}: TripChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data, error: queryError } = await supabase
      .from("chat_messages")
      .select("*, profile:profiles(*)")
      .eq("trip_id", tripId)
      .eq("channel", "group")
      .order("created_at");
    if (queryError) {
      setError(
        queryError.message.includes("channel")
          ? "Run migration 014_trip_group_chat.sql to enable Trip Chat."
          : queryError.message
      );
      return;
    }
    setMessages((data ?? []) as ChatMessage[]);
    setError(null);
  };

  useEffect(() => {
    void load();
    const channel = supabase
      .channel(`mobile-chat-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `trip_id=eq.${tripId}`,
        },
        () => void load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const people = useMemo(
    () => members.filter((m) => m.user_id || m.profile?.name || m.profile?.email),
    [members]
  );

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setInput("");
    const { error: insertError } = await supabase.from("chat_messages").insert({
      trip_id: tripId,
      user_id: currentUserId,
      role: "user",
      content: trimmed,
      channel: "group",
    });
    if (insertError) {
      setError(insertError.message);
      setInput(trimmed);
    } else {
      await load();
    }
    setPending(false);
  };

  return (
    <section className="chat-panel">
      <div className="chat-panel-header">
        <MessagesSquare size={18} />
        <div>
          <strong>Trip chat</strong>
          <small>Message everyone packing for {destination.split(",")[0]}</small>
        </div>
      </div>

      <div className="chat-panel-body" ref={scrollRef}>
        {error && <div className="error-card">{error}</div>}
        {messages.length === 0 && !error ? (
          <div className="chat-empty">
            <Users size={28} />
            <p>Chat with your trip mates about sunscreen, meetups, and shared items.</p>
            {people.length <= 1 && onInvite ? (
              <button type="button" className="secondary-button" onClick={onInvite}>
                Invite someone
              </button>
            ) : null}
          </div>
        ) : (
          messages.map((msg) => {
            const mine = msg.user_id === currentUserId;
            const member = members.find((m) => m.user_id === msg.user_id);
            const name = msg.profile?.name || (member ? displayName(member) : mine ? "You" : "Traveler");
            return (
              <div key={msg.id} className={`chat-bubble ${mine ? "mine" : ""}`}>
                <small>{mine ? "You" : name}</small>
                <p>{msg.content}</p>
              </div>
            );
          })
        )}
      </div>

      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Message the group…"
          disabled={pending}
        />
        <button type="submit" className="icon-button primary-icon" disabled={pending || !input.trim()}>
          <Send size={17} />
        </button>
      </form>
    </section>
  );
}
