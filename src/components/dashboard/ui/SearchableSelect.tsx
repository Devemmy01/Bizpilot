"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type SearchableOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type SearchableSelectProps = {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
};

export function SearchableSelect({ options, value, onChange, placeholder = "Select…", emptyLabel = "No matches." }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-xs font-semibold text-ink transition focus:border-ocean focus:outline-none focus:ring-1 focus:ring-ocean"
      >
        <span className={`truncate ${selected ? "" : "text-slate-400"}`}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-modal">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search size={13} className="shrink-0 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-6 w-full border-0 p-0 text-xs focus:ring-0"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-center text-xs font-semibold text-slate-400">{emptyLabel}</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold text-ink hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.sublabel && <span className="block truncate text-[10px] font-medium text-slate-400">{option.sublabel}</span>}
                  </span>
                  {option.value === value && <Check size={14} className="shrink-0 text-growth" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
