#!/usr/bin/env python3
"""
Construction Brand - one-click bulk SMS (Twilio)
================================================

Sends one personalised SMS to every number in a list. Same list format as the
WhatsApp Invite Sender: one person per line, "name, number" or a bare number,
Iraqi formats normalised to +964, duplicates dropped.

    python tools/send_sms.py --list invitees.txt --dry-run     # shows every message, segments, cost estimate
    python tools/send_sms.py --list invitees.txt --test 07722149070   # sends ONE message, to you
    python tools/send_sms.py --list invitees.txt                # sends to everyone
    python tools/send_sms.py --status                           # re-checks delivery of everything sent

Set these in the environment before sending (never put them in a file that is
committed - this repository is public):

    TWILIO_ACCOUNT_SID   from console.twilio.com
    TWILIO_AUTH_TOKEN
    TWILIO_FROM          your Twilio number in E.164 (+1...), or an approved alphanumeric sender

Twilio checklist for Iraq: Messaging -> Settings -> Geo permissions -> tick Iraq.
A trial account can only text numbers you have verified; add credit first.

The message lives in tools/sms-message.txt ({name} becomes the first name).
Kurdish/Arabic text is sent as UCS-2, which is 70 characters per segment
(67 when it splits), and you pay per segment - keep it short.

Every send is appended to tools/sms-log.csv (git-ignored) with the Twilio SID
so --status can report delivered / failed / undelivered per person.
"""

import argparse
import csv
import os
import re
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG = os.path.join(ROOT, "tools", "sms-log.csv")
MSG_FILE = os.path.join(ROOT, "tools", "sms-message.txt")

# Kept under 134 characters so it bills as 2 UCS-2 segments, not 3. The link
# already carries the brand name; repeating it cost a whole segment.
DEFAULT_MSG = (
    "سڵاو {name}، بەخێربێیت بۆ ئێوارەی خاوەن پرۆژەکان. "
    "گراند میلینیۆم، دووشەممە ٤:٣٠. بەرنامە: https://construction-brand.github.io/"
)

GSM7 = set("@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?"
           "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà^{}\\[~]|€")


# --------------------------------------------------------------------------- #
# list handling (mirrors whatsapp-sender.html)
# --------------------------------------------------------------------------- #

def normalize(raw):
    d = re.sub(r"[^\d+]", "", str(raw))
    if d.startswith("+"):
        d = d[1:]
    if d.startswith("00"):
        d = d[2:]
    if d.startswith("964"):
        pass
    elif d.startswith("0"):
        d = "964" + d[1:]
    elif re.fullmatch(r"7\d{9}", d):
        d = "964" + d
    return d if re.fullmatch(r"9647\d{9}", d) else None


def parse_list(path):
    people, bad, seen = [], [], set()
    with open(path, encoding="utf-8-sig") as fh:
        for i, line in enumerate(fh, 1):
            s = line.strip()
            if not s:
                continue
            m = re.search(r"(\+?\d[\d\s\-().]{7,}\d)", s)
            num = normalize(m.group(1)) if m else None
            if not num:
                bad.append("line %d: %s" % (i, s))
                continue
            if num in seen:
                continue
            seen.add(num)
            name = re.sub(r"^[\s,;\t|:-]+|[\s,;\t|:-]+$", "", s.replace(m.group(1), ""))
            name = re.sub(r"\s{2,}", " ", name).strip()
            people.append({"name": name, "num": "+" + num})
    return people, bad


def first_name(p):
    return (p["name"] or "").split()[0] if p["name"] else ""


def render(template, p):
    out = template.replace("{name}", first_name(p))
    if not first_name(p):
        out = re.sub(r"[ \t]{2,}", " ", out)
        out = re.sub(r" +(?=[,،\n])", "", out)
    return out.strip()


