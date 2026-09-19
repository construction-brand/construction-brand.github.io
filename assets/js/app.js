/* ============================================================================
   CONSTRUCTION BRAND — Project Owners Evening
   Everything here is driven by data/event.js. You should not need to edit this.
   ========================================================================= */
(function () {
  "use strict";

  var E  = window.EVENT;
  var UI = window.UI;
  if (!E || !UI) { return; }

  var root = document.documentElement;

  /* ---- storage (can throw in private mode) ------------------------------ */
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  var lang  = get("cb.lang") === "en" ? "en" : "ku";
  var theme = get("cb.theme");                   // "light" | "dark" | null = system

  /* ---- helpers ---------------------------------------------------------- */
  function t(obj) {
    if (obj == null) { return ""; }
    if (typeof obj === "string") { return obj; }
    return obj[lang] != null ? obj[lang] : (obj.en || "");
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text != null) { n.textContent = text; }
    return n;
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  /* Combine the event date + "HH:MM" + timezone into a real moment. */
  function at(hhmm) { return new Date(E.date + "T" + hhmm + ":00" + E.tz); }

  /* Clocks are printed in the EVENT's timezone, never the phone's. A handset
     left on the wrong zone must not render the evening as "16:30 – 20:30"
     next to a 21:30 printed on the invitation. */
  var TZ_MIN = (function () {
    var m = /^([+-])(\d{2}):(\d{2})$/.exec(E.tz || "+00:00");
    if (!m) { return 0; }
    return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
  })();

  function clockOf(d) {
    var shifted = new Date(d.getTime() + TZ_MIN * 60000);
    return pad(shifted.getUTCHours()) + ":" + pad(shifted.getUTCMinutes());
  }

  /* Build the timeline once — absolute start/end for every item. */
  var items = E.schedule.map(function (s) {
    var start = at(s.t);
    return {
      raw: s,
      start: start,
      end: new Date(start.getTime() + s.mins * 60000),
      node: null
    };
  });
  var evStart = items[0].start;
  var evEnd   = items[items.length - 1].end;

  /* ---- when the page stops being a programme and becomes a feedback form --
     Both are absolute instants, so a guest whose phone is set to another
     timezone still flips at the same real-world second as everyone else. */
  var FB = E.feedback || {};
  var fbOpensAt  = new Date(evEnd.getTime() - (FB.opensBeforeEndMins || 15) * 60000);
  var fbClosesAt = new Date(evEnd.getTime() + (FB.closesAfterDays || 7) * 86400000);

  function fmtDur(mins) {
    var L = UI[lang];
    if (mins < 60) { return mins + " " + L.mins; }
    var h = Math.floor(mins / 60), m = mins % 60;
    return m ? h + " " + L.hrs + " " + m + " " + L.mins : h + " " + L.hrs;
  }

  function countdown(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600);  s -= h * 3600;
    var m = Math.floor(s / 60);    s -= m * 60;
    return { days: d, clock: pad(h) + ":" + pad(m) + ":" + pad(s) };
  }

  /* Bidi-safe pieces. Kurdish runs right-to-left while a clock reads
     left-to-right; without isolation the browser reorders them and
     "20 ڕۆژ 01:05:14" comes out as "20 01:05:14 ڕۆژ". */
  function bdi(text, dir) {
    var b = document.createElement("bdi");
    if (dir) { b.setAttribute("dir", dir); }
    b.textContent = text;
    return b;
  }
  function setParts(node, parts) {
    node.textContent = "";
    parts.forEach(function (p, i) {
      if (i) { node.appendChild(document.createTextNode("  ")); }
      node.appendChild(p);
    });
  }
  /* "16:30 – 21:30", always read left-to-right whatever the page direction */
  function fullSpan() { return bdi(E.schedule[0].t + " – " + clockOf(evEnd), "ltr"); }

  /* ---- element refs ----------------------------------------------------- */
  var $ = function (id) { return document.getElementById(id); };
  var statusBox  = $("status"),
      statusLbl  = $("statusLabel"),
      statusVal  = $("statusValue"),
      meterFill  = $("meterFill"),
      meterCap   = $("meterCaption"),
      meterBox   = $("meter"),
      rail       = $("rail");

  var scrolledOnce = false;

  /* ======================================================================
     RENDER
     ==================================================================== */

  function renderChrome() {
    var L = UI[lang];

    root.setAttribute("lang", L.htmlLang);
    root.setAttribute("dir", L.dir);
    document.title = t(E.title) + " — Construction Brand";

    /* static labels */
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-i18n]"),
      function (n) {
        var v = L[n.getAttribute("data-i18n")];
        if (v) { n.textContent = v; }
      }
    );

    $("langBtnText").textContent = L.otherShort;
    $("langBtn").setAttribute("aria-label", L.other);
    $("themeBtn").setAttribute("aria-label", L.themeLabel);

    $("evTitle").textContent   = t(E.title);
    $("evTagline").textContent = t(E.tagline);

    $("tbLocation").textContent = t(E.venue.name) + " · " + t(E.venue.city);
    $("tbDate").textContent     = t(E.dateLabel);
    $("tbDoors").textContent    = E.schedule[0].t;
    $("tbRef").textContent      = E.ref;
    $("footRef").textContent    = E.ref;
    $("footLine").textContent   = L.footer;
    $("mapBtn").href            = E.venue.maps;
    meterBox.setAttribute("aria-label", L.progress);

    var total = Math.round((evEnd - evStart) / 60000);
    $("totalDur").textContent = L.totalDur + " · " + fmtDur(total);
  }

  function renderProgramme() {
    var L = UI[lang];
    rail.textContent = "";

    items.forEach(function (it, i) {
      var s = it.raw;

      var li = el("li", "item");
      li.style.animationDelay = Math.min(i * 45, 420) + "ms";

      /* time */
      var timeCol = el("div", "item__time");
      var clock = el("span", "item__clock");
      clock.appendChild(document.createTextNode(s.t));
      clock.setAttribute("dir", "ltr");
      timeCol.appendChild(clock);
      timeCol.appendChild(el("span", "item__dur", fmtDur(s.mins)));

      /* rail */
      var nodeCol = el("div", "item__node");
      nodeCol.appendChild(el("span", "item__dot"));

      /* body */
      var body = el("div", "item__body");

      var stateSlot = el("div", "item__state");
      stateSlot.style.display = "none";
      body.appendChild(stateSlot);

      if (s.kind === "break" || s.kind === "demo" || s.kind === "key") {
        var tagText = {
          break: { ku: "پشوو", en: "Break" },
          demo:  { ku: "پیشاندان", en: "Demo" },
          key:   { ku: "گرنگ", en: "Key moment" }
        }[s.kind];
        body.appendChild(el("span", "kindtag", t(tagText)));
      }

      body.appendChild(el("h3", "item__title", t(s.title)));
      if (s.note) { body.appendChild(el("p", "item__note", t(s.note))); }

      if (s.tags && s.tags.length) {
        var chips = el("ul", "chips");
        s.tags.forEach(function (tag) {
          var c = el("li", "chip");
          var b = document.createElement("bdi");
          b.textContent = tag;
          c.appendChild(b);
          chips.appendChild(c);
        });
        body.appendChild(chips);
      }

      li.appendChild(timeCol);
      li.appendChild(nodeCol);
      li.appendChild(body);
      rail.appendChild(li);

      it.node  = li;
      it.state = stateSlot;
    });
  }

  function renderPartners() {
    var ul = $("partners");
    ul.textContent = "";
    E.partners.forEach(function (p) {
      var li = el("li", "partner");
      var nm = el("span", "partner__name");
      var b = document.createElement("bdi");
      b.textContent = p.name;
      nm.appendChild(b);
      li.appendChild(nm);
      li.appendChild(el("span", "partner__note", t(p.note)));
      ul.appendChild(li);
    });
  }

  var ICONS = {
    phone: '<path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4 1.5v3A2.5 2.5 0 0 1 18 20 15 15 0 0 1 4 6a2.5 2.5 0 0 1 2.5-2.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    chat:  '<path d="M20.5 11.7a8 8 0 0 1-11.9 7L4 20l1.4-4.4A8 8 0 1 1 20.5 11.7Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    cam:   '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/>',
    pin:   '<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    save:  '<path d="M12 3v11m0 0 4-4m-4 4-4-4M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  function contactRow(icon, key, value, href, isMono) {
    var a = href ? el("a", "row") : el("div", "row");
    if (href) {
      a.href = href;
      if (href.indexOf("http") === 0) { a.target = "_blank"; a.rel = "noopener"; }
    }
    var ic = el("span", "row__ico");
    ic.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">' + icon + "</svg>";
    var tx = el("span", "row__txt");
    tx.appendChild(el("span", "row__k", key));
    var v = el("span", "row__v" + (isMono ? " mono" : ""));
    var b = document.createElement("bdi");
    b.textContent = value;
    v.appendChild(b);
    tx.appendChild(v);
    a.appendChild(ic);
    a.appendChild(tx);
    return a;
  }

  function renderContact() {
    var L = UI[lang], C = E.contact;
    var box = $("contact");
    box.textContent = "";

    C.phones.forEach(function (p, i) {
      box.appendChild(contactRow(ICONS.phone, "Tel 0" + (i + 1), p.display, "tel:" + p.dial, true));
    });
    box.appendChild(contactRow(ICONS.chat, L.whatsapp, C.whatsapp,
      "https://wa.me/" + C.whatsapp.replace(/[^0-9]/g, ""), true));
    box.appendChild(contactRow(ICONS.cam, L.instagram, "@" + C.instagram,
      "https://instagram.com/" + C.instagram));
    box.appendChild(contactRow(ICONS.pin, L.address, t(C.address), E.venue.maps));

    var saveBtn = contactRow(ICONS.save, "vCard", L.saveContact, "#");
    saveBtn.addEventListener("click", function (ev) { ev.preventDefault(); downloadVcf(); });
    box.appendChild(saveBtn);
  }

  /* ======================================================================
     VIEW ROUTING — one QR, two pages
     ==================================================================== */

  /* ?view=schedule / ?view=feedback lets staff force either view on the
     night without touching the code or waiting for a redeploy. */
  function forcedView() {
    var m = /[?&]view=(schedule|feedback)/.exec(location.search || "");
    return m ? m[1] : null;
  }

  /* A guest tapping "View the programme" gets a temporary, in-memory switch —
     NOT a ?view= navigation. A navigation would pin that phone to the
     programme for good and quietly drop them out of the feedback window. */
  var manualView = null;

  function resolveView(now) {
    var forced = forcedView();
    if (forced) { return forced; }
    if (manualView) { return manualView; }
    if (now >= fbClosesAt) { return "closed"; }
    if (now >= fbOpensAt)  { return "feedback"; }
    return "schedule";
  }

  var viewNow = null;

  function applyView(view) {
    if (view === viewNow) { return; }
    viewNow = view;

    $("viewSchedule").hidden = (view !== "schedule");
    $("viewFeedback").hidden = (view === "schedule");

    if (view === "closed") {
      $("fbForm").hidden = true;
      showDone(UI[lang].fbClosedTitle, UI[lang].fbClosedBody);
    } else if (view === "feedback") {
      if (get("cb.fbSent") === "1") {
        $("fbForm").hidden = true;
        /* if anything is still sitting in the outbox, say so rather than
           claiming it arrived */
        showDone(UI[lang].fbThanksTitle,
                 queued() ? UI[lang].fbQueued : UI[lang].fbThanksBody);
      } else {
        $("fbForm").hidden = false;
        $("fbDone").hidden = true;
      }
    }
  }

  function showDone(title, body) {
    $("fbThanksTitle").textContent = title;
    $("fbThanksBody").textContent  = body;
    $("fbDone").hidden = false;
  }


  /* ======================================================================
     FEEDBACK FORM
     ==================================================================== */

  /* Answers live here, not only in the DOM, so switching language mid-form
     re-renders the labels without throwing away what has been filled in. */
  var fbState = { rating: null, sessions: [], interest: [], comment: "", name: "", phone: "" };

  function readFeedback() {
    var checked = document.querySelector('input[name="cb-rating"]:checked');
    fbState.rating = checked ? checked.value : null;
    fbState.sessions = Array.prototype.map.call(
      document.querySelectorAll('#fbSessions input:checked'), function (i) { return i.value; });
    fbState.interest = Array.prototype.map.call(
      document.querySelectorAll('#fbInterest input:checked'), function (i) { return i.value; });
    fbState.comment = $("fbComment").value;
    fbState.name    = $("fbName").value;
    fbState.phone   = $("fbPhone").value;
  }

  /* keeps the selected style working on engines without :has() */
  function markOn(input) {
    var box = input.closest(".rating__opt") || input.closest(".pick");
    if (!box) { return; }
    if (input.type === "radio") {
      Array.prototype.forEach.call(
        document.querySelectorAll('input[name="' + input.name + '"]'),
        function (other) {
          var b = other.closest(".rating__opt");
          if (b) { b.classList.toggle("is-on", other.checked); }
        });
    } else {
      box.classList.toggle("is-on", input.checked);
    }
  }

  function option(wrapClass, inputType, id, name, value, checked, build) {
    var label = el("label", wrapClass);
    var input = document.createElement("input");
    input.type = inputType;
    input.id = id;
    if (name) { input.name = name; }
    input.value = value;
    input.checked = !!checked;
    label.appendChild(input);
    build(label);
    if (checked) { label.classList.add("is-on"); }
    input.addEventListener("change", function () { markOn(input); });
    return label;
  }

  function renderFeedback() {
    var L = UI[lang];

    $("fbEyebrow").textContent      = L.fbEyebrow;
    $("fbTitle").textContent        = L.fbTitle;
    $("fbLead").textContent         = L.fbLead;
    $("fbRatingLabel").textContent  = L.fbRating;
    $("fbSessionsLabel").textContent = L.fbSessions;
    $("fbSessionsHint").textContent = L.fbSessionsHint;
    $("fbInterestLabel").textContent = L.fbInterest;
    $("fbCommentLabel").textContent = L.fbComment;
    $("fbNameLabel").textContent    = L.fbName + " · " + L.fbOptional;
    $("fbPhoneLabel").textContent   = L.fbPhone + " · " + L.fbOptional;
    $("fbSend").textContent         = L.fbSend;
    $("fbBack").textContent         = L.fbBackToProgramme;
    $("fbComment").placeholder      = L.fbCommentPlaceholder;

    /* rating 1-5 */
    var box = $("fbRating");
    box.textContent = "";
    L.fbRatingScale.forEach(function (word, i) {
      var v = String(i + 1);
      box.appendChild(option("rating__opt", "radio", "cb-rating-" + v, "cb-rating", v,
        fbState.rating === v, function (label) {
          label.appendChild(el("span", "rating__num", v));
          label.appendChild(el("span", "rating__word", word));
        }));
    });

    /* Sessions — built from the real programme, so the list always matches.
       The VALUE is the schedule index, never the visible title: a guest who
       switches language mid-form must not lose what they already ticked. */
    var sess = $("fbSessions");
    sess.textContent = "";
    E.schedule.forEach(function (s, i) {
      if (s.kind === "break") { return; }          // nobody rates the coffee
      var key = String(i);
      sess.appendChild(option("pick", "checkbox", "cb-sess-" + i, "", key,
        fbState.sessions.indexOf(key) > -1, function (label) {
          label.appendChild(el("span", null, t(s.title)));
        }));
    });

    /* What they want next — value is the stable id, not the translation. */
    var ints = $("fbInterest");
    ints.textContent = "";
    (FB.interests || []).forEach(function (o) {
      ints.appendChild(option("pick", "checkbox", "cb-int-" + o.id, "", o.id,
        fbState.interest.indexOf(o.id) > -1, function (label) {
          label.appendChild(el("span", null, t(o)));
        }));
    });

    $("fbComment").value = fbState.comment;
    $("fbName").value    = fbState.name;
    $("fbPhone").value   = fbState.phone;
  }

  /* turn the stable keys back into readable English for the spreadsheet */
  function sessionLabels(keys) {
    return keys.map(function (k) {
      var s = E.schedule[Number(k)];
      return s ? (s.title.en || s.title.ku || k) : k;
    });
  }
  function interestLabels(ids) {
    var list = FB.interests || [];
    return ids.map(function (id) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) { return list[i].en || list[i].ku || id; }
      }
      return id;
    });
  }

  /* ---- sending ---------------------------------------------------------- */

  /* Is the Google Form actually configured? A mistyped or still-placeholder
     entry ID would otherwise let the page thank 200 guests for answers that
     were never recorded. Real Google entry IDs never begin with a zero. */
  var GOOGLE_FIELDS = ["rating", "sessions", "interest", "comment", "name", "phone"];

  function googleConfigured() {
    if (!FB.googleFormId || !/^[A-Za-z0-9_-]{20,}$/.test(FB.googleFormId)) { return false; }
    var en = FB.entries || {};
    for (var i = 0; i < GOOGLE_FIELDS.length; i++) {
      if (!/^entry\.[1-9]\d{4,}$/.test(en[GOOGLE_FIELDS[i]] || "")) { return false; }
    }
    return true;
  }

  /* Google Forms accepts an ordinary cross-origin form POST aimed at a hidden
     iframe. We cannot read the reply (same-origin policy), so the iframe's
     load event is the only delivery signal we get: load => delivered,
     timeout => NOT delivered. The difference is what stops the page lying. */
  function sendToGoogle(payload, done) {
    var form = document.createElement("form");
    form.action = "https://docs.google.com/forms/d/e/" + FB.googleFormId + "/formResponse";
    form.method = "POST";
    form.target = "cbFbSink";
    form.style.display = "none";

    function field(key, value) {
      if (!key || value == null || value === "") { return; }
      var i = document.createElement("input");
      i.type = "hidden";
      i.name = key;
      i.value = value;
      form.appendChild(i);
    }
    var en = FB.entries || {};
    field(en.rating,   payload.rating);
    field(en.sessions, payload.sessions.join(", "));
    field(en.interest, payload.interest.join(", "));
    field(en.comment,  payload.comment);
    field(en.name,     payload.name);
    field(en.phone,    payload.phone);

    var sink = $("cbFbSink");
    var settled = false;
    function finish(delivered) {
      if (settled) { return; }
      settled = true;
      sink.removeEventListener("load", onLoad);
      if (form.parentNode) { form.parentNode.removeChild(form); }
      done(delivered);
    }
    function onLoad() { finish(true); }

    sink.addEventListener("load", onLoad);
    setTimeout(function () { finish(false); }, 10000);   // no load => not delivered

    document.body.appendChild(form);
    form.submit();
  }

  /* No Google Form configured? Hand the answers to WhatsApp instead, so the
     evening is never left with no way to collect them. */
  function sendToWhatsApp(payload) {
    var L = UI[lang];
    var lines = [
      "★ " + payload.rating + "/5 — " + L.fbRating,
      payload.sessions.length ? L.fbSessions + ": " + payload.sessions.join(", ") : "",
      payload.interest.length ? L.fbInterest + ": " + payload.interest.join(", ") : "",
      payload.comment ? L.fbComment + ": " + payload.comment : "",
      payload.name  ? L.fbName + ": " + payload.name : "",
      payload.phone ? L.fbPhone + ": " + payload.phone : ""
    ].filter(Boolean);
    var num = String(FB.whatsappFallback || "").replace(/[^0-9]/g, "");
    window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(lines.join("\n")), "_blank");
  }

  /* Outbox. Every answer is written here BEFORE we try to send it and removed
     only once Google confirms, so nothing is lost to a dropped connection, a
     closed tab or a phone that sleeps mid-submit. */
  function readQueue() {
    try {
      var q = JSON.parse(get("cb.fbQueue") || "[]");
      return Object.prototype.toString.call(q) === "[object Array]" ? q : [];
    } catch (e) { return []; }
  }
  function writeQueue(q) { set("cb.fbQueue", JSON.stringify(q)); }

  function queue(payload) {
    var q = readQueue();
    q.push(payload);
    writeQueue(q);
  }
  function dequeue(ref) {
    writeQueue(readQueue().filter(function (p) { return p.ref !== ref; }));
  }
  function queued() { return readQueue().length; }

  var flushing = false;

  function flushQueue() {
    if (flushing || !googleConfigured() || navigator.onLine === false) { return; }
    var q = readQueue();
    if (!q.length) { return; }
    flushing = true;
    var left = q.length;
    q.forEach(function (payload) {
      sendToGoogle(payload, function (delivered) {
        if (delivered) { dequeue(payload.ref); }   // a failure stays queued
        if (--left === 0) { flushing = false; }
      });
    });
  }

  function submitFeedback(ev) {
    ev.preventDefault();
    readFeedback();

    var L = UI[lang];
    var err = $("fbError");

    if (!fbState.rating) {
      err.textContent = L.fbNeedRating;
      err.hidden = false;
      $("fbRating").scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    err.hidden = true;

    var btn = $("fbSend");
    btn.disabled = true;
    btn.textContent = L.fbSending;

    /* Answers go to the sheet in English whichever language the guest used,
       so the results are one consistent column instead of two. */
    var payload = {
      rating: fbState.rating,
      sessions: sessionLabels(fbState.sessions),
      interest: interestLabels(fbState.interest),
      comment: fbState.comment,
      name: fbState.name,
      phone: fbState.phone
    };

    function settle(message) {
      set("cb.fbSent", "1");
      $("fbForm").hidden = true;
      showDone(L.fbThanksTitle, message || L.fbThanksBody);
    }

    /* No usable Google Form (missing, or an entry ID still a placeholder):
       hand off to WhatsApp rather than pretend the answers went somewhere. */
    if (!googleConfigured()) {
      sendToWhatsApp(payload);
      settle();
      return;
    }

    payload.ref = "r" + Date.now() + "-" + Math.round(Math.random() * 1e6);
    queue(payload);                       // saved first, sent second

    if (navigator.onLine === false) {
      settle(L.fbQueued);                 // the outbox will retry by itself
      return;
    }

    sendToGoogle(payload, function (delivered) {
      if (delivered) {
        dequeue(payload.ref);
        settle();
      } else {
        /* Still in the outbox. Say so honestly instead of "we have it". */
        settle(L.fbQueued);
      }
    });
  }


  /* ======================================================================
     LIVE STATE
     ==================================================================== */

  function tick() {
    var L   = UI[lang];
    var now = new Date();

    /* Re-checked every second, so a page left open on a table swaps itself
       over to the feedback form at 21:15 with nobody touching it. */
    applyView(resolveView(now));

    /* Once the window is open there is always a way back INTO the form, so
       looking at the programme is never a one-way door. */
    $("fbGo").hidden = !(now >= fbOpensAt && now < fbClosesAt);

    var current = null, next = null;
    items.forEach(function (it) {
      if (now >= it.start && now < it.end) { current = it; }
      if (!next && now < it.start) { next = it; }
    });

    var state = now < evStart ? "before" : (now >= evEnd ? "done" : "live");

    statusBox.classList.toggle("is-live", state === "live");
    statusBox.classList.toggle("is-done", state === "done");

    /* -- status strip -- */
    if (state === "before") {
      statusLbl.textContent = L.untilDoors;
      var cd = countdown(evStart - now);
      var parts = [];
      if (cd.days > 0) { parts.push(bdi(cd.days + " " + L.days)); }
      parts.push(bdi(cd.clock, "ltr"));
      setParts(statusVal, parts);
      meterFill.style.width = "0%";
      setParts(meterCap, [fullSpan()]);
    } else if (state === "live") {
      statusLbl.textContent = L.liveNow;
      statusVal.textContent = current ? t(current.raw.title) : t(next ? next.raw.title : E.title);
      var pct = ((now - evStart) / (evEnd - evStart)) * 100;
      meterFill.style.width = Math.max(1, Math.min(100, pct)).toFixed(1) + "%";
      if (current) {
        var left = Math.max(0, Math.ceil((current.end - now) / 60000));
        setParts(meterCap, [
          bdi(current.raw.t + " – " + clockOf(current.end), "ltr"),
          bdi("·"),
          bdi(fmtDur(left) + " " + (lang === "ku" ? "ماوە" : "left"))
        ]);
      } else if (next) {
        setParts(meterCap, [bdi(L.upNext), bdi("·"), bdi(next.raw.t, "ltr")]);
      }
    } else {
      statusLbl.textContent = L.finished;
      statusVal.textContent = L.thanks;
      meterFill.style.width = "100%";
      setParts(meterCap, [fullSpan()]);
    }

    /* -- programme rows -- */
    items.forEach(function (it) {
      var isDone = now >= it.end;
      var isNow  = current === it;
      var isNext = next === it && state !== "done";

      it.node.classList.toggle("is-done", isDone);
      it.node.classList.toggle("is-now", isNow);
      it.node.classList.toggle("is-next", isNext && !isNow);

      var slot = it.state;
      if (isNow) {
        if (slot.getAttribute("data-s") !== "now") {
          slot.textContent = "";
          var tag = el("span", "nowtag", L.liveNow);
          slot.appendChild(tag);
          slot.setAttribute("data-s", "now");
        }
        slot.style.display = "";
      } else if (isNext) {
        if (slot.getAttribute("data-s") !== "next") {
          slot.textContent = "";
          slot.appendChild(el("span", "nexttag", L.upNext));
          slot.setAttribute("data-s", "next");
        }
        slot.style.display = "";
      } else {
        slot.style.display = "none";
        slot.removeAttribute("data-s");
      }
    });

    /* bring the current item into view, once, on arrival */
    if (!scrolledOnce && current && viewNow === "schedule") {
      scrolledOnce = true;
      setTimeout(function () {
        current.node.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 900);
    }
  }

  /* ======================================================================
     DOWNLOADS
     ==================================================================== */

  function save(filename, mime, text) {
    var blob = new Blob([text], { type: mime + ";charset=utf-8" });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function icsStamp(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
           pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
  }
  function esc(s) { return String(s).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); }

  function downloadIcs() {
    var lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "CALSCALE:GREGORIAN",
      "PRODID:-//Construction Brand//Event//EN",
      "BEGIN:VEVENT",
      "UID:" + E.ref.toLowerCase() + "@construction.brand",
      "DTSTAMP:" + icsStamp(new Date()),
      "DTSTART:" + icsStamp(evStart),
      "DTEND:"   + icsStamp(evEnd),
      "SUMMARY:" + esc(t(E.title) + " — Construction Brand"),
      "LOCATION:" + esc(t(E.venue.name) + ", " + t(E.venue.city)),
      "DESCRIPTION:" + esc(t(E.tagline) + "\n" + E.url),
      "URL:" + E.url,
      "END:VEVENT", "END:VCALENDAR"
    ];
    save("construction-brand-event.ics", "text/calendar", lines.join("\r\n"));
  }

  function downloadVcf() {
    var C = E.contact;
    var lines = ["BEGIN:VCARD", "VERSION:3.0", "N:;Construction Brand;;;", "FN:Construction Brand",
                 "ORG:Construction Brand"];
    C.phones.forEach(function (p) { lines.push("TEL;TYPE=CELL:" + p.dial); });
    lines.push("ADR;TYPE=WORK:;;" + esc(C.address.en) + ";;;;Iraq");
    lines.push("URL:https://instagram.com/" + C.instagram);
    lines.push("END:VCARD");
    save("construction-brand.vcf", "text/vcard", lines.join("\r\n"));
  }

  /* ======================================================================
     THEME + LANGUAGE
     ==================================================================== */

  function applyTheme() {
    if (theme === "light" || theme === "dark") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var dark = theme === "dark" ||
        (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
      meta.setAttribute("content", dark ? "#0E202A" : "#1C3547");
    }
  }

  function currentlyDark() {
    if (theme) { return theme === "dark"; }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  /* ======================================================================
     BOOT
     ==================================================================== */

  applyTheme();
  renderChrome();
  renderProgramme();
  renderPartners();
  renderContact();
  renderFeedback();
  tick();
  setInterval(tick, 1000);

  $("langBtn").addEventListener("click", function () {
    readFeedback();                      // keep whatever has been typed
    lang = lang === "ku" ? "en" : "ku";
    set("cb.lang", lang);
    renderChrome();
    renderProgramme();
    renderPartners();
    renderContact();
    renderFeedback();
    viewNow = null;                      // force the view text to re-render
    tick();
  });

  $("fbForm").addEventListener("submit", submitFeedback);

  /* Drop a ?view= override out of the address bar without reloading, so a
     guest's own choice is not overruled a second later by a staff link they
     happened to open. */
  function clearForcedView() {
    if (!forcedView() || !window.history || !history.replaceState) { return; }
    var kept = location.search.replace(/^\?/, "").split("&").filter(function (p) {
      return p && !/^view=/.test(p);
    }).join("&");
    try {
      history.replaceState(null, "", location.pathname + (kept ? "?" + kept : "") + location.hash);
    } catch (e) { /* ignore */ }
  }

  /* Both directions are in-memory toggles — neither navigates, so neither can
     strand a phone on the wrong view for the rest of the night. */
  $("fbBack").addEventListener("click", function (ev) {
    ev.preventDefault();
    clearForcedView();
    manualView = "schedule";
    applyView("schedule");
    window.scrollTo(0, 0);
  });

  $("fbGo").addEventListener("click", function () {
    clearForcedView();
    manualView = null;                   // hand the decision back to the clock
    applyView("feedback");
    window.scrollTo(0, 0);
  });

  /* anything saved while offline goes out as soon as there is a connection */
  flushQueue();
  window.addEventListener("online", flushQueue);

  $("themeBtn").addEventListener("click", function () {
    theme = currentlyDark() ? "light" : "dark";
    set("cb.theme", theme);
    applyTheme();
  });

  $("calBtn").addEventListener("click", downloadIcs);

  /* keep working when the hotel wi-fi does not */
  if ("serviceWorker" in navigator &&
      (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* ignore */ });
    });
  }
})();
