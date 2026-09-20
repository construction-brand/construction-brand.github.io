/* ============================================================================
   CONSTRUCTION BRAND — EVENT DATA
   ----------------------------------------------------------------------------
   هەموو شتێک لەم فایلەدا دەگۆڕدرێت. پێویست ناکات فایلی تر دەستکاری بکەیت.
   This is the ONLY file you need to edit. Change the date, times and text
   here and the whole page updates itself.

   ⚠ CONFIRM BEFORE PRINTING THE QR: `date` and the `schedule` times below are
     a DRAFT. Replace them with the final running order.
   ========================================================================== */

window.EVENT = {

  /* -- When ---------------------------------------------------------------- */
  date: "2026-09-21",       // YYYY-MM-DD  ← ڕێکەوتی ڕووداو
  tz:   "+03:00",           // Baghdad / Erbil time. Leave as is.

  /* -- What ---------------------------------------------------------------- */
  title: {
    ku: "کۆبوونەوەی خاوەن پرۆژەکان",
    en: "Project Owners Evening"
  },
  /* -- Where --------------------------------------------------------------- */
  venue: {
    name:  { ku: "هۆتێلی گراند میلینیۆم", en: "Grand Millennium" },
    city:  { ku: "سلێمانی", en: "Sulaimani" },
    hall:  { ku: "هۆڵی سەرەکی", en: "Main Ballroom" },
    maps:  "https://www.google.com/maps/search/?api=1&query=Grand+Millennium+Sulaimani"
  },

  /* -- Programme ------------------------------------------------------------
     t     = start time, 24h "HH:MM"
     mins  = duration in minutes
     kind  = "" | "break" | "dinner" | "demo" | "key"   (small labelled pill)
     tags  = product codes shown as chips (optional)
     ----------------------------------------------------------------------- */
  /* The confirmed running order (from the client's sheet, 20 Sep). Dinner has
     no end time on the sheet; 60 min is assumed so the evening has an end,
     which is what the feedback switch counts back from. */
  schedule: [
    {
      t: "17:45", mins: 5,
      title: { ku: "بەخێرهاتن", en: "Welcome" }
    },
    {
      t: "17:50", mins: 5, kind: "key",
      title: { ku: "وتەی بەڕێز Eng. Selim Gul", en: "Address by Eng. Selim Gul" },
      note:  { ku: "خاوەنی کۆمپانیای مۆمێنتەم", en: "Owner of the Momentum company" }
    },
    {
      t: "17:55", mins: 35,
      title: { ku: "ناساندنی بەرهەمەکانی کۆمپانیای مۆمێنتەم", en: "Introducing Momentum's products" },
      note:  { ku: "لەلایەن بەڕێز ئەندازیار زوبێر محمد — نوێنەری کۆمپانیای مۆمێنتەم",
               en: "By Eng. Zubair Mohammed, Momentum's representative" }
    },
    {
      t: "18:30", mins: 20,
      title: { ku: "شێوازی بەکارهێنانی مۆمێنتەم و هەڵسەنگاندنی ئیشکردن",
               en: "How Momentum products are applied, and how they perform" },
      note:  { ku: "لەلایەن ئەندازیار بەهمەن ڕەئوف شوان — بەرپرسیاری کۆنستراکشن براند",
               en: "By Eng. Bahman Raouf Shwan, Construction Brand" }
    },
    {
      t: "18:50", mins: 10,
      title: { ku: "پرسیار و وەڵام", en: "Q&A" }
    },
    {
      t: "19:00", mins: 60, kind: "dinner",
      title: { ku: "نان خواردن + مۆسیقای زیندوو", en: "Dinner + live music" },
      note:  { ku: "بەخێربێن — ئێوارەتان خۆش", en: "Please join us. Enjoy your evening" }
    }
  ],

  /* -- Contact -------------------------------------------------------------- */
  contact: {
    phones: [
      { display: "0770 307 5050", dial: "+9647703075050" },
      { display: "0770 308 5050", dial: "+9647703085050" }
    ],
    whatsapp:  "+9647703075050",
    instagram: "construction.brand",
    address: {
      ku: "بازنەی مەلیک محمود — تەنیشت پردی کۆبانی، سلێمانی",
      en: "Malik Mahmoud roundabout — next to Kobani bridge, Sulaimani"
    }
  },

  /* -- Feedback -------------------------------------------------------------
     The SAME QR code shows the programme during the event and the feedback
     form at the end. Nothing is reprinted — the page decides which view to
     show from the clock.

       opensAt: "18:30"         ->  the form takes over at exactly 18:30.
                                    Leave it "" to use opensBeforeEndMins
                                    instead, which counts back from the end
                                    of the last item.
       closesAfterDays:    7    ->  anyone scanning within a week still gets
                                    the form; after that, a thank-you page

     A "Give feedback" button in the footer opens the form at any time, so a
     guest never has to wait for the switch.

     Staff override, works instantly and needs no redeploy:
       <url>?view=feedback   force the feedback form
       <url>?view=schedule   force the programme
     ----------------------------------------------------------------------- */
  feedback: {
    opensAt: "18:30",           // 24h clock, event timezone. "" = use the countback below
    opensBeforeEndMins: 15,
    closesAfterDays: 7,

    /* WHERE THE ANSWERS GO.
       Create a Google Form, then open it and use "Get pre-filled link" to
       read the entry IDs. Paste the form ID and the six entry IDs here.
       Leave googleFormId empty and the form falls back to sending the
       answers to you as a WhatsApp message instead. */
    googleFormId: "",
    entries: {
      rating:    "entry.000000001",
      sessions:  "entry.000000002",
      interest:  "entry.000000003",
      comment:   "entry.000000004",
      name:      "entry.000000005",
      phone:     "entry.000000006"
    },

    /* used only when googleFormId is empty — feedback lands on THIS number */
    whatsappFallback: "+9647722149070",

    /* what we ask guests they want next — this is the lead capture */
    interests: [
      { id: "dealership", ku: "وەکالەتی براندەکان",            en: "Dealership" },
      { id: "visit",      ku: "سەردانی تەکنیکی بۆ پرۆژەکەم",   en: "Technical visit to my project" },
      { id: "prices",     ku: "لیستی نرخ",                      en: "Price list" },
      { id: "samples",    ku: "نموونەی بەرهەم",                 en: "Product samples" },
      { id: "training",   ku: "ڕاهێنان بۆ تیمەکەم",             en: "Training for my team" }
    ]
  },

  /* -- The URL this page is published at (used by the QR generator) ---------- */
  url: "https://construction-brand.github.io/"
};


