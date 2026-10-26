# 物理学先驱档案 / Physics Pioneers Archive

供后续人物档案网站、时间轴与学科导航使用的双语资料源项目。每人一份档案，包含生平、生卒日期及精度、主要物理贡献、配图、来源和史料说明，按出生时间组织。

**[打开物理学先驱网页](index.html)** · [网页源文件与使用说明](website/README.md)

GitHub：[PaulLi07/Physicists](https://github.com/PaulLi07/Physicists) · [Git日常维护说明](docs/GIT_WORKFLOW.md)

网页支持时间轴、姓名与领域搜索、完整人物档案和中英文切换，可离线使用。

- **[浏览中文版](zh/INDEX.md)**：721人
- **[Browse the English edition](en/INDEX.md)**: 721 people
- [本轮全库复核报告](docs/AUDIT_REPORT.md) / [English audit report](en/docs/AUDIT_REPORT.md)
- [本轮新增190人](docs/ADDITIONS.md) · [待补与资料限制](docs/OPEN_ITEMS.md)

资料整理日期：2026-10-26。从原有531人扩充到721人，包含截至2026年的230位独立诺贝尔物理学奖得主。原库经过逐人来源复核；全部英文档案完成另一位审阅者的独立语义复核，再检查生成结果。详见逐条复核记录与原库差异，不声称名录已穷尽物理史。

每版有721份文字档案及本地配图引用；672项为肖像或含本人的照片，29项为后世或纪念形象，20项为明确标注的相关资料图。公开网站再发布授权尚未确认的图片有62项，逐图记录权利状态。

## 项目文件

| 路径 | 内容 |
| --- | --- |
| `zh/` | 可独立复制的中文版：目录、人物、图片、数据与说明 |
| `en/` | 可独立复制的英文版，和中文版共享稳定人物ID、日期事实与图片 |
| `zh/data/physicists.json` / `en/data/physicists.json` | 两个语言版本的完整网页数据接口 |
| `zh/data/timeline.json` / `en/data/timeline.json` | 对应语言时间轴 |
| `data/curated/` | 中文核实条目、诺奖贡献概述、事实修订与图片覆盖设置 |
| `data/translations/` | 已复核的英文源条目与诺奖贡献概述 |
| `data/audit/` | 原库快照、逐人核对、独立英文复核、增补与差异、自动检查报告 |
| `data/raw/` | 实际检索页面、官方响应、图片元数据与核对缓存 |
| `data/enrichment.json` | 人物身份及图片对应元数据 |
| `docs/REFERENCE_SITES.md` | 本轮查找并对照的同类网站和资料库 |
| `docs/DATA_MODEL.md` / `docs/METHODOLOGY.md` | 数据结构、收录和史料处理规范 |
| `scripts/` | 采集、构建和核查脚本 |

根目录的 `INDEX.md`、`people/`、`portraits/` 与 `data/physicists.json` 保留中文版输出，兼容原项目；浏览入口优先使用 `zh/` 和 `en/`。

## 重新构建与维护

以下命令均在项目根目录运行。生成文字及数据不需要网络：

```bash
python3 scripts/make_nobel_en.py
python3 scripts/build.py
python3 scripts/build_bilingual.py
python3 scripts/build_audit_report.py
python3 scripts/validate.py
python3 scripts/validate_bilingual.py
python3 scripts/build_audit_report.py
```

最后一步将本次检查结果写入复核摘要。安装Pillow后，`validate.py` 还会实际解码图片；本次交付已在具备Pillow的环境完成检查。增加或修改人物时，同时维护中文核实条目、英文条目、来源、图片性质及独立复核记录。英文覆盖检查要求每个人物恰有一份独立语义复核记录。

获取新增图片或更新手工匹配时，可运行 `python3 scripts/harvest.py` 或 `python3 scripts/repair_images.py`，再执行上述离线构建。采集脚本会访问外部网站并保存缓存；遇到限流可续跑。排序序号会随增补改变，网页永久路由应使用人物 `id`。

中文与英文简介为资料整理撰写，第三方网页和图片继续适用原有版权。公开网页应保留逐图署名、许可、来源、历史不确定性与相关资料图提示。
