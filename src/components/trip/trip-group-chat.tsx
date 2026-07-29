"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { MessagesSquare, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendGroupChatMessage } from "@/actions/packing";
import { createClient, isDemoMode } from "@/lib/supabase/client";
import { getHeaderTravelerColor, getTravelerInitials } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import type { ChatMessage, TripMember } from "@/lib/types";

interface TripGroupChatProps {
  tripId: string;
  destination: string;
  members: TripMember[];
  currentUserId: string;
  initialMessages: ChatMessage[];
  canInvite?: boolean;
  onInvite?: () => void;
}

function memberDisplayName(member: TripMember) {
  return member.profile?.name?.trim() || member.profile?.email || "Traveler";
}

export function TripGroupChat({
  tripId,
  destination,
  members,
  currentUserId,
  initialMessages,
  canInvite,
  onInvite,
}: TripGroupChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  useEffect(() => {
    if (isDemoMode()) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`trip-chat-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, router]);

  const people = useMemo(
    () => members.filter((m) => m.profile?.name || m.profile?.email || m.user_id),
    [members]
  );

  const profileByUserId = useMemo(() => {
    const map = new Map<string, { name: string; index: number }>();
    people.forEach((member, index) => {
      map.set(member.user_id, { name: memberDisplayName(member), index });
    });
    return map;
  }, [people]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isPending) return;

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      trip_id: tripId,
      user_id: currentUserId,
      role: "user",
      content: trimmed,
      channel: "group",
      created_at: new Date().toISOString(),
      profile: {
        id: currentUserId,
        email: "",
        name: profileByUserId.get(currentUserId)?.name ?? "You",
        avatar_url: null,
        created_at: "",
        updated_at: "",
      },
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    startTransition(async () => {
      try {
        const saved = await sendGroupChatMessage(tripId, trimmed);
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...saved, channel: "group" } : m))
        );
        router.refresh();
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setInput(trimmed);
      }
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-travel-sm">
      <div className="flex items-start justify-between gap-3 border-b bg-gradient-to-r from-ocean-teal/10 to-sky-blue/10 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ocean-teal text-white">
            <MessagesSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-display font-semibold">Trip chat</h3>
            <p className="text-xs text-muted-foreground">
              Message everyone packing for {destination.split(",")[0]}
            </p>
          </div>
        </div>
        {people.length > 0 ? (
          <div className="flex shrink-0 -space-x-2" title="People on this trip">
            {people.slice(0, 4).map((member, index) => {
              const name = memberDisplayName(member);
              return (
                <span
                  key={member.id}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold",
                    getHeaderTravelerColor(index)
                  )}
                  title={name}
                >
                  {getTravelerInitials(name)}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-56 flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ocean-teal/15 text-ocean-teal">
              <Users className="h-7 w-7" />
            </div>
            <div className="max-w-sm space-y-2">
              <p className="text-display text-lg font-semibold">Chat with your trip mates</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Coordinate who&apos;s bringing sunscreen, share meetup plans, or ask if anyone has
                room for a shared item.
              </p>
            </div>
            {people.length <= 1 && canInvite && onInvite ? (
              <Button type="button" variant="outline" onClick={onInvite} className="cursor-pointer">
                Invite someone to chat
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const mine = msg.user_id === currentUserId;
              const meta = msg.user_id ? profileByUserId.get(msg.user_id) : null;
              const name =
                msg.profile?.name?.trim() ||
                meta?.name ||
                (mine ? "You" : "Traveler");
              const colorIndex = meta?.index ?? 0;

              return (
                <div
                  key={msg.id}
                  className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}
                >
                  {!mine ? (
                    <span
                      className={cn(
                        "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        getHeaderTravelerColor(colorIndex)
                      )}
                    >
                      {getTravelerInitials(name)}
                    </span>
                  ) : null}
                  <div className={cn("max-w-[85%] space-y-1", mine && "items-end text-right")}>
                    <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                      <span className="font-medium">{mine ? "You" : name}</span>
                      <span>
                        {format(parseISO(msg.created_at), "MMM d · h:mm a")}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        mine
                          ? "rounded-br-md bg-ocean-teal text-white"
                          : "rounded-bl-md bg-muted/70"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t bg-background/80 p-4 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message the group…"
            disabled={isPending}
            className="flex-1 rounded-full border bg-muted/30 px-4 py-2.5 text-sm outline-none transition-colors focus:border-ocean-teal/40 focus:bg-background"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !input.trim()}
            className="h-10 w-10 shrink-0 cursor-pointer rounded-full bg-ocean-teal hover:bg-ocean-teal/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
