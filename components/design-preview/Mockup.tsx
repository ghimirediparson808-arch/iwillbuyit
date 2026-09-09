"use client";
import placement from "@/data/mockup-layout.json";
import type { Colour, Side, View, Design } from "@/types";
import { useAsset } from "@/lib/hooks";
export function Mockup({
  design,
  colour = "navy",
  side = "front",
  view = "product",
}: {
  design?: Design;
  colour?: Colour;
  side?: Side;
  view?: View;
}) {
  const rule = placement[view][side];
  const art = useAsset(
    design
      ? colour === "cream"
        ? design.lightShirtAsset
        : design.darkShirtAsset
      : undefined,
  );
  return (
    <div className={`mockup mockup-${view}`}>
      <img
        className="blank-shirt"
        src={`/assets/mockups/${view}/${side}/${colour}.webp`}
        alt={`${colour} T-shirt, ${side}${view === "model" ? ", worn by a model" : ""}`}
      />
      {art && (
        <img
          className="print-art"
          src={art}
          alt={`${design?.name} print`}
          style={{
            left: `${rule.xPercent}%`,
            top: `${rule.yPercent}%`,
            width: `${rule.widthPercent}%`,
            height: `${rule.heightPercent}%`,
            mixBlendMode: colour === "cream" ? "multiply" : "normal",
          }}
        />
      )}
    </div>
  );
}
