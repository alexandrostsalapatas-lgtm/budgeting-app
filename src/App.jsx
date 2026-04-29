import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "budgeting-app-data-v1";
const EURO = new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" });

const VAT_RATES = [
  { value: "manual", en: "Manual", el: "Χειροκίνητα" },
  { value: "24", en: "24% standard", el: "24% κανονικός" },
  { value: "13", en: "13% reduced", el: "13% μειωμένος" },
  { value: "6", en: "6% super-reduced", el: "6% υπερμειωμένος" },
  { value: "0", en: "0% zero / exempt", el: "0% μηδενικός / απαλλαγή" },
  { value: "17", en: "17% island standard", el: "17% κανονικός νησιών" },
  { value: "9", en: "9% island reduced", el: "9% μειωμένος νησιών" },
  { value: "4", en: "4% island super-reduced", el: "4% υπερμειωμένος νησιών" },
];

const TEXT = {
  en: {
    app: "Budgeting Dashboard",
    subtitle: "Income, expenses, VAT, reports, and category tracking in one clean app.",
    income: "Income",
    expenses: "Expenses",
    balance: "Balance",
    add: "+ Add",
    addRecord: "Add record",
    deleteTab: "Delete tab",
    amountNoVat: "Amount without VAT",
    vatRate: "VAT rate",
    vatAmount: "VAT amount",
    description: "Description",
    date: "Date",
    totalWithVat: "Total incl. VAT",
    noRecords: "No records yet.",
    settings: "Settings",
    language: "Language",
    background: "Background",
    white: "White",
    grey: "Grey",
    black: "Black",
    accent: "Accent color",
    report: "Generate Report",
    month: "Report month",
    pdf: "PDF",
    jpeg: "JPEG",
    excel: "Excel",
    word: "Word",
    newCategory: "New category",
    categoryName: "Category name",
    cancel: "Cancel",
    create: "Create",
    expensePicture: "Expense picture",
    incomeVsExpenses: "Income vs expenses",
    incomeNoVat: "Income without VAT",
    expenseNoVat: "Expense without VAT",
    incomeVat: "Income VAT",
    expenseVat: "Expense VAT",
    googleDrive: "Google Drive",
    driveNote: "Google Drive sync needs OAuth setup. Local save is active now.",
  },
  el: {
    app: "Πίνακας Προϋπολογισμού",
    subtitle: "Έσοδα, έξοδα, ΦΠΑ, αναφορές και κατηγορίες σε μία καθαρή εφαρμογή.",
    income: "Έσοδα",
    expenses: "Έξοδα",
    balance: "Υπόλοιπο",
    add: "+ Προσθήκη",
    addRecord: "Προσθήκη εγγραφής",
    deleteTab: "Διαγραφή καρτέλας",
    amountNoVat: "Ποσό χωρίς ΦΠΑ",
    vatRate: "Συντελεστής ΦΠΑ",
    vatAmount: "Ποσό ΦΠΑ",
    description: "Περιγραφή",
    date: "Ημερομηνία",
    totalWithVat: "Σύνολο με ΦΠΑ",
    noRecords: "Δεν υπάρχουν εγγραφές ακόμη.",
    settings: "Ρυθμίσεις",
    language: "Γλώσσα",
    background: "Φόντο",
    white: "Λευκό",
    grey: "Γκρι",
    black: "Μαύρο",
    accent: "Χρώμα έμφασης",
    report: "Δημιουργία Αναφοράς",
    month: "Μήνας αναφοράς",
    pdf: "PDF",
    jpeg: "JPEG",
    excel: "Excel",
    word: "Word",
    newCategory: "Νέα κατηγορία",
    categoryName: "Όνομα κατηγορίας",
    cancel: "Άκυρο",
    create: "Δημιουργία",
    expensePicture: "Εικόνα εξόδων",
    incomeVsExpenses: "Έσοδα έναντι εξόδων",
    incomeNoVat: "Έσοδα χωρίς ΦΠΑ",
    expenseNoVat: "Έξοδα χωρίς ΦΠΑ",
    incomeVat: "ΦΠΑ εσόδων",
    expenseVat: "ΦΠΑ εξόδων",
    googleDrive: "Google Drive",
    driveNote: "Το Google Drive sync θέλει OAuth setup. Η τοπική αποθήκευση είναι ήδη ενεργή.",
  },
};

const ACCENTS = {
  blue: "#2563eb",
  emerald: "#059669",
  purple: "#7c3aed",
  amber: "#f59e0b",
  rose: "#e11d48",
};

