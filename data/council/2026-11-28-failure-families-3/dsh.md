<!-- 从 raw_dsh.md（206,754 字符，含完整 reasoning trace）抽出的最终答案段；原文未改动 -->

## 第一部分

### 例 1

- **族**：第 3 族
- **依据**：命中「Same construct, different instrument. The spread is a property of the vendor pair, not of the subject.」——两处都是「2030 年服务器 CPU 市场 / TAM」这同一构念；100–1500 亿与约 2200 亿的差，来自 A 与「市场主流预期」这两家预测方的模型/口径，而不是服务器 CPU 需求本身有两个值。A 的「>2000 亿」明写是「2030 年后」，不能拿去和 B 的「到 2030 年约 2200 亿」对齐。
- **缺的信息**：两家对「服务器 CPU 市场」的口径是否一致（A 的「资料中心」是否只覆盖数据中心服务器，B 的 TAM 是否覆盖传统云与企业 / Agentic CPU / 头节点 CPU 全部）；引文未给。若口径不同，应改判第 2 族。

### 例 2

- **族**：第 2 族
- **依据**：命中「two numbers share a label but differ in definition, population or aggregation level」——「NeuronLink 带宽约为 EFA 的 1.65 倍」与「31 GB/s 对 8 GB/s」共享「带宽 / 带宽比」这个标签，但后者是「机架内 vs 跨机架非对等」的 population；31/8≈3.9 与 1.65 的差是口径差，不是同一个带宽比的两个估计。
- **缺的信息**：机架内 EFA 的带宽（把 31 GB/s 与 1.65× 对上的那个量）；引文只给跨机架非对等 EFA 的 8 GB/s。这个量缺失同时使第 8 族的「can be converted」被阻断。

### 例 3

- **族**：出表
- **依据**：被第 2 族的「two numbers share a label but differ in definition, population or aggregation level」挡住——两个 1330 并不共享一个标签：一个是「全球半导体制造设备销售额（2025）」，一个是「全球 300mm 晶圆厂设备支出（2026）」。它只是同一数值被贴到两个不同构念上（数值巧合），不是「同名不同构念」；第 8 族也没有「claim / evidence」的归一化错配。
- **缺的信息**：无（就归族而言）。若要检验两个 1330 是否自洽，才需要 2025 年 300mm 支出或 2026 年 300mm 占总设备比例，引文未给。

### 例 4

- **族**：第 2 族
- **依据**：命中「A label is read as answering one question while the number answers another」与「two numbers share a label but differ in definition」——「USDT 评分」这个标签下，69 量的是 `authority_control`，1 量的是 `tradability`；两个数共享「评分」之名而构念不同，原文的「There is no number between them that means anything」正是「Averaging them is a category error, not a compromise」。
- **缺的信息**：无（原文已点明两个构念）。

### 例 5

- **族**：第 8 族
- **依据**：命中「A claim is stated in one normalisation (per unit, per GB, incremental) while its evidence is computed in another (total, per stack, total over base)」与「the two can be converted to a common denominator; they simply were not, and converting changes the conclusion」——「约 30% 的 TCO」是 level（占基准的比例），「30%~40% 的 TCO 下降」是 incremental（相对基准的变化）；把 30% of TCO 换成 decline 是 70%，与 30–40% 完全不同，换算改变结论。
- **缺的信息**：无（换算只需 1−30%，基准是 GB300 的 100%，引文已给足；符合第 8 族前置问）。

### 例 6

- **族**：第 7 族
- **依据**：命中「the ceiling is missing, in different units, or in the same units but measured for a different purpose」与「In its founding form both are reported and neither can be subtracted from the other; it has the shape of full disclosure and does none of the work」——300–400 亿美元是「较现实运行假设」下的结果，>1000 亿美元是「更激进上沿情景」下的上限；两者同单位（每 GW 每年美元）但为不同目的（基准 vs 上沿）而测，不能相减，文章把两者都摆出来却不给一个可用的参照点。
- **缺的信息**：使两个情景可比的假设集（利用率、API 单价、价值实现率）——引文未给，无法把 >1000 亿折回 300–400 亿的同一情景。

### 例 7

- **族**：第 2 族
- **依据**：命中「two numbers share a label but differ in definition, population or aggregation level」——「推理占比」这个标签下，IDC 的 76%/24%、>50%、2/3、70%+ 分别是 GenAI IaaS 市场份额与推理算力负载比例，Gartner 的 233 亿对 190 亿是 AI IaaS 支出份额；同名而分母/构念不同，不能拼成一条「推理占比」曲线。
- **缺的信息**：把「算力负载比例」换成「支出份额」所需的单位算力价格（或反向换算量）；引文未给，所以第 8 族的「can be converted」被阻断，不得归第 8 族。

### 例 8

- **族**：第 3 族
- **依据**：命中「Same construct, different instrument. The spread is a property of the vendor pair, not of the subject.」——同一「300mm 晶圆厂设备支出」构念，A 报 2026 年 1330 亿，B 报「今年」1490 亿（并给 2029 年 2270 亿）；差异来自两篇报道所引 SEMI 预测的版本/时点（B 的 1490 亿甚至高于 A 同篇 2026 年总设备 1450 亿，说明两者不是同一版口径），是 vendor pair 的差。
- **缺的信息**：两篇报道的发布年份（「今年」到底是哪一年）以及同一版 SEMI 预测的总设备销售额；引文未给。若「今年」不是 2026，则不是同一构念，应改判第 2 族（population 不同）而非第 3 族。

### 例 9

- **族**：第 2 族
- **依据**：命中「two numbers share a label but differ in definition, population or aggregation level」——「库存天数」这个标签下，TXN 的 75 天明写是「成品库存」，MCHP/ON 的 175/189 天是未限定的「库存天数」（通常含原材料/在制/成品）；把 75 与 175 并排比较，差主要是口径（成品 vs 全部）差，不是同一库存天数的两个观测。
- **缺的信息**：MCHP/ON 的「库存天数」是否含原材料与在制品；引文未给。若它们也只算成品，则不是第 2 族。

## 第二部分

最可能错在「两个来源在同一市场标签下给出不同数字」的那一类（例 1、例 8）。引文没有给各自的口径（例 1 的「资料中心」到底是不是只覆盖数据中心服务器）或版本（例 8 的「今年」到底是哪一年）；而第 2 族问「label 是否在各自来源里定义不同」，第 3 族问「是否同一构念、不同 instrument」。在只有标签和数字、没有定义和年份时，这两族在观察上长得一样——同一个 1.5 倍左右的差，既可能是 population/定义差（第 2 族），也可能是预测方/版本差（第 3 族）。我按「标签看起来同名」默认了第 3 族；一旦口径或年份不同，就该落到第 2 族。其次是例 6 的第 7 族 vs 第 2 族：那里被当作 ceiling 的 >1000 亿其实是「上沿情景」，不是严格意义的 best achievable。
