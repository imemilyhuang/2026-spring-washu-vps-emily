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
    cityExcerptBgIcon: document.getElementById("cityExcerptBgIcon"),
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
    if (screen) {
      screen.classList.add("active");
      screen.scrollTop = 0;
    }
  }

  function showSplash() {
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
      els.chapterOverviewBreadcrumb.appendChild(document.createTextNode("  >  "));
      els.chapterOverviewBreadcrumb.appendChild(chSpan);
    }
    els.chapterOverviewTitle.textContent = ch.title;
    els.chapterOverviewDesc.textContent = ch.text || "";
    const isEnd = ch.id === 5;

    if (els.chapterOverviewNext) {
      els.chapterOverviewNext.disabled = isEnd;
    }

    if (els.chapterOverviewContinue) {
      els.chapterOverviewContinue.textContent = isEnd ? "RESTART →" : "CONTINUE TO CITIES →";
      els.chapterOverviewContinue.onclick = () => {
        if (isEnd) {
          showSplash();
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
      els.cityBreadcrumb.appendChild(document.createTextNode("  >  "));
      els.cityBreadcrumb.appendChild(chBtn);
      els.cityBreadcrumb.appendChild(document.createTextNode("  >  "));
      els.cityBreadcrumb.appendChild(citySpan);
    }
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

    if (els.cityExcerptBgIcon) {
      if (city.icon) {
        els.cityExcerptBgIcon.src = ICON_BASE + city.icon;
        els.cityExcerptBgIcon.alt = "";
        els.cityExcerptBgIcon.style.display = "";
        els.cityExcerptBgIcon.onerror = () => { els.cityExcerptBgIcon.style.display = "none"; };
      } else {
        els.cityExcerptBgIcon.style.display = "none";
      }
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

  function showMotifView(motifName) {
    const displayName = motifName.replace(/\b\w/g, (c) => c.toUpperCase());
    els.motifViewTitle.textContent = displayName;
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
        <p class="motif-card-quote splash-quote">${escapeHtml(subtitle)}</p>
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

    els.motifViewBack.addEventListener("click", () => showCityView());

    document.addEventListener("keydown", (e) => {
      if (e.target && (e.target.closest("input") || e.target.closest("textarea"))) return;
      if (e.key === "Enter" && els.splash && els.splash.classList.contains("active")) proceedFromSplash();
      if (e.key === "Escape" && els.navOverlay.classList.contains("open")) { closeNavOverlay(); return; }
      if (els.cityView && els.cityView.classList.contains("active")) {
        if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); return; }
        if (e.key === "ArrowRight") { e.preventDefault(); goNext(); return; }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