/* ============================================================================
   INTERFACE STRINGS — وشەکانی ڕووکار
   ========================================================================== */
window.UI = {
  ku: {
    dir: "rtl", htmlLang: "ckb", other: "English", otherShort: "EN",
    welcome: "بەخێربێن",
    untilDoors: "ماوە بۆ دەستپێکردن",
    liveNow: "ئێستا", upNext: "دواتر", finished: "بەرنامە تەواو بوو",
    thanks: "سوپاس بۆ بەشداریتان",
    progress: "بەرەوپێشچوونی ئێوارە",
    programme: "بەرنامە", totalDur: "کۆی کات",
    colTime: "کات", colItem: "بڕگە", colDur: "ماوە",
    contactTitle: "پەیوەندی", saveContact: "پاشەکەوتکردنی ژمارە",
    whatsapp: "واتساپ", instagram: "ئینستاگرام", address: "ناونیشان",
    mins: "خولەک", hrs: "کاتژمێر", days: "ڕۆژ",
    done: "تەواو", themeLabel: "گۆڕینی ڕووناکی",

    fbEyebrow: "ڕای ئێوە",
    fbTitle: "ئێوارەکە چۆن بوو؟",
    fbLead: "دوو خولەک لە کاتتان — یارمەتیمان دەدات ئێوارەی داهاتوو باشتر بێت.",
    fbRating: "بە گشتی چەند ڕازی بوویت؟",
    fbRatingScale: ["زۆر خراپ", "خراپ", "باش", "زۆر باش", "نایاب"],
    fbSessions: "کام بەشانە زۆرترین سوودیان پێگەیاندی؟",
    fbSessionsHint: "چەند دانەیەک هەڵبژێرە",
    fbInterest: "دەتەوێت چی بۆ بکەین؟",
    fbComment: "تێبینییەکی تر",
    fbCommentPlaceholder: "هەرچی بە باشی زانیت بینووسە…",
    fbName: "ناو", fbPhone: "ژمارەی مۆبایل",
    fbOptional: "ئارەزوومەندانە",
    fbSend: "ناردنی ڕا",
    fbSending: "دەنێردرێت…",
    fbNeedRating: "تکایە پلەیەک هەڵبژێرە.",
    fbThanksTitle: "سوپاس بۆ ڕاکەت",
    fbThanksBody: "وەریگرت. بەم زووانە پەیوەندیت پێوە دەکەین.",
    fbQueued: "ئینتەرنێت نییە — ڕاکەت پاشەکەوت کرا و خۆکارانە دەنێردرێت.",
    fbBackToProgramme: "بینینی بەرنامەی ئێوارە",
    fbToFeedback: "ناردنی ڕا",
    fbClosedTitle: "سوپاس بۆ بەشداریتان",
    fbClosedBody: "ئێوارەی خاوەن پرۆژەکان تەواو بوو. بۆ هەر پرسیارێک پەیوەندیمان پێوە بکەن.",
    fbWaTitle: "نزیکەی تەواوە",
    fbWaBody: "واتساپ دەبێت کرابێتەوە — لەوێ دوگمەی ناردن دابگرە. ئەگەر نەکرایەوە، ئەم دوگمەیە دابگرە:",
    fbWaBtn: "کردنەوەی واتساپ",
    fbWaBack: "گەڕانەوە بۆ فۆرمەکە"
  },
  en: {
    dir: "ltr", htmlLang: "en", other: "کوردی", otherShort: "KU",
    welcome: "Welcome",
    untilDoors: "Doors open in",
    liveNow: "Happening now", upNext: "Up next", finished: "Programme complete",
    thanks: "Thank you for joining us",
    progress: "Evening progress",
    programme: "Agenda", totalDur: "Total",
    colTime: "Time", colItem: "Item", colDur: "Duration",
    contactTitle: "Contact", saveContact: "Save our number",
    whatsapp: "WhatsApp", instagram: "Instagram", address: "Address",
    mins: "min", hrs: "hr", days: "d",
    done: "Done", themeLabel: "Switch appearance",

    fbEyebrow: "Your feedback",
    fbTitle: "How was the evening?",
    fbLead: "Two minutes of your time helps us make the next one better.",
    fbRating: "Overall, how satisfied were you?",
    fbRatingScale: ["Poor", "Fair", "Good", "Very good", "Excellent"],
    fbSessions: "Which sessions were most useful to you?",
    fbSessionsHint: "Pick as many as you like",
    fbInterest: "What would you like from us next?",
    fbComment: "Anything else",
    fbCommentPlaceholder: "Tell us whatever you think…",
    fbName: "Name", fbPhone: "Mobile number",
    fbOptional: "optional",
    fbSend: "Send feedback",
    fbSending: "Sending…",
    fbNeedRating: "Please choose a rating first.",
    fbThanksTitle: "Thank you",
    fbThanksBody: "We have it. We will be in touch shortly.",
    fbQueued: "No connection — your answers are saved and will send by themselves.",
    fbBackToProgramme: "View the evening programme",
    fbToFeedback: "Give feedback",
    fbClosedTitle: "Thank you for joining us",
    fbClosedBody: "The Project Owners Evening has finished. Get in touch any time.",
    fbWaTitle: "Almost done",
    fbWaBody: "WhatsApp should have opened — press Send there. If it did not open, tap this:",
    fbWaBtn: "Open WhatsApp",
    fbWaBack: "Back to the form"
  }
};
