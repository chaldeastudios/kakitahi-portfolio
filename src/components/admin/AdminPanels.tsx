"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  assignProject,
  cancelOrder,
  confirmOrder,
  createProduct,
  createProject,
  setProductPrice,
  setProductSaleable,
  setProjectStatus,
  type AdminResult,
} from "@/app/admin/actions";

/**
 * The admin surface: the handful of things worth doing from the site rather
 * than from Odoo, because they are the things that change what a visitor
 * sees right now — a price, whether something is on sale, which client can
 * see which project, and whether a payment has landed.
 *
 * It is deliberately not a second Odoo. Anything structural — descriptions,
 * media, attachments, taxes — stays in Odoo, because rebuilding those forms
 * here would mean two places to get them wrong.
 *
 * Same furniture as the rest of the site: hairline rules, the yellow
 * marker, black buttons. Nothing about it says "dashboard".
 */

const inputClass =
  "t-body w-full border border-black bg-white px-3 py-2 text-black outline-none " +
  "transition-[box-shadow] duration-200 focus:shadow-[inset_0_-3px_0_0_var(--color-yellow)]";

const STATUSES = [
  { value: "to_define", label: "Just started" },
  { value: "on_track", label: "On track" },
  { value: "at_risk", label: "At risk" },
  { value: "off_track", label: "Off track" },
  { value: "on_hold", label: "On hold" },
  { value: "done", label: "Done" },
];

export type AdminProduct = {
  templateId: number;
  title: string;
  slug: string;
  priceValue: number;
  currency: string;
  purchasable: boolean;
};

export type AdminProject = {
  id: number;
  name: string;
  status: string;
  taskCount: number;
  partnerId: number;
  partnerName: string;
};

export type AdminOrder = {
  id: number;
  reference: string;
  customer: string;
  state: string;
  status: string;
  amountTotal: number;
  currency: string;
};

export type AdminCustomer = { id: number; name: string; email: string };

function Section({
  title,
  children,
  tone = "white",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "white" | "offwhite";
}) {
  return (
    <section
      className={`flex w-full flex-col items-start gap-6 border-b border-border p-6 desktop:p-10 ${
        tone === "white" ? "bg-white" : "bg-offwhite"
      }`}
    >
      <div className="flex items-center gap-[6px]">
        <span aria-hidden="true" className="block h-[10px] w-[10px] shrink-0 bg-yellow" />
        <h2 className="t-button">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/** Runs an action and shows what it said. */
function useAction() {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<AdminResult | null>(null);
  const run = (fn: () => Promise<AdminResult>) => start(async () => setNote(await fn()));
  return { pending, note, run };
}

function Note({ note }: { note: AdminResult | null }) {
  if (!note) return null;
  return (
    <p
      role="status"
      className={`t-body-s border-l-[3px] pl-3 ${note.ok ? "border-yellow" : "border-black"}`}
    >
      {note.ok ? note.message : note.error}
    </p>
  );
}

export function ProductsPanel({ products }: { products: AdminProduct[] }) {
  const { pending, note, run } = useAction();
  const [prices, setPrices] = useState<Record<number, string>>(
    Object.fromEntries(products.map((p) => [p.templateId, String(p.priceValue)]))
  );
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("0");

  return (
    <Section title="Products & pricing">
      <p className="t-body max-w-[620px]">
        A price saved here is written to the product in Odoo. The shop charges it from the next
        request — nothing to redeploy, and no copy of it anywhere else.
      </p>

      <div className="flex w-full flex-col">
        {products.map((p) => (
          <div
            key={p.templateId}
            className="flex w-full flex-col gap-3 border-b border-border py-4 tablet:flex-row tablet:items-center tablet:gap-6"
          >
            <Link href={`/products/${p.slug}`} className="t-h5 min-w-0 flex-1">
              {p.title}
            </Link>

            <div className="flex items-center gap-2">
              <span className="t-body-s w-10 shrink-0">{p.currency}</span>
              <input
                className={`${inputClass} w-32`}
                inputMode="decimal"
                value={prices[p.templateId] ?? ""}
                onChange={(e) => setPrices((s) => ({ ...s, [p.templateId]: e.target.value }))}
                aria-label={`Price for ${p.title}`}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => setProductPrice(p.templateId, Number(prices[p.templateId])))}
                className="t-button bg-black px-4 py-2 text-white disabled:opacity-60"
              >
                Save
              </button>
            </div>

            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setProductSaleable(p.templateId, !p.purchasable))}
              className="t-button shrink-0 border border-black px-4 py-2 disabled:opacity-60"
            >
              {p.purchasable ? "Take off sale" : "Put on sale"}
            </button>
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col gap-3 tablet:flex-row tablet:items-end">
        <label className="flex flex-1 flex-col gap-2">
          <span className="t-button">New product</span>
          <input
            className={inputClass}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="t-button">Price</span>
          <input
            className={`${inputClass} w-32`}
            inputMode="decimal"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => createProduct(newName, Number(newPrice)))}
          className="t-button bg-black px-6 py-3 text-white disabled:opacity-60"
        >
          Create
        </button>
      </div>

      <p className="t-body-s max-w-[620px] text-lightblack">
        A new product appears in the shop straight away with its name and price. Its description,
        media and downloadable file are added in Odoo — see the README for the record shape.
      </p>

      <Note note={note} />
    </Section>
  );
}

