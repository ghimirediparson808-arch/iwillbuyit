"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, MessageCircle, ArrowLeft, Trash2 } from "lucide-react";
import { AdminHeading } from "./AdminShell";
import { Modal } from "@/components/Modal";
import { useAsset, useDesigns, useRequests, useOrders } from "@/lib/hooks";
import { repository, whatsappUrl } from "@/services/repository";
import type {
  RequestRecord,
  OrderRecord,
  OrderInput,
  Colour,
  Side,
} from "@/types";
import "@/styles/commerce.css";
const money = (n: number) => `Rs. ${n.toLocaleString()}`;
function Artwork({ source, name }: { source?: string; name: string }) {
  const url = useAsset(source);
  return url ? (
    <img className="commerce-art" src={url} alt={name} />
  ) : (
    <div className="commerce-art empty-art">No reference image</div>
  );
}
function Timeline({ activity }: { activity: { text: string; at: string }[] }) {
  return (
    <section className="commerce-timeline">
      <h3>Activity</h3>
      <ol>
        {activity
          .slice()
          .reverse()
          .map((a, i) => (
            <li key={i}>
              <p>{a.text}</p>
              <time dateTime={a.at}>{new Date(a.at).toLocaleString()}</time>
            </li>
          ))}
      </ol>
    </section>
  );
}
function Note({
  initial,
  save,
}: {
  initial: string;
  save: (note: string) => void;
}) {
  const [note, setNote] = useState(initial);
  return (
    <div className="private-note">
      <label className="field">
        Private admin note
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <button
        className="button secondary"
        disabled={note === initial}
        onClick={() => save(note)}
      >
        Save note
      </button>
    </div>
  );
}
export function Requests() {
  const params = useSearchParams();
  const router = useRouter();
  const ordersTab = params.get("tab") === "orders";
  const requests = useRequests();
  const orders = useOrders();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [archived, setArchived] = useState(false);
  const [oldest, setOldest] = useState(false);
  const [form, setForm] = useState<RequestRecord | "manual" | null>(null);
  const [notice, setNotice] = useState("");
  const [undo, setUndo] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const selectedId = params.get("order");
  useEffect(() => {
    setFilter("All");
    setQuery("");
    setArchived(false);
  }, [ordersTab]);
  function url(id?: string, isOrder = ordersTab) {
    return `/admin/requests?${isOrder ? "tab=orders&" : ""}${id ? "order=" + encodeURIComponent(id) : ""}`;
  }
  function act(action: () => unknown, message?: string) {
    try {
      action();
      if (message) setNotice(message);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  const entries = (
    ordersTab ? orders.filter((o) => o.archived === archived) : requests
  )
    .filter((r) =>
      (
        r.name +
        " " +
        r.id +
        " " +
        r.phone +
        " " +
        ("snapshot" in r ? r.snapshot.name : r.description)
      )
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .filter(
      (r) =>
        filter === "All" ||
        ("paymentStatus" in r
          ? r.paymentStatus === filter || r.productionStatus === filter
          : r.status === filter),
    )
    .sort((a, b) =>
      oldest
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
    );
  const selected =
    entries.find((r) => r.id === selectedId) ||
    (!selectedId ? entries[0] : undefined);
  function removeOrder(id: string) {
    act(() => {
      repository.removeUnpaidTestOrder(id);
      setUndo(id);
      setTimeout(() => {
        setUndo((current) => (current === id ? null : current));
        act(() => repository.orders());
      }, 10000);
      router.push(url());
    }, "Test order removed");
  }
  return (
    <>
      <AdminHeading
        title={ordersTab ? "Orders" : "Requests"}
        subtitle={
          ordersTab
            ? "Confirmed work, payment and production."
            : "Conversations before an order is confirmed."
        }
      />
      <div className="commerce-toolbar">
        <nav className="pills" aria-label="Request workspace">
          <Link
            className={`pill ${!ordersTab ? "selected" : ""}`}
            onClick={() => {
              setFilter("All");
              setQuery("");
            }}
            href="/admin/requests"
          >
            Requests <span>{requests.length}</span>
          </Link>
          <Link
            className={`pill ${ordersTab ? "selected" : ""}`}
            onClick={() => {
              setFilter("All");
              setQuery("");
            }}
            href="/admin/requests?tab=orders"
          >
            Orders <span>{orders.filter((o) => !o.archived).length}</span>
          </Link>
        </nav>
        {ordersTab && (
          <button className="button" onClick={() => setForm("manual")}>
            <Plus />
            New Manual Order
          </button>
        )}
      </div>
      <div className="commerce-filters">
        <input
          className="input"
          aria-label="Search requests or orders"
          placeholder="Search name, ID or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="field">
          Status
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {(ordersTab
              ? [
                  "All",
                  "Unpaid",
                  "Paid",
                  "Refunded",
                  "Confirmed",
                  "Printing",
                  "Ready",
                  "Delivered",
                  "Cancelled",
                ]
              : ["All", "New", "Contacted", "Converted to Order", "Closed"]
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Sort
          <select
            value={oldest ? "oldest" : "newest"}
            onChange={(e) => setOldest(e.target.value === "oldest")}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
        {ordersTab && (
          <label className="check-label">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => {
                setArchived(e.target.checked);
                router.push(url());
              }}
            />
            Archived orders
          </label>
        )}
      </div>
      <div
        className={`commerce-workspace ${selectedId && selected ? "has-selection" : ""}`}
      >
        <aside
          className="admin-panel commerce-inbox"
          aria-label={ordersTab ? "Orders list" : "Requests list"}
        >
          <h2>
            {archived && ordersTab
              ? "Archived orders"
              : ordersTab
                ? "Orders"
                : "Requests"}{" "}
            <span>{entries.length}</span>
          </h2>
          {!entries.length && (
            <div className="commerce-empty">
              <h3>
                {query || filter !== "All"
                  ? "No matches"
                  : ordersTab
                    ? "No orders yet"
                    : "No requests yet"}
              </h3>
              <p>
                {query || filter !== "All"
                  ? "Try another search or status."
                  : ordersTab
                    ? "Create a manual order or confirm a customer request."
                    : "Customer submissions will appear here."}
              </p>
            </div>
          )}
          {entries.map((r) => (
            <Link
              key={r.id}
              className={`commerce-inbox-item ${selected?.id === r.id ? "selected" : ""}`}
              href={url(r.id)}
            >
              <div>
                <strong>{r.name}</strong>
                <span className="status-badge">
                  {"snapshot" in r ? r.productionStatus : r.status}
                </span>
              </div>
              <small>{r.id}</small>
              <p>
                {"snapshot" in r
                  ? `${r.snapshot.name} · ${money(r.total)}`
                  : r.designSnapshot?.name || "Custom design"}
              </p>
              <span className="commerce-kind">
                {"snapshot" in r
                  ? r.paymentStatus
                  : r.designId
                    ? "Gallery Design"
                    : "Custom Design"}
              </span>
            </Link>
          ))}
        </aside>
        <section className="admin-panel commerce-detail">
          <Link className="button secondary commerce-back" href={url()}>
            <ArrowLeft />
            Back to {ordersTab ? "orders" : "requests"}
          </Link>
          {!selected && (
            <div className="commerce-empty">
              <h2>
                {selectedId ? "Record not in this view" : "Ready when you are"}
              </h2>
              <p>Select a record to see its details.</p>
            </div>
          )}
          {selected &&
            ("snapshot" in selected ? (
              <OrderDetail
                key={selected.id}
                order={selected}
                act={act}
                remove={() => removeOrder(selected.id)}
              />
            ) : (
              <RequestDetail
                key={selected.id}
                request={selected}
                act={act}
                convert={() => setForm(selected)}
                remove={() => setConfirmDelete(selected.id)}
              />
            ))}
        </section>
      </div>
      {form && (
        <OrderForm
          request={form === "manual" ? undefined : form}
          onClose={() => setForm(null)}
          onSaved={(order) => {
            setForm(null);
            setFilter("All");
            setQuery("");
            setArchived(false);
            router.push(url(order.id, true));
            setNotice("Order created");
          }}
        />
      )}
      {confirmDelete && (
        <Modal
          title="Delete accidental request?"
          onClose={() => setConfirmDelete(null)}
        >
          <p>This removes this never-converted submission from your browser.</p>
          <div className="commerce-actions">
            <button
              className="button secondary"
              onClick={() => setConfirmDelete(null)}
            >
              Keep request
            </button>
            <button
              className="button danger"
              onClick={() =>
                act(() => {
                  repository.deleteRequest(confirmDelete);
                  setConfirmDelete(null);
                  router.push(url());
                }, "Request deleted")
              }
            >
              <Trash2 />
              Delete request
            </button>
          </div>
        </Modal>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
          {undo && (
            <button
              onClick={() =>
                act(() => {
                  repository.undoRemoveOrder(undo);
                  setUndo(null);
                }, "Order restored")
              }
            >
              Undo
            </button>
          )}
          <button
            aria-label="Dismiss notification"
            onClick={() => {
              setNotice("");
              setUndo(null);
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
type Act = (action: () => unknown, message?: string) => void;
function RequestDetail({
  request: r,
  act,
  convert,
  remove,
}: {
  request: RequestRecord;
  act: Act;
  convert: () => void;
  remove: () => void;
}) {
  const source =
    r.designSnapshot?.artwork ||
    r.variantArtwork ||
    (r.uploadId ? "upload:" + r.uploadId : "");
  const message = `Hi ${r.name}, this is I WILL BUY IT about your request ${r.id} for ${r.designSnapshot?.name || "a custom design"}. Let’s confirm your order details.`;
  return (
    <>
      <div className="commerce-detail-heading">
        <div>
          <span className="commerce-kind">
            {r.designId ? "Gallery Design" : "Custom Design"}
          </span>
          <h2>{r.name}</h2>
          <p>
            {r.id} · {new Date(r.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className="status-badge">{r.status}</span>
      </div>
      <div className="commerce-submission">
        <Artwork
          source={source}
          name={r.designSnapshot?.name || r.uploadName || "Customer reference"}
        />
        <dl>
          <div>
            <dt>WhatsApp</dt>
            <dd>{r.phone || "Not supplied"}</dd>
          </div>
          {r.email && (
            <div>
              <dt>Email</dt>
              <dd>{r.email}</dd>
            </div>
          )}
          <div>
            <dt>Design</dt>
            <dd>
              {r.designSnapshot?.name || r.uploadName || "Custom design"}
              {r.designSnapshot && <small>{r.designSnapshot.code}</small>}
            </dd>
          </div>
          <div>
            <dt>Colour / side</dt>
            <dd>
              {r.colour} / {r.side}
            </dd>
          </div>
          <div>
            <dt>Size / quantity</dt>
            <dd>
              {r.size} / {r.quantity}
            </dd>
          </div>
          <div>
            <dt>Needed by</dt>
            <dd>{r.neededBy || "Not specified"}</dd>
          </div>
        </dl>
      </div>
      <section className="original-message">
        <h3>Original customer message</h3>
        <p>{r.description}</p>
      </section>
      <div className="commerce-actions">
        {r.phone && (
          <a
            className={`button ${r.status === "New" ? "" : "secondary"}`}
            href={whatsappUrl(message, r.phone)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              try {
                if (r.status === "New")
                  repository.updateRequestStatus(r.id, "Contacted");
              } catch (error) {
                e.preventDefault();
                act(() => {
                  throw error;
                });
              }
            }}
          >
            <MessageCircle />
            Open WhatsApp
          </a>
        )}
        {r.orderId ? (
          <Link
            className="button"
            href={`/admin/requests?tab=orders&order=${r.orderId}`}
          >
            View Order {r.orderId}
          </Link>
        ) : r.status === "Closed" ? (
          <button
            className="button"
            onClick={() =>
              act(() => repository.reopenRequest(r.id), "Request reopened")
            }
          >
            Reopen Request
          </button>
        ) : (
          <>
            <button
              className={`button ${r.status === "New" ? "secondary" : ""}`}
              onClick={convert}
            >
              Create Order
            </button>
            <button
              className="button secondary"
              onClick={() =>
                act(() => repository.closeRequest(r.id), "Request closed")
              }
            >
              Close Request
            </button>
          </>
        )}
      </div>
      <Note
        initial={r.notes}
        save={(note) =>
          act(() => repository.saveRequestNote(r.id, note), "Note saved")
        }
      />
      <Timeline activity={r.activity} />
      {!r.orderId && (
        <button className="button secondary danger" onClick={remove}>
          <Trash2 />
          Delete accidental request
        </button>
      )}
    </>
  );
}
function OrderDetail({
  order: o,
  act,
  remove,
}: {
  order: OrderRecord;
  act: Act;
  remove: () => void;
}) {
  const next =
    o.paymentStatus === "Unpaid"
      ? {
          label: "Mark as Paid",
          run: () => repository.updatePaymentStatus(o.id, "Paid"),
        }
      : o.paymentStatus === "Paid" && o.productionStatus === "Confirmed"
        ? {
            label: "Start Printing",
            run: () => repository.updateProductionStatus(o.id, "Printing"),
          }
        : o.paymentStatus === "Paid" && o.productionStatus === "Printing"
          ? {
              label: "Mark Ready",
              run: () => repository.updateProductionStatus(o.id, "Ready"),
            }
          : o.paymentStatus === "Paid" && o.productionStatus === "Ready"
            ? {
                label: "Mark Delivered",
                run: () => repository.updateProductionStatus(o.id, "Delivered"),
              }
            : undefined;
  return (
    <>
      <div className="commerce-detail-heading">
        <div>
          <span className="commerce-kind">
            {o.requestId ? "From request" : "Manual order"}
          </span>
          <h2>{o.name}</h2>
          <p>
            {o.id} · {new Date(o.createdAt).toLocaleDateString()}
          </p>
          {o.requestId && (
            <Link href={`/admin/requests?order=${o.requestId}`}>
              Request {o.requestId}
            </Link>
          )}
        </div>
        <div className="order-badges">
          <span className="status-badge">{o.paymentStatus}</span>
          <span className="status-badge">{o.productionStatus}</span>
          {o.archived && <span className="badge">Archived</span>}
        </div>
      </div>
      <div className="commerce-submission">
        <div>
          <Artwork source={o.snapshot.artwork} name={o.snapshot.name} />
          {o.snapshot.backArtwork && (
            <Artwork
              source={o.snapshot.backArtwork}
              name={o.snapshot.name + " back"}
            />
          )}
        </div>
        <dl>
          <div>
            <dt>WhatsApp</dt>
            <dd>{o.phone}</dd>
          </div>
          <div>
            <dt>Design</dt>
            <dd>
              {o.snapshot.name}
              <small>{o.snapshot.code}</small>
            </dd>
          </div>
          <div>
            <dt>Colour / side</dt>
            <dd>
              {o.colour} / {o.side}
            </dd>
          </div>
          <div>
            <dt>Size / quantity</dt>
            <dd>
              {o.size} / {o.quantity}
            </dd>
          </div>
          {o.unitPrice !== undefined && (
            <div>
              <dt>Unit price</dt>
              <dd>{money(o.unitPrice)}</dd>
            </div>
          )}
          <div>
            <dt>Total price</dt>
            <dd>
              <strong>{money(o.total)}</strong>
            </dd>
          </div>
          <div>
            <dt>Needed by</dt>
            <dd>{o.neededBy || "Not specified"}</dd>
          </div>
        </dl>
      </div>
      <div className="commerce-actions">
        {!o.archived && o.productionStatus !== "Cancelled" && next && (
          <button className="button" onClick={() => act(next.run)}>
            {next.label}
          </button>
        )}
        {o.phone && (
          <a
            className="button secondary"
            href={whatsappUrl(
              `Hi ${o.name}, an update on your I WILL BUY IT order ${o.id}: ${o.snapshot.name} (${o.snapshot.code}), ${o.colour}, ${o.side}, size ${o.size}, quantity ${o.quantity}. Production: ${o.productionStatus}. Payment: ${o.paymentStatus}.`,
              o.phone,
            )}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle />
            Open WhatsApp
          </a>
        )}
      </div>
      {o.productionStatus === "Cancelled" && o.paymentStatus === "Paid" && (
        <p className="commerce-explainer">
          This cancelled order remains paid. Mark it refunded only after
          returning the payment.
        </p>
      )}
      <Note
        initial={o.notes || ""}
        save={(note) =>
          act(() => repository.saveOrderNote(o.id, note), "Note saved")
        }
      />
      <Timeline activity={o.activity} />
      <div className="commerce-actions secondary-actions">
        {o.archived ? (
          <button
            className="button"
            onClick={() =>
              act(() => repository.restoreOrder(o.id), "Order restored")
            }
          >
            Restore Order
          </button>
        ) : (
          <>
            <button
              className="button secondary"
              onClick={() =>
                act(() => repository.archiveOrder(o.id), "Order archived")
              }
            >
              Archive Order
            </button>
            {!["Cancelled", "Delivered"].includes(o.productionStatus) && (
              <button
                className="button secondary danger"
                onClick={() =>
                  act(() => repository.cancelOrder(o.id), "Order cancelled")
                }
              >
                Cancel Order
              </button>
            )}
            {o.paymentStatus === "Paid" && (
              <button
                className="button secondary danger"
                onClick={() =>
                  act(
                    () => repository.updatePaymentStatus(o.id, "Refunded"),
                    "Payment marked refunded",
                  )
                }
              >
                Mark Refunded
              </button>
            )}
            {!o.everPaid &&
              o.paymentStatus === "Unpaid" &&
              ["Confirmed", "Cancelled"].includes(o.productionStatus) &&
              !o.requestId && (
                <button className="button secondary danger" onClick={remove}>
                  <Trash2 />
                  Remove unpaid test order
                </button>
              )}
          </>
        )}
      </div>
    </>
  );
}
function OrderForm({
  request,
  onClose,
  onSaved,
}: {
  request?: RequestRecord;
  onClose: () => void;
  onSaved: (order: OrderRecord) => void;
}) {
  const designs = useDesigns(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={request ? "Create Order" : "New Manual Order"}
      onClose={onClose}
    >
      <p>Confirm the agreed garment and price. Payment starts as Unpaid.</p>
      <form
        className="order-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          const values = new FormData(e.currentTarget);
          const str = (key: string) => String(values.get(key) || "");
          const input: OrderInput = {
            name: str("name"),
            phone: str("phone"),
            designId: str("design"),
            colour: str("colour") as Colour,
            side: str("side") as Side | "both",
            size: str("size"),
            quantity: Number(str("quantity")),
            total: Number(str("total")),
            unitPrice: str("unitPrice") ? Number(str("unitPrice")) : undefined,
            notes: str("notes"),
            neededBy: str("neededBy"),
          };
          try {
            onSaved(
              request
                ? repository.convertRequestToOrder(request.id, input)
                : repository.createManualOrder(input),
            );
          } catch (err) {
            setError((err as Error).message);
            setBusy(false);
          }
        }}
      >
        <label className="field">
          Customer name
          <input name="name" required defaultValue={request?.name || ""} />
        </label>
        <label className="field">
          WhatsApp number
          <input
            name="phone"
            type="tel"
            required
            defaultValue={request?.phone || ""}
          />
        </label>
        <label className="field order-form-wide">
          Design
          <select
            aria-label="Design"
            name="design"
            required
            defaultValue={request?.designId || (request ? "custom" : "")}
          >
            <option value="" disabled>
              Choose a design
            </option>
            {request && !designs.some((d) => d.id === request.designId) && (
              <option value={request.designId || "custom"}>
                {request.designSnapshot?.name || "Customer’s custom design"}
              </option>
            )}
            {designs.map((d) => (
              <option value={d.id} key={d.id}>
                {d.name} · {d.id}
                {d.available === false ? " · unavailable" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Garment colour
          <select
            aria-label="Garment colour"
            name="colour"
            required
            defaultValue={request?.colour || ""}
          >
            <option value="" disabled>
              Choose colour
            </option>
            {["navy", "black", "cream"].map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Print side
          <select
            aria-label="Print side"
            name="side"
            required
            defaultValue={request?.side || ""}
          >
            <option value="" disabled>
              Choose side
            </option>
            <option value="front">Front</option>
            <option value="back">Back</option>
            <option value="both">Both</option>
          </select>
        </label>
        <label className="field">
          Size
          <select
            aria-label="Size"
            name="size"
            required
            defaultValue={request?.size || ""}
          >
            <option value="" disabled>
              Choose size
            </option>
            {Array.from(
              new Set([
                "XS",
                "S",
                "M",
                "L",
                "XL",
                "XXL",
                ...(request ? [request.size] : []),
              ]),
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Quantity
          <input
            name="quantity"
            type="number"
            required
            min="1"
            step="1"
            defaultValue={request?.quantity || ""}
          />
        </label>
        <label className="field">
          Total price (Rs.)
          <input name="total" type="number" required min="0.01" step="0.01" />
        </label>
        <label className="field">
          Unit price (optional)
          <input name="unitPrice" type="number" min="0" step="0.01" />
        </label>
        <label className="field">
          Needed by (optional)
          <input
            name="neededBy"
            type="date"
            defaultValue={request?.neededBy || ""}
          />
        </label>
        <label className="field order-form-wide">
          Private note (optional)
          <textarea name="notes" rows={3} defaultValue={request?.notes || ""} />
        </label>
        {error && (
          <p className="error order-form-wide" role="alert">
            {error}
          </p>
        )}
        <button className="button order-form-wide" disabled={busy}>
          {busy ? "Creating…" : "Confirm Order"}
        </button>
      </form>
    </Modal>
  );
}
