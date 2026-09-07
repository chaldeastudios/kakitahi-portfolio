import "server-only";
import { ODOO_WRITE_API_KEY } from "./config";
import { callJson2 } from "./json2";

/**
 * Client projects, from Odoo's Project app.
 *
 * A client sees a project because the project's Customer field points at
 * their contact — the same res.partner their orders and their login already
 * point at. That is the whole link, and it is set in Odoo (or from /admin
 * here), so putting a client on a project is one field, not a new system.
 *
 * Reads are scoped to one partner id from the signed session, exactly as
 * orders are: a client cannot see a project that isn't theirs by changing a
 * number in a URL.
 *
 * Note on fields: `stage_id` is not readable on this database (project
 * stages aren't enabled), so the project's own health field —
 * `last_update_status` — is what the status column shows. Task stages come
 * from `project.task.state`, which is present.
 */

export type TaskView = {
  id: number;
  name: string;
  state: string;
  status: string;
  deadline: string | false;
};

export type ProjectView = {
  id: number;
  name: string;
  /** The client this project belongs to, when one is assigned. */
  partnerId: number;
  partnerName: string;
  status: string;
  taskCount: number;
  dateStart: string | false;
  dateEnd: string | false;
  tasks: TaskView[];
};

/** Odoo's project health values, in words a client would use. */
function describeProjectStatus(status: string): string {
  switch (status) {
    case "on_track":
      return "On track";
    case "at_risk":
      return "At risk";
    case "off_track":
      return "Off track";
    case "on_hold":
      return "On hold";
    case "done":
      return "Done";
    default:
      return "Just started";
  }
}

/** project.task.state values, likewise. */
function describeTaskState(state: string): string {
  switch (state) {
    case "01_in_progress":
      return "In progress";
    case "02_changes_requested":
      return "Changes requested";
    case "03_approved":
      return "Approved";
    case "04_waiting_normal":
      return "Waiting";
    case "1_done":
      return "Done";
    case "1_canceled":
      return "Cancelled";
    default:
      return state;
  }
}

type ProjectRow = {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  last_update_status: string;
  task_count: number;
  date_start: string | false;
  date: string | false;
};

type TaskRow = {
  id: number;
  name: string;
  project_id: [number, string] | false;
  state: string;
  date_deadline: string | false;
};

async function readProjects(domain: unknown[]): Promise<ProjectView[]> {
  const projects = await callJson2<ProjectRow[]>(
    "project.project",
    "search_read",
    {
      domain,
      fields: [
        "id",
        "name",
        "partner_id",
        "last_update_status",
        "task_count",
        "date_start",
        "date",
      ],
      order: "id desc",
      limit: 100,
    },
    ODOO_WRITE_API_KEY
  );

  if (projects.length === 0) return [];

  const tasks = await callJson2<TaskRow[]>(
    "project.task",
    "search_read",
    {
      domain: [["project_id", "in", projects.map((p) => p.id)]],
      fields: ["id", "name", "project_id", "state", "date_deadline"],
      order: "id asc",
      limit: 500,
    },
    ODOO_WRITE_API_KEY
  );

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    partnerId: Array.isArray(p.partner_id) ? p.partner_id[0] : 0,
    partnerName: Array.isArray(p.partner_id) ? p.partner_id[1] : "",
    status: describeProjectStatus(p.last_update_status),
    taskCount: p.task_count ?? 0,
    dateStart: p.date_start,
    dateEnd: p.date,
    tasks: tasks
      .filter((t) => t.project_id && t.project_id[0] === p.id)
      .map((t) => ({
        id: t.id,
        name: t.name,
        state: t.state,
        status: describeTaskState(t.state),
        deadline: t.date_deadline,
      })),
  }));
}

/** The projects this client is the customer on. Never throws. */
export async function getProjectsForPartner(
  partnerId: number
): Promise<{ projects: ProjectView[]; failed: boolean }> {
  if (!partnerId) return { projects: [], failed: false };
  try {
    return { projects: await readProjects([["partner_id", "=", partnerId]]), failed: false };
  } catch (err) {
    console.warn("[odoo] could not read projects:", err);
    return { projects: [], failed: true };
  }
}

/** Every project — staff only. Never throws. */
export async function getAllProjects(): Promise<{ projects: ProjectView[]; failed: boolean }> {
  try {
    return { projects: await readProjects([]), failed: false };
  } catch (err) {
    console.warn("[odoo] could not read all projects:", err);
    return { projects: [], failed: true };
  }
}
