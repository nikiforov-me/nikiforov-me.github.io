/* ==========================================================================
   БизнесСайты.рф — версия 2
   Дополнения к main.js: «показать ещё» в портфолио, умное поведение фильтров.
   ========================================================================== */
(function () {
  "use strict";

  var moreGrid = document.querySelector("[data-works-more]");
  var toggle = document.querySelector("[data-works-toggle]");

  if (moreGrid && toggle) {
    toggle.addEventListener("click", function () {
      var open = moreGrid.classList.toggle("is-visible");
      toggle.innerHTML = open
        ? 'Свернуть <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>'
        : 'Показать ещё 11 работ <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* фильтры: при выборе категории показываем сразу все подходящие работы */
  var filters = document.querySelectorAll("[data-filter]");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-filter");
      if (!moreGrid || !toggle) return;
      if (value === "all") return;
      moreGrid.classList.add("is-visible");
      toggle.style.display = "none";
    });
  });

  var reset = document.querySelector('[data-filter="all"]');
  if (reset && toggle) {
    reset.addEventListener("click", function () {
      toggle.style.display = "";
    });
  }
})();

/* ==========================================================================
   Живой фон первого экрана: параллакс интернет-объектов от движения курсора
   ========================================================================== */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  if (!hero) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce || !finePointer) return;

  var targetX = 0;
  var targetY = 0;
  var currentX = 0;
  var currentY = 0;
  var raf = null;

  function frame() {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    hero.style.setProperty("--mx", currentX.toFixed(4));
    hero.style.setProperty("--my", currentY.toFixed(4));

    if (Math.abs(targetX - currentX) > 0.0015 || Math.abs(targetY - currentY) > 0.0015) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = null;
    }
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  hero.addEventListener(
    "pointermove",
    function (e) {
      var rect = hero.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      kick();
    },
    { passive: true }
  );

  hero.addEventListener("pointerleave", function () {
    targetX = 0;
    targetY = 0;
    kick();
  });
})();
