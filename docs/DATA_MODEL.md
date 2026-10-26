# 网页数据接口

主要入口为 `zh/data/physicists.json` 和 `en/data/physicists.json`，两版均可单独复制使用。图片与档案路径相对于所属语言目录。根目录 `data/physicists.json` 保留中文版以兼容原项目。文本为 UTF-8，日期按下表存储。

| 字段 | 含义 |
| --- | --- |
| `schema_version` | 当前结构版本 |
| `as_of` | 本次整理日期 |
| `language` | `zh-CN` 或 `en`；两个语言目录使用结构版本2.0.0 |
| `people` | 已按出生时间排序的人物数组 |
| `people[].id` | 稳定的人物标识；网页路由建议使用此值 |
| `order` | 当前时间顺序，新增人物时可改变 |
| `name` | 所属语言的显示姓名；英文版另保留 `name_en`，中文版保留 `name_zh` 和 `name_en` |
| `birth` / `death` | `{date, precision, display}`；`death` 可为空 |
| `death_status` | `alive`、`deceased` 或 `unknown` |
| `sort_year` | 便于筛选的整数出生年，负数表示公元前 |
| `biography` | 所属语言的生平简介 |
| `contributions` | 所属语言的代表性物理贡献字符串数组 |
| `fields` | 领域标签数组 |
| `notes` | 日期争议、史料问题及其他限定说明 |
| `sources` | 参考来源数组：`{title, url}`，部分来源附有 `kind` |
| `portrait.local_path` | 本地图片路径 |
| `portrait.kind` | `portrait`、`posthumous_depiction` 或 `context_image` |
| `portrait.depiction_note` | 对画像真实性、创作形式或非人物图像的说明 |
| `portrait.alt_zh` / `portrait.alt` | 中文版／英文版图片替代文字 |
| `portrait.artist` / `credit` | 图片作者、原始来源或署名信息 |
| `portrait.license` / `license_url` | 文件本身的许可及权利声明页；无法定位独立许可页时可指向原图说明页，不能替换为页面默认文字许可 |
| `portrait.source_page` | 原文件或馆藏描述页，发布图片时保留链接 |
| `portrait.commons_page` | Commons 原文件描述页；其他来源的图片可为空 |
| `portrait.rights_status` | `permission_required` 表示尚未确认可用于网站再发布；其他状态仍须遵守具体来源许可 |
| `portrait.sha256` | 下载文件的哈希，用于文件一致性校验 |
| `portrait.asset_source_path` | 可选；相对于源项目的本地采集缓存位置，正常浏览使用 `local_path` |
| `*_original` | 可选；翻译或清理元数据前的原文，保留作者姓名、来源标签或权利声明以便追溯 |
| `wikidata_id` | 可选的 Wikidata 实体标识 |
| `nobel_physics_years` | 诺贝尔物理学奖年份；同一人物只保留一条档案 |
| `source_file` | 对应的独立 Markdown 档案路径 |
| `reviewed_at` | 本次资料整理日期 |

不要直接把公元前或只精确到年的日期传入浏览器 `Date` 对象；应使用 `sort_year` 加 `date` 分量，或沿用文件中的数组顺序。显示日期时使用 `display`，以保留约年和历史说明。

图片可能有不同纵横比例。网页应保留原图比例或使用 `object-fit: contain`，并同时展示对应语言的替代文字、图片性质、署名、许可与来源。`context_image` 应显示“相关资料图”，不能标作“本人肖像”。`portrait` 也可能是含有本人的合影、工作照或历史绘画，应显示具体图注。邮票等后世纪念形象归入 `posthumous_depiction`。

两版共享 `id`、`order`、日期值与精度、生死状态、诺奖年份、图片文件哈希和来源URL集合；只有展示语言不同。历史人物原文姓名和法定机构署名可以保留原文字形。时间轴日期显示随语言变化，网页不应自行抹去 `display` 和 `notes` 中的争议或精度限定。
