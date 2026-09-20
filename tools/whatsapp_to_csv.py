#!/usr/bin/env python3
"""
Construction Brand - turn WhatsApp feedback into a spreadsheet
==============================================================

Use this only if the feedback went to WhatsApp instead of a Google Form
(that is, `googleFormId` was left empty in data/event.js).

In WhatsApp, open the chat -> menu -> More -> Export chat -> Without media.
You get a .txt file. Then:

    python tools/whatsapp_to_csv.py --chat "WhatsApp Chat with Construction Brand.txt"

Writes feedback.csv next to it: one row per guest, with the rating, the
sessions they picked, what they want next, their comment, name and phone.
Open it in Excel or Google Sheets.

    python tools/whatsapp_to_csv.py --chat export.txt --out results.csv
    python tools/whatsapp_to_csv.py --chat export.txt --summary   # also print averages

Handles both the iOS export format
    [21/09/2026, 20:15:33] Ahmed: CB FEEDBACK
and the Android one
    21/09/2026, 20:15 - Ahmed: CB FEEDBACK
including messages that run over several lines.
"""

import argparse
import csv
import os
import re
import sys

FIELDS = ["Rating", "Sessions", "Interest", "Comment", "Name", "Phone"]

# a line that starts a new message, in either export format
IOS = re.compile(r"^\[(?P<when>[^\]]+)\]\s(?P<who>[^:]+?):\s(?P<body>.*)$")
ANDROID = re.compile(r"^(?P<when>\d{1,2}[/.]\d{1,2}[/.]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\s-\s(?P<who>[^:]+?):\s(?P<body>.*)$")


def split_messages(text):
    """Group the export's lines into whole messages."""
    msgs = []
    cur = None
    for raw in text.splitlines():
        line = raw.replace("‎", "").replace("‪", "").replace("‬", "").rstrip()
        m = IOS.match(line) or ANDROID.match(line)
        if m:
            if cur:
                msgs.append(cur)
            cur = {"when": m.group("when").strip(), "who": m.group("who").strip(),
                   "lines": [m.group("body")]}
        elif cur is not None:
            cur["lines"].append(line)
    if cur:
        msgs.append(cur)
    return msgs


def parse_feedback(msg):
    """Pull the six fields out of one CB FEEDBACK message, if it is one."""
    body = "\n".join(msg["lines"])
    if "CB FEEDBACK" not in body.upper():
        return None

    row = {"received_at": msg["when"], "sent_by": msg["who"]}
    current = None
    for line in body.splitlines():
        line = line.strip()
        if not line or line.upper() == "CB FEEDBACK":
            continue
        hit = None
        for f in FIELDS:
            if line.lower().startswith(f.lower() + ":"):
                hit = f
                break
        if hit:
            current = hit.lower()
            row[current] = line[len(hit) + 1:].strip()
        elif current:                       # a comment that wrapped onto a new line
            row[current] = (row.get(current, "") + " " + line).strip()

    if "rating" not in row:
        return None
    row["rating"] = row["rating"].split("/")[0].strip()
    for f in FIELDS:
        k = f.lower()
        row.setdefault(k, "")
        if row[k] == "-":
            row[k] = ""
    return row


def main():
    ap = argparse.ArgumentParser(description="WhatsApp feedback export -> CSV")
    ap.add_argument("--chat", required=True, help="the exported .txt file")
    ap.add_argument("--out", help="output CSV (default: feedback.csv beside the chat)")
    ap.add_argument("--summary", action="store_true", help="also print averages and counts")
    args = ap.parse_args()

    if not os.path.exists(args.chat):
        sys.exit("Not found: %s" % args.chat)
    with open(args.chat, encoding="utf-8-sig", errors="replace") as fh:
        text = fh.read()

    msgs = split_messages(text)
    rows = [r for r in (parse_feedback(m) for m in msgs) if r]

    out = args.out or os.path.join(os.path.dirname(os.path.abspath(args.chat)), "feedback.csv")
    cols = ["received_at", "sent_by", "rating", "sessions", "interest", "comment", "name", "phone"]
    with open(out, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)

    print("messages in export : %d" % len(msgs))
    print("feedback found     : %d" % len(rows))
    print("written            : %s" % out)

    if args.summary and rows:
        nums = [int(r["rating"]) for r in rows if r["rating"].isdigit()]
        print()
        if nums:
            print("average rating     : %.2f / 5   (from %d ratings)" % (sum(nums) / len(nums), len(nums)))
            for s in range(5, 0, -1):
                n = nums.count(s)
                print("  %d star%s %-4s %s %d" % (s, " " if s == 1 else "s", "", "#" * n, n))
        def tally(key):
            c = {}
            for r in rows:
                for v in [x.strip() for x in r[key].split("|") if x.strip()]:
                    c[v] = c.get(v, 0) + 1
            return sorted(c.items(), key=lambda kv: -kv[1])
        for key, label in (("sessions", "Most useful sessions"), ("interest", "What they want next")):
            t = tally(key)
            if t:
                print("\n%s:" % label)
                for name, n in t:
                    print("  %-46s %d" % (name[:46], n))
        leads = [r for r in rows if r["phone"] or r["name"]]
        print("\nleads with a name or number: %d of %d" % (len(leads), len(rows)))


if __name__ == "__main__":
    main()
