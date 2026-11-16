import type { PluginTheme } from "@getpaseo/plugin";
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, ScrollView, Text, View } from "react-native";
import { BreakRoom, Desk, alpha } from "./furniture";
import { type OfficeAgent, type Room, TIERS, TIER_INFO, TIER_LABEL, countBy } from "./model";
import { useOffice } from "./use-office";

/** One looping 0..1 value shared by every animated character. */
function useTick(useNativeDriver: boolean): Animated.Value {
  const tick = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tick, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver }),
        Animated.timing(tick, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [tick, useNativeDriver]);
  return tick;
}

function summary(agents: readonly OfficeAgent[]): string {
  const parts = [
    [countBy(agents, "working") + countBy(agents, "starting"), "⌨️"],
    [countBy(agents, "waiting"), "✋"],
    [countBy(agents, "error"), "🔥"],
    [countBy(agents, "idle"), "☕"],
  ] as const;
  return parts.map(([n, icon]) => `${icon} ${n}`).join("   ");
}

function hostDot(theme: PluginTheme, status: Room["status"]): string {
  if (status === "online") return theme.colors.statusSuccess;
  if (status === "connecting" || status === "idle") return theme.colors.statusWarning;
  return theme.colors.statusDanger;
}

interface RoomViewProps {
  room: Room;
  theme: PluginTheme;
  scale: number;
  compact: boolean;
  tick: Animated.Value;
  open: (agent: OfficeAgent) => void;
}

function RoomView({ room, theme, scale, compact, tick, open }: RoomViewProps) {
  const present = room.agents.filter((a) => a.activity !== "gone");
  const onBreak = present.filter((a) => a.activity === "idle");
  const gone = room.agents.length - present.length;
  const online = room.status === "online";

  let notice: string | null = null;
  if (!online) notice = `💡 Lights off · machine is ${room.status}`;
  else if (room.error) notice = `⚠️ ${room.error}`;
  else if (room.loading) notice = "Unlocking the doors…";
  else if (present.length === 0) notice = "Empty office · no agents on this machine";

  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: online ? theme.colors.surface1 : alpha(theme.colors.surface1, 0.5),
        padding: compact ? 12 : 16,
        gap: 12,
        opacity: online ? 1 : 0.65,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: hostDot(theme, room.status) }} />
        <Text style={{ color: theme.colors.foreground, fontSize: compact ? 16 : 18, fontWeight: "700" }}>
          🖥️ {room.label}
        </Text>
        {online ? (
          <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>
            {present.length} {present.length === 1 ? "agent" : "agents"}
          </Text>
        ) : null}
        <View style={{ flex: 1 }} />
        {present.length ? (
          <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>{summary(present)}</Text>
        ) : null}
      </View>

      {notice ? <Text style={{ color: theme.colors.foregroundMuted, fontSize: 13 }}>{notice}</Text> : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 * scale, alignItems: "flex-start" }}>
        {TIERS.map((tier) => {
          // Idle agents keep their desk (empty chair) and also appear in the break room.
          const desks = present.filter((a) => a.tier === tier);
          if (!desks.length) return null;
          return (
            <View
              key={tier}
              style={{
                gap: 6,
                padding: 8 * scale,
                borderRadius: 10,
                backgroundColor: alpha(theme.colors.surface0, 0.6),
                maxWidth: "100%",
              }}
            >
              <Text style={{ color: theme.colors.foregroundMuted, fontSize: 11, letterSpacing: 0.5 }}>
                {TIER_INFO[tier].area.toUpperCase()} · {TIER_INFO[tier].rank}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 * scale }}>
                {desks.map((agent) => (
                  <Desk key={agent.id} agent={agent} theme={theme} scale={scale} tick={tick} onPress={() => open(agent)} />
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {onBreak.length ? <BreakRoom agents={onBreak} theme={theme} scale={scale} onOpen={open} /> : null}

      {gone ? (
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: 11 }}>
          🚪 {gone} clocked out (closed sessions)
        </Text>
      ) : null}
    </View>
  );
}

export function OfficeScreen({ theme, layout, navigation }: PluginScreenProps) {
  const rooms = useOffice();
  const tick = useTick(layout.platform !== "web");
  const scale = layout.compact ? 0.85 : 1;

  const everyone = useMemo(
    () => rooms.flatMap((room) => room.agents.filter((a) => a.activity !== "gone")),
    [rooms],
  );

  const open = (agent: OfficeAgent) => navigation?.openAgent({ agentId: agent.id, serverId: agent.serverId });

  const styles = useMemo(
    () => ({
      screen: { flex: 1, backgroundColor: theme.colors.surface0 },
      content: { padding: layout.compact ? 12 : 24, gap: layout.compact ? 12 : 16 },
      title: { color: theme.colors.foreground, fontSize: layout.compact ? 20 : 24, fontWeight: "700" as const },
      muted: { color: theme.colors.foregroundMuted, fontSize: 12 },
    }),
    [theme, layout.compact],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>🏢 Agent office</Text>
        <Text style={styles.muted}>
          {rooms.length} {rooms.length === 1 ? "machine" : "machines"} · {everyone.length} in the office ·{" "}
          {summary(everyone)}
        </Text>
        <Text style={styles.muted}>
          Desks by model: Opus/Fable get corner offices · Codex/GPT/Sonnet get window desks · DeepSeek
          and others work open plan · Haiku/mini hot-desk. Set label {TIER_LABEL}=executive|senior|staff|intern
          to promote anyone. Tap a person to open the agent.
        </Text>
      </View>

      {rooms.length === 0 ? (
        <Text style={styles.muted}>No machines connected yet. Add a host in Paseo to open an office.</Text>
      ) : (
        rooms.map((room) => (
          <RoomView
            key={room.serverId}
            room={room}
            theme={theme}
            scale={scale}
            compact={layout.compact}
            tick={tick}
            open={open}
          />
        ))
      )}
    </ScrollView>
  );
}
