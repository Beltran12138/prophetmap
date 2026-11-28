### 第一部分：逐例归族

#### 例 1 ——「2030 年服务器 CPU 市场规模」
- `族`：族 2（Same name, different construct）
- `依据`：`two numbers share a label but differ in definition, population or aggregation level`（在「2030 年服务器 CPU 市场规模」同一标签下，产地 A 的 `1,000亿至1,500亿美元` 为基线预期「市场规模」，且将 Agentic AI 加速渗透作为 2030 年后突破 `2,000亿美元` 的条件情景；产地 B 的 `约2200亿美元` 则定义为包含「传统云与企业、Agentic CPU、头节点CPU」三块总体的 `TAM`［潜在可寻址市场上限］）。
- `缺的信息`：产地 A「市场规模」与产地 B「TAM（及括号内『市场主流预期 2000-2200 亿』）」在各自源头中的口径定义（如 A 的基线总体是否已含 Agentic CPU 与头节点 CPU、A 指实际销售额还是 TAM；若两源对构念的定义与总体完全一致而仅因预测模型不同产生分差，则转归族 3 `Same construct, different instrument`）。

#### 例 2 —— NeuronLink 与 EFA 的带宽比
- `族`：出表 — 被族 8 的 `Unlike family 7, the two can be converted to a common denominator` 从句挡住（前置问「把主张和证据换到同一分母所需的那个量，在记录里吗？」为「不在」，不得归族 8；若将 `8 GB/s` 视作 `31 GB/s` 的参照基线而非可换算分母，则归族 7）。
- `依据`：族 8 主定义句中 `Unlike family 7, the two can be converted to a common denominator` 要求主张（`1.65倍`）与证据（`机架内 128个Rank All-to-All：31 GB/s` 对 
### 第一部分：逐例归族

#### 例 1 ——「2030 年服务器 CPU 市场规模」
- `族`：族 2（若两处对纳入范围/前提的定义不同）或 族 3（若两处指向同一建构、仅预测模型不同）；仅凭引文优先判 **族 2**。
- `依据`：族 2 主定义句从句 `"two numbers share a label but differ in definition, population or aggregation level"`（产地 B 明确将 `Agentic CPU、头节点CPU` 纳入 2030 年 TAM 主口径，而产地 A 将 `Agentic AI渗透速度加快...带动CPU配比与单机价值提升` 列为基线 1,000–1,500 亿美元之外的附加条件情景）。
- `缺的信息`：产地 A 基线预测（1,000 亿至 1,500 亿美元）的细分构成定义，以及产地 B 中「服务器需求……TAM 2200 亿美元」是否仅限服务器 CPU 而不含其他服务器组件。

#### 例 2 —— NeuronLink 与 EFA 的带宽比
- `族`：族 7（若把 128-Rank 机架内与 64 双 Rank 跨机架非对等两项峰值并列作对比）；同时对族 8 而言属于**被前置问阻断**（不得归族 8）。
- `依据`：族 7 主定义句从句 `"the ceiling is missing, in different units, or in the same units but measured for a different purpose. In its founding form both are reported and neither can be subtracted from the other; it has the shape of full disclosure and does none of the work"`（两项「最高带宽」同以 `GB/s` 披露，但分别在 `机架内 128个Rank` 与 `跨机架非对等 64个双Rank通信组` 两种不可相减的通信目的/拓扑下测得；且若想按族 8 把 `1.65倍` 与 `31 GB/s vs 8 GB/s` 换算到同一分母，记录中缺乏换算所需的底层单链路/单节点带宽与拓扑折算量，族 8 的 `"the two can be converted to a common denominator"` 从句被阻断）。
- `缺的信息`：`1.65倍` 所对应的双方原始带宽口径及数值，以及 `31 GB/s` 与 `8 GB/s` 各自对应的分母（每 Rank、每卡还是每节点）与同拓扑下的对比基准。

#### 例 3 ——「1330 亿美元」这个数值本身
- `族`：出表（被族 2 主定义句的 `"two numbers share a label"` 从句挡住）。
- `依据`：族 2 要求 `"two numbers share a label but differ in definition, population or aggregation level"`，而此处是**两个不同标签**（`2025年的全球半导体制造设备销售额` 与 `2026年的全球300mm晶圆厂设备支出`）巧合共享了同一个数值 `1330亿美元`，两处标签在原文中各自明确区分，并未共用同一标签。
- `缺的信息`：无。

#### 例 4 —— 两个供应商给同一个对象的评分
- `族`：族 2。
- `依据`：族 2 主定义句从句 `"two numbers share a label but differ in definition, population or aggregation level"` 及族 2 第一条已登记判据 `"The label these two numbers share — is it defined differently in each of their own sources? If yes, the gap between them is a property of the two definitions, not of the subject, and no number between them means anything"`（同一 USDT 评分标签下，一个测 `authority_control`，另一个测 `tradability`）。
- `缺的信息`：无。

#### 例 5 —— Trainium3 相对 GB300 的 TCO
- `族`：若看产地 A 与产地 B 之间（`约30%的TCO` vs `30%~40% 的 TCO 下降`）归 **族 8**；若仅看产地 A 内部（`单颗芯片` 内存带宽比 61% vs 未注明分母的 `30%的TCO`），则因缺少换算量而被族 8 前置问阻断。
- `依据`：族 8 主定义句从句 `"A claim is stated in one normalisation (per unit, per GB, incremental) while its evidence is computed in another (total, per stack, total over base)"`（产地 B 表述为 `incremental` 即 `30%~40% 的 TCO 下降`，换算为 `total over base` 应为原 TCO 的 60%~70%，而产地 A 将其写成了 `total over base` 口径的 `以约30%的TCO`；同时产地 A 内部用 `per unit` 即 `单颗芯片的内存带宽` 4.9 vs 8.0 TB/s 去对齐未标明是单芯片还是整机架/系统的 TCO）。
- `缺的信息`：产地 A 中 `约30%的TCO` 的分母（单颗芯片、整机架还是单位算力）及双方单颗芯片/整机架的绝对 TCO 数值（缺此量则无法在产地 A 内部把单芯片带宽与系统 TCO 换算到同一分母，还会怀疑产地 A 把产地 B 的「下降 30%」误写成了「占 30%」）。

