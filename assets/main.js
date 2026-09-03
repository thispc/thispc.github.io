/* Pulkit Chawla, pulkitchawla.me. Theme toggle, verification log, section reveal. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Theme: dark by default, light when chosen, choice kept in localStorage. */
  var toggle = document.getElementById("theme");
  var meta = document.querySelector('meta[name="theme-color"]');

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function paintMeta() {
    if (meta) { meta.setAttribute("content", currentTheme() === "light" ? "#f6f5f0" : "#0f1210"); }
  }
  function labelToggle() {
    if (toggle) {
      var next = currentTheme() === "light" ? "dark" : "light";
      toggle.setAttribute("aria-label", "Switch to " + next + " theme");
      toggle.setAttribute("title", "Switch to " + next + " theme");
    }
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "light" ? "dark" : "light";
      if (next === "light") { root.setAttribute("data-theme", "light"); } else { root.removeAttribute("data-theme"); }
      try { localStorage.setItem("theme", next); } catch (e) { /* storage may be unavailable */ }
      paintMeta();
      labelToggle();
    });
  }
  paintMeta();
  labelToggle();

  /* Verification log: a devteam build, typed out. Under reduced motion it renders at once. */
  var log = document.getElementById("log");
  var state = document.getElementById("log-state");
  var replay = document.getElementById("log-replay");

  var LINES = [
    { c: "cmd", k: "$", t: "devteam build" },
    { c: "", k: "contract", t: "run-tests  id a-e068" },
    { c: "dim", k: "", t: "interface + tests + toolchain, not prose" },
    { c: "dim", k: "ledger", t: "miss, nothing satisfies a-e068 yet" },
    { c: "", k: "tactic", t: "agent(contract) -> artifact" },
    { c: "", k: "verify", t: "docker --network=none, tree read-only" },
    { c: "", k: "run 1/2", t: "visible tests pass" },
    { c: "", k: "run 2/2", t: "visible tests pass, transcripts identical" },
    { c: "", k: "held-out", t: "tests the author never saw: pass" },
    { c: "ok", k: "admit", t: "artifact stored, ledger appended" },
    { c: "cmd", k: "$", t: "devteam build" },
    { c: "ok", k: "ledger", t: "hit in 45 ms (a rebuild takes 6.3 s)" }
  ];

  var timer = null;

  function makeLine(line) {
    var el = document.createElement("span");
    el.className = "ln" + (line.c ? " " + line.c : "");
    var k = document.createElement("span");
    k.className = "k";
    k.textContent = line.k;
    var t = document.createElement("span");
    t.className = "t";
    var txt = document.createTextNode("");
    t.appendChild(txt);
    el.appendChild(k);
    el.appendChild(t);
    return { el: el, t: t, txt: txt };
  }

  function renderAll() {
    if (log == null) { return; }
    log.textContent = "";
    for (var i = 0; i < LINES.length; i++) {
      var built = makeLine(LINES[i]);
      built.txt.data = LINES[i].t;
      log.appendChild(built.el);
    }
    if (state) { state.textContent = "admitted"; state.className = "state ok"; }
  }

  function typeOut() {
    if (log == null) { return; }
    if (timer) { clearTimeout(timer); }
    log.textContent = "";
    if (state) { state.textContent = "verifying"; state.className = "state"; }
    var caret = document.createElement("span");
    caret.className = "caret";
    caret.setAttribute("aria-hidden", "true");
    var li = 0;
    var ci = 0;
    var current = null;

    function step() {
      if (li >= LINES.length) {
        caret.remove();
        if (state) { state.textContent = "admitted"; state.className = "state ok"; }
        return;
      }
      var line = LINES[li];
      if (current == null) {
        current = makeLine(line);
        log.appendChild(current.el);
        current.t.appendChild(caret);
        ci = 0;
        timer = setTimeout(step, line.c === "cmd" ? 120 : 40);
        return;
      }
      if (ci < line.t.length) {
        ci += 1;
        current.txt.data = line.t.slice(0, ci);
        var delay = line.c === "cmd" ? 55 : 14;
        if (line.t.charAt(ci - 1) === " ") { delay += 18; }
        timer = setTimeout(step, delay);
        return;
      }
      li += 1;
      current = null;
      timer = setTimeout(step, line.c === "cmd" ? 380 : 220);
    }
    step();
  }

  if (log) {
    if (reduced) { renderAll(); } else { typeOut(); }
    if (replay) {
      replay.addEventListener("click", function () {
        if (reduced) { renderAll(); } else { typeOut(); }
      });
    }
  }

  /* Section reveal on scroll. Without IntersectionObserver everything simply shows. */
  var items = document.querySelectorAll(".reveal");
  if (reduced || typeof IntersectionObserver === "undefined") {
    for (var j = 0; j < items.length; j++) { items[j].classList.add("in"); }
  } else {
    var io = new IntersectionObserver(function (entries) {
      for (var n = 0; n < entries.length; n++) {
        if (entries[n].isIntersecting) {
          entries[n].target.classList.add("in");
          io.unobserve(entries[n].target);
        }
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    for (var m = 0; m < items.length; m++) { io.observe(items[m]); }
    /* Safety net: whatever the observer missed (print, previews, crawlers, no scroll) shows after a moment. */
    setTimeout(function () {
      for (var k = 0; k < items.length; k++) { items[k].classList.add("in"); }
    }, 1200);
  }

  /* Nav: mark the section currently in view. */
  var navLinks = document.querySelectorAll(".nav a[href^='#']");
  if (navLinks.length && typeof IntersectionObserver !== "undefined") {
    var byId = {};
    for (var q = 0; q < navLinks.length; q++) { byId[navLinks[q].getAttribute("href").slice(1)] = navLinks[q]; }
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      for (var r = 0; r < entries.length; r++) { visible[entries[r].target.id] = entries[r].isIntersecting; }
      var active = null;
      var sections = document.querySelectorAll("main .section");
      for (var s = 0; s < sections.length; s++) {
        if (visible[sections[s].id]) { active = sections[s].id; break; }
      }
      for (var id in byId) {
        if (id === active) { byId[id].setAttribute("aria-current", "location"); } else { byId[id].removeAttribute("aria-current"); }
      }
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    var secs = document.querySelectorAll("main .section");
    for (var u = 0; u < secs.length; u++) { spy.observe(secs[u]); }
  }
})();
