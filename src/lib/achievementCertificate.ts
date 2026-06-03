export const CERTIFICATE_REQUIREMENTS = {
  minDailyStreak: 30,
  minAccuracy: 80,
  minTestsCompleted: 10,
} as const;

export interface AchievementCertificateData {
  streakTitle: string;
  dailyStreak: number;
  accuracy: number;
  testsCompleted: number;
  flashcardsReviewed: number;
  totalWeeklyTasks: number;
}

export function meetsCertificateRequirements(data: {
  dailyStreak: number;
  accuracy: number;
  testsCompleted: number;
}): boolean {
  return (
    data.dailyStreak >= CERTIFICATE_REQUIREMENTS.minDailyStreak &&
    data.accuracy >= CERTIFICATE_REQUIREMENTS.minAccuracy &&
    data.testsCompleted >= CERTIFICATE_REQUIREMENTS.minTestsCompleted
  );
}

export function getCertificateRequirementText(): string {
  const { minDailyStreak, minAccuracy, minTestsCompleted } = CERTIFICATE_REQUIREMENTS;
  return `Сертификат үшін: ${minDailyStreak} күн стрик, ${minAccuracy}% дәлдік, ${minTestsCompleted} тест.`;
}

// ─── Helper Utilities ─────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawOrnateCorner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  flipH: boolean,
  flipV: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  if (flipH) ctx.scale(-1, 1);
  if (flipV) ctx.scale(1, -1);

  const goldGrad = ctx.createLinearGradient(0, 0, size, size);
  goldGrad.addColorStop(0, '#F5D060');
  goldGrad.addColorStop(0.5, '#D4AF37');
  goldGrad.addColorStop(1, '#A67C00');
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  // L-shaped corner with inward flourish
  ctx.beginPath();
  ctx.moveTo(0, size * 0.6);
  ctx.lineTo(0, size * 0.08);
  ctx.arcTo(0, 0, size * 0.08, 0, size * 0.08);
  ctx.lineTo(size * 0.6, 0);
  ctx.stroke();

  // Inner accent line
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(size * 0.1, size * 0.5);
  ctx.lineTo(size * 0.1, size * 0.15);
  ctx.arcTo(size * 0.1, size * 0.1, size * 0.15, size * 0.1, size * 0.05);
  ctx.lineTo(size * 0.5, size * 0.1);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Small diamond at corner tip
  ctx.fillStyle = goldGrad;
  ctx.beginPath();
  ctx.translate(0, 0);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-5, -5, 10, 10);
  ctx.rotate(-Math.PI / 4);

  ctx.restore();
}

function drawSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  // Outer ring gradient
  const outerGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
  outerGrad.addColorStop(0, '#F5D060');
  outerGrad.addColorStop(0.5, '#D4AF37');
  outerGrad.addColorStop(1, '#8B6914');

  // Glow effect
  ctx.shadowColor = 'rgba(212,175,55,0.5)';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(212,175,55,0.15)';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Main circle fill — dark bg
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#0D1117';
  ctx.fill();

  // Gold ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = outerGrad;
  ctx.lineWidth = 5;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, r - 12, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212,175,55,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Dashed ring  
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, r - 20, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212,175,55,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);

  // Star in center
  const starGrad = ctx.createRadialGradient(cx, cy - 5, 2, cx, cy, 28);
  starGrad.addColorStop(0, '#F5D060');
  starGrad.addColorStop(1, '#A67C00');
  ctx.fillStyle = starGrad;
  drawStar(ctx, cx, cy - 4, 28, 12, 5);
  ctx.fill();

  // Text around ring: "BEXT · EXCELLENCE · СЕРТИФИКАТЫ"
  const sealText = '· BEXT AI · Excellence · СЕРТИФИКАТЫ ·';
  const fontSize = 11;
  ctx.save();
  ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = '#D4AF37';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const charCount = sealText.length;
  const arcRadius = r - 7;
  const angleStep = (2 * Math.PI) / charCount;
  let angle = -Math.PI / 2;
  for (const ch of sealText) {
    ctx.save();
    ctx.translate(cx + arcRadius * Math.cos(angle), cy + arcRadius * Math.sin(angle));
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += angleStep;
  }
  ctx.restore();
}

function drawStatBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string,
  accentColor: string,
) {
  // Glass panel
  ctx.shadowColor = `${accentColor}40`;
  ctx.shadowBlur = 16;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fill();
  ctx.strokeStyle = `${accentColor}80`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Top accent line
  ctx.fillStyle = accentColor;
  roundRect(ctx, x + 12, y - 1, w - 24, 3, 2);
  ctx.fill();

  // Value
  const valGrad = ctx.createLinearGradient(x, y + 10, x, y + 60);
  valGrad.addColorStop(0, '#FFFFFF');
  valGrad.addColorStop(1, accentColor);
  ctx.fillStyle = valGrad;
  ctx.font = '300 48px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(value, x + w / 2, y + 18);

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '500 14px Inter, system-ui, sans-serif';
  ctx.fillText(label, x + w / 2, y + h - 26);
}

function drawSignatureLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  name: string,
  role: string,
) {
  // Decorative wavy signature path (vector-drawn style)
  ctx.strokeStyle = 'rgba(212,175,55,0.7)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  // Wavy line as "signature"
  ctx.moveTo(x + 10, y);
  ctx.bezierCurveTo(x + w * 0.2, y - 12, x + w * 0.3, y + 8, x + w * 0.45, y - 4);
  ctx.bezierCurveTo(x + w * 0.55, y - 14, x + w * 0.65, y + 6, x + w * 0.8, y);
  ctx.bezierCurveTo(x + w * 0.88, y + 5, x + w * 0.92, y - 5, x + w - 10, y - 2);
  ctx.stroke();

  // Underline
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(212,175,55,0.4)';
  ctx.beginPath();
  ctx.moveTo(x, y + 16);
  ctx.lineTo(x + w, y + 16);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  ctx.fillText(name, x + w / 2, y + 22);

  ctx.fillStyle = 'rgba(212,175,55,0.7)';
  ctx.font = '400 11px Inter, system-ui, sans-serif';
  ctx.fillText(role, x + w / 2, y + 38);
}