export function ProjectsPanel({
  projects,
  customers,
}: {
  projects: AdminProject[];
  customers: AdminCustomer[];
}) {
  const { pending, note, run } = useAction();
  const [newName, setNewName] = useState("");
  const [newPartner, setNewPartner] = useState("");

  return (
    <Section title="Client projects" tone="offwhite">
      <p className="t-body max-w-[620px]">
        A client sees a project when they are the customer on it. That is one field in Odoo, and
        it is the field this sets — so granting access and keeping the record are the same act.
      </p>

      <div className="flex w-full flex-col">
        {projects.length === 0 && (
          <p className="t-body-s py-3 text-lightblack">No projects yet.</p>
        )}
        {projects.map((p) => (
          <div
            key={p.id}
            className="flex w-full flex-col gap-3 border-b border-border py-4 tablet:flex-row tablet:items-center tablet:gap-6"
          >
            <div className="min-w-0 flex-1">
              <span className="t-h5 block">{p.name}</span>
              <span className="t-body-s text-lightblack">
                {p.taskCount} task{p.taskCount === 1 ? "" : "s"} ·{" "}
                {p.partnerName || "No client assigned"}
              </span>
            </div>

            <select
              className={`${inputClass} tablet:w-56`}
              defaultValue={String(p.partnerId || "")}
              onChange={(e) => run(() => assignProject(p.id, Number(e.target.value)))}
              disabled={pending}
              aria-label={`Client for ${p.name}`}
            >
              <option value="">No client</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.email}
                </option>
              ))}
            </select>

            <select
              className={`${inputClass} tablet:w-44`}
              defaultValue={STATUSES.find((s) => s.label === p.status)?.value ?? "to_define"}
              onChange={(e) => run(() => setProjectStatus(p.id, e.target.value))}
              disabled={pending}
              aria-label={`Status for ${p.name}`}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col gap-3 tablet:flex-row tablet:items-end">
        <label className="flex flex-1 flex-col gap-2">
          <span className="t-button">New project</span>
          <input
            className={inputClass}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="t-button">Client</span>
          <select
            className={`${inputClass} tablet:w-56`}
            value={newPartner}
            onChange={(e) => setNewPartner(e.target.value)}
          >
            <option value="">No client yet</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.email}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => createProject(newName, Number(newPartner)))}
          className="t-button bg-black px-6 py-3 text-white disabled:opacity-60"
        >
          Create
        </button>
      </div>

      <Note note={note} />
    </Section>
  );
}

export function OrdersPanel({ orders }: { orders: AdminOrder[] }) {
  const { pending, note, run } = useAction();

  return (
    <Section title="Orders">
      <p className="t-body max-w-[620px]">
        A priced order arrives as a quotation and stays there until you confirm it. Confirming
        releases the customer&apos;s downloads, so confirm when the payment has actually landed.
      </p>

      <div className="flex w-full flex-col">
        {orders.length === 0 && <p className="t-body-s py-3 text-lightblack">No orders yet.</p>}
        {orders.map((o) => (
          <div
            key={o.id}
            className="flex w-full flex-col gap-3 border-b border-border py-4 tablet:flex-row tablet:items-center tablet:gap-6"
          >
            <span className="t-h5 shrink-0">{o.reference}</span>
            <span className="t-body min-w-0 flex-1 truncate">{o.customer}</span>
            <span className="t-body-s shrink-0">
              {o.amountTotal === 0
                ? "Free"
                : `${o.currency} ${o.amountTotal.toLocaleString("en-GB")}`}
            </span>
            <span className="t-button flex shrink-0 items-center gap-[6px]">
              <span
                aria-hidden="true"
                className={`block h-[10px] w-[10px] shrink-0 ${
                  o.state === "sale" || o.state === "done" ? "bg-yellow" : "border border-black"
                }`}
              />
              {o.status}
            </span>

            <div className="flex shrink-0 items-center gap-2">
              {o.state !== "sale" && o.state !== "done" && o.state !== "cancel" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => confirmOrder(o.id))}
                  className="t-button bg-black px-4 py-2 text-white disabled:opacity-60"
                >
                  Confirm
                </button>
              )}
              {o.state !== "cancel" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => cancelOrder(o.id))}
                  className="t-button border border-black px-4 py-2 disabled:opacity-60"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Note note={note} />
    </Section>
  );
}
