"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, ExternalLink } from "lucide-react";
import { AdminHeading } from "./AdminShell";
import { SalesChart } from "./Dashboard";
import { repository } from "@/services/repository";
import { useDesigns } from "@/lib/hooks";
import { DesignCard } from "@/components/gallery/DesignCard";
import { demoAuth } from "@/services/auth";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { Mockup } from "@/components/design-preview/Mockup";
export function AdminSections({
  section,
  initialQuery = "",
  previewId = "",
}: {
  section: string;
  initialQuery?: string;
  previewId?: string;
}) {
  const router = useRouter();
  const designs = useDesigns(true);
  const [query, setQuery] = useState(initialQuery);
  const [previewOpen, setPreviewOpen] = useState(!!previewId);
  const previewDesign = designs.find((d) => d.id === previewId);
  const [requests, setRequests] = useState(repository.requests());
  const [settings, setSettings] = useState(repository.settings());
  const [stock, setStock] = useState(repository.stock());
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setRequests(repository.requests());
    setSettings(repository.settings());
    setStock(repository.stock());
  }, []);
  const title =
    (
      {
        designs: "Design Library",
        customers: "Customers",
        inventory: "Inventory",
        analytics: "Analytics",
        settings: "Settings",
        search: "Search results",
      } as Record<string, string>
    )[section] || "Workspace";
  function saveSettings() {
    try {
      if (
        settings.instagram &&
        !/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]+\/?$/.test(
          settings.instagram,
        )
      )
        throw new Error("Use your full Instagram profile URL.");
      if (settings.whatsapp && settings.whatsapp.replace(/\D/g, "").length < 7)
        throw new Error("Enter a valid WhatsApp business number.");
      repository.saveSettings(settings);
      setNotice("Settings saved.");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  return (
    <>
      <AdminHeading title={title} />
      {previewOpen && previewDesign && (
        <Modal
          title={`${previewDesign.name} — draft preview`}
          onClose={() => setPreviewOpen(false)}
        >
          <p>{previewDesign.description}</p>
          <Mockup
            design={previewDesign}
            colour={previewDesign.defaultColour || "navy"}
            side={previewDesign.sides?.[0] || "front"}
            view="product"
          />
        </Modal>
      )}
      {section === "designs" && (
        <>
          <div className="library-toolbar">
            <input
              className="input"
              aria-label="Search designs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search designs..."
            />
            <Link className="button" href="/admin/designs/new">
              <Plus />
              Create Design
            </Link>
          </div>
          {notice && (
            <p className="error" role="alert">
              {notice}
            </p>
          )}
          <div className="admin-library">
            {designs
              .filter((d) =>
                (d.name + " " + d.id)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((d) => (
                <section key={d.id}>
                  <DesignCard
                    design={d}
                    href={
                      d.published ? undefined : `/admin/designs?preview=${d.id}`
                    }
                  />
                  <div className="library-actions">
                    <Link
                      className="button secondary"
                      href={`/admin/designs/new?edit=${encodeURIComponent(d.id)}`}
                    >
                      Edit design
                    </Link>
                    <span className="badge">
                      {d.published ? "Published" : "Draft"}
                    </span>
                    <button
                      className="button secondary"
                      onClick={() =>
                        repository.updateDesign(d.id, {
                          available: !d.available,
                        })
                      }
                    >
                      {d.available ? "Mark unavailable" : "Mark available"}
                    </button>
                    {!d.published && (
                      <button
                        className="button"
                        onClick={() => {
                          try {
                            repository.updateDesign(d.id, { published: true });
                          } catch (e) {
                            setNotice((e as Error).message);
                          }
                        }}
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </section>
              ))}
          </div>
        </>
      )}
      {section === "customers" && (
        <section className="admin-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Latest request</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.phone || "Not supplied"}</td>
                    <td>
                      <Link
                        href={
                          "/admin/requests?order=" +
                          r.id +
                          (r.orderStatus ? "&tab=orders" : "")
                        }
                      >
                        {r.id}
                      </Link>
                    </td>
                    <td>{r.orderStatus || r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {section === "inventory" && (
        <section className="admin-panel inventory-panel">
          <h2>T-shirt stock</h2>
          {stock.map((s, i) => (
            <div className="stock-row" key={s.colour}>
              <img
                src={`/assets/mockups/product/front/${s.colour}.webp`}
                alt={`${s.colour} shirt`}
              />
              <strong>
                {s.colour} · {s.size}
              </strong>
              <label className="field">
                Available stock
                <input
                  aria-label={`${s.colour} stock`}
                  type="number"
                  min="0"
                  value={s.count}
                  onChange={(e) =>
                    setStock(
                      stock.map((v, j) =>
                        j === i
                          ? { ...v, count: Math.max(0, Number(e.target.value)) }
                          : v,
                      ),
                    )
                  }
                />
              </label>
            </div>
          ))}
          <button
            className="button"
            onClick={() => {
              repository.saveStock(stock);
              setNotice("Stock updated.");
            }}
          >
            Save stock
          </button>
        </section>
      )}
      {section === "analytics" && (
        <>
          <SalesChart />
          <section className="admin-panel analytics-note">
            <h2>Sales reporting</h2>
            <p>
              The chart is calculated from stored orders that have reached Paid
              or a later production stage. Current requests and order statuses
              are available in the orders workspace.
            </p>
            <Link
              className="button secondary"
              href="/admin/requests?tab=orders"
            >
              View orders
            </Link>
          </section>
        </>
      )}
      {section === "settings" && (
        <section className="admin-panel settings-panel">
          <h2>Brand contact details</h2>
          <label className="field">
            Brand name
            <input
              value={settings.brand}
              onChange={(e) =>
                setSettings({ ...settings, brand: e.target.value })
              }
            />
          </label>
          <label className="field">
            WhatsApp business number
            <input
              type="tel"
              value={settings.whatsapp}
              onChange={(e) =>
                setSettings({ ...settings, whatsapp: e.target.value })
              }
              placeholder="Add your business number"
            />
          </label>
          <label className="field">
            Instagram profile URL
            <input
              type="url"
              value={settings.instagram}
              onChange={(e) =>
                setSettings({ ...settings, instagram: e.target.value })
              }
              placeholder="Your official Instagram profile"
            />
          </label>
          <button className="button" onClick={saveSettings}>
            Save settings
          </button>
          {settings.instagram && (
            <a
              className="button secondary"
              href={settings.instagram}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink />
              Open Instagram
            </a>
          )}
          <hr />
          <h2>Demo session</h2>
          <p>
            This prototype stores data on this browser. Sign-in is a frontend
            demonstration and does not protect sensitive information.
          </p>
          <button
            className="button secondary"
            onClick={() => {
              demoAuth.signOut();
              router.replace("/admin/login");
            }}
          >
            Log out
          </button>
        </section>
      )}
      {section === "search" && (
        <section className="admin-panel">
          <input
            className="input"
            aria-label="Search workspace"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the workspace"
          />
          <h2 className="search-results-title">Designs</h2>
          {designs
            .filter((d) =>
              (d.name + " " + d.description)
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((d) => (
              <Link
                className="search-result"
                href={"/designs/" + d.slug}
                key={d.id}
              >
                {d.name}
                <span>{d.id}</span>
              </Link>
            ))}
          <h2 className="search-results-title">Requests & customers</h2>
          {requests
            .filter((r) =>
              (r.name + " " + r.id + " " + r.description)
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((r) => (
              <Link
                className="search-result"
                href={
                  "/admin/requests?order=" +
                  r.id +
                  (r.orderStatus ? "&tab=orders" : "")
                }
                key={r.id}
              >
                {r.name}
                <span>{r.id}</span>
              </Link>
            ))}
        </section>
      )}
      {notice && (
        <p className="toast" role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            {" "}
            ×
          </button>
        </p>
      )}
    </>
  );
}
