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
     left on the wrong zone must not render the evening an hour away from
     what is printed on the invitation. */
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
  /* an exact clock time if one is given, otherwise counted back from the end */
  var fbOpensAt  = /^\d{1,2}:\d{2}$/.test(FB.opensAt || "")
    ? at(FB.opensAt)
    : new Date(evEnd.getTime() - (FB.opensBeforeEndMins || 15) * 60000);
  var fbClosesAt = new Date(evEnd.getTime() + (FB.closesAfterDays || 7) * 86400000);

  function fmtDur(mins) {
    var L = UI[lang];
    if (mins < 60) { return mins + " " + L.mins; }
    var h = Math.floor(mins / 60), m = mins % 60;
    return m ? h + " " + L.hrs + " " + m + " " + L.mins : h + " " + L.hrs;
  }

  /* the agenda's duration column: one number over its unit, the same shape on
     every row, so nothing wraps differently from its neighbour */
  function durParts(mins) {
    var L = UI[lang];
    if (mins < 60 || mins % 60) { return { n: String(mins), u: L.mins }; }
    return { n: String(mins / 60), u: L.hrs };
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
  /* "17:45 – 20:00", always read left-to-right whatever the page direction */
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

    $("heroHi").textContent = L.welcome;
    meterBox.setAttribute("aria-label", L.progress);

    var total = Math.round((evEnd - evStart) / 60000);
    $("totalDur").textContent = L.totalDur + " · " + fmtDur(total);
  }

  function renderProgramme() {
    var L = UI[lang];
    rail.textContent = "";

    items.forEach(function (it, i) {
      var s = it.raw;

      /* one table row: time range · item · duration */
      var li = el("tr", "arow");
      li.style.animationDelay = Math.min(i * 45, 420) + "ms";

      /* time range, always left-to-right; the end time drops to its own
         line on narrow phones (see CSS) */
      /* The duration is rendered twice and CSS shows one: its own column on
         a wide screen, and tucked under the time range on a phone, where
         a third column would squeeze "17:45–17:50" onto two lines. Whichever
         is display:none is also out of the accessibility tree. */
      var dp = durParts(s.mins);
      var durText = dp.n + " " + dp.u;

      var timeCol = el("td", "c-time");
      var clock = el("span", "arow__clock");
      clock.setAttribute("dir", "ltr");
      clock.appendChild(el("bdi", "t1", s.t));
      clock.appendChild(el("bdi", "t2", clockOf(it.end)));   /* CSS adds the dash */
      timeCol.appendChild(clock);
      timeCol.appendChild(el("span", "arow__dur arow__dur--inline", durText));

      var nodeCol = el("td", "c-dur");
      nodeCol.appendChild(el("span", "arow__dur arow__dur--col", durText));

      /* the item */
      var body = el("td", "c-item");

      /* one line of pills above the title: live state (now / next) and the
         kind of item, if any; hidden entirely when there is nothing to show */
      var tags = el("div", "arow__tags");
      var stateSlot = el("span", "arow__state");
      stateSlot.style.display = "none";
      tags.appendChild(stateSlot);

      var KIND = {
        break:  { ku: "پشوو",       en: "Break",      icon: "cup" },
        dinner: { ku: "نانی ئێوارە", en: "Dinner",     icon: "dinner" },
        demo:   { ku: "پیشاندان",   en: "Demo",       icon: "play" },
        key:    { ku: "گرنگ",       en: "Key moment", icon: "star" }
      }[s.kind];
      if (KIND) {
        var pill = el("span", "kindtag");
        pill.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">' + ICONS[KIND.icon] + "</svg>";
        pill.appendChild(document.createTextNode(t(KIND)));
        tags.appendChild(pill);
      }
      tags.hidden = !KIND;
      body.appendChild(tags);

      body.appendChild(el("h3", "arow__title", t(s.title)));
      if (s.note) { body.appendChild(el("p", "arow__note", t(s.note))); }

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

      /* column order follows the document direction: in Kurdish the time
         sits on the right and the duration on the left, as on the sheet */
      li.appendChild(timeCol);
      li.appendChild(body);
      li.appendChild(nodeCol);
      rail.appendChild(li);

      it.node  = li;
      it.state = stateSlot;
      it.tags  = tags;
      it.hasKind = !!KIND;
    });
  }

  var ICONS = {
    star:   '<path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="currentColor"/>',
    cup:    '<path d="M4.5 8.5h11v5.5a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4V8.5Zm11 1.5h1.5a2.5 2.5 0 0 1 0 5h-1.5" fill="none" stroke="currentColor" stroke-width="1.9"/>',
    dinner: '<path d="M6.5 3v7.5M4.5 3v4.5a2 2 0 0 0 4 0V3M6.5 10.5V21M17.5 3c-2.2 1.2-3.5 3.4-3.5 6.5V12h3.5v9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    play:   '<path d="M8 5.5v13l10-6.5z" fill="currentColor"/>',
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
    /* text first, icon last: with space-between the card fills edge to edge
       instead of leaving half of it blank */
    a.appendChild(tx);
    a.appendChild(ic);
    return a;
  }

  function renderContact() {
    var L = UI[lang], C = E.contact;
    var box = $("contact");
    box.textContent = "";

    C.phones.forEach(function (p, i) {
      box.appendChild(contactRow(ICONS.phone, L.tel + " " + (i + 1), p.display, "tel:" + p.dial, true));
    });
    box.appendChild(contactRow(ICONS.chat, L.whatsapp, C.whatsapp,
      "https://wa.me/" + C.whatsapp.replace(/[^0-9]/g, ""), true));
    /* Instagram lives in the footer's Social media section now */
    box.appendChild(contactRow(ICONS.pin, L.address, t(C.address), E.venue.maps));

    /* a real .vcf file, same tab: iPhone shows the contact card with
       "Create New Contact", Android offers to import it */
    box.appendChild(contactRow(ICONS.save, "vCard", L.saveContact, "assets/construction-brand.vcf"));

    renderSocial();
  }

  /* ---- social media ----------------------------------------------------- */

  /* the real marks, so they are recognised at a glance rather than read */
  var BRAND_SVG = {
    facebook:
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
      '<path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.89v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"/>' +
      '</svg>',
    instagram:
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
      '<defs><radialGradient id="igG" cx="30%" cy="107%" r="150%">' +
      '<stop offset="0%" stop-color="#FDD35D"/><stop offset="25%" stop-color="#FD5C3B"/>' +
      '<stop offset="50%" stop-color="#E1306C"/><stop offset="75%" stop-color="#C13584"/>' +
      '<stop offset="100%" stop-color="#5B51D8"/></radialGradient></defs>' +
      '<rect x="1.4" y="1.4" width="21.2" height="21.2" rx="6.2" fill="url(#igG)"/>' +
      '<circle cx="12" cy="12" r="4.6" fill="none" stroke="#fff" stroke-width="2"/>' +
      '<circle cx="17.6" cy="6.5" r="1.4" fill="#fff"/>' +
      '</svg>'
  };

  function renderSocial() {
    var C = E.contact, box = $("social");
    box.textContent = "";

    var links = [];
    if (C.facebook) {
      links.push({ k: "facebook", label: "Facebook", href: C.facebook });
    }
    if (C.instagram) {
      /* the platform name, not the handle: "@construction.brand" wrapped to
         two lines inside a half-width tile on a real phone */
      links.push({ k: "instagram", label: "Instagram",
                   href: "https://instagram.com/" + C.instagram });
    }

    links.forEach(function (s) {
      var a = el("a", "social__tile");
      a.href = s.href;
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("aria-label", s.label);
      var ic = el("span", "social__ico");
      ic.innerHTML = BRAND_SVG[s.k];
      a.appendChild(ic);
      var b = document.createElement("bdi");
      b.className = "social__name";
      b.textContent = s.label;
      a.appendChild(b);
      box.appendChild(a);
    });

    /* no links configured at all: hide the heading too */
    $("social").parentNode.hidden = links.length === 0;
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
  var manualAt = 0;

  function resolveView(now) {
    var forced = forcedView();
    if (forced) { return forced; }
    /* Someone who chose the programme BEFORE the form was due should still
       be handed the form when its time comes; a choice made after the window
       opened is theirs to keep. */
    if (manualView === "schedule" && manualAt < fbOpensAt.getTime() && now >= fbOpensAt) {
      manualView = null;
    }
    if (manualView) { return manualView; }
    if (now >= fbClosesAt) { return "closed"; }
    if (now >= fbOpensAt)  { return "feedback"; }
    return "schedule";
  }

  function setManual(view) {
    manualView = view;
    manualAt = new Date().getTime();
  }

  var viewNow = null;

  function applyView(view) {
    if (view === viewNow) { return; }
    viewNow = view;

    $("viewSchedule").hidden = (view !== "schedule");
    $("viewFeedback").hidden = (view === "schedule");
    /* the footer shortcut is only useful while the programme is showing */
    $("fbFoot").hidden = (view !== "schedule");

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
    $("fbWaLink").hidden = true;          // only the WhatsApp hand-off shows these
    $("fbWaBack").hidden = true;
    $("fbDone").hidden = false;
  }


  /* ======================================================================
     FEEDBACK FORM
     ==================================================================== */

  /* Answers live here, not only in the DOM, so switching language mid-form
     re-renders the labels without throwing away what has been filled in. */
  var fbState = { comment: "" };

  function readFeedback() {
    fbState.comment = $("fbComment").value;
  }

  function renderFeedback() {
    var L = UI[lang];

    $("fbEyebrow").textContent      = L.fbEyebrow;
    $("fbTitle").textContent        = L.fbTitle;
    $("fbLead").textContent         = L.fbLead;
    $("fbCommentLabel").textContent = L.fbComment;
    $("fbSend").textContent         = L.fbSend;
    $("fbBack").textContent         = L.fbBackToProgramme;
    $("fbComment").placeholder      = L.fbCommentPlaceholder;
    $("fbComment").value            = fbState.comment;
  }

  /* ---- sending ---------------------------------------------------------- */

  /* Is the Google Form actually configured? A mistyped or still-placeholder
     entry ID would otherwise let the page thank 200 guests for answers that
     were never recorded. Real Google entry IDs never begin with a zero. */
  var GOOGLE_FIELDS = ["comment"];

  /* Accept either the bare form ID or any pasted Google Forms URL — a full
     link is what people naturally copy, and it must not silently fail. */
  function googleFormId() {
    var raw = String(FB.googleFormId || "").trim();
    var m = /\/forms\/d\/e\/([A-Za-z0-9_-]+)/.exec(raw);
    return m ? m[1] : raw;
  }

  function googleConfigured() {
    if (!/^[A-Za-z0-9_-]{20,}$/.test(googleFormId())) { return false; }
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
    form.action = "https://docs.google.com/forms/d/e/" + googleFormId() + "/formResponse";
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
    field((FB.entries || {}).comment, payload.comment);

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
  /* Fixed ASCII labels, not the translated question text: this message is read
     by staff, and tools/whatsapp_to_csv.py turns a chat export of these into a
     spreadsheet. Long Kurdish questions as labels made it unreadable and
     unparseable. */
  function whatsAppUrl(payload) {
    var lines = ["CB FEEDBACK", "Comment: " + payload.comment.replace(/\s*\n\s*/g, " ")];
    var num = String(FB.whatsappFallback || "").replace(/[^0-9]/g, "");
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(lines.join("\n"));
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

    if (!fbState.comment.trim()) {
      err.textContent = L.fbNeedComment;
      err.hidden = false;
      $("fbComment").focus();
      return;
    }
    err.hidden = true;

    /* drop the phone keyboard so the thank-you is on screen, not under it */
    if (document.activeElement && document.activeElement.blur) { document.activeElement.blur(); }

    var btn = $("fbSend");
    btn.disabled = true;
    btn.textContent = L.fbSending;

    var payload = { comment: fbState.comment.trim() };

    function settle(message) {
      set("cb.fbSent", "1");
      $("fbForm").hidden = true;
      showDone(L.fbThanksTitle, message || L.fbThanksBody);
    }

    /* No usable Google Form (missing, or an entry ID still a placeholder):
       hand off to WhatsApp. That only counts as DELIVERED once the guest
       presses Send inside WhatsApp, so no thank-you and no cb.fbSent latch
       here. Show a hand-off with a real link (Instagram's and WhatsApp's own
       in-app browsers ignore window.open) and a way back to the form. */
    if (!googleConfigured()) {
      var wa = whatsAppUrl(payload);
      try { window.open(wa, "_blank", "noopener"); } catch (e) { /* ignore */ }
      btn.disabled = false;
      btn.textContent = L.fbSend;
      $("fbForm").hidden = true;
      showDone(L.fbWaTitle, L.fbWaBody);
      var link = $("fbWaLink");
      link.href = wa;
      link.textContent = L.fbWaBtn;
      link.hidden = false;
      var back = $("fbWaBack");
      back.textContent = L.fbWaBack;
      back.hidden = false;
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
       over to the feedback form at the right minute with nobody touching it. */
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
        /* how far into this item we are - drawn as a bar under its time */
        it.node.style.setProperty("--p", Math.max(0, Math.min(1, (now - it.start) / (it.end - it.start))).toFixed(3));
      } else if (isNext) {
        if (slot.getAttribute("data-s") !== "next") {
          slot.textContent = "";
          slot.appendChild(el("span", "nexttag", L.upNext));
          slot.setAttribute("data-s", "next");
        }
        slot.style.display = "";
        it.node.style.removeProperty("--p");
      } else {
        slot.style.display = "none";
        slot.removeAttribute("data-s");
        it.node.style.removeProperty("--p");
      }
      /* the pill row only takes space when it has something in it */
      if (it.tags) { it.tags.hidden = slot.style.display === "none" && !it.hasKind; }
    });

    /* bring the current item into view, once, on arrival — but never snatch
       the page away from a thumb that has already started scrolling */
    if (!scrolledOnce && current && viewNow === "schedule") {
      scrolledOnce = true;
      setTimeout(function () {
        if (window.scrollY > 40) { return; }
        current.node.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 900);
    }
  }

  /* The contact card is a static file, assets/construction-brand.vcf, linked
     directly: a blob download parks it in Files on an iPhone, a real URL
     opens Contacts. */

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
    setManual("schedule");
    applyView("schedule");
    window.scrollTo(0, 0);
  });

  /* both routes into the form: the strip button once the window is open, and
     the footer button at any hour */
  function openFeedback() {
    clearForcedView();
    setManual("feedback");
    applyView("feedback");
    window.scrollTo(0, 0);
  }
  $("fbGo").addEventListener("click", openFeedback);
  $("fbFoot").addEventListener("click", openFeedback);

  /* anything saved while offline goes out as soon as there is a connection */
  flushQueue();
  window.addEventListener("online", flushQueue);

  $("themeBtn").addEventListener("click", function () {
    theme = currentlyDark() ? "light" : "dark";
    set("cb.theme", theme);
    applyTheme();
  });

  /* the WhatsApp hand-off keeps the answers: "back" just re-shows the form */
  $("fbWaBack").addEventListener("click", function () {
    $("fbDone").hidden = true;
    $("fbForm").hidden = false;
    $("fbForm").scrollIntoView({ block: "start", behavior: "smooth" });
  });

  /* keep working when the hotel wi-fi does not */
  if ("serviceWorker" in navigator &&
      (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* ignore */ });
    });
  }
})();
