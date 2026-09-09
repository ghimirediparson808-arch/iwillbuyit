"use client";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useDesigns } from "@/lib/hooks";
import { DesignCard } from "./DesignCard";
import { Eyebrow } from "@/components/site/Decorations";
export function Gallery() {
  const designs = useDesigns();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("search"))
      search.current?.focus();
  }, []);
  const filtered = designs
    .filter(
      (d) =>
        (category === "All" || d.category === category) &&
        (d.name + " " + d.description + " " + d.tags.join(" "))
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "oldest"
          ? a.id.localeCompare(b.id)
          : (b.createdAt || "").localeCompare(a.createdAt || ""),
    );
  return (
    <main id="main" className="gallery-main">
      <div className="gallery-heading">
        <Eyebrow>FIND • CHOOSE • WEAR</Eyebrow>
        <h1>Design Gallery</h1>
        <p>Find the artwork that feels like you.</p>
      </div>
      <form
        className="gallery-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          search.current?.focus();
        }}
      >
        <Search />
        <label className="visually-hidden" htmlFor="design-search">
          Search designs
        </label>
        <input
          id="design-search"
          ref={search}
          placeholder="Search designs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="icon-button" aria-label="Search">
          <Search />
        </button>
      </form>
      <div className="gallery-toolbar">
        <div className="pills" role="group" aria-label="Design category">
          {[
            "All",
            "Minimal",
            "Typography",
            "Anime",
            "Graphic",
            "Editorial",
          ].map((c) => (
            <button
              className={`pill ${category === c ? "selected" : ""}`}
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="sort-control">
          <span className="visually-hidden">Sort designs</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>
      <div className="visually-hidden" aria-live="polite">
        {filtered.length} designs found
      </div>
      {filtered.length ? (
        <div className="design-grid">
          {filtered.map((design) => (
            <DesignCard key={design.id} design={design} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No designs found</h2>
          <p>Try another search or explore all seven launch designs.</p>
          <button
            className="button"
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </main>
  );
}
