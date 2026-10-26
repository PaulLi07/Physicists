# Git版本管理

本地项目：`Web_Pioneers`（`/Users/paulli/coding/HEP/Web/Web_Pioneers`）。目录改名保留原Git历史与远程配置。GitHub仓库：[PaulLi07/Physicists](https://github.com/PaulLi07/Physicists)，远程名 `origin`，主分支 `main`。

本机 `origin` 的读取地址为 `https://github.com/PaulLi07/Physicists.git`，推送地址使用 `git@github.com:PaulLi07/Physicists.git`。SSH已核实对应账号为 `PaulLi07`；配置仅作用于本项目。

## 日常保存与同步

在项目根目录运行：

```bash
git status
git diff
git add <本次修改的文件或目录>
git commit -m "Describe the change"
git push
```

更新网页数据时，先运行 `python3 scripts/build_website.py`，检查生成结果，再同时提交源文件和 `website/dist/`。构建同时生成新版人物与成果数据；修改网页交互后可运行 `node --test website/tests/*.test.cjs`。

从另一台电脑或GitHub网页修改后，在本地没有未提交修改时执行：

```bash
git pull --ff-only
```

首次在其他电脑取得项目：

```bash
git clone https://github.com/PaulLi07/Physicists.git Web_Pioneers
cd Web_Pioneers
python3 website/serve.py
```

## 纳入与忽略的文件

提交完整的中英文档案、核实数据、图片来源与最终配图、复核报告、脚本、网页源文件及可直接运行的静态输出。重复图片在Git对象库中按内容去重。

检索网页缓存、临时日志、Python缓存、本机环境与凭据文件由 `.gitignore` 排除；官方诺奖快照作为离线构建依赖保留。本地原始缓存不会被此规则删除。
