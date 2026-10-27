/* ==========================================================================
   БизнесСайты.рф — redesign 2026
   main.js — header, menu, reveals, filters, carousel, countdown, modals,
             lightbox, forms → WhatsApp, cookie consent
   Vanilla JS, no dependencies.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var body = doc.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var WHATSAPP_PHONE = "79807482508";
  var PHONE_DISPLAY = "8 (920) 121-55-25";

  function $(sel, ctx) {
    return (ctx || doc).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }

  function on(el, evt, fn, opts) {
    if (el) el.addEventListener(evt, fn, opts);
  }

  function throttle(fn, wait) {
    var last = 0;
    var timer = null;
    return function () {
      var now = Date.now();
      var args = arguments;
      var self = this;
      if (now - last >= wait) {
        last = now;
        fn.apply(self, args);
      } else {
        clearTimeout(timer);
        timer = setTimeout(function () {
          last = Date.now();
          fn.apply(self, args);
        }, wait - (now - last));
      }
    };
  }

  /* ---------------------------------------------------------------
     Header: scrolled state + scroll progress
     --------------------------------------------------------------- */
  var header = $("[data-header]");
  var progress = $("[data-progress]");

  function onScroll() {
    var y = window.pageYOffset || doc.documentElement.scrollTop;
    if (header) header.classList.toggle("is-scrolled", y > 24);

    if (progress) {
      var h = doc.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? Math.min(100, (y / h) * 100) : 0;
      progress.style.width = pct + "%";
    }

    var toTop = $("[data-to-top]");
    if (toTop) toTop.classList.toggle("is-visible", y > 700);
  }

  on(window, "scroll", throttle(onScroll, 60), { passive: true });
  onScroll();

  /* ---------------------------------------------------------------
     Mobile menu
     --------------------------------------------------------------- */
  var navToggle = $("[data-nav-toggle]");
  var mobileMenu = $("[data-mobile-menu]");

  function setMenu(open) {
    if (!navToggle || !mobileMenu) return;
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
    body.classList.toggle("is-locked", open);
    if (open) {
      var first = $("a, button", mobileMenu);
      if (first) first.focus({ preventScroll: true });
    }
  }

  if (navToggle && mobileMenu) {
    mobileMenu.setAttribute("aria-hidden", "true");
    on(navToggle, "click", function () {
      setMenu(navToggle.getAttribute("aria-expanded") !== "true");
    });

    $$("a", mobileMenu).forEach(function (link) {
      on(link, "click", function () {
        setMenu(false);
      });
    });

    on(doc, "keydown", function (e) {
      if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) {
        setMenu(false);
        navToggle.focus();
      }
    });

    on(window, "resize", throttle(function () {
      if (window.innerWidth > 1180 && mobileMenu.classList.contains("is-open")) {
        setMenu(false);
      }
    }, 200));
  }

  /* ---------------------------------------------------------------
     Scroll reveal
     --------------------------------------------------------------- */
  var revealEls = $$(".reveal");
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) {
        el.classList.add("is-in");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    }
  }

  /* ---------------------------------------------------------------
     Portfolio filters
     --------------------------------------------------------------- */
  var filterButtons = $$("[data-filter]");
  var works = $$("[data-tags]");

  if (filterButtons.length && works.length) {
    filterButtons.forEach(function (btn) {
      on(btn, "click", function () {
        var value = btn.getAttribute("data-filter");
        filterButtons.forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });

        works.forEach(function (work) {
          var tags = (work.getAttribute("data-tags") || "").split(" ");
          var show = value === "all" || tags.indexOf(value) !== -1;
          work.style.display = show ? "" : "none";
          if (show) {
            work.classList.remove("is-in");
            // force reflow so the stagger replays
            void work.offsetWidth;
            work.classList.add("is-in");
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------------
     Reviews carousel (scroll-snap + arrows + drag)
     --------------------------------------------------------------- */
  var track = $("[data-carousel-track]");
  if (track) {
    var prev = $("[data-carousel-prev]");
    var next = $("[data-carousel-next]");

    function step() {
      var card = track.querySelector(".review");
      if (!card) return 360;
      var gap = parseFloat(getComputedStyle(track).columnGap || "16") || 16;
      return card.getBoundingClientRect().width + gap;
    }

    function updateArrows() {
      var max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
      track.classList.toggle("is-at-end", track.scrollLeft >= max);
    }

    on(prev, "click", function () {
      track.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" });
    });

    on(next, "click", function () {
      track.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" });
    });

    on(track, "scroll", throttle(updateArrows, 120), { passive: true });
    on(window, "resize", throttle(updateArrows, 200));
    updateArrows();

    /* drag to scroll (pointer events) */
    var isDown = false;
    var startX = 0;
    var startLeft = 0;
    var moved = false;

    on(track, "pointerdown", function (e) {
      if (e.pointerType === "touch") return;
      isDown = true;
      moved = false;
      startX = e.clientX;
      startLeft = track.scrollLeft;
      track.classList.add("is-dragging");
    });

    on(window, "pointermove", function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startLeft - dx;
    });

    on(window, "pointerup", function () {
      if (!isDown) return;
      isDown = false;
      track.classList.remove("is-dragging");
    });

    /* prevent link click after a drag */
    on(track, "click", function (e) {
      if (moved) {
        e.preventDefault();
        moved = false;
      }
    }, true);
  }

  /* ---------------------------------------------------------------
     Review expand
     --------------------------------------------------------------- */
  $$("[data-expand]").forEach(function (btn) {
    on(btn, "click", function () {
      var card = btn.closest(".review");
      if (!card) return;
      var expanded = card.classList.toggle("is-expanded");
      btn.textContent = expanded ? "Свернуть" : "Читать полностью";
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  });

  /* ---------------------------------------------------------------
     Countdown (promo ends at the end of the current month)
     --------------------------------------------------------------- */
  var countdown = $("[data-countdown]");
  if (countdown) {
    var now = new Date();
    var deadline = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    var end = deadline.getTime();

    var cells = {
      days: $("[data-cd-days]", countdown),
      hours: $("[data-cd-hours]", countdown),
      minutes: $("[data-cd-minutes]", countdown),
      seconds: $("[data-cd-seconds]", countdown)
    };

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function tick() {
      var diff = Math.max(0, end - Date.now());
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      if (cells.days) cells.days.textContent = pad(d);
      if (cells.hours) cells.hours.textContent = pad(h);
      if (cells.minutes) cells.minutes.textContent = pad(m);
      if (cells.seconds) cells.seconds.textContent = pad(s);
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------------
     Accordions (FAQ)
     --------------------------------------------------------------- */
  $$(".accordion").forEach(function (acc) {
    var btn = $(".accordion__btn", acc);
    var panel = $(".accordion__panel", acc);
    if (!btn || !panel) return;

    on(btn, "click", function () {
      var open = acc.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("aria-hidden", open ? "false" : "true");
    });
  });

  /* ---------------------------------------------------------------
     Modals (callback / price list / video) + focus handling
     --------------------------------------------------------------- */
  var lastFocused = null;

  function openModal(id) {
    var modal = doc.getElementById(id);
    if (!modal) return;
    lastFocused = doc.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("is-locked");

    var focusable = $("input, button, a[href], textarea, select", modal);
    if (focusable) setTimeout(function () { focusable.focus({ preventScroll: true }); }, 80);

    // lazily inject video iframe
    var frame = $("[data-video-iframe]", modal);
    if (frame && !frame.getAttribute("src")) {
      frame.setAttribute("src", frame.getAttribute("data-src") || "");
    }
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    var frame = $("[data-video-iframe]", modal);
    if (frame && frame.getAttribute("src")) frame.setAttribute("src", "");

    if (!$$(".modal.is-open").length && !$(".lightbox.is-open")) {
      body.classList.remove("is-locked");
    }
    if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
  }

  $$("[data-modal-open]").forEach(function (trigger) {
    on(trigger, "click", function (e) {
      e.preventDefault();
      openModal(trigger.getAttribute("data-modal-open"));
    });
  });

  $$(".modal").forEach(function (modal) {
    on(modal, "click", function (e) {
      if (e.target.closest("[data-modal-close]") || e.target.classList.contains("modal__backdrop")) {
        closeModal(modal);
      }
    });
  });

  /* ---------------------------------------------------------------
     Lightbox — сертификаты и работы портфолио (каждая группа отдельно)
     --------------------------------------------------------------- */
  var lightbox = $("[data-lightbox-modal]");
  var lightboxImg = lightbox ? $("img", lightbox) : null;
  var lightboxCaption = lightbox ? $(".lightbox__caption", lightbox) : null;

  var lightboxGroups = {
    certs: $$("[data-cert]"),
    works: $$("[data-work]")
  };
  var activeItems = [];
  var activeIndex = 0;

  function showLightboxItem(items, i) {
    if (!items.length || !lightboxImg) return;
    activeItems = items;
    activeIndex = (i + items.length) % items.length;
    var item = activeItems[activeIndex];
    var img = item.querySelector("img");
    lightboxImg.src = item.getAttribute("data-full") || (img ? img.src : "");
    lightboxImg.alt = img ? img.alt : "";
    if (lightboxCaption) {
      lightboxCaption.textContent = item.getAttribute("data-caption") || (img ? img.alt : "");
    }
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    body.classList.add("is-locked");
  }

  function hideLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    if (!$$(".modal.is-open").length) body.classList.remove("is-locked");
  }

  function stepLightbox(delta) {
    showLightboxItem(activeItems, activeIndex + delta);
  }

  Object.keys(lightboxGroups).forEach(function (key) {
    var items = lightboxGroups[key];
    items.forEach(function (item, i) {
      on(item, "click", function (e) {
        e.preventDefault();
        showLightboxItem(items, i);
      });
    });
  });

  if (lightbox) {
    on(lightbox, "click", function (e) {
      if (e.target.classList.contains("lightbox") || e.target.closest("[data-lightbox-close]")) hideLightbox();
      if (e.target.closest("[data-lightbox-prev]")) stepLightbox(-1);
      if (e.target.closest("[data-lightbox-next]")) stepLightbox(1);
    });
    // swipe
    var startX = 0;
    on(lightbox, "touchstart", function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    on(lightbox, "touchend", function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1);
    });
  }

  on(doc, "keydown", function (e) {
    if (e.key === "Escape") {
      $$(".modal.is-open").forEach(closeModal);
      if (lightbox && lightbox.classList.contains("is-open")) hideLightbox();
    }
    if (lightbox && lightbox.classList.contains("is-open")) {
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    }
  });

  /* ---------------------------------------------------------------
     Forms → WhatsApp (no backend on a static site)
     --------------------------------------------------------------- */
  function digits(value) {
    return (value || "").replace(/[^\d+]/g, "");
  }

  function validate(form) {
    var ok = true;
    var firstInvalid = null;

    $$("[required]", form).forEach(function (field) {
      var value = (field.value || "").trim();
      var error = doc.getElementById(field.getAttribute("aria-describedby") || "");
      var valid = value.length > 0;

      if (valid && field.type === "tel") {
        var d = value.replace(/\D/g, "");
        valid = d.length >= 10;
      }
      if (valid && field.type === "email") {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      if (valid && field.type === "checkbox") {
        valid = field.checked;
      }

      field.setAttribute("aria-invalid", valid ? "false" : "true");
      if (!valid) {
        ok = false;
        if (!firstInvalid) firstInvalid = field;
        if (error) {
          error.textContent =
            field.type === "checkbox"
              ? "Нужно согласие на обработку данных"
              : field.type === "tel"
              ? "Введите корректный телефон"
              : field.type === "email"
              ? "Проверьте адрес e-mail"
              : "Заполните это поле";
        }
      } else if (error) {
        error.textContent = "";
      }
    });

    if (firstInvalid) firstInvalid.focus({ preventScroll: false });
    return ok;
  }

  function buildMessage(form) {
    var title = form.getAttribute("data-wa-title") || "Заявка с сайта БизнесСайты.рф";
    var lines = [title];
    $$("[data-wa-field]", form).forEach(function (field) {
      var label = field.getAttribute("data-wa-label") || field.name;
      var value = (field.value || "").trim();
      if (field.type === "checkbox") return;
      if (value) lines.push(label + ": " + value);
    });
    lines.push("— отправлено с сайта бизнессайты.рф");
    return lines.join("\n");
  }

  $$("form[data-wa-form]").forEach(function (form) {
    on(form, "submit", function (e) {
      e.preventDefault();
      if (!validate(form)) return;

      var url = "https://wa.me/" + WHATSAPP_PHONE + "?text=" + encodeURIComponent(buildMessage(form));
      var success = $(".form__success", form.parentNode) || $(".form__success", form);
      var win = window.open(url, "_blank", "noopener");

      if (success) {
        success.classList.add("is-visible");
        success.setAttribute("role", "status");
      }

      if (!win) {
        // popup blocked — fall back to navigating (works, but leaves the page)
        window.location.href = url;
      }

      form.reset();
      $$("[aria-invalid]", form).forEach(function (f) {
        f.setAttribute("aria-invalid", "false");
      });
    });
  });

  /* phone input mask-ish formatting */
  $$('input[type="tel"]').forEach(function (input) {
    on(input, "input", function () {
      var d = input.value.replace(/\D/g, "").replace(/^8/, "7").slice(0, 11);
      if (!d) {
        input.value = "";
        return;
      }
      var out = "+7";
      if (d.length > 1) out += " (" + d.slice(1, 4);
      if (d.length >= 5) out += ") " + d.slice(4, 7);
      if (d.length >= 8) out += "-" + d.slice(7, 9);
      if (d.length >= 10) out += "-" + d.slice(9, 11);
      input.value = out;
    });
  });

  /* ---------------------------------------------------------------
     Cookie consent
     --------------------------------------------------------------- */
  var COOKIE_KEY = "bs_cookie_consent_v1";
  var cookieBanner = $("[data-cookie]");

  function saveCookie(value) {
    try {
      localStorage.setItem(COOKIE_KEY, JSON.stringify({ value: value, ts: Date.now() }));
    } catch (err) {
      /* privacy mode — ignore */
    }
    if (cookieBanner) cookieBanner.classList.remove("is-visible");
  }

  function getCookie() {
    try {
      return JSON.parse(localStorage.getItem(COOKIE_KEY) || "null");
    } catch (err) {
      return null;
    }
  }

  if (cookieBanner && !getCookie()) {
    setTimeout(function () {
      cookieBanner.classList.add("is-visible");
    }, 1400);

    $$("[data-cookie-choice]", cookieBanner).forEach(function (btn) {
      on(btn, "click", function () {
        saveCookie(btn.getAttribute("data-cookie-choice"));
      });
    });

    var settingsBtn = $("[data-cookie-settings]", cookieBanner);
    var settings = $(".cookie__settings", cookieBanner);
    if (settingsBtn && settings) {
      on(settingsBtn, "click", function () {
        settings.classList.toggle("is-open");
      });
    }

    var saveBtn = $("[data-cookie-save]", cookieBanner);
    if (saveBtn) {
      on(saveBtn, "click", function () {
        var chosen = $$("[data-cookie-option]:checked", cookieBanner).map(function (cb) {
          return cb.value;
        });
        saveCookie(chosen.join(",") || "necessary");
      });
    }
  }

  /* ---------------------------------------------------------------
     Back to top
     --------------------------------------------------------------- */
  on($("[data-to-top]"), "click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------------------------------------------------------------
     Smooth anchor scroll (with sticky header offset)
     --------------------------------------------------------------- */
  $$('a[href^="#"]').forEach(function (link) {
    on(link, "click", function (e) {
      var href = link.getAttribute("href");
      if (!href || href === "#" || link.hasAttribute("data-modal-open")) return;
      var target = doc.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      var headerH = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 14;
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
      history.replaceState(null, "", href);
      if (target.hasAttribute("tabindex") === false) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  /* ---------------------------------------------------------------
     Image error fallback (keeps layout clean if a file is missing)
     --------------------------------------------------------------- */
  $$("img").forEach(function (img) {
    on(img, "error", function () {
      img.style.opacity = "0";
      if (img.parentNode) img.parentNode.style.background = "linear-gradient(135deg, #eef1f7, #e3e8f2)";
    });
  });
})();
