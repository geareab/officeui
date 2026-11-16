import type { PluginTheme } from "@getpaseo/plugin";
import { Animated, Pressable, Text, View } from "react-native";
import type { Activity, OfficeAgent, Tier } from "./model";

// Decorative art palette for characters. Text and surfaces always use theme colors.
const SKIN = ["#f1c7a3", "#e0ac83", "#c68a5c", "#9b6640", "#6f4a2d"];
const HAIR = ["#2b2118", "#5a3b22", "#a0663b", "#d8b46a", "#7b7b7b", "#1f2a44"];

export function alpha(color: string, amount: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  const byte = Math.round(Math.max(0, Math.min(1, amount)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${color}${byte}`;
}

export function activityColor(theme: PluginTheme, activity: Activity): string {
  switch (activity) {
    case "working":
      return theme.colors.statusSuccess;
    case "starting":
      return theme.colors.accent;
    case "waiting":
      return theme.colors.statusWarning;
    case "error":
      return theme.colors.statusDanger;
    default:
      return theme.colors.border;
  }
}

export const ACTIVITY_BADGE: Record<Activity, string> = {
  working: "⌨️",
  starting: "💬",
  waiting: "✋",
  error: "🔥",
  idle: "☕",
  gone: "🚪",
};

export const ACTIVITY_TEXT: Record<Activity, string> = {
  working: "working",
  starting: "settling in",
  waiting: "needs approval",
  error: "something broke",
  idle: "on break",
  gone: "clocked out",
};

function shirtColor(theme: PluginTheme, tier: Tier): string {
  switch (tier) {
    case "executive":
      return theme.colors.accent;
    case "senior":
      return theme.colors.foreground;
    case "staff":
      return theme.colors.foregroundMuted;
    default:
      return theme.colors.surface2;
  }
}

interface CharacterProps {
  agent: OfficeAgent;
  theme: PluginTheme;
  scale: number;
  bob?: Animated.AnimatedInterpolation<number> | number;
}

/** A tiny person built from rectangles: hair, head, shoulders. */
export function Character({ agent, theme, scale: s, bob = 0 }: CharacterProps) {
  const head = 16 * s;
  const skin = SKIN[agent.seed % SKIN.length];
  const hair = HAIR[(agent.seed >> 3) % HAIR.length];
  const shirt = shirtColor(theme, agent.tier);
  return (
    <Animated.View style={{ alignItems: "center", transform: [{ translateY: bob }] }}>
      <View style={{ width: head, height: head, borderRadius: head / 2, backgroundColor: skin }}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: head * 0.42,
            borderTopLeftRadius: head / 2,
            borderTopRightRadius: head / 2,
            backgroundColor: hair,
          }}
        />
      </View>
      <View
        style={{
          width: 26 * s,
          height: 14 * s,
          marginTop: 1,
          borderTopLeftRadius: 9 * s,
          borderTopRightRadius: 9 * s,
          backgroundColor: shirt,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: "center",
        }}
      >
        {agent.tier === "executive" ? (
          <View
            style={{
              width: 3 * s,
              height: 9 * s,
              marginTop: 1,
              backgroundColor: theme.colors.statusDanger,
            }}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

function Monitor({ theme, color, lit, scale: s }: { theme: PluginTheme; color: string; lit: boolean; scale: number }) {
  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: 20 * s,
          height: 13 * s,
          borderRadius: 2,
          borderWidth: 2,
          borderColor: theme.colors.foregroundMuted,
          backgroundColor: lit ? alpha(color, 0.75) : theme.colors.surface0,
        }}
      />
      <View style={{ width: 4 * s, height: 3 * s, backgroundColor: theme.colors.foregroundMuted }} />
    </View>
  );
}

function Chair({ theme, scale: s }: { theme: PluginTheme; scale: number }) {
  return (
    <View
      style={{
        width: 24 * s,
        height: 22 * s,
        marginTop: 9 * s,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        backgroundColor: theme.colors.surface2,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    />
  );
}

const DESK_SIZE: Record<Tier, { width: number; desk: number; monitors: number }> = {
  executive: { width: 190, desk: 130, monitors: 2 },
  senior: { width: 150, desk: 100, monitors: 2 },
  staff: { width: 124, desk: 78, monitors: 1 },
  intern: { width: 104, desk: 56, monitors: 1 },
};

interface DeskProps {
  agent: OfficeAgent;
  theme: PluginTheme;
  scale: number;
  tick: Animated.Value;
  onPress?: () => void;
}

export function Desk({ agent, theme, scale: s, tick, onPress }: DeskProps) {
  const size = DESK_SIZE[agent.tier];
  const color = activityColor(theme, agent.activity);
  const present = agent.activity !== "idle";
  const busy = agent.activity === "working" || agent.activity === "starting";
  const bob = busy ? tick.interpolate({ inputRange: [0, 1], outputRange: [0, -2 * s] }) : 0;
  const badgeLift =
    agent.activity === "waiting" || agent.activity === "error"
      ? tick.interpolate({ inputRange: [0, 1], outputRange: [0, -4 * s] })
      : 0;
  const executive = agent.tier === "executive";
  const senior = agent.tier === "senior";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${agent.name}, ${agent.model}, ${ACTIVITY_TEXT[agent.activity]}. Open agent.`}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size.width * s,
        padding: 8 * s,
        borderRadius: 10,
        borderWidth: executive ? 2 : 1,
        borderColor: executive ? alpha(theme.colors.accent, 0.6) : theme.colors.border,
        backgroundColor: executive
          ? alpha(theme.colors.accent, 0.08)
          : senior
            ? theme.colors.surface1
            : theme.colors.surface0,
        opacity: pressed ? 0.7 : 1,
        alignItems: "center",
      })}
    >
      {executive || senior ? (
        <View
          style={{
            alignSelf: "stretch",
            height: 6 * s,
            borderRadius: 3,
            marginBottom: 4 * s,
            backgroundColor: alpha(theme.colors.accent, executive ? 0.35 : 0.18),
          }}
        />
      ) : null}

      <Animated.Text
        style={{
          height: 18 * s,
          fontSize: 13 * s,
          color: theme.colors.foreground,
          opacity: agent.activity === "idle" ? 0 : 1,
          transform: [{ translateY: badgeLift }],
        }}
      >
        {ACTIVITY_BADGE[agent.activity]}
      </Animated.Text>

      <View style={{ height: 34 * s, justifyContent: "flex-end" }}>
        {present ? <Character agent={agent} theme={theme} scale={s} bob={bob} /> : <Chair theme={theme} scale={s} />}
      </View>

      <View
        style={{
          width: size.desk * s,
          height: 20 * s,
          marginTop: -6 * s,
          borderRadius: 4,
          backgroundColor: theme.colors.surface2,
          borderWidth: 1,
          borderColor: theme.colors.border,
          flexDirection: "row",
          justifyContent: size.monitors > 1 ? "space-between" : "flex-start",
          alignItems: "flex-end",
          paddingHorizontal: 6 * s,
          paddingBottom: 3 * s,
        }}
      >
        {Array.from({ length: size.monitors }, (_, i) => (
          <Monitor key={i} theme={theme} color={color} lit={present} scale={s} />
        ))}
        {executive ? <Text style={{ fontSize: 14 * s, color: theme.colors.foreground }}>🪴</Text> : null}
      </View>

      <View
        style={{
          marginTop: 6 * s,
          alignSelf: "stretch",
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}
      >
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
        <Text
          numberOfLines={1}
          style={{ flex: 1, color: theme.colors.foreground, fontSize: 12 * s, fontWeight: executive ? "700" : "500" }}
        >
          {agent.name}
        </Text>
      </View>
      <Text numberOfLines={1} style={{ alignSelf: "stretch", color: theme.colors.foregroundMuted, fontSize: 10.5 * s }}>
        {agent.model} · {ACTIVITY_TEXT[agent.activity]}
      </Text>
    </Pressable>
  );
}

