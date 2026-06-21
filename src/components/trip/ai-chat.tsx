"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, Sparkles, Luggage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendChatMessage } from "@/actions/packing";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Make this fit in a carry-on",
  "Add a golf day",
  "I need a wedding outfit",
  "Reduce overpacking",
  "Add colder weather options",
];

interface AiChatProps {
  tripId: string;
  initialMessages: ChatMessage[];
}

export function AiChat({ tripId, initialMessages }: AiChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      trip_id: tripId,
      user_id: null,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    startTransition(async () => {
      const result = await sendChatMessage(tripId, text);
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}-ai`,
          trip_id: tripId,
          user_id: null,
          role: "assistant",
          content: result.message,
          created_at: new Date().toISOString(),
        },
      ]);
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-travel-sm">
      <div className="flex items-center gap-3 border-b bg-gradient-to-r from-primary/5 to-sky-blue/5 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Luggage className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-display font-semibold">Packing expert</h3>
          <p className="text-xs text-muted-foreground">Refine what to bring</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4 py-4">
              <div className="rounded-2xl bg-muted/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Hi! I&apos;m your packing expert.</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Ask me to optimize for carry-on, add gear for an activity, adjust for weather,
                  or trim what you don&apos;t need.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="rounded-full border bg-background px-4 py-2 text-xs font-medium transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-travel-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "ml-auto rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted/70"
              )}
            >
              {msg.content}
            </div>
          ))}
          {isPending && (
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
              </span>
              Updating your packing list...
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-background/80 p-4 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about what to pack..."
            disabled={isPending}
            className="flex-1 rounded-full border bg-muted/30 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:bg-background"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !input.trim()}
            className="h-10 w-10 shrink-0 rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
