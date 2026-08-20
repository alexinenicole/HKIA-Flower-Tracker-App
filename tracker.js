// ============================================================
//  tracker.js — Renderer Process
//  HKIA Flower Tracker (Electron)
//
//  State keys: "FlowerName::cN::ColorName::variant"
//  The color index (cN) prevents collisions between
//  identically-named colors (e.g. two "Pink" entries).
// ============================================================

// ── Runtime state ─────────────────────────────────────────────
let ALL_FLOWERS = [];
let PATTERNS = [];
let COLORS = [];
let STATE = {};          // { key: true }

let currentTab = 'main'; // 'main' or a pattern name (e.g., 'molten')

const TYPE_TINTS = {
  'basic': '#6bb8ff',      // sky-blue
  'extremophile': '#ff6ba8', // rose-pink
  'event': '#ffb86b',        // peach
  'dlc': '#a56bff'           // violet
};

const PATTERN_COMPATIBILITY = {
  'ombre': 'all', 'molten': 'all', 'crystal': 'all', 'frost': 'all', 'cosmic': 'all',
  'glitter': 'all', 'sunbeam': 'all', 'iridescent': 'all', 'glow': 'all',

  'speckled': ['Belbutton', 'Dandelily', 'Hibiscus', 'Penstemum', 'Tulias', 'Blazebulb', 'Frost Feather', 'Bubbaluna', 'Bow Blossom', 'Petunia', 'Pinwheel', 'Poinsettia', 'Rose', 'Wheat Flower'],
  'confetti': ['Belbutton', 'Dandelily', 'Heavy Nettle', 'Hibiscus', 'Penstemum', 'Tulias', 'Bubbaluna', 'Bow Blossom', 'Eggwort', 'Petunia', 'Pinwheel', 'Poinsettia', 'Rose', 'Wheat Flower'],
  'trim': ['Belbutton', 'Dandelily', 'Heavy Nettle', 'Hibiscus', 'Penstemum', 'Thistle', 'Tulias', 'Blazebulb', 'Bubbaluna', 'Frost Feather', 'Eggwort', 'Happadil', 'Petunia', 'Pinwheel', 'Poinsettia', 'Rose', 'Wheat Flower'],
  'alternate': ['Dandelily', 'Heavy Nettle', 'Hibiscus', 'Tulias', 'Wheat Flower', 'Eggwort', 'Penstemum', 'Pinwheel', 'Rose', 'Poinsettia'],
  'striped': ['Heavy Nettle', 'Hibiscus', 'Tulias', 'Wheat Flower', 'Penstemum', 'Blazebulb', 'Bubbaluna', 'Crystalia', 'Eggwort', 'Petunia', 'Happadil', 'Rose', 'Poinsettia'],
  'patch': ['Ghostgleam', 'Heavy Nettle', 'Hibiscus', 'Tulias', 'Wheat Flower', 'Penstemum', 'Eggwort', 'Pinwheel', 'Petunia', 'Happadil', 'Rose', 'Poinsettia'],
  'ring': ['Ghostgleam', 'Heavy Nettle', 'Hibiscus', 'Tulias', 'Wheat Flower', 'Penstemum', 'Blazebulb', 'Bow Blossom', 'Frost Feather', 'Eggwort', 'Petunia', 'Happadil', 'Rose', 'Poinsettia']
};

// ── Key helpers ───────────────────────────────────────────────
function makeKey(flowerName, colorIdx, colorName, variant) {
  return `${flowerName}::c${colorIdx}::${colorName}::${variant}`;
}

function makeHybridKey(flowerName, patternId, rowColorIdx, colColorIdx) {
  // e.g. "Belbutton::xh::ombre::r3::c11"
  return `${flowerName}::xh::${patternId}::r${rowColorIdx}::c${colColorIdx}`;
}

function isChecked(flowerName, colorIdx, colorName, variant) {
  return STATE[makeKey(flowerName, colorIdx, colorName, variant)] === true;
}

