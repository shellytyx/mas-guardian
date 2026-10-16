# 守护 · sJIA+MAS 动态预警平台（家长端）

面向 sJIA 患者家属的 MAS 动态预警 Web 应用。移动优先，可直接部署为 H5/小程序 WebView。

## 启动

```bash
npm install
npm run dev        # 默认 5173，已开 host:true，可用局域网 IP 手机访问
npm run build      # 产物在 dist/，静态托管即可
```

## 目录

```
src/
├── types.ts              指标元数据（单位/参考区间/坏方向）、数据类型
├── data/mock.ts          演示数据：7 次化验 + 6 天体温（2026-08-20 → 10-15）
├── lib/
│   ├── engine.ts         风险引擎：2016 标准 / MS 评分 / delta 规则 / 比值 / 发热
│   ├── evidence.ts       规则 → 文献引用映射（知识库接口）
│   ├── api.ts            ★ 数据接入层（唯一需要改的文件）
│   └── store.tsx         全局状态 + 路由
├── components/           RiskBar / TrendBadge / SparkCard / EChart / 底部导航 / 模拟化验单
└── pages/                Home / Capture(拍照) / Entry(补录) / Detail(时间线) / Alert(预警详情)
```

## 接入真实数据

只需改 `src/lib/api.ts`，其余代码不动。实现 `ApiClient` 五个方法即可：

| 方法 | 对应接口 |
|---|---|
| `getPatient()` | GET /patients/:id |
| `getVisits()` | GET /patients/:id/labs |
| `getChecks()` | GET /patients/:id/checks |
| `saveVisit(v)` | POST /patients/:id/labs |
| `saveCheck(c)` | POST /patients/:id/checks |

- 换成 `fetch('https://api...')` 后删除 localStorage 逻辑即可
- OCR 已接入真实 Tesseract.js（`chi_sim+eng`），首次使用需下载语言包
- OCR 解析器在 `src/lib/ocrParser.ts`，支持中英文化验单，自动转换单位（FIB mg/dL→g/L、TG mg/dL→mmol/L）
- 风险计算目前在前端 `engine.ts`；若后端出评分，把 `computeRisk` 换成接口调用即可（返回结构见 `types.ts` 的 `RiskResult`）

## 设计原则（评审/开发对照）

1. **引擎只认客观数据**：检验值、体温、照片。主观描述只进灰色备注，代码上不接触风险计算
2. **不强制打卡**：提醒可关闭，无连续记录天数等催促设计
3. **图表按指标真实方向绘制**，恶化与否由泳道标题旁的方向徽章表达
4. **风险条独立于图表**：顶部绿→黄→橙→红渐变条为唯一结论
5. **防呆**：主观感觉良好 + 客观恶化时显示定向提示；数量级输错弹确认

## 演示路径（Demo Script）

1. 首页：红色风险条 + 三张趋势卡（铁蛋白↗29%、血小板↘29%）
2. 点"详情" → 预警详情：2016 标准/MS 评分逐条白话解释，点"查看依据"出示文献原文
3. 底部"数据" → 7 条泳道时间线，阈值虚线（181/48/684/3.6），发热期背景
4. 底部"＋" → 拍化验单 → 识别 10 项（1 项低置信标 ?）→ 一键保存
5. 保存后首页实时变化：铁蛋白 3100 ↗27%，"主观感觉良好+客观恶化"提示出现
6. 手动补录向导：单数字流、上次值预填、"本次未测，跳过"
