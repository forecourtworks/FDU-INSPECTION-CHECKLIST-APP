# FORECOURT WORKS LTD – Petroleum Pumping Equipment Inspection & Compliance Checklist App

A mobile-first, browser-based interactive checklist application for petroleum pumping equipment used at retail fuel stations and bulk transfer facilities.

This app is **complementary** to the Technical Service Work Order app. It focuses on structured inspection, observation recording, pass/fail against acceptance criteria (including legal metrology), and prioritised corrective-action tracking. Troubleshooting and repair scopes remain on the Work Order.

---

## Purpose

- Provide a standardised digital checklist for every call-out involving petroleum pumping equipment.
- Record inspection observations and test results against OEM, EPRA, KEBS and Weights & Measures acceptance criteria.
- Capture Conforming (C), Non-Conforming (NC) or Not Applicable (N/A) status for every item.
- Automatically build a prioritised Non-Conformance & Corrective Action log.
- Produce a professional, shareable PDF for client handover and company records.
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
5. Record metrology results where applicable.
6. Review auto-collected Non-Conformances, adjust urgency.
7. Capture photos and collect signatures.
8. Generate Professional PDF then Share / Download.

---

## File Structure

```
petroleum_pumping_app/
├── index.html      # UI and layout
├── app.js          # All application logic
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

---

## Branding

**Company:** FORECOURT WORKS LTD  
**Tagline:** Fueling Systems: Installation, Repair, Routine Maintenance, Calibration, and Regulatory Compliance Inspections.

---

© Forecourt Works Ltd – Controlled Document System  
Rev 1.0 – August 2026
