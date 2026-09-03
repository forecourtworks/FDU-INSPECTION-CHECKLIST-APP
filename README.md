# FORECOURT SUPPLIES & WORKS LTD (FSW)
## Calibration & Job Safety Report Generator – 3-App Package

**Operating Brand:** Forecourt Works / FSW  
**Location:** Mombasa, Kenya (expanding across Kenya)  
**Document Control:** FSW-CAL-SAFETY-2026

---

### Package Contents

| File | Purpose |
|------|---------|
| `README.md` | This documentation |
| `index.html` | User interface (forms + live preview) |
| `app.js` | Core logic – tables, calculations, PDF generation, logo/footer rules |
| `fsw_logo.png` | Official FSW logo (required) |

---

### Requirements Implemented

1. **Logo**
   - Official logo loaded from `fsw_logo.png`
   - Resized proportionally (max ≈ 55 mm wide / 11 mm high)
   - Boundary interaction rules enforced: logo sits fully above the brand line; content never crosses the inner top boundary.

2. **Job Safety & Hazard Analysis – 4-column table**
   - Columns: **Job Hazard Identified** | **Mitigating Task** | **Status** | **Remarks**
   - Status colouring: **YES** = green, **NO** = red, **N/A** = black
   - Table grid lines rendered at **15 % opacity**
   - Every cell value appears on the generated PDF

3. **Meter Accuracy section**
   - Header fields: **Reading No#**, **Nozzle ID** (component removed), **Prover Tank Size**, **Approximate Flow Rate**
   - 6-column readings table:
     1. Dispenser Indicated Reading in L
     2. Prover Tank Actual Reading in L
     3. Error in ml
     4. % Error
     5. ml Loss per litre
     6. Status (**PASS** green / **FAIL** red)
   - Grid at 15 % opacity; all values forced onto the PDF

4. **Calibration Result Analysis**
   - Bold professional statement using the agreed **losing / gaining** language:
     - Over-registering → volume loss to the customer / gain to the station
     - Under-registering → volume loss to the station / gain to the customer

5. **Repeatability Summary – 4-column table**
   - Error Range Bottom Limit | Error Range Top Limit | Error Range Spread | Overall Interpretation

6. **Footers**
   - Left and right footer text positioned **above** the inner boundary line
   - Middle text remains centred (“CONFIDENTIAL – Client Use Only”)
   - Brand line below the boundary

---

### How to Use

1. Place all four files in the same folder.
2. Open `index.html` in a modern browser (Chrome / Edge / Firefox recommended).
3. Fill Job details, add/edit Hazard rows, enter Meter parameters and readings.
4. Click **Generate Combined Work Pack PDF** (or individual Safety / Meter PDFs).
5. PDF downloads automatically with correct branding, tables, colours and analysis.

No server or internet required after first load (CDN libraries cached by browser).

---

### Technical Notes

- PDF engine: jsPDF + jspdf-autotable (CDN)
- Calculations: Error (ml) = (Dispenser – Prover) × 1000  
  % Error = (Dispenser – Prover) / Prover × 100  
  ml Loss per litre = Error (ml) / Prover (L)
- Default PASS/FAIL threshold: ±0.5 %
- All table data, status colours and analysis language are generated dynamically from form input.

---

### Verification

- Logo placement and boundary lines tested
- 4-column Safety table + status colours verified
- 6-column Meter table + PASS/FAIL colours verified
- Calibration analysis language (losing/gaining) verified
- Repeatability 4-column summary verified
- Footer left/right above boundary line verified

**FSW – Technical Supply • Installation • Preventive Maintenance • Calibration**
