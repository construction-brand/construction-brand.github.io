/* ============================================================================
   CONSTRUCTION BRAND — EVENT DATA
   ----------------------------------------------------------------------------
   هەموو شتێک لەم فایلەدا دەگۆڕدرێت. پێویست ناکات هیچ فایلێکی تر دەستکاری بکەیت.
   This is the ONLY file you need to edit. Change the date, times and text
   here and the whole page updates itself.

   ⚠ CONFIRM BEFORE PRINTING THE QR: `date` and the `schedule` times below are
     a DRAFT. Replace them with the final running order.
   ========================================================================== */

window.EVENT = {

  /* -- When ---------------------------------------------------------------- */
  date: "2026-09-21",       // YYYY-MM-DD  ← ڕێکەوتی بۆنە
  tz:   "+03:00",           // Baghdad / Erbil time. Leave as is.

  /* -- What ---------------------------------------------------------------- */
  title: {
    ku: "دیداری خاوەن پڕۆژەکان",
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

     "dinner" and "break" are left OUT of the programme time shown under the
     title — that figure counts the sessions only. Every row still appears in
     the table, and the evening's full span is the one in the status strip.
     ----------------------------------------------------------------------- */
  /* The confirmed running order (from the client's sheet, 20 Sep). Dinner has
     no end time on the sheet; 60 min is assumed so the evening has an end,
     which is what the feedback switch counts back from. */
  schedule: [
    {
      t: "17:45", mins: 5,
      title: { ku: "پێشوازی و بەخێرهاتن", en: "Reception & Welcome" }
    },
    {
      t: "17:50", mins: 5, kind: "key",
      title: { ku: "وتەی بەڕێز ئەندازیار Selim Gül", en: "Address by Eng. Selim Gül" },
      note:  { ku: "دامەزرێنەر و خاوەنی کۆمپانیای مۆمێنتەم", en: "Founder and Owner of Momentum Company" }
    },
    {
      t: "17:55", mins: 35,
      title: { ku: "ناساندنی بەرهەمەکانی براندی مۆمێنتەم", en: "Introducing Momentum Brand Products" },
      note:  { ku: "لەلایەن بەڕێز ئەندازیار زەید محەمەد — نوێنەری کۆمپانیای مۆمێنتەم لە عێراق",
               en: "By Eng. Zaid Mohammed — Representative of Momentum Company in Iraq" }
    },
    {
      t: "18:30", mins: 20,
      title: { ku: "شێوازی بەکارهێنانی عەزلی مۆمێنتەم لەڕووکاری دەرەوەی بیناو باڵەخانەکاندا",
               en: "Application Methods of Momentum Insulation on Building Facades" },
      note:  { ku: "لەلایەن بەڕێز ئەندازیار بەهمەن ڕەئووف شوان — بەڕێوبەری کۆنستراکشن براند",
               en: "By Eng. Bahman Raouf Shwan — Director of Construction Brand" }
    },
    {
      t: "18:50", mins: 25,
      title: { ku: "پانێڵی پرسیار و وەڵام وە گفتوگۆکردن لەگەڵ ئامادەبواندا", en: "Q&A Panel and Discussion with Attendees" }
    },
    {
      t: "19:15", mins: 105, kind: "dinner",
      title: { ku: "ئێوارەخوان و لایڤ میوسیک", en: "Dinner & Live Music" },
      note:  { ku: "لەلایەن هونەرمەند بۆکان هەورامی", en: "By Artist Bokan Hawrami" }
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
    /* Paste the Facebook page's full URL. Left empty, the Facebook tile in the
       footer simply does not appear — better than sending guests to a guess. */
    facebook:  "https://www.facebook.com/Construction.brand",
    address: {
      ku: "شەقامی بازنەیی مەلیک مەحموود — تەنیشت پردی کۆبانێ، سلێمانی",
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
       The form asks one question: the guest's own words. That goes into the
       Google Form's "Comment" question; the other five questions on the form
       are simply left blank, which is why none of them may be Required.
       Leave googleFormId empty and it falls back to WhatsApp instead. */
    googleFormId: "1FAIpQLScfzEC7lbArHPJvshafZhzcjBynqAlgjeXzx5oZeWLgF9GCig",
    entries: {
      comment:   "entry.2131995354"
    },

    /* used only when googleFormId is empty — feedback lands on THIS number */
    whatsappFallback: "+9647722149070"
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
    liveNow: "ئێستا لە بەڕێوەچووندایە", upNext: "بڕگەی دواتر", finished: "بەرنامەکە کۆتایی هات",
    thanks: "سوپاس بۆ ئامادەبوونتان",
    progress: "بەرەوپێشچوونی بەرنامە",
    programme: "بەرنامەی کار", totalDur: "کۆی کاتی بەرنامە",
    colTime: "کاتژمێر", colItem: "بڕگە", colDur: "ماوە",
    contactTitle: "پەیوەندیکردن", saveContact: "تۆمارکردنی ژمارەی پەیوەندی",
    socialTitle: "سۆشیال میدیا",
    whatsapp: "واتساپ", instagram: "ئینستاگرام", address: "ناونیشان",
    mins: "خولەک", hrs: "کاتژمێر", days: "ڕۆژ",
    done: "تەواو بوو", themeLabel: "گۆڕینی دۆخی ڕووناکی",

    fbEyebrow: "ڕاوبۆچوونی ئێوە",
    fbTitle: "ئێوارەکە چۆن بوو بە لای ئێوەوە؟",
    fbLead: "تەنها دوو خولەک لە کاتتان — یارمەتیدەرمان دەبێت بۆ پێشکەشکردنی بۆنەی باشتر لە داهاتوودا.",
    fbRating: "بە گشتی، تا چەند لە بەرنامەی ئەمڕۆ ڕازی بوون؟",
    fbRatingScale: ["زۆر لاواز", "لاواز", "مامناوەند", "زۆر باش", "نایاب"],
    fbSessions: "کام لە بڕگەکان زۆرترین سوودیان پێگەیاندن؟",
    fbSessionsHint: "دەتوانن یەک یان چەند بڕگەیەک هەڵبژێرن",
    fbInterest: "ئارەزووی کام لەم خزمەتگوزارییانە دەکەن بۆ داهاتوو؟",
    fbComment: "ڕا، سەرنج و تێبینییەکانتان",
    fbCommentPlaceholder: "هەر سەرنج، تێبینی، یان پێشنیارێکتان هەیە لێرەدا بینووسن…",
    fbNeedComment: "تکایە سەرەتا ڕاوبۆچوونتان بنووسن.",
    fbName: "ناو", fbPhone: "ژمارەی مۆبایل",
    fbOptional: "ئارەزوومەندانە",
    fbSend: "ناردنی ڕاوبۆچوون",
    fbSending: "لە ناردندایە…",
    fbNeedRating: "تکایە سەرەتا هەڵسەنگاندنێک هەڵبژێرن.",
    fbThanksTitle: "سوپاس بۆ ڕا و پێشنیارەکانتان",
    fbThanksBody: "ڕاوبۆچوونەکەتان بە سەرکەوتوویی گەیشت. لە زووترین کاتدا پەیوەندیتان پێوە دەکەین.",
    fbQueued: "هێڵی ئینتەرنێت نییە — زانیارییەکانت تۆمار کران و خۆکارانە دەنێردرێن لە کاتی بەردەستبووندا.",
    fbBackToProgramme: "گەڕانەوە بۆ بەرنامەی ئێوارە",
    fbToFeedback: "دەربڕینی ڕاوبۆچوون",
    fbClosedTitle: "سوپاس بۆ ئامادەبوون و بەشداریتان",
    fbClosedBody: "بەرنامەی دیداری خاوەن پڕۆژەکان کۆتایی هات. هەمیشە دەتوانن بۆ هەر پرسیارێک پەیوەندیمان پێوە بکەن.",
    fbWaTitle: "هەنگاوی کۆتایی",
    fbWaBody: "ئەپی واتساپ دەکرێتەوە — تکایە لەوێ دوگمەی ناردن (Send) دابگرن. ئەگەر خۆکارانە نەکرایەوە، ئەم دوگمەیەی خوارەوە دابگرن:",
    fbWaBtn: "کردنەوەی واتساپ",
    fbWaBack: "گەڕانەوە بۆ فۆڕمی ڕاپرسی"
  },
  en: {
    dir: "ltr", htmlLang: "en", other: "کوردی", otherShort: "KU",
    welcome: "Welcome",
    untilDoors: "Time until start",
    liveNow: "Currently in progress", upNext: "Up next", finished: "Programme completed",
    thanks: "Thank you for attending",
    progress: "Programme progress",
    programme: "Programme agenda", totalDur: "Programme time",
    colTime: "Time", colItem: "Item", colDur: "Duration",
    contactTitle: "Contact", saveContact: "Save contact number",
    socialTitle: "Social media",
    whatsapp: "WhatsApp", instagram: "Instagram", address: "Address",
    mins: "min", hrs: "hr", days: "d",
    done: "Completed", themeLabel: "Switch appearance",

    fbEyebrow: "Your feedback",
    fbTitle: "How was the evening for you?",
    fbLead: "Just two minutes of your time — helps us deliver better events in the future.",
    fbRating: "Overall, how satisfied were you with today's programme?",
    fbRatingScale: ["Very poor", "Poor", "Moderate", "Very good", "Excellent"],
    fbSessions: "Which sessions were most useful to you?",
    fbSessionsHint: "You can select one or more sessions",
    fbInterest: "Which services are you interested in for the future?",
    fbComment: "Your thoughts, notes and feedback",
    fbCommentPlaceholder: "Write any thoughts, notes, or suggestions here…",
    fbNeedComment: "Please write your feedback first.",
    fbName: "Name", fbPhone: "Mobile number",
    fbOptional: "optional",
    fbSend: "Submit feedback",
    fbSending: "Sending…",
    fbNeedRating: "Please choose a rating first.",
    fbThanksTitle: "Thank you for your feedback",
    fbThanksBody: "Your feedback was received successfully. We will be in touch shortly.",
    fbQueued: "No connection — your feedback is saved and will send automatically once online.",
    fbBackToProgramme: "Return to evening programme",
    fbToFeedback: "Give feedback",
    fbClosedTitle: "Thank you for attending and participating",
    fbClosedBody: "The Project Owners Evening programme has ended. You can always contact us for any inquiries.",
    fbWaTitle: "Final step",
    fbWaBody: "WhatsApp will open — please press Send there. If it did not open automatically, tap the button below:",
    fbWaBtn: "Open WhatsApp",
    fbWaBack: "Back to the feedback form"
  }
};
