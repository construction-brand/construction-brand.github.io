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
  /* ⚠ LIVE TEST CONFIG (Sat 19 Sep) — REVERT BEFORE THE EVENT:
       date -> "2026-09-21", dateLabel -> Monday 21 Sep, opensBeforeEndMins -> 15 */
  date: "2026-09-19",       // YYYY-MM-DD  ← ڕێکەوتی ڕووداو
  tz:   "+03:00",           // Baghdad / Erbil time. Leave as is.
  ref:  "CB-EV-01",         // reference code shown in the title block

  // If you prefer the Kurdish month name, swap ئەیلول for خەرمانان.
  dateLabel: {
    ku: "شەممە، ١٩ی ئەیلولی ٢٠٢٦",
    en: "Saturday, 19 September 2026"
  },

  /* -- What ---------------------------------------------------------------- */
  title: {
    ku: "کۆبوونەوەی خاوەن پرۆژەکان",
    en: "Project Owners Evening"
  },
  tagline: {
    ku: "ئێوارەیەکی تەکنیکی لەگەڵ Construction Brand — سیستەمە نوێیەکانی بیناسازی، ڕاستەوخۆ لە بەرچاوت.",
    en: "A technical evening with Construction Brand — the newest building systems, demonstrated live."
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
     kind  = "" | "break" | "demo" | "key"   (controls the icon + tint)
     tags  = product codes shown as chips (optional)
     ----------------------------------------------------------------------- */
  schedule: [
    {
      t: "16:30", mins: 30, kind: "break",
      title: { ku: "تۆمارکردن و پێشوازی بە قاوە", en: "Registration & welcome coffee" },
      note:  { ku: "وەرگرتنی نیشانەی ناو و پاکێجی زانیاری", en: "Collect your badge and information pack" }
    },
    {
      t: "17:00", mins: 20, kind: "key",
      title: { ku: "کردنەوەی ئێوارە", en: "Opening & welcome" },
      note:  { ku: "وتەی بەڕێوەبەرایەتی Construction Brand", en: "Opening words from Construction Brand management" }
    },
    {
      t: "17:20", mins: 25,
      title: { ku: "Construction Brand کێیە؟", en: "Who we are" },
      note:  { ku: "تۆڕی دابەشکردن و خزمەتگوزاری لە هەرێمی کوردستان", en: "Our distribution and service network across Kurdistan" }
    },
    {
      t: "17:45", mins: 25,
      title: { ku: "Kalekim — سیستەمی دژە ئاو و کاشی", en: "Kalekim — waterproofing & tile systems" },
      note:  { ku: "چارەسەر بۆ ڕووکارە گەورەکان و ژێرزەمین", en: "Solutions for large surfaces and below-grade structures" },
      tags:  ["Kalekim 1411", "4507 B-TONE"]
    },
    {
      t: "18:10", mins: 20, kind: "break",
      title: { ku: "پشوو و ناسیاری", en: "Break & networking" },
      note:  { ku: "چا، قاوە و شیرینی", en: "Tea, coffee and refreshments" }
    },
    {
      t: "18:30", mins: 25,
      title: { ku: "Momentum — سیستەمی ئیزۆلەی گەرمی", en: "Momentum — thermal insulation systems" },
      note:  { ku: "کەمکردنەوەی خەرجی وزە لە پرۆژە گەورەکاندا", en: "Cutting energy cost on large-scale projects" },
      tags:  ["Momentum FN-50"]
    },
    {
      t: "18:55", mins: 25,
      title: { ku: "Kale — بۆیەی ڕووکار و ناوەوە", en: "Kale — façade & interior paint" },
      note:  { ku: "ڕەنگ و پاراستنی درێژخایەن بۆ ڕووکاری بینا", en: "Colour and long-term protection for building façades" },
      tags:  ["Silikonatex", "Performa"]
    },
    {
      t: "19:20", mins: 25, kind: "demo",
      title: { ku: "پیشاندانی ڕاستەوخۆی بەرهەم", en: "Live product demonstration" },
      note:  { ku: "مێزی تاقیکردنەوە — بەردەستە بۆ هەموو میوانێک", en: "Hands-on test table, open to every guest" }
    },
    {
      t: "19:45", mins: 25,
      title: { ku: "پرسیار و وەڵام", en: "Q&A with project owners" },
      note:  { ku: "لەگەڵ تیمی تەکنیکی و بەڕێوەبەرایەتی", en: "With our technical and management team" }
    },
    {
      t: "20:10", mins: 20, kind: "key",
      title: { ku: "هاوبەشی و وەکالەت", en: "Partnership & dealership" },
      note:  { ku: "داواکاری وەکیل لە شارەکانی هەرێمی کوردستان", en: "Dealership openings across the Kurdistan Region" }
    },
    {
      t: "20:30", mins: 60, kind: "break",
      title: { ku: "نانی ئێوارە و ناسیاری", en: "Dinner & networking" },
      note:  { ku: "بەخێربێن — ئێوارەتان خۆش", en: "Please join us. Enjoy your evening" }
    }
  ],

  /* -- Brands on show ------------------------------------------------------- */
  partners: [
    { name: "Kalekim",  note: { ku: "چەسپێنەر و دژە ئاو", en: "Adhesives & waterproofing" } },
    { name: "Kale",     note: { ku: "بۆیە و ڕووکار",       en: "Paint & façade" } },
    { name: "Momentum", note: { ku: "ئیزۆلە و پلاستەر",    en: "Insulation & plaster" } }
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

       opensBeforeEndMins: 15   ->  feedback appears 15 min before 21:30,
                                    i.e. from 21:15 on the night
       closesAfterDays:    7    ->  anyone scanning within a week still gets
                                    the form; after that, a thank-you page

     Staff override, works instantly and needs no redeploy:
       <url>?view=feedback   force the feedback form
       <url>?view=schedule   force the programme
     ----------------------------------------------------------------------- */
  feedback: {
    opensBeforeEndMins: 440,   // ⚠ TEST: 21:30 − 440 min = 14:10 today. Real value: 15
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
    eyebrow: "بەرنامەی ئێوارە",
    tbLocation: "شوێن", tbDate: "ڕێکەوت", tbDoors: "دەرگا دەکرێتەوە", tbRef: "ژمارە",
    untilDoors: "ماوە بۆ دەستپێکردن",
    liveNow: "ئێستا", upNext: "دواتر", finished: "بەرنامە تەواو بوو",
    thanks: "سوپاس بۆ بەشداریتان",
    progress: "بەرەوپێشچوونی ئێوارە",
    programme: "بەرنامە", totalDur: "کۆی کات",
    addCal: "زیادکردن بۆ ڕۆژژمێر", directions: "ڕێنمایی شوێن",
    partners: "براندەکانی ئەم ئێوارەیە",
    contactTitle: "پەیوەندی", saveContact: "پاشەکەوتکردنی ژمارە",
    whatsapp: "واتساپ", instagram: "ئینستاگرام", address: "ناونیشان",
    mins: "خولەک", hrs: "کاتژمێر", days: "ڕۆژ",
    done: "تەواو", themeLabel: "گۆڕینی ڕووناکی",
    footer: "بەخێربێن بۆ ئێوارەی خاوەن پرۆژەکان",

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
    fbClosedBody: "ئێوارەی خاوەن پرۆژەکان تەواو بوو. بۆ هەر پرسیارێک پەیوەندیمان پێوە بکەن."
  },
  en: {
    dir: "ltr", htmlLang: "en", other: "کوردی", otherShort: "KU",
    eyebrow: "Evening Programme",
    tbLocation: "Location", tbDate: "Date", tbDoors: "Doors", tbRef: "Ref",
    untilDoors: "Doors open in",
    liveNow: "Happening now", upNext: "Up next", finished: "Programme complete",
    thanks: "Thank you for joining us",
    progress: "Evening progress",
    programme: "Programme", totalDur: "Total",
    addCal: "Add to calendar", directions: "Directions",
    partners: "Brands on show tonight",
    contactTitle: "Contact", saveContact: "Save our number",
    whatsapp: "WhatsApp", instagram: "Instagram", address: "Address",
    mins: "min", hrs: "hr", days: "d",
    done: "Done", themeLabel: "Switch appearance",
    footer: "Welcome to the Project Owners Evening",

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
    fbClosedBody: "The Project Owners Evening has finished. Get in touch any time."
  }
};
