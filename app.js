/**
 * FORECOURT SUPPLIES & WORKS LTD (FSW)
 * Calibration & Job Safety Report Generator – app.js
 * Implements: logo boundary rules, 4-col Safety table, 6-col Meter table,
 * calibration losing/gaining language, repeatability summary, footers above boundary.
 */

const { jsPDF } = window.jspdf;

// ---------------------------------------------------------------------------
// Brand & layout constants (mm)
// ---------------------------------------------------------------------------
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 14;
const MARGIN_R = 14;
const INNER_TOP = 32;          // content starts below logo zone
const INNER_BOTTOM = 22;       // content ends above footer zone
const LOGO_MAX_W = 55;
const LOGO_MAX_H = 11;
const NAVY = [30, 56, 95];
const GRID_ALPHA = 0.15;       // 15 % opacity table lines
const PASS_GREEN = [13, 140, 64];
const FAIL_RED = [191, 26, 26];
const DOC_CONTROL = "FSW-CAL-SAFETY-2026";

// ---------------------------------------------------------------------------
// Default sample data (matches verified package)
// ---------------------------------------------------------------------------
const DEFAULT_HAZARDS = [
  { hazard: "Live electrical panels / 415 V supply near dispenser", mitigation: "LOTO + verify zero energy; insulated tools only", status: "YES", remarks: "Panel locked & tagged" },
  { hazard: "Fuel vapour / explosive atmosphere (Zone 1)", mitigation: "No spark tools; continuous gas monitoring; hot-work permit N/A", status: "YES", remarks: "LEL < 5 % confirmed" },
  { hazard: "Slip / trip on wet forecourt surface", mitigation: "Spill kits staged; anti-slip mats; demarcation cones", status: "YES", remarks: "Area cordoned" },
  { hazard: "Prover tank handling – manual lift > 25 kg", mitigation: "Two-person lift; mechanical aid if available", status: "YES", remarks: "Team brief completed" },
  { hazard: "Traffic interaction with public vehicles", mitigation: "Lane closure + reflective barriers + banksman", status: "YES", remarks: "Island isolated" },
  { hazard: "High-pressure product line residual pressure", mitigation: "Depressurise via nozzle; confirm pressure gauge zero", status: "YES", remarks: "Pressure released" },
  { hazard: "Working at height on canopy for price board check", mitigation: "N/A – not required this visit", status: "N/A", remarks: "Scope limited to dispenser" },
  { hazard: "Chemical exposure from diesel polishing residue", mitigation: "PPE (gloves, goggles, overalls); eye-wash station ready", status: "YES", remarks: "PPE issued" }
];

