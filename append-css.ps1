$css = @"
/* ===========================
   History Sidebar Layout
   =========================== */
.content-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-sidebar {
  width: 320px;
  background: var(--bg-card);
  border-left: 1px solid var(--border-subtle);
  display: none;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.history-sidebar.open {
  display: flex;
  transform: translateX(0);
}

.history-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--accent-2);
}

.history-close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.2rem;
}

.history-close-btn:hover {
  color: var(--text-primary);
}

.history-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.history-month-group {
  margin-bottom: 24px;
}

.history-month-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
  letter-spacing: 0.05em;
  position: sticky;
  top: 0;
  background: var(--bg-card);
  padding: 4px 0;
  z-index: 1;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-row-alt);
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.history-item:hover {
  border-color: var(--border-glow);
  background: var(--bg-card-hover);
}

.history-item-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.history-item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.history-item-name {
  font-size: 0.95rem;
  font-weight: 500;
}

.history-item-variant {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.history-item-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}
"@

Add-Content -Path "style.css" -Value $css
Write-Host "CSS appended."