const CHART_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#ea580c"];

const initialData = {
  income: {
    Salary: [{ id: id(), amount: 1800, vat: 0, vatRate: "0", description: "Monthly salary", date: today() }],
    Freelance: [],
  },
  expenses: {
    Rent: [{ id: id(), amount: 650, vat: 0, vatRate: "0", description: "Apartment rent", date: today() }],
    Utilities: [],
    Food: [],
  },
};

function id() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthNow() {
  return new Date().toISOString().slice(0, 7);
}

function money(value) {
  return EURO.format(Number(value || 0));
}

function vatFor(amount, rate) {
  if (rate === "manual") return null;
  return Math.round(Number(amount || 0) * Number(rate || 0)) / 100;
}

function sumRows(rows, includeVat = true) {
  return rows.reduce((sum, row) => sum + Number(row.amount || 0) + (includeVat ? Number(row.vat || 0) : 0), 0);
}

function totals(data) {
  const income = Object.values(data.income).flat();
  const expenses = Object.values(data.expenses).flat();
  const incomeTotal = sumRows(income);
  const expenseTotal = sumRows(expenses);
  const incomeNoVat = sumRows(income, false);
  const expensesNoVat = sumRows(expenses, false);
  return {
    income: incomeTotal,
    expenses: expenseTotal,
    balance: incomeTotal - expenseTotal,
    incomeNoVat,
    expensesNoVat,
    incomeVat: incomeTotal - incomeNoVat,
    expenseVat: expenseTotal - expensesNoVat,
  };
}

function breakdown(section) {
  return Object.entries(section).map(([name, rows]) => ({ name, value: sumRows(rows), amount: sumRows(rows, false), vat: rows.reduce((s, r) => s + Number(r.vat || 0), 0) }));
}

function rowsForMonth(data, month) {
  const filter = (section) => Object.fromEntries(Object.entries(section).map(([key, rows]) => [key, rows.filter((r) => String(r.date || "").slice(0, 7) === month)]));
  return { income: filter(data.income), expenses: filter(data.expenses) };
}

function downloadFile(name, type, content) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 300);
}

function reportRows(data, text, month) {
  const filtered = rowsForMonth(data, month);
  const t = totals(filtered);
  return [
    [text.app],
    [text.month, month],
    [text.income, money(t.income)],
    [text.expenses, money(t.expenses)],
    [text.balance, money(t.balance)],
    [],
    [text.income, text.amountNoVat, text.vatAmount, text.totalWithVat],
    ...breakdown(filtered.income).map((x) => [x.name, money(x.amount), money(x.vat), money(x.value)]),
    [],
    [text.expenses, text.amountNoVat, text.vatAmount, text.totalWithVat],
    ...breakdown(filtered.expenses).map((x) => [x.name, money(x.amount), money(x.vat), money(x.value)]),
  ];
}

function safeCell(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function excelNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
}

