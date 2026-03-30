(function () {
  "use strict";

  const FALLBACK_GRADIENT = { start: "#E8E8E8", end: "#4A4A4A" };
  const ICON_BASE = "../../assets/images/project-2/";

  let cities = (window.WANDERER_DATA && window.WANDERER_DATA.cities) || [];
  let chapters = (window.WANDERER_CHAPTERS && window.WANDERER_CHAPTERS.chapters) || [];
  let currentIndex = 0;
  let currentChapterId = 1;
  let motifMap = {};
  let openAccordionId = null;
  let slideDirection = null; // 'left' | 'right' for city view transition
  let navHistory = []; // stack of () => void — push when going forward, pop when pressing back
  let currentMotifName = null; // tracks which motif view is active
  let currentThemeName = null; // tracks which theme view is active
  let cityNavContext = null; // { type: 'motif'|'theme', name, indices: number[] } or null for full list

  function getCurrentScreenFn() {
    if (els.cityView && els.cityView.classList.contains("active")) {
      return () => { cityNavContext = null; showCityView(); };
    }
    if (els.chapterOverview && els.chapterOverview.classList.contains("active")) {
      return () => showChapterOverview(getChapterById(currentChapterId) || chapters[0]);
    }
    if (els.motifView && els.motifView.classList.contains("active") && currentMotifName) {
      return () => showMotifView(currentMotifName);
    }
    if (els.themeView && els.themeView.classList.contains("active") && currentThemeName) {
      return () => showThemeView(currentThemeName);
    }
    return () => showChapterOverview(getChapterById(currentChapterId) || chapters[0]);
  }

  function goBack() {
    const fn = navHistory.pop();
    if (fn) { fn(); } else { showChapterOverview(getChapterById(currentChapterId) || chapters[0]); }
  }

  const els = {
    splash: document.getElementById("splash"),
    splashEnter: document.getElementById("splashEnter"),
    chapterOverview: document.getElementById("chapter-overview"),
    chapterOverviewLogo: document.getElementById("chapterOverviewLogo"),
    chapterOverviewPrev: document.getElementById("chapterOverviewPrev"),
    chapterOverviewNext: document.getElementById("chapterOverviewNext"),
    chapterOverviewMenuToggle: document.getElementById("chapterOverviewMenuToggle"),
    chapterOverviewBreadcrumb: document.getElementById("chapterOverviewBreadcrumb"),
    chapterOverviewTitle: document.getElementById("chapterOverviewTitle"),
    chapterOverviewDesc: document.getElementById("chapterOverviewDesc"),
    chapterOverviewContinue: document.getElementById("chapterOverviewContinue"),
    chapterOverviewCitiesWrap: document.getElementById("chapterOverviewCitiesWrap"),
    cityView: document.getElementById("city-view"),
    cityLogo: document.getElementById("cityLogo"),
    cityBreadcrumb: document.getElementById("cityBreadcrumb"),
    menuToggle: document.getElementById("menuToggle"),
    cityTitle: document.getElementById("cityTitle"),
    citySubtitle: document.getElementById("citySubtitle"),
    cityIcon: document.getElementById("cityIcon"),
    cityExcerpt: document.getElementById("cityExcerpt"),
    motifTags: document.getElementById("motifTags"),
    navPrev: document.getElementById("navPrev"),
    navNext: document.getElementById("navNext"),
    cityBottomNavPrev: document.getElementById("cityBottomNavPrev"),
    cityBottomNavNext: document.getElementById("cityBottomNavNext"),
    navOverlay: document.getElementById("navOverlay"),
    navOverlayLogo: document.getElementById("navOverlayLogo"),
    navOverlayTitle: document.getElementById("navOverlayTitle"),
    navOverlayList: document.querySelector("#navOverlayList .nav-overlay-list-inner") || document.getElementById("navOverlayList"),
    menuClose: document.getElementById("menuClose"),
    motifView: document.getElementById("motif-view"),
    motifViewBack: document.getElementById("motifViewBack"),
    motifViewBreadcrumb: document.getElementById("motifViewBreadcrumb"),
    motifCards: document.getElementById("motifCards"),
    themeView: document.getElementById("theme-view"),
    themeViewBack: document.getElementById("themeViewBack"),
    themeViewBreadcrumb: document.getElementById("themeViewBreadcrumb"),
    themeCards: document.getElementById("themeCards"),
    allThemesView: document.getElementById("all-themes-view"),
    allThemesViewBack: document.getElementById("allThemesViewBack"),
    allThemesViewBreadcrumb: document.getElementById("allThemesViewBreadcrumb"),
    allThemesCards: document.getElementById("allThemesCards"),
    allMotifsView: document.getElementById("all-motifs-view"),
    allMotifsViewBack: document.getElementById("allMotifsViewBack"),
    allMotifsViewBreadcrumb: document.getElementById("allMotifsViewBreadcrumb"),
    allMotifsCards: document.getElementById("allMotifsCards"),
    allCitiesView: document.getElementById("all-cities-view"),
    allCitiesViewBack: document.getElementById("allCitiesViewBack"),
    allCitiesViewMenuToggle: document.getElementById("allCitiesViewMenuToggle"),
    allCitiesCards: document.getElementById("allCitiesCards"),
    aboutView: document.getElementById("about-view"),
    aboutViewBack: document.getElementById("aboutViewBack"),
    aboutViewBreadcrumb: document.getElementById("aboutViewBreadcrumb"),
    aboutRestartBtn: document.getElementById("aboutRestartBtn"),
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
    if (screen) {
      screen.classList.add("active");
      screen.scrollTop = 0;
    }
  }

  function showSplash() {
    navHistory = [];
    showScreen("splash");
    document.body.classList.remove("nav-open");
    if (els.splash) {
      els.splash.classList.remove("splash-fade-in");
      void els.splash.offsetWidth;
      els.splash.classList.add("splash-fade-in");
      setTimeout(function () {
        els.splash.classList.remove("splash-fade-in");
      }, 1520);
    }
  }

  function showChapterOverview(chapter, targetIndex) {
    navHistory = [];
    cityNavContext = null;
    currentChapterId = chapter ? chapter.id : 1;
    const ch = getChapterById(currentChapterId);
    if (els.chapterOverviewBreadcrumb) {
      els.chapterOverviewBreadcrumb.innerHTML = "";
      const homeBtn = document.createElement("button");
      homeBtn.type = "button";
      homeBtn.className = "breadcrumb-link";
      homeBtn.textContent = "Invisible Cities";
      homeBtn.addEventListener("click", (e) => { e.preventDefault(); showSplash(); });
      const chSpan = document.createElement("span");
      chSpan.className = "breadcrumb-current";
      chSpan.textContent = ch.title;
      els.chapterOverviewBreadcrumb.appendChild(homeBtn);
      els.chapterOverviewBreadcrumb.appendChild(document.createTextNode(" / "));
      els.chapterOverviewBreadcrumb.appendChild(chSpan);
    }
    els.chapterOverviewTitle.textContent = ch.title;
    els.chapterOverviewDesc.textContent = ch.text || "";
    const isEnd = ch.id === 5;

    if (els.chapterOverviewNext) {
      els.chapterOverviewNext.disabled = isEnd;
    }

    if (els.chapterOverviewContinue) {
      els.chapterOverviewContinue.textContent = isEnd ? "ABOUT THIS PROJECT →" : "CONTINUE TO CITIES →";
      els.chapterOverviewContinue.onclick = () => {
        if (isEnd) {
          navHistory.push(() => showChapterOverview(getChapterById(5) || chapters[chapters.length - 1]));
          showAboutView();
          return;
        }
        if (typeof targetIndex === "number" && targetIndex >= 0) {
          currentIndex = targetIndex;
          showCityView();
          return;
        }
        const firstCityRef = (ch.cities || [])[0];
        if (firstCityRef) {
          const idx = cities.findIndex((c) => c.id === firstCityRef.id);
          if (idx >= 0) {
            currentIndex = idx;
            showCityView();
          }
        }
      };
    }

    if (els.chapterOverviewCitiesWrap) {
      els.chapterOverviewCitiesWrap.innerHTML = "";
      els.chapterOverviewCitiesWrap.hidden = isEnd;
      if (!isEnd) {
        const accordion = document.createElement("div");
        accordion.className = "nav-accordion chapter-overview-accordion open";

        const header = document.createElement("button");
        header.type = "button";
        header.className = "nav-accordion-header";
        header.textContent = "Cities in This Chapter";
        header.addEventListener("click", (e) => {
          e.stopPropagation();
          accordion.classList.toggle("open");
        });

        const body = document.createElement("div");
        body.className = "nav-accordion-body";

        const citiesWrap = document.createElement("div");
        citiesWrap.className = "nav-accordion-cities";

        (ch.cities || []).forEach((ref) => {
          const idx = cities.findIndex((c) => c.id === ref.id);
          if (idx < 0) return;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "nav-city-link";
          btn.textContent = ref.name;
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            currentIndex = idx;
            cityNavContext = null;
            showCityView();
          });
          citiesWrap.appendChild(btn);
        });

        body.appendChild(citiesWrap);
        accordion.appendChild(header);
        accordion.appendChild(body);
        els.chapterOverviewCitiesWrap.appendChild(accordion);
      }
    }

    if (els.cityView && els.cityView.classList.contains("active")) {
      els.cityView.classList.add("screen-fade-out");
      const onFadeOut = (e) => {
        if (e.target !== els.cityView || e.propertyName !== "opacity") return;
        els.cityView.removeEventListener("transitionend", onFadeOut);
        els.cityView.classList.remove("screen-fade-out");
        showScreen("chapter-overview");
        if (els.chapterOverview) {
          els.chapterOverview.classList.remove("chapter-overview-fade-in");
          void els.chapterOverview.offsetWidth;
          els.chapterOverview.classList.add("chapter-overview-fade-in");
          setTimeout(function () {
            els.chapterOverview.classList.remove("chapter-overview-fade-in");
          }, 320);
          requestAnimationFrame(() => updateChapterOverviewStickyState());
        }
      };
      els.cityView.addEventListener("transitionend", onFadeOut);
      return;
    }
    showScreen("chapter-overview");
    if (els.chapterOverview) {
      els.chapterOverview.classList.remove("chapter-overview-fade-in");
      void els.chapterOverview.offsetWidth;
      els.chapterOverview.classList.add("chapter-overview-fade-in");
      setTimeout(function () {
        els.chapterOverview.classList.remove("chapter-overview-fade-in");
      }, 320);
      requestAnimationFrame(() => updateChapterOverviewStickyState());
    }
  }

  function showCityView() {
    const city = cities[currentIndex];
    if (!city) return;

    const ch = getChapterForCity(city.id);
    currentChapterId = ch.id;

    document.body.style.setProperty("--gradient-start", (city.gradient || FALLBACK_GRADIENT).start);
    document.body.style.setProperty("--gradient-end", (city.gradient || FALLBACK_GRADIENT).end);

    els.cityTitle.textContent = city.name;

    if (els.cityBreadcrumb) {
      els.cityBreadcrumb.innerHTML = "";
      const homeBtn = document.createElement("button");
      homeBtn.type = "button";
      homeBtn.className = "breadcrumb-link";
      homeBtn.textContent = "Invisible Cities";
      homeBtn.addEventListener("click", (e) => { e.preventDefault(); showSplash(); });
      const chBtn = document.createElement("button");
      chBtn.type = "button";
      chBtn.className = "breadcrumb-link";
      chBtn.textContent = ch.title;
      chBtn.addEventListener("click", (e) => { e.preventDefault(); showChapterOverview(ch); });
      const citySpan = document.createElement("span");
      citySpan.className = "breadcrumb-current";
      citySpan.textContent = city.name;
      els.cityBreadcrumb.appendChild(homeBtn);
      els.cityBreadcrumb.appendChild(document.createTextNode(" / "));
      els.cityBreadcrumb.appendChild(chBtn);
      els.cityBreadcrumb.appendChild(document.createTextNode(" / "));
      els.cityBreadcrumb.appendChild(citySpan);
    }
    els.citySubtitle.textContent = displayThemeName(city.subtitle || "");
    els.citySubtitle.onclick = () => {
      navHistory.push(() => { cityNavContext = null; showCityView(); });
      showThemeView();
    };
    els.cityExcerpt.textContent = city.excerpt || "";

    if (city.icon && els.cityIcon) {
      els.cityIcon.src = ICON_BASE + city.icon;
      els.cityIcon.alt = city.name;
      els.cityIcon.style.display = "";
      els.cityIcon.onerror = () => { els.cityIcon.style.display = "none"; };
    } else if (els.cityIcon) {
      els.cityIcon.style.display = "none";
    }

    const allCitiesBtn = document.getElementById("allCitiesBtn");
    if (allCitiesBtn) {
      allCitiesBtn.onclick = () => {
        navHistory.push(() => { cityNavContext = null; showCityView(); });
        showAllCitiesView();
      };
    }

    els.motifTags.innerHTML = "";
    (city.motifs || []).forEach((motif) => {
      const name = motifName(motif);
      if (!name) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "motif-tag";
      btn.textContent = name;
      btn.title = "Explore this motif across cities";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        navHistory.push(() => { cityNavContext = null; showCityView(); });
        showMotifView(name);
      });
      els.motifTags.appendChild(btn);
    });

    els.navPrev.disabled = false;
    els.navNext.disabled = false;
    if (els.cityBottomNavPrev) els.cityBottomNavPrev.disabled = false;
    if (els.cityBottomNavNext) els.cityBottomNavNext.disabled = false;

    if (els.cityView) {
      els.cityView.classList.remove("city-view-slide-from-left", "city-view-slide-from-right");
      if (slideDirection === "left") {
        els.cityView.classList.add("city-view-slide-from-left");
      } else if (slideDirection === "right") {
        els.cityView.classList.add("city-view-slide-from-right");
      }
      slideDirection = null;
      const removeSlide = () => {
        els.cityView.classList.remove("city-view-slide-from-left", "city-view-slide-from-right");
      };
      setTimeout(removeSlide, 320);
    }

    const cityViewEl = document.getElementById("city-view");
    if (cityViewEl) cityViewEl.scrollTop = 0;

    if (els.chapterOverview && els.chapterOverview.classList.contains("active")) {
      els.chapterOverview.classList.add("screen-fade-out");
      const onFadeOut = (e) => {
        if (e.target !== els.chapterOverview || e.propertyName !== "opacity") return;
        els.chapterOverview.removeEventListener("transitionend", onFadeOut);
        els.chapterOverview.classList.remove("screen-fade-out");
        showScreen("city-view");
        els.cityView.classList.add("city-view-fade-in");
        setTimeout(() => els.cityView.classList.remove("city-view-fade-in"), 320);
        requestAnimationFrame(() => updateCityViewStickyState());
      };
      els.chapterOverview.addEventListener("transitionend", onFadeOut);
      return;
    }

    showScreen("city-view");
    requestAnimationFrame(() => updateCityViewStickyState());
  }

  function updateCityViewStickyState() {
    const view = els.cityView;
    if (!view || !view.classList.contains("active")) return;
    const header = view.querySelector(".city-header");
    if (!header) return;
    const scrollTop = view.scrollTop;
    header.classList.toggle("is-stuck", scrollTop > 0);
  }

  function updateChapterOverviewStickyState() {
    const view = els.chapterOverview;
    if (!view || !view.classList.contains("active")) return;
    const header = view.querySelector(".chapter-overview-header");
    if (!header) return;
    const scrollTop = view.scrollTop;
    header.classList.toggle("is-stuck", scrollTop > 0);
  }

  function getThemeFromSubtitle(subtitle) {
    if (!subtitle) return "";
    return subtitle.replace(/\s*\d+$/, "").trim();
  }

  function displayThemeName(name) {
    return name.replace(/ and /gi, " & ");
  }

  // Returns an HTML string that always breaks the theme name onto 2 lines.
  // "Cities & Memory" → "Cities &<br>Memory"
  // "Thin Cities"     → "Thin<br>Cities"
  function themeCardTitleHtml(name) {
    const display = displayThemeName(name);
    if (display.includes(" & ")) {
      const idx = display.indexOf(" & ");
      return escapeHtml(display.slice(0, idx)) + " &amp;<br>" + escapeHtml(display.slice(idx + 3));
    }
    const space = display.indexOf(" ");
    if (space > 0) {
      return escapeHtml(display.slice(0, space)) + "<br>" + escapeHtml(display.slice(space + 1));
    }
    return escapeHtml(display);
  }

  function getCitiesForTheme(themeName) {
    if (!themeName) return [];
    return cities.filter((c) => getThemeFromSubtitle(c.subtitle) === themeName);
  }

  function getAllThemes() {
    const seen = new Set();
    cities.forEach((c) => {
      const t = getThemeFromSubtitle(c.subtitle);
      if (t) seen.add(t);
    });
    return Array.from(seen).sort();
  }

  function getAllMotifs() {
    return Object.keys(motifMap).sort();
  }

  function renderBreadcrumb(container, items) {
    if (!container) return;
    container.innerHTML = "";
    items.forEach((item, i) => {
      if (i > 0) {
        container.appendChild(document.createTextNode(" / "));
      }
      if (item.onClick) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "breadcrumb-link";
        btn.textContent = item.text;
        btn.addEventListener("click", item.onClick);
        container.appendChild(btn);
      } else {
        const span = document.createElement("span");
        span.className = "breadcrumb-current";
        span.textContent = item.text;
        container.appendChild(span);
      }
    });
  }

  function showAllThemesView() {
    renderBreadcrumb(els.allThemesViewBreadcrumb, [
      { text: "Invisible Cities", onClick: showSplash },
      { text: "Themes" }
    ]);
    els.allThemesCards.innerHTML = "";
    const themes = getAllThemes();
    themes.forEach((themeName) => {
      const themeCities = getCitiesForTheme(themeName);
      if (themeCities.length === 0) return;
      const firstCity = themeCities[0];
      const iconSrc = firstCity.icon ? ICON_BASE + firstCity.icon : "";
      const iconHtml = iconSrc
        ? `<img class="motif-card-icon" src="${escapeHtml(iconSrc)}" alt="" onerror="this.style.display='none'" />`
        : "";
      const card = document.createElement("button");
      card.type = "button";
      card.className = "motif-card";
      card.innerHTML = `
        ${iconHtml}
        <div class="motif-card-title">${themeCardTitleHtml(themeName)}</div>
        <p class="motif-card-quote splash-quote">${themeCities.length} cities</p>
      `;
      card.addEventListener("click", () => {
        navHistory.push(showAllThemesView);
        showThemeView(themeName);
      });
      els.allThemesCards.appendChild(card);
    });

    showScreen("all-themes-view");
    if (els.allThemesView) {
      els.allThemesView.classList.remove("motif-view-fade-in");
      void els.allThemesView.offsetWidth;
      els.allThemesView.classList.add("motif-view-fade-in");
      setTimeout(() => els.allThemesView.classList.remove("motif-view-fade-in"), 320);
    }
  }

  function showAllMotifsView() {
    renderBreadcrumb(els.allMotifsViewBreadcrumb, [
      { text: "Invisible Cities", onClick: showSplash },
      { text: "Motifs" }
    ]);
    els.allMotifsCards.innerHTML = "";
    const motifs = getAllMotifs();
    motifs.forEach((name) => {
      const count = (motifMap[name] || []).length;
      const displayName = name.replace(/\b\w/g, (c) => c.toUpperCase());
      const card = document.createElement("button");
      card.type = "button";
      card.className = "motif-card";
      card.innerHTML = `
        <div class="motif-card-title">${escapeHtml(displayName)}</div>
        <p class="motif-card-quote splash-quote">${count} cities</p>
      `;
      card.addEventListener("click", () => {
        navHistory.push(showAllMotifsView);
        showMotifView(name);
      });
      els.allMotifsCards.appendChild(card);
    });

    showScreen("all-motifs-view");
    if (els.allMotifsView) {
      els.allMotifsView.classList.remove("motif-view-fade-in");
      void els.allMotifsView.offsetWidth;
      els.allMotifsView.classList.add("motif-view-fade-in");
      setTimeout(() => els.allMotifsView.classList.remove("motif-view-fade-in"), 320);
    }
  }

  function showAllCitiesView() {
    els.allCitiesCards.innerHTML = "";
    cities.forEach((cityData) => {
      const subtitle = cityData.subtitle || "";
      const iconSrc = cityData.icon ? ICON_BASE + cityData.icon : "";
      const iconHtml = iconSrc
        ? `<img class="motif-card-icon" src="${escapeHtml(iconSrc)}" alt="" onerror="this.style.display='none'" />`
        : "";
      const card = document.createElement("button");
      card.type = "button";
      card.className = "motif-card";
      card.innerHTML = `
        ${iconHtml}
        <div class="motif-card-title">${escapeHtml(cityData.name)}</div>
        <p class="motif-card-quote splash-quote">${escapeHtml(displayThemeName(subtitle))}</p>
      `;
      card.addEventListener("click", () => {
        const idx = cities.findIndex((c) => c.id === cityData.id);
        if (idx >= 0) {
          currentIndex = idx;
          cityNavContext = null;
          showCityView();
        }
      });
      els.allCitiesCards.appendChild(card);
    });

    showScreen("all-cities-view");
    if (els.allCitiesView) {
      els.allCitiesView.classList.remove("motif-view-fade-in");
      void els.allCitiesView.offsetWidth;
      els.allCitiesView.classList.add("motif-view-fade-in");
      setTimeout(function () {
        els.allCitiesView.classList.remove("motif-view-fade-in");
      }, 320);
    }
  }

  function showAboutView() {
    renderBreadcrumb(els.aboutViewBreadcrumb, [
      { text: "Invisible Cities", onClick: showSplash },
      { text: "About" }
    ]);
    showScreen("about-view");
    if (els.aboutView) {
      els.aboutView.classList.remove("motif-view-fade-in");
      void els.aboutView.offsetWidth;
      els.aboutView.classList.add("motif-view-fade-in");
      setTimeout(() => els.aboutView.classList.remove("motif-view-fade-in"), 320);
    }
  }

  function showThemeView(themeNameParam) {
    const themeName = themeNameParam || (cities[currentIndex] && getThemeFromSubtitle(cities[currentIndex].subtitle));
    if (!themeName) return;
    currentThemeName = themeName;
    const themeCities = getCitiesForTheme(themeName);
    if (themeCities.length === 0) return;

    renderBreadcrumb(els.themeViewBreadcrumb, [
      { text: "Invisible Cities", onClick: showSplash },
      { text: "Themes", onClick: () => { navHistory.push(() => showThemeView(themeName)); showAllThemesView(); } },
      { text: displayThemeName(themeName) }
    ]);
    els.themeCards.innerHTML = "";

    themeCities.forEach((cityData) => {
      const subtitle = cityData.subtitle || "";
      const iconSrc = cityData.icon ? ICON_BASE + cityData.icon : "";
      const iconHtml = iconSrc
        ? `<img class="motif-card-icon" src="${escapeHtml(iconSrc)}" alt="" onerror="this.style.display='none'" />`
        : "";
      const card = document.createElement("button");
      card.type = "button";
      card.className = "motif-card";
      card.innerHTML = `
        ${iconHtml}
        <div class="motif-card-title">${escapeHtml(cityData.name)}</div>
        <p class="motif-card-quote splash-quote">${escapeHtml(displayThemeName(subtitle))}</p>
      `;
      card.addEventListener("click", () => {
        const idx = cities.findIndex((c) => c.id === cityData.id);
        if (idx >= 0) {
          currentIndex = idx;
          cityNavContext = { type: "theme", name: themeName, indices: themeCities.map((c) => cities.findIndex((x) => x.id === c.id)).filter((i) => i >= 0) };
          showCityView();
        }
      });
      els.themeCards.appendChild(card);
    });

    showScreen("theme-view");
    if (els.themeView) {
      els.themeView.classList.remove("motif-view-fade-in");
      void els.themeView.offsetWidth;
      els.themeView.classList.add("motif-view-fade-in");
      setTimeout(function () {
        els.themeView.classList.remove("motif-view-fade-in");
      }, 320);
    }
  }

  function showMotifView(motifName) {
    currentMotifName = motifName;
    const displayName = motifName.replace(/\b\w/g, (c) => c.toUpperCase());
    renderBreadcrumb(els.motifViewBreadcrumb, [
      { text: "Invisible Cities", onClick: showSplash },
      { text: "Motifs", onClick: () => { navHistory.push(() => showMotifView(motifName)); showAllMotifsView(); } },
      { text: displayName }
    ]);
    els.motifCards.innerHTML = "";

    const items = motifMap[motifName] || [];
    items.forEach(({ city, motif: m }) => {
      const subtitle = city.subtitle || "";
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
        <p class="motif-card-quote splash-quote">${escapeHtml(displayThemeName(subtitle))}</p>
      `;
      card.addEventListener("click", () => {
        const idx = cities.findIndex((c) => c.id === city.id);
        if (idx >= 0) {
          currentIndex = idx;
          cityNavContext = { type: "motif", name: motifName, indices: items.map(({ city: c }) => cities.findIndex((x) => x.id === c.id)).filter((i) => i >= 0) };
          showCityView();
        }
      });
      els.motifCards.appendChild(card);
    });

    showScreen("motif-view");
    if (els.motifView) {
      els.motifView.classList.remove("motif-view-fade-in");
      void els.motifView.offsetWidth;
      els.motifView.classList.add("motif-view-fade-in");
      setTimeout(function () {
        els.motifView.classList.remove("motif-view-fade-in");
      }, 320);
    }
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
      readLink.textContent = "Read chapter overview →";
      readLink.addEventListener("click", (e) => {
        e.stopPropagation();
        navHistory = [];
        showChapterOverview(getChapterById(chapter.id));
        closeNavOverlay();
      });

      body.appendChild(readLink);

      const cityRefs = chapter.cities || [];
      if (cityRefs.length > 0) {
        const citiesWrap = document.createElement("div");
        citiesWrap.className = "nav-accordion-cities";
        cityRefs.forEach((ref) => {
          const idx = cities.findIndex((c) => c.id === ref.id);
          if (idx < 0) return;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "nav-city-link";
          btn.textContent = ref.name;
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          navHistory = [];
          currentIndex = idx;
          cityNavContext = null;
          showCityView();
          closeNavOverlay();
        });
        citiesWrap.appendChild(btn);
        });
        body.appendChild(citiesWrap);
      }
      accordion.appendChild(header);
      accordion.appendChild(body);
      els.navOverlayList.appendChild(accordion);
    });

    const indexBtnsWrap = document.createElement("div");
    indexBtnsWrap.className = "nav-index-btns";

    const allCitiesBtn = document.createElement("button");
    allCitiesBtn.type = "button";
    allCitiesBtn.className = "nav-all-cities-btn";
    allCitiesBtn.textContent = "View all cities →";
    allCitiesBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showAllCitiesView();
      closeNavOverlay();
    });
    indexBtnsWrap.appendChild(allCitiesBtn);

    const allThemesBtn = document.createElement("button");
    allThemesBtn.type = "button";
    allThemesBtn.className = "nav-all-cities-btn nav-index-btn";
    allThemesBtn.textContent = "View all themes →";
    allThemesBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navHistory.push(getCurrentScreenFn());
      showAllThemesView();
      closeNavOverlay();
    });
    indexBtnsWrap.appendChild(allThemesBtn);

    const allMotifsBtn = document.createElement("button");
    allMotifsBtn.type = "button";
    allMotifsBtn.className = "nav-all-cities-btn nav-index-btn";
    allMotifsBtn.textContent = "View all motifs →";
    allMotifsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navHistory.push(getCurrentScreenFn());
      showAllMotifsView();
      closeNavOverlay();
    });
    indexBtnsWrap.appendChild(allMotifsBtn);

    const aboutBtn = document.createElement("button");
    aboutBtn.type = "button";
    aboutBtn.className = "nav-all-cities-btn nav-index-btn";
    aboutBtn.textContent = "About this project →";
    aboutBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navHistory.push(getCurrentScreenFn());
      showAboutView();
      closeNavOverlay();
    });
    indexBtnsWrap.appendChild(aboutBtn);

    els.navOverlayList.appendChild(indexBtnsWrap);
  }

  function goPrev() {
    if (cityNavContext) {
      const pos = cityNavContext.indices.indexOf(currentIndex);
      if (pos <= 0) {
        if (cityNavContext.type === "motif") {
          showMotifView(cityNavContext.name);
        } else {
          showThemeView(cityNavContext.name);
        }
        cityNavContext = null;
        return;
      }
      slideDirection = "left";
      currentIndex = cityNavContext.indices[pos - 1];
      showCityView();
      return;
    }
    if (currentIndex <= 0) {
      const ch = getChapterById(currentChapterId);
      showChapterOverview(ch);
      return;
    }
    slideDirection = "left";
    const city = cities[currentIndex - 1];
    const currCh = getChapterForCity(cities[currentIndex].id);
    const prevCh = getChapterForCity(city.id);
    const currFirstRef = currCh && currCh.cities && currCh.cities.length > 0 ? currCh.cities[0] : null;
    const isFirstCityOfChapter = !!(currFirstRef && cities[currentIndex] && currFirstRef.id === cities[currentIndex].id);
    if (isFirstCityOfChapter) {
      showChapterOverview(currCh);
    } else if (prevCh.id !== currCh.id) {
      showChapterOverview(prevCh, currentIndex - 1);
    } else {
      currentIndex--;
      showCityView();
    }
  }

  function goNext() {
    if (cityNavContext) {
      const pos = cityNavContext.indices.indexOf(currentIndex);
      if (pos < 0 || pos >= cityNavContext.indices.length - 1) {
        if (cityNavContext.type === "motif") {
          showMotifView(cityNavContext.name);
        } else {
          showThemeView(cityNavContext.name);
        }
        cityNavContext = null;
        return;
      }
      slideDirection = "right";
      currentIndex = cityNavContext.indices[pos + 1];
      showCityView();
      return;
    }
    if (currentIndex >= cities.length - 1) {
      const endChapter = chapters.find((c) => c.id === 5) || chapters[chapters.length - 1];
      if (endChapter) showChapterOverview(endChapter);
      return;
    }
    slideDirection = "right";
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
    showSplash();

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
    if (els.chapterOverviewPrev) {
      els.chapterOverviewPrev.addEventListener("click", function () {
        if (currentChapterId <= 1) {
          showSplash();
          return;
        }
        const prevCh = getChapterById(currentChapterId - 1);
        if (!prevCh) return;
        const lastCityRef = prevCh.cities && prevCh.cities.length > 0 ? prevCh.cities[prevCh.cities.length - 1] : null;
        if (lastCityRef) {
          const idx = cities.findIndex((c) => c.id === lastCityRef.id);
          if (idx >= 0) {
            currentIndex = idx;
            showCityView();
            return;
          }
        }
        showChapterOverview(prevCh);
      });
    }
    if (els.chapterOverviewNext) {
      els.chapterOverviewNext.addEventListener("click", function () {
        if (els.chapterOverviewNext.disabled) return;
        const ch = getChapterById(currentChapterId);
        const firstCityRef = ch.cities && ch.cities.length > 0 ? ch.cities[0] : null;
        if (firstCityRef) {
          const idx = cities.findIndex((c) => c.id === firstCityRef.id);
          if (idx >= 0) {
            currentIndex = idx;
            showCityView();
          }
        }
      });
    }
    els.navOverlayLogo.addEventListener("click", () => {
      closeNavOverlay();
      showSplash();
    });

    els.menuToggle.addEventListener("click", openNavOverlay);
    if (els.chapterOverviewMenuToggle) els.chapterOverviewMenuToggle.addEventListener("click", openNavOverlay);
    document.querySelectorAll(".motif-view-menu-toggle").forEach((btn) => btn.addEventListener("click", openNavOverlay));
    els.menuClose.addEventListener("click", closeNavOverlay);

    els.navPrev.addEventListener("click", goPrev);
    els.navNext.addEventListener("click", goNext);
    if (els.cityBottomNavPrev) els.cityBottomNavPrev.addEventListener("click", goPrev);
    if (els.cityBottomNavNext) els.cityBottomNavNext.addEventListener("click", goNext);

    if (els.cityView) {
      els.cityView.addEventListener("scroll", () => requestAnimationFrame(updateCityViewStickyState));
    }
    if (els.chapterOverview) {
      els.chapterOverview.addEventListener("scroll", () => requestAnimationFrame(updateChapterOverviewStickyState));
    }

    els.motifViewBack.addEventListener("click", goBack);
    els.themeViewBack.addEventListener("click", goBack);
    els.allThemesViewBack.addEventListener("click", goBack);
    els.allMotifsViewBack.addEventListener("click", goBack);
    els.allCitiesViewBack.addEventListener("click", () => {
      const ch = currentChapterId === 5 ? chapters[0] : getChapterById(currentChapterId);
      showChapterOverview(ch || chapters[0]);
    });
    els.aboutViewBack.addEventListener("click", goBack);
    if (els.aboutRestartBtn) els.aboutRestartBtn.addEventListener("click", showSplash);

    document.addEventListener("keydown", (e) => {
      if (e.target && (e.target.closest("input") || e.target.closest("textarea"))) return;
      if (e.key === "Enter" && els.splash && els.splash.classList.contains("active")) proceedFromSplash();
      if (e.key === "Escape" && els.navOverlay.classList.contains("open")) { closeNavOverlay(); return; }
      if (els.chapterOverview && els.chapterOverview.classList.contains("active")) {
        if (e.key === "ArrowLeft") { e.preventDefault(); chapterPrev(); return; }
        if (e.key === "ArrowRight") { e.preventDefault(); els.chapterOverviewContinue && els.chapterOverviewContinue.click(); return; }
      }
      if (els.cityView && els.cityView.classList.contains("active")) {
        if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); return; }
        if (e.key === "ArrowRight") { e.preventDefault(); goNext(); return; }
      }
    });

    let touchStartX = 0;
    let touchStartY = 0;
    document.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });
    document.addEventListener("touchend", (e) => {
      if (els.navOverlay.classList.contains("open")) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (els.cityView && els.cityView.classList.contains("active")) {
        if (dx < 0) { goNext(); } else { goPrev(); }
      } else if (els.chapterOverview && els.chapterOverview.classList.contains("active")) {
        if (dx < 0) { els.chapterOverviewContinue && els.chapterOverviewContinue.click(); } else { chapterPrev(); }
      }
    }, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
