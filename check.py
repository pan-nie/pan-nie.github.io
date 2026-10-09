#!/usr/bin/env python3
"""Structural checks for the CV page: links, i18n pairing, JSON-LD, assets."""
import json
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = os.path.join(ROOT, "index.html")

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}


class Doc(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.ids = set()
        self.anchors = []
        self.assets = []
        self.jsonld = []
        self.lang_children = {}   # id(node) -> set of langs among direct children
        self.node_index = 0
        self._in_jsonld = False
        self._buf = []
        self.tags = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.node_index += 1
        nid = self.node_index
        self.tags.append(tag)
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "a" and a.get("href", "").startswith("#"):
            self.anchors.append(a["href"][1:])
        for key in ("href", "src"):
            v = a.get(key, "")
            if v and not re.match(r"^(https?:|mailto:|#|data:)", v):
                self.assets.append(v)
        if tag == "script" and a.get("type") == "application/ld+json":
            self._in_jsonld = True
            self._buf = []
        for par in self.stack:
            if "data-lang" in a:
                self.lang_children.setdefault(par, set()).add(a["data-lang"])
        if tag not in VOID:
            self.stack.append(nid)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.tags[self.stack[i] - 1] == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        if self._in_jsonld:
            self._buf.append(data)


def main():
    with open(HTML_PATH, encoding="utf-8") as f:
        src = f.read()

    d = Doc()
    d.feed(src)

    fails, warns = [], []

    # --- unclosed tags -------------------------------------------------
    if d.stack:
        fails.append(f"unclosed tags: {[d.tags[i-1] for i in d.stack]}")

    # --- anchor targets -------------------------------------------------
    for target in set(d.anchors):
        if target and target not in d.ids:
            fails.append(f"anchor href='#{target}' has no matching id")

    # --- local assets ---------------------------------------------------
    for rel in set(d.assets):
        p = os.path.normpath(os.path.join(ROOT, rel.lstrip("./")))
        if not os.path.exists(p):
            fails.append(f"missing asset: {rel}")

    # --- JSON-LD --------------------------------------------------------
    blocks = re.findall(
        r'<script type="application/ld\+json">(.*?)</script>', src, re.S)
    if not blocks:
        fails.append("no JSON-LD block found")
    for b in blocks:
        try:
            data = json.loads(b)
            if data.get("@type") != "Person":
                warns.append("JSON-LD is not a Person schema")
        except Exception as e:
            fails.append(f"JSON-LD does not parse: {e}")

    # --- i18n pairing ---------------------------------------------------
    # Language-agnostic: whatever set of data-lang values the page uses, every
    # container that holds translatable copy should hold all of them.
    found = sorted(set(re.findall(r'data-lang="([^"]+)"', src)))
    n_lang = {l: src.count(f'data-lang="{l}"') for l in found}
    unbalanced = []
    for langs in d.lang_children.values():
        if set(langs) != set(found):
            unbalanced.append(set(found) - set(langs))

    # --- report ---------------------------------------------------------
    print(f"html size          : {len(src):,} bytes")
    print(f"ids                : {len(d.ids)}")
    print(f"anchor targets     : {len(set(d.anchors))} (all resolve)"
          if not any("anchor" in f for f in fails) else "anchor targets: BROKEN")
    print(f"local assets       : {len(set(d.assets))} (all present)"
          if not any("missing asset" in f for f in fails) else "local assets: MISSING")
    print("data-lang          : " + " / ".join(f"{l} {n_lang[l]}" for l in found))
    print(f"unpaired containers: {len(unbalanced)}")
    print()

    if unbalanced:
        print("Containers missing one or more languages (may be intentional):")
        gaps = {}
        for missing in unbalanced:
            key = "missing " + " + ".join(sorted(missing))
            gaps[key] = gaps.get(key, 0) + 1
        for key, count in sorted(gaps.items()):
            print(f"  - {key} in {count} container(s)")
        print()

    if fails:
        print("FAILED:")
        for f in fails:
            print(f"  ✗ {f}")
        return 1

    print("✓ all structural checks passed")
    for w in warns:
        print(f"  ! {w}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
