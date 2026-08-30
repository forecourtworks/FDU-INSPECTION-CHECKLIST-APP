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
    { id: 'jha1', step: '1. Preparation', hazard: 'Unexpected start-up / Energy release', control: 'LOTO applied. All power disconnected & tagged. Verify zero energy. Isolate product lines if required.' },
    { id: 'jha2', step: '2. Flammable Atmosphere', hazard: 'Fire / explosion from fuel vapour', control: 'No smoking/hot work. Gas monitor in use. Bonding/earthing confirmed. Fire extinguisher ready.' },
    { id: 'jha3', step: '3. Component Handling', hazard: 'Musculoskeletal / Crush injury', control: 'Lifting aids for heavy components (STP, meters). Team lift. Clear path of travel.' },
    { id: 'jha4', step: '4. Pressurised Systems', hazard: 'High-pressure fluid injection / Hose burst', control: 'Depressurise lines before disconnection. Wear goggles, face shield & chemical-resistant gloves.' },
    { id: 'jha5', step: '5. Electrical Work', hazard: 'Electrocution / Arc flash in hazardous area', control: 'Verify zero voltage. Use intrinsically safe tools where required. Check Ex ratings.' },
    { id: 'jha6', step: '6. Confined Space / Sump Entry', hazard: 'Asphyxiation / vapour exposure in STP or dispenser sump', control: 'Gas test before entry. Forced ventilation. Standby person. Harness if required.' },
    { id: 'jha7', step: '7. Product Spill / Environmental', hazard: 'Fuel spill to ground or drain', control: 'Spill kit ready. Containment in place. Immediate isolation valves known. Report any release.' }
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
    // Option B: proverActualL = true volume in the can
    // Error positive (+) = dispenser gave MORE fuel than it indicated → customer gains
    const errorL = proverActualL - dispenserIndicatedL;
    const errorMl = errorL * 1000;
    const errorPct = dispenserIndicatedL > 0 ? (errorL / dispenserIndicatedL) * 100 : 0;
    const perLitreMl = dispenserIndicatedL > 0 ? (errorMl / dispenserIndicatedL) : 0;

    let pass = false;
    let limitText = '';
    if (stage === 'new') {
      // 0.25% excess only (under-dispense not allowed)
      limitText = '0.25% excess only (under-dispense not permitted)';
      pass = errorPct >= 0 && errorPct <= 0.25;
    } else {
      // +0.5% / -0.25%
      limitText = '+0.5% excess or −0.25% deficiency';
      pass = errorPct >= -0.25 && errorPct <= 0.5;
    }

    let narrative = '';
    if (errorMl > 0.5) {
      narrative = `Customer is GAINING / Station is LOSING (${errorMl.toFixed(1)} ml extra delivered)`;
    } else if (errorMl < -0.5) {
      narrative = `Customer is LOSING / Station is GAINING (${Math.abs(errorMl).toFixed(1)} ml short delivered)`;
    } else {
      narrative = 'Negligible difference (within measurement uncertainty)';
    }

    return {
      errorMl: Math.round(errorMl * 10) / 10,
      errorPct: Math.round(errorPct * 1000) / 1000,
      perLitreMl: Math.round(perLitreMl * 100) / 100,
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
      arr.push({ capacity: 20, indicated: '', actual: '', flow: '' });
      renderCalRows(containerId, stage);
    });
  }

  function renderCalRows(containerId, stage) {
    const rowsCont = document.getElementById(containerId + '-rows');
    const summaryCont = document.getElementById(containerId + '-summary');
    if (!rowsCont) return;
    const arr = stage === 'new' ? calState.newFdu : calState.inService;
    if (arr.length === 0) {
      arr.push({ capacity: 20, indicated: '', actual: '', flow: '' });
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
            <label style="font-size:0.7rem;">Prover Can Capacity</label>
            <select class="cal-capacity" data-stage="${stage}" data-idx="${idx}">
              <option value="5" ${r.capacity == 5 ? 'selected' : ''}>5 L</option>
              <option value="10" ${r.capacity == 10 ? 'selected' : ''}>10 L</option>
              <option value="20" ${r.capacity == 20 ? 'selected' : ''}>20 L</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:4px;">
            <label style="font-size:0.7rem;">Approx. Flow Rate (L/min)</label>
            <input type="text" class="cal-flow" data-stage="${stage}" data-idx="${idx}" value="${r.flow || ''}" placeholder="e.g. 35" />
          </div>
        </div>
        <div class="row" style="margin-bottom:6px;">
          <div class="form-group" style="margin-bottom:4px;">
            <label style="font-size:0.7rem;">Dispenser Indicated Volume (L)</label>
            <input type="number" step="0.001" class="cal-indicated" data-stage="${stage}" data-idx="${idx}" value="${r.indicated}" placeholder="What the display showed" />
          </div>
          <div class="form-group" style="margin-bottom:4px;">
            <label style="font-size:0.7rem;">Prover Can Actual Reading (L)</label>
            <input type="number" step="0.001" class="cal-actual" data-stage="${stage}" data-idx="${idx}" value="${r.actual}" placeholder="True volume in the can" />
          </div>
        </div>`;
      if (calc) {
        const statusColour = calc.pass ? '#059669' : '#dc2626';
        html += `<div style="background:#f8fafc;border-left:4px solid ${statusColour};padding:8px 10px;border-radius:4px;font-size:0.8rem;">
          <div><b>Over/Under:</b> ${calc.errorMl > 0 ? '+' : ''}${calc.errorMl} ml &nbsp;|&nbsp; <b>%</b> ${calc.errorPct > 0 ? '+' : ''}${calc.errorPct}% &nbsp;|&nbsp; <b>Per Litre:</b> ${calc.perLitreMl > 0 ? '+' : ''}${calc.perLitreMl} ml/L</div>
          <div style="margin-top:3px;"><b>Status:</b> <span style="color:${statusColour};font-weight:700;">${calc.status}</span> against ${calc.limitText}</div>
          <div style="margin-top:3px;color:#4b5563;">${calc.narrative}</div>
        </div>`;
      }
      html += `</div>`;
    });
    rowsCont.innerHTML = html;

    // Bind events
    rowsCont.querySelectorAll('.cal-capacity, .cal-indicated, .cal-actual, .cal-flow').forEach(el => {
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
          Error range: ${min.toFixed(3)}% to ${max.toFixed(3)}% (spread ${spread.toFixed(3)}%)<br>
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

  // ── PDF Generation ─────────────────────────────────────────────────────
  async function generatePDF() {
    showOverlay('Generating PDF…');
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210;
      const margin = 12;
      const navy = [13, 38, 77];
      const grey = [100, 100, 100];
      let y = 14;

      function checkPage(need = 20) {
        if (y + need > 280) {
          doc.addPage();
          y = 14;
        }
      }

      function sectionHead(title) {
        checkPage(12);
        doc.setFillColor(...navy);
        doc.rect(margin, y, pageW - margin * 2, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(title, margin + 2, y + 5);
        y += 10;
        doc.setTextColor(0, 0, 0);
      }

      function bodyText(txt, size = 8) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(txt, pageW - margin * 2);
        checkPage(lines.length * 4 + 2);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 2;
      }

      // Header
      doc.setFillColor(...navy);
      doc.rect(0, 0, pageW, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('FORECOURT WORKS LTD', margin, 9);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Petroleum Pumping Equipment – Inspection & Compliance Checklist', margin, 15);
      doc.setFontSize(7);
      doc.text(`${$('#doc-number').value}  |  ${$('#doc-date').value}  |  ${state.equipType}`, margin, 20);
      y = 28;

      // General
      sectionHead('1. GENERAL INFORMATION');
      bodyText(`Client: ${$('#client-name').value}    Site: ${$('#site-name').value}`);
      bodyText(`Lift ID: ${$('#lift-id').value}    Type: ${state.equipType}    Capacity: ${$('#lift-capacity').value || '—'} kg`);
      bodyText(`Manufacturer: ${$('#lift-mfr').value || '—'}    Model/Serial: ${$('#lift-model').value || '—'}`);
      bodyText(`Visit Date: ${$('#visit-date').value}    Next PM: ${$('#next-pm').value || '—'}    Tech: ${$('#tech-lead').value}`);
      bodyText(`Service Type(s): ${state.serviceTypes.join(', ')}    Linked WO: ${$('#linked-wo').value || '—'}`);

      // JHA summary
      sectionHead('2. JOB SAFETY & HAZARD ANALYSIS');
      bodyText(`JHA Sign-off: ${$('#jha-sign-name').value || '—'}`);

      // Collect C/NC summary for active sections
      function dumpResults(title, items) {
        sectionHead(title);
        items.forEach(it => {
          const sel = document.querySelector(`.result-sel[data-id="${it.id}"]`);
          const remarks = document.querySelector(`.remarks-input[data-remarks="${it.id}"]`);
          const val = sel ? sel.value : '—';
          const rem = remarks ? remarks.value : '';
          bodyText(`${it.item || it.step}: ${val}${rem ? ' | ' + rem : ''}`, 7.5);
        });
      }

      if (state.serviceTypes.includes('A')) dumpResults('3. PRE-INSTALLATION SURVEY', PREINSTALL_ITEMS);
      if (state.serviceTypes.includes('B')) dumpResults('4. INSTALLATION CHECKLIST', INSTALL_ITEMS);
      if (state.serviceTypes.includes('C') || state.serviceTypes.includes('D')) {
        dumpResults('5A. STRUCTURAL', PM_STRUCTURAL);
        dumpResults('5B. MECHANICAL', PM_MECHANICAL);
        dumpResults('5C. ELECTRICAL', PM_ELECTRICAL);
        dumpResults('5D. HYDRAULIC / FLOW PERFORMANCE', PM_HYDRAULIC);

      // Meter Accuracy – New FDU
      sectionHead('5E. METER ACCURACY – New & Never Used Before FDU');
      bodyText('Legal limit: 0.25% excess only (under-dispense not permitted).');
      if (calState.newFdu.length === 0 || calState.newFdu.every(r => !r.indicated || !r.actual)) {
        bodyText('No readings recorded.');
      } else {
        calState.newFdu.forEach((r, i) => {
          if (!r.indicated || !r.actual) return;
          const c = calcMeterError(parseFloat(r.indicated), parseFloat(r.actual), r.capacity, 'new');
          bodyText(`Reading #${i+1}: Indicated ${r.indicated} L  |  Prover ${r.actual} L  |  Flow ${r.flow || '—'} L/min`);
          bodyText(`  Error: ${c.errorMl > 0 ? '+' : ''}${c.errorMl} ml  (${c.errorPct > 0 ? '+' : ''}${c.errorPct}%)  |  ${c.perLitreMl > 0 ? '+' : ''}${c.perLitreMl} ml/L  |  ${c.status}`);
          bodyText(`  ${c.narrative}`);
        });
      }

      // Meter Accuracy – In-Service
      sectionHead('5F. METER ACCURACY – In-Service FDU');
      bodyText('Legal limit: +0.5% excess or −0.25% deficiency.');
      if (calState.inService.length === 0 || calState.inService.every(r => !r.indicated || !r.actual)) {
        bodyText('No readings recorded.');
      } else {
        calState.inService.forEach((r, i) => {
          if (!r.indicated || !r.actual) return;
          const c = calcMeterError(parseFloat(r.indicated), parseFloat(r.actual), r.capacity, 'inService');
          bodyText(`Reading #${i+1}: Indicated ${r.indicated} L  |  Prover ${r.actual} L  |  Flow ${r.flow || '—'} L/min`);
          bodyText(`  Error: ${c.errorMl > 0 ? '+' : ''}${c.errorMl} ml  (${c.errorPct > 0 ? '+' : ''}${c.errorPct}%)  |  ${c.perLitreMl > 0 ? '+' : ''}${c.perLitreMl} ml/L  |  ${c.status}`);
          bodyText(`  ${c.narrative}`);
        });
      }
      }
      if (state.serviceTypes.includes('G')) dumpResults('6. REGULATORY COMPLIANCE', REG_ITEMS);

      // NC Log
      sectionHead('7. NON-CONFORMANCE & CORRECTIVE ACTION LOG');
      const ncs = collectNCs();
      if (!ncs.length) bodyText('No non-conformances recorded.');
      else {
        ncs.forEach((nc, i) => {
          bodyText(`CA#${String(i + 1).padStart(3, '0')}: ${nc.desc}  [${nc.urgency}]`);
        });
      }

      // Notes
      sectionHead('8. TECHNICIAN NOTES');
      bodyText($('#tech-notes').value || '—');

      // Sign-off
      sectionHead('9. SIGN-OFF');
      bodyText('TECHNICIAN: ' + ($('#tech-declaration').value || ''));
      bodyText(`Name: ${$('#sig-tech-name').value || '—'}    Date: ${$('#sig-tech-date').value || '—'}`);
      const techSig = getSigDataSafe('sig-tech');
      if (techSig) {
        checkPage(28);
        try { doc.addImage(techSig, 'JPEG', margin, y, 55, 22); } catch (_) {}
        y += 26;
      }
      bodyText('CLIENT: ' + ($('#client-declaration').value || ''));
      bodyText(`Name: ${$('#client-rep-name').value || '—'}    Title: ${$('#client-rep-title').value || '—'}    Date: ${$('#sig-client-date').value || '—'}`);
      const clientSig = getSigDataSafe('sig-client');
      if (clientSig) {
        checkPage(28);
        try { doc.addImage(clientSig, 'JPEG', margin, y, 55, 22); } catch (_) {}
        y += 26;
      }
      if ($('#client-comments').value) bodyText('Comments: ' + $('#client-comments').value);

      // Photos
      if (state.photos.length) {
        state.photos.forEach((p, i) => {
          if (!p.dataUrl.startsWith('data:image')) return;
          doc.addPage();
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(...navy);
          doc.text(`Photographic Evidence – ${p.name}`, margin, 15);
          try {
            doc.addImage(p.dataUrl, 'JPEG', margin, 20, pageW - margin * 2, 0);
          } catch (e) {
            try { doc.addImage(p.dataUrl, 'PNG', margin, 20, pageW - margin * 2, 0); } catch (_) {}
          }
        });
      }

      // Footer on every page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 282, pageW, 18, 'F');
        doc.setDrawColor(...navy);
        doc.setLineWidth(0.3);
        doc.line(margin, 283, pageW - margin, 283);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...navy);
        doc.text('Petroleum Pumping Equipment Inspection & Compliance Checklist  |  Complementary to Work Order', margin, 287);
        doc.setTextColor(...grey);
        doc.setFontSize(6);
        doc.text(`CONTROLLED DOCUMENT  |  ${$('#doc-number').value}  |  Rev 2.0  |  CONFIDENTIAL`, margin, 292);
        doc.text(`Page ${i} of ${pageCount}`, pageW - margin, 292, { align: 'right' });
      }

      const fileName = `${$('#doc-number').value}_${($('#site-name').value || 'Checklist').replace(/\s+/g, '_')}.pdf`;
      state.pdfBlob = doc.output('blob');
      state.pdfFileName = fileName;
      doc.save(fileName);
      $('#btn-share').style.display = 'inline-flex';
      $('#pdf-status').textContent = `PDF generated: ${fileName}`;
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
