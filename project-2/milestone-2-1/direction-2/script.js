(function () {
  "use strict";

  const ICON_BASE = "../../../assets/images/project-2/";
  const cities = (window.WANDERER_DATA && window.WANDERER_DATA.cities) || [];

  const els = {
    atlasMenuToggle: document.getElementById("atlasMenuToggle"),
    atlasFilterOverlay: document.getElementById("atlasFilterOverlay"),
    atlasFilterOverlayClose: document.getElementById("atlasFilterOverlayClose"),
    atlasFilterThemes: document.getElementById("atlasFilterThemes"),
    atlasFilterMotifs: document.getElementById("atlasFilterMotifs"),
    atlasActiveFilters: document.getElementById("atlasActiveFilters"),
    atlasGrid: document.getElementById("atlasGrid"),
    atlasModal: document.getElementById("atlasModal"),
    atlasModalBackdrop: document.getElementById("atlasModalBackdrop"),
    atlasModalContent: document.querySelector(".atlas-modal-content"),
    atlasModalClose: document.getElementById("atlasModalClose"),
    atlasModalBody: document.getElementById("atlasModalBody"),
  };

  let state = {
    selectedTheme: null,
    selectedMotifs: [],
  };

  function getTheme(subtitle) {
    if (!subtitle) return "";
    return subtitle.replace(/\s*\d+\s*$/, "").trim();
  }

  function getThemes() {
    const set = new Set();
    cities.forEach((c) => {
      const t = getTheme(c.subtitle);
      if (t) set.add(t);
    });
    return Array.from(set).sort();
  }

  function motifName(m) {
    return typeof m === "string" ? m : (m && m.name) || "";
  }

  function getMotifs() {
    const set = new Set();
    cities.forEach((c) => {
      (c.motifs || []).forEach((m) => {
        const name = motifName(m);
        if (name) set.add(name);
      });
    });
    return Array.from(set).sort();
  }

  function filterCities() {
    return cities.filter((city) => {
      if (state.selectedTheme && getTheme(city.subtitle) !== state.selectedTheme) return false;
      if (state.selectedMotifs.length) {
        const cityMotifs = (city.motifs || []).map(motifName);
        const hasAll = state.selectedMotifs.every((m) => cityMotifs.includes(m));
        if (!hasAll) return false;
      }
      return true;
    });
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function openOverlay() {
    if (els.atlasFilterOverlay) {
      els.atlasFilterOverlay.classList.add("open");
      els.atlasFilterOverlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
  }

  function closeOverlay() {
    if (els.atlasFilterOverlay) {
      els.atlasFilterOverlay.classList.remove("open");
      els.atlasFilterOverlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  }

  function renderFilterOverlay() {
    const themes = getThemes();
    const motifs = getMotifs();

    if (els.atlasFilterThemes) {
      els.atlasFilterThemes.innerHTML = "";
      themes.forEach((t) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "atlas-filter-theme" + (state.selectedTheme === t ? " active" : "");
        btn.textContent = t;
        btn.addEventListener("click", () => {
          state.selectedTheme = state.selectedTheme === t ? null : t;
          renderFilterOverlay();
          renderActiveFilters();
          renderGrid();
        });
        els.atlasFilterThemes.appendChild(btn);
      });
    }

    if (els.atlasFilterMotifs) {
      els.atlasFilterMotifs.innerHTML = "";
      motifs.forEach((m) => {
        const label = document.createElement("label");
        label.className = "atlas-filter-motif";
        const checked = state.selectedMotifs.includes(m);
        label.innerHTML = `<input type="checkbox" ${checked ? "checked" : ""} data-motif="${escapeHtml(m)}" /> ${escapeHtml(m)}`;
        label.querySelector("input").addEventListener("change", (e) => {
          if (e.target.checked) {
            state.selectedMotifs.push(m);
          } else {
            state.selectedMotifs = state.selectedMotifs.filter((x) => x !== m);
          }
          renderActiveFilters();
          renderGrid();
        });
        els.atlasFilterMotifs.appendChild(label);
      });
    }
  }

  function renderActiveFilters() {
    if (!els.atlasActiveFilters) return;
    els.atlasActiveFilters.innerHTML = "";

    if (state.selectedTheme) {
      const chip = document.createElement("span");
      chip.className = "atlas-filter-chip";
      chip.innerHTML = `${escapeHtml(state.selectedTheme)} <button type="button" class="atlas-filter-chip-remove" aria-label="Remove theme filter">×</button>`;
      chip.querySelector("button").addEventListener("click", () => {
        state.selectedTheme = null;
        renderFilterOverlay();
        renderActiveFilters();
        renderGrid();
      });
      els.atlasActiveFilters.appendChild(chip);
    }

    state.selectedMotifs.forEach((m) => {
      const chip = document.createElement("span");
      chip.className = "atlas-filter-chip";
      chip.innerHTML = `${escapeHtml(m)} <button type="button" class="atlas-filter-chip-remove" aria-label="Remove motif filter">×</button>`;
      chip.querySelector("button").addEventListener("click", () => {
        state.selectedMotifs = state.selectedMotifs.filter((x) => x !== m);
        renderFilterOverlay();
        renderActiveFilters();
        renderGrid();
      });
      els.atlasActiveFilters.appendChild(chip);
    });
  }

  function renderGrid() {
    const filtered = filterCities();
    if (!els.atlasGrid) return;

    els.atlasGrid.innerHTML = "";
    if (filtered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "atlas-no-results";
      empty.textContent = "No results";
      els.atlasGrid.appendChild(empty);
      return;
    }
    const FALLBACK_GRADIENT = { start: "#1e293b", end: "#0f172a" };
    const defaultBg = "rgba(255, 255, 255, 0.06)";
    filtered.forEach((city) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "atlas-card";
      if (city.icon) card.setAttribute("data-icon", "1");
      const g = city.gradient || FALLBACK_GRADIENT;
      const gradientBg = `linear-gradient(180deg, ${g.start}, ${g.end})`;
      const theme = getTheme(city.subtitle);
      const iconSrc = city.icon ? ICON_BASE + city.icon : "";
      card.innerHTML = `
        ${iconSrc ? `<img class="atlas-card-icon" src="${escapeHtml(iconSrc)}" alt="" onerror="this.style.display='none'" />` : ""}
        <h3 class="atlas-card-name">${escapeHtml(city.name)}</h3>
        <p class="atlas-card-theme">${escapeHtml(theme)}</p>
      `;
      card.addEventListener("mouseenter", () => { card.style.background = gradientBg; });
      card.addEventListener("mouseleave", () => { card.style.background = defaultBg; });
      card.addEventListener("click", () => showModal(city));
      els.atlasGrid.appendChild(card);
    });
  }

  function showModal(city) {
    if (!els.atlasModal || !els.atlasModalBody) return;
    const g = city.gradient || { start: "#1e293b", end: "#0f172a" };
    if (els.atlasModalContent) {
      els.atlasModalContent.style.background = `linear-gradient(180deg, ${g.start}, ${g.end})`;
    }
    const theme = getTheme(city.subtitle);
    const iconSrc = city.icon ? ICON_BASE + city.icon : "";
    els.atlasModalBody.innerHTML = `
      ${iconSrc ? `<img class="atlas-card-icon" src="${escapeHtml(iconSrc)}" alt="" style="margin-bottom:0.5rem" onerror="this.style.display='none'" />` : ""}
      <h2 class="modal-title">${escapeHtml(city.name)}</h2>
      <p class="modal-theme">${escapeHtml(theme)}</p>
      <p class="modal-excerpt">${escapeHtml(city.excerpt || "")}</p>
      ${(city.motifs || []).length ? `
        <p class="modal-motifs">MOTIFS PRESENT</p>
        <div class="modal-motif-tags">
          ${(city.motifs || []).map((m) => `<span class="modal-motif-tag">${escapeHtml(motifName(m))}</span>`).join("")}
        </div>
      ` : ""}
    `;
    els.atlasModal.classList.add("open");
    els.atlasModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (els.atlasModal) {
      els.atlasModal.classList.remove("open");
      els.atlasModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  }

  function init() {
    renderFilterOverlay();
    renderActiveFilters();
    renderGrid();

    if (els.atlasMenuToggle) {
      els.atlasMenuToggle.addEventListener("click", () => {
        renderFilterOverlay();
        openOverlay();
      });
    }
    if (els.atlasFilterOverlayClose) {
      els.atlasFilterOverlayClose.addEventListener("click", closeOverlay);
    }
    if (els.atlasFilterOverlay) {
      els.atlasFilterOverlay.addEventListener("click", (e) => {
        if (e.target === els.atlasFilterOverlay) closeOverlay();
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (els.atlasFilterOverlay && els.atlasFilterOverlay.classList.contains("open")) {
          closeOverlay();
        } else if (els.atlasModal && els.atlasModal.classList.contains("open")) {
          closeModal();
        }
      }
    });
    if (els.atlasModalBackdrop) {
      els.atlasModalBackdrop.addEventListener("click", closeModal);
    }
    if (els.atlasModalClose) {
      els.atlasModalClose.addEventListener("click", closeModal);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
