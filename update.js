const fs = require('fs');
let code = fs.readFileSync('tracker.js', 'utf8');

// Replace state checking
code = code.replace(/STATE\[(.*?)\] === true/g, '!!STATE[$1]');
code = code.replace(/Object\.values\(STATE\)\.filter\(v => v === true\)/g, 'Object.values(STATE).filter(v => !!v)');

// Replace state setting
code = code.replace(/STATE\[(.*?)\] = true;/g, 'STATE[$1] = Date.now();');
code = code.replace(/window\.trackerAPI\.setState\((.*?), true\);/g, 'window.trackerAPI.setState($1, Date.now());');
code = code.replace(/await window\.trackerAPI\.setState\((.*?), true\);/g, 'await window.trackerAPI.setState($1, Date.now());');

// Add History sidebar logic
const historyLogic = `

// ── History Sidebar ───────────────────────────────────────────
function getHistoryItems() {
  const items = [];
  for (const [key, value] of Object.entries(STATE)) {
    if (value && typeof value === 'number') {
      // Parse key: "FlowerName::cN::ColorName::variant" or hybrid
      const parts = key.split('::');
      if (parts.length >= 4) {
        items.push({ key, ts: value, parts });
      }
    }
  }
  // Sort descending by timestamp
  return items.sort((a, b) => b.ts - a.ts);
}

function renderHistory() {
  const container = document.getElementById('history-content');
  if (!container) return;

  const items = getHistoryItems();
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No recent history.</p>';
    return;
  }

  // Group by month
  const groups = {};
  items.forEach(item => {
    const d = new Date(item.ts);
    const monthYear = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groups[monthYear]) groups[monthYear] = [];
    groups[monthYear].push(item);
  });

  for (const [month, groupItems] of Object.entries(groups)) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'history-month-group';

    const title = document.createElement('div');
    title.className = 'history-month-title';
    title.textContent = month;
    groupDiv.appendChild(title);

    groupItems.forEach(item => {
      const { parts, ts } = item;
      const flowerName = parts[0];
      const isHybrid = parts[1] === 'xh';
      
      let colorText = '';
      let variantText = '';

      if (isHybrid) {
        const patternId = parts[2];
        const rowC = parts[3].replace('r', '');
        const colC = parts[4].replace('c', '');
        colorText = \`R\${rowC} × C\${colC}\`;
        variantText = \`Hybrid (\${patternId})\`;
      } else {
        colorText = parts[2];
        variantText = parts[3];
      }

      const safeName = flowerName.replace(/ /g, '_');
      const imgPath = \`assets/flowers/\${safeName}.png\`;

      const d = new Date(ts);
      const timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const itemDiv = document.createElement('div');
      itemDiv.className = 'history-item';
      itemDiv.innerHTML = \`
        <img src="\${imgPath}" class="history-item-icon" alt="\${flowerName}" onerror="this.style.display='none'">
        <div class="history-item-details">
          <div class="history-item-name">\${flowerName} <span style="font-weight: normal; color: var(--text-secondary);">(\${colorText})</span></div>
          <div class="history-item-variant">\${variantText}</div>
          <div class="history-item-time">\${timeStr}</div>
        </div>
      \`;
      groupDiv.appendChild(itemDiv);
    });

    container.appendChild(groupDiv);
  }
}

// Hook up history button
document.addEventListener('DOMContentLoaded', () => {
  const btnHistory = document.getElementById('btn-history');
  const historyClose = document.getElementById('history-close-btn');
  const sidebar = document.getElementById('history-sidebar');

  if (btnHistory && sidebar) {
    btnHistory.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (sidebar.classList.contains('open')) {
        renderHistory();
      }
    });
  }

  if (historyClose && sidebar) {
    historyClose.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  }
});
`;

code = code + historyLogic;

// Also need to trigger renderHistory() after state changes
code = code.replace(/await window\.trackerAPI\.setState\((.*?)\);/g, 'await window.trackerAPI.setState($1);\n  if (document.getElementById("history-sidebar")?.classList.contains("open")) renderHistory();');

fs.writeFileSync('tracker.js', code, 'utf8');
console.log('tracker.js updated.');