const DEFAULT_READINGS = [
  { dispenser: 20.045, prover: 20.000 },
  { dispenser: 20.038, prover: 20.000 },
  { dispenser: 20.052, prover: 20.000 },
  { dispenser: 20.041, prover: 20.000 },
  { dispenser: 20.047, prover: 20.000 }
];

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------
function addHazardRow(data = { hazard: "", mitigation: "", status: "YES", remarks: "" }) {
  const tbody = document.getElementById("hazardBody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" value="${esc(data.hazard)}" data-field="hazard" /></td>
    <td><input type="text" value="${esc(data.mitigation)}" data-field="mitigation" /></td>
    <td>
      <select data-field="status">
        <option value="YES" ${data.status === "YES" ? "selected" : ""}>YES</option>
        <option value="NO" ${data.status === "NO" ? "selected" : ""}>NO</option>
        <option value="N/A" ${data.status === "N/A" ? "selected" : ""}>N/A</option>
      </select>
    </td>
    <td><input type="text" value="${esc(data.remarks)}" data-field="remarks" /></td>
    <td><button type="button" class="btn-danger" style="padding:3px 7px;font-size:0.7rem" onclick="this.closest('tr').remove()">✕</button></td>
  `;
  tbody.appendChild(tr);
}

function addReadingRow(data = { dispenser: "", prover: "" }) {
  const tbody = document.getElementById("readingBody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="number" step="0.001" value="${data.dispenser}" data-field="dispenser" oninput="recalcRow(this)" /></td>
    <td><input type="number" step="0.001" value="${data.prover}" data-field="prover" oninput="recalcRow(this)" /></td>
    <td class="err-ml">—</td>
    <td class="err-pct">—</td>
    <td class="ml-per-l">—</td>
    <td class="status-cell">—</td>
    <td><button type="button" class="btn-danger" style="padding:3px 7px;font-size:0.7rem" onclick="this.closest('tr').remove()">✕</button></td>
  `;
  tbody.appendChild(tr);
  recalcRow(tr.querySelector("input"));
}

function recalcRow(el) {
  const tr = el.closest("tr");
  const disp = parseFloat(tr.querySelector('[data-field="dispenser"]').value) || 0;
  const prov = parseFloat(tr.querySelector('[data-field="prover"]').value) || 0;
  const errMl = (disp - prov) * 1000;
  const pct = prov ? ((disp - prov) / prov) * 100 : 0;
  const mlPerL = prov ? errMl / prov : 0;
  const pass = Math.abs(pct) <= 0.5;
  tr.querySelector(".err-ml").textContent = errMl.toFixed(1);
  tr.querySelector(".err-pct").textContent = pct.toFixed(3);
  tr.querySelector(".ml-per-l").textContent = mlPerL.toFixed(2);
  const st = tr.querySelector(".status-cell");
  st.textContent = pass ? "PASS" : "FAIL";
  st.className = "status-cell " + (pass ? "status-pass" : "status-fail");
}

function esc(s) {
  return String(s || "").replace(/"/g, "&quot;");
}

function collectJob() {
  return {
    client: document.getElementById("client").value.trim(),
    site: document.getElementById("site").value.trim(),
    wo: document.getElementById("wo").value.trim(),
    date: document.getElementById("date").value.trim(),
    equipment: document.getElementById("equipment").value.trim(),
    tech: document.getElementById("tech").value.trim()
  };
}

function collectHazards() {
  const rows = [];
  document.querySelectorAll("#hazardBody tr").forEach(tr => {
    rows.push({
      hazard: tr.querySelector('[data-field="hazard"]').value.trim(),
      mitigation: tr.querySelector('[data-field="mitigation"]').value.trim(),
      status: tr.querySelector('[data-field="status"]').value,
      remarks: tr.querySelector('[data-field="remarks"]').value.trim()
    });
  });
  return rows;
}

function collectMeterMeta() {
  return {
    readingNo: document.getElementById("readingNo").value.trim(),
    nozzleId: document.getElementById("nozzleId").value.trim(),
    proverSize: document.getElementById("proverSize").value.trim(),
    flowRate: document.getElementById("flowRate").value.trim()
  };
}

function collectReadings() {
  const rows = [];
  document.querySelectorAll("#readingBody tr").forEach(tr => {
    const disp = parseFloat(tr.querySelector('[data-field="dispenser"]').value) || 0;
    const prov = parseFloat(tr.querySelector('[data-field="prover"]').value) || 0;
    const errMl = (disp - prov) * 1000;
    const pct = prov ? ((disp - prov) / prov) * 100 : 0;
    const mlPerL = prov ? errMl / prov : 0;
    const status = Math.abs(pct) <= 0.5 ? "PASS" : "FAIL";
    rows.push({ dispenser: disp, prover: prov, errMl, pct, mlPerL, status });
  });
  return rows;
}

// ---------------------------------------------------------------------------
// Calibration language (losing / gaining)
// ---------------------------------------------------------------------------
function calibrationAnalysis(readings) {
  if (!readings.length) return "No readings recorded.";
  const avgMlPerL = readings.reduce((s, r) => s + r.mlPerL, 0) / readings.length;
  const avgPct = readings.reduce((s, r) => s + r.pct, 0) / readings.length;
  if (Math.abs(avgPct) < 0.05) {
    return "The dispenser is operating within acceptable tolerance. No material volume loss or gain is observed for either party.";
  }
  if (avgMlPerL > 0) {
    return `The dispenser is OVER-REGISTERING by approximately ${Math.abs(avgMlPerL).toFixed(1)} ml per litre (${Math.abs(avgPct).toFixed(3)} %). This results in a volume loss to the customer and a corresponding gain to the station. Immediate corrective calibration is required to restore metrological accuracy and regulatory compliance.`;
  }
  return `The dispenser is UNDER-REGISTERING by approximately ${Math.abs(avgMlPerL).toFixed(1)} ml per litre (${Math.abs(avgPct).toFixed(3)} %). This results in a volume loss to the station and a corresponding gain to the customer. Immediate corrective calibration is required to restore metrological accuracy and protect commercial interests.`;
}

function repeatabilitySummary(readings) {
  if (!readings.length) return { bot: 0, top: 0, spread: 0, interp: "No data" };
  const errs = readings.map(r => r.errMl);
  const bot = Math.min(...errs);
  const top = Math.max(...errs);
  const spread = top - bot;
  let interp = "Poor repeatability – investigate meter / valve / air";
  if (spread < 15) interp = "Excellent repeatability – meter stable";
  else if (spread < 40) interp = "Acceptable repeatability – monitor trend";
  return { bot, top, spread, interp };
}

// ---------------------------------------------------------------------------
// PDF helpers
// ---------------------------------------------------------------------------
function loadLogoAsDataUrl() {
  return new Promise((resolve) => {
    const img = document.getElementById("logoImg");
    if (!img || !img.complete) {
      // fallback: try fetch
      fetch("fsw_logo.png")
        .then(r => r.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        })
        .catch(() => resolve(null));
      return;
    }
    // already loaded in DOM
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    } catch (e) {
      resolve(null);
    }
  });
}

