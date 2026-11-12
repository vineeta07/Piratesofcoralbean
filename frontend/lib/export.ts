/**
 * Client-side report exports. Both libraries are loaded on demand so they
 * don't weigh down the first page load.
 */
import type { Analysis } from './analysis';
import type { Deal } from './types';

const C = {
  ink: '1B2433',
  ink2: '4A5363',
  ink3: '7A8190',
  paper: 'F6F2EA',
  surface: 'FFFDF8',
  line: 'E2DACB',
  coral: 'C8553D',
  red: 'B03A2E',
  amber: 'A86B12',
  green: '3B7A4A',
};

const RISK_LABEL: Record<string, string> = { red: 'At risk', amber: 'Watch', green: 'On course' };
const RISK_HEX: Record<string, string> = { red: C.red, amber: C.amber, green: C.green };

const money = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);

const cleanReason = (r: string) => r.replace(/^\([+-]\d+\)\s*/, '');

const sorted = (deals: Deal[]) => {
  const order: Record<string, number> = { red: 0, amber: 1, green: 2 };
  return [...deals].sort((a, b) => (order[a.risk_level] ?? 1) - (order[b.risk_level] ?? 1) || b.value - a.value);
};

const fileStem = (a: Analysis) => {
  const date = new Date(a.at).toISOString().slice(0, 10);
  const slug = a.query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'analysis';
  return `dealcortex-${date}-${slug}`;
};

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(0, 2), 16),
  parseInt(hex.slice(2, 4), 16),
  parseInt(hex.slice(4, 6), 16),
];

/* ───────────────────────────── PDF ───────────────────────────── */

