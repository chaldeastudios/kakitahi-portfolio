import "server-only";
import { cache } from "react";
import { callJson2 } from "./json2";

/**
 * Resolving Odoo record ids without hardcoding them.
 *
 * A numeric id is only as stable as the database it came from. This site
 * used to hardcode several — a couple of product.category ids, two
 * blog.blog ids, a blog.tag id, and base.group_portal's id — all read off
 * one specific Odoo instance and frozen into the code. That broke the
 * moment the backend changed to a different database (a migration has no
 * reason to hand out the same auto-increment ids for records this project
 * created at runtime), and for base.group_portal specifically, silently
 * assigning a new customer to whatever group happens to sit at id 10 on
 * the new instance is worse than a broken page — it's the wrong
 * permission grant.
 *
 * Two different lookups, because these ids come from two different
 * places:
 *
 * - resolveIdByName: for records this project created itself via plain
 *   create() calls (a product.category, a blog.blog, a blog.tag) — these
 *   have no Odoo external id, only a name, so name is what's stable.
 * - resolveXmlId: for records Odoo itself ships as part of a module's own
 *   data (base.group_portal is created by the `base` module) — these
 *   carry a real external id (ir.model.data) that's the same across any
 *   correctly-installed Odoo database, which is a stronger guarantee than
 *   a name that someone could rename.
 *
 * Both are wrapped in cache() so a render that needs the same id more
 * than once shares one lookup; a fresh request always re-resolves.
 */

export const resolveIdByName = cache(
  async (model: string, nameField: string, name: string, apiKey: string): Promise<number> => {
    const [row] = await callJson2<Array<{ id: number }>>(
      model,
      "search_read",
      { domain: [[nameField, "=", name]], fields: ["id"], limit: 1 },
      apiKey
    );
    if (!row) {
      throw new Error(
        `[odoo] ${model} "${name}" not found — has it been renamed, or not carried over by a migration?`
      );
    }
    return row.id;
  }
);

export const resolveXmlId = cache(
  async (module: string, name: string, apiKey: string): Promise<number> => {
    const [row] = await callJson2<Array<{ res_id: number }>>(
      "ir.model.data",
      "search_read",
      { domain: [["module", "=", module], ["name", "=", name]], fields: ["res_id"], limit: 1 },
      apiKey
    );
    if (!row) {
      throw new Error(`[odoo] external id "${module}.${name}" not found on this database.`);
    }
    return row.res_id;
  }
);
