#!/usr/bin/env python3
"""
Construction Brand - pre-filled Invite Sender link
==================================================

Turns a list of invitees into ONE link. Whoever opens it on a phone (or a PC
with WhatsApp Desktop) finds the Invite Sender already filled and loaded, and
just taps Send next, Send next, Send next.

    python tools/make_invite_link.py --list tools/invitees.txt
    python tools/make_invite_link.py --list tools/invitees.txt --msg tools/wa-message.txt

The list goes into the URL FRAGMENT (after #). Browsers never send that part
to the server, so the public site never receives a number. The link is
written to tools/invite-link.txt (git-ignored) and printed.
"""

import argparse
import base64
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from send_sms import parse_list  # noqa: E402  same parser, same normalisation

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://construction-brand.github.io/tools/whatsapp-sender.html"


def b64url(text):
    return base64.urlsafe_b64encode(text.encode("utf-8")).decode("ascii").rstrip("=")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", required=True, help="one person per line: name, number")
    ap.add_argument("--msg", help="optional file with the message template ({name} = first name)")
    ap.add_argument("--base", default=BASE, help="URL of the Invite Sender page")
    ap.add_argument("--out", default=os.path.join(ROOT, "tools", "invite-link.txt"))
    args = ap.parse_args()

    people, bad = parse_list(args.list)
    if bad:
        print("Could not read a valid Iraqi mobile number on:")
        for b in bad:
            print("  " + b)
        print()
    if not people:
        sys.exit("No valid numbers - nothing to link.")

    # clean, normalised list: "Name, +964..." per line, duplicates already gone
    clean = "\n".join(("%s, %s" % (p["name"], p["num"])) if p["name"] else p["num"] for p in people)
    url = args.base + "#list=" + b64url(clean)
    if args.msg:
        with open(args.msg, encoding="utf-8-sig") as fh:
            url += "&msg=" + b64url(fh.read().strip())

    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(url + "\n")

    print("%d people, %d unreadable line(s), link is %d characters" % (len(people), len(bad), len(url)))
    try:
        shown = os.path.relpath(args.out, ROOT)
    except ValueError:                       # output on another drive (Windows)
        shown = args.out
    print("written to: %s" % shown)
    print()
    print(url)


if __name__ == "__main__":
    main()
