import { getPaseoClient, useHosts } from "@getpaseo/plugin/client";
import { useQueries } from "@tanstack/react-query";
import { type AgentEntry, type Room, TIERS, toOfficeAgent } from "./model";

const POLL_MS = 4000;

/** One room per known Paseo host, each listing that machine's agents. */
export function useOffice(): Room[] {
  const hosts = useHosts();
  const results = useQueries({
    queries: hosts.map((host) => ({
      queryKey: ["officeui", "agents", host.serverId],
      enabled: host.status === "online",
      refetchInterval: POLL_MS,
      queryFn: async (): Promise<AgentEntry[]> => {
        const { entries } = await getPaseoClient(host.serverId).agents.list({
          filter: { includeArchived: false },
          page: { limit: 200 },
        });
        return entries;
      },
    })),
  });

  return hosts.map((host, index) => {
    const result = results[index];
    const online = host.status === "online";
    const agents = online
      ? (result?.data ?? [])
          .filter((entry) => !entry.agent.archivedAt && !entry.agent.internal)
          .map((entry) => toOfficeAgent(host.serverId, entry))
          .sort(
            (a, b) =>
              TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || a.name.localeCompare(b.name),
          )
      : [];
    const error = result?.error;
    return {
      serverId: host.serverId,
      label: host.label,
      status: host.status,
      loading: online && !!result?.isPending,
      error: online && error ? (error instanceof Error ? error.message : String(error)) : null,
      agents,
    };
  });
}
