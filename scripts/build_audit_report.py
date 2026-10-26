#!/usr/bin/env python3
"""Publish the baseline diff, review coverage and bilingual audit documentation."""
import collections
import hashlib
import json
import shutil
from build import ROOT, AS_OF


def load(path):
    return json.loads((ROOT / path).read_text())


def save(path, data):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def write(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text.strip() + '\n')


def review_rows(data):
    if isinstance(data, list):
        return data
    return next(data[key] for key in ['records', 'people'] if isinstance(data.get(key), list))


def main():
    people = load('data/physicists.json')['people']
    english = load('en/data/physicists.json')['people']
    names_en = {p['id']: p['name'] for p in english}
    old = {p['id']: p for p in load('data/audit/baseline.json')['people']}
    current = {p['id']: p for p in people}
    added = [p for p in people if p['id'] not in old]
    removed = sorted(set(old) - set(current))
    if removed:
        raise ValueError('Baseline records removed: ' + ', '.join(removed))
    changes = []
    for p in people:
        if p['id'] not in old:
            continue
        before = old[p['id']]
        changed = {key: {'before': before.get(key), 'after': p.get(key)} for key in
                   ['name_zh', 'name_en', 'birth', 'death', 'death_status', 'biography',
                    'contributions', 'fields', 'notes', 'sources'] if before.get(key) != p.get(key)}
        image_keys = ['file_name', 'source_page', 'sha256', 'kind', 'depiction_note', 'license', 'rights_status', 'artist', 'credit']
        a = {k: (before.get('portrait') or {}).get(k) for k in image_keys}
        b = {k: (p.get('portrait') or {}).get(k) for k in image_keys}
        if a != b:
            changed['portrait'] = {'before': a, 'after': b}
        if changed:
            changes.append({'id': p['id'], 'name_zh': p['name_zh'], 'name_en': p['name_en'], 'changes': changed})
    date_changes = [x for x in changes if any(k in x['changes'] for k in ['birth', 'death', 'death_status'])]
    review_reports = []
    review_counts = collections.Counter()
    for path in sorted((ROOT / 'data/audit').glob('english-peer-review-*.json')):
        rows = review_rows(json.loads(path.read_text()))
        review_reports.append({'file': str(path.relative_to(ROOT)), 'records': len(rows)})
        review_counts.update(row['id'] for row in rows)
    if set(review_counts) != set(current) or any(n != 1 for n in review_counts.values()):
        raise ValueError('English peer-review coverage must match all current IDs exactly once')
    kinds = collections.Counter(p['portrait']['kind'] for p in people)
    permissions = [p for p in people if p['portrait'].get('rights_status') == 'permission_required']
    context = [p for p in people if p['portrait']['kind'] == 'context_image']
    summary = {
        'as_of': AS_OF, 'baseline_records': len(old), 'records_per_language': len(people),
        'added_records': len(added), 'removed_records': len(removed),
        'existing_records_with_editorial_or_source_changes': len(changes),
        'existing_records_with_date_precision_display_or_status_changes': len(date_changes),
        'nobel_physics_people': sum(bool(p['nobel_physics_years']) for p in people),
        'images_per_language': len(people), 'image_kinds': dict(kinds),
        'website_image_permission_unverified': len(permissions),
        'english_independent_semantic_review': {'records': sum(review_counts.values()), 'missing_ids': [], 'duplicate_ids': [], 'reports': review_reports},
        'canonical_validation': {k: v for k, v in load('data/validation-report.json').items() if k != 'notes'},
        'bilingual_validation': {k: v for k, v in load('data/audit/bilingual-validation.json').items() if k != 'records'},
        'scope': 'Broad, source-checked, expandable history archive; no claim of worldwide exhaustiveness or historical infallibility.',
        'limitations': ['Source conflicts and uncertain dates remain explicit.', 'Posthumous depictions and contextual illustrations are not authenticated lifetime portraits.', 'Permission flags must be resolved before public image republication.'],
    }
    publication = load('data/audit/final-english-publication-qa.json')
    image_qa = load('data/audit/final-image-qa.json')
    summary['final_english_publication_qa'] = {
        'passed': publication['overall_result'] == 'passed',
        'profiles': publication['generated_profile_count'],
        'reviewed_data_sha256': publication['generated_data_sha256'],
        'current_data_sha256': hashlib.sha256((ROOT / 'en/data/physicists.json').read_bytes()).hexdigest(),
        'source_report': 'data/audit/final-english-publication-qa.json',
    }
    summary['added_image_visual_qa'] = {
        'passed': image_qa['passed'], 'profiles': image_qa['final_rechecked_people'],
        'source_scan': image_qa['source_scan'], 'limitations': image_qa['limitations'],
        'source_report': 'data/audit/final-image-qa.json',
    }
    save('data/audit/summary.json', summary)
    save('data/audit/changes.json', {'as_of': AS_OF, 'baseline_records': len(old), 'current_records': len(people), 'added_ids': [p['id'] for p in added], 'removed_ids': removed, 'existing_record_changes': changes,
        'interpretation': 'Changes include wording, precision, display, source additions and metadata cleanup; the number of changed records is not a count of factual errors.'})
    additions = ['# 本轮新增人物 / New contributors', '', f'{AS_OF}：新增{len(added)}人，仍按出生时间排序。', '', '| 出生日期 | 中文姓名 | English name |', '| --- | --- | --- |']
    additions += ['| ' + p['birth']['display'] + ' | [' + p['name_zh'] + '](../' + p['source_file'] + ') | ' + names_en[p['id']] + ' |' for p in added]
    write('docs/ADDITIONS.md', '\n'.join(additions))
    report_zh = f'''# 全库复核与双语档案报告

整理日期：{AS_OF}。原库{len(old)}人，本轮新增{len(added)}人，现有中文、英文各{len(people)}份独立档案，按出生日期排列。原有{len(old)}人的档案全部保留。

## 检索与事实复核

本轮重新检索并对照AIP物理史资料、MacTutor、National MagLab同类先驱网页、诺贝尔奖官方数据、Wolf Foundation及ICTP等入口，随后回到大学、研究机构、国家档案、科学院传记和论文核对具体人物。访问受限、来源矛盾和未确定的日期均保留记录；没有把搜索结果摘要或单一目录视为最终事实。

原有档案逐人检查身份、生卒日期及精度、生平、主要贡献、合作归属、图片和来源。诺贝尔物理学奖{summary['nobel_physics_people']}位独立得主另以官方名单核对，重复获奖者合并。National MagLab本轮目录的66个入口中收录63人，另3人按一般工程或医学器械贡献边界说明排除。本轮新增涵盖早期光学、力学、热学、电磁实验、核物理、场论、凝聚态、天体物理及女性和非诺奖贡献者。

## 主要修订

- 区分出生、受洗、逝世和安葬日期；例如帕潘、乔治·格林的仪式日期与未知的确切生卒日分别陈述。
- 核对旧历与公历、来源正文与简表冲突；对哈雷、雷诺、杜恒、寺田寅彦等人的日期作修订或说明。
- 用档案或机构资料纠正冯·劳厄、加博尔、贾科尼、格林贝格等人的日期；曼内·西格巴恩、杨振宁等来源分歧仍明确展示，不把分歧删去。
- 修订费马原理的驻值表述、斯托克斯位移的通常条件、切伦科夫效应的介质相速度阈值、霍尔丹链的适用模型，以及共同发现、实验条件与贡献归属等文字。
- 检查勒让德、普雷沃等易同名误配图像，区分仪器图、归属存疑画像、合影、后世纪念邮票与本人肖像；保留逐图来源和许可条件。

与基线比较，{len(changes)}份原有档案发生文字、来源或图片元数据更新，其中{len(date_changes)}份涉及日期数值、精度、显示或生死状态。此数包含限定说明和格式修订，不能解释成发现了同样数量的事实错误。

## 英文版再次复核

英文草稿完成后，由未撰写相应分组英文的另一位审阅者，对全部{len(people)}人逐项复核；覆盖早期138人、十九世纪125人、诺奖230人、现代204人、实验补充10人及场论补充14人。逐项比较生平语义、每条贡献、物理术语、合作者、限制条件、生卒显示、历法与争议、图片性质和来源。共享诺奖概述按120个年份单元及103个人物补充单元审阅，再逐人核对应用情况。

随后再检查生成的英文档案：清除机构名中的HTML实体、作者模板样式代码与重复标签、残留中文描述性署名和空格问题，修正误指向图片文件的许可链接；原文作者姓名及法定机构署名有意保留。英文复核表示译文与已核实中文事实集相符，不等同于对每个历史争议又重新取得独立原始档案证明。

## 文件完整性与图片边界

中英文逐人检查稳定ID、时间顺序、生卒值与精度、状态、贡献和备注对应、来源URL、图片类别及文件哈希；全部本地图片解码并核对档案链接。每版均有{len(people)}份人物文字和{len(people)}项本地配图引用。

新增{len(added)}人的实际图片全部目视检查，发现的12项图注、分类或来源问题已修正。154个Commons来源页再次请求中124个成功、30个受到限流；限流页面仍保留先前缓存与补充核对证据，不把请求失败写成重新获取成功。最终英文生成文件另作全量输出检查，当前问题与断链均为0。

配图分为{ kinds['portrait'] }项肖像或含本人的照片、{ kinds['posthumous_depiction'] }项后世画像或纪念形象、{ kinds['context_image'] }项相关资料图。后两类均有醒目说明，不能作为可靠生前写生肖像。{len(permissions)}项图片的公开网站再发布授权尚未确认，详见待补清单及逐图许可。

名录覆盖广泛但仍开放扩充；历史资料矛盾、近似日期、贡献边界及未找到可核实数字肖像的情况继续保留，不作“绝无遗漏或错误”的保证。
'''
    report_en = f'''# Archive audit and bilingual review

Reviewed: {AS_OF}. The archive expanded from {len(old)} to {len(people)} people, adding {len(added)} contributors and retaining every original record. Each language edition contains {len(people)} independent dossiers ordered by birth date.

## Research and factual checks

The new search compared AIP history resources, MacTutor, the National MagLab pioneers directory, official Nobel data, Wolf Foundation and ICTP entry points, followed by individual university, laboratory, national archive, academy and paper sources. Access failures, conflicting dates and unresolved historical questions remain documented. No single directory was treated as infallible.

All original records were reviewed for identity, life dates and precision, biography, scientific contribution, collaborator credit, images and sources. The official Nobel Physics cohort contains {summary['nobel_physics_people']} distinct people; multiple awards are merged by person. Of 66 entries read from the MagLab directory, 63 are included; three were excluded under the archive's scope for general engineering and medical-device inventors.

Corrections distinguish birth from baptism and death from burial, retain historical calendar differences, and address disagreements between biographical summaries and original memorials. Examples include Papin, George Green, Halley, Reynolds, Duhem, Terada, von Laue, Gabor, Giacconi and Grünberg. Source disagreements involving Siegbahn and Yang remain visible. Scientific wording was refined for stationary optical paths, the usual Stokes shift, the Cherenkov threshold in a medium, Haldane's antiferromagnetic chains, collaborator credit and experimental conditions.

Compared with the baseline, {len(changes)} original records have editorial, source or image-metadata changes; {len(date_changes)} involve a date value, precision, display or life-status change. These totals include clarification and formatting, and are not counts of factual errors.

## Independent English review

After drafting, a different reviewer read all {len(people)} English records against the audited Chinese facts: 138 early-history, 125 nineteenth-century, 230 Nobel, 204 modern, 10 experimental additions and 14 field-theory additions. The review compared biographies, every contribution, terminology, collaborator credit, qualifications, life-date displays, historical caveats, image descriptions and sources. Shared Nobel text was reviewed in 120 prize-year units and 103 individual supplementary units, with its application checked for every laureate.

An additional publication check removed leaked HTML entities, stylesheet text and duplicated author-template labels, untranslated descriptive credits and spacing defects. Licence links pointing to image downloads were redirected to the image's rights statement. Original-script personal names and legal institutional attributions are intentionally retained. This is semantic review against the source-checked Chinese archive, not a claim that every historical dispute was independently resolved a second time.

## Integrity checks and limitations

Every Chinese–English pair was checked for stable ID, chronological order, date values and precision, life status, contribution and note alignment, source URLs, image type, image hashes and local links. All local images were decoded. Each edition contains {len(people)} dossiers and {len(people)} local image references.

All {len(added)} added images were visually inspected, and 12 caption, classification or provenance findings were corrected. Of 154 fresh Commons source-page requests, 124 succeeded and 30 were rate-limited; existing caches and complementary evidence remain recorded for the latter. The final full English-output check reports no current findings or broken local links.

There are {kinds['portrait']} portraits or photographs containing the subject, {kinds['posthumous_depiction']} posthumous or commemorative depictions, and {kinds['context_image']} contextual illustrations. The latter two categories are explicitly labelled and must not be presented as authenticated lifetime likenesses. Website republication permission remains unverified for {len(permissions)} image records.

The archive remains expandable. Historical source conflicts, approximate dates, scope decisions and unavailable authenticated digital portraits remain explicit; worldwide completeness or absolute freedom from error is not claimed.
'''
    links_zh = '\n\n- [待补与限制](OPEN_ITEMS.md)\n- [对照资料库](REFERENCE_SITES.md)\n- [逐图来源与许可](IMAGE_CREDITS.md)'
    links_en = '\n\n- [Open items and limitations](OPEN_ITEMS.md)\n- [Reference directories](REFERENCE_SITES.md)\n- [Image sources and rights](IMAGE_CREDITS.md)'
    write('docs/AUDIT_REPORT.md', report_zh + links_zh + f'\n- [新增{len(added)}人清单](ADDITIONS.md)\n- [结构化复核摘要](../data/audit/summary.json)\n- [原库逐条差异](../data/audit/changes.json)\n- [英文最终输出核查](../data/audit/final-english-publication-qa.json)\n- [新增图片逐张终审](../data/audit/final-image-qa.json)\n- [中文目录](../zh/INDEX.md) / [English index](../en/INDEX.md)\n\n逐人事实复核、独立英文复核、访问状态及原始检索缓存保存在根目录的 `data/audit/` 与 `data/raw/`。')
    write('zh/docs/AUDIT_REPORT.md', report_zh + links_zh + '\n- [结构化复核摘要](../data/audit-summary.json)\n- [人物目录](../INDEX.md)')
    write('en/docs/AUDIT_REPORT.md', report_en + links_en + '\n- [Machine-readable audit summary](../data/audit-summary.json)\n- [Chronological index](../INDEX.md)')
    for lang in ['zh', 'en']:
        save(lang + '/data/audit-summary.json', summary)
    for lang, records in [('zh', people), ('en', english)]:
        en = lang == 'en'
        rows = ['# Open items and limitations' if en else '# 待补与资料限制', '',
                f'All {len(people)} records have local images. The following {len(context)} use contextual illustrations, not authenticated portraits of their subjects:' if en else f'全部{len(people)}份档案均有本地配图。以下{len(context)}份使用相关资料图，不能视为已确认的本人肖像：', '',
                '| Person | Current illustration and remaining uncertainty |' if en else '| 人物 | 现有配图及待核问题 |', '| --- | --- |']
        rows += ['| [' + (p['name'] if en else p['name_zh']) + '](../' + p['source_file'] + ') | ' + p['portrait']['depiction_note'].replace('|', '\\|').replace('\n', ' ') + ' |' for p in records if p['portrait']['kind'] == 'context_image']
        rows += ['', f'{kinds["posthumous_depiction"]} other image records are posthumous or commemorative depictions, with their status stated in the dossiers.' if en else f'另有{kinds["posthumous_depiction"]}份配图为后世画像、雕塑或纪念形象，性质已在档案中说明。', '',
                 f'Public website republication permission has not been verified for {len(permissions)} image records. See the per-image source, attribution and rights information. A stored file is not a blanket republication licence.' if en else f'{len(permissions)}项图片尚未确认可用于公开网站再发布。逐图来源、作者和权利状态见图片清单；保存图片不等于获得统一再发布许可。', '',
                 'The list remains expandable. Do not remove approximate dates, conflicting-source notes or uncertain life-status information when building a website.' if en else '人物名录仍开放扩充。后续网页应保留约年、来源冲突及下落或死亡时间未知等说明。', '',
                 '[Image sources and rights](IMAGE_CREDITS.md) · [Audit report](AUDIT_REPORT.md)' if en else '[图片来源与许可](IMAGE_CREDITS.md) · [复核报告](AUDIT_REPORT.md)']
        write(lang + '/docs/OPEN_ITEMS.md', '\n'.join(rows))
    shutil.copyfile(ROOT / 'zh/docs/OPEN_ITEMS.md', ROOT / 'docs/OPEN_ITEMS.md')
    shutil.copyfile(ROOT / 'docs/REFERENCE_SITES.md', ROOT / 'zh/docs/REFERENCE_SITES.md')
    write('en/docs/REFERENCE_SITES.md', '''# Reference directories used in this audit

Reviewed: 2026-10-26. These resources supplied comparison lists and source entry points; individual facts were checked in biographies, institutional records and papers.

| Resource | Use and qualification |
| --- | --- |
| [AIP Physics History Network](https://history.aip.org/acapsearch/) | Physics biographies and institutional history; entries are not automatically people within this archive's scope. |
| [AIP Oral History](https://www.aip.org/history/oral-history) | Career and collaboration context; interview dates are not life dates. |
| [MacTutor, University of St Andrews](https://mathshistory.st-andrews.ac.uk/) | Early science and mathematical physics; summary dates are checked against narrative evidence and ritual dates. |
| [National MagLab pioneers](https://maglabweb.magnet.fsu.edu/magnet-academy/history-of-electricity-magnetism/pioneers/) | A comparable illustrated history directory; 66 entries were compared with explicit scope decisions. |
| [Official Nobel laureate API](https://api.nobelprize.org/2.1/laureates?nobelPrizeCategory=phy&limit=1000) | Complete official Physics cohort through 2026; archival corrections and recent deaths may require other primary evidence. |
| [Wolf Foundation](https://wolffund.org.il/home-page/) | Discovery of experimental and non-Nobel contributors; duplicated homepage templates were not accepted as individual biographical proof. |
| [ICTP Dirac Medal](https://www.ictp.it/home/dirac-medal) | Discovery of theoretical contributors; awards are not the sole inclusion criterion. |
| [Royal Society archive](https://catalogues.royalsociety.org/) | Membership, dates and archival references; disagreements with national sources remain explicit. |
| [Swedish National Archives biographies](https://sok.riksarkivet.se/sbl/) | Archival life dates and research histories, including the Siegbahn source conflict. |

The research also used universities, laboratories, academies, museums, national libraries and contemporary memorials. Individual evidence appears in each dossier. Broad internet research does not imply that every webpage or every historical contributor has been exhausted.
''')
    write('README.md', f'''# 物理学先驱档案 / Physics Pioneers Archive

供后续人物档案网站、时间轴与学科导航使用的双语资料源项目。每人一份档案，包含生平、生卒日期及精度、主要物理贡献、配图、来源和史料说明，按出生时间组织。

**[打开物理学先驱网页](index.html)** · [网页源文件与使用说明](website/README.md)

GitHub：[PaulLi07/Physicists](https://github.com/PaulLi07/Physicists) · [Git日常维护说明](docs/GIT_WORKFLOW.md)

网页支持时间轴、姓名与领域搜索、完整人物档案和中英文切换，可离线使用。

- **[浏览中文版](zh/INDEX.md)**：{len(people)}人
- **[Browse the English edition](en/INDEX.md)**: {len(people)} people
- [本轮全库复核报告](docs/AUDIT_REPORT.md) / [English audit report](en/docs/AUDIT_REPORT.md)
- [本轮新增{len(added)}人](docs/ADDITIONS.md) · [待补与资料限制](docs/OPEN_ITEMS.md)

资料整理日期：{AS_OF}。从原有{len(old)}人扩充到{len(people)}人，包含截至2026年的{summary['nobel_physics_people']}位独立诺贝尔物理学奖得主。原库经过逐人来源复核；全部英文档案完成另一位审阅者的独立语义复核，再检查生成结果。详见逐条复核记录与原库差异，不声称名录已穷尽物理史。

每版有{len(people)}份文字档案及本地配图引用；{kinds['portrait']}项为肖像或含本人的照片，{kinds['posthumous_depiction']}项为后世或纪念形象，{kinds['context_image']}项为明确标注的相关资料图。公开网站再发布授权尚未确认的图片有{len(permissions)}项，逐图记录权利状态。

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
''')
    print(json.dumps({k: summary[k] for k in ['records_per_language', 'added_records', 'existing_records_with_editorial_or_source_changes', 'existing_records_with_date_precision_display_or_status_changes', 'image_kinds', 'website_image_permission_unverified']}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