interface LoungeProps {
  agents: readonly OfficeAgent[];
  theme: PluginTheme;
  scale: number;
  onOpen: (agent: OfficeAgent) => void;
}

/** Idle agents leave their desks and hang out on the couch. */
export function BreakRoom({ agents, theme, scale: s, onOpen }: LoungeProps) {
  return (
    <View
      style={{
        padding: 10 * s,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: theme.colors.border,
        backgroundColor: alpha(theme.colors.statusWarning, 0.05),
        gap: 6,
      }}
    >
      <Text style={{ color: theme.colors.foregroundMuted, fontSize: 11 * s }}>☕ Break room · {agents.length}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 * s }}>
        {agents.map((agent) => (
          <Pressable
            key={agent.id}
            accessibilityRole="button"
            accessibilityLabel={`${agent.name}, on break. Open agent.`}
            onPress={() => onOpen(agent)}
            style={({ pressed }) => ({ width: 64 * s, alignItems: "center", opacity: pressed ? 0.6 : 1 })}
          >
            <Character agent={agent} theme={theme} scale={s * 0.9} />
            <View
              style={{
                width: 44 * s,
                height: 9 * s,
                marginTop: -3 * s,
                borderRadius: 4,
                backgroundColor: theme.colors.surface2,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            />
            <Text numberOfLines={1} style={{ color: theme.colors.foreground, fontSize: 10 * s, marginTop: 2 }}>
              {agent.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
