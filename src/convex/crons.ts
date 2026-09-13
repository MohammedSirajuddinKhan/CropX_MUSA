import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Refresh AGMARKNET mandi prices every 6 hours (data.gov.in updates daily;
// a 6 h cadence catches the morning upload without hammering the API).
// The ingest is a public action (the console's "sync now" button shares it);
// a built-in cooldown protects the government API from over-calling.
crons.interval("agmarknet-ingest", { hours: 6 }, api.agmarknet.ingest, {
  force: false,
});

// Refresh Open-Meteo weather for all 34 districts every 6 hours (free API,
// no key required; stay polite regardless).
crons.interval("openmeteo-ingest", { hours: 6 }, api.openmeteo.ingest, {});

export default crons;
