# 物理学突破指数 v3.0

本目录保存具名成果、直接评估的重要性、计分年代和逐年计算结果。完整可维护规范在 [中文方法文档](../../docs/physics-breakthrough-index.zh.md) 与 [English method](../../docs/physics-breakthrough-index.en.md)。旧 v2 的按人物残余分与按年代扩宽平滑已退役；`adaptive-method.md` 保留作历史方法说明。

## 输入

- `events-*.json`：原始文献成果、历史贡献与具名编辑评估成果。
- `event-assessments.json`：既有成果逐项 v3 重要性与日期复核；不改写原始来源日期。
- `editorial-event-patches.json`：补全已存在的未知日期成果，合并人物与同项贡献，避免重复建项。
- `editorial-coverage.json`：原人物估计如何落实为具名成果的追踪表。
- `existing-source-patches.json`、`journal-sources.json`：期刊精选及原始研究来源；精选与论文数量本身不产生分数。
- `index-config.json`：版本、资料审查截止日及显示参数。

## 规则

以成果而非人物数量计分。重要性采用1/2/4/8/16五档，人工评估理由保存在每项 `assessment`；古代、经典时期与现代使用适合其资料的评价路径，分值尺度一致。资料可信度与重要性分别记录。

`dateModel` 分为单年、未知确切年份的区间、长期持续工作。每项仅有一份总评分，所有年度分配份额之和必须为1。已知成果的年份不向前后扩散；同项共同发现与重复论文不倍增。理论提出与独立实验发现可分别记账。

来源与版本：原始日期保留在 `sourceDate`；获奖、再版与纪念不是新成果。替代项通过 `supersedes` 退役旧预算。评分与时间判断均是可修改、可追溯的编辑评估。

## 输出与更新

```bash
node scripts/build_breakthrough.cjs
node --test website/design-review/tests/*.test.cjs
```

- `yearly-index.json`：年度总值、来源与编辑估计分量、独立人物密度。
- `navigation-estimates.json`：仅目录定位和人物密度；不计入突破分数。
- `contribution-estimates.json`：标识 v2 人物残余评分已退役。
- `coverage.json`：全部人物导航与具名成果覆盖。
- `sensitivity.json`：评分尺度变化对年度分布的影响，以及全部年度值与成果预算守恒核对。

网页生成数据在 `website/design-review/data/`。图形用明确标注的 asinh 横轴，所有时期使用相同映射；屏幕压缩多年时求年度密度均值，不将一个像素所跨年份求和伪作年度峰高。人物密度颜色严格沿用 ROOT 的灰—近黑—纯红渐变；成果文字色独立取重要性五档。

本轮复核依据与变更在 `audit-v3-existing.md`、`audit-v3-editorial.md`，期刊来源检索过程保留于 `audit-journal-milestones.md`。
