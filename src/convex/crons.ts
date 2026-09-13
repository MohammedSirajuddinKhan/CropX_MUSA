import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Refresh AGMARKNET mandi prices every 6 hours (data.gov.in updates daily;
// a 6 h cadence catches the morning upload without hammering the API).
// The ingest is a public action (the console's "sync now" button shares it);
// a built-in cooldown protects the government API from over-calling.
crons.interval("agmarknet-ingest", { hours: 6 }, api.agmarknet.ingest);

export default crons;