function drawHeader(doc, logoDataUrl, title, subtitle) {
  // Logo – respects top boundary (never crosses INNER_TOP)
  let logoH = 0;
  if (logoDataUrl) {
    const maxW = LOGO_MAX_W;
    const maxH = LOGO_MAX_H;
    // approximate aspect from known logo 500×87
    const ratio = Math.min(maxW / 55, maxH / 11);
    const w = 55 * ratio;
    const h = 11 * ratio;
    const x = (PAGE_W - w) / 2;
    doc.addImage(logoDataUrl, "PNG", x, 8, w, h);
    logoH = h;
  }
  // Brand lines under logo (boundary interaction)
  const lineY = 8 + logoH + 2.5;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_L, lineY, PAGE_W - MARGIN_R, lineY);
  doc.setDrawColor(180, 190, 200);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_L, lineY + 0.8, PAGE_W - MARGIN_R, lineY + 0.8);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text(title, PAGE_W / 2, lineY + 7, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(subtitle, PAGE_W / 2, lineY + 11.5, { align: "center" });
  return lineY + 15;
}

function drawJobBlock(doc, job, y) {
  const col1 = MARGIN_L;
  const col2 = MARGIN_L + 32;
  const col3 = MARGIN_L + 100;
  const col4 = MARGIN_L + 132;
  const rowH = 6;
  const rows = [
    ["Client", job.client, "Site / Station", job.site],
    ["Work Order", job.wo, "Date", job.date],
    ["Equipment", job.equipment, "Technician", job.tech]
  ];
  doc.setFontSize(7.5);
  rows.forEach((r, i) => {
    const yy = y + i * rowH;
    doc.setFillColor(232, 238, 245);
    doc.rect(col1, yy - 3.5, 30, rowH, "F");
    doc.rect(col3, yy - 3.5, 30, rowH, "F");
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.15);
    doc.rect(col1, yy - 3.5, PAGE_W - MARGIN_L - MARGIN_R, rowH);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(r[0], col1 + 1.5, yy);
    doc.text(r[2], col3 + 1.5, yy);
    doc.setFont("helvetica", "normal");
    doc.text(r[1], col2 + 1, yy, { maxWidth: 62 });
    doc.text(r[3], col4 + 1, yy, { maxWidth: 50 });
  });
  return y + rows.length * rowH + 4;
}

function drawFooter(doc, pageNum) {
  // Inner boundary line
  const yLine = INNER_BOTTOM - 2;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_L, yLine, PAGE_W - MARGIN_R, yLine);

  // Left & right ABOVE the line; middle centred
  const yText = yLine + 3.2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(80, 80, 80);
  doc.text(`FORECOURT SUPPLIES & WORKS LTD  |  ${DOC_CONTROL}`, MARGIN_L, yText);
  doc.text("CONFIDENTIAL – Client Use Only", PAGE_W / 2, yText, { align: "center" });
  doc.text(`Page ${pageNum}`, PAGE_W - MARGIN_R, yText, { align: "right" });

  // Brand line below boundary
  doc.setFontSize(5.5);
  doc.setTextColor(110, 110, 110);
  doc.text("Forecourt Works / FSW  •  Technical Supply • Installation • Preventive Maintenance • Calibration  •  Mombasa, Kenya | Expanding across Kenya",
    PAGE_W / 2, 9, { align: "center" });
}

function statusColor(status) {
  const s = (status || "").toUpperCase();
  if (s === "YES" || s === "PASS") return PASS_GREEN;
  if (s === "NO" || s === "FAIL") return FAIL_RED;
  return [30, 30, 30]; // N/A black
}

function autoTableStyle() {
  return {
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      lineColor: [140, 140, 140],
      lineWidth: 0.15,
      textColor: [20, 20, 20],
      halign: "center",
      valign: "middle"
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 6.8,
      halign: "center"
    },
    alternateRowStyles: { fillColor: [247, 249, 252] },
    // 15 % opacity effect approximated by light grey lines already set
  };
}

