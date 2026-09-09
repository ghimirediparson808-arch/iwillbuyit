"use client";
import { Check, Minus, Plus } from "lucide-react";
import type { Colour } from "@/types";
export function ColourControl({
  value,
  onChange,
  allowed = ["navy", "black", "cream"],
}: {
  value: Colour;
  onChange: (c: Colour) => void;
  allowed?: Colour[];
}) {
  return (
    <div className="colour-options" role="group" aria-label="T-shirt colour">
      {(["navy", "black", "cream"] as Colour[]).map((c) => (
        <button
          type="button"
          key={c}
          className={`colour-option ${c === value ? "selected" : ""}`}
          disabled={!allowed.includes(c)}
          aria-label={
            allowed.includes(c)
              ? c[0].toUpperCase() + c.slice(1)
              : `${c[0].toUpperCase() + c.slice(1)} — unavailable for this design`
          }
          onClick={() => onChange(c)}
          aria-pressed={c === value}
        >
          <span className={`swatch ${c}`}>{c === value && <Check />}</span>
          <span>{c[0].toUpperCase() + c.slice(1)}</span>
        </button>
      ))}
    </div>
  );
}
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="pills" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`pill ${value === o.value ? "selected" : ""}`}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
export function Quantity({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="quantity">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus />
      </button>
      <output aria-label="Quantity">{value}</output>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= 100}
        onClick={() => onChange(value + 1)}
      >
        <Plus />
      </button>
    </div>
  );
}
