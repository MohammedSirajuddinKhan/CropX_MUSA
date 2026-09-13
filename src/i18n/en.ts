/**
 * English dictionary — the source of truth for every UI string.
 * Keys are dotted; values may carry {placeholders}. Hindi/Marathi
 * dictionaries override these (missing keys fall back to English).
 */
export const en = {
  // --- shared controls ---
  "ctl.theme.light": "light",
  "ctl.theme.dark": "dark",
  "ctl.theme.title": "Toggle theme",
  "ctl.lang.title": "Language",

  // --- landing ---
  "landing.tagline": "regional agricultural intelligence",
  "landing.hero": "See the glut before the market does.",
  "landing.sub":
    "CropX detects when collective planting behavior is about to oversupply a regional market — 6 to 8 weeks before harvest, while there is still time to act.",
  "landing.openConsole": "open the console →",
  "landing.method": "method",
  "landing.methodTitle": "Not a price predictor. An oversupply detector.",
  "landing.methodBody":
    "Price models tell you what the market already knows. CropX models the supply side: planting reports, historical area, seasonality, and market absorption capacity. When projected arrivals exceed what the market can absorb, the risk score rises — weeks before prices move.",
  "landing.demoNote":
    "live demo — drag the slider. the same engine runs the console; numbers are calibrated to a Nashik rabi-onion season and are not live government data.",
  "landing.badge":
    "MUSA CodeX 2026 · problem CX0602 · 34 Maharashtra districts × {n} vegetables · signals simulated",
  "landing.footerLeft": "cropx · early-warning intelligence for regional crop oversupply",
  "landing.footerRight":
    "crop areas from GoI/NHB statistics · signals simulated · 34 districts × {n} vegetables",
  "landing.demoChrome": "cropx risk engine · nashik · onion · {n} vegetables monitored",
  "landing.demo": "demo",
  "landing.plantingSignals": "planting signals",
  "landing.supplyForecast": "supply forecast",
  "landing.glutRisk": "glut risk",
  "landing.scenario": "scenario",
  "landing.planting": "planting",
  "landing.expectedSupply": "expected supply",
  "landing.projectedChange": "projected planting change",
  "landing.tbl.signalLayer": "signal layer",
  "landing.tbl.model": "model",
  "landing.tbl.coverage": "coverage",
  "landing.tbl.output": "output",
  "landing.tbl.decisions": "decisions",
  "landing.tbl.signalLayerV": "FPO & farmer planting reports",
  "landing.tbl.modelV": "XGBoost + SHAP (v1: calibrated engine)",
  "landing.tbl.coverageV": "34 Maharashtra farming districts, taluka-level nodes",
  "landing.tbl.outputV": "glut risk + uncertainty, per district",
  "landing.tbl.decisionsV": "scenario simulator & briefs for FPOs",

  // --- console shell ---
  "nav.simulator": "Scenario Simulator",
  "nav.monitor": "Risk Monitor",
  "nav.signals": "Signal Stream",
  "nav.monitorGroup": "Monitor",
  "nav.scopeTitle": "v1 scope",
  "nav.scopeBody":
    "15 vegetables × 34 Maharashtra farming districts, anchored to GoI/NHB horticulture statistics. Scenario simulator for FPOs.",
  "nav.engineOnline": "engine online",
  "nav.dataStream": "data sim-stream",
  "nav.exit": "exit",
  "top.region": "region",
  "top.crop": "crop",
  "top.horizon": "horizon",
  "top.updated": "updated",
  "top.coverage": "coverage",
  "top.weeks": "{n} weeks",

  // --- risk header ---
  "risk.glutRiskTitle": "{crop} — glut risk",
  "risk.wksToHarvest": "{n} wks to harvest",
  "risk.score": "score",
  "risk.range": "range {lo}–{hi}",
  "risk.confidence": "confidence {n}%",
  "risk.expectedSupply": "expected supply",
  "risk.vsMedian": "vs 5-yr median",
  "risk.arrivalsVsCapacity": "arrivals vs capacity",
  "risk.ofAbsorption": "of absorption",
  "risk.oversupplyGap": "oversupply gap",
  "risk.ofCapacity": "{n}% of capacity",
  "risk.planting": "planting",
  "risk.median": "median {area}",

  // --- simulator ---
  "sim.title": "Scenario Simulator",
  "sim.meta": "what-if planting & absorption levers",
  "sim.reset": "reset to baseline",
  "sim.baselineState": "baseline state",
  "sim.plantingChange": "Projected planting change",
  "sim.absorptionShift": "Market absorption shift",
  "sim.absorptionLow": "−15% (disruption)",
  "sim.absorptionMid": "0",
  "sim.absorptionHigh": "+15% (new buyers/storage)",
  "sim.presetTitle": "Preset · diversify planting",
  "sim.presetBody":
    "Shift roughly a quarter of marginal {crop} plots out of {crop}. Area falls below the 5-yr median and projected arrivals move back within absorption tolerance.",
  "sim.presetRun": "Run diversification scenario →",
  "sim.scenarioRisk": "Glut risk — scenario",
  "sim.range": "range {lo}–{hi}%",
  "sim.conf": "conf {n}%",
  "sim.baselineShort": "baseline {n}%",
  "sim.expectedProduction": "Expected production",
  "sim.expectedArrivals": "Expected arrivals",
  "sim.oversupplyGap": "Oversupply gap",
  "sim.vsMedian": "vs 5-yr median",
  "sim.base": "base",
  "sim.engineNote":
    "Engine: {model} · signals: simulated FPO/farmer stream (prototype) · coverage {coverage}% · production model is calibrated to a Nashik rabi-onion season, not a live XGBoost backend.",

  // --- compare table ---
  "cmp.title": "Baseline → Scenario",
  "cmp.meta": "digital twin · what changes",
  "cmp.noScenario": "no scenario applied",
  "cmp.applied": "planting {p}% · absorption {c}%",
  "cmp.metric": "Metric",
  "cmp.baseline": "Baseline",
  "cmp.scenario": "Scenario",
  "cmp.plantingArea": "Planting area",
  "cmp.expectedProduction": "Expected production",
  "cmp.expectedArrivals": "Expected arrivals",
  "cmp.oversupplyGap": "Oversupply gap",
  "cmp.glutRisk": "Glut risk",

  // --- drivers ---
  "drv.title": "Why is the risk high?",
  "drv.meta": "model drivers · shap-style",
  "drv.footNote":
    "Contributions sum to the model score's deviation from neutral (50). Structured for direct SHAP output swap-in when the XGBoost service is connected.",
  "drv.planting": "Planting signal",
  "drv.glutPattern": "Historical glut pattern",
  "drv.production": "Expected production",
  "drv.arrivals": "Market arrivals trend",
  "drv.weather": "Rainfall conditions",
  "drv.tier.high": "HIGH",
  "drv.tier.mediumHigh": "MED-HIGH",
  "drv.tier.medium": "MEDIUM",
  "drv.tier.lowMedium": "LOW-MED",
  "drv.tier.low": "LOW",

  // --- signals panel ---
  "sig.title": "Planting signals",
  "sig.meta": "prototype stream · simulated",
  "sig.reports": "{n} reports",
  "sig.estPlanting": "Est. planting",
  "sig.median5yr": "5-yr median",
  "sig.deviation": "Deviation",
  "sig.inject": "inject demo reports",
  "sig.injected": "+{n} injected",
  "sig.coverage": "coverage {n}%",
  "sig.minAgo": "{n}m ago",

  // --- recommendation ---
  "rec.title": "CropX recommendation",
  "rec.reflectsScenario": "reflects active scenario",
  "rec.baselineState": "baseline state",
  "rec.priority": "priority: {p}",
  "rec.for": "for: {audience}",
  "rec.foot": "brief generated from model output · not investment advice",
  "rec.audience.FPO": "FPO",
  "rec.audience.fpoBuyers": "FPO + buyers",
  "rec.audience.all": "all",

  // --- village table ---
  "vil.title": "Village / taluka nodes",
  "vil.meta": "{n} monitored nodes · {region} · {crop}",
  "vil.node": "Node",
  "vil.planting": "Planting",
  "vil.share": "Share",
  "vil.vsMedian": "vs median",
  "vil.stream": "Stream",
  "vil.mandi": "mandi",
  "vil.foot":
    "Node areas estimated from simulated FPO/taluka reports; shares normalized within the district. Prototype data, not live surveys.",

  // --- district grid ---
  "grid.title": "District risk grid",
  "grid.meta": "{n} monitored districts · {crop} baseline",
  "grid.notMonitored": "not monitored (urban, negligible cultivated area)",
  "grid.div.pune": "Pune division",
  "grid.div.nashik": "Nashik division",
  "grid.div.marathwada": "Chhatrapati Sambhajinagar (Marathwada)",
  "grid.div.vidarbha": "Nagpur (Vidarbha)",
  "grid.div.konkan": "Konkan",
  "grid.cellTitle": "{name} — glut risk {risk}% ({band})",

  // --- monitor page ---
  "mon.forecastTitle": "Arrivals forecast",
  "mon.forecastMeta":
    "{region} · {crop} · weekly tonnes · uncertainty band = confidence interval",
  "mon.scenarioApplied": "scenario applied — forecast scaled {d}%",
  "mon.legendForecast": "forecast (next 8 wks)",
  "mon.legendHistorical": "historical arrivals",
  "mon.legendAbsorption": "absorption capacity",
  "mon.legendEnvelope": "confidence envelope",
  "mon.tooltipForecast": "forecast · {n} t",
  "mon.tooltipArrivals": "arrivals · {n} t",
  "mon.tableTitle": "District risk table",
  "mon.tableMeta": "{crop} · baseline · {n} districts",
  "mon.colDistrict": "District",
  "mon.colGlutRisk": "Glut risk",
  "mon.colBand": "Band",
  "mon.colPlanting": "Planting",
  "mon.colGap": "Gap",
  "mon.colReports": "Reports",
  "mon.colCoverage": "Coverage",

  // --- signals page ---
  "sp.title": "Signal stream",
  "sp.meta": "prototype · simulated FPO/farmer reports · {region} · {crop}",
  "sp.bounded": "(bounded · max 500 per district)",
  "sp.quality": "Signal quality",
  "sp.confidence": "confidence",
  "sp.reports": "reports",
  "sp.estVsMedian": "est. planting vs median",
  "sp.effectTitle": "Effect on risk",
  "sp.live": "live",
  "sp.baseline": "baseline",
  "sp.currentScenario": "current scenario",
  "sp.effectNote":
    "Injected reports raise coverage, which narrows the uncertainty band and can shift confidence — the same effect a live stream has on the model.",

  // --- provenance ---
  "prov.title": "Data provenance",
  "prov.meta": "{crop} · season aggregates",
  "prov.indiaArea": "India area",
  "prov.indiaProduction": "India production",
  "prov.mhShare": "Maharashtra share",
  "prov.perishability": "Perishability",
  "prov.lakhHa": "lakh ha",
  "prov.lakhT": "lakh t",
  "prov.finalEstimates": "{y} final estimates",
  "prov.yield": "yield {n} t/ha",
  "prov.mhArea": "≈ {n} lakh ha · {y} t/ha",
  "prov.window": "marketable window ≈ {n} wk",
  "prov.foot":
    "Source: {source}. India-level figures are published statistics; district × crop splits are derived allocations consistent with those totals, and planting signals are simulated (see coverage strip).",
  "prov.perish.veryHigh": "very high — no storage buffer",
  "prov.perish.high": "high — days, not weeks",
  "prov.perish.moderate": "moderate — short storage window",
  "prov.perish.lower": "lower — storable across seasons",

  // --- data coverage strip ---
  "dq.coverage": "data coverage",
  "dq.updated": "updated",
  "dq.lineage": "number lineage",
  "dq.off": "OFFICIAL",
  "dq.derived": "DERIVED",
  "dq.simulated": "SIMULATED",
  "dq.status.delayed": "delayed",
  "dq.src.signals": "FPO reports · simulated stream ({d} districts × {c} crops)",
  "dq.src.survey": "Village/taluka survey panel ({n} mandi nodes)",
  "dq.src.mandi": "Mandi prices (AGMARKNET via data.gov.in — live)",
  "dq.src.weather": "Weather station grid",
  "dq.lin.area": "Crop area · production · yield",
  "dq.lin.areaDetail":
    "Official GoI/NHB aggregates (e.g. onion 19.68 L ha, 307.67 L t, 2024-25 Final Estimates) scaled to Maharashtra via published state shares",
  "dq.lin.district": "District × crop areas",
  "dq.lin.districtDetail":
    "Derived: state totals allocated across districts by documented specialization weights; not district-level government figures",
  "dq.lin.signals": "Planting signals & scenarios",
  "dq.lin.signalsDetail":
    "Simulated FPO/farmer stream — prototype only, explicitly not live farmer reports",
  "dq.lin.mandi": "Mandi prices",
  "dq.lin.mandiDetail":
    "Daily wholesale min/max/modal prices fetched live from AGMARKNET (data.gov.in) — cached in Convex, refreshed every 6 h",

  // --- mandi panel ---
  "mandi.title": "Mandi prices — live",
  "mandi.meta": "AGMARKNET via data.gov.in · wholesale ₹/quintal",
  "mandi.live": "LIVE",
  "mandi.stale": "STALE",
  "mandi.demo": "OFFLINE",
  "mandi.noData": "No AGMARKNET quotes available yet. The hourly ingest will populate this panel once the ingest action runs with a data.gov.in API key.",
  "mandi.demoNote":
    "Demo values below — shown because the live ingest has not populated the cache yet. AGMARKNET data is official; these are not.",
  "mandi.colMarket": "Market",
  "mandi.colDistrict": "District",
  "mandi.colModal": "Modal ₹/q",
  "mandi.colMin": "Min",
  "mandi.colMax": "Max",
  "mandi.colDate": "Date",
  "mandi.updated": "updated {when}",
  "mandi.trend7d": "7-day change {d}%",
  "mandi.missingKey":
    "Add a data.gov.in API key in the Keys tab (env: DATA_GOV_IN_API_KEY) and the console ingests live AGMARKNET prices automatically.",
  "mandi.via": "via data.gov.in",

  // --- bands, sources ---
  "band.low": "low",
  "band.medium": "medium",
  "band.high": "high",
  "band.critical": "critical",
  "conf.low": "low",
  "conf.medium": "medium",
  "conf.mediumHigh": "medium-high",
  "conf.high": "high",

  // --- auth page ---
  "auth.getStarted": "Get Started",
  "auth.enterEmail": "Enter your email to log in or sign up",
  "auth.or": "Or",
  "auth.guest": "Continue as Guest",
  "auth.checkEmail": "Check your email",
  "auth.codeSent": "We've sent a code to {email}",
  "auth.noCode": "Didn't receive a code?",
  "auth.tryAgain": "Try again",
  "auth.verifying": "Verifying...",
  "auth.verifyCode": "Verify code",
  "auth.differentEmail": "Use different email",
  "auth.securedBy": "Secured by",
} as const;

/** Translation keys — the single union every dictionary must draw from. */
export type TranslationKey = keyof typeof en;
/** Widened value type so locale dictionaries hold plain strings. */
export type Dict = Record<TranslationKey, string>;