// ── View helpers ──────────────────────────────────────────────
function getVisibleFlowers() {
  if (currentTab === 'main') {
    return ALL_FLOWERS;
  } else {
    const comp = PATTERN_COMPATIBILITY[currentTab] || [];

    // Native flowers for the pattern first
    const natives = ALL_FLOWERS.filter(f => f.nativePattern === currentTab);

    // Other compatible flowers
    const others = ALL_FLOWERS.filter(f => {
      if (f.nativePattern === currentTab) return false;
      if (comp === 'all') return true;
      return comp.includes(f.name);
    });

    return [...natives, ...others];
  }
}

function getVariantForFlower(flower) {
  if (currentTab === 'main') {
    return flower.nativePattern;
  } else {
    return currentTab;
  }
}

// ── Counter helpers ───────────────────────────────────────────
function getGlobalTotal() {
  return Object.values(STATE).filter(v => v === true).length;
}

function getCounter(flowerName, variant) {
  let count = 0;
  COLORS.forEach((color, ci) => {
    if (isChecked(flowerName, ci, color.name, variant)) {
      count++;
    }
  });
  return count;
}

function updateCounterUI() {
  const visibleFlowers = getVisibleFlowers();
  visibleFlowers.forEach(flower => {
    const variant = getVariantForFlower(flower);
    ['solid', variant].forEach(v => {
      const count = getCounter(flower.name, v);
      const safeName = flower.name.replace(/ /g, '_');

      const badge = document.getElementById(`badge-${safeName}-${v}`);
      if (badge) {
        badge.textContent = count;
        badge.classList.toggle('has-count', count > 0);
      }

      const frac = document.getElementById(`badge-frac-${safeName}-${v}`);
      if (frac) {
        frac.textContent = `${count}/${COLORS.length}`;
        frac.classList.toggle('has-count', count > 0);
      }
    });
  });

  const globalEl = document.getElementById('global-total');
  if (globalEl) {
    globalEl.textContent = getGlobalTotal();
    globalEl.classList.remove('bump');
    void globalEl.offsetWidth;
    globalEl.classList.add('bump');
  }
}

// ── Table builders ────────────────────────────────────────────
function clearTable() {
  document.getElementById('flower-header-row').innerHTML =
    '<th class="color-label-col sticky-left">Color</th>';
  document.getElementById('variant-header-row').innerHTML =
    '<th class="color-label-col sticky-left"></th>';
  document.getElementById('tracker-tbody').innerHTML = '';
  document.getElementById('tracker-tfoot').innerHTML = '';
}

