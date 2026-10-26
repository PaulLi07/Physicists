# 权威期刊成果补充核对（2026-10-26）

## 本轮实际使用的数据

直接阅读出版方的编辑精选目录，再以原始论文的作者、题名、DOI与出版年份核对，手工构建结构化成果记录。本轮新增48项原库没有的成果，39项具有明确的出版方编辑精选归属，另外9项是原始期刊研究论文的补充；共关联40位现有档案人物。另提供42条既有事件的官方集合来源补丁，不把同一成果重新计数。

这不是下载整本期刊的论文量后作数量统计，不是引文排行榜，也没有把本站1/2/4/8权重说成期刊给出的分数。编辑精选用于发现与佐证；事件的重要性权重仍采用本项目公开的编辑尺度。

实际读取的官方集合：

1. [PRL 50周年 Milestone Letters](https://journals.aps.org/prl/50years/milestones)：原始论文链接、题名、作者、年卷页及编辑回顾。新条目包括Mermin–Wagner、孤子、DMRG、E91、光频梳、辅助场、非平衡功关系等。
2. [Physical Review 125周年编辑时间轴](https://journals.aps.org/125years)：排除期刊创办、行政与出版技术事件，只使用物理研究成果。新条目包括氘、裂变液滴模型、Nambu机制、X射线天文学、Cabibbo混合、六角相、格子气、三维拓扑绝缘体等。
3. [PRA 50周年 Three Classics](https://physics.aps.org/articles/v13/24)：直接使用文章列出的三篇编辑精选原始论文，分别为1992结构光轨道角动量、2002纠缠负性、1994强场高次谐波理论。
4. [Nature Milestones in Spin](https://www.nature.com/collections/idgejiafca)：读取集合目录以及部分单篇的预览正文与原始论文参考文献。补电子自旋、量子铁磁、Kondo理论、四维超对称、分子磁化隧穿。
5. [APS 2016 Physics Nobel key-paper selection](https://journals.aps.org/2016/10/04/2016-nobel-prize-in-physics)：直接读取五篇关键论文清单，新增Haldane自旋链、Haldane零净磁通模型、TKNN拓扑电导，全部使用原论文年份而非2016年。
6. [PRL 50周年 Timeline](https://journals.aps.org/prl/50years/timeline)：用于既有Anderson局域化等跨刊研究的来源补充；没有把Physical Review论文误称为PRL Letter。

集合的机器可读说明在 `journal-sources.json`，既有成果补丁在 `existing-source-patches.json`。单条新事件保存 `publisherCollections` 与 `literatureEvidence`，可区分编辑精选与仅依据原论文的补充。

## 核对层级与访问限制

- web检索工具可以读取上述官方集合正文或列表；对APS集合的普通HTTP请求返回403，因此未声称使用普通HTTP完整下载了出版方数据库。
- 使用Crossref公开元数据逐项核对原始论文题名、作者、期刊、出版年。只读取公开元数据，没有绕过登录或付费墙。
- 个别Crossref请求返回429，不立即反复重试。Bohr–Wheeler与Heisenberg条目改由出版方文章页面核对，日期和作者均与编辑精选一致。
- Nature部分页面经cookies重定向，部分仅给预览正文与完整参考文献；未访问到的订阅全文不记作已读。`PRB/50th`集合多次超时，因此本轮不声称从中取得了数据，也没有把它列作已采用的集合。
- 原始论文页面与全文不是同一种访问层级。本文记录的是出版元数据/可访问摘要/编辑历史资料核查，不声称逐页读完每篇原始论文。

## 实质修正与去重决定

- 电子自旋使用1925年Naturwissenschaften首发；1926年Nature扩展短文不重新记一项。严格区分现代内禀自旋与字面上的经典旋转小球。
- 八重道在1961年已有公开报告；1962年Physical Review系统论文是参考材料，不把后者误当首次公开年。
- Nambu采用1960年首篇公开论文；1961年Nambu–Jona-Lasinio模型作同一机制的发展来源，不重复加分。
- Bohr–Wheeler1939年定量裂变模型，区别于原库1938–1939年的裂变发现与能量解释。
- 1983年Laughlin关联液体理论区别于1982年Tsui–Stormer–Gossard实验。已向根任务建议移除旧实验条目中Laughlin的错误实验参与归属；本文件不擅改旧源文件。
- 1972年Leggett配对解释区别于同年Osheroff–Lee–Richardson实验，已向根任务建议从实验条目的作者关联中移除Leggett。
- 量子频率梳、1986量子跃迁、1996磁化隧穿等多个组的互补研究按一个成果族记，不按作者人数倍增。
- Hubbard1959辅助场方法与1963 Hubbard模型为不同的方法/模型；旧库没有1959条目，新增时关联真实的 `john-hubbard`。
- 比较论文元数据时发现候选DOI `10.1007/BF00708680`实际指1973年另一篇文章，明确弃用；Zeh1970正确DOI为 `10.1007/BF00708656`。
- Haroche相关的具体腔场退相干实验使用1996年原论文；没有照搬APS概览中较笼统的1992年计划阶段作为这篇实验的日期。
- 三维拓扑绝缘体理论与原库二维量子自旋霍尔实验不同，不把二者合并或重复称作同一实验。
- 理论提案（如额外维度、超对称、超引力、对偶振幅）明确写为理论模型，不把重要的理论史影响误写为已观察到额外维度、超伙伴或引力微子。
- 没有新增证据不可靠的1958年102号元素优先权声明，避免照抄早期里程碑回顾中的有争议发现归属。

## 文件核验

新增事件ID唯一，全部人物ID存在于721人档案；双语标题、理由、日期说明均齐全；所有权重4条目至少两项来源。新文件只含实际文献成果，未混入人物估算因子。原始作者未建档时只在groups中列出，不伪造人物ID。

以下事件逐条记录可供复查：
- 1925 · journal-electron-spin · 电子自旋假说的公开提出 · 权重4
- 1928 · journal-quantum-ferromagnetism · 铁磁性的交换作用解释 · 权重4
- 1932 · journal-deuterium · 氘的发现 · 权重2
- 1939 · journal-fission-liquid-drop · 核裂变的液滴模型计算 · 权重2
- 1958 · journal-neutrino-helicity · 中微子螺旋度的实验测定 · 权重2
- 1959 · journal-hubbard-auxiliary-field · 多体配分函数的辅助场方法 · 权重2
- 1959 · journal-neutron-phonon-spectra · 非弹性中子散射测量晶格振动 · 权重2
- 1960 · journal-nambu-spontaneous-symmetry-breaking · 粒子物理中的自发对称破缺机制 · 权重4
- 1960 · journal-pound-rebka-redshift · Pound–Rebka引力红移实验 · 权重2
- 1961 · journal-eightfold-way · 强相互作用粒子的八重道分类 · 权重4
- 1961 · journal-optical-second-harmonic · 光学二次谐波产生的实验 · 权重2
- 1962 · journal-extrasolar-xrays · 太阳系外X射线源的发现 · 权重4
- 1963 · journal-cabibbo-mixing · 弱相互作用的Cabibbo混合 · 权重2
- 1964 · journal-kondo-resistance · 稀磁合金电阻极小值的量子解释 · 权重2
- 1965 · journal-soliton-recurrence · 非线性波中孤子的数值识别 · 权重2
- 1966 · journal-mermin-wagner · 低维磁序的Mermin–Wagner定理 · 权重2
- 1968 · journal-veneziano-amplitude · Veneziano对偶散射振幅 · 权重2
- 1970 · journal-environment-decoherence · 测量中的环境退相干思想 · 权重2
- 1972 · journal-helium-three-pairing-theory · 氦三超流相的配对理论 · 权重2
- 1974 · journal-wess-zumino-supersymmetry · 四维相互作用超对称模型 · 权重2
- 1976 · journal-supergravity · 四维超引力的构造 · 权重2
- 1977 · journal-altarelli-parisi-evolution · 部分子分布演化的Altarelli–Parisi表述 · 权重2
- 1978 · journal-hexatic-melting · 二维熔化的六角相机制 · 权重2
- 1981 · journal-pointer-basis · 环境选择测量指针基的理论 · 权重2
- 1982 · journal-tknn-topological-conductance · 霍尔电导与拓扑不变量的联系 · 权重4
- 1983 · journal-haldane-spin-chain · 整数自旋反铁磁链的能隙预言 · 权重4
- 1983 · journal-laughlin-fractional-fluid · 分数量子霍尔液体的Laughlin理论 · 权重4
- 1986 · journal-lattice-gas-fluids · 流体方程的格子气自动机方法 · 权重2
- 1986 · journal-optical-tweezers · 单束梯度力光镊 · 权重2
- 1986 · journal-single-ion-quantum-jumps · 单离子量子跃迁的直接观测 · 权重2
- 1988 · journal-haldane-chern-insulator · 零净磁通下的量子霍尔模型 · 权重4
- 1990 · journal-control-chaos · 混沌轨道的反馈控制 · 权重2
- 1990 · journal-synchronize-chaos · 混沌系统的同步 · 权重2
- 1991 · journal-ekert-entanglement-cryptography · 基于纠缠的量子密钥分发 · 权重2
- 1992 · journal-dmrg · 密度矩阵重整化群方法 · 权重2
- 1992 · journal-light-orbital-angular-momentum · 拉盖尔–高斯光束的轨道角动量 · 权重2
- 1994 · journal-strong-field-harmonic-theory · 强场高次谐波产生的量子理论 · 权重2
- 1996 · journal-cavity-field-decoherence · 腔场量子态退相干的观测 · 权重2
- 1996 · journal-spin-magnetization-tunnelling · 高自旋分子中的共振磁化隧穿 · 权重2
- 1997 · journal-jarzynski-equality · 非平衡功与自由能差的Jarzynski等式 · 权重2
- 1999 · journal-warped-extra-dimension · 翘曲额外维度的Randall–Sundrum模型 · 权重2
- 2000 · journal-negative-index-medium · 负介电与负磁导复合介质 · 权重2
- 2000 · journal-optical-frequency-comb · 光频与微波频率的频梳连接 · 权重4
- 2000 · journal-perfect-lens-proposal · 负折射超透镜的理论方案 · 权重2
- 2001 · journal-arbitrary-degree-random-graphs · 任意度分布随机网络的解析方法 · 权重2
- 2002 · journal-entanglement-negativity · 可计算的纠缠负性度量 · 权重1
- 2006 · journal-element-118-confirmation · 118号元素合成结果的公开确认 · 权重1
- 2007 · journal-three-dimensional-topological-insulator · 三维拓扑绝缘体的理论分类 · 权重2

## 整合后的归属修正

旧成果文件中已移除1982实验对Laughlin的作者关联、1972氦三实验对Leggett的作者关联。两人的独立理论成果由本轮期刊记录提供，人物档案本身未删除。新增48项与42条来源补丁一起通过构建核验，后者不会增加成果计数。
