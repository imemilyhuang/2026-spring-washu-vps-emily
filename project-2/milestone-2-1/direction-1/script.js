(function () {
  "use strict";

  const FALLBACK_GRADIENT = { start: "#E8E8E8", end: "#4A4A4A" };
  const ICON_BASE = "../../../assets/images/project-2/abstract-icons/";

  let cities = (window.WANDERER_DATA && window.WANDERER_DATA.cities) || [];
  let chapters = (window.WANDERER_CHAPTERS && window.WANDERER_CHAPTERS.chapters) || [];
  let currentIndex = 0;
  let currentChapterId = 1;
  let motifMap = {};
  let openAccordionId = null;

  const els = {
    splash: document.getElementById("splash"),
    splashEnter: document.getElementById("splashEnter"),
    chapterOverview: document.getElementById("chapter-overview"),
    chapterOverviewLogo: document.getElementById("chapterOverviewLogo"),
    chapterOverviewHeaderChapter: document.getElementById("chapterOverviewHeaderChapter"),
    chapterOverviewMenuToggle: document.getElementById("chapterOverviewMenuToggle"),
    chapterOverviewTitle: document.getElementById("chapterOverviewTitle"),
    chapterOverviewDesc: document.getElementById("chapterOverviewDesc"),
    chapterOverviewContinue: document.getElementById("chapterOverviewContinue"),
    cityView: document.getElementById("city-view"),
    cityLogo: document.getElementById("cityLogo"),
    cityHeaderChapter: document.getElementById("cityHeaderChapter"),
    menuToggle: document.getElementById("menuToggle"),
    cityTitle: document.getElementById("cityTitle"),
    citySubtitle: document.getElementById("citySubtitle"),
    cityIcon: document.getElementById("cityIcon"),
    cityExcerpt: document.getElementById("cityExcerpt"),
    motifTags: document.getElementById("motifTags"),
    navPrev: document.getElementById("navPrev"),
    navNext: document.getElementById("navNext"),
    navOverlay: document.getElementById("navOverlay"),
    navOverlayLogo: document.getElementById("navOverlayLogo"),
    navOverlayTitle: document.getElementById("navOverlayTitle"),
    navOverlayList: document.getElementById("navOverlayList"),
    menuClose: document.getElementById("menuClose"),
    motifView: document.getElementById("motif-view"),
    motifViewBack: document.getElementById("motifViewBack"),
    motifViewTitle: document.getElementById("motifViewTitle"),
    motifCards: document.getElementById("motifCards"),
  };

  function motifName(m) {
    return typeof m === "string" ? m : (m && m.name) || "";
  }

  function buildMotifMap() {
    motifMap = {};
    cities.forEach((city) => {
      (city.motifs || []).forEach((m) => {
        const name = motifName(m);
        if (!name) return;
        if (!motifMap[name]) motifMap[name] = [];
        motifMap[name].push({ city, motif: m });
      });
    });
  }

  function getChapterForCity(cityId) {
    for (const ch of chapters) {
      if ((ch.cities || []).some((c) => c.id === cityId)) return ch;
    }
    return chapters[0];
  }

  function getChapterById(id) {
    return chapters.find((c) => c.id === id) || chapters[0];
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const screen = document.getElementById(id);
    if (screen) screen.classList.add("active");
  }

  function showSplash() {
    showScreen("splash");
    document.body.classList.remove("nav-open");
  }

  function showChapterOverview(chapter, targetIndex) {
    currentChapterId = chapter ? chapter.id : 1;
    const ch = getChapterById(currentChapterId);
    if (els.chapterOverviewHeaderChapter) els.chapterOverviewHeaderChapter.textContent = ch.title;
    els.chapterOverviewTitle.textContent = ch.title;
    els.chapterOverviewDesc.textContent = ch.text || "";
    const isEnd = ch.id === 5;
    els.chapterOverviewContinue.textContent = isEnd ? "RESTART" : "CONTINUE →";
    els.chapterOverviewContinue.onclick = () => {
      if (isEnd) {
        showSplash();
        return;
      }
      if (typeof targetIndex === "number" && targetIndex >= 0) {
        currentIndex = targetIndex;
        showCityView();
      } else {
        const firstCity = (ch.cities || [])[0];
        if (firstCity) {
          const idx = cities.findIndex((c) => c.id === firstCity.id);
          if (idx >= 0) {
            currentIndex = idx;
            showCityView();
          }
        } else {
          showCityView();
        }
      }
    };
    showScreen("chapter-overview");
  }

  function showCityView() {
    const city = cities[currentIndex];
    if (!city) return;

    const ch = getChapterForCity(city.id);
    currentChapterId = ch.id;

    document.body.style.setProperty("--gradient-start", (city.gradient || FALLBACK_GRADIENT).start);
    document.body.style.setProperty("--gradient-end", (city.gradient || FALLBACK_GRADIENT).end);

    els.cityHeaderChapter.textContent = ch.title;
    els.cityTitle.textContent = city.name;
    els.citySubtitle.textContent = city.subtitle || "";
    els.cityExcerpt.textContent = city.excerpt || "";

    if (city.icon && els.cityIcon) {
      els.cityIcon.src = ICON_BASE + city.icon;
      els.cityIcon.alt = city.name;
      els.cityIcon.style.display = "";
      els.cityIcon.onerror = () => { els.cityIcon.style.display = "none"; };
    } else if (els.cityIcon) {
      els.cityIcon.style.display = "none";
    }

    els.motifTags.innerHTML = "";
    (city.motifs || []).forEach((motif) => {
      const name = motifName(motif);
      if (!name) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "motif-tag";
      btn.textContent = name;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        showMotifView(name);
      });
      els.motifTags.appendChild(btn);
    });

    els.navPrev.disabled = currentIndex <= 0;
    els.navNext.disabled = false;

    const excerptWrap = document.querySelector(".city-excerpt-wrap");
    if (excerptWrap) excerptWrap.scrollTop = 0;

    showScreen("city-view");
  }

  function showMotifView(motifName) {
    els.motifViewTitle.textContent = motifName;
    els.motifCards.innerHTML = "";

    const items = motifMap[motifName] || [];
    items.forEach(({ city, motif: m }) => {
      const quote = (m && m.quotes && m.quotes[0]) || "";
      const iconSrc = city.icon ? ICON_BASE + city.icon : "";
      const iconHtml = iconSrc
        ? `<img class="motif-card-icon" src="${escapeHtml(iconSrc)}" alt="" onerror="this.style.display='none'" />`
        : "";
      const card = document.createElement("button");
      card.type = "button";
      card.className = "motif-card";
      card.innerHTML = `
        ${iconHtml}
        <div class="motif-card-title">${escapeHtml(city.name)}</div>
        <p class="motif-card-quote splash-quote">${escapeHtml(quote)}</p>
      `;
      card.addEventListener("click", () => {
        const idx = cities.findIndex((c) => c.id === city.id);
        if (idx >= 0) {
          currentIndex = idx;
          showCityView();
        }
      });
      els.motifCards.appendChild(card);
    });

    showScreen("motif-view");
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function openNavOverlay() {
    els.navOverlayTitle.textContent = "Invisible Cities";
    document.body.classList.add("nav-open");
    els.navOverlay.classList.add("open");
    renderNavOverlay();
  }

  function closeNavOverlay() {
    els.navOverlay.classList.remove("open");
    document.body.classList.remove("nav-open");
  }

  function renderNavOverlay() {
    els.navOverlayList.innerHTML = "";
    openAccordionId = null;

    chapters.forEach((chapter) => {
      const accordion = document.createElement("div");
      accordion.className = "nav-accordion";
      accordion.dataset.chapterId = chapter.id;

      const header = document.createElement("button");
      header.type = "button";
      header.className = "nav-accordion-header";
      header.textContent = chapter.title;
      header.addEventListener("click", (e) => {
        e.stopPropagation();
        if (accordion.classList.contains("open")) {
          accordion.classList.remove("open");
        } else {
          document.querySelectorAll(".nav-accordion").forEach((a) => a.classList.remove("open"));
          accordion.classList.add("open");
        }
      });

      const body = document.createElement("div");
      body.className = "nav-accordion-body";

      const readLink = document.createElement("button");
      readLink.type = "button";
      readLink.className = "nav-read-chapter";
      readLink.textContent = "Read chapter →";
      readLink.addEventListener("click", (e) => {
        e.stopPropagation();
        showChapterOverview(getChapterById(chapter.id));
        closeNavOverlay();
      });

      const citiesWrap = document.createElement("div");
      citiesWrap.className = "nav-accordion-cities";

      (chapter.cities || []).forEach((ref) => {
        const idx = cities.findIndex((c) => c.id === ref.id);
        if (idx < 0) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "nav-city-link";
        btn.textContent = ref.name;
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          currentIndex = idx;
          showCityView();
          closeNavOverlay();
        });
        citiesWrap.appendChild(btn);
      });

      body.appendChild(readLink);
      body.appendChild(citiesWrap);
      accordion.appendChild(header);
      accordion.appendChild(body);
      els.navOverlayList.appendChild(accordion);
    });
  }

  function goPrev() {
    if (currentIndex <= 0) return;
    const city = cities[currentIndex - 1];
    const currCh = getChapterForCity(cities[currentIndex].id);
    const prevCh = getChapterForCity(city.id);
    if (prevCh.id !== currCh.id) {
      showChapterOverview(prevCh, currentIndex - 1);
    } else {
      currentIndex--;
      showCityView();
    }
  }

  function goNext() {
    if (currentIndex >= cities.length - 1) {
      const endChapter = chapters.find((c) => c.id === 5) || chapters[chapters.length - 1];
      if (endChapter) showChapterOverview(endChapter);
      return;
    }
    const nextCity = cities[currentIndex + 1];
    const currCh = getChapterForCity(cities[currentIndex].id);
    const nextCh = getChapterForCity(nextCity.id);
    if (nextCh.id !== currCh.id) {
      showChapterOverview(nextCh, currentIndex + 1);
    } else {
      currentIndex++;
      showCityView();
    }
  }

  function init() {
    buildMotifMap();
    showScreen("splash");

    const proceedFromSplash = () => {
      if (!els.splash) return;
      if (chapters.length > 0) {
        showChapterOverview(chapters[0]);
      } else {
        currentIndex = 0;
        showCityView();
      }
    };

    els.splashEnter.addEventListener("click", proceedFromSplash);

    els.cityLogo.addEventListener("click", showSplash);
    if (els.chapterOverviewLogo) els.chapterOverviewLogo.addEventListener("click", showSplash);
    els.navOverlayLogo.addEventListener("click", () => {
      closeNavOverlay();
      showSplash();
    });

    els.menuToggle.addEventListener("click", openNavOverlay);
    if (els.chapterOverviewMenuToggle) els.chapterOverviewMenuToggle.addEventListener("click", openNavOverlay);
    els.menuClose.addEventListener("click", closeNavOverlay);

    els.navPrev.addEventListener("click", goPrev);
    els.navNext.addEventListener("click", goNext);

    els.motifViewBack.addEventListener("click", () => showCityView());

    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && els.splash && els.splash.classList.contains("active")) proceedFromSplash();
      if (e.key === "Escape" && els.navOverlay.classList.contains("open")) closeNavOverlay();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
