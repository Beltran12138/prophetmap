你的任务是给一张已有的「测量失效族表」做**逐例归族**。这是一道归类题，不是意见征集。

## 这张表的八个族（主定义句，逐字引自权威源，英文原文不翻译）

**1. Absence disguised as data** — A source returns a number when it means *"I could not measure this."* Downstream, the difference is invisible: `0` and `unknown` have the same shape.

**2. Same name, different construct** — A label is read as answering one question while the number answers another: two numbers share a label but differ in definition, population or aggregation level; or one number's name claims a construct it does not measure. Averaging them is a category error, not a compromise.

**3. Method disagreement wearing the costume of factual disagreement** — Same construct, different instrument. The spread is a property of the vendor pair, not of the subject.

**4. Availability skew** — Which subjects have data — or which subjects the analysis keeps — is itself correlated with the answer. A threshold sweep cannot see this, because it only looks at the rows that have values.

**5. Self-reference** — The measurement is partly derived from the thing being measured.

**6. The measurement changes the behaviour** — Instrumenting an agent is not free. A field added to observe a decision can alter the decision.

**7. The ceiling and the result are in different units** — A performance number means nothing alone. It means something against the best achievable — a human ceiling, a baseline, a published rate. This family is what happens when a result is reported without a reference point it can be subtracted from: **the ceiling is missing, in different units, or in the same units but measured for a different purpose**. In its founding form both are reported and neither can be subtracted from the other; it has the shape of full disclosure and does none of the work.

**8. Denominator mismatch** — A claim is stated in one normalisation (per unit, per GB, incremental) while its evidence is computed in another (total, per stack, total over base). The ratio reflects the choice of denominator, not the subject. Unlike family 7, the two can be converted to a common denominator; they simply were not, and converting changes the conclusion.

### 族 2 名下已登记的两条判据（逐字）

> **The label these two numbers share — is it defined differently in each of their own sources?** If yes, the gap between them is a property of the two definitions, not of the subject, and no number between them means anything.

> **Can this score move while the capability its name describes stays fixed — or stay fixed while the capability moves?**

### 族 8 名下已登记的一条前置问（逐字，中文原文）

> 问族 8 之前先问「把主张和证据换到同一分母所需的那个量，在记录里吗？」**不在 ⇒ 族 8 的『can be converted』从句被阻断，不得归族 8。**

---

## 实例（九条，全部为逐字引文；来源已注明产地，不注明我方任何判断）

### 例 1 ——「2030 年服务器 CPU 市场规模」
产地 A（一篇台系媒体的产业分析）逐字：
> 全球资料中心与服务器CPU市场至2030年可望扩大至1,000亿至1,500亿美元规模，若Agentic AI渗透速度加快、AI基础设施投资持续扩张，同步带动CPU配比与单机价值提升，亦不排除市场规模将于2030年后突破2,000亿美元。

产地 B（一篇对 AMD 法说会的解读）逐字：
> 管理层把服务器需求拆成三块——传统云与企业、Agentic CPU、头节点CPU，TAM未来三四年约50%的CAGR、到2030年约2200亿美元（符合市场主流预期2000-2200亿）

### 例 2 —— NeuronLink 与 EFA 的带宽比
同一篇文章同一段内，逐字连续：
> 如果将NeuronLink与EFA进行比较，NeuronLink的带宽约为EFA的1.65倍。All-to-All是一个特殊情况：只有机架内NeuronLink支持128个Rank的All-to-All操作，而EFA仅支持由64个双Rank通信组构成的有限规模All-to-All操作。机架内NeuronLink的最高带宽能够达到31 GB/s，而跨机架非对等EFA的最高带宽仅为8 GB/s。

### 例 3 ——「1330 亿美元」这个数值本身
同一篇文章，相邻两段，逐字：
> SEMI预计，全球半导体制造设备销售额将从2025年的1330亿美元增长到2026年的1450亿美元，并在2027年达到1560亿美元的历史新高。

> 而且SEMI还预计，全球300mm晶圆厂设备支出将在2026年增长18%至1330亿美元，2027年再增长14%至 1510亿美元

### 例 4 —— 两个供应商给同一个对象的评分
一份评分系统的记录，逐字（英文原文）：
> On USDT, one vendor scores **69** and another **1** — a 68-point gap in which *both are correct*. The first measures how much power the issuer's contract grants (`authority_control`); the second measures whether the token can currently be traded (`tradability`). There is no number between them that means anything.

### 例 5 —— Trainium3 相对 GB300 的 TCO
产地 A（一篇芯片深度分析）逐字：
> Trainium3单颗芯片的内存带宽为4.9 TB/s，而GB300为8.0 TB/s。这意味着，Trainium3能够以约30%的TCO，实现GB300约61%的内存带宽。

产地 B（另一篇券商式解读）逐字：
> 相关资料显示，谷歌 TPU v7/AWS Trainium3 相对英伟达 GB200/GB300 可实现 30%~40% 的 TCO 下降，部分内部场景甚至更多。

### 例 6 ——「每 GW 每年」的收入水平
同一篇文章同一段内，逐字连续：
> 行业测算显示，在较现实的运行假设下，头部模型厂商通过 API 推理业务可达到每 GW 每年 300 亿美元~400 亿美元的收入水平；在更激进的上沿情景中，OpenAI、Anthropic、以及微软在高利用率、高价值 API 场景下，市场相信可实现每 GW 每年超过 1000 亿美元收入。

### 例 7 ——「推理占比」
同一篇文章内，两处逐字：
> 根据 IDC 数据，2024 年 GenAI IaaS 市场中训练占 76%、推理仅 24%，2025 年推理占比超过 50%；…… IDC 预测，2026 年全球推理算力负载比例约 2/3，到 2027 年推理算力将占据 70% 以上

> Gartner 预测，2026 年全球 AI IaaS 支出中，推理部分的规模将达到 233 亿美元，首次超过训练支出的 190 亿美元。

### 例 8 —— SEMI 的「300mm 晶圆厂设备支出」
产地 A 逐字：
> 全球300mm晶圆厂设备支出将在2026年增长18%至1330亿美元

产地 B（另一篇，报道 SEMICON West）逐字：
> 在SEMI市场研讨会上，该协会预测，今年300毫米晶圆厂设备的支出将达到1490亿美元，到2029年将增至2270亿美元

产地 A 同篇另一句逐字：
> 全球半导体制造设备销售额将从2025年的1330亿美元增长到2026年的1450亿美元

### 例 9 ——「库存天数」
同一篇文章相邻两段，逐字：
> TXN 成品库存 75 天，高于行业平均 39 天，也高于恩智浦（NXPI）的 43 天。

> MCHP 继续执行九点计划，库存天数环比下降 9 天至 175 天；ON 库存天数环比下降 11 天至 189 天，产量仍为销售的约 100%。

---

## 你要回答的

**第一部分（逐例，九条都要答，每条三行即可）**
- `族`：属于第几族；若不属于任何一族，写「出表」，并说明是因为哪一族的哪个从句把它挡住了。
- `依据`：你所判那一族主定义句里**具体哪一个从句**命中了它（引到从句，不要只写族号）。
- `缺的信息`：如果不拿到原文没给的某个量就无法判，写出缺的那个量是什么；不缺就写「无」。

**第二部分（一问）**
如果你上面这九条里**有一条以上是错的**，最可能错在哪一类实例上，为什么？

⛔ 不要评论这张表的某一族定义该放宽还是该收紧。
⛔ 不要给这九条排名或打分。
⛔ 只用上面给出的逐字引文判断；如果你认为某条引文本身可疑，写进「缺的信息」。
