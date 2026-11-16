# Agent office for Paseo

A [Paseo](https://paseo.sh) plugin that shows your coding agents as people working in an office.

- **One room per machine.** Every host connected to your Paseo app gets its own room; offline hosts show with the lights off.
- **Desks by seniority.** Opus/Fable agents get corner offices, Codex/GPT/Sonnet get window desks, DeepSeek and other models work in the open plan, Haiku/mini models hot-desk. Override with the agent label `office.tier=executive|senior|staff|intern`.
- **Live state.** Typing while working, a raised hand when waiting on a permission, fire on error, the break room when idle, "clocked out" for closed sessions.
- **Tap a character** to open that agent.

Drawn entirely with React Native views and emoji (no image assets), so it loads instantly on desktop and mobile. Client-only: it polls each online host's agent list every 4 seconds and sends nothing anywhere else.

## Install

Plugins must be enabled on the daemon (Settings → Plugins). Then:

```bash
git clone https://github.com/geareab/officeui
cd officeui && npm install && npm run typecheck
paseo plugin install "$PWD"
```

Open **Office** from the sidebar. Requires Paseo >= 0.15.4.

## Layout

- `index.client.tsx` registers the screen and sidebar item.
- `client/model.ts` maps agents to tiers and activities.
- `client/use-office.ts` polls agents from every host.
- `client/furniture.tsx` draws desks, characters and the break room.
- `client/office-screen.tsx` lays out rooms.