function buildTabs() {
  const nav = document.getElementById('main-tabs');
  nav.innerHTML = '';

  function createBtn(id, label, iconSrc) {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${currentTab === id ? 'active' : ''}`;
    btn.onclick = () => {
      currentTab = id;
      buildTabs();
      clearTable();
      buildHeaders();
      buildBody();
      buildFooter();
      updateCounterUI();
    };
    if (iconSrc) {
      btn.innerHTML = `<img src="${iconSrc}" class="tab-icon"> ${label}`;
    } else {
      btn.innerHTML = `🌟 ${label}`;
    }
    return btn;
  }

  nav.appendChild(createBtn('main', 'Main Overview'));

  PATTERNS.forEach(pat => {
    const label = pat.charAt(0).toUpperCase() + pat.slice(1);
    nav.appendChild(createBtn(pat, `${label} Transfers`, `assets/patterns/${pat}.png`));
  });
}

function buildHeaders() {
  const table = document.getElementById('tracker-table');
  let colgroup = document.getElementById('tracker-colgroup');
  if (!colgroup) {
    colgroup = document.createElement('colgroup');
    colgroup.id = 'tracker-colgroup';
    table.insertBefore(colgroup, table.firstChild);
  }
  colgroup.innerHTML = '<col style="width: max-content; min-width: 120px; max-width: 120px; width: 120px;">'; // Left col

  const flowerRow = document.getElementById('flower-header-row');
  const variantRow = document.getElementById('variant-header-row');
  let dataColCount = 0;

  const visibleFlowers = getVisibleFlowers();

  visibleFlowers.forEach(flower => {
    const variant = getVariantForFlower(flower);
    const vLabel = variant.charAt(0).toUpperCase() + variant.slice(1);
    const cols = currentTab === 'main' ? ['Solid', vLabel] : [vLabel];

    const th = document.createElement('th');
    th.colSpan = cols.length;
    th.className = 'flower-name-group';
    th.dataset.type = flower.type;
    const tint = TYPE_TINTS[flower.type] || '#ffffff';
    th.style.setProperty('--flower-bg', tint);
    
    const groupWidth = cols.length * 95;
    th.style.minWidth = groupWidth + 'px';
    th.style.width = groupWidth + 'px';
    th.style.maxWidth = groupWidth + 'px';
    th.style.boxSizing = 'border-box';

    const imgName = flower.name.replace(/ /g, '_') + '.png';
    th.innerHTML = `
      <div class="flower-header-content">
        <img src="assets/flowers/${imgName}" class="flower-icon" alt="${flower.name}" onerror="this.style.display='none'">
        <span class="flower-name">${flower.name}</span>
      </div>
    `;

    // On pattern tabs: clicking the flower header opens the hybrid grid
    if (currentTab !== 'main') {
      th.classList.add('flower-header-clickable');
      th.title = `Click to view ${flower.name} hybrid colour combinations`;
      th.addEventListener('click', () => openHybridModal(flower));
    }

    flowerRow.appendChild(th);

    cols.forEach((v) => {
      const isSolid = v === 'Solid';
      const vth = document.createElement('th');
      vth.className = `variant-cell ${isSolid ? 'variant-solid' : 'variant-pattern'}`;
      vth.dataset.type = flower.type;
      vth.style.setProperty('--flower-bg', tint);

      const iconSrc = isSolid ? `assets/flowers/${imgName}` : `assets/patterns/${variant}.png`;

      vth.innerHTML = `
        <div class="variant-header-content">
          <img src="${iconSrc}" class="variant-icon" alt="${v}" onerror="this.style.display='none'">
          <span>${v}</span>
        </div>
      `;
      variantRow.appendChild(vth);

      const col = document.createElement('col');
      col.style.width = '95px';
      colgroup.appendChild(col);
      dataColCount++;
    });
  });

  table.style.width = (120 + (dataColCount * 95)) + 'px';
  table.style.minWidth = table.style.width;
  table.style.maxWidth = table.style.width;

}

function buildBody() {
  const tbody = document.getElementById('tracker-tbody');
  const visibleFlowers = getVisibleFlowers();

  COLORS.forEach((color, ci) => {
    const tr = document.createElement('tr');
    tr.style.setProperty('--row-swatch', color.swatch);

    const labelTd = document.createElement('td');
    labelTd.className = 'color-label-cell sticky-left';
    labelTd.style.setProperty('--label-bg', color.swatch);
    labelTd.style.background = color.swatch;
    labelTd.style.setProperty('background', color.swatch, 'important');
    labelTd.textContent = color.name;
    tr.appendChild(labelTd);

    visibleFlowers.forEach((flower, fi) => {
      const tint = TYPE_TINTS[flower.type] || '#ffffff';
      const variant = getVariantForFlower(flower);
      const colsLower = currentTab === 'main' ? ['solid', variant] : [variant];

      colsLower.forEach((v) => {
        const isSolid = v === 'solid';
        const td = document.createElement('td');
        td.className = `checkbox-cell ${v}-col${isSolid || currentTab !== 'main' ? ' flower-group-start' : ''}`;
        td.style.setProperty('--flower-bg', tint);

        const label = document.createElement('label');
        label.className = `check-wrapper is-${v}`;
        const capitalizedVariant = v.charAt(0).toUpperCase() + v.slice(1);
        label.title = `${flower.name} — ${color.name} — ${capitalizedVariant}`;

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.flowerName = flower.name;
        input.dataset.colorIdx = ci;
        input.dataset.colorName = color.name;
        input.dataset.variant = v;
        input.checked = isChecked(flower.name, ci, color.name, v);

        const box = document.createElement('span');
        box.className = 'check-box';
        box.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"
          stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2,7 5.5,11 12,3"/>
        </svg>`;

        input.addEventListener('change', onCheckChange);

        label.appendChild(input);
        label.appendChild(box);
        td.appendChild(label);
        tr.appendChild(td);
      });
    });

    tbody.appendChild(tr);
  });
}