#### 例 6 ——「每 GW 每年」的收入水平
- `族`：出表（被族 2 的 `"differ in definition, population or aggregation level"` 从句、族 3 的 `"wearing the costume of factual disagreement"` 从句、以及族 7 的 `"the ceiling is missing, in different units, or in the same units but measured for a different purpose"` 从句共同挡住）。
- `依据`：两数（`300 亿美元~400 亿美元` 与 `超过 1000 亿美元`）衡量的是同一建构、同一单位（`每 GW 每年` API 推理收入）、同一目的，且原文已明示二者分别是 `在较现实的运行假设下` 与 `在更激进的上沿情景中（高利用率、高价值 API 场景）` 的情景测算差异，并非伪装成事实分歧的方法分歧（挡在族 3 外），也非缺失上限或单位不同（挡在族 7 外）。
- `缺的信息`：无。

#### 例 7 ——「推理占比」
- `族`：族 2。
- `依据`：族 2 主定义句从句 `"two numbers share a label but differ in definition, population or aggregation level"`（同一「推理占比」概念下，IDC 2024–2025 年口径的总体是 `GenAI IaaS 市场`，IDC 2026–2027 年口径的定义变成了 `全球推理算力负载比例`，而 Gartner 2026 年口径的定义与总体则是 `全球 AI IaaS 支出` 中推理支出占训练+推理支出的比例）。
- `缺的信息`：IDC 2024–2025 年 `GenAI IaaS 市场` 的计量单位（是按收入/支出还是按算力消耗）以及 Gartner `AI IaaS 支出` 中除训练（190 亿美元）和推理（233 亿美元）外是否还包含其他分项。

#### 例 8 —— SEMI 的「300mm 晶圆厂设备支出」
- `族`：出表（被族 3 的 `"different instrument. The spread is a property of the vendor pair"` 从句和族 2 的 `"defined differently in each of their own sources"` 判据挡住）。
- `依据`：产地 A 与产地 B 引用的不是两个不同供应商/测量工具（非 `vendor pair`），而是**同一信源（SEMI）**对**同一建构（全球 300mm 晶圆厂设备支出）**的预测，因此被族 3 的 `"different instrument"` 从句挡住；同时产地 A 同篇显示 2026 年「全球半导体制造设备总销售额」仅 1450 亿美元，而产地 B 却称「今年 300 毫米晶圆厂设备支出（总销售额的子集）」达 1490 亿美元，属于转引年份错位、不同期预测修正或信源转述讹误，而非表内八族定义的测量失效。
- `缺的信息`：产地 B 中「今年」所指的具体公历年份，以及产地 A 与产地 B 各自所引 SEMI 报告的发布时间与原始英文报表数值（引文本身可疑：2026 年 300mm 分项支出 1490 亿美元不可能大于同年全口径半导体制造设备总销售额 1450 亿美元）。

#### 例 9 ——「库存天数」
- `族`：族 2。
- `依据`：族 2 主定义句从句 `"two numbers share a label but differ in definition, population or aggregation level"`（第一段 TXN 的 75 天明确限定为聚合层级更窄的 `成品库存` 天数，而第二段 MCHP 的 175 天、ON 的 189 天使用的是未限定仅成品的 `库存天数` 总口径，将不同聚合层级/定义的库存天数放在同一篇相邻段落中并列比较）。
- `缺的信息`：第一段中「行业平均 39 天」与「恩智浦（NXPI）43 天」以及第二段中 MCHP（175 天）、ON（189 天）各自的具体会计口径（是仅计成品库存，还是包含原材料与在产品的总库存，以及是否含渠道库存）。

---

### 第二部分：最可能出错的一类实例及原因

如果上面九条里有一条以上是错的，最可能错在**「表面看似族 2 / 族 3 / 族 8，但因原文缺少底层口径定义或换算量而在『归入该族』与『判为出表』之间摇摆」的二手财经/研报转引类实例（即例 1、例 5、例 8）**上。

原因是：
1. **转引截断掩盖了分歧的真实层级**：这张表的族 2（同建构名、不同定义/总体/聚合层级）、族 3（同建构、不同测量工具/供应商对）与出表（同建构下的不同情景假设，或单纯的二手转述讹误/年份错位）之间的边界，高度依赖**信源原始定义是否一致**。而在例 1、例 5、例 8 这类媒体/券商二手摘录中，原始分母、年份和边界条件已被摘录者裁掉。
2. **「被前置问或主定义从句阻断而出表」与「直接按表观结构归族」存在判准张力**：例如例 2 和例 5 都有典型的族 8（分母错配）表观特征，但一旦严格执行族 8 的前置问（「把主张和证据换到同一分母所需的那个量，在记录里吗？」），记录里没给换算量就会把它们从族 8 阻断出去，迫使判读者要么退回族 7 / 族 2，要么只在残存可换算的子句（如例 5 的「下降 30%」vs「占 30%」）上判族 8。同理，例 1 若把「是否含 Agentic CPU 乐观增量」视为口径定义差异就是族 2，若视为同一 TAM 定义下的情景假设差异就会像例 6 一样出表。
