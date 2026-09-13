import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Refresh AGMARKNET mandi prices every 6 hours (data.gov.in updates daily;
// a 6 h cadence catches the morning upload without hammering the API).
crons.interval("agmarknet-ingest", { hours: 6 }, internal.agmarknet.ingest);

export default crons;