function buildFooter() {
  const tfoot = document.getElementById('tracker-tfoot');
  tfoot.innerHTML = '';
  const visibleFlowers = getVisibleFlowers();

  const countRow = document.createElement('tr');
  countRow.className = 'counter-row';
  const countLbl = document.createElement('td');
  countLbl.className = 'counter-label-cell sticky-left';
  countLbl.textContent = '✓ Have';
  countRow.appendChild(countLbl);

  visibleFlowers.forEach((flower, fi) => {
    const tint = TYPE_TINTS[flower.type] || '#ffffff';
    const variant = getVariantForFlower(flower);
    const colsLower = currentTab === 'main' ? ['solid', variant] : [variant];

    colsLower.forEach((v) => {
      const isSolid = v === 'solid';
      const td = document.createElement('td');
      if (isSolid || currentTab !== 'main') td.className = 'flower-group-start';
      td.style.setProperty('--flower-bg', tint);

      const b = document.createElement('span');
      // Using ombre-badge styles for all patterns just for styling consistency
      b.className = `counter-badge ${isSolid ? 'solid-badge' : 'ombre-badge'}`;
      b.id = `badge-${flower.name.replace(/ /g, '_')}-${v}`;

      const count = getCounter(flower.name, v);
      b.textContent = count;
      if (count > 0) b.classList.add('has-count');

      td.appendChild(b);
      countRow.appendChild(td);
    });
  });
  tfoot.appendChild(countRow);

  const fracRow = document.createElement('tr');
  fracRow.className = 'counter-total-row';
  const fracLbl = document.createElement('td');
  fracLbl.className = 'counter-total-label sticky-left';
  fracLbl.textContent = 'Progress';
  fracRow.appendChild(fracLbl);

  visibleFlowers.forEach((flower, fi) => {
    const variant = getVariantForFlower(flower);
    const colsLower = currentTab === 'main' ? ['solid', variant] : [variant];

    colsLower.forEach((v) => {
      const isSolid = v === 'solid';
      const td = document.createElement('td');
      if (isSolid || currentTab !== 'main') td.className = 'flower-group-start';

      const b = document.createElement('span');
      b.className = `total-badge ${isSolid ? 'solid-badge' : 'ombre-badge'}`;
      b.id = `badge-frac-${flower.name.replace(/ /g, '_')}-${v}`;

      const count = getCounter(flower.name, v);
      b.textContent = `${count}/${COLORS.length}`;
      if (count > 0) b.classList.add('has-count');

      td.appendChild(b);
      fracRow.appendChild(td);
    });
  });
  tfoot.appendChild(fracRow);
}

// ── Hybrid Modal ──────────────────────────────────────────────
let _hybridFlower = null;
let _hybridPattern = null;

