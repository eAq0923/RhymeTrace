"""Extract source-preserving dictionary records; does not judge rhymes or correct text.

Run from any directory: python scripts/build-dictionary.py
JSON is the editable-tool interchange format; the JS wrapper supports file:// pages.
"""
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "Database/3江韵4支韵_级联测试.md"
OUT = ROOT / "Database/processed"
SECTIONS = {"韵藻", "增", "对语", "摘句"}
BOOK = re.compile(r"^御定佩文韻府[巻卷](.+)$")
RHYME = re.compile(r"^上平聲\s+(三江|四支)韻(.*)$")


def build():
    raw = SOURCE.read_bytes()
    lines = raw.decode("utf-8").splitlines()
    markers = [i for i, line in enumerate(lines) if line == "韵藻"]
    entries, issues, volumes = [], [], []
    group, volume = None, None
    context = {}
    for i, line in enumerate(lines):
        book = BOOK.fullmatch(line)
        if book:
            volume = book[1]
        rhyme = RHYME.fullmatch(line)
        if rhyme:
            group = rhyme[1]
            volumes.append({"rhyme": group, "volume": volume, "heading": line, "line": i + 1})
            if group == "四支" and not rhyme[2]:
                issues.append({"line": i + 1, "kind": "heading", "text": "韵部标题未写分册序号，卷名为" + volume})
        context[i] = (group, volume)

    accounted = set()
    for index, marker in enumerate(markers):
        start = marker - 2
        stop = markers[index + 1] - 2 if index + 1 < len(markers) else len(lines)
        headword, gloss = lines[start:marker]
        if len(headword) != 1 or "切" not in gloss:
            raise ValueError(f"Unrecognized headword/reading at line {start + 1}")
        group, volume = context[start]
        if group not in ("三江", "四支"):
            raise ValueError(f"Missing rhyme context at line {start + 1}")
        entry = {
            "id": f"pwyf-{start + 1}", "rhyme": group, "volume": volume,
            "headword": headword, "gloss": gloss,
            "fanqie": gloss.split("切", 1)[0] + "切",
            "startLine": start + 1, "endLine": marker + 1,
            "reviewStatus": "unreviewed", "records": [],
        }
        accounted.update((start, start + 1))
        section, record = None, None
        for i in range(marker, stop):
            line = lines[i]
            if not line.strip() or BOOK.fullmatch(line) or RHYME.fullmatch(line):
                continue
            entry["endLine"] = i + 1
            if line in SECTIONS:
                section, record = line, None
                accounted.add(i)
                continue
            if section is None:
                raise ValueError(f"Missing section at line {i + 1}")
            if line[:1].isspace():
                if record is None:
                    raise ValueError(f"Orphan continuation at line {i + 1}")
                record["text"] += "\n" + line
                record["endLine"] = i + 1
            else:
                term = line.split("：", 1)[0] if section in ("韵藻", "增") and "：" in line else None
                if section in ("韵藻", "增") and term is None:
                    issues.append({"line": i + 1, "kind": "missing-term", "text": line})
                record = {"id": f"pwyf-record-{i + 1}", "section": section,
                          "term": term, "text": line, "startLine": i + 1, "endLine": i + 1}
                entry["records"].append(record)
            accounted.add(i)
        entry["sourceText"] = "\n".join(lines[start:entry["endLine"]])
        entries.append(entry)

    for i, line in enumerate(lines):
        if line.strip() and not BOOK.fullmatch(line) and not RHYME.fullmatch(line) and i not in accounted:
            raise ValueError(f"Unconsumed content at line {i + 1}: {line}")
        if "?" in line or "□" in line:
            issues.append({"line": i + 1, "kind": "uncertain-character", "text": line})

    payload = {
        "schemaVersion": 1,
        "source": {"path": SOURCE.relative_to(ROOT).as_posix(), "sha256": hashlib.sha256(raw).hexdigest(),
                   "lineCount": len(lines), "reviewStatus": "unreviewed",
                   "edition": None, "provider": None, "license": None},
        "volumes": volumes, "entries": entries,
    }
    summary = {
        "source": payload["source"], "entryCount": len(entries),
        "recordCount": sum(len(e["records"]) for e in entries),
        "groups": {g: {"entries": sum(e["rhyme"] == g for e in entries),
                         "distinctHeadwords": len({e["headword"] for e in entries if e["rhyme"] == g})}
                   for g in ("三江", "四支")},
        "repeatedHeadwords": {h: n for h, n in Counter(e["headword"] for e in entries).items() if n > 1},
        "sections": dict(Counter(r["section"] for e in entries for r in e["records"])),
        "issues": issues,
        "notes": ["仅按源文件结构抽取，全部待核验；字条数不等于已确认的可用韵字数。",
                  "反切仅记录释义首个切字之前的原文；不推导现代读音或小韵。",
                  "丨占位符、缺字、异体、重出字和原文缩进均保留；不自动补字、还原引文或判定韵脚。",
                  "引文保留整条及其续行，不推断作者、朝代、诗题或诗歌统计。"],
    }
    OUT.mkdir(exist_ok=True)
    (OUT / "dictionary.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "dictionary-audit.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    compact = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    (ROOT / "assets/js/dictionary-data.js").write_text(
        "// Generated by scripts/build-dictionary.py; do not edit.\n"
        "(function (app) { app.dictionaryData = " + compact + "; })(window.RhymeTrace = window.RhymeTrace || {});\n",
        encoding="utf-8")
    print(json.dumps({k: summary[k] for k in ("entryCount", "recordCount", "groups", "sections")}, ensure_ascii=False))


if __name__ == "__main__":
    build()