function buildExcelReport(data, text, month) {
  const filtered = rowsForMonth(data, month);
  const t = totals(filtered);
  const incomeRows = Object.entries(filtered.income).flatMap(([category, rows]) => rows.map((row) => ({ section: text.income, category, ...row })));
  const expenseRows = Object.entries(filtered.expenses).flatMap(([category, rows]) => rows.map((row) => ({ section: text.expenses, category, ...row })));

  const summaryRows = [
    [text.income, excelNumber(t.income)],
    [text.expenses, excelNumber(t.expenses)],
    [text.balance, excelNumber(t.balance)],
    [text.incomeNoVat, excelNumber(t.incomeNoVat)],
    [text.expenseNoVat, excelNumber(t.expensesNoVat)],
    [text.incomeVat, excelNumber(t.incomeVat)],
    [text.expenseVat, excelNumber(t.expenseVat)],
  ];

  function recordRows(rows) {
    if (!rows.length) {
      return `<tr><td colspan="7" class="empty">${safeCell(text.noRecords)}</td></tr>`;
    }
    return rows.map((row) => {
      const amount = Number(row.amount || 0);
      const vat = Number(row.vat || 0);
      const total = amount + vat;
      return `<tr><td>${safeCell(row.date)}</td><td>${safeCell(row.category)}</td><td>${safeCell(row.description)}</td><td class="num">${excelNumber(amount)}</td><td class="num">${excelNumber(vat)}</td><td class="num">${safeCell(row.vatRate === "manual" ? text.manual : `${row.vatRate}%`)}</td><td class="num">${excelNumber(total)}</td></tr>`;
    }).join("");
  }

  const summaryHtml = summaryRows.map((row) => `<tr><td>${safeCell(row[0])}</td><td class="num">${safeCell(row[1])}</td></tr>`).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#111827}h1{font-size:24px;margin:0 0 6px}h2{font-size:18px;margin:22px 0 8px}.muted{color:#6b7280;margin-bottom:18px}table{border-collapse:collapse;width:100%;margin-bottom:18px}th{background:#1f2937;color:#fff;font-weight:700;text-align:left;border:1px solid #111827;padding:9px}td{border:1px solid #d1d5db;padding:8px;vertical-align:top}.summary th{background:#2563eb}.income th{background:#15803d}.expenses th{background:#b91c1c}.num{text-align:right;mso-number-format:"0.00"}.empty{text-align:center;color:#6b7280;background:#f9fafb}.section-title{background:#f3f4f6;font-weight:700}</style></head><body><h1>${safeCell(text.app)}</h1><div class="muted">${safeCell(text.month)}: ${safeCell(month)}</div><h2>${safeCell(text.balance)}</h2><table class="summary"><tr><th>${safeCell(text.description)}</th><th>${safeCell(text.amount)}</th></tr>${summaryHtml}</table><h2>${safeCell(text.income)}</h2><table class="income"><tr><th>${safeCell(text.date)}</th><th>${safeCell(text.categoryName)}</th><th>${safeCell(text.description)}</th><th>${safeCell(text.amountNoVat)}</th><th>${safeCell(text.vatAmount)}</th><th>${safeCell(text.vatRate)}</th><th>${safeCell(text.totalWithVat)}</th></tr>${recordRows(incomeRows)}</table><h2>${safeCell(text.expenses)}</h2><table class="expenses"><tr><th>${safeCell(text.date)}</th><th>${safeCell(text.categoryName)}</th><th>${safeCell(text.description)}</th><th>${safeCell(text.amountNoVat)}</th><th>${safeCell(text.vatAmount)}</th><th>${safeCell(text.vatRate)}</th><th>${safeCell(text.totalWithVat)}</th></tr>${recordRows(expenseRows)}</table></body></html>`;
}

