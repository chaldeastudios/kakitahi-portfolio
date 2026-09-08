import type { Metadata } from "next";
import Link from "next/link";
import PageTemplate from "@/components/layout/PageTemplate";
import PageHero from "@/components/sections/PageHero";
import {
  OrdersPanel,
  ProductsPanel,
  ProjectsPanel,
  type AdminCustomer,
  type AdminOrder,
  type AdminProject,
} from "@/components/admin/AdminPanels";
import { requireStaff } from "@/lib/auth/staff";
import { ODOO_WRITE_API_KEY } from "@/lib/odoo/config";
import { callJson2 } from "@/lib/odoo/json2";
import { getProducts } from "@/lib/odoo/content";
import { getAllProjects } from "@/lib/odoo/projects";

/**
 * /admin — the studio's own view of the site, for an internal Odoo user.
 *
 * requireStaff() runs first and redirects anyone else; every action behind
 * these panels checks again server-side, so hiding the page is not what
 * protects it.
 */
export const metadata: Metadata = {
  title: "Admin — Isaiah Kakitahi",
  robots: { index: false, follow: false },
};

function describeState(state: string): string {
  switch (state) {
    case "draft":
      return "Quotation";
    case "sent":
      return "Quotation sent";
    case "sale":
      return "Confirmed";
    case "done":
      return "Complete";
    case "cancel":
      return "Cancelled";
    default:
      return state;
  }
}

export default async function AdminPage() {
  const session = await requireStaff();

  const [products, projectsResult, orders, customers] = await Promise.all([
    getProducts(),
    getAllProjects(),
    callJson2<
      Array<{
        id: number;
        name: string;
        partner_id: [number, string] | false;
        state: string;
        amount_total: number;
        currency_id: [number, string] | false;
      }>
    >(
      "sale.order",
      "search_read",
      {
        domain: [],
        fields: ["id", "name", "partner_id", "state", "amount_total", "currency_id"],
        order: "id desc",
        limit: 50,
      },
      ODOO_WRITE_API_KEY
    ).catch(() => []),
    callJson2<Array<{ id: number; name: string; email: string | false }>>(
      "res.partner",
      "search_read",
      {
        // Anyone with an email is someone a project could belong to.
        domain: [["email", "!=", false]],
        fields: ["id", "name", "email"],
        order: "name asc",
        limit: 200,
      },
      ODOO_WRITE_API_KEY
    ).catch(() => []),
  ]);

  const adminProjects: AdminProject[] = projectsResult.projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    taskCount: p.taskCount,
    partnerId: p.partnerId,
    partnerName: p.partnerName,
  }));

  const adminOrders: AdminOrder[] = orders.map((o) => ({
    id: o.id,
    reference: o.name,
    customer: Array.isArray(o.partner_id) ? o.partner_id[1] : "—",
    state: o.state,
    status: describeState(o.state),
    amountTotal: o.amount_total,
    currency: Array.isArray(o.currency_id) ? o.currency_id[1] : "",
  }));

  const adminCustomers: AdminCustomer[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: typeof c.email === "string" ? c.email : "",
  }));

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <PageHero title="Admin">
          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-10 overflow-hidden border-b border-l border-border bg-yellow p-6">
            <div className="flex flex-col items-start gap-2">
              <span className="t-button">Signed in as staff</span>
              <p className="t-h4">{session.name}</p>
              <p className="t-body">{session.email}</p>
            </div>
            <p className="t-body max-w-[460px]">
              Everything here writes to Odoo directly. There is no second copy of any of it, so a
              change made here and a change made in Odoo are the same change.
            </p>
          </div>

          <div className="flex min-h-[340px] w-full flex-col items-start justify-between gap-10 overflow-hidden bg-black p-6 text-white">
            <div className="flex w-full flex-col gap-[14px]">
              <div className="flex w-full items-center justify-between gap-6 border-b border-border pb-[14px]">
                <span className="t-body">Products</span>
                <span className="t-body">{products.length}</span>
              </div>
              <div className="flex w-full items-center justify-between gap-6 border-b border-border pb-[14px]">
                <span className="t-body">Projects</span>
                <span className="t-body">{adminProjects.length}</span>
              </div>
              <div className="flex w-full items-center justify-between gap-6 border-b border-border pb-[14px]">
                <span className="t-body">Orders</span>
                <span className="t-body">{adminOrders.length}</span>
              </div>
            </div>
            <Link href="/account" className="t-button underline underline-offset-4">
              Your customer account
            </Link>
          </div>
        </PageHero>

        <ProductsPanel
          products={products.map((p) => ({
            templateId: p.templateId,
            title: p.title,
            slug: p.slug,
            priceValue: p.priceValue,
            currency: p.currency,
            purchasable: p.purchasable,
          }))}
        />
        <ProjectsPanel projects={adminProjects} customers={adminCustomers} />
        <OrdersPanel orders={adminOrders} />
      </div>
    </PageTemplate>
  );
}
