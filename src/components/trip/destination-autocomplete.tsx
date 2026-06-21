"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PlaceSuggestion } from "@/lib/mapbox/places";

interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (place: PlaceSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onSubmit?: () => void;
}

export function DestinationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Scottsdale, Arizona",
  className,
  disabled,
  onSubmit,
}: DestinationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [configured, setConfigured] = useState(true);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(query.trim())}`);
      const data = (await res.json()) as {
        suggestions: PlaceSuggestion[];
        configured?: boolean;
        error?: string;
      };
      setConfigured(data.configured !== false);
      setSuggestions(data.suggestions ?? []);
      setIsOpen((data.suggestions ?? []).length > 0);
      setActiveIndex(-1);
      if ((data.suggestions ?? []).length > 0) {
        requestAnimationFrame(updateDropdownPosition);
      }
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [updateDropdownPosition]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchSuggestions(value);
    }, 280);
    return () => clearTimeout(timer);
  }, [value, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const list = listRef.current;
        if (list && list.contains(e.target as Node)) return;
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen, updateDropdownPosition, suggestions.length]);

  const selectSuggestion = (place: PlaceSuggestion) => {
    onChange(place.shortLabel);
    onSelect?.(place);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (isOpen && activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
        return;
      }
      if (value.trim()) {
        onSubmit?.();
      }
      return;
    }

    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const dropdown =
    isOpen && suggestions.length > 0 ? (
      <ul
        id="destination-suggestions"
        ref={listRef}
        role="listbox"
        style={dropdownStyle}
        className="max-h-60 overflow-auto rounded-xl border bg-popover py-1 shadow-travel-sm"
      >
        {suggestions.map((place, index) => (
          <li key={place.id} role="option" aria-selected={index === activeIndex}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuggestion(place)}
              className={cn(
                "flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                index === activeIndex && "bg-muted"
              )}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="font-medium">{place.shortLabel}</span>
                {place.label !== place.shortLabel && (
                  <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-1">
                    {place.label}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div ref={containerRef} className={cn("relative flex-1", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
              updateDropdownPosition();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="destination-suggestions"
          className="pr-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {!configured && value.trim().length >= 2 && !isLoading && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Autocomplete unavailable — add MAPBOX_ACCESS_TOKEN to your env. You can still type a
          destination manually.
        </p>
      )}

      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}