// ---------------------------------------------------------------------------
// PDF builders
// ---------------------------------------------------------------------------
async function generatePDF(mode) {
  const job = collectJob();
  const hazards = collectHazards();
  const meta = collectMeterMeta();
  const readings = collectReadings();
  const logoDataUrl = await loadLogoAsDataUrl();
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let pageNum = 1;
  let y = 0;

  if (mode === "safety" || mode === "combined") {
    y = drawHeader(doc, logoDataUrl,
      mode === "combined" ? "CALIBRATION & SAFETY WORK PACK" : "JOB SAFETY & HAZARD ANALYSIS",
      mode === "combined"
        ? "Job Safety Analysis + Meter Accuracy Verification – Complete Site Document"
        : "Preventive Maintenance / Calibration Work Pack"
    );
    y = drawJobBlock(doc, job, y);

    // Section title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(mode === "combined" ? "SECTION A – JOB SAFETY & HAZARD ANALYSIS" : "1. Job Safety & Hazard Analysis", MARGIN_L, y);
    y += 5;

    // 4-column Safety table
    const hazardBody = hazards.map(h => [h.hazard, h.mitigation, h.status, h.remarks]);
    doc.autoTable({
      startY: y,
      head: [["Job Hazard Identified", "Mitigating Task", "Status", "Remarks"]],
      body: hazardBody,
      margin: { left: MARGIN_L, right: MARGIN_R },
      columnStyles: {
        0: { cellWidth: 48, halign: "left" },
        1: { cellWidth: 62, halign: "left" },
        2: { cellWidth: 20 },
        3: { cellWidth: 40, halign: "left" }
      },
      ...autoTableStyle(),
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          data.cell.styles.textColor = statusColor(data.cell.raw);
          data.cell.styles.fontStyle = "bold";
        }
      }
    });
    y = doc.lastAutoTable.finalY + 6;

    if (mode === "safety") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
      const decl = "Declaration: I confirm that all identified hazards have been assessed and mitigating controls are in place before commencement of work. Work will stop if any new uncontrolled hazard arises.";
      doc.text(decl, MARGIN_L, y, { maxWidth: PAGE_W - MARGIN_L - MARGIN_R });
      y += 12;
      drawSignOff(doc, y, ["Lead Technician", "Site Representative", "FSW Supervisor"]);
      drawFooter(doc, pageNum);
      doc.save("01_FSW_Job_Safety_Hazard_Analysis.pdf");
      return;
    }
  }

  // Meter section (for meter-only or combined)
  if (mode === "meter" || mode === "combined") {
    if (mode === "meter") {
      y = drawHeader(doc, logoDataUrl,
        "METER ACCURACY & CALIBRATION REPORT",
        "Dispenser Verification • Prover Tank Method • EPRA / KEBS Compliant"
      );
      y = drawJobBlock(doc, job, y);
    } else {
      // combined – check page space
      if (y > 200) {
        drawFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        y = drawHeader(doc, logoDataUrl,
          "CALIBRATION & SAFETY WORK PACK (cont.)",
          "Meter Accuracy Verification"
        );
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(mode === "combined" ? "SECTION B – METER ACCURACY PARAMETERS" : "2. Meter Accuracy – Test Parameters", MARGIN_L, y);
    y += 5;

    // Meta block
    doc.setFontSize(7.5);
    const metaRows = [
      ["Reading No#", meta.readingNo, "Nozzle ID", meta.nozzleId],
      ["Prover Tank Size", meta.proverSize, "Approx. Flow Rate", meta.flowRate]
    ];
    metaRows.forEach((r, i) => {
      const yy = y + i * 6.5;
      doc.setFillColor(230, 237, 245);
      doc.rect(MARGIN_L, yy - 3.5, 36, 6.5, "F");
      doc.rect(MARGIN_L + 95, yy - 3.5, 36, 6.5, "F");
      doc.setDrawColor(...NAVY);
      doc.setLineWidth(0.25);
      doc.rect(MARGIN_L, yy - 3.5, PAGE_W - MARGIN_L - MARGIN_R, 6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(r[0], MARGIN_L + 1.5, yy);
      doc.text(r[2], MARGIN_L + 96.5, yy);
      doc.setFont("helvetica", "normal");
      doc.text(r[1], MARGIN_L + 38, yy, { maxWidth: 55 });
      doc.text(r[3], MARGIN_L + 133, yy, { maxWidth: 48 });
    });
    y += metaRows.length * 6.5 + 6;

    // 6-column readings
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(mode === "combined" ? "SECTION C – CALIBRATION READINGS" : "3. Calibration Readings", MARGIN_L, y);
    y += 4;

    const readingBody = readings.map(r => [
      r.dispenser.toFixed(3),
      r.prover.toFixed(3),
      (r.errMl >= 0 ? "+" : "") + r.errMl.toFixed(1),
      (r.pct >= 0 ? "+" : "") + r.pct.toFixed(3),
      (r.mlPerL >= 0 ? "+" : "") + r.mlPerL.toFixed(2),
      r.status
    ]);

    doc.autoTable({
      startY: y,
      head: [[
        "Dispenser Indicated\nReading in L",
        "Prover Tank Actual\nReading in L",
        "Error in ml",
        "% Error",
        "ml Loss\nper litre",
        "Status"
      ]],
      body: readingBody,
      margin: { left: MARGIN_L, right: MARGIN_R },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 32 },
        2: { cellWidth: 24 },
        3: { cellWidth: 22 },
        4: { cellWidth: 26 },
        5: { cellWidth: 22 }
      },
      ...autoTableStyle(),
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          data.cell.styles.textColor = statusColor(data.cell.raw);
          data.cell.styles.fontStyle = "bold";
        }
      }
    });
    y = doc.lastAutoTable.finalY + 6;

    // Calibration analysis
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(mode === "combined" ? "SECTION D – CALIBRATION RESULT ANALYSIS" : "4. Calibration Result Analysis", MARGIN_L, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    const analysis = calibrationAnalysis(readings);
    const split = doc.splitTextToSize(analysis, PAGE_W - MARGIN_L - MARGIN_R);
    doc.text(split, MARGIN_L, y);
    y += split.length * 4 + 5;

    // Repeatability 4-col
    const rep = repeatabilitySummary(readings);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(mode === "combined" ? "SECTION E – REPEATABILITY SUMMARY" : "5. Repeatability Summary", MARGIN_L, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [["Error Range\nBottom Limit (ml)", "Error Range\nTop Limit (ml)", "Error Range\nSpread (ml)", "Overall Interpretation"]],
      body: [[
        (rep.bot >= 0 ? "+" : "") + rep.bot.toFixed(1),
        (rep.top >= 0 ? "+" : "") + rep.top.toFixed(1),
        rep.spread.toFixed(1),
        rep.interp
      ]],
      margin: { left: MARGIN_L, right: MARGIN_R },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 38 },
        2: { cellWidth: 35 },
        3: { cellWidth: 59, halign: "left" }
      },
      ...autoTableStyle()
    });
    y = doc.lastAutoTable.finalY + 8;

    // Sign-off
    if (mode === "meter") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(40, 40, 40);
      doc.text("Metrological Statement: Results are valid only for the nozzle, product and flow conditions stated. Prover tank certificate of accuracy must be current. This report forms part of the station’s regulatory compliance file (EPRA / KEBS).",
        MARGIN_L, y, { maxWidth: PAGE_W - MARGIN_L - MARGIN_R });
      y += 10;
      drawSignOff(doc, y, ["Calibration Technician", "Verified By (FSW)", "Client Acceptance"]);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
      doc.text("Handover Acceptance: The undersigned confirm that safety controls were verified, calibration was performed to the stated procedure, and results are accepted for the station compliance file.",
        MARGIN_L, y, { maxWidth: PAGE_W - MARGIN_L - MARGIN_R });
      y += 10;
      drawSignOff(doc, y, ["FSW Lead Technician", "Station Manager / Rep", "FSW Quality Check"]);
    }
  }

  drawFooter(doc, pageNum);

  const names = {
    safety: "01_FSW_Job_Safety_Hazard_Analysis.pdf",
    meter: "02_FSW_Meter_Accuracy_Calibration_Report.pdf",
    combined: "03_FSW_Combined_Safety_Calibration_Workpack.pdf"
  };
  doc.save(names[mode] || "FSW_Report.pdf");
}

function drawSignOff(doc, y, labels) {
  const colW = (PAGE_W - MARGIN_L - MARGIN_R) / 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  labels.forEach((lab, i) => {
    const x = MARGIN_L + i * colW;
    doc.text(lab, x, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Name: ____________________", x, y + 5);
    doc.text("Sign: ____________________", x, y + 10);
    doc.text("Date: ____________________", x, y + 15);
    doc.setFont("helvetica", "bold");
  });
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  DEFAULT_HAZARDS.forEach(h => addHazardRow(h));
  DEFAULT_READINGS.forEach(r => addReadingRow(r));
});
