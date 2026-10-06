# OpenCC 简繁字符表

- 来源：<https://github.com/BYVoid/OpenCC>，`data/dictionary/` 下的 `TSCharacters.txt`（繁→简）与 `STCharacters.txt`（简→繁），2026-10-03 经 jsdelivr CDN 下载。
- 许可证：Apache-2.0，原文见本目录 `LICENSE`。
- 用途：生成 `assets/js/charmaps.js`（查询输入的繁体归一 + 字条目「繁體」标注），生成脚本 `scripts/gen-charmaps.py`，速查脚本 `scripts/lookup.py`。
- 层次说明：本表属于"输入归一层"，与数据库规模无关；P0 字头表自带的"原字/规范检索字"字段属于"研究判定层"（异体字、小韵归属按《佩文韵府》校对手册执行），两层不互相替代。
- 更新方式：下载新版两个 txt 覆盖本目录同名文件，重跑 `python scripts/gen-charmaps.py`。
