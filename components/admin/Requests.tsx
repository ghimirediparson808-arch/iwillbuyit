"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Phone,
  Eye,
  Download,
  Send,
  Box,
  FilePenLine,
  Info,
} from "lucide-react";
import { AdminHeading } from "./AdminShell";
import { Modal } from "@/components/Modal";
import { repository, newRequest, whatsappUrl } from "@/services/repository";
import { useAsset, useDesigns } from "@/lib/hooks";
import type { RequestRecord } from "@/types";
const workflow = [
  "Confirmed",
  "Paid",
  "Printing",
  "Quality Check",
  "Ready",
  "Delivered",
];
export function Requests() {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<RequestRecord[]>([]);
  const [tab, setTab] = useState("requests");
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All status");
  const [sort, setSort] = useState("Newest");
  const [inbox, setInbox] = useState(false);
  const [manual, setManual] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const params = searchParams;
    setTab(params.get("tab") === "orders" ? "orders" : "requests");
    setQuery(params.get("q") || "");
    const data = repository.requests();
    setEntries(data);
    setSelected(
      params.get("order") ||
        data.find((r) =>
          params.get("tab") === "orders" ? r.orderStatus : !r.orderStatus,
        )?.id ||
        "",
    );
    const update = () => setEntries(repository.requests());
    window.addEventListener("iwbi-data", update);
    return () => window.removeEventListener("iwbi-data", update);
  }, [searchParams]);
  useEffect(() => {
    const update = () => {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("tab") === "orders" ? "orders" : "requests";
      setTab(next);
      setSelected(
        repository
          .requests()
          .find((r) => (next === "orders" ? r.orderStatus : !r.orderStatus))
          ?.id || "",
      );
    };
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  const filtered = entries
    .filter(
      (r) =>
        (tab === "orders" ? !!r.orderStatus : !r.orderStatus) &&
        (r.name + " " + r.id + " " + r.description)
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (filter === "All status" || (r.orderStatus || r.status) === filter),
    )
    .sort((a, b) =>
      sort === "Newest"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
  const current = filtered.find((r) => r.id === selected) || filtered[0];
  function changeTab(value: string) {
    setTab(value);
    setFilter("All status");
    setSelected("");
    setInbox(false);
    window.history.replaceState(
      null,
      "",
      "/admin/requests" + (value === "orders" ? "?tab=orders" : ""),
    );
  }
  function update(
    id: string,
    patch: Partial<RequestRecord>,
    activity?: string,
  ) {
    try {
      repository.updateRequest(id, patch, activity);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  return (
    <>
      <AdminHeading title="Requests & Orders" search={false} />
      <div className="requests-toolbar">
        <div className="pills request-tabs">
          {["requests", "orders"].map((value) => (
            <button
              key={value}
              className={`pill ${tab === value ? "selected" : ""}`}
              onClick={() => changeTab(value)}
            >
              {value === "requests" ? "Custom Requests" : "Orders"}
              <span>
                {
                  entries.filter((r) =>
                    value === "orders" ? r.orderStatus : !r.orderStatus,
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        <div className="request-filters">
          <input
            className="input"
            aria-label="Search requests or orders"
            placeholder="Search requests or orders..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Filter status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {[
              "All status",
              ...(tab === "orders"
                ? ["New", ...workflow]
                : ["New Request", "Needs Info", "Proposal Ready", "Approved"]),
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Sort requests"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option>Newest</option>
            <option>Oldest</option>
          </select>
          <button className="button" onClick={() => setManual(true)}>
            <Plus />
            New manual order
          </button>
        </div>
      </div>
      <button className="back-inbox" onClick={() => setInbox(!inbox)}>
        <ArrowLeft />
        {inbox ? "Back to request" : "Back to inbox"}
      </button>
      <div className={`requests-grid ${inbox ? "show-inbox" : ""}`}>
        <aside className="admin-panel request-inbox">
          <h2>{tab === "orders" ? "Order inbox" : "Request inbox"}</h2>
          {filtered.length ? (
            filtered.map((r) => (
              <button
                className={`inbox-row ${r.id === current?.id ? "selected" : ""}`}
                key={r.id}
                onClick={() => {
                  setSelected(r.id);
                  setInbox(false);
                }}
              >
                <div>
                  <strong>{r.id}</strong>
                  <p>{r.name}</p>
                  <small>
                    {new Date(r.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </small>
                </div>
                <span className="status-badge">
                  {r.orderStatus || r.status.replace(" Request", "")}
                </span>
                <ChevronRight />
              </button>
            ))
          ) : (
            <p className="empty-state">
              No matching {tab}. Try another search.
            </p>
          )}
        </aside>
        {current ? (
          <RequestReview
            key={current.id}
            request={current}
            onUpdate={update}
            onNotice={setNotice}
          />
        ) : (
          <section className="admin-panel no-selection">
            <h2>No {tab === "orders" ? "orders" : "requests"} found</h2>
            <p>New customer submissions will appear here.</p>
          </section>
        )}
      </div>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            {" "}
            ×
          </button>
        </div>
      )}
      {manual && (
        <Modal title="New manual order" onClose={() => setManual(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              try {
                const r = newRequest({
                  name: String(d.get("name")),
                  phone: String(d.get("phone")),
                  description: String(d.get("description")),
                  colour: "navy",
                  side: "front",
                  size: "M",
                  quantity: 1,
                });
                repository.saveRequest({
                  ...r,
                  orderStatus: "Confirmed",
                  status: "Approved",
                  quote: Number(d.get("quote")),
                  available: true,
                });
                changeTab("orders");
                setSelected(r.id);
                setManual(false);
                setNotice("Manual order created.");
              } catch (e) {
                setNotice((e as Error).message);
              }
            }}
          >
            <label className="field">
              Customer name
              <input required name="name" minLength={2} />
            </label>
            <label className="field">
              Contact number
              <input required name="phone" type="tel" />
            </label>
            <label className="field">
              Order description
              <textarea required name="description" />
            </label>
            <label className="field">
              Total (Rs.)
              <input required name="quote" type="number" min="1" />
            </label>
            <button className="button">Create order</button>
          </form>
        </Modal>
      )}
    </>
  );
}
function RequestReview({
  request: r,
  onUpdate,
  onNotice,
}: {
  request: RequestRecord;
  onUpdate: (
    id: string,
    patch: Partial<RequestRecord>,
    activity?: string,
  ) => void;
  onNotice: (text: string) => void;
}) {
  const designs = useDesigns();
  const design =
    designs.find((d) => d.id === r.designId) ||
    designs.find((d) => d.slug === "the-climb");
  const src = useAsset(r.uploadId ? "upload:" + r.uploadId : design?.thumbnail);
  const [zoom, setZoom] = useState(false);
  const [quote, setQuote] = useState(r.quote?.toString() || "");
  const [readyDate, setReadyDate] = useState(r.readyDate || "");
  const [proposal, setProposal] = useState(r.proposal || "");
  const update = (patch: Partial<RequestRecord>, activity?: string) =>
    onUpdate(r.id, patch, activity);
  const message =
    r.proposal || `Hi ${r.name}, about your request ${r.id}: ${r.description}`;
  return (
    <>
      <section className="admin-panel request-detail">
        <div className="panel-heading">
          <h2>
            <span className="request-title-prefix">
              {r.orderStatus ? "Order" : "Custom request"}{" "}
            </span>
            {r.id}
          </h2>
          <span className="status-badge">
            {r.orderStatus || r.status.replace(" Request", "")}
          </span>
        </div>
        <div className="customer-line">
          <span className="avatar customer-avatar">{r.name[0]}</span>
          <div>
            <strong>{r.name}</strong>
            <p>{r.phone || "Contact not supplied"}</p>
          </div>
          <a
            className="button secondary"
            href={whatsappUrl(message, r.phone)}
            target="_blank"
            rel="noreferrer"
          >
            <img src="/assets/svg/whatsapp-outline.svg" alt="" />
            WhatsApp
          </a>
          {r.phone ? (
            <a className="button secondary" href={"tel:" + r.phone}>
              <Phone />
              Call
            </a>
          ) : (
            <button
              className="button secondary"
              disabled
              title="No phone number supplied"
            >
              <Phone />
              Call
            </button>
          )}
        </div>
        <h3>Customer’s idea</h3>
        <p className="idea-box">{r.description}</p>
        <h3>Uploaded references ({src ? 1 : 0})</h3>
        {src ? (
          <div className="reference-file">
            <img src={src} alt="Customer reference artwork" />
            <div>
              <strong>
                {r.uploadName || design?.name || "Design reference"}
              </strong>
              <p>
                {r.uploadId ? "Uploaded image" : "Approved design reference"}
              </p>
              <div>
                <button
                  className="button secondary"
                  onClick={() => setZoom(true)}
                >
                  <Eye />
                  Preview
                </button>
                <a
                  className="button secondary"
                  href={src}
                  download={r.uploadName || "reference.webp"}
                  aria-label="Download reference"
                >
                  <Download />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <p>No image uploaded.</p>
        )}
        <dl className="request-specs">
          {[
            ["Colour", r.colour],
            ["Print side", r.side],
            ["Size", r.size],
            ["Quantity", r.quantity],
            ["Needed by", r.neededBy || "Flexible"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <label className="field">
          Admin notes
          <textarea
            defaultValue={r.notes}
            onBlur={(e) => {
              if (e.target.value !== r.notes)
                update({ notes: e.target.value }, "Admin notes updated");
            }}
            placeholder="Add a private note..."
          />
        </label>
        <h3>Activity timeline</h3>
        <ol className="activity-timeline">
          {r.activity.slice(-4).map((a, i) => (
            <li key={i}>
              <span>{a.text}</span>
              <time>
                {new Date(a.at).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ol>
      </section>
      <section className="admin-panel review-panel">
        <h2>Review & next action</h2>
        <label className="status-field">
          Status
          <select
            value={r.orderStatus || r.status}
            onChange={(e) =>
              update(
                r.orderStatus
                  ? { orderStatus: e.target.value }
                  : { status: e.target.value },
                `Status changed to ${e.target.value}`,
              )
            }
          >
            {(r.orderStatus
              ? ["New", ...workflow]
              : ["New Request", "Needs Info", "Proposal Ready", "Approved"]
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="review-checks">
          {["Artwork usable", "Print size confirmed", "Stock available"].map(
            (check) => (
              <label key={check} className="check-label">
                <input
                  type="checkbox"
                  checked={(r.checks || []).includes(check)}
                  onChange={(e) =>
                    update({
                      checks: e.target.checked
                        ? [...(r.checks || []), check]
                        : (r.checks || []).filter((c) => c !== check),
                    })
                  }
                />
                {check}
              </label>
            ),
          )}
        </div>
        <h3>Proposal</h3>
        <div className="field-grid">
          <label className="field">
            Quoted total (Rs.)
            <input
              type="number"
              min="0"
              placeholder="e.g. 2400"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              onBlur={() => update({ quote: Number(quote) || undefined })}
            />
          </label>
          <label className="field">
            Estimated ready date
            <input
              type="date"
              value={readyDate}
              onChange={(e) => {
                setReadyDate(e.target.value);
                update({ readyDate: e.target.value });
              }}
            />
          </label>
        </div>
        <label className="field">
          Message to customer
          <textarea
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            onBlur={() => update({ proposal })}
            placeholder="Type your proposal message here..."
          />
        </label>
        <button
          className="button secondary prepare-proposal"
          onClick={() => {
            if (!proposal.trim() || Number(quote) <= 0) {
              onNotice(
                "Add a quoted total and a message before preparing the proposal.",
              );
              return;
            }
            update(
              {
                proposal,
                quote: Number(quote),
                readyDate,
                status: "Proposal Ready",
              },
              "Proposal prepared",
            );
            onNotice("Proposal saved. Use WhatsApp to review and send it.");
          }}
        >
          <Send />
          Send Proposal
        </button>
        <div className="review-actions">
          <button
            className="button secondary"
            onClick={() =>
              update(
                { available: !r.available },
                r.available
                  ? "Design marked unavailable"
                  : "Design marked available",
              )
            }
          >
            <Box />
            {r.available ? "Mark Unavailable" : "Mark Available"}
          </button>
          <button
            className="button"
            disabled={!!r.orderStatus}
            onClick={() => {
              if (Number(quote) <= 0) {
                onNotice("Add a quoted total before converting to an order.");
                return;
              }
              update(
                {
                  orderStatus: "Confirmed",
                  status: "Approved",
                  available: true,
                  quote: Number(quote),
                },
                "Converted to order",
              );
              onNotice("Order confirmed. It is now in the Orders tab.");
            }}
          >
            <FilePenLine />
            {r.orderStatus ? "Order confirmed" : "Convert to Order"}
          </button>
        </div>
        <h3>Order workflow preview</h3>
        <div className="order-workflow">
          {workflow.map((s, i) => (
            <button
              key={s}
              disabled={!r.orderStatus}
              className={
                r.orderStatus && workflow.indexOf(r.orderStatus) >= i
                  ? "done"
                  : ""
              }
              onClick={() =>
                update({ orderStatus: s }, `Order ${s.toLowerCase()}`)
              }
              aria-label={`Mark order ${s}`}
            >
              <i />
              <span>{s}</span>
            </button>
          ))}
        </div>
        <p className="saved-note">
          <Info />
          Every action is saved to this request.
        </p>
      </section>
      {zoom && (
        <Modal title="Uploaded reference" onClose={() => setZoom(false)}>
          <img src={src} alt="Customer reference, enlarged" />
        </Modal>
      )}
    </>
  );
}