def segments(text):
    """How many SMS segments Twilio will bill for."""
    if all(c in GSM7 for c in text):
        n = len(text) + sum(1 for c in text if c in "^{}\\[~]|€")   # extended chars count twice
        return 1 if n <= 160 else -(-n // 153), "GSM-7"
    n = len(text)
    return (1 if n <= 70 else -(-n // 67)), "UCS-2"


# --------------------------------------------------------------------------- #

def load_template():
    if os.path.exists(MSG_FILE):
        with open(MSG_FILE, encoding="utf-8") as fh:
            return fh.read().strip()
    with open(MSG_FILE, "w", encoding="utf-8") as fh:
        fh.write(DEFAULT_MSG + "\n")
    return DEFAULT_MSG


def client_or_die():
    sid, tok = os.environ.get("TWILIO_ACCOUNT_SID"), os.environ.get("TWILIO_AUTH_TOKEN")
    if not sid or not tok or not os.environ.get("TWILIO_FROM"):
        sys.exit("Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM in the environment first.")
    try:
        from twilio.rest import Client
    except ImportError:
        sys.exit("Run:  python -m pip install twilio")
    return Client(sid, tok)


def log_row(row):
    new = not os.path.exists(LOG)
    with open(LOG, "a", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        if new:
            w.writerow(["sent_at", "name", "number", "sid", "status", "segments", "error"])
        w.writerow(row)


def send_all(people, template, args):
    client = None if args.dry_run else client_or_die()
    sender = os.environ.get("TWILIO_FROM", "(dry run)")
    total_segments = 0
    already = set()
    if os.path.exists(LOG) and not args.resend:
        with open(LOG, encoding="utf-8") as fh:
            already = {r["number"] for r in csv.DictReader(fh) if r.get("sid")}

    print("%-4s %-22s %-16s %-4s %s" % ("#", "name", "number", "seg", "message"))
    print("-" * 100)
    for i, p in enumerate(people, 1):
        text = render(template, p)
        n, enc = segments(text)
        total_segments += n
        flag = " (already sent, skipping)" if p["num"] in already else ""
        print("%-4d %-22s %-16s %-4d %s%s" % (i, (p["name"] or "-")[:22], p["num"], n,
                                             text.replace("\n", " / ")[:60], flag))
        if args.dry_run or flag:
            continue
        try:
            m = client.messages.create(to=p["num"], from_=sender, body=text)
            log_row([time.strftime("%Y-%m-%d %H:%M:%S"), p["name"], p["num"], m.sid, m.status, n, ""])
        except Exception as e:                       # noqa: BLE001 - report and carry on
            log_row([time.strftime("%Y-%m-%d %H:%M:%S"), p["name"], p["num"], "", "error", n, str(e)])
            print("     !! failed: %s" % e)
        time.sleep(args.pace)

    print("-" * 100)
    print("%d people, %d segments total (%s)." % (len(people), total_segments, enc))
    if args.dry_run:
        print("Dry run - nothing sent. Twilio bills per segment; check your per-segment price for Iraq.")
    else:
        print("Log: %s   Re-check delivery later with:  python tools/send_sms.py --status" % os.path.relpath(LOG, ROOT))


def check_status():
    if not os.path.exists(LOG):
        sys.exit("No log yet - nothing has been sent.")
    client = client_or_die()
    rows = list(csv.DictReader(open(LOG, encoding="utf-8")))
    counts = {}
    print("%-22s %-16s %s" % ("name", "number", "status"))
    print("-" * 60)
    for r in rows:
        if not r["sid"]:
            st = "error: " + (r["error"] or "")[:40]
        else:
            try:
                m = client.messages(r["sid"]).fetch()
                st = m.status + ((" (%s)" % m.error_message) if m.error_message else "")
            except Exception as e:                   # noqa: BLE001
                st = "lookup failed: %s" % e
        counts[st.split(" ")[0]] = counts.get(st.split(" ")[0], 0) + 1
        print("%-22s %-16s %s" % ((r["name"] or "-")[:22], r["number"], st))
    print("-" * 60)
    print("  ".join("%s: %d" % kv for kv in sorted(counts.items())))


def main():
    ap = argparse.ArgumentParser(description="Bulk SMS to the invitee list via Twilio.")
    ap.add_argument("--list", help="file with one person per line (name, number)")
    ap.add_argument("--dry-run", action="store_true", help="show messages and segment counts, send nothing")
    ap.add_argument("--test", metavar="NUMBER", help="send only to this number (your own), with the first name in the list")
    ap.add_argument("--status", action="store_true", help="re-check delivery status of everything in the log")
    ap.add_argument("--resend", action="store_true", help="send again even to numbers already in the log")
    ap.add_argument("--pace", type=float, default=1.0, help="seconds between sends (default 1)")
    args = ap.parse_args()

    if args.status:
        check_status()
        return
    if not args.list:
        ap.error("--list is required (or use --status)")

    people, bad = parse_list(args.list)
    if bad:
        print("Could not read a valid Iraqi mobile number on:")
        for b in bad:
            print("  " + b)
        print()
    if not people:
        sys.exit("No valid numbers found.")

    template = load_template()
    if args.test:
        num = normalize(args.test)
        if not num:
            sys.exit("--test needs an Iraqi mobile number")
        people = [{"name": people[0]["name"] or "Test", "num": "+" + num}]
        args.resend = True
        print("TEST MODE - one message, to +%s\n" % num)

    send_all(people, template, args)


if __name__ == "__main__":
    main()