function reportChartSvg(filtered, text) {
  const t = totals(filtered);
  const income = Number(t.income || 0);
  const expenses = Number(t.expenses || 0);
  const total = Math.max(income + expenses, 1);
  const cx = 120;
  const cy = 120;
  const r = 90;
  const inner = 52;
  let angle = -90;
  const pieces = [
    { label: text.income, value: income, color: "#16a34a" },
    { label: text.expenses, value: expenses, color: "#dc2626" },
  ].map((item) => {
    const start = angle;
    const end = angle + (item.value / total) * 360;
    angle = end;
    return { ...item, start, end };
  });
  const point = (deg, radius) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  };
  const path = (slice) => {
    const [x1, y1] = point(slice.start, r);
    const [x2, y2] = point(slice.end, r);
    const [x3, y3] = point(slice.end, inner);
    const [x4, y4] = point(slice.start, inner);
    const large = slice.end - slice.start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`;
  };
  return `<div class="chart-card"><h2>${text.incomeVsExpenses}</h2><div class="chart-row"><svg width="240" height="240" viewBox="0 0 240 240">${pieces.map((p) => `<path d="${path(p)}" fill="${p.color}"></path>`).join("")}<text x="120" y="112" text-anchor="middle" font-size="13" fill="#6b7280">${text.balance}</text><text x="120" y="136" text-anchor="middle" font-size="18" font-weight="700" fill="#111827">${money(t.balance)}</text></svg><div class="legend">${pieces.map((p) => `<div class="legend-row"><span><i style="background:${p.color}"></i>${p.label}</span><strong>${money(p.value)}</strong></div>`).join("")}</div></div></div>`;
}

function reportExpenseSvg(filtered, text) {
  const items = breakdown(filtered.expenses).filter((x) => x.value > 0);
  if (!items.length) return "";
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const cx = 120;
  const cy = 120;
  const r = 90;
  let angle = -90;
  const point = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const paths = items.map((item, index) => {
    const start = angle;
    const end = angle + (item.value / total) * 360;
    angle = end;
    const [x1, y1] = point(start);
    const [x2, y2] = point(end);
    const large = end - start > 180 ? 1 : 0;
    return { ...item, color: CHART_COLORS[index % CHART_COLORS.length], d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });
  return `<div class="chart-card"><h2>${text.expensePicture}</h2><div class="chart-row"><svg width="240" height="240" viewBox="0 0 240 240">${paths.map((p) => `<path d="${p.d}" fill="${p.color}"></path>`).join("")}</svg><div class="legend">${paths.map((p) => `<div class="legend-row"><span><i style="background:${p.color}"></i>${p.name}</span><strong>${money(p.value)}</strong></div>`).join("")}</div></div></div>`;
}

function reportHtml(rows, text, month, filtered) {
  const charts = reportChartSvg(filtered, text) + reportExpenseSvg(filtered, text);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${text.app} ${month}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111827;background:#fff}h1{margin-bottom:4px}.muted{color:#6b7280}.charts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px}.chart-card{border:1px solid #d1d5db;border-radius:18px;padding:18px;background:#f9fafb}.chart-card h2{margin:0 0 12px;font-size:18px}.chart-row{display:flex;gap:18px;align-items:center}.legend{flex:1}.legend-row{display:flex;justify-content:space-between;gap:10px;margin:8px 0;font-size:14px}.legend-row i{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:8px}table{border-collapse:collapse;width:100%;margin-top:22px}td{border:1px solid #d1d5db;padding:8px}tr:first-child td{font-size:22px;font-weight:700;background:#f3f4f6}@media print{.charts{grid-template-columns:1fr 1fr}}</style></head><body><h1>${text.app}</h1><p class="muted">${text.month}: ${month}</p><div class="charts">${charts}</div><table>${rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? ""}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
}

function openPreviewWindow(html, fallbackName) {
  const win = window.open("", "_blank");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    return true;
  }
  downloadFile(fallbackName, "text/html;charset=utf-8", html);
  return false;
}

function drawDonutOnCanvas(ctx, cx, cy, radius, innerRadius, items) {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  let angle = -Math.PI / 2;
  items.forEach((item) => {
    const slice = (Number(item.value || 0) / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, angle, angle + slice);
    ctx.arc(cx, cy, innerRadius, angle + slice, angle, true);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    angle += slice;
  });
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius - 2, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

function drawPieOnCanvas(ctx, cx, cy, radius, items) {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  let angle = -Math.PI / 2;
  items.forEach((item) => {
    const slice = (Number(item.value || 0) / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    angle += slice;
  });
}

function exportReport(format, data, text, month) {
  const filtered = rowsForMonth(data, month);
  const rows = reportRows(data, text, month);
  const html = reportHtml(rows, text, month, filtered);

  if (format === "excel") {
    const excelHtml = buildExcelReport(data, text, month);
    downloadFile(`budget-report-${month}.xls`, "application/vnd.ms-excel;charset=utf-8", excelHtml);
    return;
  }

  if (format === "word") {
    openPreviewWindow(html, `budget-report-${month}.html`);
    downloadFile(`budget-report-${month}.doc`, "application/msword", html);
    return;
  }

  if (format === "jpeg") {
    const filteredTotals = totals(filtered);
    const expenseItems = breakdown(filtered.expenses).filter((x) => x.value > 0);
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 34px Arial";
    ctx.fillText(text.app, 50, 60);
    ctx.font = "18px Arial";
    ctx.fillStyle = "#4b5563";
    ctx.fillText(`${text.month}: ${month}`, 50, 92);

    drawDonutOnCanvas(ctx, 190, 250, 95, 55, [
      { label: text.income, value: filteredTotals.income, color: "#16a34a" },
      { label: text.expenses, value: filteredTotals.expenses, color: "#dc2626" },
    ]);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 22px Arial";
    ctx.fillText(text.incomeVsExpenses, 50, 140);
    ctx.font = "16px Arial";
    ctx.fillText(`${text.income}: ${money(filteredTotals.income)}`, 330, 220);
    ctx.fillText(`${text.expenses}: ${money(filteredTotals.expenses)}`, 330, 250);
    ctx.fillText(`${text.balance}: ${money(filteredTotals.balance)}`, 330, 280);

    ctx.font = "bold 22px Arial";
    ctx.fillText(text.expensePicture, 650, 140);
    drawPieOnCanvas(ctx, 790, 250, 95, expenseItems.map((x, i) => ({ ...x, color: CHART_COLORS[i % CHART_COLORS.length] })));
    ctx.font = "16px Arial";
    expenseItems.slice(0, 7).forEach((x, i) => {
      ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
      ctx.fillRect(930, 190 + i * 28, 12, 12);
      ctx.fillStyle = "#111827";
      ctx.fillText(`${x.name}: ${money(x.value)}`, 950, 202 + i * 28);
    });

    ctx.fillStyle = "#111827";
    ctx.font = "18px Arial";
    rows.slice(1, 28).forEach((row, i) => ctx.fillText(row.join("   ").slice(0, 110), 50, 450 + i * 24));
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      downloadFile(`budget-report-${month}.jpg`, "image/jpeg", blob);
    }, "image/jpeg", 0.95);
    return;
  }

  const didOpen = openPreviewWindow(html, `budget-report-${month}.html`);
  if (didOpen) {
    setTimeout(() => {
      try { window.print(); } catch {}
    }, 300);
  }
}

function themeStyles(theme) {
  if (theme === "black") {
    return {
      page: { minHeight: "100vh", padding: 24, background: "radial-gradient(circle at top left, #1e293b 0, #020617 45%, #000 100%)", color: "white" },
      card: { background: "rgba(15,23,42,.88)", color: "white", border: "1px solid #334155", boxShadow: "0 20px 50px rgba(0,0,0,.45)" },
      panel: { background: "rgba(30,41,59,.85)" },
      text: "#fff",
      muted: "#cbd5e1",
      input: { background: "#020617", color: "white", border: "1px solid #475569" },
      chip: { background: "#0f172a", color: "white", border: "1px solid #475569" },
      deleteButton: { background: "white", color: "#b91c1c", border: "1px solid #fca5a5", fontWeight: 800 },
    };
  }
  if (theme === "white") {
    return {
      page: { minHeight: "100vh", padding: 24, background: "white", color: "#0f172a" },
      card: { background: "white", color: "#0f172a", border: "1px solid #e2e8f0", boxShadow: "0 15px 35px rgba(148,163,184,.28)" },
      panel: { background: "#f1f5f9" },
      text: "#0f172a",
      muted: "#475569",
      input: { background: "white", color: "#0f172a", border: "1px solid #cbd5e1" },
      chip: { background: "white", color: "#334155", border: "1px solid #cbd5e1" },
      deleteButton: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", fontWeight: 800 },
    };
  }
  return {
    page: { minHeight: "100vh", padding: 24, background: "linear-gradient(135deg,#f1f5f9,#fff,#e2e8f0)", color: "#0f172a" },
    card: { background: "rgba(255,255,255,.92)", color: "#0f172a", border: "1px solid #e2e8f0", boxShadow: "0 15px 35px rgba(148,163,184,.35)" },
    panel: { background: "#f1f5f9" },
    text: "#0f172a",
    muted: "#475569",
    input: { background: "white", color: "#0f172a", border: "1px solid #cbd5e1" },
    chip: { background: "white", color: "#334155", border: "1px solid #cbd5e1" },
    deleteButton: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", fontWeight: 800 },
  };
}

const base = {
  card: { borderRadius: 24, padding: 20 },
  button: { minHeight: 40, borderRadius: 12, border: 0, padding: "8px 14px", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 },
  outlineButton: { minHeight: 40, borderRadius: 12, padding: "8px 14px", cursor: "pointer", fontWeight: 700 },
  input: { minHeight: 40, borderRadius: 10, padding: "8px 10px", width: "100%", boxSizing: "border-box" },
  label: { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 },
};

function Icon({ name }) {
  if (name === "gear") return <span style={{ fontSize: 20 }}>⚙</span>;
  if (name === "trash") return <span>🗑</span>;
  return <span>＋</span>;
}

function PieChartSimple({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -90;
  const radius = 90;
  const cx = 120;
  const cy = 120;
  const slices = data.map((d, i) => {
    const start = angle;
    const end = angle + (d.value / total) * 360;
    angle = end;
    return { ...d, start, end, color: CHART_COLORS[i % CHART_COLORS.length] };
  });
  function point(a) {
    const rad = (a * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  }
  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      <svg width="240" height="240" viewBox="0 0 240 240">
        {slices.map((s) => {
          const [x1, y1] = point(s.start);
          const [x2, y2] = point(s.end);
          const large = s.end - s.start > 180 ? 1 : 0;
          return <path key={s.name} d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`} fill={s.color} />;
        })}
        <circle cx={cx} cy={cy} r="52" fill="currentColor" opacity=".08" />
      </svg>
      <div style={{ flex: 1, minWidth: 180 }}>
        {slices.map((s) => <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}><span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 999, background: s.color, marginRight: 8 }} />{s.name}</span><b>{money(s.value)}</b></div>)}
      </div>
    </div>
  );
}

