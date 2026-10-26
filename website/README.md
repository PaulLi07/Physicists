# 物理学先驱网页

`src/` 是唯一的当前界面源码，`dist/` 是可独立复制或部署的完整静态网站。根目录 `index.html`、默认预览脚本和构建产物均指向当前新版。

人物按代表贡献年代排列。悬停人物条目时在条目内部展开肖像、生卒日期和主要贡献，可点击肖像或按钮进入完整档案；展开与收起保持滚动位置稳定。时间轴支持连续拖动，并与正文滚动双向同步。搜索匹配中英文姓名和研究领域，支持中英文切换、键盘访问及窄屏布局。

右侧按当前年份展示主要成果，不显示分值或权重。成果文字颜色反映总重要性等级。指数只在最终图形层使用固定平滑度1，参数位于 `src/app.js` 的 `PLOT_SMOOTHING_SIGMA`，网页没有平滑控件。密度采用用户给定ROOT渐变，色棒刻度在下边缘向外延伸4px，使用实际密度对应的整数标签。

## 打开网页

直接打开项目根目录 `index.html` 或 `website/dist/index.html`。页面使用普通脚本和本地数据，无在线字体、第三方图片服务或运行时 `fetch()` 依赖。`src/index.html` 是构建输入，请通过根入口或生成的 `dist/index.html` 浏览。

macOS可双击项目根目录或本目录的 `preview.command`，也可在项目根目录运行：

```bash
python3 website/serve.py
```

默认启动新版，终端显示本地地址；按 `Ctrl+C` 停止。要使用普通静态服务器，可在项目根目录运行：

```bash
python3 -m http.server 8765 --directory website/dist --bind 127.0.0.1
```

随后访问 `http://127.0.0.1:8765/`。更换端口时使用对应地址。

## 构建与文件

完整构建只需在项目根目录执行：

```bash
python3 scripts/build_website.py
```

构建器核对双语档案、来源和图像，生成最新人物数据，再计算成果年度数据，成功后整体替换 `dist/`。构建需要Python与Node.js。人物档案或界面变化均执行完整构建；仅修改成果库时，可运行 `node scripts/build_breakthrough.cjs`。

| 路径 | 内容 |
| --- | --- |
| `src/index.html`、`src/app.js`、`src/styles.css` | 当前界面结构、交互和样式 |
| `src/core.js` 及其他模块 | 搜索、年度账本、时间映射、调色和平滑显示 |
| `dist/data/archive.js` | 完整双语人物数据 |
| `dist/data/breakthrough-data.js` | 成果记录、人物导航与年度图形数据 |
| `dist/data/events.json` / `yearly-index.json` | 可读取的成果及逐年输出 |
| `dist/data/method.zh.md` / `method.en.md` | 方法文档生成副本 |
| `dist/portraits/` | 网页使用的本地肖像和资料图 |
| `dist/build-report.json` | 构建内容、版本、人数与输入校验信息 |
| `tests/qa-current.json` / `tests/screenshots/current.png` | 最新页面验证记录及截图 |

只维护源码与档案源数据，不手工修改 `dist/`。完整部署应复制整个 `dist/`，以保留脚本、数据、肖像与方法文档的相对路径。旧界面、旧预览目录和历史QA副本已移出工作目录，历史版本仍可通过Git读取。

## 验证与来源

在项目根目录执行：

```bash
node --test website/tests/*.test.cjs
```

测试覆盖双语搜索、档案内容、成果计分日期、总分守恒、密度去重、显示平滑、整数色棒刻度、时间轴映射以及入口和静态包完整性。浏览器用于实际检查悬停、肖像、滚动同步、档案、语言和窄屏；内置浏览器只允许HTTP(S)，因此其验证使用本地服务器。

完整科学规则见 [中文方法说明](../docs/physics-breakthrough-index.zh.md) 与 [English method](../docs/physics-breakthrough-index.en.md)。约年、来源冲突、后世画像、资料图提示、图片署名及许可继续保留在完整档案中。
