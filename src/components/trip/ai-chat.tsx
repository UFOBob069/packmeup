"use client";

import { useState, useTransition } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <div className="flex h-full flex-col rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">AI Packing Assistant</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ask me to refine your packing list, add activities, or optimize for your luggage.
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="rounded-full border px-3 py-1 text-xs transition-colors hover:bg-muted"
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
                "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                msg.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {msg.content}
            </div>
          ))}
          {isPending && (
            <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
              Thinking...
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Refine your packing list..."
            disabled={isPending}
          />
          <Button type="submit" size="icon" disabled={isPending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