function BarChartSimple({ income, expenses, text }) {
  const data = [
    { name: text.income, value: Number(income || 0), color: "#16a34a" },
    { name: text.expenses, value: Number(expenses || 0), color: "#dc2626" },
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let angle = -90;
  const cx = 130;
  const cy = 130;
  const radius = 100;
  const innerRadius = 58;
  const slices = data.map((item) => {
    const start = angle;
    const end = angle + (item.value / total) * 360;
    angle = end;
    return { ...item, start, end };
  });
  function point(deg, r) {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }
  function donutPath(slice) {
    const [x1, y1] = point(slice.start, radius);
    const [x2, y2] = point(slice.end, radius);
    const [x3, y3] = point(slice.end, innerRadius);
    const [x4, y4] = point(slice.start, innerRadius);
    const large = slice.end - slice.start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${large} 0 ${x4} ${y4} Z`;
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <svg width="260" height="260" viewBox="0 0 260 260" role="img" aria-label={text.incomeVsExpenses}>
          {slices.map((slice) => <path key={slice.name} d={donutPath(slice)} fill={slice.color} />)}
          <circle cx={cx} cy={cy} r="48" fill="currentColor" opacity="0.08" />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fill="currentColor" opacity="0.75">{text.balance}</text>
          <text x={cx} y={cy + 20} textAnchor="middle" fontSize="18" fontWeight="800" fill="currentColor">{money(income - expenses)}</text>
        </svg>
        <div style={{ flex: 1, minWidth: 190 }}>
          {data.map((item) => {
            const pct = Math.round((item.value / total) * 100);
            return <div key={item.name} style={{ display: "grid", gap: 6, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 999, background: item.color, marginRight: 8 }} />{item.name}</span>
                <b>{money(item.value)}</b>
              </div>
              <div style={{ height: 12, borderRadius: 999, background: "rgba(148,163,184,.25)", overflow: "hidden" }}>
                <div style={{ width: `${Math.max(3, pct)}%`, height: "100%", background: item.color, borderRadius: 999 }} />
              </div>
              <small style={{ opacity: .75 }}>{pct}%</small>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label style={base.label}>{label}</label>{children}</div>;
}

function App() {
  const [language, setLanguage] = useState("el");
  const [theme, setTheme] = useState("grey");
  const [accent, setAccent] = useState("blue");
  const [mode, setMode] = useState("expenses");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(monthNow());
  const [categoryModal, setCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [active, setActive] = useState({ income: "Salary", expenses: "Rent" });
  const [data, setData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialData;
    } catch {
      return initialData;
    }
  });
  const [form, setForm] = useState({ amount: "", vatRate: "24", vat: "", description: "", date: today() });

  const text = TEXT[language];
  const styles = themeStyles(theme);
  const accentColor = ACCENTS[accent];
  const t = useMemo(() => totals(data), [data]);
  const categories = Object.keys(data[mode] || {});
  const currentCategory = active[mode] || categories[0];
  const currentRows = data[mode][currentCategory] || [];
  const expenseData = breakdown(data.expenses).filter((x) => x.value > 0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  function updateAmount(value) {
    setForm((old) => ({ ...old, amount: value, vat: old.vatRate === "manual" ? old.vat : String(vatFor(value, old.vatRate)) }));
  }

  function updateVatRate(value) {
    setForm((old) => ({ ...old, vatRate: value, vat: value === "manual" ? old.vat : String(vatFor(old.amount, value)) }));
  }

  function addCategory(e) {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name || data[mode][name]) return;
    setData((old) => ({ ...old, [mode]: { ...old[mode], [name]: [] } }));
    setActive((old) => ({ ...old, [mode]: name }));
    setNewCategory("");
    setCategoryModal(false);
  }

  function deleteCategory() {
    if (categories.length <= 1) return;
    setData((old) => {
      const next = { ...old[mode] };
      delete next[currentCategory];
      const first = Object.keys(next)[0];
      setActive((a) => ({ ...a, [mode]: first }));
      return { ...old, [mode]: next };
    });
  }

  function addRow(e) {
    e.preventDefault();
    if (!form.amount || !form.description.trim()) return;
    const row = { id: id(), amount: Number(form.amount), vat: Number(form.vat || 0), vatRate: form.vatRate, description: form.description.trim(), date: form.date };
    setData((old) => ({ ...old, [mode]: { ...old[mode], [currentCategory]: [row, ...old[mode][currentCategory]] } }));
    setForm({ amount: "", vatRate: form.vatRate, vat: "", description: "", date: today() });
  }

  function deleteRow(rowId) {
    setData((old) => ({ ...old, [mode]: { ...old[mode], [currentCategory]: old[mode][currentCategory].filter((r) => r.id !== rowId) } }));
  }

  const buttonPrimary = { ...base.button, background: accentColor, color: accent === "amber" ? "#111827" : "white" };
  const outline = { ...base.outlineButton, ...styles.chip };

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div style={{ position: "relative" }}>
            <button style={buttonPrimary} onClick={() => setReportOpen(!reportOpen)}>{text.report}</button>
            {reportOpen && <div style={{ ...base.card, ...styles.card, position: "absolute", top: 48, left: 0, zIndex: 10, width: 260 }}>
              <Field label={text.month}><input style={{ ...base.input, ...styles.input }} type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>{["pdf", "jpeg", "excel", "word"].map((f) => <button key={f} style={outline} onClick={() => exportReport(f, data, text, reportMonth)}>{text[f]}</button>)}</div>
            </div>}
          </div>
          <div style={{ position: "relative" }}>
            <button style={{ ...base.outlineButton, ...(theme === "black" ? { background: "white", color: "black", border: "1px solid #fff" } : styles.chip) }} onClick={() => setSettingsOpen(!settingsOpen)}><Icon name="gear" /></button>
            {settingsOpen && <div style={{ ...base.card, ...styles.card, position: "absolute", top: 48, right: 0, zIndex: 10, width: 300 }}>
              <h3 style={{ marginTop: 0 }}>{text.settings}</h3>
              <p style={{ color: styles.muted, marginBottom: 8 }}>{text.language}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><button style={outline} onClick={() => setLanguage("en")}>English</button><button style={outline} onClick={() => setLanguage("el")}>Ελληνικά</button></div>
              <p style={{ color: styles.muted, marginBottom: 8 }}>{text.background}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>{["white", "grey", "black"].map((x) => <button key={x} style={{ ...outline, outline: theme === x ? `2px solid ${accentColor}` : "none" }} onClick={() => setTheme(x)}>{text[x]}</button>)}</div>
              <p style={{ color: styles.muted, marginBottom: 8 }}>{text.accent}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>{Object.entries(ACCENTS).map(([name, color]) => <button key={name} title={name} onClick={() => setAccent(name)} style={{ height: 34, borderRadius: 10, border: accent === name ? "3px solid white" : "1px solid transparent", background: color }} />)}</div>
              <p style={{ color: styles.muted, fontSize: 12 }}>{text.driveNote}</p>
            </div>}
          </div>
        </div>

        <section style={{ ...base.card, ...styles.card }}>
          <h1 style={{ fontSize: 34, margin: 0 }}>{text.app}</h1>
          <p style={{ color: styles.muted }}>{text.subtitle}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 18 }}>
            <Summary styles={styles} label={text.income} value={money(t.income)} />
            <Summary styles={styles} label={text.expenses} value={money(t.expenses)} />
            <Summary styles={styles} label={text.balance} value={money(t.balance)} good={t.balance >= 0} />
          </div>
        </section>

        <main style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(320px,.9fr)", gap: 20 }}>
          <section style={{ ...base.card, ...styles.card }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "inline-flex", background: theme === "black" ? "#0f172a" : "#e2e8f0", borderRadius: 14, padding: 4 }}>
                <button style={{ ...base.button, background: mode === "income" ? "white" : "transparent", color: mode === "income" ? "#111827" : styles.text }} onClick={() => setMode("income")}>{text.income}</button>
                <button style={{ ...base.button, background: mode === "expenses" ? "white" : "transparent", color: mode === "expenses" ? "#111827" : styles.text }} onClick={() => setMode("expenses")}>{text.expenses}</button>
              </div>
              <button style={buttonPrimary} onClick={() => setCategoryModal(true)}><Icon name="plus" />{text.add}</button>
            </div>

            {categoryModal && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
              <form onSubmit={addCategory} style={{ ...base.card, ...styles.card, width: "min(440px,90vw)" }}>
                <h2>{text.newCategory}</h2>
                <Field label={text.categoryName}><input autoFocus style={{ ...base.input, ...styles.input }} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} /></Field>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}><button type="button" style={outline} onClick={() => setCategoryModal(false)}>{text.cancel}</button><button style={buttonPrimary}>{text.create}</button></div>
              </form>
            </div>}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "18px 0" }}>
              {categories.map((category) => <button key={category} style={{ ...outline, background: category === currentCategory ? "#111827" : styles.chip.background, color: category === currentCategory ? "white" : styles.chip.color }} onClick={() => setActive((old) => ({ ...old, [mode]: category }))}>{category}</button>)}
            </div>

            <div style={{ ...base.card, ...styles.panel }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
                <div><h2 style={{ margin: 0 }}>{currentCategory}</h2><p style={{ margin: "6px 0", color: styles.muted }}>{text.totalWithVat}: {money(sumRows(currentRows))}</p></div>
                <button style={{ ...base.outlineButton, ...styles.deleteButton }} disabled={categories.length <= 1} onClick={deleteCategory}>{text.deleteTab}</button>
              </div>
              <form onSubmit={addRow} style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 10 }}>
                <div><Field label={text.amountNoVat}><input style={{ ...base.input, ...styles.input }} type="number" min="0" step="0.01" value={form.amount} onChange={(e) => updateAmount(e.target.value)} /></Field></div>
                <div><Field label={text.vatRate}><select style={{ ...base.input, ...styles.input }} value={form.vatRate} onChange={(e) => updateVatRate(e.target.value)}>{VAT_RATES.map((rate) => <option key={rate.value} value={rate.value}>{rate[language]}</option>)}</select></Field></div>
                <div><Field label={text.vatAmount}><input style={{ ...base.input, ...styles.input }} type="number" min="0" step="0.01" value={form.vat} onChange={(e) => setForm({ ...form, vat: e.target.value, vatRate: "manual" })} /></Field></div>
                <div style={{ gridColumn: "span 2" }}><Field label={text.description}><input style={{ ...base.input, ...styles.input }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
                <div><Field label={text.date}><input style={{ ...base.input, ...styles.input }} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field></div>
                <button style={{ ...buttonPrimary, gridColumn: "1 / -1" }}>{text.addRecord}</button>
              </form>
            </div>

            <div style={{ marginTop: 16, border: `1px solid ${theme === "black" ? "#334155" : "#e2e8f0"}`, borderRadius: 18, overflow: "hidden" }}>
              {currentRows.length === 0 ? <p style={{ textAlign: "center", color: styles.muted, padding: 24 }}>{text.noRecords}</p> : currentRows.map((row) => <div key={row.id} style={{ display: "grid", gridTemplateColumns: "110px 1fr 110px 110px 70px 50px", gap: 8, padding: 12, borderTop: `1px solid ${theme === "black" ? "#334155" : "#e2e8f0"}`, alignItems: "center" }}><span>{row.date}</span><b>{row.description}</b><span style={{ textAlign: "right" }}>{money(row.amount)}</span><span style={{ textAlign: "right" }}>{money(row.vat)}</span><span style={{ textAlign: "right" }}>{row.vatRate}%</span><button style={{ ...base.outlineButton, ...styles.chip }} onClick={() => deleteRow(row.id)}><Icon name="trash" /></button></div>)}
            </div>
          </section>

          <aside style={{ display: "grid", gap: 20 }}>
            <section style={{ ...base.card, ...styles.card }}><h2>{text.expensePicture}</h2>{expenseData.length ? <PieChartSimple data={expenseData} /> : <p style={{ color: styles.muted }}>{text.noRecords}</p>}</section>
            <section style={{ ...base.card, ...styles.card }}><h2>{text.incomeVsExpenses}</h2><BarChartSimple income={t.income} expenses={t.expenses} text={text} /></section>
            <section style={{ ...base.card, ...styles.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Mini styles={styles} label={text.incomeNoVat} value={money(t.incomeNoVat)} />
              <Mini styles={styles} label={text.expenseNoVat} value={money(t.expensesNoVat)} />
              <Mini styles={styles} label={text.incomeVat} value={money(t.incomeVat)} />
              <Mini styles={styles} label={text.expenseVat} value={money(t.expenseVat)} />
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}

function Summary({ styles, label, value, good }) {
  return <div style={{ ...base.card, ...styles.panel, transition: "transform .15s" }}><p style={{ margin: 0, color: styles.muted }}>{label}</p><h2 style={{ margin: "6px 0 0", color: good ? "#16a34a" : styles.text }}>{value}</h2></div>;
}

function Mini({ styles, label, value }) {
  return <div style={{ ...base.card, ...styles.panel, padding: 14 }}><p style={{ margin: 0, color: styles.muted, fontSize: 13 }}>{label}</p><b>{value}</b></div>;
}

export default App;