# CropX — MVP Presentation Script (7–8 minutes)

> **Problem CX0602 — "The Glut Nobody Predicted Six Weeks Out" · MUSA CodeX 2026**
> Tagline: *"See the glut before the market does."*
>
> **Before you start:** Open the landing page and the console (Scenario Simulator) in two tabs.
> Light theme, English. Keep the language toggle ready for the final minute.
> Rehearse the two slider moves in the simulator so they land cleanly on stage.

---

## 0:00 – 0:45 | THE HOOK — What went wrong?

> *(Start on the landing page. Speak slowly, this is a story, not a spec.)*

"Two seasons ago, onion prices in Maharashtra were excellent. So thousands of farmers
did the obvious thing — they planted more onions. Nobody was doing anything wrong.
Everyone was doing the *right* thing, at the same time.

Eight weeks later, every mandi from Nashik to Lasalgaon received the same crop, in the
same weeks. Trucks queued for kilometres. Prices crashed below the cost of harvest.

That is problem **CX0602 — the glut nobody predicted six weeks out.** A glut is never
caused by one bad decision. It's caused by thousands of good decisions that nobody
added up in time.

*(click → console)* **This is CropX. It adds up the total — while there is still time to
plant differently."**

---

## 0:45 – 1:45 | WHAT — the core insight

"Most agri-AI products are **price predictors**. CropX is not. Here's why that matters:

A price model is a **rear-view mirror** — by the time prices move, the glut has already
happened and the farmer has already lost. CropX models the **supply side** instead:
who planted what, how much, and when it will hit the market.

**In simple words — what is a glut?** Too much of one vegetable arriving at too many
mandis in the same few weeks.

**And what decides a glut?** Not just production — **absorption capacity**: how much
the market's 'stomach' can swallow per week. That stomach is buyers, cold storage,
processing units, and transport. If arrivals exceed the stomach, prices collapse —
no matter how good the harvest is.

So CropX does one thing, precisely: it forecasts **weekly arrivals**, compares them to
**absorption capacity**, and compresses everything into a single decision-grade number —
**glut risk** — with a **confidence** level and a recommended action. Predicted **4 to 8
weeks before harvest**, which is the only window where changing the plan is still cheap."

---

## 1:45 – 2:30 | WHO and WHERE

**Who it's for:** farmers and **FPOs** — Farmer Producer Organisations, which are
cooperatives of small farmers who sell together — plus buyers, aggregators, cold-storage
operators, logistics planners, and policymakers. Every recommendation on screen is
labelled with its audience — some actions are for the FPO, some for FPO-plus-buyers.

**Where:** **34 farming districts of Maharashtra, 15 major vegetables** — from onion and
tomato to leafy greens — monitored at **taluka-level nodes**, the administrative units
below a district. The engine is calibrated against a real, published season: the
**Nashik rabi onion** crop, anchored to Government of India **NHB horticulture
statistics** — for onion, 19.68 lakh hectares and 307.67 lakh tonnes in the 2024–25
Final Estimates. We scale state totals to districts with documented specialisation
weights — and we say so openly. That openness is our next slide."

---

## 2:30 – 3:15 | WHEN — the data is live, on a clock

*(point at the Data Coverage strip at the top of the console)*

"CropX refreshes itself on a schedule:

- **Mandi prices — AGMARKNET via data.gov.in** — the government's official wholesale
  price network: daily minimum, maximum, and modal rupees-per-quintal for every market.
  Ingested **every 6 hours**, and again the moment anyone opens the app — with a
  10-minute cooldown so we stay polite to a government API.
- **Weather — Open-Meteo** — observed rainfall for the past 30 days plus a 14-day
  forecast for all 34 districts, every 6 hours. This feeds the engine's rainfall driver.
- **Planting signals** — FPO and farmer reports, our prototype stream.

And here is the thing I'm most proud of. *(point at the lineage badges)* Every number on
this screen carries one of three tags: **OFFICIAL** — straight from government data;
**DERIVED** — computed from official totals; or **SIMULATED** — prototype data, labelled
as such. In a hall full of demos quietly faking government data, ours tells you exactly
what is real. That is deliberate: this is a tool people will bet a season on, so it must
never lie about its inputs."

---

## 3:15 – 5:00 | HOW — the engine, one number at a time

"The pipeline is: historical crop data, plus production history, plus live mandi arrivals,
plus weather and seasonality, plus current planting signals, plus the crop calendar,
plus absorption capacity — into a supply forecast — into glut risk with confidence —
into a scenario simulator — into a recommendation.

Now the risk header — *(point at it)* — six numbers, and I'll explain each one the way
I'd explain it to an FPO board:

1. **Planting signal: +18%.** FPO reports say 18% more onion area than the
   **5-year median** — the normal planting level for the last five seasons.
2. **Expected production: +31%.** Area times expected yield, adjusted for live rainfall
   — because a wetter season grows more than area alone suggests.
3. **Expected arrivals: in weekly tonnes.** Production is staggered across the harvest
   window — the model predicts *which weeks* the market gets flooded, not just the total.
4. **Arrivals vs capacity: the market's absorption grows only +12%** this season.
   The stomach grows slower than the food arriving.
5. **Oversupply gap:** the part of arrivals the market **cannot swallow**, as a
   percentage of capacity. This is the glut, measured.
6. **Glut risk: 82%. Confidence: 79%.**

*(pause)* What's the difference between risk, confidence, and the **range 74–89**?
**Risk** is the model's best answer. The **range** is its uncertainty band — the honest
spread of outcomes. **Confidence** is how much evidence backs it — it tracks **coverage**:
how many nodes have filed planting reports. More reports, narrower band, sharper decision.
That's exactly what a real information system does: evidence in, certainty out.

