"use server";

import { revalidatePath } from "next/cache";
import { assertStaff } from "@/lib/auth/staff";
import { ODOO_WRITE_API_KEY } from "@/lib/odoo/config";
import { callJson2 } from "@/lib/odoo/json2";

/**
 * Admin writes. Every one of them calls assertStaff() first — the UI hides
 * what a customer may not do, but this is what actually stops them.
 *
 * These are thin wrappers over Odoo's own models rather than a second
 * system: changing a price here is a write to product.template.list_price,
 * the same field the Odoo UI writes, so the two can never disagree.
 */

export type AdminResult = { ok: true; message: string } | { ok: false; error: string };

function fail(err: unknown): AdminResult {
  console.warn("[admin] write failed:", err);
  return { ok: false, error: "Odoo refused that change. Nothing was saved." };
}

/** Set a product's price. The one that started all this. */
export async function setProductPrice(
  templateId: number,
  price: number
): Promise<AdminResult> {
  await assertStaff();
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "That price isn't a number." };
  }
  try {
    await callJson2(
      "product.template",
      "write",
      { ids: [templateId], vals: { list_price: price } },
      ODOO_WRITE_API_KEY
    );
    revalidatePath("/admin");
    revalidatePath("/products");
    return { ok: true, message: `Price saved. The shop charges it from the next request.` };
  } catch (err) {
    return fail(err);
  }
}

/** Take a product off sale, or put it back. */
export async function setProductSaleable(
  templateId: number,
  saleOk: boolean
): Promise<AdminResult> {
  await assertStaff();
  try {
    await callJson2(
      "product.template",
      "write",
      { ids: [templateId], vals: { sale_ok: saleOk } },
      ODOO_WRITE_API_KEY
    );
    revalidatePath("/admin");
    revalidatePath("/products");
    return { ok: true, message: saleOk ? "Product is on sale." : "Product is off sale." };
  } catch (err) {
    return fail(err);
  }
}

/** A new product, in the shop's category, ready to be filled in in Odoo. */
export async function createProduct(
  name: string,
  price: number
): Promise<AdminResult> {
  await assertStaff();
  if (name.trim().length < 2) return { ok: false, error: "Give the product a name." };
  try {
    await callJson2(
      "product.template",
      "create",
      {
        vals_list: [
          {
            name: name.trim(),
            // Category 8 is what the shop reads; type service means no
            // inventory, which is what a digital good needs.
            categ_id: 8,
            type: "service",
            list_price: Number.isFinite(price) && price > 0 ? price : 0,
            sale_ok: true,
          },
        ],
      },
      ODOO_WRITE_API_KEY
    );
    revalidatePath("/admin");
    revalidatePath("/products");
    return {
      ok: true,
      message: "Product created. Add its description, media and files in Odoo.",
    };
  } catch (err) {
    return fail(err);
  }
}

/** Create a client project and put the client on it. */
export async function createProject(
  name: string,
  partnerId: number
): Promise<AdminResult> {
  await assertStaff();
  if (name.trim().length < 2) return { ok: false, error: "Give the project a name." };
  try {
    await callJson2(
      "project.project",
      "create",
      {
        vals_list: [
          { name: name.trim(), ...(partnerId ? { partner_id: partnerId } : {}) },
        ],
      },
      ODOO_WRITE_API_KEY
    );
    revalidatePath("/admin");
    revalidatePath("/account");
    return { ok: true, message: "Project created. The client sees it in their account." };
  } catch (err) {
    return fail(err);
  }
}

/** Point an existing project at a client — how a client gains access. */
export async function assignProject(
  projectId: number,
  partnerId: number
): Promise<AdminResult> {
  await assertStaff();
  try {
    await callJson2(
      "project.project",
      "write",
      { ids: [projectId], vals: { partner_id: partnerId || false } },
      ODOO_WRITE_API_KEY
    );
    revalidatePath("/admin");
    revalidatePath("/account");
    return {
      ok: true,
      message: partnerId ? "Client can now see this project." : "Client removed.",
    };
  } catch (err) {
    return fail(err);
  }
}

/** Move a project's health, which is the status the client reads. */
export async function setProjectStatus(
  projectId: number,
  status: string
): Promise<AdminResult> {
  await assertStaff();
  try {
    await callJson2(
      "project.project",
      "write",
      { ids: [projectId], vals: { last_update_status: status } },
      ODOO_WRITE_API_KEY
    );
    revalidatePath("/admin");
    revalidatePath("/account");
    return { ok: true, message: "Status updated." };
  } catch (err) {
    return fail(err);
  }
}

/** Confirm a quotation — what you do when a payment lands. */
export async function confirmOrder(orderId: number): Promise<AdminResult> {
  await assertStaff();
  try {
    try {
      await callJson2("sale.order", "action_confirm", { ids: [orderId] }, ODOO_WRITE_API_KEY);
    } catch {
      await callJson2(
        "sale.order",
        "write",
        { ids: [orderId], vals: { state: "sale" } },
        ODOO_WRITE_API_KEY
      );
    }
    revalidatePath("/admin");
    revalidatePath("/account");
    return {
      ok: true,
      message: "Order confirmed — the customer's downloads are released.",
    };
  } catch (err) {
    return fail(err);
  }
}

/** Cancel an order. */
export async function cancelOrder(orderId: number): Promise<AdminResult> {
  await assertStaff();
  try {
    await callJson2(
      "sale.order",
      "write",
      { ids: [orderId], vals: { state: "cancel" } },
      ODOO_WRITE_API_KEY
    );
    revalidatePath("/admin");
    revalidatePath("/account");
    return { ok: true, message: "Order cancelled." };
  } catch (err) {
    return fail(err);
  }
}
