import { createClient } from "@/lib/supabase/client";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open("iwbi-uploads", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("Image storage is unavailable in this browser."));
  });
}

export async function saveUpload(
  file: Blob,
  bucket: "request-uploads" | "design-assets" = "request-uploads",
): Promise<string> {
  const id = crypto.randomUUID();
  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
  const filename = `${id}.${ext}`;

  // Try saving to IndexedDB as local fallback
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(file, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error("Could not save to IndexedDB"));
    });
    db.close();
  } catch {
    // Continue even if IndexedDB is not supported
  }

  // Upload to Supabase Storage
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        contentType: file.type || "image/png",
        upsert: true,
      });

    if (!error && data?.path) {
      return data.path;
    }
  } catch {
    // Fall back to returning local UUID
  }

  return id;
}

export async function loadUpload(id: string): Promise<Blob | undefined> {
  // Try loading from IndexedDB first
  try {
    const db = await openDB();
    const result = await new Promise<Blob | undefined>((resolve, reject) => {
      const request = db.transaction("files").objectStore("files").get(id);
      request.onsuccess = () => {
        resolve(request.result);
        db.close();
      };
      request.onerror = () => {
        reject(request.error);
        db.close();
      };
    });
    if (result) return result;
  } catch {
    // Fall through to Supabase Storage
  }

  // Try loading from Supabase Storage
  try {
    const supabase = createClient();
    // Try design-assets first, then request-uploads
    let res = await supabase.storage.from("design-assets").download(id);
    if (!res.error && res.data) return res.data;

    res = await supabase.storage.from("request-uploads").download(id);
    if (!res.error && res.data) return res.data;
  } catch {
    // ignore
  }

  return undefined;
}

export async function validateImage(file: File, transparent = false) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    (transparent && file.type === "image/jpeg")
  )
    throw new Error(
      transparent
        ? "Upload a transparent PNG or WebP."
        : "Upload a PNG, JPG or WebP image.",
    );
  if (file.size > 10 * 1024 * 1024)
    throw new Error("The image must be 10 MB or smaller.");

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png =
    bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpg = bytes[0] === 255 && bytes[1] === 216;
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!(png || jpg || webp)) throw new Error("This file is not a valid image.");

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("This image could not be decoded.");
  });
  try {
    if (
      bitmap.width < 32 ||
      bitmap.height < 32 ||
      bitmap.width > 10000 ||
      bitmap.height > 10000
    )
      throw new Error(
        "Use an image between 32 and 10,000 pixels on each side.",
      );
    if (transparent) {
      const c = document.createElement("canvas");
      c.width = bitmap.width;
      c.height = bitmap.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
      let clear = false,
        ink = false;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 240) clear = true;
        if (pixels[i] > 20) ink = true;
        if (clear && ink) break;
      }
      if (!clear || !ink)
        throw new Error(
          "Artwork needs both visible content and a genuinely transparent background.",
        );
    }
  } finally {
    bitmap.close();
  }
}