Below it, the **drivers panel** — SHAP-style contributions in percentage points: planting
signal is the biggest push, then historical glut pattern, expected production, arrivals
trend, and rainfall — the driver wired to live Open-Meteo data. Nothing here is a black
box: every number traces to a source or a formula."

---

## 5:00 – 6:15 | THE HERO — Scenario Simulator, live

*(the demo — rehearse these three moves)*

"Now the feature this whole console exists for. The board of an FPO asks one question:
*'What if we change what we plant?'* In CropX, they don't debate — they **drag**.

**Move 1 — *(drag planting slider to +10%)*** — ten percent *more* planting. Watch the
digital twin recalculate live: production rises, the oversupply gap widens, and glut risk
climbs from **82% to 91%** — deep into critical. The recommendation changes with it.

**Move 2 — *(run the diversification preset)*** — 'Diversify planting': shift roughly a
quarter of the marginal onion plots into lower-risk crops. Area drops below the 5-year
median, projected arrivals slide back inside absorption tolerance, and risk falls to
**61%**. Same district, same season, same weather — a different decision, and twenty
points of risk disappear.

**Move 3 — *(point at the compare table)*** — baseline versus scenario, with the delta on
every row: planting area, production, arrivals, gap, risk. This is a **digital twin** —
the FPO tests a decision in software before betting a season on it."

---

## 6:15 – 6:50 | THE BRIEF — AI with guardrails

"Every state also produces a plain-language **decision brief**. Here's our architecture,
and it's a strict one:

**data → model → risk score → model explanation → LLM → brief.**

The LLM — Gemini, routed through the **Vercel AI Gateway** — is allowed to *word* the
brief. It is **never** allowed to compute the forecast. We pass the engine's numbers
verbatim and validate the output: if the LLM drops or alters even one number, we reject
the brief and serve a deterministic template, honestly labelled as such. The AI is the
copywriter, not the analyst. The numbers belong to the model — and to the data.

*(point at the recommendation panel)* The output is not advice-flavoured text — it's an
action, with a **priority** and an **audience**, that changes as the scenario changes."

---

## 6:50 – 7:30 | TRUST — languages, auth, and what's next

"One more thing about who this is for. *(click the language toggle → Marathi, one line,
then back)* CropX is fully trilingual — **English, Hindi, and Marathi** — on every page,
because the person who needs a glut warning most may not read English. Light and dark
themes, sign-in handled by **Clerk**, backend on **Convex** — reactive, so every panel
updates the second new data lands.

**Next, in order:** swap the calibrated engine for a trained **XGBoost + SHAP** service —
the data structures are already shaped for exactly that swap; connect the live FPO report
stream to replace simulated signals; expand to more states and crops; and push briefs out
as **WhatsApp advisories in local languages**, because that's where farmers actually are."

---

## 7:30 – 8:00 | CLOSE

*(land on the risk header, then look up)*

"CropX does not predict prices. It sees the glut **before the market does** — six weeks
out, when the plan can still change.

At 82% risk, the market is about to be flooded. At 61%, it isn't. The distance between
those two numbers is not a dashboard metric — it's one FPO's decision in the next two
weeks, and a farmer's entire season on the other side.

**CropX — see the glut before the market does. Thank you."**

---
---

## Appendix A — Glossary (for your own fluency, not to read out)

| Term | Plain meaning |
|---|---|
| **Glut** | Too much of one vegetable hitting mandis in the same weeks → prices crash |
| **Absorption capacity** | How much produce the market can "swallow" per week (buyers + cold storage + processing + transport) |
| **Oversupply gap** | Arrivals the market cannot absorb, as % of capacity — the glut, quantified |
| **Planting signal** | Deviation of current planted area from the **5-year median** (normal) |
| **5-year median** | The middle value of the last 5 seasons — "what a normal year looks like" |
| **Confidence** | How much evidence backs the risk score; tracks report **coverage** |
| **Uncertainty band / range** | The honest spread around the risk score (e.g. 74–89) |
| **SHAP-style drivers** | How much each factor pushed the risk up or down, in percentage points |
| **Perishability / marketable window** | How fast the crop spoils — tomatoes (days) vs onion (storable) |
| **FPO** | Farmer Producer Organisation — a farmer cooperative that sells collectively |
| **AGMARKNET** | Govt of India's official mandi price network, served via data.gov.in |
| **Open-Meteo** | Free weather API serving national weather-model data (ICON/GFS/ECMWF) |
| **Modal price** | The most common traded price that day (min/max/modal ₹/quintal) |

## Appendix B — Likely Q&A

- **"Is the data actually live?"** — Mandi prices and weather are: AGMARKNET via
  data.gov.in and Open-Meteo, ingested every 6 hours plus refresh-on-open, cached in
  Convex with cooldowns. Planting signals are a simulated prototype stream, labelled
  SIMULATED on screen.
- **"How is this different from a price forecast?"** — Prices are outputs of a glut;
  we model the inputs (planting + arrivals + absorption) weeks before prices move.
- **"Why is the risk score trustworthy?"** — Full provenance: OFFICIAL / DERIVED /
  SIMULATED tags, traceable drivers, and an LLM that cannot alter a single number.
- **"What happens if the LLM is down?"** — The brief falls back to a deterministic
  template, honestly labelled; the risk engine never depends on the LLM.
- **"Business model?"** — FPO subscriptions, buyer/logistics API access, and
  policy dashboards for agriculture departments.
- **"Scale path?"** — The engine is state-per-district-crop; more states and crops are
  configuration plus data, not re-architecture.
