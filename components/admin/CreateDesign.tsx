"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Info, Heart, ArrowRight, Trash2 } from "lucide-react";
import { AdminHeading } from "./AdminShell";
import { UploadField } from "@/components/UploadField";
import { Mockup } from "@/components/design-preview/Mockup";
import { Segmented } from "@/components/design-preview/Controls";
import { repository, launchDesigns } from "@/services/repository";
import { saveUpload } from "@/services/uploads";
import { useAsset } from "@/lib/hooks";
import type { Design, Colour, Side } from "@/types";
export function CreateDesign() {
  const sample = launchDesigns.find((d) => d.slug === "street-duck")!;
  const [name, setName] = useState(sample.name);
  const [category, setCategory] = useState("Graphic");
  const [description, setDescription] = useState(sample.description);
  const [short, setShort] = useState("Music-first streetwear attitude.");
  const [tags, setTags] = useState(sample.tags.join(", "));
  const [available, setAvailable] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [colours, setColours] = useState<Colour[]>(["navy", "black", "cream"]);
  const [sides, setSides] = useState<Side[]>(["front"]);
  const [sizes, setSizes] = useState(["S", "M", "L", "XL", "XXL"]);
  const [light, setLight] = useState<File | null>(null);
  const [dark, setDark] = useState<File | null>(null);
  const [lightUrl, setLightUrl] = useState("");
  const [darkUrl, setDarkUrl] = useState("");
  const [useSample, setUseSample] = useState(true);
  const [previewMode, setPreviewMode] = useState("card");
  const [colour, setColour] = useState<Colour>("navy");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Design | null>(null);
  const [favourite, setFavourite] = useState(false);
  useEffect(() => {
    if (!light) {
      setLightUrl("");
      return;
    }
    const url = URL.createObjectURL(light);
    setLightUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [light]);
  useEffect(() => {
    if (!dark) {
      setDarkUrl("");
      return;
    }
    const url = URL.createObjectURL(dark);
    setDarkUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [dark]);
  const preview: Design = {
    ...sample,
    id: "Assigned on save",
    name: name || "Your design",
    description: description || "Add your design description.",
    shortDescription: short,
    category,
    tags: tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    lightShirtAsset: lightUrl || (useSample ? sample.lightShirtAsset : ""),
    darkShirtAsset:
      darkUrl || lightUrl || (useSample ? sample.darkShirtAsset : ""),
    thumbnail: lightUrl || (useSample ? sample.thumbnail : ""),
    available,
    colours,
    sides,
    sizes,
    featured,
  };
  const thumbnail = useAsset(preview.thumbnail);
  const original = useAsset(preview.lightShirtAsset);
  async function save(published: boolean) {
    setError("");
    if (!name.trim()) {
      setError("Enter a design name.");
      return;
    }
    if (!description.trim()) {
      setError("Add a description for your design.");
      return;
    }
    if (!light && !useSample) {
      setError("Upload transparent artwork first.");
      return;
    }
    if (!colours.length || !sides.length || !sizes.length) {
      setError("Choose at least one colour, print side and size.");
      return;
    }
    setBusy(true);
    try {
      const lightId = light ? await saveUpload(light) : null;
      const darkId = dark ? await saveUpload(dark) : null;
      const id = saved?.id || `IWBI-${Date.now().toString().slice(-7)}`;
      const slug =
        saved?.slug ||
        `${name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}-${id.slice(-4)}`;
      const design: Design = {
        ...preview,
        id,
        slug,
        name: name.trim(),
        description: description.trim(),
        lightShirtAsset: lightId ? "upload:" + lightId : sample.lightShirtAsset,
        darkShirtAsset: darkId
          ? "upload:" + darkId
          : lightId
            ? "upload:" + lightId
            : sample.darkShirtAsset,
        thumbnail: lightId ? "upload:" + lightId : sample.thumbnail,
        createdAt: new Date().toISOString(),
        published,
      };
      repository.saveDesign(design);
      setSaved(design);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AdminHeading
        title="Create Design"
        subtitle={
          <>
            <Link href="/admin/designs">Designs</Link> / Create new
          </>
        }
      />
      <nav className="create-steps" aria-label="Create design steps">
        <a href="#artwork">
          <i>1</i>
          <span>Artwork</span>
        </a>
        <a href="#details">
          <i>2</i>
          <span>Details</span>
        </a>
        <a href="#preview">
          <i>3</i>
          <span>Preview</span>
        </a>
      </nav>
      <div className="create-grid">
        <section className="admin-panel original-upload" id="artwork">
          <h2>Original artwork</h2>
          <div className="create-original-image">
            {original ? (
              <img src={original} alt="Original artwork preview" />
            ) : (
              <img
                src="/assets/placeholders/design-placeholder.svg"
                alt="Upload artwork to begin"
              />
            )}
          </div>
          <div className="art-upload-controls">
            <UploadField
              transparent
              label="Light-shirt artwork"
              preview={lightUrl}
              onFile={(file) => {
                setLight(file);
                if (file) setUseSample(false);
              }}
            />
            <button
              className="button remove-art"
              onClick={() => {
                setLight(null);
                setDark(null);
                setUseSample(false);
              }}
            >
              <Trash2 />
              Remove
            </button>
            <p>PNG / WebP • High resolution</p>
            <p className="ready-line">
              <CheckCircle2 />
              {light || useSample ? "Background ready" : "Awaiting artwork"}
            </p>
            <div className="original-file-note">
              <Info />
              Original file is kept on this device.
            </div>
          </div>
          <details className="dark-art-upload">
            <summary>Dark-shirt artwork</summary>
            <p>
              Upload a separate light-ink version for Navy and Black. Otherwise
              the original artwork is used.
            </p>
            <UploadField
              transparent
              label="Dark-shirt artwork"
              preview={darkUrl}
              onFile={setDark}
            />
          </details>
          {useSample && (
            <p className="sample-note">
              Approved sample artwork. Replace it to create your own design.
            </p>
          )}
        </section>
        <section className="admin-panel design-fields" id="details">
          <h2>Design details</h2>
          <div className="field-grid">
            <label className="field">
              Design name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your design"
                required
              />
            </label>
            <label className="field">
              Design code
              <input value={saved?.id || "Assigned on save"} readOnly />
            </label>
          </div>
          <label className="field">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
              value={short}
              onChange={(e) => {
                setShort(e.target.value);
                if (!description) setDescription(e.target.value);
              }}
              placeholder="A short introduction"
            />
          </label>
          <label className="field">
            Full description
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="The story behind your artwork"
            />
          </label>
          <label className="field">
            Tags
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="streetwear, graphic, character"
            />
          </label>
          <label className="settings-row">
            <span>Availability</span>
            <input
              className="switch"
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            Available (show in store)
          </label>
          <div className="settings-row">
            <span>T-shirt colours</span>
            {(["navy", "black", "cream"] as Colour[]).map((c) => (
              <label className="check-label" key={c}>
                <input
                  type="checkbox"
                  checked={colours.includes(c)}
                  onChange={(e) =>
                    setColours(
                      e.target.checked
                        ? [...colours, c]
                        : colours.filter((v) => v !== c),
                    )
                  }
                />
                {c[0].toUpperCase() + c.slice(1)}
              </label>
            ))}
          </div>
          <div className="settings-row">
            <span>Print views</span>
            {(["front", "back"] as Side[]).map((s) => (
              <label key={s} className="check-label">
                <input
                  type="checkbox"
                  checked={sides.includes(s)}
                  onChange={(e) =>
                    setSides(
                      e.target.checked
                        ? [...sides, s]
                        : sides.filter((v) => v !== s),
                    )
                  }
                />
                {s === "front" ? "Front" : "Back"}
              </label>
            ))}
          </div>
          <div className="settings-row">
            <span>Sizes</span>
            {["S", "M", "L", "XL", "XXL"].map((s) => (
              <button
                key={s}
                className={`size-chip ${sizes.includes(s) ? "chosen" : ""}`}
                aria-pressed={sizes.includes(s)}
                onClick={() =>
                  setSizes(
                    sizes.includes(s)
                      ? sizes.filter((v) => v !== s)
                      : [...sizes, s],
                  )
                }
              >
                {s}
              </button>
            ))}
          </div>
          <label className="settings-row">
            <span>Featured design</span>
            <input
              className="switch"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            <small>Mark as featured</small>
          </label>
        </section>
        <section className="admin-panel live-template" id="preview">
          <h2>Live template preview</h2>
          <Segmented
            label="Template preview"
            value={previewMode}
            onChange={setPreviewMode}
            options={[
              { value: "card", label: "Gallery Card" },
              { value: "detail", label: "Design Detail" },
            ]}
          />
          <div className="template-card">
            {previewMode === "card" ? (
              <>
                {thumbnail && (
                  <img src={original || thumbnail} alt="Gallery card artwork" />
                )}
                <div>
                  <h3>{preview.name}</h3>
                  <p>{saved?.id || "New design"}</p>
                  <button
                    className="template-inspect"
                    onClick={() => setPreviewMode("detail")}
                  >
                    Inspect Design <ArrowRight />
                  </button>
                </div>
                <button
                  className="icon-button favourite"
                  aria-label={
                    favourite ? "Remove from favourites" : "Add to favourites"
                  }
                  onClick={() => setFavourite(!favourite)}
                >
                  <Heart fill={favourite ? "currentColor" : "none"} />
                </button>
              </>
            ) : (
              <Mockup design={preview} colour={colour} />
            )}
          </div>
          <h3 className="mockup-label">Generated T-shirt mockups</h3>
          <div className="mini-mockups">
            {(["navy", "black", "cream"] as Colour[]).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColour(c);
                  setPreviewMode("detail");
                }}
                aria-label={`Preview ${c} shirt`}
              >
                <Mockup design={preview} colour={c} />
                <span>{c[0].toUpperCase() + c.slice(1)}</span>
              </button>
            ))}
          </div>
          <div className="checks-ready">
            <p>
              <CheckCircle2 />
              Artwork {light || useSample ? "checked" : "needed"}
            </p>
            <p>
              <CheckCircle2 />
              Card preview ready
            </p>
            <p>
              <CheckCircle2 />
              Mockups ready
            </p>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
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
              onClick={() => void save(false)}
              disabled={busy}
            >
              Save Draft
            </button>
            <button
              className="button"
              onClick={() => void save(true)}
              disabled={busy}
            >
              {busy ? "Saving…" : "Publish Design"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
