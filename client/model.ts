import type { getPaseoClient } from "@getpaseo/plugin/client";

type PaseoApi = ReturnType<typeof getPaseoClient>;
export type AgentEntry = Awaited<ReturnType<PaseoApi["agents"]["list"]>>["entries"][number];
export type AgentSnapshot = AgentEntry["agent"];

/** Seniority decides which desk an agent gets. Highest first. */
export type Tier = "executive" | "senior" | "staff" | "intern";
export const TIERS: readonly Tier[] = ["executive", "senior", "staff", "intern"];

export const TIER_INFO: Record<Tier, { rank: string; area: string }> = {
  executive: { rank: "Executive", area: "Corner offices" },
  senior: { rank: "Senior", area: "Window desks" },
  staff: { rank: "Staff", area: "Open plan" },
  intern: { rank: "Intern", area: "Hot desks" },
};

/** Agent label that overrides the model-derived tier, e.g. `office.tier=executive`. */
export const TIER_LABEL = "office.tier";

function isTier(value: string): value is Tier {
  return (TIERS as readonly string[]).includes(value);
}

export function tierFor(agent: AgentSnapshot): Tier {
  const override = agent.labels?.[TIER_LABEL]?.trim().toLowerCase();
  if (override && isTier(override)) return override;
  const id = [agent.provider, agent.model, agent.runtimeInfo?.model]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/opus|fable/.test(id)) return "executive";
  if (/haiku|nano|[-_/ ]mini\b/.test(id)) return "intern";
  if (/codex|gpt|sonnet|\bo[34]\b/.test(id)) return "senior";
  return "staff";
}

/** What the character is doing right now. */
export type Activity = "working" | "starting" | "waiting" | "error" | "idle" | "gone";

export function activityFor(agent: AgentSnapshot): Activity {
  if (agent.status === "closed") return "gone";
  if (agent.pendingPermissions?.length) return "waiting";
  if (agent.status === "error") return "error";
  if (agent.status === "running") return "working";
  if (agent.status === "initializing") return "starting";
  return "idle";
}

export interface OfficeAgent {
  id: string;
  serverId: string;
  name: string;
  model: string;
  project: string | null;
  tier: Tier;
  activity: Activity;
  /** Stable 0..n hash used to vary character looks. */
  seed: number;
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function shortModel(agent: AgentSnapshot): string {
  const raw = agent.runtimeInfo?.model ?? agent.model ?? agent.provider;
  const last = raw.split("/").pop() ?? raw;
  return last.replace(/^claude-/, "");
}

export function toOfficeAgent(serverId: string, entry: AgentEntry): OfficeAgent {
  const { agent, project } = entry;
  const projectName = project?.projectName ?? null;
  return {
    id: agent.id,
    serverId,
    name: agent.title?.trim() || projectName || agent.id.slice(0, 8),
    model: shortModel(agent),
    project: projectName,
    tier: tierFor(agent),
    activity: activityFor(agent),
    seed: hash(agent.id),
  };
}

export interface Room {
  serverId: string;
  label: string;
  status: "idle" | "connecting" | "online" | "offline" | "error";
  loading: boolean;
  error: string | null;
  agents: OfficeAgent[];
}

export function countBy(agents: readonly OfficeAgent[], activity: Activity): number {
  return agents.filter((agent) => agent.activity === activity).length;
}
