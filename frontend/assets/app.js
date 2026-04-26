// LayerSync — shared prototype interactivity.
// Vanilla JS, no deps. Each page can opt-in to handlers via data-attributes.

(function () {
  // --- Toast --------------------------------------------------------------
  function ensureToastHost() {
    let host = document.getElementById('toast-host');
    if (!host) { host = document.createElement('div'); host.id = 'toast-host'; document.body.appendChild(host); }
    return host;
  }
  window.toast = function (msg, ms = 2000) {
    const host = ensureToastHost();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span>✓</span><span>' + msg + '</span>';
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = 'all .2s ease'; }, ms - 200);
    setTimeout(() => el.remove(), ms);
  };

  // --- Sidebar (v2) navigation: switch sections without reloading -------
  document.addEventListener('click', (e) => {
    const navRow = e.target.closest('[data-section]');
    if (!navRow) return;
    const section = navRow.dataset.section;
    document.querySelectorAll('[data-section]').forEach(n => n.classList.toggle('active', n === navRow));
    document.querySelectorAll('[data-section-content]').forEach(c => {
      c.hidden = c.dataset.sectionContent !== section;
    });
  });

  // --- Search filter (filter project cards by name) ---------------------
  document.querySelectorAll('[data-search]').forEach(input => {
    input.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      document.querySelectorAll('[data-searchable]').forEach(card => {
        const name = (card.dataset.searchable || card.textContent).toLowerCase();
        card.hidden = q && !name.includes(q);
      });
    });
  });

  // --- Modal open/close + overlay click + Esc ---------------------------
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-modal]');
    if (opener) {
      const id = opener.dataset.openModal;
      const m = document.getElementById(id);
      if (m) { m.hidden = false; document.body.style.overflow = 'hidden'; }
    }
    const closer = e.target.closest('[data-close-modal]');
    if (closer) {
      const m = closer.closest('.modal-overlay');
      if (m) { m.hidden = true; document.body.style.overflow = ''; }
    }
    // overlay click
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
      e.target.hidden = true;
      document.body.style.overflow = '';
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not([hidden])').forEach(m => { m.hidden = true; });
      document.querySelectorAll('.slide-panel.is-open').forEach(p => p.classList.remove('is-open'));
      document.body.style.overflow = '';
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      const s = document.querySelector('[data-search]');
      if (s) { e.preventDefault(); s.focus(); }
    }
  });

  // --- Switches (toggle .on) -------------------------------------------
  document.addEventListener('click', (e) => {
    const sw = e.target.closest('.switch[data-toggle]');
    if (sw) {
      sw.classList.toggle('on');
      if (sw.dataset.toast) window.toast(sw.classList.contains('on') ? sw.dataset.toast + ' on' : sw.dataset.toast + ' off');
    }
  });

  // --- Generic checkbox toggle -----------------------------------------
  document.addEventListener('click', (e) => {
    const cb = e.target.closest('.checkbox[data-check]');
    if (cb) {
      cb.classList.toggle('checked');
      if (cb.classList.contains('checked')) {
        cb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>';
      } else {
        cb.innerHTML = '';
      }
    }
  });

  // --- Pill / segmented active state -----------------------------------
  document.querySelectorAll('[data-group]').forEach(group => {
    group.addEventListener('click', (e) => {
      const item = e.target.closest('[data-group-item]');
      if (!item || !group.contains(item)) return;
      [...group.querySelectorAll('[data-group-item]')].forEach(i => i.classList.toggle('active', i === item));
      // optional filter
      const tag = item.dataset.groupItem;
      const filterAttr = group.dataset.groupFilter;
      if (filterAttr) {
        document.querySelectorAll('[' + filterAttr + ']').forEach(card => {
          const tags = (card.getAttribute(filterAttr) || '').split(',').map(s => s.trim());
          card.hidden = tag !== 'all' && !tags.includes(tag);
        });
      }
    });
  });

  // --- Toast on click -------------------------------------------------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-toast]');
    if (t && !t.hasAttribute('data-toggle')) window.toast(t.dataset.toast);
  });

  // --- Slide-in panel toggles -----------------------------------------
  document.addEventListener('click', (e) => {
    const trig = e.target.closest('[data-toggle-panel]');
    if (trig) {
      const target = document.getElementById(trig.dataset.togglePanel);
      if (target) target.classList.toggle('is-open');
    }
    const closeP = e.target.closest('[data-close-panel]');
    if (closeP) {
      const p = closeP.closest('.slide-panel');
      if (p) p.classList.remove('is-open');
    }
  });

  // --- Tab/scrollto for settings nav ----------------------------------
  document.querySelectorAll('[data-scrollto]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tgt = document.querySelector(link.dataset.scrollto);
      if (tgt) tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('[data-scrollto]').forEach(n => n.classList.toggle('active', n === link));
    });
  });

  // --- Active sidebar from current path -------------------------------
  const currentPath = location.pathname.split('/').pop();
  document.querySelectorAll('[data-href]').forEach(el => {
    if (el.dataset.href === currentPath) el.classList.add('active');
    el.addEventListener('click', () => location.href = el.dataset.href);
  });

  // --- Collapsible sidebar ---------------------------------------------
  (function() {
    const sidebar = document.querySelector('.sidebar-v2');
    const app     = document.querySelector('.app-v2');
    if (!sidebar || !app) return;

    sidebar.style.position = 'relative';

    // Mark pinned group and its following spacer so CSS can hide them when collapsed
    const pinnedList = sidebar.querySelector('.pin-sub-list');
    if (pinnedList) {
      pinnedList.parentElement.classList.add('pinned-group');
      const spacer = pinnedList.parentElement.nextElementSibling;
      if (spacer) spacer.classList.add('pinned-spacer');
    }

    // Attach data-tip to every nav/footer row from its text content
    sidebar.querySelectorAll('.nav-row, .footer-row').forEach(row => {
      const label = [...row.childNodes]
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent.trim())
        .filter(Boolean)
        .join('');
      if (label) row.dataset.tip = label;
    });

    // Inject toggle button
    const btn = document.createElement('button');
    btn.className = 'sidebar-toggle-btn';
    btn.title = 'Toggle sidebar';
    sidebar.appendChild(btn);

    const iconCollapse = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 18l-6-6 6-6"/></svg>';
    const iconExpand   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 18l6-6-6-6"/></svg>';

    function applyState(collapsed) {
      sidebar.classList.toggle('collapsed', collapsed);
      app.classList.toggle('sidebar-collapsed', collapsed);
      btn.innerHTML = collapsed ? iconExpand : iconCollapse;
    }

    applyState(localStorage.getItem('sidebarCollapsed') === '1');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const next = !sidebar.classList.contains('collapsed');
      applyState(next);
      localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
    });

    // Tooltip for collapsed icon-only mode
    const tip = document.createElement('div');
    tip.className = 'sidebar-tip';
    document.body.appendChild(tip);

    sidebar.addEventListener('mouseover', (e) => {
      if (!sidebar.classList.contains('collapsed')) return;
      const row = e.target.closest('.nav-row[data-tip], .footer-row[data-tip]');
      if (!row) return;
      const rect = row.getBoundingClientRect();
      tip.textContent = row.dataset.tip;
      tip.style.left = (rect.right + 8) + 'px';
      tip.style.top  = (rect.top + rect.height / 2) + 'px';
      tip.classList.add('visible');
    });
    sidebar.addEventListener('mouseleave', () => tip.classList.remove('visible'));
    sidebar.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget || !e.relatedTarget.closest('.nav-row, .footer-row')) {
        tip.classList.remove('visible');
      }
    });
  })();
})();
