"use client";
import { useEffect, useState } from "react";
import { loadUpload } from "@/services/uploads";
import { repository, launchDesigns } from "@/services/repository";
export function useSettings() {
  const [settings, setSettings] = useState({
    instagram: "",
    whatsapp: "",
    brand: "I WILL BUY IT",
  });
  useEffect(() => {
    const update = () => setSettings(repository.settings());
    update();
    window.addEventListener("iwbi-data", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("iwbi-data", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return settings;
}
export function useDesigns(includeDrafts = false) {
  const [designs, setDesigns] = useState(launchDesigns);
  useEffect(() => {
    const update = () => setDesigns(repository.designs(includeDrafts));
    update();
    window.addEventListener("iwbi-data", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("iwbi-data", update);
      window.removeEventListener("storage", update);
    };
  }, [includeDrafts]);
  return designs;
}
export function useAsset(source?: string) {
  const [url, setUrl] = useState(
    source?.startsWith("upload:") ? "" : source || "",
  );
  useEffect(() => {
    let live = true;
    let objectUrl = "";
    if (!source?.startsWith("upload:")) {
      setUrl(source || "");
      return;
    }
    setUrl("");
    loadUpload(source.slice(7))
      .then((blob) => {
        if (blob && live) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch(() => {
        if (live) setUrl("");
      });
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);
  return url;
}

export function useRequests() {
  const [requests, setRequests] = useState<import("@/types").RequestRecord[]>(
    [],
  );
  useEffect(() => {
    const update = () => setRequests(repository.requests());
    update();
    window.addEventListener("iwbi-data", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("iwbi-data", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return requests;
}
