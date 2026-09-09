"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import { AdminHeading } from "./AdminShell";
import { SalesChart } from "./Dashboard";
import { repository } from "@/services/repository";
import { useDesigns, useOrders } from "@/lib/hooks";
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
  const orders = useOrders();
  const [query, setQuery] = useState(initialQuery);
  const [previewOpen, setPreviewOpen] = useState(!!previewId);
  const previewDesign = designs.find((d) => d.id === previewId);
  const [requests, setRequests] = useState(repository.requests());
  const [settings, setSettings] = useState(repository.settings());
  const [stock, setStock] = useState(repository.stock());
  const [notice, setNotice] = useState("");
  const [undo, setUndo] = useState<string | null>(null);
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
                      Edit Design
                    </Link>
                    <span className="badge">
                      {d.available === false
                        ? "Unavailable"
                        : d.published
                          ? "Published"
                          : "Draft"}
                    </span>
                    <button
                      className="button secondary"
                      onClick={() =>
                        d.available
                          ? repository.markDesignUnavailable(d.id)
                          : repository.makeDesignAvailable(d.id)
                      }
                    >
                      {d.available ? "Mark Unavailable" : "Make Available"}
                    </button>
                    <button
                      className="button secondary danger"
                      onClick={() => {
                        try {
                          repository.removeDesign(d.id);
                          setUndo(d.id);
                          setNotice("Design removed");
                          setTimeout(() => {
                            repository.finalizeDesignRemovals();
                            setUndo((current) =>
                              current === d.id ? null : current,
                            );
                          }, 10100);
                        } catch (e) {
                          setNotice((e as Error).message);
                        }
                      }}
                    >
                      <Trash2 />
                      Remove Design
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
                  <th>Request / order</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!requests.length && !orders.length && (
                  <tr>
                    <td colSpan={4}>No customers yet.</td>
                  </tr>
                )}
                {orders
                  .filter((o) => !o.requestId)
                  .map((o) => (
                    <tr key={o.id}>
                      <td>{o.name}</td>
                      <td>{o.phone}</td>
                      <td>
                        <Link href={`/admin/requests?tab=orders&order=${o.id}`}>
                          {o.id}
                        </Link>
                      </td>
                      <td>{o.productionStatus}</td>
                    </tr>
                  ))}
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.phone || "Not supplied"}</td>
                    <td>
                      <Link href={"/admin/requests?order=" + r.id}>{r.id}</Link>
                    </td>
                    <td>{r.status}</td>
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
          <button
            className="button secondary"
            onClick={() =>
              setStock([...stock, { colour: "navy", size: "M", count: 0 }])
            }
          >
            Add stock entry
          </button>
          {stock.map((s, i) => (
            <div className="stock-row" key={i}>
              <img
                src={`/assets/mockups/product/front/${s.colour}.webp`}
                alt={`${s.colour} shirt`}
              />
              <label className="field">
                Colour
                <select
                  aria-label={`Stock colour ${i + 1}`}
                  value={s.colour}
                  onChange={(e) =>
                    setStock(
                      stock.map((v, j) =>
                        j === i ? { ...v, colour: e.target.value } : v,
                      ),
                    )
                  }
                >
                  {["navy", "black", "cream"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Size
                <select
                  aria-label={`Stock size ${i + 1}`}
                  value={s.size}
                  onChange={(e) =>
                    setStock(
                      stock.map((v, j) =>
                        j === i ? { ...v, size: e.target.value } : v,
                      ),
                    )
                  }
                >
                  {["S", "M", "L", "XL", "XXL"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
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
              Sales include orders whose payment status is Paid, including
              archived orders. Unpaid and refunded orders are excluded.
              Production changes do not change paid sales.
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
          <h2 className="search-results-title">Orders</h2>
          {orders
            .filter((o) =>
              (o.name + " " + o.id + " " + o.snapshot.name)
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((o) => (
              <Link
                className="search-result"
                key={o.id}
                href={`/admin/requests?tab=orders&order=${o.id}`}
              >
                {o.name}
                <span>
                  {o.id} · {o.productionStatus}
                </span>
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
                href={"/admin/requests?order=" + r.id}
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
          {undo && (
            <button
              onClick={() => {
                try {
                  repository.undoRemoveDesign(undo);
                  setUndo(null);
                  setNotice("Design restored");
                } catch (e) {
                  setNotice((e as Error).message);
                }
              }}
            >
              Undo
            </button>
          )}
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
