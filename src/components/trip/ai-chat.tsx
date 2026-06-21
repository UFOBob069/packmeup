"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Send, Sparkles, Luggage } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  sendChatMessage,
  addSuggestedPackingItem,
  type PackingItemSuggestion,
} from "@/actions/packing";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Add my dog's supplies",
  "Make this fit in a carry-on",
  "Add a golf day",
  "Reduce overpacking",
];

interface ChatDisplayMessage extends ChatMessage {
  itemSuggestions?: PackingItemSuggestion[];
  addedSuggestionKeys?: string[];
}

interface AiChatProps {
  tripId: string;
  initialMessages: ChatMessage[];
}

function suggestionKey(s: PackingItemSuggestion) {
  return `${s.item_name}-${s.traveler_name ?? "shared"}`;
}

export function AiChat({ tripId, initialMessages }: AiChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatDisplayMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  const handleAddSuggestion = (
    messageId: string,
    suggestion: PackingItemSuggestion,
    key: string
  ) => {
    setAddingKey(key);
    startTransition(async () => {
      await addSuggestedPackingItem(tripId, suggestion);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                addedSuggestionKeys: [...(m.addedSuggestionKeys ?? []), key],
              }
            : m
        )
      );
      setAddingKey(null);
      router.refresh();
    });
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatDisplayMessage = {
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
      const assistantId = `temp-${Date.now()}-ai`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          trip_id: tripId,
          user_id: null,
          role: "assistant",
          content: result.message,
          created_at: new Date().toISOString(),
          itemSuggestions: result.suggestions,
          addedSuggestionKeys: [],
        },
      ]);
      if (result.suggestions.length === 0) {
        router.refresh();
      }
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
          <p className="text-xs text-muted-foreground">Suggest items — you choose what to add</p>
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
                  Ask for gear, pet supplies, or carry-on tweaks. I&apos;ll suggest items — tap
                  to add them to your checklist.
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
                "max-w-[92%] space-y-2",
                msg.role === "user" ? "ml-auto" : ""
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto max-w-[88%] rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-muted/70"
                )}
              >
                {msg.content}
              </div>

              {msg.role === "assistant" && msg.itemSuggestions && msg.itemSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {msg.itemSuggestions.map((suggestion) => {
                    const key = suggestionKey(suggestion);
                    const added = msg.addedSuggestionKeys?.includes(key);
                    const isAdding = addingKey === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={added || isAdding || isPending}
                        onClick={() => handleAddSuggestion(msg.id, suggestion, key)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-all",
                          added
                            ? "border-golf-green/30 bg-golf-green/10 text-golf-green"
                            : "bg-background hover:border-primary/40 hover:bg-primary/5"
                        )}
                      >
                        {added ? (
                          <Check className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                        <span>
                          <span className="font-medium">
                            {suggestion.quantity > 1 && `${suggestion.quantity}× `}
                            {suggestion.item_name}
                          </span>
                          {suggestion.traveler_name && (
                            <span className="mt-0.5 block text-[10px] text-muted-foreground">
                              for {suggestion.traveler_name}
                            </span>
                          )}
                          {suggestion.shared && (
                            <span className="mt-0.5 block text-[10px] text-muted-foreground">
                              shared
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {isPending && (
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
              </span>
              Thinking...
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
