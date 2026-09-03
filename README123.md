# FORECOURT WORKS LIMITED – Petroleum Pumping Equipment Inspection & Compliance Checklist App

A mobile-first, browser-based interactive checklist application for petroleum pumping equipment used at retail fuel stations and bulk transfer facilities.

**Tagline:** *Engineering Reliability into Every Forecourt*

This app is **complementary** to the Technical Service Work Order app. It focuses on structured inspection, observation recording, pass/fail against acceptance criteria (including legal metrology), and prioritised corrective-action tracking. Troubleshooting and repair scopes remain on the Work Order.

---

## Purpose

- Provide a standardised digital checklist for every call-out involving petroleum pumping equipment.
- Record inspection observations and test results against OEM, EPRA, KEBS and Weights & Measures acceptance criteria.
- Capture Conforming (C), Non-Conforming (NC) or Not Applicable (N/A) status for every item. PDF renders full text “Conforming (C)” in green and “Non Conforming (NC)” in red.
- Automatically build a prioritised Non-Conformance & Corrective Action log.
- Produce a **professional, dual-border PDF** with 4-column inspection tables (Inspection Item | Acceptance Criteria | Status | Remarks), light table grid lines (~15% opacity feel), FW logo mark at top-right interacting with borders, and full Meter Accuracy tables.
- Support Nozzle ID recording for multi-hose / multi-product dispensers, both at job level and per calibration reading.
- Keep the document lean and non-repetitive with the Work Order.

---

## Supported Equipment

### 1. Retail Fuel Dispensing Units (FDU)
- **Suction Fuel Dispenser** – inbuilt pumping unit assembly
- **Remote Fuel Dispenser** – uses external Submersible Turbine Pump (STP)

**Product-to-Hose Configurations:**  
1P-1H · 1P:2H · 2P:2H · 2P:4H · 3P:6H

### 2. Bulk Fuel Transfer Pumps
- Submersible Turbine Pump (STP)
- Positive Displacement Gear Pump
- Vane Pump
- Centrifugal Pump
- Pneumatic Diaphragm Pump
- Hand-Operated Rotary & Lever Pump

N/A is available on every checklist item so technicians can skip parameters that do not apply to the selected equipment type.

---

## Supported Service Types

| Code | Service Type                          | Notes                                      |
|------|---------------------------------------|--------------------------------------------|
| A    | Pre-Installation / Site Readiness     | Power, space, foundations, containment     |
| B    | Installation / Commissioning          | OEM installation + initial metrology       |
| C    | Scheduled Preventive Maintenance (PM) | Full mechanical / electrical / hydraulic / metrology checks |
| D    | Condition / Status Inspection         | Same checklist as PM, used for condition reports |
| F    | Operator / User Training              | Safe use, daily checks, emergency procedures |
| G    | Regulatory / Metrology Compliance     | Weights & Measures, EPRA, KEBS seals, certificates |

**Explicitly excluded:** Troubleshooting & Repair (handled exclusively on the Work Order).

---

## Key Acceptance Criteria (Kenya Legal Metrology)

**Retail Fuel Dispensers (Weights and Measures Rules – Dispensing Pumps):**

| Stage | Maximum Permissible Error |
|-------|---------------------------|
| **Verification / New or repaired** | **0.25 % in excess only** (under-dispensing not permitted) |
| **In-service inspection / Re-verification** | **0.5 % in excess** or **0.25 % in deficiency** |

Additional critical criteria:
- Hose dilation error ≤ 50 ml under normal conditions
- All adjustable parts affecting quantity must be sealed
- Emergency stop functional and accessible
- Shear / impact valves operate freely and close completely

---

## Meter Accuracy / Calibration (Live Calculation)

Two clearly differentiated modules:

| Module | Legal Limit (Kenya Weights & Measures) |
|--------|----------------------------------------|
| **1. New & Never Used Before FDU** | **0.25 % excess only** (under-dispense prohibited) |
| **2. In-Service FDU** | **+0.5 % excess or −0.25 % deficiency** |

For each reading the technician:
- Enters **Nozzle ID** (mandatory for multi-hose dispensers)
- Selects Prover Tank Size / Capacity (5 L / 10 L / 20 L)
- Enters **Dispenser Indicated Volume** (what the display showed) – keyboard entry, 2 decimal places
- Enters **Prover Tank Actual Reading** (true volume measured in the can) – keyboard entry, 2 decimal places
- Optionally records approximate flow rate (L/min)

**Formula (verified):**  
Error (L) = Prover Actual − Dispenser Indicated  
Error (ml) = Error (L) × 1000  
Error (%) = (Error L / Indicated L) × 100  
Positive error = more fuel delivered than indicated → Under-registering → volume loss to station / gain to customer.  
Negative error = less fuel delivered than indicated → Over-registering → volume loss to customer / gain to station.

All calculated figures forced to exactly 2 decimal places. Inputs use text + inputmode=decimal (no spinner arrows).