/** Premium dark-gold achievement certificate. */
export function createAchievementCertificateCanvas(
  data: AchievementCertificateData,
): HTMLCanvasElement | null {
  const width = 1400;
  const height = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const pad = 60;
  const cx = width / 2;

  // ─── Background ──────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#080C14');
  bgGrad.addColorStop(0.45, '#0D1117');
  bgGrad.addColorStop(1, '#111827');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Radial glow blobs
  const blobs: [number, number, number, string][] = [
    [width * 0.15, height * 0.1, 350, 'rgba(88,28,220,0.18)'],
    [width * 0.85, height * 0.15, 280, 'rgba(212,175,55,0.12)'],
    [width * 0.5, height * 0.95, 400, 'rgba(124,58,237,0.14)'],
    [width * 0.1, height * 0.85, 220, 'rgba(212,175,55,0.08)'],
    [width * 0.9, height * 0.8, 260, 'rgba(88,28,220,0.1)'],
  ];
  for (const [bx, by, br, color] of blobs) {
    const blob = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    blob.addColorStop(0, color);
    blob.addColorStop(1, 'transparent');
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, width, height);
  }

  // Subtle noise texture via repeating tiny dots
  ctx.globalAlpha = 0.025;
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = i % 3 === 0 ? '#D4AF37' : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ─── Outer Border (double gold) ───────────────────────────────────────────
  const outerBorderGrad = ctx.createLinearGradient(pad, pad, width - pad, height - pad);
  outerBorderGrad.addColorStop(0, '#F5D060');
  outerBorderGrad.addColorStop(0.25, '#D4AF37');
  outerBorderGrad.addColorStop(0.5, '#A67C00');
  outerBorderGrad.addColorStop(0.75, '#D4AF37');
  outerBorderGrad.addColorStop(1, '#F5D060');

  roundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, 8);
  ctx.strokeStyle = outerBorderGrad;
  ctx.lineWidth = 3;
  ctx.stroke();

  roundRect(ctx, pad + 10, pad + 10, width - (pad + 10) * 2, height - (pad + 10) * 2, 6);
  ctx.strokeStyle = 'rgba(212,175,55,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ─── Ornate corners ───────────────────────────────────────────────────────
  const cSize = 80;
  drawOrnateCorner(ctx, pad + 2, pad + 2, cSize, false, false);
  drawOrnateCorner(ctx, width - pad - 2, pad + 2, cSize, true, false);
  drawOrnateCorner(ctx, pad + 2, height - pad - 2, cSize, false, true);
  drawOrnateCorner(ctx, width - pad - 2, height - pad - 2, cSize, true, true);

  // ─── Left vertical gold bar ───────────────────────────────────────────────
  const leftBar = ctx.createLinearGradient(0, pad, 0, height - pad);
  leftBar.addColorStop(0, 'transparent');
  leftBar.addColorStop(0.2, '#7C3AED');
  leftBar.addColorStop(0.5, '#A78BFA');
  leftBar.addColorStop(0.8, '#D4AF37');
  leftBar.addColorStop(1, 'transparent');
  roundRect(ctx, pad + 18, pad + 30, 5, height - (pad + 30) * 2, 3);
  ctx.fillStyle = leftBar;
  ctx.fill();

  // ─── Header ───────────────────────────────────────────────────────────────
  let y = pad + 56;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#D4AF37';
  ctx.font = '700 13px Inter, system-ui, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('BEXT AI', pad + 36, y);
  ctx.letterSpacing = '0px';

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(212,175,55,0.55)';
  ctx.font = '400 12px Inter, system-ui, sans-serif';
  const dateStr = new Date().toLocaleDateString('kk-KZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.fillText(dateStr, width - pad - 18, y);

  // Divider line under header
  y += 34;
  const headerLineGrad = ctx.createLinearGradient(pad + 36, 0, width - pad - 18, 0);
  headerLineGrad.addColorStop(0, 'transparent');
  headerLineGrad.addColorStop(0.15, '#D4AF37');
  headerLineGrad.addColorStop(0.85, '#D4AF37');
  headerLineGrad.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.moveTo(pad + 36, y);
  ctx.lineTo(width - pad - 18, y);
  ctx.strokeStyle = headerLineGrad;
  ctx.lineWidth = 1;
  ctx.stroke();

  // ─── Main Title ───────────────────────────────────────────────────────────
  y += 54;
  ctx.textAlign = 'center';

  // Subtitle line
  ctx.fillStyle = 'rgba(212,175,55,0.6)';
  ctx.font = '400 13px Inter, system-ui, sans-serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('РЕСМИ РАСТАУЛЫ', cx, y);
  ctx.letterSpacing = '0px';

  y += 34;
  const titleGrad = ctx.createLinearGradient(cx - 300, y, cx + 300, y + 60);
  titleGrad.addColorStop(0, '#F5D060');
  titleGrad.addColorStop(0.4, '#FFFFFF');
  titleGrad.addColorStop(0.7, '#F5D060');
  titleGrad.addColorStop(1, '#D4AF37');
  ctx.fillStyle = titleGrad;
  ctx.font = '200 54px Inter, system-ui, sans-serif';
  ctx.fillText('Жетістік Сертификаты', cx, y);

  y += 68;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '400 18px Inter, system-ui, sans-serif';
  ctx.fillText('Табанды оқу, жүйелі прогресс және ерен жетістік үшін', cx, y);

  // Gold rule
  y += 44;
  ctx.strokeStyle = 'rgba(212,175,55,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 120, y);
  ctx.lineTo(cx + 120, y);
  ctx.stroke();
  // Diamond in center of rule
  ctx.fillStyle = '#D4AF37';
  ctx.save();
  ctx.translate(cx, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();

  // ─── Streak Title Badge ───────────────────────────────────────────────────
  y += 36;
  const badgeW = 420;
  const badgeH = 50;
  const badgeX = cx - badgeW / 2;
  const badgeGrad = ctx.createLinearGradient(badgeX, y, badgeX + badgeW, y + badgeH);
  badgeGrad.addColorStop(0, 'rgba(124,58,237,0.35)');
  badgeGrad.addColorStop(0.5, 'rgba(212,175,55,0.2)');
  badgeGrad.addColorStop(1, 'rgba(124,58,237,0.35)');

  ctx.shadowColor = 'rgba(124,58,237,0.4)';
  ctx.shadowBlur = 20;
  roundRect(ctx, badgeX, y, badgeW, badgeH, 25);
  ctx.fillStyle = badgeGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(212,175,55,0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const badgeTextGrad = ctx.createLinearGradient(badgeX, y, badgeX + badgeW, y);
  badgeTextGrad.addColorStop(0, '#F5D060');
  badgeTextGrad.addColorStop(0.5, '#FFFFFF');
  badgeTextGrad.addColorStop(1, '#F5D060');
  ctx.fillStyle = badgeTextGrad;
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillText(`✦  ${data.streakTitle}  ✦`, cx, y + 14);

  // ─── Stats Grid (4 glassmorphic boxes) ───────────────────────────────────
  y += 80;
  const statColors = ['#A78BFA', '#34D399', '#60A5FA', '#FB923C'];
  const statValues = [
    `${data.dailyStreak}`,
    `${data.accuracy}%`,
    `${data.testsCompleted}`,
    `${data.flashcardsReviewed}`,
  ];
  const statLabels = ['Стрик · күн', 'Дәлдік', 'Тест', 'Карточка'];
  const statW = (width - pad * 2 - 36 * 3) / 4;
  const statH = 130;

  for (let i = 0; i < 4; i++) {
    const sx = pad + 18 + i * (statW + 36);
    drawStatBox(ctx, sx, y, statW, statH, statValues[i], statLabels[i], statColors[i]);
  }

  // ─── Summary line ─────────────────────────────────────────────────────────
  y += statH + 44;
  const divLineGrad = ctx.createLinearGradient(pad + 36, 0, width - pad - 36, 0);
  divLineGrad.addColorStop(0, 'transparent');
  divLineGrad.addColorStop(0.1, 'rgba(212,175,55,0.4)');
  divLineGrad.addColorStop(0.9, 'rgba(212,175,55,0.4)');
  divLineGrad.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.moveTo(pad + 36, y);
  ctx.lineTo(width - pad - 36, y);
  ctx.strokeStyle = divLineGrad;
  ctx.lineWidth = 1;
  ctx.stroke();

  y += 32;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '400 17px Inter, system-ui, sans-serif';
  const summaryText = `${data.dailyStreak} күн үздіксіз оқу  ·  ${data.accuracy}% орташа нәтиже  ·  ${data.testsCompleted} тест орындалды`;
  ctx.fillText(summaryText, cx, y);

  if (data.totalWeeklyTasks > 0) {
    y += 28;
    ctx.fillStyle = 'rgba(212,175,55,0.55)';
    ctx.font = '400 14px Inter, system-ui, sans-serif';
    ctx.fillText(`Соңғы 7 күн ішінде ${data.totalWeeklyTasks} тапсырма орындалды`, cx, y);
  }

  // ─── Seal ─────────────────────────────────────────────────────────────────
  const sealY = y + 60;
  drawSeal(ctx, cx, sealY, 68);

  // ─── Signatures ───────────────────────────────────────────────────────────
  const sigY = sealY + 50;
  const sigW = 200;
  drawSignatureLine(ctx, pad + 80, sigY, sigW, 'Нұрдәулет А.', 'Bext Негізін қалаушы');
  drawSignatureLine(ctx, width - pad - 80 - sigW, sigY, sigW, 'Айгерім Б.', 'Бас оқу сарапшысы');

  // ─── Certificate ID ───────────────────────────────────────────────────────
  const now = new Date();
  const certId = `BXT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Footer divider
  const footerY = height - pad - 44;
  ctx.beginPath();
  ctx.moveTo(pad + 36, footerY - 18);
  ctx.lineTo(width - pad - 36, footerY - 18);
  ctx.strokeStyle = divLineGrad;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#D4AF37';
  ctx.font = '700 12px Inter, system-ui, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('bext.ai', pad + 36, footerY);
  ctx.letterSpacing = '0px';

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(212,175,55,0.45)';
  ctx.font = '400 11px Inter, system-ui, sans-serif';
  ctx.fillText('білім платформасы', cx, footerY);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '400 11px Inter, system-ui, sans-serif';
  ctx.fillText(`ID: ${certId}`, width - pad - 36, footerY);

  return canvas;
}

export async function certificateCanvasToPngBlob(
  canvas: HTMLCanvasElement,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png', 1));
}
