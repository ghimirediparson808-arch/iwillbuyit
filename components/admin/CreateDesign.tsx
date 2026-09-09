"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AdminHeading } from "./AdminShell";
import { VariantPanel } from "./VariantPanel";
import { DesignCard } from "@/components/gallery/DesignCard";
import { Mockup } from "@/components/design-preview/Mockup";
import { Segmented } from "@/components/design-preview/Controls";
import { repository } from "@/services/repository";
import {
  emptyVariants,
  shirtColours,
  colourName,
  publicationErrors,
  displayArtwork,
} from "@/services/artwork";
import { saveUpload } from "@/services/uploads";
import { useAsset } from "@/lib/hooks";
import type { Design, Colour, ColourVariant, Side, View } from "@/types";
import "@/styles/variants.css";
function blankDesign(): Design {
  return {
    id: "",
    slug: "",
    name: "",
    category: "Graphic",
    description: "",
    shortDescription: "",
    tags: [],
    lightShirtAsset: "",
    darkShirtAsset: "",
    thumbnail: "",
    schemaVersion: 2,
    variants: emptyVariants(),
    sides: ["front"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    available: true,
    published: false,
  };
}
export function CreateDesign({ editId = "" }: { editId?: string }) {
  const [design, setDesign] = useState<Design>(blankDesign);
  const [loaded, setLoaded] = useState(!editId);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<Design | null>(null);
  const [colour, setColour] = useState<Colour>("navy");
  const [side, setSide] = useState<Side>("front");
  const [view, setView] = useState<View>("product");
  useEffect(() => {
    if (!editId) {
      setDesign(blankDesign());
      setLoaded(true);
      return;
    }
    const record = repository.designs(true).find((d) => d.id === editId);
    if (record) {
      setDesign(record);
      setColour(record.defaultColour || "navy");
    } else setErrors(["Design not found. Return to the design library."]);
    setLoaded(true);
  }, [editId]);
  function patch(value: Partial<Design>) {
    setDesign((d) => ({ ...d, ...value }));
    setSaved(null);
  }
  function updateVariant(c: Colour, value: Partial<ColourVariant>) {
    setDesign((d) => ({
      ...d,
      variants: { ...d.variants!, [c]: { ...d.variants![c], ...value } },
    }));
    setSaved(null);
  }
  async function upload(c: Colour, s: Side, file: File | null) {
    if (!file) {
      updateVariant(c, { [s]: undefined });
      return;
    }
    setUploading((n) => n + 1);
    try {
      const id = await saveUpload(file);
      updateVariant(c, {
        [s]: "upload:" + id,
        [s === "front" ? "reuseFront" : "reuseBack"]: undefined,
      });
    } catch (e) {
      setErrors([(e as Error).message]);
    } finally {
      setUploading((n) => n - 1);
    }
  }
  const busy = saving || uploading > 0 || Object.values(pending).some(Boolean);
  const display = displayArtwork(design, colour, side);
  const original = useAsset(display.source);
  async function save(published: boolean) {
    const issues = published
      ? publicationErrors(design)
      : !design.name.trim()
        ? ["Enter a design name."]
        : [];
    if (issues.length) {
      setErrors(issues);
      return;
    }
    setSaving(true);
    setErrors([]);
    try {
      const id =
        design.id || `IWBI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const value: Design = {
        ...design,
        id,
        name: design.name.trim(),
        description: design.description.trim(),
        slug:
          design.slug ||
          `${
            design.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "") || "design"
          }-${id.slice(-8).toLowerCase()}`,
        colours: shirtColours.filter((c) => design.variants?.[c]?.enabled),
        thumbnail: displayArtwork(design).source,
        published,
        createdAt: design.createdAt || new Date().toISOString(),
      };
      repository.saveDesign(value);
      setDesign(value);
      setSaved(value);
      // A saved draft can be reopened by refreshing this exact address.
      window.history.replaceState(
        null,
        "",
        `/admin/designs/new?edit=${encodeURIComponent(id)}`,
      );
    } catch (e) {
      setErrors([(e as Error).message]);
    } finally {
      setSaving(false);
    }
  }
  if (!loaded) return <p role="status">Loading design…</p>;
  return (
    <>
      <AdminHeading
        title={editId ? "Edit Design" : "Create Design"}
        subtitle={
          <>
            <Link href="/admin/designs">Designs</Link> /{" "}
            {editId ? "Edit design" : "Create new"}
          </>
        }
      />
      <nav className="variant-step-nav" aria-label="Create design steps">
        <a href="#details">1. Shared information</a>
        <a href="#variants">2. Colour variants</a>
        <a href="#preview">3. Preview & publish</a>
      </nav>
      <div className="variant-editor-grid">
        <section className="admin-panel design-fields" id="details">
          <h2>Shared design information</h2>
          <label className="field">
            Design name
            <input
              value={design.name}
              onChange={(e) => patch({ name: e.target.value })}
              required
              placeholder="Name your design"
            />
          </label>
          <label className="field">
            Design code
            <input value={design.id || "Assigned on save"} readOnly />
          </label>
          <label className="field">
            Category
            <select
              value={design.category}
              onChange={(e) => patch({ category: e.target.value })}
            >
              {["Typography", "Graphic", "Minimal", "Editorial", "Anime"].map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
          </label>
          <label className="field">
            Short description
            <input
              value={design.shortDescription || ""}
              onChange={(e) => patch({ shortDescription: e.target.value })}
            />
          </label>
          <label className="field">
            Full description
            <textarea
              value={design.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={4}
            />
          </label>
          <label className="field">
            Tags
            <input
              value={design.tags.join(",")}
              onChange={(e) => patch({ tags: e.target.value.split(",") })}
              placeholder="Separate tags with commas"
            />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={design.available !== false}
              onChange={(e) => patch({ available: e.target.checked })}
            />
            Available for requests
          </label>
          <p className="variant-help">
            {design.published ? "Published" : "Draft"} · Save a draft at any
            stage. Publish when your selected variants are ready.
          </p>
          <fieldset>
            <legend>Print sides</legend>
            {(["front", "back"] as Side[]).map((s) => (
              <label className="check-label" key={s}>
                <input
                  type="checkbox"
                  aria-label={s === "front" ? "Front" : "Back"}
                  checked={design.sides?.includes(s) || false}
                  onChange={(e) =>
                    patch({
                      sides: e.target.checked
                        ? [...(design.sides || []), s]
                        : design.sides?.filter((v) => v !== s),
                    })
                  }
                />
                {s === "front" ? "Front" : "Back"}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Sizes</legend>
            <div className="size-options">
              {["S", "M", "L", "XL", "XXL"].map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`size-chip ${design.sizes?.includes(s) ? "chosen" : ""}`}
                  aria-pressed={design.sizes?.includes(s)}
                  onClick={() =>
                    patch({
                      sizes: design.sizes?.includes(s)
                        ? design.sizes.filter((v) => v !== s)
                        : [...(design.sizes || []), s],
                    })
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="check-label">
            <input
              type="checkbox"
              checked={!!design.featured}
              onChange={(e) => patch({ featured: e.target.checked })}
            />
            Featured design
          </label>
        </section>
        <section className="admin-panel variants-section" id="variants">
          <h2>T-shirt colour variants</h2>
          <p className="variant-intro">
            One design. Your choice of colours, artwork and backgrounds. Enable
            each colour you want to offer.
          </p>
          {shirtColours.map((c) => (
            <VariantPanel
              key={c}
              design={design}
              colour={c}
              update={(p) => updateVariant(c, p)}
              upload={(s, file) => void upload(c, s, file)}
              pending={(key, value) =>
                setPending((p) => ({ ...p, [key]: value }))
              }
              selectDefault={() => {
                patch({ defaultColour: c });
                setColour(c);
              }}
            />
          ))}
          <p className="variant-help">
            Transparent PNG or WebP · up to 10 MB. Artwork stays unchanged. You
            decide which colours and contrast to publish.
          </p>
        </section>
        <section className="admin-panel variant-summary" id="preview">
          <h2>Live preview</h2>
          <label className="field">
            Preview colour
            <select
              value={colour}
              onChange={(e) => setColour(e.target.value as Colour)}
            >
              {shirtColours.map((c) => (
                <option value={c} key={c}>
                  {colourName(c)}
                  {!design.variants?.[c]?.enabled ? " · disabled" : ""}
                </option>
              ))}
            </select>
          </label>
          <div
            className={`create-original-image artwork-surface artwork-${display.tone}`}
          >
            {original ? (
              <img src={original} alt="Original artwork preview" />
            ) : (
              <span>No artwork assigned to this view</span>
            )}
          </div>
          <Segmented
            label="Preview view"
            value={view}
            onChange={setView}
            options={[
              { value: "product", label: "T-shirt" },
              { value: "model", label: "Try on Model" },
            ]}
          />
          <Mockup design={design} colour={colour} side={side} view={view} />
          <Segmented
            label="Preview side"
            value={side}
            onChange={setSide}
            options={[
              { value: "front", label: "Front" },
              { value: "back", label: "Back" },
            ]}
          />
          <h3>
            Gallery card ·{" "}
            {design.defaultColour
              ? colourName(design.defaultColour)
              : "choose a default"}
          </h3>
          <div className="editor-gallery-preview">
            <DesignCard
              design={{ ...design, name: design.name || "Your design" }}
              href="#preview"
            />
          </div>
          <p className="variant-help">
            One catalogue card, using your default colour. Customers can select
            other enabled colours inside the design.
          </p>
          {busy && <p role="status">Saving artwork…</p>}
          {errors.length > 0 && (
            <div className="error" role="alert">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
          {saved && (
            <p className="success" role="status">
              {saved.published ? "Design published." : "Draft saved."}{" "}
              <Link
                href={
                  saved.published ? `/designs/${saved.slug}` : "/admin/designs"
                }
              >
                View {saved.published ? "design" : "drafts"}{" "}
                <ArrowRight size={16} />
              </Link>
            </p>
          )}
          <div className="publish-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => void save(false)}
            >
              Save Draft
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={() => void save(true)}
            >
              {saving ? "Saving…" : "Publish Design"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