The app automatically calculates and displays:
- Over / Under in **ml** (2 dp)
- Over / Under as a **%** (2 dp)
- Over / Under **per litre sold** (2 dp)
- PASS / FAIL against the applicable legal limit
- Plain-language statement using agreed terminology:
  - **Over-registering** → volume loss to customer / gain to station
  - **Under-registering** → volume loss to station / gain to customer

**Repeatability:** “+ Add Reading” allows multiple deliveries. A summary shows error range (bottom limit, top limit, spread) and overall interpretation (detects drift). Every reading (with Nozzle ID) is fully rendered in the PDF.

### PDF Meter Accuracy Layout
- Header details per reading: Reading No#, Nozzle ID, Prover Tank Size, Approximate Flow Rate
- **6-column readings table:**
  - Dispenser Indicated Reading in L
  - Prover tank Actual Reading in L
  - Error in ml
  - % Error
  - ml Loss per litre
  - Status (PASS green / FAIL red)
- Grid lines at ~15 % opacity; all values visible
- **Calibration Result Analysis** – bold professional statement using the losing / gaining language above
- **Repeatability Summary** (4-column table when ≥2 readings):
  - Error range bottom limit | Error range top limit | Error range spread | Overall interpretation

---

## PDF Output Design

The generated PDF follows the FSW professional workbook standard:

- Dual border (outer + inner) on every page
- **FW logo mark** at top-right of every page, positioned to interact with the outer/inner border lines
- Company name **FORECOURT WORKS LIMITED** + italic tagline
- Title: **EQUIPMENT/SYSTEMS INSPECTION CHECKLIST**
- Inspection Checklist No. + Associated Work Order No. header box
- Navy section header bars
- **4-column tables** for every inspection area: Inspection Item | Acceptance Criteria | Status | Remarks  
  – Table grid lines drawn at light opacity (~15% visual weight)  
  – Status rendered in full: **Conforming (C)** in green, **Non Conforming (NC)** in red  
  – Every field (item, criteria, status, remarks) is mandatory and appears in the PDF
- Full Meter Accuracy 6-column tables + analysis + repeatability summary as described above
- **Footers:**
  - Left and right footer text positioned above the inner boundary line
  - Middle text “CONFIDENTIAL – Client Use Only” centred above the inner boundary
  - Brand line below the outer boundary
- Clean typography and controlled vertical spacing

---

## Features

- **Equipment Type & Configuration selectors** – only relevant sections appear.
- **Mandatory progression rules** – Basics → JHA → (conditional sections) → NC Log → Photos → Sign-off → Review/PDF.
- **C / NC / N/A dropdowns** on every checklist item with free-text remarks / measured values.
- **Metrology test recording** – volume indicated vs reference measure, calculated error %, pass/fail against legal limits.
- **Auto-populated Non-Conformance Log** – every NC or “Missing” item is collected and prioritised.
- **Camera + File attachment** – native camera and gallery/file picker; photos embedded in PDF.
- **Digital signatures** – Technician + Client with inspection/briefing statements.
- **Professional PDF export** + Share / Download.
- **Draft save** – JSON download to device.

---

## How to Use

1. Open `index.html` in a modern mobile or desktop browser (Chrome, Safari or Edge recommended).
2. For production field use, host the folder on any static web server (HTTPS required for camera and Web Share).
3. Complete Step 1 (Job Basics, Equipment Type, Configuration, Service Type(s)).
4. Walk through only the active sections that appear.
5. Record metrology results where applicable (Nozzle ID, Prover Tank Size, Indicated & Actual volumes).
6. Review auto-collected Non-Conformances, adjust urgency.
7. Capture photos and collect signatures.
8. Generate Professional PDF then Share / Download.

---

## File Structure

```
petroleum_pumping_app/
├── index.html      # UI and layout
├── app.js          # All application logic (including professional PDF generator)
└── README.md       # This file
```

---

## Technical Notes

- Pure HTML + CSS + vanilla JavaScript (no build step).
- Libraries loaded via CDN: Signature Pad, jsPDF.
- Works offline for form filling after first load.
- Best experienced on a phone or tablet in the field.

---

## Relationship to the Work Order App

| Aspect                    | Work Order App                          | This Checklist App                          |
|---------------------------|-----------------------------------------|---------------------------------------------|
| Primary focus             | Diagnosis, repair, parts, QC, job narrative | Inspection observations, C/NC, metrology, prioritised actions |
| Troubleshooting & Repair  | Yes                                     | No (deliberately excluded)                  |
| Sign-off language         | Full work acceptance                    | Inspection completed + client briefing confirmation |
| PDF design                | Work Order format                       | Dual-border Equipment/Systems Inspection Checklist standard |

---

## Branding

**Company:** FORECOURT WORKS LIMITED  
**Tagline:** Engineering Reliability into Every Forecourt  
**Contact:** Ramco Court, Gate 3B, South C · +(254) 729-002-087 · dispatcher@forecourtworks.co.ke

---

© Forecourt Works Limited – Controlled Document System
