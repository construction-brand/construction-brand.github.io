#!/usr/bin/env python3
"""
Construction Brand - wire a Google Form into the page
=====================================================

Paste the form's "Get pre-filled link" URL and this writes the form ID and
the six entry IDs into data/event.js, so feedback lands in your Google Sheet
instead of WhatsApp.

    python tools/apply_google_form.py "https://docs.google.com/forms/d/e/1FAI.../viewform?usp=pp_url&entry.123=rating&..."

It matches each entry ID by the placeholder you typed into its box (type
"rating" in the Rating question, "sessions" in Sessions, and so on), so the
order you created the questions in does not matter. If the placeholders are
missing it falls back to the order they appear in the link, and says so.

    --check   parse and report, change nothing
"""

import argparse
import re
import sys
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVENT_JS = os.path.join(ROOT, "data", "event.js")

FIELDS = ["rating", "sessions", "interest", "comment", "name", "phone"]
# what someone might reasonably have typed into each box
ALIASES = {
    "rating": ["rating", "rate", "stars", "score", "پلە", "هەڵسەنگاندن"],
    "sessions": ["sessions", "session", "بڕگە", "بڕگەکان"],
    "interest": ["interest", "interests", "next", "ئارەزوو"],
    "comment": ["comment", "comments", "note", "notes", "feedback", "تێبینی", "سەرنج"],
    "name": ["name", "fullname", "ناو"],
    "phone": ["phone", "mobile", "number", "tel", "ژمارە", "مۆبایل"],
}


def read_form(form_id):
    """Fetch the published form and read its questions straight out of the page,
    so a plain share link is enough - no pre-filled link needed."""
    import json
    import urllib.request
    url = "https://docs.google.com/forms/d/e/%s/viewform" % form_id
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        html = urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "replace")
    except Exception as e:                       # noqa: BLE001
        sys.exit("Could not open the form (%s). Is it published and set to "
                 "'anyone with the link can respond'?" % e)

    if "FB_PUBLIC_LOAD_DATA_" not in html:
        sys.exit("That form did not return its questions. It is probably set to "
                 "require sign-in or limited to your organisation - a guest's phone "
                 "would be refused too. Open Settings and allow anyone to respond.")

    m = re.search(r"FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.*?\])\s*;", html, re.S)
    if not m:
        sys.exit("Could not read the form's questions.")
    data = json.loads(m.group(1))

    found = []
    for item in (data[1][1] or []):
        title = (item[1] or "").strip()
        try:
            entry = item[4][0][0]
        except (TypeError, IndexError):
            continue
        found.append((title, "entry.%d" % entry))
    if not found:
        sys.exit("The form has no answerable questions yet.")
    return found


def parse(url):
    url = url.strip().strip('"').strip("'")
    m = re.search(r"/forms/d/e/([A-Za-z0-9_-]{20,})", url)
    from_edit = None
    if not m:
        m2 = re.search(r"/forms/d/([A-Za-z0-9_-]{20,})", url)
        if m2:
            from_edit = m2.group(1)
            sys.exit("That is the EDIT link (/forms/d/%s...). Open the form's own\n"
                     "published link instead - Send -> the link with /forms/d/e/ in it -\n"
                     "or paste the pre-filled link." % from_edit[:12])
        sys.exit("No Google Form id found in that URL.")
    form_id = m.group(1)

    pairs = re.findall(r"[?&](entry\.\d+)=([^&#]*)", url)
    if not pairs:
        # no pre-filled values: read the questions off the live form instead
        questions = read_form(form_id)
        print("read %d question(s) from the published form:" % len(questions))
        for title, key in questions:
            print("   %-28s %s" % (title[:28] or "(untitled)", key))
        print()
        pairs = [(key, title.lower()) for title, key in questions]
        return _match(form_id, pairs, "question titles on the form")

    from urllib.parse import unquote_plus
    pairs = [(k, unquote_plus(v).strip().lower()) for k, v in pairs]
    return _match(form_id, pairs, "placeholder text")


def _match(form_id, pairs, matched_by):
    entries, used = {}, set()
    for field in FIELDS:
        for key, val in pairs:
            if key in used:
                continue
            if val in ALIASES[field] or val.startswith(field):
                entries[field] = key
                used.add(key)
                break

    if len(entries) < len(FIELDS):
        # fall back to the order they appear in the link
        matched_by = "position in the link (placeholders did not match)"
        entries, used = {}, set()
        for field, (key, _v) in zip(FIELDS, pairs):
            entries[field] = key
            used.add(key)

    missing = [f for f in FIELDS if f not in entries]
    if missing:
        sys.exit("Only found %d of 6 questions (missing: %s). The form needs six "
                 "short-answer questions." % (len(entries), ", ".join(missing)))
    return form_id, entries, matched_by, pairs


def apply(form_id, entries):
    with open(EVENT_JS, encoding="utf-8") as fh:
        src = fh.read()

    new, n = re.subn(r'(googleFormId:\s*")[^"]*(")', r"\g<1>%s\g<2>" % form_id, src, count=1)
    if not n:
        sys.exit("Could not find googleFormId in data/event.js")
    for field, key in entries.items():
        new, k = re.subn(r'(\b%s:\s*")entry\.\d+(")' % field, r"\g<1>%s\g<2>" % key, new, count=1)
        if not k:
            sys.exit("Could not find the %s entry line in data/event.js" % field)

    with open(EVENT_JS, "w", encoding="utf-8", newline="") as fh:
        fh.write(new)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url", help="the pre-filled link from the Google Form")
    ap.add_argument("--check", action="store_true", help="report only, change nothing")
    args = ap.parse_args()

    form_id, entries, how, pairs = parse(args.url)
    print("form id   : %s" % form_id)
    print("matched by: %s" % how)
    for f in FIELDS:
        print("  %-9s -> %s" % (f, entries[f]))
    if len(set(entries.values())) != len(FIELDS):
        sys.exit("\nTwo questions resolved to the same entry id - check the link.")

    if args.check:
        print("\n--check: nothing written.")
        return
    apply(form_id, entries)
    print("\nWritten into data/event.js.")
    print("Next: bump the ?v= in index.html and sw.js, push, then send ONE test")
    print("response and confirm the row appears in the form's Responses tab.")


if __name__ == "__main__":
    main()
