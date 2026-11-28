Warning: no stdin data received in 3s, proceeding without it. If piping from a slow command, redirect stdin explicitly: < /dev/null to skip, or wait longer.
## 第一部分：逐例归族

**例 1 —— 2030 年服务器 CPU 市场规模**
- `族`：无法判定，在族 2 与族 3 之间；倾向族 3（低置信）。
- `依据`：倾向族 3 的 "Same construct, different instrument"。A 自己把上探 2000 亿归因于 Agentic 渗透速度与 CPU 配比，即价差来自预测假设；B 则把 Agentic CPU 直接计入。但 "same construct" 未被证实，族 2 判据（"defined differently in each of their own sources"）也答不出，因为 A 没给定义。
- `缺的信息`：A 的「资料中心与服务器CPU市场」统计口径，即是否含头节点 CPU、Agentic CPU 和自研 ARM。

**例 2 —— NeuronLink / EFA 带宽比**
- `族`：族 2（中置信）。
- `依据`："two numbers share a label but differ in definition, population or aggregation level"。同挂「带宽」标签，1.65 倍是一般比较；31 对 8 GB/s（约 3.9 倍）是 All-to-All 特例，且是机架内对跨机架非对等、128 Rank 对 64 个双 Rank 组。族 8 被前置问挡住：1.65 倍按什么归一不在记录里。
- `缺的信息`：1.65 倍的口径（哪种操作、每链路还是每芯片、机架内还是跨机架）。

**例 3 —— 「1330 亿美元」数值本身**
- `族`：出表（中高置信）。
- `依据`：被族 2 的 "two numbers share a label" 挡住。两处共享的是数值，不是标签：一个是「半导体制造设备销售额」2025 年，一个是「300mm 晶圆厂设备支出」2026 年，标签和年份都写明了。2026 年 300mm 的 1330 小于总额 1450，引文内部自洽。
- `缺的信息`：归族不缺。若怀疑第二个 1330 是转载串数，需要 SEMI 原始新闻稿，仅凭引文无法判断。

**例 4 —— USDT 69 对 1**
- `族`：族 2（高置信）。
- `依据`："two numbers share a label but differ in definition"。`authority_control` 与 `tradability` 是两个 construct，判据一直接命中（"no number between them means anything"）。不是族 3，因为它的 "Same construct" 不成立。
- `缺的信息`：无。

**例 5 —— Trainium3 相对 GB300 的 TCO**
- `族`：族 8（中置信），换算后还剩一层未决。
- `依据`："stated in one normalisation (… incremental) while … computed in another (… total over base)" 加 "converting changes the conclusion"。A 是「约 30% 的 TCO」（total over base），B 是「30%~40% 的 TCO 下降」（incremental）。换算只需 100% 减 x，这个量在记录里，前置问通过。换算后 A 等于下降约 70%，对 B 的 30%~40%，表面同为「30%」的互证变成分歧。
- `缺的信息`：有两项。
  - A 的原文措辞是 "30% of" 还是 "30% lower"，中文句有歧义。
  - B 的 TCO 口径：每芯片、每机架还是每单位性能。B 把 TPU v7 和 Trainium3 合并，对比 GB200 和 GB300。没有它，剩下的 70% 对 30%~40% 无法在族 2 与族 3 之间判定。

**例 6 —— 每 GW 每年收入**
- `族`：出表（中置信）。
- `依据`：三个族都被挡住。
  - 族 8：两数同为「每 GW 每年」，"stated in one normalisation while its evidence is computed in another" 不成立。
  - 族 2：被 "A label is read as answering one question while the number answers another" 挡住，原文自己把「较现实假设」与「激进上沿」分开标注了。
  - 族 3：价差来自明示的情景假设（利用率、高价值场景），不是 "different instrument"。
- `缺的信息`：「行业测算」与「市场相信」是否同一测算源，以及 GW 是 IT 负载还是园区供电。若是两个来源测同一情景，则转入族 3。

**例 7 —— 推理占比**
- `族`：族 2（中高置信）。
- `依据`："differ in definition, population or aggregation level"。IDC 的 2026 年约 2/3 是「算力负载比例」，Gartner 的 2026 年是「支出」，233/(233+190) 约 55%。总体也不同：GenAI IaaS 对 AI IaaS。族 8 被前置问挡住：负载占比换成支出占比需要推理与训练的单位算力价格，不在记录里。
- `缺的信息`：对 2026 年这一对不缺。「首次过半」的 2025 对 2026 之差，需要知道 IDC 的「GenAI IaaS 市场占比」是否按支出计，才能在族 2 与族 3 之间判定。

**例 8 —— SEMI 300mm 晶圆厂设备支出**
- `族`：无法判定。
- `依据`：若「今年」不是 2026，则 1490 与 1330 不在同一格，出表（A 同篇的 2027 年值是 1510）。若「今年」是 2026，则同机构同标签给出两个数，且 1490 大于同年设备销售总额 1450。这时候选是族 2 的 "differ in definition, population or aggregation level"，但判据一要求的两处定义都不在引文里；另一种可能是预测修订，不属于任何一族。
- `缺的信息`：B 的「今年」是哪一年、两篇预测的发布日期、「300mm 晶圆厂设备支出」与「半导体制造设备销售额」各自的定义。

**例 9 —— 库存天数**
- `族`：族 2（中置信）。
- `依据`："differ in definition, population or aggregation level"。TXN 的 75 天明写「成品库存」，MCHP 的 175 和 ON 的 189 只写「库存天数」，没有「成品」限定。75 对 175/189 的差首先来自口径，不是公司本身。
- `缺的信息`：MCHP 和 ON 的「库存天数」定义（全口径、成品还是渠道），以及「行业平均 39 天」的样本与口径。

## 第二部分：最可能错在哪一类

最可能错在「同一标签、两个来源、口径不在引文里」这一类，即例 1、例 8 和例 5 换算后剩下的那一层。

- **原因**：族 2 与族 3 的分界只看 construct 是否相同，而这个事实在这几条引文里不存在。我的倾向来自表面线索（有无限定词、是否提到情景假设），但没写限定词不等于口径相同。例 8 还多一个预测修订的出口。
- **什么会推翻**：拿到 A 的市场定义、B 的 TCO 口径或「今年」的年份，任何一项都可能直接翻案。

次一级风险是两条「出表」（例 3、例 6）和例 5 的主判。

- **例 3、例 6**：我判「文本已明示区分，所以无失效」。若表的本意是「读者仍会混读」也算命中，这两条应归族 2。
- **例 5**：我把「of 对 下降」按族 8 括号里的 incremental / total over base 字面归入。若权威源认为这只是措辞而非分母，主判应让位给族 2。
