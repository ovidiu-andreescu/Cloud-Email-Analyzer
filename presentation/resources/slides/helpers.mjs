export const SLIDE_SIZE = { width: 1280, height: 720 };

const ACCENT = "#6A4DFF";
const LINE = "#D6E1F0";
const INK = "#102033";
const CARD = "#FFFFFF";
const PALE = "#F4F1FF";

function cleanLine(line) {
  if (!line || !line.width) {
    return { style: "solid", fill: "#00000000", width: 0 };
  }
  const cleaned = { style: line.style || "solid", fill: line.fill || "#00000000", width: line.width };
  if (line.beginArrowType) cleaned.beginArrowType = line.beginArrowType;
  if (line.endArrowType) cleaned.endArrowType = line.endArrowType;
  return cleaned;
}

function addBox(slide, ctx, x, y, w, h, fill = CARD, stroke = LINE, width = 2) {
  return ctx.addShape(slide, {
    x, y, w, h,
    geometry: "rect",
    fill,
    line: { style: "solid", fill: stroke, width },
  });
}

function addLine(slide, ctx, x1, y1, x2, y2, color = ACCENT, width = 4, arrows = {}) {
  return ctx.addShape(slide, {
    x: x1,
    y: y1,
    w: x2 - x1,
    h: y2 - y1,
    geometry: "line",
    fill: "#00000000",
    line: {
      style: "solid",
      fill: color,
      width,
      beginArrowType: arrows.begin ? "triangle" : "none",
      endArrowType: arrows.end ? "triangle" : "none",
    },
  });
}

function addCircle(slide, ctx, cx, cy, r, stroke = ACCENT, width = 3, fill = "#00000000") {
  return ctx.addShape(slide, {
    x: cx - r,
    y: cy - r,
    w: r * 2,
    h: r * 2,
    geometry: "ellipse",
    fill,
    line: { style: "solid", fill: stroke, width },
  });
}

function addLabel(slide, ctx, text, x, y, w, h, options = {}) {
  return ctx.addText(slide, {
    x, y, w, h,
    text,
    fontSize: options.fontSize || 14,
    color: options.color || INK,
    bold: Boolean(options.bold),
    typeface: options.typeface || ctx.fonts?.body || "Aptos",
    align: options.align || "left",
    valign: options.valign || "top",
    fill: "#00000000",
    line: { style: "solid", fill: "#00000000", width: 0 },
    insets: { left: 0, right: 0, top: 0, bottom: 0 },
  });
}

async function icon(ctx, slide, name, x, y, size, color = ACCENT, strokeWidth = 2.5) {
  await ctx.addLucideIcon(slide, {
    icon: name,
    x,
    y,
    w: size,
    h: size,
    color,
    strokeWidth,
    fit: "contain",
  });
}

async function addLucide(slide, ctx, name, x, y, size, color = ACCENT, strokeWidth = 2.5) {
  await icon(ctx, slide, name, x, y, size, color, strokeWidth);
}

async function drawNativeIcon(slide, ctx, element) {
  const color = element.color || ACCENT;
  const { x, y, w, h } = element;
  const s = Math.min(w, h);
  const ox = x + (w - s) / 2;
  const oy = y + (h - s) / 2;
  const iconMap = {
    "mail-alert": "MailWarning",
    signals: "Share2",
    "clipboard-check": "ShieldCheck",
    parser: "FileText",
    check: "ShieldCheck",
    review: "FileSearch",
    mail: "Mail",
  };
  await addLucide(slide, ctx, iconMap[element.icon] || element.icon || "Mail", ox, oy, s, color, element.strokeWidth || 2.5);
}

function drawNativeArrow(slide, ctx, element) {
  const color = element.color || ACCENT;
  const direction = element.direction || "right";
  const fill = element.fill || color;
  const line = { style: "solid", fill: "#00000000", width: 0 };
  if (direction === "down") {
    ctx.addShape(slide, {
      x: element.x - (element.w || 22) / 2,
      y: element.y,
      w: element.w || 22,
      h: element.h,
      geometry: "downArrow",
      fill,
      line,
    });
  } else if (direction === "up") {
    ctx.addShape(slide, {
      x: element.x - (element.w || 22) / 2,
      y: element.y,
      w: element.w || 22,
      h: element.h,
      geometry: "upArrow",
      fill,
      line,
    });
  } else if (direction === "vertical-both") {
    ctx.addShape(slide, {
      x: element.x - (element.w || 22) / 2,
      y: element.y,
      w: element.w || 22,
      h: element.h,
      geometry: "upDownArrow",
      fill,
      line,
    });
  } else if (direction === "left") {
    ctx.addShape(slide, {
      x: element.x,
      y: element.y - (element.h || 12) / 2,
      w: element.w,
      h: element.h || 12,
      geometry: "leftArrow",
      fill,
      line,
    });
  } else {
    ctx.addShape(slide, {
      x: element.x,
      y: element.y - (element.h || 12) / 2,
      w: element.w,
      h: element.h || 12,
      geometry: "rightArrow",
      fill,
      line,
    });
  }
}