function openHybridModal(flower) {
  _hybridFlower = flower;
  _hybridPattern = currentTab;

  const modal  = document.getElementById('hybrid-modal');
  const title  = document.getElementById('hybrid-modal-title');
  const sub    = document.getElementById('hybrid-modal-subtitle');
  const icon   = document.getElementById('hybrid-modal-icon');

  const patLabel = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
  title.textContent = `${flower.name} — ${patLabel} Hybrids`;
  sub.textContent   = 'Primary Color × Pattern Color combinations';

  const imgName = flower.name.replace(/ /g, '_') + '.png';
  icon.src = `assets/flowers/${imgName}`;
  icon.onerror = () => { icon.style.display = 'none'; };
  icon.style.display = '';

  buildHybridGrid(flower, currentTab);
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeHybridModal() {
  const modal = document.getElementById('hybrid-modal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
  _hybridFlower = null;
  _hybridPattern = null;
}


// Syncs a regular-format state key back to any matching visible DOM checkbox
function updateLinkedCheckboxInDOM(stateKey, isChecked) {
  // Regular key format: "{flower}::c{N}::{color}::{variant}"
  const parts = stateKey.split('::');
  if (parts.length !== 4 || !parts[1].startsWith('c')) return;
  const flowerName = parts[0];
  const colorIdx   = parts[1].slice(1);
  const variant    = parts[3];
  try {
    const cb = document.querySelector(
      `input[data-flower-name="${flowerName}"][data-color-idx="${colorIdx}"][data-variant="${variant}"]`
    );
    if (cb && cb.checked !== isChecked) cb.checked = isChecked;
  } catch (_) {}
}

function updateHybridCounter(flower, patternId) {
  let count = 0;
  const total = COLORS.length * COLORS.length;

  COLORS.forEach((rowColor, ri) => {
      COLORS.forEach((__, ci) => {
        const isDiag  = ri === ci;
        const colColor = COLORS[ci];
        
        let isLinkedToPattern = false;
        if (patternId === 'ombre' && rowColor.name === 'White') {
          isLinkedToPattern = colColor.name === 'Pink';
        } else {
          isLinkedToPattern = colColor.name === 'White';
        }

        let checked = false;
  
        if (isDiag && isLinkedToPattern) {
          // top-left: count if EITHER solid OR pattern is checked
          checked = STATE[makeKey(flower.name, ri, rowColor.name, 'solid')]    === true
                 || STATE[makeKey(flower.name, ri, rowColor.name, patternId)]  === true;
        } else if (isDiag) {
          checked = STATE[makeKey(flower.name, ri, rowColor.name, 'solid')] === true;
        } else if (isLinkedToPattern) {
          checked = STATE[makeKey(flower.name, ri, rowColor.name, patternId)] === true;
        } else {
          checked = STATE[makeHybridKey(flower.name, patternId, ri, ci)] === true;
        }

      if (checked) count++;
    });
  });

  const el = document.getElementById('hybrid-counter-text');
  if (el) el.textContent = `${count} / ${total} hybrids tracked`;
}

function buildHybridGrid(flower, patternId) {
  const thead = document.getElementById('hybrid-thead');
  const tbody = document.getElementById('hybrid-tbody');
  thead.innerHTML = '';
  tbody.innerHTML = '';

  // ── Determine Column Order (White first) ──────────────────────
  const whiteIdx = COLORS.findIndex(c => c.name === 'White');
  const colIndices = [];
  if (whiteIdx !== -1) colIndices.push(whiteIdx);
  COLORS.forEach((_, i) => { if (i !== whiteIdx) colIndices.push(i); });

  // ── Column headers ────────────────────────────────────────────
  const headerRow = document.createElement('tr');

  const corner = document.createElement('th');
  corner.className = 'hybrid-corner-cell';
  corner.innerHTML = `<span class="hybrid-axis-label">Primary ↓<br>Pattern →</span>`;
  headerRow.appendChild(corner);

  colIndices.forEach((ci, visualColIdx) => {
    const col = COLORS[ci];
    const isFirst = visualColIdx === 0;
    const th = document.createElement('th');
    th.className = `hybrid-col-header${isFirst ? ' linked-pattern-header' : ''}`;
    const capitalizedPatternForHeader = patternId.charAt(0).toUpperCase() + patternId.slice(1);
    th.title = isFirst
      ? `${col.name} — Col 1 is synced with the ${capitalizedPatternForHeader} tab`
      : col.name;
    th.innerHTML = `<div class="hybrid-swatch-dot" style="background:${col.swatch}"></div>`;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // ── Body rows ─────────────────────────────────────────────────
  const CHECK_SVG = `<svg width="12" height="12" viewBox="0 0 14 14" fill="none"
    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="2,7 5.5,11 12,3"/></svg>`;

  COLORS.forEach((rowColor, ri) => {
    const tr = document.createElement('tr');

    // Row header
    const rh = document.createElement('td');
    rh.className = 'hybrid-row-header';
    rh.style.background = rowColor.swatch;
    rh.innerHTML = `<span class="hybrid-row-label">${rowColor.name}</span>`;
    tr.appendChild(rh);

    colIndices.forEach((ci, visualColIdx) => {
      const isDiag  = ri === ci;
      const colColor = COLORS[ci];
      
      let isLinkedToPattern = false;
      if (patternId === 'ombre' && rowColor.name === 'White') {
        isLinkedToPattern = colColor.name === 'Pink';
      } else {
        isLinkedToPattern = colColor.name === 'White';
      }

      // ── Resolve state key(s) and current checked value ────────
      let primaryKey, secondaryKey = null, checked;

      if (isDiag && isLinkedToPattern) {
        // top-left corner: linked to BOTH solid AND pattern tab
        primaryKey   = makeKey(flower.name, ri, rowColor.name, 'solid');
        secondaryKey = makeKey(flower.name, ri, rowColor.name, patternId);
        checked = STATE[primaryKey] === true || STATE[secondaryKey] === true;
      } else if (isDiag) {
        // diagonal (non-first-col): linked to Solid (Main tab)
        primaryKey = makeKey(flower.name, ri, rowColor.name, 'solid');
        checked = STATE[primaryKey] === true;
      } else if (isLinkedToPattern) {
        // linked to pattern tab checkbox
        primaryKey = makeKey(flower.name, ri, rowColor.name, patternId);
        checked = STATE[primaryKey] === true;
      } else {
        // all other cells: standalone hybrid key
        primaryKey = makeHybridKey(flower.name, patternId, ri, ci);
        checked = STATE[primaryKey] === true;
      }

      // ── Build cell ────────────────────────────────────────────
      const td = document.createElement('td');
      let cellClass = 'hybrid-cell';
      if (isDiag)  cellClass += ' linked-solid';
      if (isLinkedToPattern) cellClass += ' linked-pattern';
      if (checked) cellClass += ' is-checked';
      td.className = cellClass;
      const capitalizedPattern = patternId.charAt(0).toUpperCase() + patternId.slice(1);
      td.title = `${rowColor.name} && ${colColor.name}${isDiag ? ' (Solid)' : isLinkedToPattern ? ` (${capitalizedPattern})` : ''}`;

      const label = document.createElement('label');
      label.className = 'hybrid-check-wrapper';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = checked;

      const box = document.createElement('span');
      box.className = 'hybrid-box';
      if (checked) {
        box.style.background = rowColor.swatch;
        box.innerHTML = CHECK_SVG;
      }

      // Capture loop vars for the async closure
      const _pk     = primaryKey;
      const _sk     = secondaryKey;
      const _swatch = rowColor.swatch;

      input.addEventListener('change', async function () {
        const isNowChecked = this.checked;

        async function applyKey(k) {
          if (isNowChecked) STATE[k] = true;
          else delete STATE[k];
          await window.trackerAPI.setState(k, isNowChecked);
          updateLinkedCheckboxInDOM(k, isNowChecked); // sync to main table DOM
        }

        await applyKey(_pk);
        if (_sk) await applyKey(_sk);

        if (isNowChecked) {
          td.classList.add('is-checked');
          box.style.background = _swatch;
          box.innerHTML = CHECK_SVG;
        } else {
          td.classList.remove('is-checked');
          box.style.background = '';
          box.innerHTML = '';
        }

        updateCounterUI();
        updateHybridCounter(flower, patternId);
      });

      label.appendChild(input);
      label.appendChild(box);
      td.appendChild(label);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  updateHybridCounter(flower, patternId);
}



// ── Event handler ─────────────────────────────────────────────
async function onCheckChange(e) {
  const input = e.target;
  const flower = input.dataset.flowerName;
  const ci = parseInt(input.dataset.colorIdx, 10);
  const color = input.dataset.colorName;
  const variant = input.dataset.variant;
  const checked = input.checked;

  const key = makeKey(flower, ci, color, variant);

  // Persist via Electron IPC
  await window.trackerAPI.setState(key, checked);

  // Update local state mirror
  if (checked) {
    STATE[key] = true;
  } else {
    delete STATE[key];
  }

  // Auto-check solid variant if checking a native pattern
  if (checked && variant !== 'solid') {
    const flowerObj = ALL_FLOWERS.find(f => f.name === flower);
    if (flowerObj && flowerObj.nativePattern === variant) {
      const solidKey = makeKey(flower, ci, color, 'solid');
      if (!STATE[solidKey]) {
        STATE[solidKey] = true;
        await window.trackerAPI.setState(solidKey, true);

        // Update the UI checkbox if it's currently on screen
        const solidInput = document.querySelector(`input[data-flower-name="${flower.replace(/"/g, '\\"')}"][data-color-idx="${ci}"][data-variant="solid"]`);
        if (solidInput) {
          solidInput.checked = true;
        }
      }
    }
  }

  // Update counters directly on screen
  updateCounterUI();
}

// ── Toolbar button bindings ───────────────────────────────────
function bindToolbar() {
  document.getElementById('btn-open-config').addEventListener('click', async () => {
    const ok = await window.trackerAPI.openConfig();
    const cfgPath = await window.trackerAPI.getConfigPath();
    if (ok) showNotice(
      `Opened data.json — ${cfgPath}   ·   After saving, click Reload ↺ to apply changes.`
    );
  });

  document.getElementById('btn-reload').addEventListener('click', () => {
    window.trackerAPI.reload();
  });

  document.getElementById('btn-reset').addEventListener('click', async () => {
    const didReset = await window.trackerAPI.resetAll();
    if (didReset) {
      STATE = {};
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
      updateCounterUI();
    }
  });

  document.getElementById('notice-dismiss').addEventListener('click', () => {
    document.getElementById('config-notice').style.display = 'none';
  });

  // ── Hybrid modal close bindings ────────────────────────────
  document.getElementById('hybrid-modal-close').addEventListener('click', closeHybridModal);
  document.getElementById('hybrid-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeHybridModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeHybridModal();
  });
}

function showNotice(text) {
  document.getElementById('config-notice-text').textContent = text;
  document.getElementById('config-notice').style.display = 'flex';
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
  const loadingEl = document.getElementById('loading-screen');
  const errorEl = document.getElementById('error-screen');
  const mainEl = document.getElementById('main-content');

  try {
    const [config, savedState] = await Promise.all([
      window.trackerAPI.getConfig(),
      window.trackerAPI.getState(),
    ]);

    ALL_FLOWERS = config.flowers || [];
    PATTERNS = config.patterns || [];
    COLORS = config.colors || [];
    STATE = savedState || {};

    if (ALL_FLOWERS.length === 0 || COLORS.length === 0) {
      throw new Error('data.json has no flowers or colors. Please check the file and reload.');
    }

    // Show config path in subtitle
    const cfgPath = await window.trackerAPI.getConfigPath();
    document.getElementById('subtitle-path').textContent = `Config: ${cfgPath}`;

    buildTabs();
    clearTable();
    buildHeaders();
    buildBody();
    buildFooter();
    updateCounterUI();
    bindToolbar();

    loadingEl.style.display = 'none';
    mainEl.style.display = '';

  } catch (err) {
    console.error('[tracker] Init failed:', err);
    loadingEl.style.display = 'none';
    errorEl.style.display = '';
    document.getElementById('error-msg').textContent = err.message;
    document.getElementById('btn-retry').addEventListener('click', () => {
      window.trackerAPI.reload();
    });
  }
}

init();
