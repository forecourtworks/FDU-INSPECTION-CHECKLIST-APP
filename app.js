/**
 * FORECOURT WORKS LTD – Petroleum Pumping Equipment Inspection & Compliance Checklist App
 * Complementary to the Technical Service Work Order. Focus: inspection, C/NC, prioritised actions.
 * Troubleshooting & Repair is deliberately excluded (handled on Work Order).
 */
(function () {
  'use strict';

  const state = {
    currentStep: 0,
    totalSteps: 11,
    photos: [],
    signatures: {},
    pdfBlob: null,
    pdfFileName: '',
    activeSteps: [0, 1, 7, 8, 9, 10], // always-on steps; others added by service type
    equipType: '',
    serviceTypes: []
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ── Checklist data (N/A-aware) ──────────────────────────────────────────
  const JHA_ITEMS = [
    { id: 'jha1', item: 'Preparation', criteria: 'Unexpected start-up / Energy release', criteria: 'LOTO applied. All power disconnected & tagged. Verify zero energy. Isolate product lines if required.' },
    { id: 'jha2', item: 'Flammable Atmosphere', criteria: 'Fire / explosion from fuel vapour', criteria: 'No smoking/hot work. Gas monitor in use. Bonding/earthing confirmed. Fire extinguisher ready.' },
    { id: 'jha3', item: 'Component Handling', criteria: 'Musculoskeletal / Crush injury', criteria: 'Lifting aids for heavy components (STP, meters). Team lift. Clear path of travel.' },
    { id: 'jha4', item: 'Pressurised Systems', criteria: 'High-pressure fluid injection / Hose burst', criteria: 'Depressurise lines before disconnection. Wear goggles, face shield & chemical-resistant gloves.' },
    { id: 'jha5', item: 'Electrical Work', criteria: 'Electrocution / Arc flash in hazardous area', criteria: 'Verify zero voltage. Use intrinsically safe tools where required. Check Ex ratings.' },
    { id: 'jha6', item: 'Confined Space / Sump Entry', criteria: 'Asphyxiation / vapour exposure in STP or dispenser sump', ccriteria: 'Gas test before entry. Forced ventilation. Standby person. Harness if required.' },
    { id: 'jha7', item: 'Product Spill / Environmental', criteria: 'Fuel spill to ground or drain', criteria: 'Spill kit ready. Containment in place. Immediate isolation valves known. Report any release.' }
  ];

  const PREINSTALL_ITEMS = [
    { id: 'pi1', item: 'Island / foundation readiness', criteria: 'Adequate island size, level, containment sump present if required. Drainage clear of product path.' },
    { id: 'pi2', item: 'Power supply – voltage & phases', criteria: 'Correct voltage (230/400 V), phase (1ph/3ph) and frequency per motor/nameplate. Dedicated circuit.' },
    { id: 'pi3', item: 'Power supply – capacity & protection', criteria: 'Correct breaker rating, earth-leakage / residual current protection available and correctly sized.' },
    { id: 'pi4', item: 'Intrinsically safe / Ex zoning', criteria: 'Hazardous area classification confirmed. Cable glands and equipment Ex-rated for Zone as required.' },
    { id: 'pi5', item: 'Product piping readiness', criteria: 'Correct pipe size, material, slope. Isolation valves present. No buried joints under island without access.' },
    { id: 'pi6', item: 'STP / tank interface (remote)', criteria: 'Tank manhole, packer, riser clear. Electrical junction box accessible. Line leak detector port available.' },
    { id: 'pi7', item: 'Containment sump / under-dispenser', criteria: 'Sump present, clean, dry, sealed penetrations. Sensors or interstitial monitoring ready if specified.' },
    { id: 'pi8', item: 'Compressed air (pneumatic pumps)', criteria: 'Clean dry air at required pressure. Dedicated line with isolation and regulator.' },
    { id: 'pi9', item: 'Access for installation & crane', criteria: 'Clear route for lifting STP or heavy pump units. No overhead obstruction conflict.' },
    { id: 'pi10', item: 'Regulatory / EPRA / landlord clearances', criteria: 'Any EPRA notification, Weights & Measures preparatory notice or landlord approvals obtained.' }
  ];

  const INSTALL_ITEMS = [
    { id: 'in1', item: 'Unpacking & damage inspection', criteria: 'All components present, no transit damage. Serial numbers match order/PO.' },
    { id: 'in2', item: 'Dispenser / pump positioning', criteria: 'Unit positioned per layout drawing. Level, secure, correct orientation for hose reach and vehicle approach.' },
    { id: 'in3', item: 'Anchoring / base fixing', criteria: 'Correct fasteners, torque. Shear/impact valve correctly oriented and at correct height (remote systems).' },
    { id: 'in4', item: 'Product piping connections', criteria: 'Correct fittings, seals, no leaks on pressure test. Flexible connectors free of stress or kink.' },
    { id: 'in5', item: 'Electrical connections', criteria: 'Motor wired correctly (rotation verified where applicable). Controls, pulser, E-stop functional. Ex glands tight.' },
    { id: 'in6', item: 'STP installation (remote systems)', criteria: 'Packer, riser, check valve, line leak detector installed per OEM. Cable gland sealed. Sump clean.' },
    { id: 'in7', item: 'Filter & strainer installation', criteria: 'Correct micron rating filter installed, dated, oriented for flow. Housing sealed.' },
    { id: 'in8', item: 'Hose, nozzle, breakaway, swivel', criteria: 'Correct hose length, no contact with ground in rest position. Breakaway and nozzle within service life dates.' },
    { id: 'in9', item: 'Air eliminator / vapour recovery (if fitted)', criteria: 'Air eliminator vent clear. Stage II components functional or correctly capped/sealed.' },
    { id: 'in10', item: 'Functional test – no load / dry run checks', criteria: 'Controls respond correctly. No unusual noise or vibration. E-stop cuts power instantly.' },
    { id: 'in11', item: 'Initial metrology verification (new/repair)', criteria: 'Accuracy within 0.25 % excess only (Kenya Weights & Measures). Under-dispense not permitted. Seals applied.' },
    { id: 'in12', item: 'Safety signage & operating instructions', criteria: 'Capacity/price display legible. Warning labels and fueling instructions posted and readable.' },
    { id: 'in13', item: 'Handover documentation', criteria: 'OEM manual, verification certificate, training records and this checklist handed over.' }
  ];

  const PM_STRUCTURAL = [
    { id: 'ps1', item: 'Dispenser cabinet / pump housing', criteria: 'Intact, no jagged edges, doors secure, no excessive corrosion. Clean and dry inside.' },
    { id: 'ps2', item: 'Mounting bolts & island fixings', criteria: 'All fasteners present, tight, undamaged. No movement of unit on island.' },
    { id: 'ps3', item: 'Containment sump / under-dispenser pan', criteria: 'Clean, dry, free of product or water. Penetrations sealed. Sensors functional if fitted.' },
    { id: 'ps4', item: 'Visible piping & fittings', criteria: 'No leaks, corrosion, or mechanical damage. Flexible connectors free of fraying, kink or over-bend.' },
    { id: 'ps5', item: 'Shear / impact valve (remote systems)', criteria: 'Operates freely, closes completely. Trip arm not obstructed. Test date recorded if required.' },
    { id: 'ps6', item: 'STP sump & packer manifold', criteria: 'No fuel leakage around packer. No corrosion on manifold, riser or fittings. Lid and gasket intact.' }
  ];

  const PM_MECHANICAL = [
    { id: 'pm1', item: 'Pumping unit / meter (suction or remote)', criteria: 'No external leakage. Mounting secure. No unusual noise or vibration under load.' },
    { id: 'pm2', item: 'Filter & strainer', criteria: 'Filter clean or within change interval, correctly dated. Housing sealed. No bypass evidence.' },
    { id: 'pm3', item: 'Air eliminator (suction systems)', criteria: 'Clean, dry, vent tube not obstructed. No fuel discharge from vent.' },
    { id: 'pm4', item: 'V-belt / coupling (suction pumps)', criteria: 'Correct tension, no excessive wear or cracking. Guards in place.' },
    { id: 'pm5', item: 'Hose, swivel, breakaway, nozzle', criteria: 'Hose not touching ground at rest (or within allowed length). No cracks, blisters. Breakaway & nozzle within “remove by” date. Auto shut-off functional.' },
    { id: 'pm6', item: 'Hose retriever / retractor', criteria: 'Retracts fully and smoothly. No broken springs or cables.' },
    { id: 'pm7', item: 'STP impeller / check valve / LLD', criteria: 'Flow rate at nozzle within expected range. Line leak detector (mechanical or electronic) passes required test rate.' },
    { id: 'pm8', item: 'Bulk pump mechanical condition', criteria: 'Gear/vane/centrifugal/diaphragm elements free of excessive wear. No unusual noise, vibration or seal leakage. Hand pumps: free rotation, no binding.' }
  ];

  const PM_ELECTRICAL = [
    { id: 'pe1', item: 'Grounding / bonding continuity', criteria: 'Continuity chassis/pipework to earth satisfactory. Bonding leads intact on hoses where required.' },
    { id: 'pe2', item: 'Motor insulation (Megger)', criteria: 'Insulation resistance > 1 MΩ (or OEM min). No signs of overheating or discoloration.' },
    { id: 'pe3', item: 'Supply voltage', criteria: 'Voltage at motor terminals within ±10 % of nameplate. Phases balanced (3ph).' },
    { id: 'pe4', item: 'Motor running current', criteria: 'Current ≤ FLA under load. Balanced across phases. No excessive inrush.' },
    { id: 'pe5', item: 'Control circuit, pulser, contactors', criteria: 'Contactors clean, no pitting. Control voltage correct. Pulser/encoder clean and functional.' },
    { id: 'pe6', item: 'Emergency Stop', criteria: 'E-Stop clearly visible, accessible, hard-wired, cuts power instantly. Tested and recorded.' },
    { id: 'pe7', item: 'Junction boxes & cable glands', criteria: 'Covers present, not corroded. Intrinsically safe wiring and glands intact and correctly rated.' },
    { id: 'pe8', item: 'Display / price board / totalisers', criteria: 'Displays legible, correct product/price. Totalisers advancing correctly. No error codes present.' }
  ];

  const PM_HYDRAULIC = [
    { id: 'ph1', item: 'System pressure / flow performance', criteria: 'Delivery flow rate within OEM/expected range for product and nozzle type. No excessive pressure drop.' },
    { id: 'ph2', item: 'Leak-down / holding integrity', criteria: 'No visible product drop or seepage at joints, seals, meter or pump body under static pressure.' },
    { id: 'ph5', item: 'Hose dilation check', criteria: 'Dilation error of delivery hose ≤ 50 ml under normal conditions of use.' },
    { id: 'ph6', item: 'Seals & adjustable parts', criteria: 'All adjustable parts affecting quantity delivery sealed. Weights & Measures verification seal present and intact.' },
    { id: 'ph7', item: 'STP pressure (no-flow) & flow at nozzle', criteria: 'No-flow pressure within baseline. Flow at nozzle 5–10 GPM (or OEM) under normal conditions.' },
    { id: 'ph8', item: 'Bulk transfer pump performance', criteria: 'Flow and pressure meet duty requirements. No cavitation noise. Relief valve operates if fitted. Diaphragm pumps: air pressure correct, no fluid in air exhaust.' }
  ];

  const REG_ITEMS = [
    { id: 'rg1', item: 'Weights & Measures Verification Certificate', criteria: 'Current certificate for the dispenser/meter. Validity period not expired. Issued by authorised verifier.' },
    { id: 'rg2', item: 'Metrology seals on adjustable parts', criteria: 'All seals protecting calibration/adjustment points present and intact. No evidence of tampering.' },
    { id: 'rg3', item: 'Emergency Stop Functionality', criteria: 'E-Stop visible, accessible, hard-wired, cuts power instantly. Tested and recorded.' },
    { id: 'rg4', item: 'Operator Training Records', criteria: 'Up-to-date records showing dates, content, names of trained operators for this equipment.' },
    { id: 'rg5', item: 'Logbook & Maintenance Records', criteria: 'Up-to-date, legible log of all PMs, repairs, daily checks and inspections.' },
    { id: 'rg6', item: 'EPRA / Licensing documentation', criteria: 'Site and equipment licensing current where required. Any EPRA notifications completed.' },
    { id: 'rg7', item: 'Hazardous area / Ex documentation', criteria: 'Equipment certificates and zone drawings available and matching installed equipment.' },
    { id: 'rg8', item: 'Spill response & fire equipment', criteria: 'Spill kit, absorbent, fire extinguisher present and within service date at the island/pump area.' }
  ];

  const TRAINING_TOPICS = [
    'Safe operating procedure for the specific dispenser or pump type',
    'Daily / pre-shift visual inspection checklist (leaks, hose, nozzle, E-stop)',
    'Recognition of abnormal noises, leaks, slow flow or meter errors',
    'Correct use of emergency stop and isolation points',
    'Product identification and prevention of cross-contamination',
    'Hose handling, nozzle placement and breakaway awareness',
    'Spill response and immediate containment actions',
    'Documentation requirements (logbook entries, incident reporting)',
    'When to stop use and call for service',
    'Specific hazards of this equipment (vapour, pressurised lines, electrical in hazardous area)'
  ];


  // ── Meter Accuracy / Calibration State ─────────────────────────────────
  const calState = {
    newFdu: [],      // array of reading objects
    inService: []
  };

  function calcMeterError(dispenserIndicatedL, proverActualL, capacityL, stage) {
    // proverActualL = true volume measured in the prover can
    // Error positive (+) = dispenser delivered MORE than indicated → Customer GAINs / Station LOSES
    // All intermediate and output values forced to exactly 2 decimal places
    const ind = Number(Number(dispenserIndicatedL).toFixed(2));
    const act = Number(Number(proverActualL).toFixed(2));
    const errorL = Number((act - ind).toFixed(4));
    const errorMl = Number((errorL * 1000).toFixed(2));
    const errorPct = ind > 0 ? Number(((errorL / ind) * 100).toFixed(2)) : 0;
    const perLitreMl = ind > 0 ? Number((errorMl / ind).toFixed(2)) : 0;

    let pass = false;
    let limitText = '';
    if (stage === 'new') {
      // Kenya Weights & Measures: 0.25% excess only (under-dispense not permitted)
      limitText = '0.25% excess only (under-dispense not permitted)';
      pass = errorPct >= 0 && errorPct <= 0.25;
    } else {
      // In-service: +0.5% excess or −0.25% deficiency
      limitText = '+0.5% excess or −0.25% deficiency';
      pass = errorPct >= -0.25 && errorPct <= 0.5;
    }

    let narrative = '';
    // errorMl > 0 → Actual > Indicated → under-registering (more delivered than shown)
    // errorMl < 0 → Actual < Indicated → over-registering (less delivered than shown)
    if (errorMl > 0.50) {
      narrative = `Under-registering → volume loss to station / gain to customer (${errorMl.toFixed(2)} ml extra delivered)`;
    } else if (errorMl < -0.50) {
      narrative = `Over-registering → volume loss to customer / gain to station (${Math.abs(errorMl).toFixed(2)} ml short delivered)`;
    } else {
      narrative = 'Negligible difference (within measurement uncertainty)';
    }

    return {
      errorMl: Number(errorMl.toFixed(2)),
      errorPct: Number(errorPct.toFixed(2)),
      perLitreMl: Number(perLitreMl.toFixed(2)),
      pass,
      limitText,
      narrative,
      status: pass ? 'PASS' : 'FAIL'
    };
  }

  function renderCalSection(containerId, stage, title, colour) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    const readings = stage === 'new' ? calState.newFdu : calState.inService;
    const bg = colour === 'new' ? '#ecfdf5' : '#fff7ed';
    const border = colour === 'new' ? '#059669' : '#d97706';
    const headBg = colour === 'new' ? '#059669' : '#d97706';

    let html = `<div class="cal-block" style="border:2px solid ${border};border-radius:10px;margin-bottom:16px;overflow:hidden;">
      <div style="background:${headBg};color:#fff;padding:10px 14px;font-weight:700;font-size:0.95rem;">${title}</div>
      <div style="background:${bg};padding:12px;">
        <p style="font-size:0.8rem;margin-bottom:10px;color:#374151;">
          ${stage === 'new'
            ? 'Legal limit (Weights & Measures): <b>0.25 % excess only</b>. Under-dispensing is not permitted on new / never-used / newly repaired FDUs.'
            : 'Legal limit (Weights & Measures): <b>+0.5 % excess or −0.25 % deficiency</b> for in-service equipment.'}
        </p>
        <div id="${containerId}-rows"></div>
        <button type="button" class="btn btn-outline btn-sm" data-add-cal="${stage}" style="margin-top:8px;">+ Add Reading</button>
        <div id="${containerId}-summary" style="margin-top:12px;font-size:0.85rem;"></div>
      </div>
    </div>`;
    cont.innerHTML = html;
    renderCalRows(containerId, stage);
    cont.querySelector(`[data-add-cal="${stage}"]`).addEventListener('click', () => {
      const arr = stage === 'new' ? calState.newFdu : calState.inService;
      arr.push({ capacity: 20, indicated: '', actual: '', flow: '', nozzleId: '' });
      renderCalRows(containerId, stage);
    });
  }

  function renderCalRows(containerId, stage) {
    const rowsCont = document.getElementById(containerId + '-rows');
    const summaryCont = document.getElementById(containerId + '-summary');
    if (!rowsCont) return;
    const arr = stage === 'new' ? calState.newFdu : calState.inService;
    if (arr.length === 0) {
      arr.push({ capacity: 20, indicated: '', actual: '', flow: '', nozzleId: '' });
    }
    let html = '';
    arr.forEach((r, idx) => {
      const calc = (r.indicated !== '' && r.actual !== '')
        ? calcMeterError(parseFloat(r.indicated), parseFloat(r.actual), r.capacity, stage)
        : null;
      html += `<div class="cal-row" data-idx="${idx}" style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="font-size:0.85rem;">Reading #${idx + 1}</strong>
          ${arr.length > 1 ? `<button type="button" class="btn btn-outline btn-sm" data-remove-cal="${stage}" data-idx="${idx}" style="padding:2px 8px;font-size:0.75rem;">Remove</button>` : ''}
        </div>
        <div class="row" style="margin-bottom:6px;">
          <div class="form-group" style="margin-bottom:4px;">
            <label style="font-size:0.7rem;">Nozzle ID <span style="color:#b91c1c;">*</span></label>
            <input type="text" class="cal-nozzle" data-stage="${stage}" data-idx="${idx}" value="${r.nozzleId || ''}" placeholder="e.g. Nozzle-1 / Hose-A / Side-L" />
          </div>
          <div class="form-group" style="margin-bottom:4px;">
            <label style="font-size:0.7rem;">Prover Can Capacity</label>
            <select class="cal-capacity" data-stage="${stage}" data-idx="${idx}">
              <option value="5" ${r.capacity == 5 ? 'selected' : ''}>5.00 L</option>
              <option value="10" ${r.capacity == 10 ? 'selected' : ''}>10.00 L</option>
              <option value="20" ${r.capacity == 20 ? 'selected' : ''}>20.00 L</option>
            </select>
          </div>
        </div>
        <div class="row" style="margin-bottom:6px;">
          <div class="form-group" style="margin-bottom:4px;">
            <label style="font-size:0.7rem;">Approx. Flow Rate (L/min)</label>
            <input type="text" inputmode="decimal" class="cal-flow" data-stage="${stage}" data-idx="${idx}" value="${r.flow || ''}" placeholder="e.g. 35.00" />
          </div>
          <div class="form-group" style="margin-bottom:4px;">
            <label style="font-size:0.7rem;">Dispenser Indicated Volume (L)</label>
            <input type="text" inputmode="decimal" class="cal-indicated" data-stage="${stage}" data-idx="${idx}" value="${r.indicated}" placeholder="e.g. 20.00" />
          </div>
        </div>
        <div class="form-group" style="margin-bottom:4px;">
          <label style="font-size:0.7rem;">Prover Can Actual Reading (L)</label>
          <input type="text" inputmode="decimal" class="cal-actual" data-stage="${stage}" data-idx="${idx}" value="${r.actual}" placeholder="True volume in the can e.g. 20.05" />
        </div>`;
      if (calc) {
        const statusColour = calc.pass ? '#059669' : '#dc2626';
        const signMl = calc.errorMl > 0 ? '+' : '';
        const signPct = calc.errorPct > 0 ? '+' : '';
        const signPer = calc.perLitreMl > 0 ? '+' : '';
        html += `<div style="background:#f8fafc;border-left:4px solid ${statusColour};padding:8px 10px;border-radius:4px;font-size:0.8rem;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;">
            <div><b>Nozzle ID:</b> ${r.nozzleId || '—'}</div>
            <div><b>Prover Tank Size:</b> ${Number(r.capacity).toFixed(2)} L</div>
            <div><b>Approx. Flow Rate:</b> ${r.flow ? Number(r.flow).toFixed(2) + ' L/min' : '—'}</div>
            <div><b>Dispenser Indicated:</b> ${Number(r.indicated).toFixed(2)} L</div>
            <div><b>Prover Actual:</b> ${Number(r.actual).toFixed(2)} L</div>
          </div>
          <div style="margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;">
            <b>Over/Under:</b> ${signMl}${calc.errorMl.toFixed(2)} ml &nbsp;|&nbsp;
            <b>%</b> ${signPct}${calc.errorPct.toFixed(2)}% &nbsp;|&nbsp;
            <b>Per Litre:</b> ${signPer}${calc.perLitreMl.toFixed(2)} ml/L
          </div>
          <div style="margin-top:4px;"><b>Status:</b> <span style="color:${statusColour};font-weight:700;">${calc.status}</span> against ${calc.limitText}</div>
          <div style="margin-top:4px;color:#4b5563;font-weight:500;">${calc.narrative}</div>
        </div>`;
      }
      html += `</div>`;
    });
    rowsCont.innerHTML = html;

    // Bind events
    rowsCont.querySelectorAll('.cal-capacity, .cal-indicated, .cal-actual, .cal-flow, .cal-nozzle').forEach(el => {
      el.addEventListener('input', () => updateCalReading(el));
      el.addEventListener('change', () => updateCalReading(el));
    });
    rowsCont.querySelectorAll('[data-remove-cal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const st = btn.dataset.removeCal;
        const i = parseInt(btn.dataset.idx, 10);
        const arr = st === 'new' ? calState.newFdu : calState.inService;
        arr.splice(i, 1);
        renderCalRows(containerId, stage);
      });
    });

    // Summary
    if (summaryCont) {
      const valid = arr.filter(r => r.indicated !== '' && r.actual !== '').map(r =>
        calcMeterError(parseFloat(r.indicated), parseFloat(r.actual), r.capacity, stage)
      );
      if (valid.length >= 2) {
        const pcts = valid.map(v => v.errorPct);
        const max = Math.max(...pcts);
        const min = Math.min(...pcts);
        const spread = max - min;
        const allPass = valid.every(v => v.pass);
        summaryCont.innerHTML = `<div style="background:#f1f5f9;padding:8px 10px;border-radius:6px;">
          <b>Repeatability summary (${valid.length} readings):</b><br>
          Error range: ${min.toFixed(2)}% to ${max.toFixed(2)}% (spread ${spread.toFixed(2)}%)<br>
          Overall: <span style="font-weight:700;color:${allPass ? '#059669' : '#dc2626'}">${allPass ? 'ALL WITHIN LIMITS' : 'ONE OR MORE OUTSIDE LIMITS'}</span>
        </div>`;
      } else {
        summaryCont.innerHTML = valid.length === 1
          ? '<span style="color:#6b7280;">Add more readings to assess repeatability / drift.</span>'
          : '';
      }
    }
  }

  function updateCalReading(el) {
    const stage = el.dataset.stage;
    const idx = parseInt(el.dataset.idx, 10);
    const arr = stage === 'new' ? calState.newFdu : calState.inService;
    if (!arr[idx]) return;
    if (el.classList.contains('cal-capacity')) arr[idx].capacity = parseInt(el.value, 10);
    if (el.classList.contains('cal-indicated')) arr[idx].indicated = el.value;
    if (el.classList.contains('cal-actual')) arr[idx].actual = el.value;
    if (el.classList.contains('cal-flow')) arr[idx].flow = el.value;
    if (el.classList.contains('cal-nozzle')) arr[idx].nozzleId = el.value;
    const containerId = stage === 'new' ? 'cal-new-container' : 'cal-inservice-container';
    renderCalRows(containerId, stage);
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function generateDocNumber() {
    const y = new Date().getFullYear();
    const n = String(Math.floor(Math.random() * 9000) + 1000);
    return `CHK-${y}-${n}`;
  }

  function toast(msg, type = '') {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    setTimeout(() => { el.className = 'toast'; }, 2800);
  }

  function showOverlay(text) {
    $('#overlay-text').textContent = text || 'Working…';
    $('#overlay').classList.add('show');
  }
  function hideOverlay() {
    $('#overlay').classList.remove('show');
  }

  // ── Lift type / service type UI ────────────────────────────────────────
  function initSelectors() {
    $$('#lift-type-grid .lift-type-card').forEach(card => {
      card.addEventListener('click', () => {
        $$('#lift-type-grid .lift-type-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        card.querySelector('input').checked = true;
        state.equipType = card.querySelector('input').value;
      });
    });
    $$('#service-type-grid .service-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        const cb = chip.querySelector('input');
        cb.checked = !cb.checked;
        chip.classList.toggle('selected', cb.checked);
        updateServiceTypes();
      });
      chip.querySelector('input').addEventListener('change', () => {
        chip.classList.toggle('selected', chip.querySelector('input').checked);
        updateServiceTypes();
      });
    });
  }

  function updateServiceTypes() {
    state.serviceTypes = Array.from($$('input[name="service-type"]:checked')).map(el => el.value);
  }

  function computeActiveSteps() {
    const base = [0, 1]; // basics + JHA always
    if (state.serviceTypes.includes('A')) base.push(2);
    if (state.serviceTypes.includes('B')) base.push(3);
    if (state.serviceTypes.includes('C') || state.serviceTypes.includes('D')) base.push(4);
    if (state.serviceTypes.includes('G')) base.push(5);
    if (state.serviceTypes.includes('F')) base.push(6);
    base.push(7, 8, 9, 10); // NC log, photos, sign-off, review always
    state.activeSteps = [...new Set(base)].sort((a, b) => a - b);
  }

  // ── Render checklist sections ──────────────────────────────────────────
  function resultSelect(id, defaultVal = '') {
    return `<select class="result-sel" data-id="${id}">
      <option value="">—</option>
      <option value="C" ${defaultVal === 'C' ? 'selected' : ''}>C</option>
      <option value="NC" ${defaultVal === 'NC' ? 'selected' : ''}>NC</option>
      <option value="N/A" ${defaultVal === 'N/A' ? 'selected' : ''}>N/A</option>
    </select>`;
  }

  function renderCheckList(containerId, items, groupTitle) {
    const cont = $(containerId);
    if (!cont) return;
    let html = groupTitle ? `<div class="checklist-group"><h4>${groupTitle}</h4>` : '<div class="checklist-group">';
    items.forEach(it => {
      html += `<div class="check-row" data-id="${it.id}">
        <div>
          <strong>${it.item || it.step}</strong>
          <div class="criteria">${it.criteria || it.hazard + ' → ' + it.control}</div>
          <input type="text" class="remarks-input" data-remarks="${it.id}" placeholder="Remarks / measured value" />
        </div>
        <div>${resultSelect(it.id)}</div>
      </div>`;
    });
    html += '</div>';
    cont.innerHTML = html;
  }

  function renderJHA() {
    const cont = $('#jha-container');
    let html = '';
    JHA_ITEMS.forEach(it => {
      html += `<div class="check-row" data-id="${it.id}">
        <div>
          <strong>${it.step}</strong>
          <div class="criteria"><b>Hazard:</b> ${it.hazard}<br><b>Control:</b> ${it.control}</div>
        </div>
        <div>
          <select class="result-sel" data-id="${it.id}">
            <option value="">—</option>
            <option value="YES">YES</option>
            <option value="NO">NO</option>
            <option value="N/A">N/A</option>
          </select>
        </div>
      </div>`;
    });
    cont.innerHTML = html;
  }

  function renderReg() {
    const cont = $('#reg-container');
    let html = '<div class="checklist-group">';
    REG_ITEMS.forEach(it => {
      html += `<div class="check-row" data-id="${it.id}">
        <div>
          <strong>${it.item}</strong>
          <div class="criteria">${it.criteria}</div>
          <input type="text" class="remarks-input" data-remarks="${it.id}" placeholder="Remarks / expiry date" />
        </div>
        <div>
          <select class="result-sel" data-id="${it.id}">
            <option value="">—</option>
            <option value="Available">Available</option>
            <option value="Missing">Missing</option>
          </select>
        </div>
      </div>`;
    });
    html += '</div>';
    cont.innerHTML = html;
  }

  function renderTraining() {
    const cont = $('#training-topics');
    let html = '<div class="checkbox-group">';
    TRAINING_TOPICS.forEach((t, i) => {
      html += `<label class="check-item"><input type="checkbox" name="train-topic" value="${t}" id="tt${i}"> ${t}</label>`;
    });
    html += '</div>';
    cont.innerHTML = html;
  }

  function renderPM() {
    const cont = $('#pm-container');
    cont.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div id="pm-struct"></div>
      <div id="pm-mech"></div>
      <div id="pm-elec"></div>
      <div id="pm-hyd"></div>
      <div id="cal-new-container" style="margin-top:16px;"></div>
      <div id="cal-inservice-container"></div>
    `;
    cont.appendChild(wrap);
    renderCheckList('#pm-struct', PM_STRUCTURAL, 'A. Structural & Cabinet Integrity');
    renderCheckList('#pm-mech', PM_MECHANICAL, 'B. Mechanical System Health');
    renderCheckList('#pm-elec', PM_ELECTRICAL, 'C. Electrical System Health');
    renderCheckList('#pm-hyd', PM_HYDRAULIC, 'D. Hydraulic / Flow Performance (excl. Meter Accuracy)');
    // Dedicated Meter Accuracy modules with live calculation
    renderCalSection('cal-new-container', 'new',
      '1. METER ACCURACY – New & Never Used Before FDU  (Verification / Commissioning)', 'new');
    renderCalSection('cal-inservice-container', 'inService',
      '2. METER ACCURACY – In-Service FDU  (Routine Inspection)', 'inService');
  }

  // ── Non-conformance auto-collect ───────────────────────────────────────
  function collectNCs() {
    const ncs = [];
    // From all result selects that are NC or Missing
    $$('.result-sel').forEach(sel => {
      const val = sel.value;
      if (val === 'NC' || val === 'Missing') {
        const row = sel.closest('.check-row');
        const title = row ? (row.querySelector('strong')?.textContent || sel.dataset.id) : sel.dataset.id;
        const remarks = row?.querySelector('.remarks-input')?.value || '';
        ncs.push({
          id: sel.dataset.id,
          desc: title + (remarks ? ' – ' + remarks : ''),
          urgency: val === 'Missing' && sel.dataset.id === 'rg1' ? 'Critical' : 'High',
          wo: false,
          target: ''
        });
      }
    });
    return ncs;
  }

  function renderNCLog(ncs) {
    const cont = $('#nc-container');
    if (!ncs.length) {
      cont.innerHTML = '<p style="color:var(--muted);font-size:0.88rem;">No non-conformances recorded yet. NCs from previous sections will appear here automatically, or add manually.</p>';
      return;
    }
    let html = `<table class="data-table"><thead><tr>
      <th>CA ID</th><th>Description</th><th>Urgency</th><th>WO?</th><th>Target</th>
    </tr></thead><tbody>`;
    ncs.forEach((nc, i) => {
      const urgClass = nc.urgency === 'Critical' ? 'nc-urgency-crit' :
        nc.urgency === 'High' ? 'nc-urgency-high' :
        nc.urgency === 'Medium' ? 'nc-urgency-med' : 'nc-urgency-low';
      html += `<tr data-ncid="${nc.id}">
        <td>CA#${String(i + 1).padStart(3, '0')}</td>
        <td><input type="text" class="nc-desc" value="${nc.desc.replace(/"/g, '&quot;')}" /></td>
        <td>
          <select class="nc-urgency ${urgClass}">
            <option value="Critical" ${nc.urgency === 'Critical' ? 'selected' : ''}>Critical</option>
            <option value="High" ${nc.urgency === 'High' ? 'selected' : ''}>High</option>
            <option value="Medium" ${nc.urgency === 'Medium' ? 'selected' : ''}>Medium</option>
            <option value="Low" ${nc.urgency === 'Low' ? 'selected' : ''}>Low</option>
          </select>
        </td>
        <td><select class="nc-wo"><option value="No">No</option><option value="Yes">Yes</option></select></td>
        <td><input type="date" class="nc-target" value="${nc.target || ''}" /></td>
      </tr>`;
    });
    html += '</tbody></table>';
    html += '<p class="help" style="margin-top:6px;"><b>Urgency:</b> Critical = stop use immediately · High = 24–48 hrs · Medium = within 7 days · Low = next PM cycle</p>';
    cont.innerHTML = html;
  }

  // ── Step navigation ────────────────────────────────────────────────────
  function showStep(n) {
    if (!state.activeSteps.includes(n)) {
      // jump to next active
      const next = state.activeSteps.find(s => s > n) ?? state.activeSteps[state.activeSteps.length - 1];
      n = next;
    }
    state.currentStep = n;
    $$('.step-card').forEach(c => c.classList.remove('active'));
    const card = $(`#step-${n}`);
    if (card) card.classList.add('active');

    const idx = state.activeSteps.indexOf(n);
    const pct = ((idx + 1) / state.activeSteps.length) * 100;
    $('#progress-fill').style.width = pct + '%';

    $('#btn-prev').disabled = idx <= 0;
    $('#btn-next').textContent = idx >= state.activeSteps.length - 1 ? 'Review' : 'Next →';

    // Special renders
    if (n === 1) renderJHA();
    if (n === 2) renderCheckList('#preinstall-container', PREINSTALL_ITEMS);
    if (n === 3) renderCheckList('#install-container', INSTALL_ITEMS);
    if (n === 4) renderPM();
    if (n === 5) renderReg();
    if (n === 6) renderTraining();
    if (n === 7) {
      const ncs = collectNCs();
      renderNCLog(ncs);
    }
    if (n === 9) {
      setTimeout(initSignatures, 150);
      if (!$('#sig-tech-name').value) $('#sig-tech-name').value = $('#tech-lead').value || '';
      if (!$('#sig-tech-date').value) $('#sig-tech-date').value = todayISO();
      if (!$('#sig-client-date').value) $('#sig-client-date').value = todayISO();
    }
    if (n === 10) buildReview();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextActiveStep() {
    const idx = state.activeSteps.indexOf(state.currentStep);
    if (idx < state.activeSteps.length - 1) return state.activeSteps[idx + 1];
    return state.currentStep;
  }

  function prevActiveStep() {
    const idx = state.activeSteps.indexOf(state.currentStep);
    if (idx > 0) return state.activeSteps[idx - 1];
    return state.currentStep;
  }

  // ── Validation ─────────────────────────────────────────────────────────
  function validateStep(step) {
    if (step === 0) {
      const req = ['doc-number', 'doc-date', 'client-name', 'site-name', 'lift-id', 'visit-date', 'tech-lead'];
      for (const id of req) {
        if (!$(`#${id}`).value.trim()) {
          toast('Please complete all required fields (*)', 'error');
          return false;
        }
      }
      if (!state.equipType) {
        toast('Select a Lift Type', 'error');
        return false;
      }
      if (!state.serviceTypes.length) {
        toast('Select at least one Service Type', 'error');
        return false;
      }
      return true;
    }
    if (step === 1) {
      if (!$('#jha-sign-name').value.trim()) {
        toast('JHA sign-off name is required', 'error');
        return false;
      }
      return true;
    }
    if (step === 9) {
      if (!$('#client-rep-name').value.trim()) {
        toast('Client representative name is required', 'error');
        return false;
      }
      const techPad = sigPads['sig-tech'];
      const clientPad = sigPads['sig-client'];
      if (techPad && techPad.isEmpty()) {
        toast('Technician signature is required', 'error');
        return false;
      }
      if (clientPad && clientPad.isEmpty()) {
        toast('Client signature is required', 'error');
        return false;
      }
      return true;
    }
    return true;
  }

  // ── Photos ─────────────────────────────────────────────────────────────
  function addPhotos(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') return;
      const reader = new FileReader();
      reader.onload = (e) => {
        state.photos.push({
          id: 'p' + Date.now() + Math.random().toString(36).slice(2, 6),
          dataUrl: e.target.result,
          name: file.name
        });
        renderPhotos();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderPhotos() {
    const grid = $('#photo-grid');
    grid.innerHTML = '';
    state.photos.forEach(p => {
      const div = document.createElement('div');
      div.className = 'photo-thumb';
      if (p.dataUrl.startsWith('data:image')) {
        div.innerHTML = `<img src="${p.dataUrl}" alt="${p.name}" /><button class="remove" data-id="${p.id}">×</button>`;
      } else {
        div.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.7rem;padding:4px;text-align:center;">${p.name}</div><button class="remove" data-id="${p.id}">×</button>`;
      }
      grid.appendChild(div);
    });
    grid.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', () => {
        state.photos = state.photos.filter(p => p.id !== btn.dataset.id);
        renderPhotos();
      });
    });
  }

  // ── Signatures ─────────────────────────────────────────────────────────
  let sigPads = {};
  function initSignatures() {
    ['sig-tech', 'sig-client'].forEach(id => {
      const canvas = document.getElementById(id);
      if (!canvas) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
      if (sigPads[id]) {
        try { sigPads[id].off(); } catch (_) {}
      }
      sigPads[id] = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255,255,255)',
        penColor: 'rgb(13, 38, 77)'
      });
    });
  }

  function clearSig(id) {
    if (sigPads[id]) sigPads[id].clear();
  }

  function getSigDataSafe(id) {
    const pad = sigPads[id];
    if (!pad || pad.isEmpty()) return null;
    try {
      const canvas = document.getElementById(id);
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const ctx = tmp.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tmp.width, tmp.height);
      ctx.drawImage(canvas, 0, 0);
      return tmp.toDataURL('image/jpeg', 0.92);
    } catch (e) {
      return pad.toDataURL('image/png');
    }
  }

  // ── Review ─────────────────────────────────────────────────────────────
  function buildReview() {
    const ncs = collectNCs();
    let html = `
      <div class="review-section" style="border:1px solid var(--border);border-radius:8px;margin-bottom:10px;overflow:hidden;">
        <h4 style="background:#f3f4f6;padding:8px 12px;font-size:0.85rem;">Document & Equipment</h4>
        <div style="padding:10px 12px;font-size:0.85rem;">
          <b>${$('#doc-number').value}</b> · ${$('#client-name').value} · ${$('#site-name').value}<br>
          Lift: ${state.equipType} · ID: ${$('#lift-id').value} · Capacity: ${$('#lift-capacity').value || '—'} kg<br>
          Service: ${state.serviceTypes.join(', ')} · Tech: ${$('#tech-lead').value}
        </div>
      </div>
      <div class="review-section" style="border:1px solid var(--border);border-radius:8px;margin-bottom:10px;overflow:hidden;">
        <h4 style="background:#f3f4f6;padding:8px 12px;font-size:0.85rem;">Non-Conformances (${ncs.length})</h4>
        <div style="padding:10px 12px;font-size:0.85rem;">
          ${ncs.length ? ncs.map((n, i) => `CA#${String(i+1).padStart(3,'0')}: ${n.desc} [${n.urgency}]`).join('<br>') : 'None recorded'}
        </div>
      </div>
      <div class="review-section" style="border:1px solid var(--border);border-radius:8px;margin-bottom:10px;overflow:hidden;">
        <h4 style="background:#f3f4f6;padding:8px 12px;font-size:0.85rem;">Photos</h4>
        <div style="padding:10px 12px;font-size:0.85rem;">${state.photos.length} file(s) attached</div>
      </div>
    `;
    $('#review-summary').innerHTML = html;
  }

  // ── PDF Generation (Professional layout matching FSW Workbook design) ──
  async function generatePDF() {
    showOverlay('Generating PDF…');
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210, pageH = 297;
      const outer = 7, inner = 9, margin = 14;
      const usable = pageW - margin * 2;
      const navy = [13, 71, 140];
      const navyLight = [224, 235, 245];
      const dark = [30, 38, 50];
      const grey = [100, 110, 120];
      const green = [26, 115, 70];
      const red = [185, 28, 28];
      let y = 18;

      function drawPageFrame() {
        doc.setDrawColor(...navy);
        doc.setLineWidth(0.55);
        doc.rect(outer, outer, pageW - outer * 2, pageH - outer * 2);
        doc.setLineWidth(0.25);
        doc.rect(inner, inner, pageW - inner * 2, pageH - inner * 2);
        // Logo mark at top-right interacting with borders
        const logoX = pageW - outer - 18;
        const logoY = outer - 1.5;
        doc.setFillColor(...navy);
        doc.roundedRect(logoX, logoY, 16, 12, 1.2, 1.2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('FW', logoX + 8, logoY + 5.2, { align: 'center' });
        doc.setFontSize(4.5);
        doc.text('FSW', logoX + 8, logoY + 9.2, { align: 'center' });
      }

      function drawFooter(pageNum, totalPages) {
        // Left & right footer text above the inner boundary line
        const fy = pageH - inner - 3.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...navy);
        doc.text('FSW | Petroleum Pumping Equipment Inspection & Compliance Checklist', margin, fy);
        doc.text('Page ' + pageNum + ' of ' + totalPages, pageW - margin, fy, { align: 'right' });
        // Middle confidential centred above inner boundary
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(5.5);
        doc.setTextColor(...grey);
        doc.text('CONFIDENTIAL – Client Use Only', pageW / 2, fy, { align: 'center' });
        // Brand line below the outer boundary
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(...navy);
        doc.text('FORECOURT WORKS LIMITED – Engineering Reliability into Every Forecourt', pageW / 2, pageH - outer + 3.5, { align: 'center' });
      }

      function checkPage(need) {
        if (y + need > pageH - 18) {
          doc.addPage();
          drawPageFrame();
          y = 18;
        }
      }

      function sectionBar(title) {
        checkPage(12);
        doc.setFillColor(...navy);
        doc.rect(margin, y, usable, 6.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(title, margin + 2, y + 4.5);
        y += 9;
        doc.setTextColor(...dark);
      }

      function bodyLine(txt, size, bold) {
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(size || 8);
        const lines = doc.splitTextToSize(String(txt || '—'), usable);
        checkPage(lines.length * 3.8 + 2);
        doc.text(lines, margin, y);
        y += lines.length * 3.8 + 1.5;
      }

      function kvLine(pairs) {
        doc.setFontSize(7.5);
        let x = margin;
        pairs.forEach((p) => {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...navy);
          const k = p.k + ': ';
          doc.text(k, x, y);
          const kw = doc.getTextWidth(k);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...dark);
          doc.text(String(p.v || '—'), x + kw, y);
          x += usable / pairs.length;
        });
        y += 5;
      }

      function statusFull(val) {
        if (val === 'C') return { text: 'Conforming (C)', colour: green };
        if (val === 'NC') return { text: 'Non Conforming (NC)', colour: red };
        if (val === 'N/A' || val === 'NA') return { text: 'N/A', colour: grey };
        if (val === 'Available') return { text: 'Available', colour: green };
        if (val === 'Missing') return { text: 'Missing', colour: red };
        if (val === 'YES') return { text: 'YES', colour: green };
        if (val === 'NO') return { text: 'NO', colour: red };
        return { text: val || '—', colour: dark };
      }

      // 4-column inspection table (Item | Criteria | Status | Remarks)
      // Table lines drawn at ~15% opacity equivalent (very light grey)
      function dumpTableSection(title, items) {
        sectionBar(title);
        const colW = [usable * 0.28, usable * 0.36, usable * 0.18, usable * 0.18];
        const headers = ['Inspection Item', 'Acceptance Criteria', 'Status', 'Remarks'];
        const rowHBase = 4.2;

        // Header row
        checkPage(10);
        doc.setFillColor(13, 71, 140);
        doc.rect(margin, y, usable, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        let hx = margin + 1;
        headers.forEach((h, i) => {
          doc.text(h, hx, y + 4);
          hx += colW[i];
        });
        y += 7;

        items.forEach((it) => {
          const sel = document.querySelector('.result-sel[data-id="' + it.id + '"]');
          const remarksEl = document.querySelector('.remarks-input[data-remarks="' + it.id + '"]');
          const val = sel ? sel.value : '';
          const rem = remarksEl ? remarksEl.value : '';
          const itemTxt = it.item || it.step || it.id;
          const critTxt = it.criteria || ((it.hazard || '') + ' → ' + (it.control || ''));
          const st = statusFull(val);

          const itemLines = doc.splitTextToSize(itemTxt, colW[0] - 2);
          const critLines = doc.splitTextToSize(critTxt, colW[1] - 2);
          const remLines = doc.splitTextToSize(rem || '—', colW[3] - 2);
          const maxLines = Math.max(itemLines.length, critLines.length, remLines.length, 1);
          const rowH = maxLines * 3.4 + 2.5;

          checkPage(rowH + 2);

          // Light table grid lines (~15% opacity feel)
          doc.setDrawColor(200, 210, 220);
          doc.setLineWidth(0.12);
          doc.rect(margin, y, usable, rowH);
          let lx = margin;
          for (let c = 0; c < 3; c++) {
            lx += colW[c];
            doc.line(lx, y, lx, y + rowH);
          }

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(...dark);
          doc.text(itemLines, margin + 1, y + 3.2);
          doc.text(critLines, margin + colW[0] + 1, y + 3.2);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...st.colour);
          doc.text(st.text, margin + colW[0] + colW[1] + 1, y + 3.2);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...dark);
          doc.text(remLines, margin + colW[0] + colW[1] + colW[2] + 1, y + 3.2);

          y += rowH;
        });
        y += 3;
      }

      // ── Page 1 header ──
      drawPageFrame();

      // Company header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...navy);
      doc.text('FORECOURT WORKS LIMITED', pageW / 2, y, { align: 'center' });
      y += 5;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...dark);
      doc.text('Engineering Reliability into Every Forecourt', pageW / 2, y, { align: 'center' });
      y += 4;
      doc.setDrawColor(...navy);
      doc.setLineWidth(0.4);
      doc.line(margin + 20, y, pageW - margin - 20, y);
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...navy);
      doc.text('EQUIPMENT/SYSTEMS INSPECTION CHECKLIST', pageW / 2, y, { align: 'center' });
      y += 6;

      // Checklist No + WO No box
      doc.setFillColor(...navyLight);
      doc.setDrawColor(...navy);
      doc.setLineWidth(0.3);
      doc.rect(margin, y, usable, 8, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...dark);
      doc.text('Inspection Checklist No.  ' + ($('#doc-number').value || '—'), margin + 3, y + 5.2);
      doc.text('Associated Work Order No.  ' + ($('#linked-wo').value || '—'), margin + usable / 2, y + 5.2);
      y += 11;

      // 1. GENERAL INFORMATION
      sectionBar('1. GENERAL INFORMATION');
      kvLine([
        { k: 'Client', v: $('#client-name').value },
        { k: 'Site', v: $('#site-name').value }
      ]);
      kvLine([
        { k: 'Asset ID', v: $('#lift-id').value },
        { k: 'Type', v: state.equipType }
      ]);
      kvLine([
        { k: 'Manufacturer', v: $('#lift-mfr').value },
        { k: 'Model / Serial', v: $('#lift-model').value }
      ]);
      kvLine([
        { k: 'Visit Date', v: $('#visit-date').value },
        { k: 'Next PM', v: $('#next-pm').value }
      ]);
      kvLine([
        { k: 'Technician', v: $('#tech-lead').value },
        { k: 'Service Type(s)', v: state.serviceTypes.join(', ') }
      ]);
      kvLine([
        { k: 'FDU Config', v: $('#fdu-config').value || '—' },
        { k: 'Component ID(s)', v: $('#component-ids').value || '—' }
      ]);
      y += 2;

      // 2. JHA
      sectionBar('2. JOB SAFETY & HAZARD ANALYSIS');
      bodyLine('JHA Sign-off: ' + ($('#jha-sign-name').value || '—'), 8, false);
      // JHA uses different selects; dump as table-like
      const jhaItems = JHA_ITEMS.map(it => ({
        id: it.id,
        item: it.step,
        criteria: 'Hazard: ' + it.hazard + ' | Control: ' + it.control
      }));
      // mini header already done by sectionBar; reuse dump logic lightly
      jhaItems.forEach(it => {
        const sel = document.querySelector('.result-sel[data-id="' + it.id + '"]');
        const val = sel ? sel.value : '—';
        const st = statusFull(val);
        checkPage(8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...dark);
        const lines = doc.splitTextToSize(it.item + ' — ' + it.criteria, usable * 0.72);
        doc.text(lines, margin, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...st.colour);
        doc.text(st.text, margin + usable * 0.74, y);
        y += Math.max(lines.length * 3.5, 4.5);
      });
      y += 2;

      if (state.serviceTypes.includes('A')) dumpTableSection('3. PRE-INSTALLATION SITE READINESS', PREINSTALL_ITEMS);
      if (state.serviceTypes.includes('B')) dumpTableSection('4. ASSET INSTALLATION CHECKLIST', INSTALL_ITEMS);
      if (state.serviceTypes.includes('C') || state.serviceTypes.includes('D')) {
        dumpTableSection('5A. STRUCTURAL & CABINET INTEGRITY', PM_STRUCTURAL);
        dumpTableSection('5B. MECHANICAL SYSTEM HEALTH', PM_MECHANICAL);
        dumpTableSection('5C. ELECTRICAL SYSTEM HEALTH', PM_ELECTRICAL);
        dumpTableSection('5D. HYDRAULIC / FLOW PERFORMANCE', PM_HYDRAULIC);

        // ── Meter Accuracy PDF renderer (6-col table + analysis + repeatability) ──
        function dumpMeterAccuracy(stage, sectionTitle, legalNote) {
          sectionBar(sectionTitle);
          bodyLine(legalNote, 7, false);
          const arr = stage === 'new' ? calState.newFdu : calState.inService;
          const valid = arr.filter(r => r.indicated !== '' && r.actual !== '');
          if (valid.length === 0) {
            bodyLine('No readings recorded.', 7.5, false);
            y += 2;
            return;
          }

          // Header details for each reading group
          valid.forEach((r, i) => {
            const c = calcMeterError(parseFloat(r.indicated), parseFloat(r.actual), r.capacity, stage);
            checkPage(28);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(...navy);
            doc.text('Reading No. ' + (i + 1), margin, y);
            y += 4;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...dark);
            const hdr = 'Nozzle ID: ' + (r.nozzleId || '—') +
              '   |   Prover Tank Size: ' + Number(r.capacity).toFixed(2) + ' L' +
              '   |   Approximate Flow Rate: ' + (r.flow ? Number(r.flow).toFixed(2) + ' L/min' : '—');
            const hdrLines = doc.splitTextToSize(hdr, usable);
            doc.text(hdrLines, margin, y);
            y += hdrLines.length * 3.5 + 2;

            // 6-column table
            const colW = [usable * 0.17, usable * 0.17, usable * 0.15, usable * 0.14, usable * 0.18, usable * 0.19];
            const headers = ['Dispenser Indicated (L)', 'Prover Actual (L)', 'Error (ml)', '% Error', 'ml Loss per Litre', 'Status'];
            const rowH = 6.5;

            // Header row
            checkPage(rowH + 4);
            doc.setFillColor(13, 71, 140);
            doc.rect(margin, y, usable, rowH, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            let hx = margin + 1;
            headers.forEach((h, hi) => {
              doc.text(h, hx, y + 4.2);
              hx += colW[hi];
            });
            y += rowH;

            // Data row – light grid (~15% opacity feel)
            checkPage(rowH + 2);
            doc.setDrawColor(200, 210, 220);
            doc.setLineWidth(0.12);
            doc.rect(margin, y, usable, rowH);
            let lx = margin;
            for (let cIdx = 0; cIdx < 5; cIdx++) {
              lx += colW[cIdx];
              doc.line(lx, y, lx, y + rowH);
            }

            const sMl = c.errorMl > 0 ? '+' : '';
            const sPct = c.errorPct > 0 ? '+' : '';
            const sPer = c.perLitreMl > 0 ? '+' : '';
            const cells = [
              Number(r.indicated).toFixed(2),
              Number(r.actual).toFixed(2),
              sMl + c.errorMl.toFixed(2),
              sPct + c.errorPct.toFixed(2) + '%',
              sPer + c.perLitreMl.toFixed(2),
              c.status
            ];
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...dark);
            let cx = margin + 1;
            cells.forEach((cell, ci) => {
              if (ci === 5) {
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...(c.pass ? green : red));
              } else {
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...dark);
              }
              doc.text(cell, cx, y + 4.2);
              cx += colW[ci];
            });
            y += rowH + 3;

            // Calibration Result Analysis
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(...dark);
            doc.text('Calibration Result Analysis', margin, y);
            y += 4;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(...(c.pass ? green : red));
            const analysisLines = doc.splitTextToSize(c.narrative, usable);
            doc.text(analysisLines, margin, y);
            y += analysisLines.length * 3.6 + 4;
          });

          // Repeatability Summary (when ≥2 valid readings)
          if (valid.length >= 2) {
            const calcs = valid.map(r => calcMeterError(parseFloat(r.indicated), parseFloat(r.actual), r.capacity, stage));
            const pcts = calcs.map(v => v.errorPct);
            const minPct = Math.min(...pcts);
            const maxPct = Math.max(...pcts);
            const spread = maxPct - minPct;
            const allPass = calcs.every(v => v.pass);
            const interpretation = allPass
              ? 'ALL WITHIN LIMITS – acceptable repeatability'
              : 'ONE OR MORE OUTSIDE LIMITS – investigate drift / meter condition';

            sectionBar('Repeatability Summary');
            const rColW = [usable * 0.22, usable * 0.22, usable * 0.22, usable * 0.34];
            const rHeaders = ['Error range bottom limit', 'Error range top limit', 'Error range spread', 'Overall interpretation'];
            const rRowH = 7;

            checkPage(rRowH * 2 + 4);
            doc.setFillColor(13, 71, 140);
            doc.rect(margin, y, usable, rRowH, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            let rhx = margin + 1;
            rHeaders.forEach((h, hi) => {
              doc.text(h, rhx, y + 4.5);
              rhx += rColW[hi];
            });
            y += rRowH;

            doc.setDrawColor(200, 210, 220);
            doc.setLineWidth(0.12);
            doc.rect(margin, y, usable, rRowH);
            let rlx = margin;
            for (let cIdx = 0; cIdx < 3; cIdx++) {
              rlx += rColW[cIdx];
              doc.line(rlx, y, rlx, y + rRowH);
            }

            const rCells = [
              minPct.toFixed(2) + '%',
              maxPct.toFixed(2) + '%',
              spread.toFixed(2) + '%',
              interpretation
            ];
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(...dark);
            let rcx = margin + 1;
            rCells.forEach((cell, ci) => {
              if (ci === 3) {
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...(allPass ? green : red));
              }
              const lines = doc.splitTextToSize(cell, rColW[ci] - 2);
              doc.text(lines, rcx, y + 4.5);
              rcx += rColW[ci];
            });
            y += rRowH + 4;
          }
        }

        dumpMeterAccuracy('new',
          '5E. METER ACCURACY – New & Never Used Before FDU',
          'Legal limit (Weights & Measures): 0.25% excess only (under-dispense not permitted). All values shown to 2 decimal places.');
        dumpMeterAccuracy('inService',
          '5F. METER ACCURACY – In-Service FDU',
          'Legal limit (Weights & Measures): +0.5% excess or −0.25% deficiency. All values shown to 2 decimal places.');
      }
      if (state.serviceTypes.includes('G')) dumpTableSection('6. REGULATORY COMPLIANCE', REG_ITEMS);

      // NC Log
      sectionBar('7. NON-CONFORMANCE & CORRECTIVE ACTION LOG');
      const ncs = collectNCs();
      if (!ncs.length) {
        bodyLine('No non-conformances recorded.', 8, false);
      } else {
        ncs.forEach((nc, i) => {
          bodyLine('CA#' + String(i + 1).padStart(3, '0') + ': ' + nc.desc + '  [' + nc.urgency + ']', 7.5, false);
        });
      }
      y += 2;

      // Notes
      sectionBar('8. TECHNICIAN CLOSING NOTES & RECOMMENDATIONS');
      bodyLine($('#tech-notes').value || '—', 8, false);
      y += 3;

      // Sign-off
      sectionBar('9. SIGN-OFF');
      bodyLine('TECHNICIAN DECLARATION', 8, true);
      bodyLine($('#tech-declaration').value || '', 7, false);
      bodyLine('Name: ' + ($('#sig-tech-name').value || '—') + '     Date: ' + ($('#sig-tech-date').value || '—'), 8, false);
      const techSig = getSigDataSafe('sig-tech');
      if (techSig) {
        checkPage(30);
        try { doc.addImage(techSig, 'JPEG', margin, y, 50, 20); y += 24; } catch (_) {}
      }
      y += 2;
      bodyLine('CLIENT / SITE REPRESENTATIVE CONFIRMATION', 8, true);
      bodyLine($('#client-declaration').value || '', 7, false);
      bodyLine('Name: ' + ($('#client-rep-name').value || '—') + '     Title: ' + ($('#client-rep-title').value || '—') + '     Date: ' + ($('#sig-client-date').value || '—'), 8, false);
      const clientSig = getSigDataSafe('sig-client');
      if (clientSig) {
        checkPage(30);
        try { doc.addImage(clientSig, 'JPEG', margin, y, 50, 20); y += 24; } catch (_) {}
      }
      if ($('#client-comments').value) bodyLine('Comments: ' + $('#client-comments').value, 7.5, false);

      // Photos on separate pages
      if (state.photos.length) {
        state.photos.forEach((p) => {
          if (!p.dataUrl.startsWith('data:image')) return;
          doc.addPage();
          drawPageFrame();
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(...navy);
          doc.text('Photographic Evidence – ' + p.name, margin, 18);
          try {
            doc.addImage(p.dataUrl, 'JPEG', margin, 24, usable, 0);
          } catch (e) {
            try { doc.addImage(p.dataUrl, 'PNG', margin, 24, usable, 0); } catch (_) {}
          }
        });
      }

      // Apply footer to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        drawFooter(i, pageCount);
      }

      const fileName = ($('#doc-number').value || 'Checklist') + '_' + ($('#site-name').value || 'Site').replace(/\s+/g, '_') + '.pdf';
      state.pdfBlob = doc.output('blob');
      state.pdfFileName = fileName;
      doc.save(fileName);
      $('#btn-share').style.display = 'inline-flex';
      $('#pdf-status').textContent = 'PDF generated: ' + fileName;
      $('#doc-status-display').textContent = 'COMPLETED';
      toast('PDF generated successfully', 'success');
    } catch (err) {
      console.error(err);
      toast('PDF generation failed: ' + err.message, 'error');
    } finally {
      hideOverlay();
    }
  }


  async function sharePDF() {
    if (!state.pdfBlob) {
      toast('Generate the PDF first', 'error');
      return;
    }
    const file = new File([state.pdfBlob], state.pdfFileName, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: state.pdfFileName,
          text: `Petroleum Pumping Equipment Checklist – ${$('#doc-number').value}`,
          files: [file]
        });
      } catch (e) {
        if (e.name !== 'AbortError') {
          const url = URL.createObjectURL(state.pdfBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = state.pdfFileName;
          a.click();
          toast('PDF downloaded. Attach it in WhatsApp, Email or any app.');
        }
      }
    } else {
      const url = URL.createObjectURL(state.pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = state.pdfFileName;
      a.click();
      toast('PDF downloaded. Attach it in WhatsApp, Email or any app.');
    }
  }

  function saveDraft() {
    const data = { version: 1, savedAt: new Date().toISOString(), fields: {}, liftType: state.equipType, serviceTypes: state.serviceTypes, photos: state.photos };
    $$('input, select, textarea').forEach(el => {
      if (el.id) data.fields[el.id] = el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value;
    });
    // Also store result selects
    data.results = {};
    $$('.result-sel').forEach(sel => { data.results[sel.dataset.id] = sel.value; });
    data.remarks = {};
    $$('.remarks-input').forEach(inp => { data.remarks[inp.dataset.remarks] = inp.value; });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = ($('#doc-number')?.value || 'Checklist') + '_draft.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Draft downloaded to your device', 'success');
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init() {
    $('#doc-date').value = todayISO();
    $('#visit-date').value = todayISO();
    $('#doc-number').value = generateDocNumber();
    $('#doc-number-display').textContent = $('#doc-number').value;
    $('#doc-date-display').textContent = todayISO();

    initSelectors();

    $('#btn-start').addEventListener('click', () => {
      updateServiceTypes();
      if (!validateStep(0)) return;
      computeActiveSteps();
      showStep(nextActiveStep());
    });

    $$('[data-confirm]').forEach(btn => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.confirm, 10);
        if (!validateStep(step)) return;
        showStep(nextActiveStep());
      });
    });

    $('#btn-prev').addEventListener('click', () => showStep(prevActiveStep()));
    $('#btn-next').addEventListener('click', () => {
      if (state.currentStep === 0) {
        $('#btn-start').click();
        return;
      }
      if (!validateStep(state.currentStep)) return;
      showStep(nextActiveStep());
    });

    $('#photo-input').addEventListener('change', e => addPhotos(e.target.files));
    $('#file-input').addEventListener('change', e => addPhotos(e.target.files));

    $$('[data-clear-sig]').forEach(btn => {
      btn.addEventListener('click', () => clearSig(btn.dataset.clearSig));
    });

    $('#btn-generate-pdf').addEventListener('click', generatePDF);
    $('#btn-share').addEventListener('click', sharePDF);
    $('#btn-save-draft').addEventListener('click', saveDraft);

    $('#btn-add-nc').addEventListener('click', () => {
      const existing = collectNCs();
      existing.push({ id: 'manual' + Date.now(), desc: '', urgency: 'Medium', wo: false, target: '' });
      renderNCLog(existing);
    });

    setTimeout(initSignatures, 400);
    showStep(0);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
