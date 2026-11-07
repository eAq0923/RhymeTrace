# 三江、四支结构化资料

源文件：`../3江韵4支韵_级联测试.md`。原文保持不变，生成物全部待人工核验。

在项目根目录执行 `python scripts/build-dictionary.py` 重建：

- `dictionary.json`：韵部/卷段、489 个字条及其下 17,724 条记录。
- `dictionary-audit.json`：源文件 SHA-256、数量、重复字头和待核对问题。
- `../../assets/js/dictionary-data.js`：与 JSON 同内容的 JavaScript 包装，供双击 HTML 离线使用。

不要直接编辑生成物，后续校对需建立有来源的修改记录，或更新明确版本的底稿后重建。

主要字段：

| 层次 | 字段及约定 |
| --- | --- |
| 源文件 | `path`、`sha256`、`lineCount`；`edition`、`provider`、`license` 未知时为 null，不猜测 |
| 字条 | `id`、`rhyme`、`volume`、`headword`、`gloss`、`fanqie`、`startLine`、`endLine`、`sourceText`、`reviewStatus`、`records` |
| 子记录 | `id`、`section`（韵藻/增/对语/摘句）、`term`、`text`、`startLine`、`endLine` |

- 行号从 1 起，起止均含；是提供文件中的行号，不是原书页码。`sourceText` 保留该字条原文和空行，换行统一为 LF。
- ID 根据源文件行号生成，用于当前版本定位；更新底稿后可能变化，跨版本引用应携带源文件指纹。
- 同字重出独立存储，不能只拿 `headword` 当主键。
- `fanqie` 仅截取释义开头第一个“切”之前的原文，不生成现代读音；小韵未提供结构化判定。
- `term` 只取韵藻/增补记录全角冒号前的词头；两条缺词头记录保留为 null 并报告。对语/摘句为 null。
- 一条引文可能含多个出处或作者及续行；不把每一行当作一首诗，也不推断 `isRhyme`。
- 所有原字、`丨` 代字、`?` / `□` 和缩进原样保留，不自动还原或改正。词头和引文可用于查阅，不代表全文逐字校对完成。
- OpenCC 与“窓/窗”别名只用于搜索，页面显示和数据库保存的仍是原字形。

验证命令：`python scripts/check-dictionary.py`。
