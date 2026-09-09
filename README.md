# FORECOURT WORKS LIMITED – Petroleum Pumping Equipment Inspection & Compliance Checklist App

A mobile-first, browser-based interactive checklist for petroleum pumping equipment at retail fuel stations and bulk transfer facilities.

**Tagline:** *Engineering Reliability Into Every Forecourt*

**Contact:** Ramco Court, GT 3B, South C, Nairobi · Phone: +(254) 729-002-087 · Email: sales@forecourtworks.co.ke · www.forecourtworks.co.ke

**Controlled document:** `INSP/FDU&Pumps/ControlledDoc/Vol-01`  
**Inspection instance numbers:** e.g. `INSP/2026/001` (auto-filled, editable)

This app complements the Technical Service Work Order. It records inspection observations, C/NC results, meter accuracy, and prioritised corrective actions. Troubleshooting and repair remain on the Work Order.

---

## Fonts & UI

- Primary font stack: **"Segoe UI", Arial, Roboto, sans-serif**
- Date display format: **DD-MON-YYYY** (e.g. 08-SEP-2026)
- Form data **persists** when using Back / Next (checklist sections are not wiped on revisit)

---

## Supported equipment

- Suction FDU (inbuilt pump)
- Remote FDU (external STP)
- Submersible Turbine Pump (STP)
- Bulk transfer pumps (gear / vane / centrifugal / diaphragm / hand)

Product–hose configs: 1P-1H · 1P:2H · 2P:2H · 2P:4H · 3P:6H · N/A

---

## Service types

| # | Service type |
|---|--------------|
| 1 | Pre Installation Inspections |
| 2 | Post Installation Inspection |
| 3 | Baseline Condition Inspection |
| 4 | Routine Preventive Maintenance Inspection |
| 5 | Regulatory Compliance Auditing (includes user training) |

---

## Job basics highlights

- County dropdown (47 counties) with live filter + 3-digit code
- Unique Asset ID auto pattern: `CLI/CODE/SIT/DISP#001` (editable)
- Validity Period: Still Valid | Expired — Valid Until enabled only when Still Valid
- Vendor Name / Location / Contacts
- Mandatory: client, county, site, unique asset ID, serial no., inspection no./date, equipment type, lead tech, service type

---

## Meter accuracy (canonical rules)

**Over-registration:** indicated volume higher than true proven volume.  
**Under-registration (deficiency):** indicated volume lower than true proven volume.

| Field | Behaviour |
|-------|-----------|
| Meter type | Verification (new) or Re-verification (in-service) |
| Prover can (L) | 5 / 10 / 20 (one choice) |
| Indicated reading (L) | Auto-filled to prover size |
| True proven volume (L) | Manual + optional photo → Photographic Evidence |
| Variance (L) | Auto: Indicated − True Proven |
| Relative error vs true (%) | Auto: (Ind − True) / True × 100 |
| Relative indication error vs meter (%) | Auto: (Ind − True) / Ind × 100 **(limit basis)** |

**Verification (new):** PASS only if relative indication error is **0% to +0.25%**; negative variance not allowed.  
**Re-verification:** PASS if relative indication error is **−0.25% to +0.50%**.

FAIL readings are written into the **Non-Conformance log** automatically.  
Verdict box states PASS/FAIL (green/red) and references the selected **county** Weights & Measures office.

Formulas are shown on both the web form and the PDF.

---

## Sign-off

- Signature **pad** and/or **file attachment** (image embeds in the same place)
- **Rubber stamp** placeholder boxes (58 × 22 mm, “RUBBERSTAMP HERE”) for technician and client — web and PDF
- Extra vertical space between technician and client blocks

---

## PDF output

- Dual-border A4 portrait, controlled doc number, inspection instance number
- Full text statuses: Conforming (C) / Non Conforming (NC) when selected
- ASCII-safe criteria (avoids corrupted ≤ / → glyphs in Helvetica)
- Technician closing notes section populated from the web notes field
- Meter tables, verdict language, NC log including meter FAILs
- Photos on separate pages
- Page X of Y footer, confidential mark, tagline

---

## How to run

Open `index.html` in a modern browser (Chrome/Edge recommended). No build step required. Signature Pad and jsPDF load from CDN.

---

## Files

| File | Role |
|------|------|
| `index.html` | Structure, styles, print CSS |
| `app.js` | Logic, meter calc, PDF generation |
| `fsw_logo.png` | Brand asset |
| `README.md` | This document |

---

**FORECOURT WORKS LIMITED** — Engineering Reliability Into Every Forecourt
