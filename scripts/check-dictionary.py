"""Validate extraction against the immutable source, including every content line."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "Database/processed/dictionary.json").read_text(encoding="utf-8"))
wrapper = (ROOT / "assets/js/dictionary-data.js").read_text(encoding="utf-8")
frontend = wrapper.split("app.dictionaryData = ", 1)[1].split("; })(window.RhymeTrace", 1)[0]
assert json.loads(frontend) == data, "Offline JS and structured JSON disagree; rebuild first"
source = (ROOT / data["source"]["path"]).read_bytes()
lines = source.decode("utf-8").splitlines()
assert hashlib.sha256(source).hexdigest() == data["source"]["sha256"], "Source changed; rebuild first"
entries = data["entries"]
assert len(entries) == lines.count("韵藻"), "Lost or added headwords"
assert len({e["id"] for e in entries}) == len(entries)
seen, record_ids = set(), set()
for entry in entries:
    start, end = entry["startLine"] - 1, entry["endLine"]
    assert entry["sourceText"] == "\n".join(lines[start:end])
    assert entry["headword"] == lines[start]
    assert entry["gloss"] == lines[start + 1]
    assert entry["reviewStatus"] == "unreviewed"
    seen.update((start, start + 1))
    for record in entry["records"]:
        assert record["id"] not in record_ids
        record_ids.add(record["id"])
        a, b = record["startLine"] - 1, record["endLine"]
        assert start < a < b <= end
        assert record["text"] == "\n".join(lines[a:b]), f"Changed text at line {a + 1}"
        seen.update(range(a, b))

for i, line in enumerate(lines):
    if not line.strip() or line in {"韵藻", "增", "对语", "摘句"}:
        continue
    if re.fullmatch(r"御定佩文韻府[巻卷].+|上平聲\s+(三江|四支)韻.*", line):
        continue
    assert i in seen, f"Unaccounted content at line {i + 1}"
assert len(data["volumes"]) == 11, "Unexpected source sections"
print(f"PASS: {len(entries)} headwords, {len(record_ids)} records; all content covered and exact text/line references verified.")
