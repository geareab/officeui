Agent office shows your Paseo agents as people working in an office. Open it from the **Office** item in the sidebar.

Every connected machine gets its own room. Each agent sits at a desk in the room for the machine it runs on. A character's state shows how the agent is doing: typing while it works, a raised hand when it is waiting for a permission, fire when it has errored. Idle agents leave an empty chair and move to the break room. Closed sessions are counted as clocked out. Tap a character to open that agent.

Seniority decides the desk. Opus and Fable agents get corner offices, Codex, GPT, and Sonnet agents get window desks, DeepSeek and other models work in the open plan, and Haiku or mini models hot-desk. To place an agent yourself, give it the label `office.tier` with the value `executive`, `senior`, `staff`, or `intern`.

The office polls each online host's agent list every four seconds through your existing Paseo connections. It only reads agent data, sends nothing anywhere else, and needs no setup. Offline machines appear as rooms with the lights off.
