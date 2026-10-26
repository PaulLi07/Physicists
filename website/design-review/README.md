# 物理学先驱：贡献年代与突破指数

本地网页源文件，复用正式档案和肖像；正式 `website/src/` 和 `website/dist/` 页面未替换。当前为 v3.0 成果年度账本。

## 预览

双击 `preview.command`，或在项目根目录运行：

```bash
python3 website/serve.py --design-review
```

启动及刷新首页按需重算成果、评分、日期与导航。新增人物先运行原有 `python3 scripts/build_website.py`，时间轴无需改源码。Ctrl+C 结束预览。

## 展示

- 所有人物按代表贡献年代排序；单语姓名，固定紧凑行高，悬停不改变正文滚动位置。
- 成果按实际形成、观测或可核实公开时间计入年度数据库；人物导航年与成果计分年分别维护。
- 主页面右侧只显示主要成果及其年代，成果文字依据固定重要性等级由深灰逐渐变红，不显示评分数字或权重。
- 直方图绘制年度贡献密度；asinh 横轴明确标注，小值更易分辨，年度数据不随绘图缩放改变。
- 人物密度沿用用户给定 ROOT 三节点 RGB 渐变，直方条无边线、无间隙。
- 时间轴指示点及红色指示线限制在绘图区，避开左侧年份文字。
- 连续拖拽、正文滚动双向同步；中英文搜索、领域筛选、语言切换、完整档案、引用与图像说明保留。

## 数据维护

完整规则见 [中文方法文档](../../docs/physics-breakthrough-index.zh.md) 和 [English method](../../docs/physics-breakthrough-index.en.md)。

`data/breakthrough/event-assessments.json` 保存既有成果的新评分和日期复核；`events-editorial-assessments.json` 保存具名贡献人工评估；`editorial-event-patches.json` 补充已存在成果，避免另建重复记录。原始日期保留在构建输出的 `sourceDate`，计分日期由 `dateModel` 指定。

旧人物残余分已退役。`navigation-estimates.json` 仅供目录定位与人物密度，不进入突破指数。

```bash
node scripts/build_breakthrough.cjs
node --test website/design-review/tests/*.test.cjs
```

构建自动检查参与人物、成果评分、日期、预算分配和完整导航。逐年值、覆盖和敏感性结果在 `data/breakthrough/`；网页生成数据在本目录 `data/`。浏览器核对记录和截图保存在 `qa-v5.json` 与 `screenshots/`；旧版本文件保留作历史记录。

2026-10-27核对：691条成果记录，686项进入年度计算，721人完整导航；原325条人物估计全部追踪到具名贡献或明确的学派关联。74项测试通过。最新页面：[成果文字与时间轴](screenshots/v5-newton-ledger.png)。