function drawClassifierRecallChart(slide, ctx, element) {
  const { x, y, w, h } = element;
  const values = [
    { label: "LR", recall: 0.9800, min: 0.9800, max: 0.9800 },
    { label: "NB", recall: 0.9500, min: 0.9500, max: 0.9530 },
    { label: "RF", recall: 0.9180, min: 0.9180, max: 0.9220 },
    { label: "SGD", recall: 0.9805, min: 0.9798, max: 0.9805 },
  ];
  const minY = 0.90;
  const maxY = 1.00;
  const plotX = x + 78;
  const plotY = y + 76;
  const plotW = w - 128;
  const plotH = h - 142;
  const axisColor = "#93A9C1";
  const gridColor = "#E7EEF7";

  addLabel(slide, ctx, "Classifier recall", x + 28, y + 24, 260, 28, {
    fontSize: 16.5,
    bold: true,
    typeface: "Aptos Display",
  });
  addLabel(slide, ctx, "Bars show recall; whiskers span the tracked metric spread.", x + 28, y + 51, 520, 22, {
    fontSize: 10.5,
    color: "#3D4B63",
  });

  const yPos = (value) => plotY + plotH - ((value - minY) / (maxY - minY)) * plotH;
  for (const tick of [0.90, 0.92, 0.94, 0.96, 0.98, 1.00]) {
    const ty = yPos(tick);
    addLine(slide, ctx, plotX, ty, plotX + plotW, ty, gridColor, 1);
    addLabel(slide, ctx, tick.toFixed(2), x + 22, ty - 8, 46, 16, {
      fontSize: 9.5,
      color: "#617089",
      align: "right",
    });
  }
  addLine(slide, ctx, plotX, plotY, plotX, plotY + plotH, axisColor, 1.4);
  addLine(slide, ctx, plotX, plotY + plotH, plotX + plotW, plotY + plotH, axisColor, 1.4);

  const gap = plotW / values.length;
  const barW = 62;
  values.forEach((item, index) => {
    const cx = plotX + gap * index + gap / 2;
    const top = yPos(item.recall);
    const barH = plotY + plotH - top;
    const barX = cx - barW / 2;
    addBox(slide, ctx, barX, top, barW, barH, ACCENT, ACCENT, 0);

    if (item.max - item.min > 0.0002) {
      const wx = barX + barW + 15;
      const yMin = yPos(item.min);
      const yMax = yPos(item.max);
      addLine(slide, ctx, wx, yMin, wx, yMax, INK, 2.2);
      addLine(slide, ctx, wx - 8, yMin, wx + 8, yMin, INK, 2.2);
      addLine(slide, ctx, wx - 8, yMax, wx + 8, yMax, INK, 2.2);
    }

    addLabel(slide, ctx, item.recall.toFixed(4), barX - 16, top - 26, barW + 32, 18, {
      fontSize: 11,
      color: ACCENT,
      bold: true,
      align: "center",
    });
    addLabel(slide, ctx, item.label, cx - 32, plotY + plotH + 16, 64, 22, {
      fontSize: 13,
      color: INK,
      bold: true,
      align: "center",
    });
  });
}

async function drawIdentityMark(slide, ctx, element) {
  const { x, y, w, h } = element;
  const scale = Math.min(w / 300, h / 270);
  const sx = (v) => x + v * scale;
  const sy = (v) => y + v * scale;
  const sw = (v) => v * scale;

  addBox(slide, ctx, sx(0), sy(0), sw(300), sw(270), CARD, LINE, sw(2.5));
  addBox(slide, ctx, sx(92), sy(24), sw(116), sw(116), PALE, LINE, sw(2.5));
  await icon(ctx, slide, "Mail", sx(116), sy(54), sw(68), ACCENT, 2.6);

  addLine(slide, ctx, sx(109), sy(215), sx(119), sy(215), LINE, sw(5));
  addLine(slide, ctx, sx(181), sy(215), sx(191), sy(215), LINE, sw(5));

  const tile = (tx) => addBox(slide, ctx, sx(tx), sy(176), sw(62), sw(62), CARD, LINE, sw(2.5));
  tile(47);
  tile(119);
  tile(191);
  await icon(ctx, slide, "FileText", sx(61), sy(190), sw(34), ACCENT, 2.5);
  await icon(ctx, slide, "CircleCheck", sx(133), sy(190), sw(34), ACCENT, 2.5);
  await icon(ctx, slide, "Search", sx(205), sy(190), sw(34), ACCENT, 2.5);
  addLabel(slide, ctx, "@", sx(213.5), sy(197), sw(13), sw(13), {
    fontSize: sw(9),
    color: ACCENT,
    bold: true,
    align: "center",
    valign: "middle",
  });
}

export async function applyElements(slide, ctx, elements) {
  for (const element of elements) {
    const frame = { x: element.x, y: element.y, w: element.w, h: element.h };
    if (element.type === "shape") {
      ctx.addShape(slide, {
        ...frame,
        name: element.name || undefined,
        geometry: element.geometry || "rect",
        fill: element.fill || "#00000000",
        line: cleanLine(element.line),
      });
    } else if (element.type === "text") {
      ctx.addText(slide, {
        ...frame,
        name: element.name || undefined,
        text: element.text || "",
        fontSize: element.fontSize || 24,
        color: element.color || "#102033",
        bold: Boolean(element.bold),
        typeface: element.typeface || ctx.fonts?.body || "Aptos",
        align: element.align || "left",
        valign: element.valign || "top",
        fill: element.fill || "#00000000",
        line: cleanLine(element.line),
        insets: { left: 0, right: 0, top: 0, bottom: 0 },
      });
    } else if (element.type === "nativeIcon") {
      await drawNativeIcon(slide, ctx, element);
    } else if (element.type === "nativeArrow") {
      drawNativeArrow(slide, ctx, element);
    } else if (element.type === "recallChart") {
      drawClassifierRecallChart(slide, ctx, element);
    } else if (element.type === "identityMark") {
      await drawIdentityMark(slide, ctx, element);
    }
  }
}