export async function downloadPdf(a: Analysis) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const contentW = W - M * 2;
  let y = 0;

  const setColor = (hex: string) => doc.setTextColor(...hexToRgb(hex));
  const footer = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setColor(C.ink3);
    doc.text('DealCortex · Pipeline Intelligence', M, H - 24);
    doc.text(`Page ${doc.getNumberOfPages()}`, W - M, H - 24, { align: 'right' });
  };
  const ensure = (needed: number) => {
    if (y + needed > H - 56) {
      footer();
      doc.addPage();
      y = M;
    }
  };

  // Header band
  doc.setFillColor(...hexToRgb(C.ink));
  doc.rect(0, 0, W, 112, 'F');
  doc.setFillColor(...hexToRgb(C.coral));
  doc.rect(0, 112, W, 4, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  setColor(C.paper);
  doc.text('Pipeline risk report', M, 56);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`“${a.query}”`, M, 78, { maxWidth: contentW });
  doc.setFontSize(9);
  setColor('B5B0A5');
  doc.text(new Date(a.at).toLocaleString(), M, 96);

  // Summary boxes
  y = 144;
  const s = a.result.dashboard.summary;
  const deals = sorted(a.result.dashboard.deals);
  const totalValue = deals.reduce((t, d) => t + (d.value || 0), 0);
  const atRiskValue = deals.filter((d) => d.risk_level === 'red').reduce((t, d) => t + (d.value || 0), 0);
  const boxes = [
    { label: 'DEALS', value: String(s.total_deals), color: C.ink },
    { label: 'AT RISK', value: String(s.red_count), color: C.red },
    { label: 'WATCH', value: String(s.amber_count), color: C.amber },
    { label: 'ON COURSE', value: String(s.green_count), color: C.green },
  ];
  const bw = (contentW - 3 * 10) / 4;
  boxes.forEach((b, i) => {
    const x = M + i * (bw + 10);
    doc.setDrawColor(...hexToRgb(C.line));
    doc.setFillColor(...hexToRgb(C.surface));
    doc.roundedRect(x, y, bw, 58, 4, 4, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setColor(C.ink3);
    doc.text(b.label, x + 12, y + 18);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    setColor(b.color);
    doc.text(b.value, x + 12, y + 44);
  });
  y += 80;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setColor(C.ink2);
  doc.text(
    `Pipeline value ${money(totalValue)} · ${money(atRiskValue)} sits in deals marked at risk.`,
    M,
    y,
  );
  y += 28;

  // Deals
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  setColor(C.ink);
  doc.text('Deals, highest risk first', M, y);
  y += 16;

  deals.forEach((d) => {
    const narrative = doc.splitTextToSize(d.narrative || '', contentW - 16);
    const action = doc.splitTextToSize(`Next: ${d.action || ''}`, contentW - 16);
    const reasons = (d.all_reasons || []).slice(0, 4).map(cleanReason);
    const reasonLines = reasons.flatMap((r) => doc.splitTextToSize(`• ${r}`, contentW - 24));
    const blockH = 50 + narrative.length * 12 + action.length * 12 + reasonLines.length * 11 + 18;
    ensure(blockH);

    const top = y;
    doc.setFillColor(...hexToRgb(RISK_HEX[d.risk_level] || C.amber));
    doc.rect(M, top + 6, 3, blockH - 14, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    setColor(C.ink);
    doc.text(d.deal_name, M + 14, top + 22);
    doc.text(money(d.value), W - M, top + 22, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setColor(RISK_HEX[d.risk_level] || C.amber);
    doc.text(`${(RISK_LABEL[d.risk_level] || 'Watch').toUpperCase()} · ${d.score}/100`, M + 14, top + 36);
    setColor(C.ink3);
    const meta = [d.champion && `Champion ${d.champion}`, d.close_date && `Close ${d.close_date}`].filter(Boolean).join('   ');
    doc.text(meta, W - M, top + 36, { align: 'right' });

    let yy = top + 54;
    doc.setFontSize(9.5);
    setColor(C.ink2);
    doc.text(narrative, M + 14, yy);
    yy += narrative.length * 12 + 4;

    if (reasonLines.length) {
      doc.setFontSize(8.5);
      setColor(C.ink3);
      doc.text(reasonLines, M + 18, yy);
      yy += reasonLines.length * 11 + 4;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    setColor(C.coral);
    doc.text(action, M + 14, yy);

    y = top + blockH;
    doc.setDrawColor(...hexToRgb(C.line));
    doc.line(M, y - 4, W - M, y - 4);
    y += 6;
  });

  if (!deals.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setColor(C.ink3);
    doc.text('No deals matched this question.', M, y + 10);
  }

  footer();
  doc.save(`${fileStem(a)}.pdf`);
}

/* ───────────────────────────── PPTX ───────────────────────────── */

export async function downloadPptx(a: Analysis) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
  pptx.title = 'Pipeline risk report';
  pptx.company = 'DealCortex';

  const deals = sorted(a.result.dashboard.deals);
  const s = a.result.dashboard.summary;
  const serif = 'Georgia';
  const sans = 'Arial';

  pptx.defineSlideMaster({
    title: 'CB',
    background: { color: C.paper },
    objects: [
      { rect: { x: 0, y: 7.1, w: 13.33, h: 0.4, fill: { color: C.paper } } },
      { text: { text: 'DealCortex · Pipeline Intelligence', options: { x: 0.6, y: 7.05, w: 6, h: 0.3, fontFace: sans, fontSize: 9, color: C.ink3 } } },
    ],
    slideNumber: { x: 12.3, y: 7.05, w: 0.5, h: 0.3, fontFace: sans, fontSize: 9, color: C.ink3, align: 'right' },
  });

  // 1 — Title
  const t = pptx.addSlide();
  t.background = { color: C.ink };
  t.addShape(pptx.ShapeType.rect, { x: 0, y: 5.6, w: 13.33, h: 0.08, fill: { color: C.coral }, line: { color: C.coral } });
  t.addText('PIPELINE RISK REPORT', { x: 0.8, y: 1.4, w: 11, h: 0.4, fontFace: sans, fontSize: 12, color: C.coral, charSpacing: 4, bold: true });
  t.addText(a.query, { x: 0.8, y: 2.0, w: 11.5, h: 2.0, fontFace: serif, fontSize: 40, color: C.paper, valign: 'top' });
  t.addText(new Date(a.at).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }), {
    x: 0.8, y: 6.0, w: 8, h: 0.4, fontFace: sans, fontSize: 14, color: 'B5B0A5',
  });

  // 2 — Summary
  const sum = pptx.addSlide({ masterName: 'CB' });
  sum.addText('Where the pipeline stands', { x: 0.6, y: 0.5, w: 12, h: 0.8, fontFace: serif, fontSize: 30, color: C.ink });
  const stats = [
    { label: 'Deals', value: s.total_deals, color: C.ink },
    { label: 'At risk', value: s.red_count, color: C.red },
    { label: 'Watch', value: s.amber_count, color: C.amber },
    { label: 'On course', value: s.green_count, color: C.green },
  ];
  stats.forEach((st, i) => {
    const x = 0.6 + i * 3.08;
    sum.addShape(pptx.ShapeType.rect, { x, y: 1.6, w: 2.85, h: 1.7, fill: { color: C.surface }, line: { color: C.line, width: 1 } });
    sum.addText(st.label.toUpperCase(), { x: x + 0.25, y: 1.75, w: 2.4, h: 0.35, fontFace: sans, fontSize: 11, color: C.ink3, charSpacing: 2 });
    sum.addText(String(st.value), { x: x + 0.25, y: 2.15, w: 2.4, h: 1, fontFace: serif, fontSize: 48, color: st.color, bold: true });
  });
  if (deals.length) {
    const top = deals.slice(0, 8);
    sum.addChart(
      pptx.ChartType.bar,
      [{ name: 'Health score', labels: top.map((d) => d.deal_name), values: top.map((d) => d.score) }],
      {
        x: 0.6, y: 3.6, w: 12.1, h: 3.3,
        barDir: 'bar',
        chartColors: top.map((d) => RISK_HEX[d.risk_level] || C.amber),
        catAxisLabelColor: C.ink2, catAxisLabelFontFace: sans, catAxisLabelFontSize: 11, catAxisOrientation: 'maxMin',
        valAxisMinVal: 0, valAxisMaxVal: 100, valAxisLabelColor: C.ink3, valAxisLabelFontSize: 9,
        valGridLine: { color: C.line, size: 0.5 }, catGridLine: { style: 'none' },
        showValue: true, dataLabelColor: C.ink, dataLabelFontSize: 10, dataLabelPosition: 'outEnd',
        showLegend: false,
      } as any,
    );
  }

  // 3..n — one slide per deal (top 10)
  deals.slice(0, 10).forEach((d) => {
    const sl = pptx.addSlide({ masterName: 'CB' });
    const color = RISK_HEX[d.risk_level] || C.amber;
    sl.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.1, fill: { color }, line: { color } });
    sl.addText(`${(RISK_LABEL[d.risk_level] || 'Watch').toUpperCase()} · ${d.score}/100`, {
      x: 0.6, y: 0.45, w: 8, h: 0.35, fontFace: sans, fontSize: 12, bold: true, color, charSpacing: 2,
    });
    sl.addText(d.deal_name, { x: 0.6, y: 0.85, w: 9, h: 0.9, fontFace: serif, fontSize: 32, color: C.ink });
    sl.addText(money(d.value), { x: 9.5, y: 0.85, w: 3.2, h: 0.9, fontFace: serif, fontSize: 28, color: C.ink, align: 'right' });
    const meta = [d.champion && `Champion: ${d.champion}`, d.economic_buyer && `Economic buyer: ${d.economic_buyer}`, d.close_date && `Close: ${d.close_date}`]
      .filter(Boolean)
      .join('     ');
    sl.addText(meta, { x: 0.6, y: 1.75, w: 12, h: 0.35, fontFace: sans, fontSize: 12, color: C.ink3 });

    sl.addText(d.narrative || '', { x: 0.6, y: 2.35, w: 6.6, h: 2.2, fontFace: sans, fontSize: 16, color: C.ink2, valign: 'top' });

    const reasons = (d.all_reasons || []).slice(0, 6).map(cleanReason);
    sl.addShape(pptx.ShapeType.rect, { x: 7.6, y: 2.35, w: 5.1, h: 3.1, fill: { color: C.surface }, line: { color: C.line, width: 1 } });
    sl.addText('SIGNALS', { x: 7.85, y: 2.5, w: 4.6, h: 0.3, fontFace: sans, fontSize: 10, color: C.ink3, charSpacing: 2 });
    sl.addText(
      reasons.length ? reasons.map((r) => ({ text: r, options: { bullet: true, breakLine: true } })) : 'No individual signals returned.',
      { x: 7.85, y: 2.85, w: 4.6, h: 2.5, fontFace: sans, fontSize: 12, color: C.ink2, valign: 'top', paraSpaceAfter: 6 },
    );

    sl.addShape(pptx.ShapeType.rect, { x: 0.6, y: 5.75, w: 12.1, h: 0.95, fill: { color: C.ink }, line: { color: C.ink } });
    sl.addText([
      { text: 'Next step  ', options: { bold: true, color: C.coral } },
      { text: d.action || 'Monitor deal health', options: { color: C.paper } },
    ], { x: 0.85, y: 5.75, w: 11.6, h: 0.95, fontFace: sans, fontSize: 16, valign: 'middle' });
  });

  // Last — action list
  if (deals.length) {
    const act = pptx.addSlide({ masterName: 'CB' });
    act.addText('This week’s actions', { x: 0.6, y: 0.5, w: 12, h: 0.8, fontFace: serif, fontSize: 30, color: C.ink });
    const rows = deals.slice(0, 10).map((d) => [
      { text: d.deal_name, options: { bold: true, color: C.ink } },
      { text: RISK_LABEL[d.risk_level] || 'Watch', options: { color: RISK_HEX[d.risk_level] || C.amber, bold: true } },
      { text: d.action || '', options: { color: C.ink2 } },
    ]);
    act.addTable(
      [
        [
          { text: 'DEAL', options: { color: C.ink3, fontSize: 10 } },
          { text: 'STATUS', options: { color: C.ink3, fontSize: 10 } },
          { text: 'NEXT STEP', options: { color: C.ink3, fontSize: 10 } },
        ],
        ...rows,
      ] as any,
      { x: 0.6, y: 1.5, w: 12.1, colW: [3.2, 1.5, 7.4], fontFace: sans, fontSize: 12, border: { type: 'solid', color: C.line, pt: 0.75 }, fill: { color: C.surface }, margin: 0.08 } as any,
    );
  }

  await pptx.writeFile({ fileName: `${fileStem(a)}.pptx` });
}

/* ───────────────────────────── JSON ───────────────────────────── */

export function downloadJson(a: Analysis) {
  const blob = new Blob([JSON.stringify(a.result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileStem(a)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
