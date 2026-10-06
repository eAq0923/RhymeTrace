# 查简繁映射：python scripts/lookup.py 詩 雙 萬
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
DATA = Path(__file__).resolve().parent.parent / "Database" / "opencc"


def load(name):
    mapping = {}
    for line in (DATA / name).read_text(encoding="utf-8").splitlines():
        if line.startswith("#") or "\t" not in line:
            continue
        key, values = line.split("\t", 1)
        mapping[key] = values.split()[0]
    return mapping


t2s = load("TSCharacters.txt")
s2t = load("STCharacters.txt")

if len(sys.argv) < 2:
    print("用法：python scripts/lookup.py 字 [更多字...]")
else:
    for ch in sys.argv[1:]:
        print(f"{ch}  繁→简：{t2s.get(ch, '（表里没有，按原样处理）')}  简→繁：{s2t.get(ch, '（表里没有，按原样处理）')}")
