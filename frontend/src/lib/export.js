import jsPDF from "jspdf";

export function buildMarkdown(map) {
  const lines = [];
  lines.push(`# ${map.title || map.issue || "Issue Map"}`);
  lines.push("");
  lines.push(`## Issue`);
  lines.push(map.issue || "—");
  lines.push("");
  lines.push(`## Positions`);
  lines.push(`**Your position:** ${map.position_a || "—"}`);
  lines.push(`**Opposing position:** ${map.position_b || "—"}`);
  if (map.concerns_a) {
    lines.push("");
    lines.push(`**Concerns, fears, values & hopes behind your position:**`);
    lines.push(map.concerns_a);
  }
  lines.push("");
  lines.push(`## Underlying Needs`);
  lines.push(`**Position A needs:**`);
  (map.needs_a || []).forEach((n) => lines.push(`- ${n}`));
  lines.push("");
  lines.push(`**Position B needs:**`);
  (map.needs_b || []).forEach((n) => lines.push(`- ${n}`));
  lines.push("");
  lines.push(`## Collaborative Solutions`);
  (map.solutions || []).forEach((s, i) => {
    lines.push(`### ${i + 1}. ${s.title}`);
    lines.push(s.description || "");
    if (s.needs_satisfied_a?.length) lines.push(`- Meets (A): ${s.needs_satisfied_a.join(", ")}`);
    if (s.needs_satisfied_b?.length) lines.push(`- Meets (B): ${s.needs_satisfied_b.join(", ")}`);
    if (s.needs_unaddressed?.length) lines.push(`- Not yet addressed: ${s.needs_unaddressed.join(", ")}`);
    if (s.improvements) lines.push(`- Possible improvements: ${s.improvements}`);
    lines.push("");
  });
  lines.push(`## Remaining Questions & Reflection`);
  const r = map.reflection || {};
  lines.push(`**Most promising solution:** ${r.promising || "—"}`);
  lines.push(`**Needs that remain unmet:** ${r.unmet || "—"}`);
  lines.push(`**How it could be improved:** ${r.improve || "—"}`);
  lines.push(`**Did this change your understanding:** ${r.changed || "—"}`);
  return lines.join("\n");
}

export function downloadText(map) {
  const md = buildMarkdown(map);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(map.issue || "issue-map").replace(/\s+/g, "-").toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyMarkdown(map) {
  await navigator.clipboard.writeText(buildMarkdown(map));
}

export function exportPdf(map) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const addPageIfNeeded = (h) => {
    if (y + h > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeBlock = (text, { size = 11, bold = false, color = [45, 42, 38], gap = 6 } = {}) => {
    doc.setFont("times", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const wrapped = doc.splitTextToSize(text || "—", width);
    wrapped.forEach((line) => {
      addPageIfNeeded(size + 4);
      doc.text(line, margin, y);
      y += size + 4;
    });
    y += gap;
  };

  writeBlock(map.title || map.issue || "Issue Map", { size: 20, bold: true, color: [74, 93, 78], gap: 10 });
  writeBlock("Issue", { size: 13, bold: true, color: [74, 93, 78], gap: 2 });
  writeBlock(map.issue);
  writeBlock("Positions", { size: 13, bold: true, color: [74, 93, 78], gap: 2 });
  writeBlock(`Your position: ${map.position_a || "—"}`);
  writeBlock(`Opposing position: ${map.position_b || "—"}`);
  writeBlock("Underlying Needs", { size: 13, bold: true, color: [74, 93, 78], gap: 2 });
  writeBlock(`Position A: ${(map.needs_a || []).join(", ") || "—"}`);
  writeBlock(`Position B: ${(map.needs_b || []).join(", ") || "—"}`);
  writeBlock("Collaborative Solutions", { size: 13, bold: true, color: [74, 93, 78], gap: 2 });
  (map.solutions || []).forEach((s, i) => {
    writeBlock(`${i + 1}. ${s.title}`, { bold: true, gap: 2 });
    writeBlock(s.description);
    if (s.needs_satisfied_a?.length) writeBlock(`Meets (A): ${s.needs_satisfied_a.join(", ")}`, { size: 10, color: [110, 104, 96] });
    if (s.needs_satisfied_b?.length) writeBlock(`Meets (B): ${s.needs_satisfied_b.join(", ")}`, { size: 10, color: [110, 104, 96] });
    if (s.needs_unaddressed?.length) writeBlock(`Not yet addressed: ${s.needs_unaddressed.join(", ")}`, { size: 10, color: [110, 104, 96] });
    if (s.improvements) writeBlock(`Improvements: ${s.improvements}`, { size: 10, color: [110, 104, 96] });
  });
  const r = map.reflection || {};
  writeBlock("Remaining Questions & Reflection", { size: 13, bold: true, color: [74, 93, 78], gap: 2 });
  writeBlock(`Most promising: ${r.promising || "—"}`);
  writeBlock(`Unmet needs: ${r.unmet || "—"}`);
  writeBlock(`Improvements: ${r.improve || "—"}`);
  writeBlock(`Changed understanding: ${r.changed || "—"}`);

  doc.save(`${(map.issue || "issue-map").replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
