/**
 * FORECOURT WORKS LTD - Pumps & Dispensers Inspection Checklist App
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
    serviceTypes: [],
    sigFiles: { tech: null, client: null, jhaTech: null, jhaSupervisor: null },
    logoMarkDataUrl: null
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
    { id: 'pi2', item: 'Power supply - voltage & phases', criteria: 'Correct voltage (230/400 V), phase (1ph/3ph) and frequency per motor/nameplate. Dedicated circuit.' },
    { id: 'pi3', item: 'Power supply - capacity & protection', criteria: 'Correct breaker rating, earth-leakage / residual current protection available and correctly sized.' },
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
    { id: 'in10', item: 'Functional test - no load / dry run checks', criteria: 'Controls respond correctly. No unusual noise or vibration. E-stop cuts power instantly.' },
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
    { id: 'pm5', item: 'Hose, swivel, breakaway, nozzle', criteria: 'Hose not touching ground at rest (or within allowed length). No cracks, blisters. Breakaway & nozzle within "remove by" date. Auto shut-off functional.' },
    { id: 'pm6', item: 'Hose retriever / retractor', criteria: 'Retracts fully and smoothly. No broken springs or cables.' },
    { id: 'pm7', item: 'STP impeller / check valve / LLD', criteria: 'Flow rate at nozzle within expected range. Line leak detector (mechanical or electronic) passes required test rate.' },
    { id: 'pm8', item: 'Bulk pump mechanical condition', criteria: 'Gear/vane/centrifugal/diaphragm elements free of excessive wear. No unusual noise, vibration or seal leakage. Hand pumps: free rotation, no binding.' }
  ];

  const PM_ELECTRICAL = [
    { id: 'pe1', item: 'Grounding / bonding continuity', criteria: 'Continuity chassis/pipework to earth satisfactory. Bonding leads intact on hoses where required.' },
    { id: 'pe2', item: 'Motor insulation (Megger)', criteria: 'Insulation resistance > 1 Mohm (or OEM min). No signs of overheating or discoloration.' },
    { id: 'pe3', item: 'Supply voltage', criteria: 'Voltage at motor terminals within +/-10 % of nameplate. Phases balanced (3ph).' },
    { id: 'pe4', item: 'Motor running current', criteria: 'Current <= FLA under load. Balanced across phases. No excessive inrush.' },
    { id: 'pe5', item: 'Control circuit, pulser, contactors', criteria: 'Contactors clean, no pitting. Control voltage correct. Pulser/encoder clean and functional.' },
    { id: 'pe6', item: 'Emergency Stop', criteria: 'E-Stop clearly visible, accessible, hard-wired, cuts power instantly. Tested and recorded.' },
    { id: 'pe7', item: 'Junction boxes & cable glands', criteria: 'Covers present, not corroded. Intrinsically safe wiring and glands intact and correctly rated.' },
    { id: 'pe8', item: 'Display / price board / totalisers', criteria: 'Displays legible, correct product/price. Totalisers advancing correctly. No error codes present.' }
  ];

  const PM_HYDRAULIC = [
    { id: 'ph1', item: 'System pressure / flow performance', criteria: 'Delivery flow rate within OEM/expected range for product and nozzle type. No excessive pressure drop.' },
    { id: 'ph2', item: 'Leak-down / holding integrity', criteria: 'No visible product drop or seepage at joints, seals, meter or pump body under static pressure.' },
    { id: 'ph5', item: 'Hose dilation check', criteria: 'Dilation error of delivery hose <= 50 ml under normal conditions of use.' },
    { id: 'ph6', item: 'Seals & adjustable parts', criteria: 'All adjustable parts affecting quantity delivery sealed. Weights & Measures verification seal present and intact.' },
    { id: 'ph7', item: 'STP pressure (no-flow) & flow at nozzle', criteria: 'No-flow pressure within baseline. Flow at nozzle 5-10 GPM (or OEM) under normal conditions.' },
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
  // Over-registration: Indicated > True Proven (display high; customer short)
  // Under-registration (deficiency): Indicated < True Proven (display low)
  const calState = {
    newFdu: [],
    inService: []
  };

  function countyDisplayForVerdict() {
    const name = ($('#county-name') && $('#county-name').value) ? $('#county-name').value.trim() : '';
    if (!name) return '________';
    // First letter of county name and letter C in "County" style emphasis via caps on name
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().replace(/\bc\b/gi, 'C');
  }

  function calcMeterError(indicatedL, trueProvenL, capacityL, stage) {
    const ind = Number(Number(indicatedL).toFixed(2));
    const trueV = Number(Number(trueProvenL).toFixed(2));
    // Variance (L) = Indicated - True Proven
    const varianceL = Number((ind - trueV).toFixed(2));
    // Relative error vs true proven (%)
    const relVsTrue = trueV > 0 ? Number((((ind - trueV) / trueV) * 100).toFixed(2)) : 0;
    // Relative indication error vs meter reading (%) - limit basis
    const relVsInd = ind > 0 ? Number((((ind - trueV) / ind) * 100).toFixed(2)) : 0;

    let pass = false;
    let limitText = '';
    if (stage === 'new') {
      // Verification: 0% to +0.25% only; no negative variance permitted
      limitText = '0% to +0.25% (no negative variance)';
      pass = varianceL >= 0 && relVsInd >= 0 && relVsInd <= 0.25;
    } else {
      // Re-verification: -0.25% to +0.50%
      limitText = '-0.25% to +0.50%';
      pass = relVsInd >= -0.25 && relVsInd <= 0.50;
    }

    let regType = 'NEGLIGIBLE';
    if (varianceL > 0.001) regType = 'OVER-REGISTRATION';
    else if (varianceL < -0.001) regType = 'UNDER-REGISTRATION';

    const narrative = regType === 'OVER-REGISTRATION'
      ? 'Over-registration: pump meter reads higher than true proven volume (customer receives less than displayed).'
      : regType === 'UNDER-REGISTRATION'
        ? 'Under-registration (deficiency): pump meter reads lower than true proven volume (station delivers more than displayed).'
        : 'Negligible difference within measurement uncertainty.';

    const county = countyDisplayForVerdict();
    let verdict = '';
    if (pass) {
      verdict = 'VERDICT: Meter PASSES verification. Meter fit for commercial use after authorization and sealing by the '
        + county + ' Department of Weights and Measures before commencing commercial use.';
    } else {
      verdict = 'VERDICT: Meter FAILS verification. Meter re-adjustment required. If the meter passes the 2nd verification, authorization and sealing by the '
        + county + ' Department of Weights and Measures before commencing commercial use.';
    }

    return {
      varianceL,
      relVsTrue,
      relVsInd,
      errorPct: relVsInd, // alias for legacy PDF code
      errorMl: Number((varianceL * 1000).toFixed(2)),
      perLitreMl: ind > 0 ? Number(((varianceL * 1000) / ind).toFixed(2)) : 0,
      pass,
      limitText,
      narrative,
      regType,
      verdict,
      status: pass ? 'PASS' : 'FAIL'
    };
  }

  function renderCalSection(containerId, stage, title, colour) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    const bg = colour === 'new' ? '#ecfdf5' : '#fff7ed';
    const border = colour === 'new' ? '#059669' : '#d97706';
    const headBg = colour === 'new' ? '#059669' : '#d97706';
    const typeLabel = stage === 'new' ? 'Verification (New Meters - 1st time testing)' : 'Re-verification (In-service Meters - Retesting)';

    cont.innerHTML = `<div class="cal-block" style="border:2px solid ${border};border-radius:10px;margin-bottom:16px;overflow:hidden;">
      <div style="background:${headBg};color:#fff;padding:10px 14px;font-weight:700;font-size:0.95rem;">${title}</div>
      <div style="background:${bg};padding:12px;">
        <p style="font-size:0.8rem;margin-bottom:8px;color:#374151;"><b>Meter type:</b> ${typeLabel}</p>
        <p class="formula-note">Variance (L) = Indicated - True Proven</p>
        <p class="formula-note">Relative Error vs True (%) = (Indicated - True Proven) / True Proven x 100</p>
        <p class="formula-note">Relative Indication Error vs Meter (%) = (Indicated - True Proven) / Indicated x 100  [limit basis]</p>
        <div id="${containerId}-rows"></div>
        <button type="button" class="btn btn-outline btn-sm" data-add-cal="${stage}" style="margin-top:8px;">+ Add Reading</button>
        <div id="${containerId}-summary" style="margin-top:12px;font-size:0.85rem;"></div>
      </div>
    </div>`;
    renderCalRows(containerId, stage);
    cont.querySelector(`[data-add-cal="${stage}"]`).addEventListener('click', () => {
      const arr = stage === 'new' ? calState.newFdu : calState.inService;
      arr.push({ capacity: 20, indicated: '20.00', actual: '', flow: '', nozzleId: '', meterType: stage === 'new' ? 'verification' : 'reverification' });
      renderCalRows(containerId, stage);
    });
  }

  function renderCalRows(containerId, stage) {
    const rowsCont = document.getElementById(containerId + '-rows');
    const summaryCont = document.getElementById(containerId + '-summary');
    if (!rowsCont) return;
    const arr = stage === 'new' ? calState.newFdu : calState.inService;
    if (arr.length === 0) {
      arr.push({ capacity: 20, indicated: '20.00', actual: '', flow: '', nozzleId: '', meterType: stage === 'new' ? 'verification' : 'reverification' });
    }
    let html = '';
    arr.forEach((r, idx) => {
      if (r.indicated === '' || r.indicated == null) r.indicated = Number(r.capacity || 20).toFixed(2);
      const calc = (r.indicated !== '' && r.actual !== '')
        ? calcMeterError(parseFloat(r.indicated), parseFloat(r.actual), r.capacity, stage)
        : null;
      html += `<div class="meter-card cal-row" data-idx="${idx}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="font-size:0.85rem;">Reading #${idx + 1}</strong>
          ${arr.length > 1 ? `<button type="button" class="btn btn-outline btn-sm" data-remove-cal="${stage}" data-idx="${idx}" style="padding:2px 8px;font-size:0.75rem;">Remove</button>` : ''}
        </div>
        <div class="form-group" style="margin-bottom:6px;">
          <label style="font-size:0.7rem;">Nozzle / Hose ID</label>
          <input type="text" class="cal-nozzle auto-caps" data-stage="${stage}" data-idx="${idx}" value="${r.nozzleId || ''}" placeholder="e.g. PMS-II" />
        </div>
        <div class="form-group" style="margin-bottom:6px;">
          <label style="font-size:0.7rem;">Prover Can Size (L) - select one</label>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            ${[5,10,20].map(v => `<label class="check-item" style="padding:4px 8px;"><input type="radio" name="cal-cap-${stage}-${idx}" class="cal-capacity-radio" data-stage="${stage}" data-idx="${idx}" value="${v}" ${Number(r.capacity)===v?'checked':''}> ${v}.00 L</label>`).join('')}
          </div>
        </div>
        <div class="row">
          <div class="form-group" style="margin-bottom:4px;">
            <label style="font-size:0.7rem;">Indicated Pump Meter Reading (L)</label>
            <input type="text" inputmode="decimal" class="cal-indicated" data-stage="${stage}" data-idx="${idx}" value="${r.indicated}" readonly style="background:#f3f4f6;" />
            <div class="help">Auto-filled to match prover can size</div>
          </div>
          <div class="form-group" style="margin-bottom:4px;">
            <label style="font-size:0.7rem;">True Proven Volume Reading (L)</label>
            <input type="text" inputmode="decimal" class="cal-actual" data-stage="${stage}" data-idx="${idx}" value="${r.actual}" placeholder="e.g. 19.95" />
          </div>
        </div>
        <div class="sig-file-row">
          <label class="btn btn-outline btn-sm" style="cursor:pointer;">📷 Photo of reading
            <input type="file" class="cal-photo" data-stage="${stage}" data-idx="${idx}" accept="image/*" hidden />
          </label>
          <span style="font-size:0.75rem;color:#6b7280;">Saved to Photographic Evidence</span>
        </div>`;
      html += `<div id="cal-result-${stage}-${idx}"></div></div>`;

    });
    rowsCont.innerHTML = html;


    rowsCont.querySelectorAll('.cal-capacity-radio').forEach(el => {
      el.addEventListener('change', () => {
        const stage = el.dataset.stage;
        const idx = parseInt(el.dataset.idx, 10);
        const arr = stage === 'new' ? calState.newFdu : calState.inService;
        if (!arr[idx]) return;
        arr[idx].capacity = parseInt(el.value, 10);
        arr[idx].indicated = Number(arr[idx].capacity).toFixed(2);
        renderCalRows(containerId, stage);
      });
    });
    rowsCont.querySelectorAll('.cal-actual, .cal-nozzle').forEach(el => {
      el.addEventListener('input', () => updateCalReading(el));
      el.addEventListener('change', () => updateCalReading(el));
    });
    arr.forEach((_, idx) => refreshCalRowResult(stage, idx));
    rowsCont.querySelectorAll('.cal-photo').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files && files.length) addPhotos(files);
      });
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

    if (summaryCont) {
      const valid = arr.filter(r => r.indicated !== '' && r.actual !== '').map(r =>
        calcMeterError(parseFloat(r.indicated), parseFloat(r.actual), r.capacity, stage)
      );
      if (valid.length >= 1) {
        const fails = valid.filter(v => !v.pass).length;
        summaryCont.innerHTML = `<div style="background:#f1f5f9;padding:8px 10px;border-radius:6px;">
          <b>${valid.length} reading(s):</b> ${valid.length - fails} PASS, ${fails} FAIL
          ${fails ? ' - FAIL readings will appear in the Non-Conformance log.' : ''}
        </div>`;
      } else summaryCont.innerHTML = '';
    }
  }

  function updateCalReading(el) {
    const stage = el.dataset.stage;
    const idx = parseInt(el.dataset.idx, 10);
    const arr = stage === 'new' ? calState.newFdu : calState.inService;
    if (!arr[idx]) return;
    if (el.classList.contains('cal-actual')) arr[idx].actual = el.value;
    if (el.classList.contains('cal-nozzle')) arr[idx].nozzleId = el.value; // do not force case on every key
    if (el.classList.contains('cal-flow')) arr[idx].flow = el.value;
    // Update live results for THIS row only — no full re-render (avoids focus loss & scroll jump)
    refreshCalRowResult(stage, idx);
  }

  function refreshCalRowResult(stage, idx) {
    const arr = stage === 'new' ? calState.newFdu : calState.inService;
    const r = arr[idx];
    if (!r) return;
    const resultEl = document.getElementById('cal-result-' + stage + '-' + idx);
    if (!resultEl) return;
    if (r.indicated === '' || r.actual === '' || isNaN(parseFloat(r.actual))) {
      resultEl.innerHTML = '';
      return;
    }
    const calc = calcMeterError(parseFloat(r.indicated), parseFloat(r.actual), r.capacity, stage);
    const statusColour = calc.pass ? '#1a7346' : '#b91c1c';
    resultEl.innerHTML = `<div style="margin-top:8px;font-size:0.82rem;">
      <div><b>Variance (L):</b> ${calc.varianceL >= 0 ? '+' : ''}${calc.varianceL.toFixed(2)} &nbsp; (${calc.regType})</div>
      <div class="formula-note">Variance = Indicated - True Proven</div>
      <div><b>Relative Error vs True (%):</b> ${calc.relVsTrue >= 0 ? '+' : ''}${calc.relVsTrue.toFixed(2)}%</div>
      <div><b>Relative Indication Error vs Meter (%):</b> ${calc.relVsInd >= 0 ? '+' : ''}${calc.relVsInd.toFixed(2)}%</div>
      <div style="margin-top:4px;"><b>Status:</b> <span style="color:${statusColour};font-weight:700;font-family:Arial,sans-serif;font-size:12pt;">${calc.status}</span></div>
      <div style="margin-top:4px;color:#4b5563;">${calc.narrative}</div>
      <div class="verdict-box"><span class="${calc.pass ? 'pass' : 'fail'}">${calc.pass ? 'PASS' : 'FAIL'}</span> — ${calc.verdict.replace(/^VERDICT:\s*Meter (PASSES|FAILS) verification\.\s*/, '')}</div>
    </div>`;
    // Update summary without touching inputs
    const containerId = stage === 'new' ? 'cal-new-container' : 'cal-inservice-container';
    const summaryCont = document.getElementById(containerId + '-summary');
    if (summaryCont) {
      const valid = arr.filter(x => x.indicated !== '' && x.actual !== '').map(x =>
        calcMeterError(parseFloat(x.indicated), parseFloat(x.actual), x.capacity, stage)
      );
      if (valid.length >= 1) {
        const fails = valid.filter(v => !v.pass).length;
        summaryCont.innerHTML = `<div style="background:#f1f5f9;padding:8px 10px;border-radius:6px;">
          <b>${valid.length} reading(s):</b> ${valid.length - fails} PASS, ${fails} FAIL
          ${fails ? ' — FAIL readings will appear in the Non-Conformance log.' : ''}
        </div>`;
      } else summaryCont.innerHTML = '';
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  // Preload full FORECOURT-SWL mark for PDF (never use FW/FSW text)
  function preloadLogoMark() {
    return new Promise((resolve) => {
      if (state.logoMarkDataUrl) { resolve(state.logoMarkDataUrl); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth || img.width;
          c.height = img.naturalHeight || img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          state.logoMarkDataUrl = c.toDataURL('image/png');
        } catch (e) {
          state.logoMarkDataUrl = null;
        }
        resolve(state.logoMarkDataUrl);
      };
      img.onerror = () => { state.logoMarkDataUrl = null; resolve(null); };
      img.src = 'forecourt-logo-mark.png';
    });
  }


  // ── Embedded fonts: Roboto, Lato, Inter (Helvetica only as fallback) ──
  const FONT_FILES = {
    Roboto: { normal: 'fonts/Roboto-Regular.ttf', bold: 'fonts/Roboto-Bold.ttf' },
    Lato: { normal: 'fonts/Lato-Regular.ttf', bold: 'fonts/Lato-Bold.ttf' },
    Inter: { normal: 'fonts/Inter-Regular.ttf', bold: 'fonts/Inter-Regular.ttf' }
  };
  let fontsReady = false;
  let activePdfFont = 'helvetica'; // fallback until embedded

  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function registerPdfFonts(doc) {
    if (fontsReady && activePdfFont !== 'helvetica') {
      try { doc.setFont(activePdfFont, 'normal'); } catch (_) {}
      return activePdfFont;
    }
    const order = ['Roboto', 'Lato', 'Inter'];
    for (const family of order) {
      try {
        const paths = FONT_FILES[family];
        const resN = await fetch(paths.normal);
        if (!resN.ok) continue;
        const b64n = arrayBufferToBase64(await resN.arrayBuffer());
        const fileN = family + '-Regular.ttf';
        doc.addFileToVFS(fileN, b64n);
        doc.addFont(fileN, family, 'normal');
        try {
          const resB = await fetch(paths.bold);
          if (resB.ok) {
            const b64b = arrayBufferToBase64(await resB.arrayBuffer());
            const fileB = family + '-Bold.ttf';
            doc.addFileToVFS(fileB, b64b);
            doc.addFont(fileB, family, 'bold');
          } else {
            doc.addFont(fileN, family, 'bold');
          }
        } catch (_) {
          doc.addFont(fileN, family, 'bold');
        }
        activePdfFont = family;
        fontsReady = true;
        doc.setFont(family, 'normal');
        return family;
      } catch (e) {
        console.warn('Font load failed', family, e);
      }
    }
    activePdfFont = 'helvetica';
    return 'helvetica';
  }

  function setAppFont(doc, style, size) {
    const st = style === 'bold' ? 'bold' : (style === 'italic' ? 'italic' : 'normal');
    try {
      if (activePdfFont !== 'helvetica') {
        // Embedded TTF may not have italic — map italic to normal
        const use = (st === 'italic') ? 'normal' : st;
        doc.setFont(activePdfFont, use);
      } else {
        doc.setFont('helvetica', st === 'italic' ? 'italic' : st);
      }
    } catch (_) {
      try { doc.setFont('helvetica', st === 'bold' ? 'bold' : 'normal'); } catch (__) {}
    }
    if (size) doc.setFontSize(size);
  }

  /** Draw text clipped to column width (prevents spill into next column) */
  function textInCol(doc, text, x, y, maxW, opts) {
    const s = String(text == null ? '' : text);
    const lines = doc.splitTextToSize(s, Math.max(2, maxW - 1));
    doc.text(lines[0] || '', x, y, opts || {});
    return lines;
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function generateDocNumber() {
    const y = new Date().getFullYear();
    return 'INSP/' + y + '/001';
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

  // ── County register (hierarchical order, name -> 3-digit code) ─────────
  // Saved for future reference / reuse
  const COUNTY_REGISTER = [
    { name: 'MOMBASA', code: '001' },
    { name: 'KWALE', code: '002' },
    { name: 'KILIFI', code: '003' },
    { name: 'RIVER', code: '004' },
    { name: 'LAMU', code: '005' },
    { name: 'TAVETA', code: '006' },
    { name: 'GARISSA', code: '007' },
    { name: 'WAJIR', code: '008' },
    { name: 'MANDERA', code: '009' },
    { name: 'MARSABIT', code: '010' },
    { name: 'ISIOLO', code: '011' },
    { name: 'MERU', code: '012' },
    { name: 'NITHI', code: '013' },
    { name: 'EMBU', code: '014' },
    { name: 'KITUI', code: '015' },
    { name: 'MACHAKOS', code: '016' },
    { name: 'MAKUENI', code: '017' },
    { name: 'NYANDARUA', code: '018' },
    { name: 'NYERI', code: '019' },
    { name: 'KIRINYAGA', code: '020' },
    { name: 'MURANGA', code: '021' },
    { name: 'KIAMBU', code: '022' },
    { name: 'TURKANA', code: '023' },
    { name: 'POKOT', code: '024' },
    { name: 'SAMBURU', code: '025' },
    { name: 'NZOIA', code: '026' },
    { name: 'GISHU', code: '027' },
    { name: 'MARAKWET', code: '028' },
    { name: 'NANDI', code: '029' },
    { name: 'BARINGO', code: '030' },
    { name: 'LAIKIPIA', code: '031' },
    { name: 'NAKURU', code: '032' },
    { name: 'NAROK', code: '033' },
    { name: 'KAJIADO', code: '034' },
    { name: 'KERICHO', code: '035' },
    { name: 'BOMET', code: '036' },
    { name: 'KAKAMEGA', code: '037' },
    { name: 'VIHIGA', code: '038' },
    { name: 'BUNGOMA', code: '039' },
    { name: 'BUSIA', code: '040' },
    { name: 'SIAYA', code: '041' },
    { name: 'KISUMU', code: '042' },
    { name: 'BAY', code: '043' },
    { name: 'MIGORI', code: '044' },
    { name: 'KISII', code: '045' },
    { name: 'NYAMIRA', code: '046' },
    { name: 'NAIROBI CITY', code: '047' }
  ];

  // Persist register for future sessions
  try {
    localStorage.setItem('fdu_county_register', JSON.stringify(COUNTY_REGISTER));
  } catch (_) {}

  function formatDateDDMonYYYY(isoOrDate) {
    if (!isoOrDate) return '-';
    let d;
    if (typeof isoOrDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(isoOrDate)) {
      d = new Date(isoOrDate + 'T00:00:00');
    } else if (isoOrDate instanceof Date) {
      d = isoOrDate;
    } else {
      d = new Date(isoOrDate);
    }
    if (isNaN(d.getTime())) return String(isoOrDate);
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return String(d.getDate()).padStart(2, '0') + '-' + months[d.getMonth()] + '-' + d.getFullYear();
  }
  // Aliases so PDF path never throws ReferenceError on casing variants
  const formatDateDDMONYYYY = formatDateDDMonYYYY;
  window.formatDateDDMonYYYY = formatDateDDMonYYYY;
  window.formatDateDDMONYYYY = formatDateDDMonYYYY;

  function threeLetters(str) {
    const cleaned = (str || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return (cleaned + 'XXX').slice(0, 3);
  }

  function updateUniqueAssetId() {
    const client = $('#client-name') ? $('#client-name').value : '';
    const site = $('#site-name') ? $('#site-name').value : '';
    const code = $('#county-code') ? $('#county-code').value : '';
    if (!client && !site && !code) return;
    const cli = threeLetters(client);
    const sit = threeLetters(site);
    const cty = code || '000';
    const autoId = cli + '/' + cty + '/' + sit + '/DISP#001';
    const liftId = $('#lift-id');
    if (!liftId) return;
    // Only auto-fill if empty or still matches previous auto pattern
    const wasAuto = !liftId.dataset.manual || liftId.dataset.manual === '0';
    if (wasAuto || !liftId.value.trim()) {
      liftId.value = autoId;
      liftId.dataset.manual = '0';
    }
  }

  // ── Lift type / service type UI ────────────────────────────────────────
  function initSelectors() {
    // Equipment type is now a <select>
    const liftSel = $('#lift-type');
    if (liftSel) {
      liftSel.addEventListener('change', () => {
        state.equipType = liftSel.value;
      });
    }

    // Populate Year of Installation dropdown (1990 -> current year + 1)
    const yearSel = $('#lift-year');
    if (yearSel && yearSel.options.length <= 1) {
      const currentYear = new Date().getFullYear();
      for (let y = currentYear + 1; y >= 1990; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = String(y);
        yearSel.appendChild(opt);
      }
    }

    // Populate County dropdown from register
    const countySel = $('#county-name');
    if (countySel) {
      COUNTY_REGISTER.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name + ' (' + c.code + ')';
        opt.dataset.code = c.code;
        countySel.appendChild(opt);
      });

      countySel.addEventListener('change', () => {
        const selected = countySel.options[countySel.selectedIndex];
        const code = selected && selected.dataset.code ? selected.dataset.code : '';
        if ($('#county-code')) $('#county-code').value = code;
        // Collapse list after selection
        countySel.size = 1;
        updateUniqueAssetId();
      });
    }

    // County search / filter: as user types letters, filter options
    const countySearch = $('#county-search');
    if (countySearch && countySel) {
      countySearch.addEventListener('input', () => {
        const q = countySearch.value.trim().toUpperCase();
        let matchCount = 0;
        Array.from(countySel.options).forEach((opt, idx) => {
          if (idx === 0) { // placeholder
            opt.hidden = !!q;
            return;
          }
          const match = !q || opt.value.indexOf(q) === 0 || opt.value.includes(q);
          opt.hidden = !match;
          if (match) matchCount++;
        });
        // Expand list while filtering
        countySel.size = Math.min(Math.max(matchCount + 1, 4), 8);
      });
      countySearch.addEventListener('focus', () => {
        countySel.size = 6;
      });
      countySearch.addEventListener('blur', () => {
        setTimeout(() => { countySel.size = 1; }, 200);
      });
    }

    // Service type chips
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

    // Auto-capitalise text inputs/textareas only (never <select> - uppercasing
    // the value would break option matching and blank the displayed selection)
    $$('.auto-caps').forEach(el => {
      if (el.tagName === 'SELECT') return;
      el.addEventListener('input', () => {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        el.value = el.value.toUpperCase();
        if (typeof start === 'number') {
          try { el.setSelectionRange(start, end); } catch (_) {}
        }
      });
    });

    // Unique Asset ID auto-build from Client / County / Site
    ['client-name', 'site-name'].forEach(id => {
      const el = $('#' + id);
      if (el) {
        el.addEventListener('input', updateUniqueAssetId);
        el.addEventListener('change', updateUniqueAssetId);
      }
    });
    // Mark manual edits so we don't overwrite user changes
    const liftId = $('#lift-id');
    if (liftId) {
      liftId.addEventListener('input', () => {
        liftId.dataset.manual = '1';
      });
    }

    // Date display helper (DD-MON-YYYY)
    const dateInput = $('#doc-date');
    if (dateInput) {
      dateInput.addEventListener('change', () => {
        const hint = $('#date-display-hint');
        if (hint && dateInput.value) {
          hint.textContent = 'Selected: ' + formatDateDDMonYYYY(dateInput.value);
        }
      });
      // Show formatted value on load if already set
      if (dateInput.value && $('#date-display-hint')) {
        $('#date-display-hint').textContent = 'Selected: ' + formatDateDDMonYYYY(dateInput.value);
      }
    }

    // Validity Period -> enable/disable Valid Until date
    const validitySel = $('#warranty-validity');
    const validUntil = $('#valid-until');
    const validUntilHint = $('#valid-until-hint');
    function syncValidUntilState() {
      if (!validitySel || !validUntil) return;
      const stillValid = validitySel.value === 'STILL VALID';
      validUntil.disabled = !stillValid;
      if (!stillValid) {
        validUntil.value = '';
        if (validUntilHint) validUntilHint.textContent = 'Disabled when Expired (or not selected)';
      } else {
        if (validUntilHint) {
          validUntilHint.textContent = validUntil.value
            ? 'Selected: ' + formatDateDDMonYYYY(validUntil.value)
            : 'Format: DD-MON-YYYY (enabled when Still Valid)';
        }
      }
    }
    if (validitySel) {
      validitySel.addEventListener('change', syncValidUntilState);
      syncValidUntilState();
    }
    if (validUntil) {
      validUntil.addEventListener('change', () => {
        if (validUntilHint && validUntil.value) {
          validUntilHint.textContent = 'Selected: ' + formatDateDDMonYYYY(validUntil.value);
        }
      });
    }
  }

  function updateServiceTypes() {
    state.serviceTypes = Array.from($$('input[name="service-type"]:checked')).map(el => el.value);
  }

  function computeActiveSteps() {
    const base = [0, 1]; // basics + JHA always
    // 1 = Pre-Installation, 2 = Post-Installation, 3 = Baseline Condition, 4 = Routine PM, 5 = Regulatory (+ Training)
    if (state.serviceTypes.includes('1')) base.push(2);
    if (state.serviceTypes.includes('2')) base.push(3);
    if (state.serviceTypes.includes('3') || state.serviceTypes.includes('4')) base.push(4);
    if (state.serviceTypes.includes('5')) {
      base.push(5); // Regulatory
      base.push(6); // Training (merged into Regulatory Compliance Auditing)
    }
    base.push(7, 8, 9, 10); // NC log, photos, sign-off, review always
    state.activeSteps = [...new Set(base)].sort((a, b) => a - b);
  }

  // ── Render checklist sections ──────────────────────────────────────────
  function resultSelect(id, defaultVal = '') {
    return `<select class="result-sel" data-id="${id}">
      <option value="">-</option>
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
          <div class="criteria">${it.criteria || it.hazard + ' -> ' + it.control}</div>
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
    // 5 columns × 8 rows — cols 1-3 prefilled & editable; col4 dropdown; col5 remarks
    let html = `<div class="jha-table-wrap"><table class="jha-table" id="jha-table">
      <thead>
        <tr>
          <th style="width:14%">Hazard Class</th>
          <th style="width:22%">Possible Hazard</th>
          <th style="width:28%">Control Measures</th>
          <th style="width:16%">Compliance Status</th>
          <th style="width:20%">Remarks</th>
        </tr>
      </thead>
      <tbody>`;
    JHA_ITEMS.forEach(it => {
      const cls = (it.step || '').replace(/^\d+\.\s*/, '');
      html += `<tr class="check-row" data-id="${it.id}">
        <td><input type="text" class="jha-edit auto-caps" data-field="class" data-id="${it.id}" value="${cls.replace(/"/g, '&quot;')}" /></td>
        <td><textarea class="jha-edit" data-field="hazard" data-id="${it.id}" rows="2">${it.hazard}</textarea></td>
        <td><textarea class="jha-edit" data-field="control" data-id="${it.id}" rows="2">${it.control}</textarea></td>
        <td>
          <select class="result-sel jha-status" data-id="${it.id}">
            <option value="">— Select —</option>
            <option value="Complied">Complied</option>
            <option value="Not Complied">Not Complied</option>
          </select>
        </td>
        <td><input type="text" class="remarks-input auto-caps" data-remarks="${it.id}" placeholder="Technician remarks" /></td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    cont.innerHTML = html;
    cont.querySelectorAll('.jha-status').forEach(sel => {
      sel.addEventListener('change', () => {
        sel.classList.remove('status-complied', 'status-not-complied');
        if (sel.value === 'Complied') sel.classList.add('status-complied');
        if (sel.value === 'Not Complied') sel.classList.add('status-not-complied');
      });
    });
    cont.querySelectorAll('.jha-edit').forEach(el => {
      el.addEventListener('input', () => {
        const id = el.dataset.id;
        const field = el.dataset.field;
        const item = JHA_ITEMS.find(x => x.id === id);
        if (!item) return;
        if (field === 'class') item.step = el.value;
        if (field === 'hazard') item.hazard = el.value;
        if (field === 'control') item.control = el.value;
      });
    });
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
            <option value="">-</option>
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
      '1. METER ACCURACY - New & Never Used Before FDU  (Verification / Commissioning)', 'new');
    renderCalSection('cal-inservice-container', 'inService',
      '2. METER ACCURACY - In-Service FDU  (Routine Inspection)', 'inService');
  }

  // ── Non-conformance auto-collect ───────────────────────────────────────
  function collectNCs() {
    const ncs = [];
    $$('.result-sel').forEach(sel => {
      const val = sel.value;
      if (val === 'NC' || val === 'Missing' || val === 'NO' || val === 'Not Complied') {
        const row = sel.closest('.check-row');
        const title = row ? (row.querySelector('strong')?.textContent || sel.dataset.id) : sel.dataset.id;
        const remarks = row?.querySelector('.remarks-input')?.value || '';
        ncs.push({
          id: sel.dataset.id,
          desc: title + (remarks ? ' - ' + remarks : ''),
          urgency: val === 'Missing' && sel.dataset.id === 'rg1' ? 'Critical' : 'High',
          wo: false,
          target: ''
        });
      }
    });
    // Meter accuracy FAILs
    ['newFdu', 'inService'].forEach(key => {
      const stage = key === 'newFdu' ? 'new' : 'inService';
      (calState[key] || []).forEach((r, i) => {
        if (r.indicated === '' || r.actual === '') return;
        const c = calcMeterError(parseFloat(r.indicated), parseFloat(r.actual), r.capacity, stage);
        if (!c.pass) {
          ncs.push({
            id: 'meter-' + key + '-' + i,
            desc: 'Meter accuracy FAIL [' + (stage === 'new' ? 'Verification' : 'Re-verification') + '] Nozzle '
              + (r.nozzleId || ('#' + (i + 1))) + ' - Relative indication error '
              + (c.relVsInd >= 0 ? '+' : '') + c.relVsInd.toFixed(2) + '% (limit ' + c.limitText + '); '
              + c.regType + ' variance ' + (c.varianceL >= 0 ? '+' : '') + c.varianceL.toFixed(2) + ' L',
            urgency: 'Critical',
            wo: true,
            target: ''
          });
        }
      });
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
    html += '<p class="help" style="margin-top:6px;"><b>Urgency:</b> Critical = stop use immediately · High = 24-48 hrs · Medium = within 7 days · Low = next PM cycle</p>';
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
    $('#btn-next').textContent = idx >= state.activeSteps.length - 1 ? 'Review' : 'Next ->';

    // Special renders - only build once so Back/Next does not wipe entered data
    if (n === 1) {
      if (!$('#jha-container') || !$('#jha-container').children.length) renderJHA();
      setTimeout(() => {
        ['sig-jha-tech', 'sig-jha-supervisor'].forEach(id => {
          if (!sigPads[id] && document.getElementById(id)) {
            try {
              const canvas = document.getElementById(id);
              sigPads[id] = new SignaturePad(canvas, { backgroundColor: 'rgb(255,255,255)', penColor: 'rgb(13,71,140)' });
              const ratio = Math.max(window.devicePixelRatio || 1, 1);
              const rect = canvas.getBoundingClientRect();
              canvas.width = rect.width * ratio;
              canvas.height = rect.height * ratio;
              canvas.getContext('2d').scale(ratio, ratio);
              sigPads[id].clear();
            } catch (e) { console.warn(e); }
          }
        });
        initSigFileInputs();
        if ($('#jha-sign-date') && !$('#jha-sign-date').value) $('#jha-sign-date').value = todayISO();
        if ($('#jha-sign-name') && !$('#jha-sign-name').value && $('#tech-lead')) $('#jha-sign-name').value = $('#tech-lead').value || '';
      }, 120);
    }
    if (n === 2 && (!$('#preinstall-container') || !$('#preinstall-container').children.length)) renderCheckList('#preinstall-container', PREINSTALL_ITEMS);
    if (n === 3 && (!$('#install-container') || !$('#install-container').children.length)) renderCheckList('#install-container', INSTALL_ITEMS);
    if (n === 4 && (!$('#pm-container') || !$('#pm-container').children.length)) renderPM();
    if (n === 5 && (!$('#reg-container') || !$('#reg-container').children.length)) renderReg();
    if (n === 6 && (!$('#training-topics') || !$('#training-topics').children.length)) renderTraining();
    if (n === 7) {
      const ncs = collectNCs();
      renderNCLog(ncs);
    }
    if (n === 9) {
      setTimeout(initSignatures, 150);
      if (!$('#sig-tech-name').value) $('#sig-tech-name').value = $('#tech-lead').value || '';
      if (!$('#sig-tech-date').value) $('#sig-tech-date').value = todayISO();
      if (!$('#sig-client-date').value) $('#sig-client-date').value = todayISO();
      initSigFileInputs();
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
      // Sync equipType from select in case change event was missed
      const liftSel = $('#lift-type');
      if (liftSel) state.equipType = liftSel.value;

      // Mandatory: unique asset ID, serial number, client name, county name, site location
      // (+ existing inspection number, date, equipment type, tech lead, service type)
      const req = [
        'doc-number', 'doc-date',
        'client-name', 'county-name', 'site-name',
        'lift-id', 'equipment-serial',
        'tech-lead'
      ];
      for (const id of req) {
        const el = $(`#${id}`);
        if (!el || !el.value.trim()) {
          toast('Please complete all required fields (*)', 'error');
          return false;
        }
      }
      if (!$('#county-code') || !$('#county-code').value) {
        toast('Please select a valid County', 'error');
        return false;
      }
      if (!state.equipType) {
        toast('Select an Equipment Type', 'error');
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
        toast('JHA technician name is required', 'error');
        return false;
      }
      if ($('#jha-sign-date') && !$('#jha-sign-date').value) {
        toast('JHA sign-off date is required', 'error');
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
      const techOk = !!(state.sigFiles.tech) || (techPad && !techPad.isEmpty());
      const clientOk = !!(state.sigFiles.client) || (clientPad && !clientPad.isEmpty());
      if (!techOk) {
        toast('Technician signature is required (draw on pad or attach file)', 'error');
        return false;
      }
      if (!clientOk) {
        toast('Client signature is required (draw on pad or attach file)', 'error');
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
        div.innerHTML = `<img src="${p.dataUrl}" alt="${p.name}" /><button class="remove" data-id="${p.id}">x</button>`;
      } else {
        div.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.7rem;padding:4px;text-align:center;">${p.name}</div><button class="remove" data-id="${p.id}">x</button>`;
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
      canvas.height = (canvas.offsetHeight || 100) * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
      if (sigPads[id]) {
        try { sigPads[id].off(); } catch (_) {}
      }
      sigPads[id] = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255,255,255)',
        penColor: 'rgb(13, 38, 77)'
      });
      // Drawing on pad dismisses file overlay in the same box
      canvas.addEventListener('pointerdown', () => {
        const keyMap = { 'sig-tech': 'tech', 'sig-client': 'client' };
        const key = keyMap[id];
        if (key && state.sigFiles[key]) {
          state.sigFiles[key] = null;
          const wrap = document.getElementById('wrap-' + id);
          if (wrap) wrap.classList.remove('has-file');
          const prev = document.getElementById(id + '-file-preview');
          if (prev) { prev.removeAttribute('src'); prev.style.display = 'none'; }
        }
      }, { once: false });
    });
  }

  function clearSig(id) {
    const keyMap = {
      'sig-tech': 'tech',
      'sig-client': 'client',
      'sig-jha-tech': 'jhaTech',
      'sig-jha-supervisor': 'jhaSupervisor'
    };
    if (typeof clearSigUnified === 'function') {
      clearSigUnified(id, keyMap[id] || null);
    } else if (sigPads[id]) {
      sigPads[id].clear();
    }
  }


  function initSigFileInputs() {
    const padMap = { tech: 'sig-tech', client: 'sig-client', jhaTech: 'sig-jha-tech', jhaSupervisor: 'sig-jha-supervisor' };
    function bind(inputId, previewId, key) {
      const inp = document.getElementById(inputId);
      const prev = document.getElementById(previewId);
      if (!inp || inp.dataset.bound) return;
      inp.dataset.bound = '1';
      inp.addEventListener('change', () => {
        const f = inp.files && inp.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          state.sigFiles[key] = e.target.result;
          const padId = padMap[key];
          const wrap = document.getElementById('wrap-' + padId);
          if (prev) {
            prev.src = e.target.result;
            prev.style.display = 'block';
          }
          if (wrap) wrap.classList.add('has-file');
          // Clear pad strokes; file image sits in the same box
          if (padId && sigPads[padId]) {
            try { sigPads[padId].clear(); } catch (_) {}
          }
        };
        reader.readAsDataURL(f);
      });
    }
    bind('sig-tech-file', 'sig-tech-file-preview', 'tech');
    bind('sig-client-file', 'sig-client-file-preview', 'client');
    bind('sig-jha-tech-file', 'sig-jha-tech-file-preview', 'jhaTech');
    bind('sig-jha-supervisor-file', 'sig-jha-supervisor-file-preview', 'jhaSupervisor');
  }

  function clearSigUnified(padId, fileKey) {
    if (sigPads[padId]) {
      try { sigPads[padId].clear(); } catch (_) {}
    }
    if (fileKey) state.sigFiles[fileKey] = null;
    const prev = document.getElementById(padId === 'sig-tech' ? 'sig-tech-file-preview'
      : padId === 'sig-client' ? 'sig-client-file-preview'
      : padId === 'sig-jha-tech' ? 'sig-jha-tech-file-preview'
      : padId === 'sig-jha-supervisor' ? 'sig-jha-supervisor-file-preview' : null);
    if (prev) { prev.removeAttribute('src'); prev.style.display = 'none'; }
    const wrap = document.getElementById('wrap-' + padId);
    if (wrap) wrap.classList.remove('has-file');
    const fileInp = document.getElementById(padId + '-file');
    if (fileInp) fileInp.value = '';
  }

  function resolveSigImage(padId, fileKey) {
    if (state.sigFiles[fileKey]) return state.sigFiles[fileKey];
    return getSigDataSafe(padId);
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
    const serviceLabels = {
      '1': 'Pre-Installation', '2': 'Post-Installation', '3': 'Baseline Condition',
      '4': 'Routine PM', '5': 'Regulatory Compliance'
    };
    const svcText = state.serviceTypes.map(s => serviceLabels[s] || s).join(', ') || '-';
    let html = `
      <div class="review-section" style="border:1px solid var(--border);border-radius:8px;margin-bottom:10px;overflow:hidden;">
        <h4 style="background:#f3f4f6;padding:8px 12px;font-size:0.85rem;">Document & Equipment</h4>
        <div style="padding:10px 12px;font-size:0.85rem;">
          <b>${$('#doc-number').value}</b> · ${$('#client-name').value} · ${$('#site-name').value}<br>
          Equipment: ${state.equipType} · Asset ID: ${$('#lift-id').value} · Brand: ${$('#equipment-brand').value || '-'}<br>
          Service: ${svcText} · Tech: ${$('#tech-lead').value}
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

  function checklistStatusesIncomplete() {
    const sels = Array.from(document.querySelectorAll('.result-sel'));
    if (!sels.length) return false;
    // Only flag if user has opened PM/JHA and left blanks while service types require them
    const empty = sels.filter(s => !s.value);
    return empty.length > 0 && empty.length === sels.length; // all empty = incomplete if any checklist shown
  }

  async function generatePDF() {
    const formatDateDDMonYYYY = window.formatDateDDMonYYYY || function (isoOrDate) {
      if (!isoOrDate) return '-';
      const d = new Date(typeof isoOrDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(isoOrDate) ? isoOrDate + 'T00:00:00' : isoOrDate);
      if (isNaN(d.getTime())) return '-';
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      return String(d.getDate()).padStart(2, '0') + '-' + months[d.getMonth()] + '-' + d.getFullYear();
    };
    if (checklistStatusesIncomplete()) {
      const go = confirm('Checklist status fields appear empty. Generate PDF anyway?');
      if (!go) return;
    }
    showOverlay('Generating PDF…');
    await preloadLogoMark();
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      await registerPdfFonts(doc);
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
        // Full FORECOURT-SWL logo mark (PNG) — never FW/FSW text
        if (state.logoMarkDataUrl) {
          const logoW = 36; // mm wide (full lockup: icon + FORECOURT-SWL)
          const logoH = logoW * (104 / 600); // intrinsic ratio of mark PNG
          const logoX = pageW - outer - logoW - 2;
          const logoY = outer + 1.5;
          try {
            doc.addImage(state.logoMarkDataUrl, 'PNG', logoX, logoY, logoW, logoH);
          } catch (e) {
            // no text fallback — omit mark if image fails
          }
        }
      }

      function drawFooter(pageNum, totalPages) {
        // Left & right footer text above the inner boundary line
        const fy = pageH - inner - 3.5;
        setAppFont(doc, 'normal', 6.5);
        doc.setTextColor(...navy);
        doc.text('FORECOURT-SWL | Pumps & Dispensers Inspection Checklist', margin, fy);
        doc.text('Page ' + pageNum + ' of ' + totalPages, pageW - margin, fy, { align: 'right' });
        // Middle confidential centred above inner boundary
        setAppFont(doc, 'normal', 5.5);
        doc.setTextColor(...grey);
        doc.text('CONFIDENTIAL - FORECOURT WORKS LIMITED', pageW / 2, fy, { align: 'center' });
        // Brand line below the outer boundary
        setAppFont(doc, 'normal', 5);
        doc.setTextColor(...navy);
        doc.text('Engineering Reliability into Every Forecourt', pageW / 2, pageH - outer + 3.5, { align: 'center' });
      }

      function checkPage(need) {
        if (y + need > pageH - 18) {
          doc.addPage();
          drawPageFrame();
          y = 18;
        }
      }


      function drawRubberStamp(x, y) {
        // 58mm x 22mm box at ~15% opacity
        const w = 58, h = 22;
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.4);
        doc.setFillColor(230, 230, 230);
        doc.rect(x, y, w, h, 'FD');
        doc.setTextColor(180, 180, 180);
        setAppFont(doc, 'bold', 9);
        doc.text('RUBBERSTAMP HERE', x + w / 2, y + h / 2 + 1.5, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }

      function sectionBar(title) {
        checkPage(12);
        doc.setFillColor(...navy);
        doc.rect(margin, y, usable, 6.5, 'F');
        doc.setTextColor(255, 255, 255);
        setAppFont(doc, 'bold', 8.5);
        doc.text(title, margin + 2, y + 4.5);
        y += 9;
        doc.setTextColor(...dark);
      }

      function bodyLine(txt, size, bold) {
        setAppFont(doc, bold ? 'bold' : 'normal', size || 8);
        const lines = doc.splitTextToSize(String(txt || '-'), usable);
        checkPage(lines.length * 3.8 + 2);
        doc.text(lines, margin, y);
        y += lines.length * 3.8 + 1.5;
      }

      function kvLine(pairs) {
        doc.setFontSize(7.5);
        let x = margin;
        pairs.forEach((p) => {
          setAppFont(doc, 'bold');
          doc.setTextColor(...navy);
          const k = p.k + ': ';
          doc.text(k, x, y);
          const kw = doc.getTextWidth(k);
          setAppFont(doc, 'normal');
          doc.setTextColor(...dark);
          doc.text(String(p.v || '-'), x + kw, y);
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
        if (val === 'Complied') return { text: 'Complied', colour: green };
        if (val === 'Not Complied') return { text: 'Not Complied', colour: red };
        if (val === 'YES') return { text: 'YES', colour: green };
        if (val === 'NO') return { text: 'NO', colour: red };
        return { text: val || '-', colour: dark };
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
        setAppFont(doc, 'bold', 6.5);
        let hx = margin + 1;
        headers.forEach((h, i) => {
          textInCol(doc, h, hx, y + 4, colW[i]);
          hx += colW[i];
        });
        y += 7;

        items.forEach((it) => {
          const sel = document.querySelector('.result-sel[data-id="' + it.id + '"]');
          const remarksEl = document.querySelector('.remarks-input[data-remarks="' + it.id + '"]');
          const val = sel ? sel.value : '';
          const rem = remarksEl ? remarksEl.value : '';
          const itemTxt = it.item || it.step || it.id;
          const critTxt = it.criteria || ((it.hazard || '') + ' -> ' + (it.control || ''));
          const st = statusFull(val);

          const itemLines = doc.splitTextToSize(itemTxt, colW[0] - 2);
          const critLines = doc.splitTextToSize(critTxt, colW[1] - 2);
          const remLines = doc.splitTextToSize(rem || '-', colW[3] - 2);
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

          setAppFont(doc, 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(...dark);
          doc.text(itemLines, margin + 1, y + 3.2);
          doc.text(critLines, margin + colW[0] + 1, y + 3.2);

          setAppFont(doc, 'bold');
          doc.setTextColor(...st.colour);
          doc.text(st.text, margin + colW[0] + colW[1] + 1, y + 3.2);

          setAppFont(doc, 'normal');
          doc.setTextColor(...dark);
          doc.text(remLines, margin + colW[0] + colW[1] + colW[2] + 1, y + 3.2);

          y += rowH;
        });
        y += 3;
      }

      // ── Page 1 header ──
      drawPageFrame();

      // Company header (matches on-screen header)
      setAppFont(doc, 'bold', 13);
      doc.setTextColor(...navy);
      doc.text('FORECOURT WORKS LIMITED', margin, y);
      y += 4.5;
      setAppFont(doc, 'normal', 8);
      doc.setTextColor(...dark);
      doc.text('Ramco Court, GT 3B, South C, Nairobi', margin, y); y += 3.5;
      doc.text('Phone: +(254) 729-002-087  |  Email: sales@forecourtworks.co.ke', margin, y); y += 3.5;
      doc.text('www.forecourtworks.co.ke', margin, y); y += 5;
      setAppFont(doc, 'normal', 9);
      doc.setTextColor(184, 95, 10); // accent-ish
      doc.text('Engineering Reliability Into Every Forecourt', margin, y);
      y += 5;
      doc.setDrawColor(...navy);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageW - margin, y);
      y += 5;
      setAppFont(doc, 'bold', 11);
      doc.setTextColor(...navy);
      doc.text('PUMPS & DISPENSERS INSPECTION CHECKLIST', pageW / 2, y, { align: 'center' });
      y += 6;

      // Checklist No + WO No box
      doc.setFillColor(...navyLight);
      doc.setDrawColor(...navy);
      doc.setLineWidth(0.3);
      doc.rect(margin, y, usable, 8, 'FD');
      setAppFont(doc, 'bold', 7.5);
      doc.setTextColor(...dark);
      doc.text('Controlled Doc No: insp/fdu&pumps/Vol-001', margin + 3, y + 5.2);
      doc.text('Linked WO#  ' + ($('#linked-wo').value || '-'), margin + usable * 0.62, y + 5.2);
      y += 11;

      // 1. GENERAL INFORMATION
      sectionBar('1. JOB BASICS, EQUIPMENT TYPE & INSPECTION SCOPE');
      const inspDateFmt = formatDateDDMonYYYY($('#doc-date') ? $('#doc-date').value : '');
      kvLine([
        { k: 'Inspection Number', v: $('#doc-number').value },
        { k: 'Inspection Date', v: inspDateFmt }
      ]);
      kvLine([
        { k: 'Client Name', v: $('#client-name').value },
        { k: 'County', v: ($('#county-name').value || '-') + ($('#county-code').value ? ' (' + $('#county-code').value + ')' : '') }
      ]);
      kvLine([
        { k: 'Site Location', v: $('#site-name').value },
        { k: 'Site Rep Name & Contact', v: $('#site-contact').value || '-' }
      ]);
      kvLine([
        { k: 'Equipment Type', v: state.equipType || '-' },
        { k: 'Unique Asset ID', v: $('#lift-id').value }
      ]);
      kvLine([
        { k: 'Product/Hose Config', v: $('#fdu-config').value || '-' },
        { k: 'Equipment Brand', v: $('#equipment-brand').value || '-' }
      ]);
      kvLine([
        { k: 'Model No.', v: $('#equipment-model').value || '-' },
        { k: 'Serial No.', v: $('#equipment-serial').value || '-' }
      ]);
      kvLine([
        { k: 'Year of Installation', v: $('#lift-year').value || '-' },
        { k: 'Validity Period', v: $('#warranty-validity').value || '-' }
      ]);
      kvLine([
        { k: 'Valid Until', v: formatDateDDMonYYYY($('#valid-until') ? $('#valid-until').value : '') },
        { k: 'Vendor Name', v: $('#vendor-name').value || '-' }
      ]);
      kvLine([
        { k: 'Vendor Location', v: $('#vendor-location') ? ($('#vendor-location').value || '-') : '-' },
        { k: 'Vendor Contacts', v: $('#vendor-contacts') ? ($('#vendor-contacts').value || '-') : '-' }
      ]);
      const serviceLabels = {
        '1': '1. PRE INSTALLATION INSPECTIONS',
        '2': '2. POST INSTALLATION INSPECTION',
        '3': '3. BASELINE CONDITION INSPECTION',
        '4': '4. ROUTINE PREVENTIVE MAINTENANCE INSPECTION',
        '5': '5. REGULATORY COMPLIANCE AUDITING'
      };
      const svcText = state.serviceTypes.map(s => serviceLabels[s] || s).join('; ') || '-';
      kvLine([
        { k: 'Technician-In-Charge', v: $('#tech-lead').value },
        { k: 'Service Type(s)', v: svcText }
      ]);
      y += 2;

      // 2. JHA — 5 columns × 8 rows (header + 7), sign-off at bottom
      sectionBar('2. JOB SAFETY & HAZARD ANALYSIS');
      {
        const colW = [usable * 0.14, usable * 0.20, usable * 0.28, usable * 0.16, usable * 0.22];
        const headers = ['Hazard Class', 'Possible Hazard', 'Control Measures', 'Compliance', 'Remarks'];
        checkPage(12);
        doc.setFillColor(13, 71, 140);
        doc.rect(margin, y, usable, 6.5, 'F');
        doc.setTextColor(255, 255, 255);
        setAppFont(doc, 'bold', 5.5);
        let hx = margin + 0.6;
        headers.forEach((h, i) => { textInCol(doc, h, hx, y + 4.2, colW[i]); hx += colW[i]; });
        y += 7;

        JHA_ITEMS.forEach((it) => {
          const sel = document.querySelector('.result-sel[data-id="' + it.id + '"]');
          const remEl = document.querySelector('.remarks-input[data-remarks="' + it.id + '"]');
          const val = sel ? sel.value : '';
          const rem = remEl ? remEl.value : '';
          const st = statusFull(val);
          const classEl = document.querySelector('.jha-edit[data-field="class"][data-id="' + it.id + '"]');
          const hazEl = document.querySelector('.jha-edit[data-field="hazard"][data-id="' + it.id + '"]');
          const ctrlEl = document.querySelector('.jha-edit[data-field="control"][data-id="' + it.id + '"]');
          const cls = (classEl && classEl.value) ? classEl.value : (it.step || '').replace(/^\d+\.\s*/, '');
          const haz = (hazEl && hazEl.value) ? hazEl.value : it.hazard;
          const ctrl = (ctrlEl && ctrlEl.value) ? ctrlEl.value : it.control;
          setAppFont(doc, 'normal', 6);
          const c0 = doc.splitTextToSize(cls, colW[0] - 1.5);
          const c1 = doc.splitTextToSize(haz, colW[1] - 1.5);
          const c2 = doc.splitTextToSize(ctrl, colW[2] - 1.5);
          const c3 = doc.splitTextToSize(st.text, colW[3] - 1.5);
          const c4 = doc.splitTextToSize(rem || '-', colW[4] - 1.5);
          const maxL = Math.max(c0.length, c1.length, c2.length, c3.length, c4.length, 1);
          const rowH = Math.max(6, maxL * 3.2 + 2);
          checkPage(rowH + 2);
          doc.setDrawColor(200, 210, 220);
          doc.setLineWidth(0.12);
          doc.rect(margin, y, usable, rowH);
          let lx = margin;
          for (let i = 0; i < 4; i++) { lx += colW[i]; doc.line(lx, y, lx, y + rowH); }
          const cols = [c0, c1, c2, c3, c4];
          let cx = margin + 0.6;
          cols.forEach((lines, i) => {
            if (i === 3) { setAppFont(doc, 'bold', 6); doc.setTextColor(...st.colour); }
            else { setAppFont(doc, 'normal', 6); doc.setTextColor(...dark); }
            doc.text(lines, cx, y + 3.5);
            cx += colW[i];
          });
          y += rowH;
        });
        y += 4;

        // Sign-off block at bottom of JHA
        checkPage(42);
        setAppFont(doc, 'bold', 8);
        doc.setTextColor(...navy);
        doc.text('JHA Sign-Off', margin, y);
        y += 4;
        setAppFont(doc, 'normal', 7);
        doc.setTextColor(...dark);
        const ack = 'I the undersigned technician, acknowledge that I have reviewed this Job Hazard Analysis (JHA), understand the hazards associated with the assigned tasks, and agree to follow all specified safety procedures, control measures, and required personal protective equipment (PPE). I understand that if conditions change or new hazards arise, I must stop work and notify my supervisor.';
        const ackLines = doc.splitTextToSize(ack, usable);
        doc.text(ackLines, margin, y);
        y += ackLines.length * 3.4 + 3;

        setAppFont(doc, 'normal', 7.5);
        doc.text('Technician Name: ' + ($('#jha-sign-name').value || '_______________'), margin, y);
        doc.text('Date: ' + formatDateDDMonYYYY($('#jha-sign-date') ? $('#jha-sign-date').value : ''), margin + usable * 0.55, y);
        y += 5;

        const jhaTechSig = resolveSigImage('sig-jha-tech', 'jhaTech');
        const jhaSupSig = resolveSigImage('sig-jha-supervisor', 'jhaSupervisor');
        checkPage(28);
        setAppFont(doc, 'bold', 7);
        doc.text('Technician Signature', margin, y);
        doc.text('Supervisor Sign', margin + usable * 0.52, y);
        y += 2;
        if (jhaTechSig) {
          try { doc.addImage(jhaTechSig, 'PNG', margin, y, 55, 18); } catch (e) {
            try { doc.addImage(jhaTechSig, 'JPEG', margin, y, 55, 18); } catch (_) {}
          }
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.rect(margin, y, 55, 18);
        }
        if (jhaSupSig) {
          try { doc.addImage(jhaSupSig, 'PNG', margin + usable * 0.52, y, 55, 18); } catch (e) {
            try { doc.addImage(jhaSupSig, 'JPEG', margin + usable * 0.52, y, 55, 18); } catch (_) {}
          }
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.rect(margin + usable * 0.52, y, 55, 18);
        }
        y += 22;
      }

      if (state.serviceTypes.includes('1')) dumpTableSection('3. PRE-INSTALLATION SITE READINESS', PREINSTALL_ITEMS);
      if (state.serviceTypes.includes('2')) dumpTableSection('4. ASSET INSTALLATION CHECKLIST', INSTALL_ITEMS);
      if (state.serviceTypes.includes('3') || state.serviceTypes.includes('4')) {
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

          valid.forEach((r, i) => {
            const c = calcMeterError(parseFloat(r.indicated), parseFloat(r.actual), r.capacity, stage);
            checkPage(36);
            setAppFont(doc, 'bold', 7.5);
            doc.setTextColor(...navy);
            doc.text('Reading No. ' + (i + 1), margin, y);
            y += 4;
            setAppFont(doc, 'normal', 7);
            doc.setTextColor(...dark);
            const hdr = 'Nozzle ID: ' + (r.nozzleId || '-') +
              '  |  Prover: ' + Number(r.capacity).toFixed(2) + ' L' +
              '  |  Variance: ' + (c.varianceL >= 0 ? '+' : '') + c.varianceL.toFixed(2) + ' L (' + c.regType + ')';
            const hdrLines = doc.splitTextToSize(hdr, usable);
            doc.text(hdrLines, margin, y);
            y += hdrLines.length * 3.5 + 2;

            // 6-col table — shorter headers so text stays inside cells
            const colW = [usable * 0.16, usable * 0.16, usable * 0.15, usable * 0.18, usable * 0.20, usable * 0.15];
            const headers = ['Indicated (L)', 'True Proven (L)', 'Variance (L)', 'Rel vs True %', 'Rel vs Meter %', 'Status'];
            const rowH = 7;

            checkPage(rowH + 4);
            doc.setFillColor(13, 71, 140);
            doc.rect(margin, y, usable, rowH, 'F');
            doc.setTextColor(255, 255, 255);
            setAppFont(doc, 'bold', 5.5);
            let hx = margin + 0.8;
            headers.forEach((h, hi) => {
              textInCol(doc, h, hx, y + 4.5, colW[hi]);
              hx += colW[hi];
            });
            y += rowH;

            checkPage(rowH + 2);
            doc.setDrawColor(180, 190, 200);
            doc.setLineWidth(0.15);
            doc.rect(margin, y, usable, rowH);
            let lx = margin;
            for (let cIdx = 0; cIdx < 5; cIdx++) {
              lx += colW[cIdx];
              doc.line(lx, y, lx, y + rowH);
            }

            const cells = [
              Number(r.indicated).toFixed(2),
              Number(r.actual).toFixed(2),
              (c.varianceL >= 0 ? '+' : '') + c.varianceL.toFixed(2),
              (c.relVsTrue >= 0 ? '+' : '') + c.relVsTrue.toFixed(2) + '%',
              (c.relVsInd >= 0 ? '+' : '') + c.relVsInd.toFixed(2) + '%',
              c.status
            ];
            setAppFont(doc, 'normal', 7);
            doc.setTextColor(...dark);
            let cx = margin + 0.8;
            cells.forEach((cell, ci) => {
              if (ci === 5) {
                setAppFont(doc, 'bold', 7);
                doc.setTextColor(...(c.pass ? green : red));
              } else {
                setAppFont(doc, 'normal', 7);
                doc.setTextColor(...dark);
              }
              textInCol(doc, cell, cx, y + 4.8, colW[ci]);
              cx += colW[ci];
            });
            y += rowH + 2.5;

            setAppFont(doc, 'bold', 7);
            doc.setTextColor(...dark);
            doc.text('Calibration Result Analysis', margin, y);
            y += 3.8;
            setAppFont(doc, 'normal', 7);
            doc.setTextColor(...(c.pass ? green : red));
            const analysisLines = doc.splitTextToSize(c.narrative + ' Status: ' + c.status + ' (limit ' + c.limitText + ').', usable);
            doc.text(analysisLines, margin, y);
            y += analysisLines.length * 3.5 + 2;
            // Verdict line
            setAppFont(doc, 'bold', 7);
            doc.setTextColor(...(c.pass ? green : red));
            const vLines = doc.splitTextToSize((c.pass ? 'PASS: ' : 'FAIL: ') + c.verdict.replace(/^VERDICT:\s*/i, ''), usable);
            doc.text(vLines, margin, y);
            y += vLines.length * 3.5 + 5;
          });

          if (valid.length >= 2) {
            const calcs = valid.map(r => calcMeterError(parseFloat(r.indicated), parseFloat(r.actual), r.capacity, stage));
            const pcts = calcs.map(v => v.relVsInd);
            const minPct = Math.min(...pcts);
            const maxPct = Math.max(...pcts);
            const spread = maxPct - minPct;
            const allPass = calcs.every(v => v.pass);
            const interpretation = allPass
              ? 'ALL WITHIN LIMITS - acceptable repeatability'
              : 'ONE OR MORE OUTSIDE LIMITS - investigate drift / meter condition';

            sectionBar('Repeatability Summary');
            const rColW = [usable * 0.20, usable * 0.20, usable * 0.18, usable * 0.42];
            const rHeaders = ['Bottom limit %', 'Top limit %', 'Spread %', 'Overall interpretation'];
            setAppFont(doc, 'normal', 6.5);
            const interpLines = doc.splitTextToSize(interpretation, rColW[3] - 2);
            const rRowH = Math.max(10, 3.2 + interpLines.length * 3.4);

            checkPage(rRowH + 10);
            doc.setFillColor(13, 71, 140);
            doc.rect(margin, y, usable, 7, 'F');
            doc.setTextColor(255, 255, 255);
            setAppFont(doc, 'bold', 6);
            let rhx = margin + 0.8;
            rHeaders.forEach((h, hi) => {
              textInCol(doc, h, rhx, y + 4.5, rColW[hi]);
              rhx += rColW[hi];
            });
            y += 7;

            doc.setDrawColor(180, 190, 200);
            doc.setLineWidth(0.15);
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
            let rcx = margin + 0.8;
            rCells.forEach((cell, ci) => {
              if (ci === 3) {
                setAppFont(doc, 'bold', 6.5);
                doc.setTextColor(...(allPass ? green : red));
              } else {
                setAppFont(doc, 'normal', 7);
                doc.setTextColor(...dark);
              }
              const lines = doc.splitTextToSize(String(cell), rColW[ci] - 2);
              doc.text(lines, rcx, y + 4.2);
              rcx += rColW[ci];
            });
            y += rRowH + 5;
          }
        }


        dumpMeterAccuracy('new',
          '5E. METER ACCURACY - New & Never Used Before FDU',
          'Legal limit (Verification/new): relative indication error 0% to +0.25% (no negative). Values to 2 decimal places.');
        dumpMeterAccuracy('inService',
          '5F. METER ACCURACY - In-Service FDU',
          'Legal limit (Re-verification): relative indication error -0.25% to +0.50%. Values to 2 decimal places.');
      }
      if (state.serviceTypes.includes('5')) dumpTableSection('6. REGULATORY COMPLIANCE AUDITING (incl. Training)', REG_ITEMS);

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
      const notesVal = ($('#tech-notes') && $('#tech-notes').value) ? $('#tech-notes').value.trim() : '';
      bodyLine(notesVal || 'No closing notes recorded.', 8, false);
      y += 3;

      // Sign-off
      sectionBar('9. SIGN-OFF');
      bodyLine('TECHNICIAN DECLARATION', 8, true);
      bodyLine($('#tech-declaration').value || '', 7, false);
      checkPage(40);
      const techNameLine = 'Name: ' + ($('#sig-tech-name').value || '-') + '     Date: ' + formatDateDDMonYYYY($('#sig-tech-date') ? $('#sig-tech-date').value : '');
      bodyLine(techNameLine, 8, false);
      const techSig = resolveSigImage('sig-tech', 'tech');
      if (techSig) {
        checkPage(32);
        try { doc.addImage(techSig, 'JPEG', margin, y, 50, 20); } catch (e) {
          try { doc.addImage(techSig, 'PNG', margin, y, 50, 20); } catch (_) {}
        }
        drawRubberStamp(pageW - margin - 58, y);
        y += 26;
      } else {
        checkPage(28);
        drawRubberStamp(pageW - margin - 58, y);
        y += 26;
      }
      y += 10; // extra space before client section
      bodyLine('CLIENT / SITE REPRESENTATIVE CONFIRMATION', 8, true);
      bodyLine($('#client-declaration').value || '', 7, false);
      bodyLine('Name: ' + ($('#client-rep-name').value || '-') + '     Title: ' + ($('#client-rep-title').value || '-') + '     Date: ' + formatDateDDMonYYYY($('#sig-client-date') ? $('#sig-client-date').value : ''), 8, false);
      const clientSig = resolveSigImage('sig-client', 'client');
      if (clientSig) {
        checkPage(32);
        try { doc.addImage(clientSig, 'JPEG', margin, y, 50, 20); } catch (e) {
          try { doc.addImage(clientSig, 'PNG', margin, y, 50, 20); } catch (_) {}
        }
        drawRubberStamp(pageW - margin - 58, y);
        y += 26;
      } else {
        checkPage(28);
        drawRubberStamp(pageW - margin - 58, y);
        y += 26;
      }
      if ($('#client-comments') && $('#client-comments').value) bodyLine('Comments: ' + $('#client-comments').value, 7.5, false);

      // Photos on separate pages
      if (state.photos.length) {
        state.photos.forEach((p) => {
          if (!p.dataUrl.startsWith('data:image')) return;
          doc.addPage();
          drawPageFrame();
          setAppFont(doc, 'bold');
          doc.setFontSize(9);
          doc.setTextColor(...navy);
          doc.text('Photographic Evidence - ' + p.name, margin, 18);
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

      const fileName = ($('#doc-number').value || 'Checklist') + '_' + ($('#client-name').value || 'Client').replace(/\s+/g, '_') + '.pdf';
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
          text: `Pump & Dispenser Inspection Checklist - ${$('#doc-number').value}`,
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
    // Default inspection date to today
    if ($('#doc-date')) {
      $('#doc-date').value = todayISO();
      if ($('#date-display-hint')) {
        $('#date-display-hint').textContent = 'Selected: ' + formatDateDDMonYYYY(todayISO());
      }
    }
    // Autofill inspection number (editable)
    if ($('#doc-number')) {
      $('#doc-number').value = generateDocNumber(); // e.g. INSP/2026/001
    }
    // Header badge - fixed controlled document number (no date)
    const numDisp = $('#doc-number-display');
    if (numDisp) {
      numDisp.textContent = 'Controlled Doc No: INSP/FDU&Pumps/ControlledDoc/Vol-01';
    }

    initSelectors();
    preloadLogoMark();

    $('#btn-start').addEventListener('click', () => {
      updateServiceTypes();
      const liftSel = $('#lift-type');
      if (liftSel) state.equipType = liftSel.value;
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
