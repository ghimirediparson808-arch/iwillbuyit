"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FilePenLine,
  Box,
  Settings,
  ChartNoAxesColumnIncreasing,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { dashboardData, salesSeries } from "@/services/dashboard";
import { useOrders } from "@/lib/hooks";
import { repository } from "@/services/repository";
import { AdminHeading } from "./AdminShell";
export function SalesChart() {
  const [range, setRange] = useState(30);
  const orders = useOrders();
  const series = salesSeries(orders, range);
  const data = series.map((d) => d.value);
  const maximum = Math.max(
    1000,
    Math.ceil((Math.max(...data) * 1.1) / 1000) * 1000,
  );
  const points = data.map((n, i) => [
    50 + (i * 710) / (data.length - 1),
    205 - (n / maximum) * 180,
  ]);
  // Horizontal tangents preserve each observed value without overshooting peaks.
  const curve = points.reduce((path, point, i) => {
    if (!i) return `M${point.join(",")}`;
    const previous = points[i - 1];
    const middle = (previous[0] + point[0]) / 2;
    return `${path} C${middle},${previous[1]} ${middle},${point[1]} ${point.join(",")}`;
  }, "");
  const dates = Array.from(
    { length: 7 },
    (_, i) => series[Math.round((i * (series.length - 1)) / 6)].label,
  );
  return (
    <section className="admin-panel sales-panel">
      <div className="panel-heading">
        <h2>Sales Overview</h2>
        <div className="pills" aria-label="Sales period">
          {[7, 30, 90].map((n) => (
            <button
              key={n}
              className={`pill ${range === n ? "selected" : ""}`}
              onClick={() => setRange(n)}
              aria-pressed={range === n}
            >
              {n} days
            </button>
          ))}
        </div>
      </div>
      <svg
        className="sales-chart"
        viewBox="0 0 790 250"
        role="img"
        aria-label={`Sales overview for ${range} days, total Rs. ${data.reduce((a, b) => a + b, 0).toLocaleString()}`}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#377fcc" stopOpacity=".18" />
            <stop offset="1" stopColor="#377fcc" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <line
              x1="50"
              x2="760"
              y1={205 - i * 36}
              y2={205 - i * 36}
              stroke="#e4ebf3"
            />
            <text
              x="32"
              y={210 - i * 36}
              textAnchor="end"
              fill="#60799b"
              fontSize="13"
            >
              {i ? ((i * maximum) / 5000).toLocaleString() + "K" : "0"}
            </text>
          </g>
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line
            key={i}
            x1={50 + i * 118.33}
            x2={50 + i * 118.33}
            y1="25"
            y2="205"
            stroke="#e4ebf3"
          />
        ))}
        <path d={`${curve} L760,205 L50,205 Z`} fill="url(#chart-fill)" />
        <path
          d={curve}
          fill="none"
          stroke="#062e59"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {data.map((n, i) => (
          <circle
            key={i}
            cx={50 + (i * 710) / (data.length - 1)}
            cy={205 - (n / maximum) * 180}
            r="4"
            fill="#062e59"
          />
        ))}
        {dates.map((d, i) => (
          <text
            key={d}
            x={50 + i * 118.33}
            y="234"
            textAnchor="middle"
            fill="#60799b"
            fontSize="13"
          >
            {d}
          </text>
        ))}
      </svg>
    </section>
  );
}
export function Dashboard() {
  const [requests, setRequests] = useState(repository.requests());
  const [stock, setStock] = useState(repository.stock());
  useEffect(() => {
    const update = () => {
      setRequests(repository.requests());
      setStock(repository.stock());
    };
    update();
    window.addEventListener("iwbi-data", update);
    return () => window.removeEventListener("iwbi-data", update);
  }, []);
  const orders = useOrders();
  const snapshot = dashboardData(requests, orders);
  const recentOrders = snapshot.orders
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)
    .map((r) => ({
      id: r.id,
      name: r.name,
      design: r.snapshot.name,
      status: r.productionStatus,
      total: r.total,
      updated: new Date(r.activity.at(-1)?.at || r.createdAt).toLocaleString(
        "en-GB",
        { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
      ),
    }));
  const statuses = snapshot.statuses;
  const totalOrders = snapshot.orders.length;
  let running = 0;
  const donutFill = totalOrders
    ? `conic-gradient(${statuses
        .map((s) => {
          const start = running;
          running += (s.count / totalOrders) * 100;
          return `${s.colour} ${start}% ${running}%`;
        })
        .join(",")})`
    : "var(--line)";
  const metrics = [
    {
      title: "New Requests",
      value: snapshot.newRequests,
      caption: "Needs review",
      icon: FilePenLine,
    },
    {
      title: "Active Orders",
      value: snapshot.confirmed,
      caption: "Awaiting delivery",
      icon: Box,
    },
    {
      title: "In Printing",
      value: snapshot.production,
      caption: "Active now",
      icon: Settings,
    },
    {
      title: "Total Paid Sales",
      value: "Rs. " + snapshot.sales.toLocaleString(),
      caption: "Paid order value",
      icon: ChartNoAxesColumnIncreasing,
    },
  ];
  return (
    <>
      <AdminHeading
        title="Good morning, Admin"
        subtitle={new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      />
      <div className="metrics-grid">
        {metrics.map(({ title, value, caption, icon: Icon }, i) => (
          <Link
            key={title}
            href={
              i === 3
                ? "/admin/analytics"
                : "/admin/requests" + (i ? "?tab=orders" : "")
            }
            className={`admin-panel metric metric-${i}`}
          >
            <span className="metric-icon">
              <Icon />
            </span>
            <div>
              <h2>{title}</h2>
              <strong>{value}</strong>
              <p>{caption}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="dashboard-charts">
        <SalesChart />
        <section className="admin-panel status-panel">
          <h2>Order Status</h2>
          <div className="status-content">
            <div className="donut" style={{ background: donutFill }}>
              <div>
                <strong>{totalOrders}</strong>
                <p>Total Orders</p>
              </div>
            </div>
            <ul>
              {statuses.map((s) => (
                <li key={s.name}>
                  <span style={{ background: s.colour }} />
                  {s.name}
                  <b>{s.count}</b>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="admin-panel recent-orders">
          <div className="panel-heading">
            <h2>Recent Orders</h2>
            <Link href="/admin/requests?tab=orders">
              View all <ArrowRight />
            </Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {[
                    "Order ID",
                    "Customer",
                    "Design",
                    "Status",
                    "Total",
                    "Updated",
                  ].map((v) => (
                    <th key={v}>{v}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!recentOrders.length && (
                  <tr>
                    <td colSpan={6}>No orders yet.</td>
                  </tr>
                )}
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/requests?tab=orders&order=${o.id}`}>
                        {o.id}
                      </Link>
                    </td>
                    <td>{o.name}</td>
                    <td>{o.design}</td>
                    <td>
                      <span
                        className={`status-badge status-${o.status.toLowerCase()}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>Rs. {o.total.toLocaleString()}</td>
                    <td>{o.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="admin-panel stock-panel">
          <div className="panel-heading">
            <h2>Stock Alerts</h2>
            <Link href="/admin/inventory">
              View all <ArrowRight />
            </Link>
          </div>
          {!stock.length && <p>No stock entries yet.</p>}
          {stock.map((s) => (
            <Link
              key={s.colour + s.size}
              href="/admin/inventory"
              className="stock-row"
            >
              <img
                src={`/assets/mockups/product/front/${s.colour}.webp`}
                alt={`${s.colour} T-shirt`}
              />
              <span>
                {s.colour[0].toUpperCase() + s.colour.slice(1)} • {s.size}
              </span>
              <p>
                <i />
                {s.count} left
              </p>
              <ChevronRight />
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
