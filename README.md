# Web_Pioneers · 物理学先驱档案

双语物理学人物档案、成果数据库与时间轴网页项目。当前网页收录721位人物与691条成果记录：人物按代表贡献年代展示，成果按实际形成／发现年代计入年度指数。源档案另保留按出生时间编号的中英文文字目录。

**[打开新版网页](index.html)** · **[启动本地预览](preview.command)** · [网页维护说明](website/README.md) · [突破指数计算与维护](docs/physics-breakthrough-index.zh.md)

## 使用与构建

直接打开根目录 `index.html`，会进入 `website/dist/` 中的完整新版网页。macOS也可双击根目录 `preview.command`，或运行：

```bash
python3 website/serve.py
```

项目只有一套当前界面源码：`website/src/`。修改界面、人物档案或成果资料后，在项目根目录构建并检查：

```bash
python3 scripts/build_website.py
node --test website/tests/*.test.cjs
```

构建需要Python与Node.js，会同时生成双语人物数据、成果年度数据、网页文件和本地肖像。`website/dist/` 可独立复制或作为静态网站部署；不要手工修改其生成文件。仅更新成果库时，可运行 `node scripts/build_breakthrough.cjs`。

旧界面和历史预览副本已从工作目录移除，旧版本可通过Git历史查看。根入口、默认预览和构建产物统一使用新版，不再需要选择预览分支或特殊启动参数。

## 网页与资料

网页支持时间轴连续拖拽及正文滚动同步、中英文姓名和领域搜索、语言切换、条目内肖像预览与完整档案。主要成果文字以红度表示重要性；直方图仅在显示层固定使用平滑度1，密度色棒采用边缘短刻度与整数标签。

- [中文版人物目录](zh/INDEX.md)：721人
- [English archive](en/INDEX.md): 721 people
- [人物资料复核报告](docs/AUDIT_REPORT.md) / [English audit](en/docs/AUDIT_REPORT.md)
- [新增人物记录](docs/ADDITIONS.md) · [待补资料](docs/OPEN_ITEMS.md)
- [中文指数说明](docs/physics-breakthrough-index.zh.md) · [English index method](docs/physics-breakthrough-index.en.md)

人物资料整理日期为2026-10-26，成果方法与记录复核日期为2026-10-27。人物库从531人扩充到721人，包含截至2026年的230位独立诺贝尔物理学奖得主；来源、英文复核与历史不确定性保存在逐人档案中，不声称名录已经穷尽物理史。

每个语言版本均有721份文字档案及本地配图引用：672项为肖像或含本人的照片，29项为后世或纪念形象，20项为明确标注的相关资料图。尚未确认公开再发布授权的62项图片保留逐图权利说明。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `website/src/` | 唯一的当前网页源码：HTML、样式、交互和绘图模块 |
| `website/dist/` | 完整生成网站，含全部脚本、数据、方法文档副本和肖像 |
| `website/tests/` | 搜索、数据、年度计算、绘图与入口回归；最新QA记录及截图 |
| `data/breakthrough/` | 具名成果源记录、重要性评估、日期依据和科学审计 |
| `zh/` / `en/` | 中英文文字档案、目录与对应语言数据 |
| `data/curated/` / `data/translations/` | 中文核实条目、英文源条目、事实修订和图片覆盖设置 |
| `data/audit/` | 原库复核、翻译检查、增补差异和来源记录 |
| `data/raw/` | 实际检索缓存、官方响应及图片元数据 |
| `docs/` | 科学方法、维护流程、资料与图像说明 |
| `scripts/` | 采集、档案构建、网站构建与核查脚本 |

根目录的 `INDEX.md`、`people/`、`portraits/` 与 `data/physicists.json` 是原中文档案构建输出，保留供档案维护脚本使用；它们不是另一套网页界面。

## 档案维护

更新人物资料时，同时维护中英文内容、稳定人物ID、来源、图像性质和英文复核记录。以下档案维护命令在项目根目录运行：

```bash
python3 scripts/make_nobel_en.py
python3 scripts/build.py
python3 scripts/build_bilingual.py
python3 scripts/build_audit_report.py
python3 scripts/validate.py
python3 scripts/validate_bilingual.py
python3 scripts/build_website.py
node --test website/tests/*.test.cjs
```

生成已有档案和网站无需联网；获取新图片或重新采集资料时，才使用 `scripts/harvest.py` 或 `scripts/repair_images.py` 等联网脚本。修改排序序号后，网页仍以稳定人物ID关联成果和档案。

GitHub仓库为 [PaulLi07/Physicists](https://github.com/PaulLi07/Physicists)；目录改名保留原Git历史与远程配置。[Git维护说明](docs/GIT_WORKFLOW.md)。中文与英文简介为资料整理撰写，第三方原文和图片继续适用原有版权，网页须保留署名、许可和来源。
