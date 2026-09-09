"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Design } from "@/types";
import { displayArtwork } from "@/services/artwork";
import { useAsset } from "@/lib/hooks";
export function DesignCard({
  design,
  href = `/designs/${design.slug}`,
}: {
  design: Design;
  href?: string;
}) {
  const artwork = displayArtwork(design);
  const src = useAsset(artwork.source);
  return (
    <article className="design-card">
      <Link
        href={href}
        className={`card-art ${design.artworkVariants ? "artwork-surface artwork-" + artwork.tone : ""}`}
        aria-label={`Inspect ${design.name}`}
      >
        {src ? (
          <img src={src} alt={design.description} loading="lazy" />
        ) : (
          <img
            src="/assets/placeholders/design-placeholder.svg"
            alt="Artwork preview unavailable"
          />
        )}
      </Link>
      <div className="card-info">
        <div>
          <h2>
            <Link href={href}>{design.name}</Link>
          </h2>
          <p>{design.id}</p>
        </div>
        <Link className="inspect-link" href={href}>
          Inspect<span className="inspect-long"> Design</span>
          <ArrowRight />
        </Link>
      </div>
    </article>
  );
}
