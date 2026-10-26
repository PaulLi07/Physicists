# 物理学先驱：贡献年代与突破指数

本地网页源文件，复用正式档案和肖像；正式 `website/src/` 和 `website/dist/` 页面未替换。当前为 v3.0 成果年度账本。

## 预览

双击 `preview.command`，或在项目根目录运行：

```bash
python3 website/serve.py --design-review
```

启动及刷新首页按需重算成果、评分、日期与导航。新增人物先运行原有 `python3 scripts/build_website.py`，时间轴无需改源码。Ctrl+C 结束预览。

## 展示

- 所有人物按代表贡献年代排序；单语姓名，默认48px行高（窄屏46px）。悬停在条目内部展开肖像、生卒日期和主要成果，可点击肖像或按钮打开完整档案。展开与收起保持总滚动高度，悬停不写入正文滚动位置。
- 成果按实际形成、观测或可核实公开时间计入年度数据库；人物导航年与成果计分年分别维护。
- 主页面右侧只显示主要成果及其年代，成果文字依据固定重要性等级由深灰逐渐变红，不显示评分数字或权重。
- 直方图仅在最终绘图层使用像素空间高斯平滑，源码常量 `PLOT_SMOOTHING_SIGMA=1`，网页不显示控制。分段时间轴的断点不混合，年度指数与右侧逐年成果不变。asinh横轴保留。
- 人物密度沿用用户给定ROOT三节点RGB渐变，直方条无边线、无间隙；SVG矩形色棒配0.5px细外框，刻度由下边缘向外延伸4px，数字居中列于色棒外，选用0、2、4、6、8等整数刻度并按真实密度定位；刻度不贯穿色棒。
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

构建自动检查参与人物、成果评分、日期、预算分配和完整导航。逐年值、覆盖和敏感性结果在 `data/breakthrough/`；网页生成数据在本目录 `data/`。浏览器核对记录和截图保存在 `qa-v8.json` 与 `screenshots/`；旧版本文件保留作历史记录。

2026-10-27核对：691条成果记录，686项进入年度计算，721人完整导航；原325条人物估计全部追踪到具名贡献或明确的学派关联。74项测试通过。最新页面：[成果文字与时间轴](screenshots/v5-newton-ledger.png)。

本轮仅展示更新：83项测试通过；真实鼠标连续切换人物、列表最末尾展开/收起、边缘向上展开、拖轴与滚动同步、中英文与390px窄屏已检查。成果库、年度数据与计算程序均未修改。当前固定平滑度为1，移除网页控件，色棒采用边缘短刻度。最新页面：[固定平滑与科研色棒](screenshots/v8-integer-colorbar.png)。
