# 从 OpenCC 字符表生成 assets/js/charmaps.js（t2s 输入归一 + s2t 繁体展示）。
# 数据：Database/opencc/TSCharacters.txt、STCharacters.txt
# 重跑：python scripts/gen-charmaps.py
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "Database" / "opencc"
OUT = ROOT / "assets" / "js" / "charmaps.js"


def load(name, value_index=0):
    mapping = {}
    for line in (DATA / name).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        values = parts[1].split()
        if values:
            mapping[parts[0]] = values[value_index]
    return mapping


t2s = load("TSCharacters.txt")
s2t = load("STCharacters.txt")


def json_escape(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def js_map(mapping, per_line=6):
    items = [f'{k}:{json_escape(v)}' for k, v in mapping.items()]
    lines = []
    for i in range(0, len(items), per_line):
        lines.append("    " + ",".join(items[i:i + per_line]) + ",")
    return "\n".join(lines).rstrip(",")


header = (
    "// 简繁单字映射：由 OpenCC 字符表生成，勿手改。\n"
    "// 来源：OpenCC data/dictionary/TSCharacters.txt、STCharacters.txt\n"
    "// 许可证：Apache-2.0（原文见 Database/opencc/LICENSE）\n"
    "// 重新生成：python scripts/gen-charmaps.py（数据在 Database/opencc/）\n"
    "// t2s：繁→简（查询输入归一用）；s2t：简→繁（字条目「繁體」标注用）。\n"
    "(function registerCharMaps(app) {\n"
    "  app.charmaps = Object.freeze({\n"
    f"    t2s: Object.freeze({{\n{js_map(t2s)}\n    }}),\n"
    f"    s2t: Object.freeze({{\n{js_map(s2t)}\n    }})\n"
    "  });\n"
    "})(window.RhymeTrace = window.RhymeTrace || {});\n"
)

OUT.write_text(header, encoding="utf-8")
print(f"t2s={len(t2s)} s2t={len(s2t)} -> {OUT} ({OUT.stat().st_size // 1024} KB)")
