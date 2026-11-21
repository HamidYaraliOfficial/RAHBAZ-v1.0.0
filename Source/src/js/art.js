// Procedural top-down vehicle artwork (Canvas 2D). Every vehicle faces +x inside a (L × W) box; the renderer rotates it.
// Each category has its own silhouette and details so vehicles differ by shape, size and equipment – not only colour.
export const COLORS = ['#2D6BFF', '#FF8A1F', '#FFC93C', '#15B887', '#E5484D', '#7C5CFF', '#19B3C9', '#F25C9A', '#F1F5FB', '#9AA7BA', '#1B2B4B'];

function parse(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function hex(r, g, b) { const f = (v) => ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); return '#' + f(r) + f(g) + f(b); }
export function mix(a, b, k) { const A = parse(a), B = parse(b); return hex(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k); }
export const shade = (h, k) => (k >= 0 ? mix(h, '#ffffff', k) : mix(h, '#000000', -k));

export const SKINS = ['classic', 'sport', 'police', 'emergency', 'heavy', 'construction', 'neon', 'retro'];
const SPORT = ['#E5484D', '#2D6BFF', '#FF8A1F', '#FFC93C', '#19B3C9', '#7C5CFF'];
const RETRO = ['#9FD8C5', '#F4B6A0', '#F3E3B3', '#A9C7E8', '#D9B8E8', '#E9A8A8'];
const NEON = ['#19F3E0', '#FF3CAC', '#B8FF3C', '#FF9A3C', '#5C8BFF'];

export function makePal(skin, type, ci) {
  const baseCol = COLORS[ci % COLORS.length];
  let body = baseCol, accent = null, stripe = null, glow = null, outline = 'rgba(8,20,44,.55)', trim = '#DDE5F2', thick = 1;
  const road = ['moto', 'car', 'van', 'bus', 'truck', 'trailer', 'special'].indexOf(type.cat) >= 0;
  if (skin === 'sport' && road) { body = SPORT[ci % SPORT.length]; stripe = '#F1F5FB'; }
  else if (skin === 'police' && road) { body = type.cat === 'truck' || type.cat === 'trailer' ? '#1B2B4B' : '#F1F5FB'; stripe = '#1B2B4B'; accent = '#2D6BFF'; }
  else if (skin === 'emergency' && road) { body = '#F1F5FB'; stripe = '#E5484D'; accent = '#E5484D'; }
  else if (skin === 'heavy') { const g = ['#6C7A92', '#4B5A73', '#8A97AB', '#1B2B4B']; body = g[ci % g.length]; accent = '#FF8A1F'; stripe = '#FF8A1F'; }
  else if (skin === 'construction') { body = ci % 3 === 0 ? '#FF8A1F' : '#FFC93C'; accent = '#1B2B4B'; stripe = '#1B2B4B'; }
  else if (skin === 'neon') { glow = NEON[ci % NEON.length]; body = '#10203F'; accent = glow; stripe = glow; outline = glow; trim = glow; }
  else if (skin === 'retro') { body = RETRO[ci % RETRO.length]; trim = '#FFF6DC'; outline = 'rgba(70,40,30,.75)'; thick = 1.7; stripe = '#FFF6DC'; }
  return {
    body, light: shade(body, 0.28), dark: shade(body, -0.28), deep: shade(body, -0.5), stripe, accent, glow, outline, trim, thick,
    glass: skin === 'neon' ? '#0B1226' : '#223A63', glassHi: skin === 'neon' ? glow : '#6E9BE0', tire: '#0D1424', skin,
    redL: '#FF4B4B', blueL: '#3D7BFF', headL: '#FFF3B0', tailL: '#FF5959', metal: '#C3CCDA', metalD: '#8C97AA', white: '#F1F5FB', dark2: '#1B2B4B',
  };
}

// ---------- primitives ----------
function rr(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r); c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r); c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.closePath();
}
function fill(c, x, y, w, h, r, col) { rr(c, x, y, w, h, r); c.fillStyle = col; c.fill(); }
function vgrad(c, y0, y1, p, base) {
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, shade(base || p.body, 0.3)); g.addColorStop(0.5, base || p.body); g.addColorStop(1, shade(base || p.body, -0.32)); return g;
}
function body(c, x, y, w, h, r, p, u, base) {
  c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = u * 0.1;
  rr(c, x, y, w, h, r); c.fillStyle = vgrad(c, y, y + h, p, base); c.fill(); c.restore();
  rr(c, x, y, w, h, r); c.lineWidth = Math.max(1, u * 0.03 * p.thick); c.strokeStyle = p.outline; c.stroke();
}
function tire(c, x, y, w, h, p) { fill(c, x, y, w, h, Math.min(w, h) * 0.35, p.tire); }
function wheelsPair(c, xs, W, u, tw, th, off) { // tires peeking out on both sides
  for (const x of xs) { tire(c, x - tw / 2, W / 2 - (W / 2 - (off || 0.05) * u), tw, th, { tire: '#0D1424' }); tire(c, x - tw / 2, W - (off || 0.05) * u - th, tw, th, { tire: '#0D1424' }); }
}
function lights(c, x0, x1, y0, y1, u, p) {
  fill(c, x1 - 0.05 * u, y0 + 0.04 * u, 0.07 * u, 0.12 * u, 0.03 * u, p.headL); fill(c, x1 - 0.05 * u, y1 - 0.16 * u, 0.07 * u, 0.12 * u, 0.03 * u, p.headL);
  fill(c, x0 - 0.02 * u, y0 + 0.04 * u, 0.06 * u, 0.12 * u, 0.03 * u, p.tailL); fill(c, x0 - 0.02 * u, y1 - 0.16 * u, 0.06 * u, 0.12 * u, 0.03 * u, p.tailL);
}
function bar(c, x, y, w, h, u, p, kind) { // emergency light bar
  fill(c, x, y, w, h, h * 0.4, '#1A2236');
  if (kind === 'fire') { fill(c, x + w * 0.06, y + h * 0.15, w * 0.42, h * 0.7, h * 0.3, p.redL); fill(c, x + w * 0.52, y + h * 0.15, w * 0.42, h * 0.7, h * 0.3, p.redL); }
  else { fill(c, x + w * 0.06, y + h * 0.15, w * 0.42, h * 0.7, h * 0.3, p.redL); fill(c, x + w * 0.52, y + h * 0.15, w * 0.42, h * 0.7, h * 0.3, p.blueL); }
}
function cross(c, cx, cy, s, col) { fill(c, cx - s * 0.16, cy - s * 0.5, s * 0.32, s, s * 0.05, col); fill(c, cx - s * 0.5, cy - s * 0.16, s, s * 0.32, s * 0.05, col); }
function line(c, x0, y0, x1, y1, w, col) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.stroke(); }
function circle(c, x, y, r, col) { c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fillStyle = col; c.fill(); }
function glassBox(c, x, y, w, h, r, p) { fill(c, x, y, w, h, r, p.glass); fill(c, x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.18, r * 0.5, p.glassHi + '55'); }

// ---------- motorcycles (1×1) ----------
const MOTO = {
  moto_city: { w: 0.1, fr: 'plain', tank: 1 }, moto_sport: { w: 0.1, fr: 'fairing', tank: 1 }, moto_heavy: { w: 0.14, fr: 'bags', tank: 1 },
  scooter: { w: 0.09, fr: 'scooter', tank: 0 }, moto_courier: { w: 0.1, fr: 'box', tank: 1 }, moto_police: { w: 0.11, fr: 'police', tank: 1 },
  trike: { w: 0.1, fr: 'trike', tank: 1 }, bicycle: { w: 0.04, fr: 'bike', tank: 0 },
};
function moto(c, L, W, u, p, t) {
  const m = MOTO[t.id], cy = W / 2;
  const tw = m.fr === 'bike' ? 0.06 : 0.1;
  if (m.fr === 'trike') { tire(c, 0.12 * u, 0.12 * u, 0.28 * u, 0.1 * u, p); tire(c, 0.12 * u, 0.78 * u, 0.28 * u, 0.1 * u, p); tire(c, 0.74 * u, cy - tw * u / 2, 0.22 * u, tw * u, p); }
  else if (m.fr === 'scooter') { tire(c, 0.1 * u, cy - 0.045 * u, 0.2 * u, 0.09 * u, p); tire(c, 0.76 * u, cy - 0.045 * u, 0.2 * u, 0.09 * u, p); }
  else if (m.fr === 'bike') { c.lineWidth = 0.035 * u; c.strokeStyle = '#0D1424'; for (const cx of [0.26 * u, 0.74 * u]) { c.beginPath(); c.ellipse(cx, cy, 0.2 * u, 0.05 * u, 0, 0, 6.3); c.stroke(); } }
  else { tire(c, 0.08 * u, cy - tw * u / 2, 0.28 * u, tw * u, p); tire(c, 0.7 * u, cy - tw * u / 2, 0.28 * u, tw * u, p); }
  if (m.fr === 'bike') { line(c, 0.26 * u, cy, 0.62 * u, cy, 0.04 * u, p.body); line(c, 0.5 * u, cy, 0.74 * u, cy, 0.035 * u, p.dark); }
  else if (m.fr === 'scooter') { body(c, 0.16 * u, cy - 0.17 * u, 0.5 * u, 0.34 * u, 0.15 * u, p, u); fill(c, 0.62 * u, cy - 0.12 * u, 0.16 * u, 0.24 * u, 0.06 * u, p.light); fill(c, 0.22 * u, cy - 0.1 * u, 0.2 * u, 0.2 * u, 0.06 * u, '#1A2236'); }
  else if (m.fr === 'trike') { body(c, 0.14 * u, cy - 0.2 * u, 0.55 * u, 0.4 * u, 0.14 * u, p, u); fill(c, 0.2 * u, cy - 0.13 * u, 0.22 * u, 0.26 * u, 0.06 * u, p.dark); }
  else { body(c, 0.22 * u, cy - 0.11 * u, 0.5 * u, 0.22 * u, 0.1 * u, p, u); fill(c, 0.3 * u, cy - 0.08 * u, 0.18 * u, 0.16 * u, 0.05 * u, '#16203A'); }
  if (m.fr === 'fairing') { c.beginPath(); c.moveTo(0.82 * u, cy); c.lineTo(0.56 * u, cy - 0.17 * u); c.lineTo(0.56 * u, cy + 0.17 * u); c.closePath(); c.fillStyle = p.light; c.fill(); }
  if (m.fr === 'bags') { fill(c, 0.1 * u, cy - 0.24 * u, 0.26 * u, 0.12 * u, 0.04 * u, '#1A2236'); fill(c, 0.1 * u, cy + 0.12 * u, 0.26 * u, 0.12 * u, 0.04 * u, '#1A2236'); }
  if (m.fr === 'box') fill(c, 0.04 * u, cy - 0.22 * u, 0.3 * u, 0.44 * u, 0.06 * u, p.accent || '#FF8A1F');
  if (m.fr === 'police') { fill(c, 0.08 * u, cy - 0.17 * u, 0.2 * u, 0.34 * u, 0.04 * u, '#1B2B4B'); circle(c, 0.18 * u, cy - 0.06 * u, 0.045 * u, p.redL); circle(c, 0.18 * u, cy + 0.06 * u, 0.045 * u, p.blueL); }
  // handlebar + rider
  const hb = m.fr === 'bike' ? 0.2 : 0.26;
  line(c, 0.64 * u, cy - hb * u, 0.64 * u, cy + hb * u, 0.04 * u, '#101827');
  line(c, 0.46 * u, cy - 0.1 * u, 0.64 * u, cy - hb * u * 0.9, 0.05 * u, p.dark2); line(c, 0.46 * u, cy + 0.1 * u, 0.64 * u, cy + hb * u * 0.9, 0.05 * u, p.dark2);
  const ex = m.fr === 'fairing' ? 0.04 : 0;
  c.beginPath(); c.ellipse(0.44 * u + ex * u, cy, 0.1 * u, 0.17 * u, 0, 0, 6.3); c.fillStyle = m.fr === 'police' ? '#1B2B4B' : p.dark2; c.fill();
  circle(c, 0.5 * u + ex * u, cy, 0.095 * u, p.accent && p.skin !== 'classic' ? p.accent : '#F1F5FB'); circle(c, 0.53 * u + ex * u, cy, 0.04 * u, '#22385E');
  circle(c, 0.8 * u, cy, 0.03 * u, p.headL);
}

// ---------- passenger cars (2×1) ----------
const CAR = {
  hatch: { a: 0.2, b: 0.6, r: 0.3 }, sedan: { a: 0.3, b: 0.4, r: 0.24 }, mini: { a: 0.2, b: 0.58, r: 0.36, short: 1 }, luxury: { a: 0.42, b: 0.36, r: 0.2, chrome: 1, dark: 1 },
  sports: { a: 0.46, b: 0.3, r: 0.28, stripe: 1, spoiler: 1 }, suv: { a: 0.17, b: 0.66, r: 0.12, rails: 1 }, crossover: { a: 0.2, b: 0.58, r: 0.18, rails: 1, two: 1 },
  pickup: { a: 0.2, b: 0.28, r: 0.1, bed: 1 }, wanet: { a: 0.1, b: 0.22, r: 0.1, bed: 2 }, taxi: { a: 0.3, b: 0.4, r: 0.22, sign: 1, check: 1 },
  racer: { a: 0.44, b: 0.22, r: 0.32, stripe: 2, spoiler: 1, num: 1 }, classic: { a: 0.36, b: 0.32, r: 0.34, fend: 1, chrome: 1 }, ev: { a: 0.24, b: 0.52, r: 0.34, ev: 1 },
  police_car: { a: 0.3, b: 0.4, r: 0.22, bar: 'police', door: 1 }, ambulance: { a: 0.1, b: 0.2, r: 0.14, amb: 1 }, fire_mini: { a: 0.12, b: 0.22, r: 0.12, ladder: 1, bar: 'fire' },
};
function car(c, L, W, u, p, t) {
  const s = CAR[t.id];
  const x0 = (s.short ? 0.13 : 0.07) * u, x1 = L - (s.short ? 0.13 : 0.07) * u, y0 = 0.14 * u, y1 = W - 0.14 * u, h = y1 - y0, bl = x1 - x0;
  const tw = (t.id === 'racer' ? 0.26 : t.id === 'suv' || t.id === 'pickup' ? 0.28 : 0.24) * u;
  for (const wx of [x0 + 0.26 * u, x1 - 0.3 * u]) { tire(c, wx - tw / 2, 0.05 * u, tw, 0.14 * u, p); tire(c, wx - tw / 2, W - 0.19 * u, tw, 0.14 * u, p); }
  if (s.fend) for (const wx of [x0 + 0.26 * u, x1 - 0.3 * u]) { fill(c, wx - 0.2 * u, 0.1 * u, 0.4 * u, 0.2 * u, 0.1 * u, p.dark); fill(c, wx - 0.2 * u, W - 0.3 * u, 0.4 * u, 0.2 * u, 0.1 * u, p.dark); }
  body(c, x0, y0, bl, h, s.r * u, p, u);
  const cx = x0 + bl * s.a, cw = bl * s.b;
  if (s.amb) { // box ambulance
    glassBox(c, x1 - 0.5 * u, y0 + 0.07 * u, 0.36 * u, h - 0.14 * u, 0.06 * u, p);
    fill(c, x0 + 0.12 * u, y0 + 0.08 * u, bl - 0.78 * u, h - 0.16 * u, 0.06 * u, p.light); cross(c, x0 + (bl - 0.66 * u) / 2 + 0.12 * u, W / 2, 0.34 * u, '#E5484D'); bar(c, x1 - 0.76 * u, y0 + 0.02 * u, 0.2 * u, h - 0.04 * u, u, p); 
    fill(c, x0, y0 + h * 0.46, bl * 0.58, h * 0.08, 0, '#E5484D55');
  } else if (s.bed) { // pickup / utility: cab front, open bed rear
    glassBox(c, x1 - cw - bl * 0.14, y0 + 0.07 * u, cw, h - 0.14 * u, 0.1 * u, p); fill(c, x1 - cw - bl * 0.14 + cw * 0.18, y0 + 0.12 * u, cw * 0.55, h - 0.24 * u, 0.06 * u, p.light);
    const bx = x0 + 0.06 * u, bw = x1 - cw - bl * 0.14 - bx - 0.04 * u; fill(c, bx, y0 + 0.07 * u, bw, h - 0.14 * u, 0.05 * u, '#10192E');
    for (let k = 1; k < 4; k++) line(c, bx + bw * k / 4, y0 + 0.1 * u, bx + bw * k / 4, y1 - 0.1 * u, 0.02 * u, '#26324F');
    if (s.bed === 2) { fill(c, bx + 0.06 * u, y0 + 0.14 * u, bw * 0.55, h - 0.28 * u, 0.04 * u, '#B98A55'); }
  } else {
    fill(c, cx, y0 + 0.06 * u, cw, h - 0.12 * u, 0.12 * u, p.glass);
    fill(c, cx + cw * 0.12, y0 + 0.1 * u, cw * 0.76, h - 0.2 * u, 0.1 * u, s.dark ? '#16203A' : s.two ? p.dark2 : p.light);
    fill(c, cx + cw * 0.84, y0 + 0.09 * u, cw * 0.12, h - 0.18 * u, 0.05 * u, p.glassHi + '66');
  }
  if (s.rails) { line(c, cx + cw * 0.2, y0 + 0.14 * u, cx + cw * 0.85, y0 + 0.14 * u, 0.02 * u, p.metal); line(c, cx + cw * 0.2, y1 - 0.14 * u, cx + cw * 0.85, y1 - 0.14 * u, 0.02 * u, p.metal); }
  if (s.stripe) { const sw = s.stripe === 2 ? 0.14 : 0.1; fill(c, x0 + 0.04 * u, W / 2 - sw * u / 2, bl - 0.08 * u, sw * u, 0, p.stripe || '#F1F5FB'); }
  if (s.spoiler) fill(c, x0 + 0.01 * u, y0 + 0.03 * u, 0.1 * u, h - 0.06 * u, 0.03 * u, p.deep);
  if (s.num) { circle(c, x1 - 0.2 * u, W / 2, 0.1 * u, '#F1F5FB'); circle(c, x1 - 0.2 * u, W / 2, 0.05 * u, p.dark2); }
  if (s.chrome) { line(c, x1 - 0.02 * u, y0 + 0.12 * u, x1 - 0.02 * u, y1 - 0.12 * u, 0.04 * u, p.metal); line(c, x0 + 0.01 * u, y0 + 0.12 * u, x0 + 0.01 * u, y1 - 0.12 * u, 0.04 * u, p.metal); }
  if (s.sign) { fill(c, cx + cw * 0.3, W / 2 - 0.09 * u, cw * 0.38, 0.18 * u, 0.04 * u, '#FFF3B0'); fill(c, cx + cw * 0.36, W / 2 - 0.04 * u, cw * 0.26, 0.08 * u, 0.02 * u, '#8A6B00'); }
  if (s.check) for (let k = 0; k < 6; k++) { fill(c, x0 + 0.14 * u + k * 0.15 * u, y0 + 0.01 * u, 0.075 * u, 0.05 * u, 0, k % 2 ? '#10192E' : '#fff'); fill(c, x0 + 0.14 * u + k * 0.15 * u, y1 - 0.06 * u, 0.075 * u, 0.05 * u, 0, k % 2 ? '#fff' : '#10192E'); }
  if (s.ev) { fill(c, x0 + 0.04 * u, y0 + 0.02 * u, bl - 0.08 * u, 0.04 * u, 0, p.accent || '#19F3E0'); circle(c, x1 - 0.3 * u, y1 - 0.05 * u, 0.04 * u, '#7CFF9A'); }
  if (s.bar) { bar(c, cx + cw * 0.28, y0 + 0.03 * u, cw * 0.44, h - 0.06 * u, u, p, s.bar); }
  if (s.door) { fill(c, cx + cw * 0.9, y0 + 0.01 * u, 0.1 * u, 0.04 * u, 0, '#fff'); fill(c, x0 + 0.1 * u, y0 + 0.01 * u, bl * 0.5, 0.05 * u, 0, '#1B2B4B'); fill(c, x0 + 0.1 * u, y1 - 0.06 * u, bl * 0.5, 0.05 * u, 0, '#1B2B4B'); }
  if (s.ladder) { line(c, x0 + 0.14 * u, y0 + 0.16 * u, x1 - 0.5 * u, y0 + 0.16 * u, 0.03 * u, p.metal); line(c, x0 + 0.14 * u, y1 - 0.16 * u, x1 - 0.5 * u, y1 - 0.16 * u, 0.03 * u, p.metal); for (let k = 0; k < 6; k++) line(c, x0 + 0.2 * u + k * 0.14 * u, y0 + 0.16 * u, x0 + 0.2 * u + k * 0.14 * u, y1 - 0.16 * u, 0.02 * u, p.metalD); }
  if (p.stripe && p.skin !== 'classic' && !s.stripe && !s.door && !s.amb) { fill(c, x0 + 0.08 * u, W / 2 - 0.03 * u, bl * 0.2, 0.06 * u, 0, p.stripe); }
  lights(c, x0, x1, y0, y1, u, p);
}

// ---------- vans & minibuses ----------
const VAN = {
  van_city: { r: 0.14, vent: 1 }, van_cargo: { r: 0.1, ribs: 1, doors: 1 }, van_pass: { r: 0.14, sky: 2 }, van_police: { r: 0.12, bar: 'police', band: 1 },
  minibus_city: { r: 0.14, ac: 1, sky: 2 }, minibus_school: { r: 0.12, school: 1, ac: 0 }, minibus_pass: { r: 0.16, glassRoof: 1, rack: 1 },
};
function boxy(c, L, W, u, p, o) {
  const x0 = 0.06 * u, x1 = L - 0.06 * u, y0 = (o.y0 || 0.11) * u, y1 = W - y0, h = y1 - y0;
  for (const wx of o.wheels || [x0 + 0.3 * u, x1 - 0.32 * u]) { tire(c, wx - 0.13 * u, 0.04 * u, 0.26 * u, 0.12 * u, p); tire(c, wx - 0.13 * u, W - 0.16 * u, 0.26 * u, 0.12 * u, p); }
  body(c, x0, y0, x1 - x0, h, (o.r || 0.14) * u, p, u, o.base);
  return { x0, x1, y0, y1, h };
}
function van(c, L, W, u, p, t) {
  const s = VAN[t.id];
  const base = s.school ? '#F5B800' : null;
  const b = boxy(c, L, W, u, p, { r: s.r, base });
  const bl = b.x1 - b.x0;
  glassBox(c, b.x1 - 0.34 * u, b.y0 + 0.06 * u, 0.26 * u, b.h - 0.12 * u, 0.06 * u, p);
  const rx = b.x0 + 0.1 * u, rw = bl - 0.5 * u;
  fill(c, rx, b.y0 + 0.07 * u, rw, b.h - 0.14 * u, 0.07 * u, s.school ? '#FFD34D' : p.light);
  if (s.vent) { fill(c, rx + rw * 0.35, W / 2 - 0.1 * u, 0.22 * u, 0.2 * u, 0.04 * u, p.metal); }
  if (s.ribs) for (let k = 1; k < 5; k++) line(c, rx + rw * k / 5, b.y0 + 0.1 * u, rx + rw * k / 5, b.y1 - 0.1 * u, 0.02 * u, p.dark);
  if (s.doors) line(c, b.x0 + 0.04 * u, W / 2, b.x0 + 0.04 * u + 0.0, W / 2, 0.02 * u, p.dark);
  if (s.sky) for (let k = 0; k < s.sky; k++) fill(c, rx + 0.08 * u + k * (rw - 0.16 * u) / s.sky, b.y0 + 0.14 * u, (rw - 0.16 * u) / s.sky - 0.06 * u, b.h - 0.28 * u, 0.04 * u, p.glassHi + 'AA');
  if (s.ac) fill(c, rx + rw * 0.55, W / 2 - 0.12 * u, 0.3 * u, 0.24 * u, 0.05 * u, p.metal);
  if (s.glassRoof) { fill(c, rx + 0.04 * u, b.y0 + 0.1 * u, rw - 0.08 * u, b.h - 0.2 * u, 0.06 * u, p.glass); for (let k = 1; k < 4; k++) line(c, rx + rw * k / 4, b.y0 + 0.1 * u, rx + rw * k / 4, b.y1 - 0.1 * u, 0.02 * u, p.glassHi + '88'); }
  if (s.rack) { line(c, rx + 0.1 * u, b.y0 + 0.05 * u, rx + rw - 0.1 * u, b.y0 + 0.05 * u, 0.025 * u, p.metal); line(c, rx + 0.1 * u, b.y1 - 0.05 * u, rx + rw - 0.1 * u, b.y1 - 0.05 * u, 0.025 * u, p.metal); }
  if (s.bar) bar(c, b.x1 - 0.64 * u, b.y0 + 0.02 * u, 0.2 * u, b.h - 0.04 * u, u, p, s.bar);
  if (s.band) { fill(c, b.x0 + 0.05 * u, W / 2 - 0.05 * u, bl * 0.5, 0.1 * u, 0, '#1B2B4B'); }
  if (s.school) { fill(c, b.x0 + 0.04 * u, b.y0 + 0.01 * u, bl - 0.08 * u, 0.045 * u, 0, '#111'); fill(c, b.x0 + 0.04 * u, b.y1 - 0.055 * u, bl - 0.08 * u, 0.045 * u, 0, '#111'); circle(c, b.x1 - 0.08 * u, b.y0 + 0.09 * u, 0.035 * u, p.redL); circle(c, b.x1 - 0.08 * u, b.y1 - 0.09 * u, 0.035 * u, p.redL); }
  lights(c, b.x0, b.x1, b.y0, b.y1, u, p);
}

// ---------- buses ----------
function bus(c, L, W, u, p, t) {
  const id = t.id, school = id === 'bus_school', artic = id === 'bus_artic';
  const base = school ? '#F5B800' : null;
  const wheels = []; for (let x = 0.4 * u; x < L - 0.3 * u; x += (L - 0.9 * u) / (t.len > 3 ? 3 : 2)) wheels.push(x);
  const b = boxy(c, L, W, u, p, { r: 0.15, base, wheels });
  const bl = b.x1 - b.x0;
  glassBox(c, b.x1 - 0.3 * u, b.y0 + 0.06 * u, 0.22 * u, b.h - 0.12 * u, 0.06 * u, p);
  const rx = b.x0 + 0.1 * u, rw = bl - 0.46 * u, ry = b.y0 + 0.07 * u, rh = b.h - 0.14 * u;
  if (artic) {
    const mid = L / 2, gap = 0.2 * u;
    fill(c, rx, ry, mid - gap / 2 - rx, rh, 0.07 * u, p.light); fill(c, mid + gap / 2, ry, b.x1 - 0.36 * u - mid - gap / 2, rh, 0.07 * u, p.light);
    fill(c, mid - gap / 2, b.y0 + 0.02 * u, gap, b.h - 0.04 * u, 0.04 * u, '#141C30');
    for (let k = 0; k < 4; k++) line(c, mid - gap / 2 + gap * (k + 0.5) / 4, b.y0 + 0.04 * u, mid - gap / 2 + gap * (k + 0.5) / 4, b.y1 - 0.04 * u, 0.012 * u, '#3A4660');
    for (const cx of [rx + (mid - rx) * 0.5, mid + (b.x1 - mid) * 0.35]) fill(c, cx - 0.14 * u, W / 2 - 0.11 * u, 0.28 * u, 0.22 * u, 0.05 * u, p.metal);
    fill(c, b.x0 + 0.04 * u, W / 2 - 0.04 * u, bl - 0.08 * u, 0.08 * u, 0, p.accent || '#1B2B4B');
  } else {
    fill(c, rx, ry, rw, rh, 0.08 * u, school ? '#FFD34D' : p.light);
    if (id === 'bus_tour') { for (let k = 0; k < 5; k++) fill(c, rx + 0.08 * u + k * (rw - 0.1 * u) / 5, ry + 0.06 * u, (rw - 0.1 * u) / 5 - 0.05 * u, rh - 0.12 * u, 0.04 * u, p.glassHi + 'B0'); }
    else if (id === 'bus_double') { fill(c, rx + 0.1 * u, ry + 0.04 * u, rw - 0.2 * u, rh - 0.08 * u, 0.06 * u, shade(p.body, 0.18)); fill(c, rx + 0.18 * u, W / 2 - 0.11 * u, 0.26 * u, 0.22 * u, 0.1 * u, '#10192E'); for (let k = 0; k < 4; k++) line(c, rx + 0.5 * u + k * 0.18 * u, ry + 0.1 * u, rx + 0.5 * u + k * 0.18 * u, ry + rh - 0.1 * u, 0.02 * u, p.dark); }
    else if (id === 'bus_ev') { fill(c, rx + 0.1 * u, ry + 0.08 * u, rw - 0.5 * u, rh - 0.16 * u, 0.05 * u, '#0F8C68'); for (let k = 1; k < 5; k++) line(c, rx + 0.1 * u + (rw - 0.5 * u) * k / 5, ry + 0.1 * u, rx + 0.1 * u + (rw - 0.5 * u) * k / 5, ry + rh - 0.1 * u, 0.02 * u, '#0B6B50'); fill(c, rx + rw - 0.36 * u, W / 2 - 0.05 * u, 0.28 * u, 0.1 * u, 0.03 * u, '#7CFF9A'); }
    else { for (let k = 0; k < 3; k++) fill(c, rx + 0.14 * u + k * (rw - 0.2 * u) / 3, W / 2 - 0.12 * u, 0.28 * u, 0.24 * u, 0.05 * u, p.metal); }
    if (id === 'bus_inter') fill(c, b.x0 + 0.06 * u, W / 2 - 0.05 * u, bl * 0.9, 0.1 * u, 0, p.accent || '#FFC93C');
    if (id === 'bus_city') fill(c, b.x0 + 0.05 * u, b.y0 + 0.01 * u, bl - 0.1 * u, 0.06 * u, 0, p.accent || '#FF8A1F');
    if (school) { fill(c, b.x0 + 0.04 * u, b.y0 + 0.01 * u, bl - 0.08 * u, 0.045 * u, 0, '#111'); fill(c, b.x0 + 0.04 * u, b.y1 - 0.055 * u, bl - 0.08 * u, 0.045 * u, 0, '#111'); circle(c, b.x1 - 0.08 * u, b.y0 + 0.09 * u, 0.035 * u, p.redL); circle(c, b.x1 - 0.08 * u, b.y1 - 0.09 * u, 0.035 * u, p.redL); }
  }
  lights(c, b.x0, b.x1, b.y0, b.y1, u, p);
}

// ---------- trucks ----------
function cab(c, x, w, W, u, p, big) { // cab block with windshield, drawn at x..x+w
  const y0 = (big ? 0.12 : 0.14) * u;
  body(c, x, y0, w, W - 2 * y0, 0.14 * u, p, u);
  glassBox(c, x + w - 0.3 * u, y0 + 0.05 * u, 0.24 * u, W - 2 * y0 - 0.1 * u, 0.06 * u, p);
  fill(c, x + 0.08 * u, y0 + 0.07 * u, w - 0.46 * u, W - 2 * y0 - 0.14 * u, 0.07 * u, p.light);
  fill(c, x + w - 0.04 * u, y0 + 0.05 * u, 0.06 * u, 0.12 * u, 0.03 * u, p.headL); fill(c, x + w - 0.04 * u, W - y0 - 0.17 * u, 0.06 * u, 0.12 * u, 0.03 * u, p.headL);
  return y0;
}
function ribs(c, x, y, w, h, n, u, col) { for (let k = 1; k < n; k++) line(c, x + w * k / n, y + 0.04 * u, x + w * k / n, y + h - 0.04 * u, 0.02 * u, col); }
function car2(c, x, y, w, h, col, u) { fill(c, x, y, w, h, h * 0.3, col); fill(c, x + w * 0.3, y + h * 0.15, w * 0.35, h * 0.7, h * 0.2, 'rgba(10,20,40,.55)'); }
function cargoBox(c, kind, x, w, W, u, p) {
  const y0 = 0.1 * u, h = W - 2 * y0;
  if (kind === 'tanker') {
    c.save(); const g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#F4F7FB'); g.addColorStop(0.45, '#BFC9D8'); g.addColorStop(1, '#6F7C92'); rr(c, x, y0 + 0.02 * u, w, h - 0.04 * u, h * 0.45); c.fillStyle = g; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 0.1 * u; c.fill(); c.restore();
    rr(c, x, y0 + 0.02 * u, w, h - 0.04 * u, h * 0.45); c.lineWidth = 0.03 * u; c.strokeStyle = p.outline; c.stroke();
    for (let k = 1; k < 4; k++) line(c, x + w * k / 4, y0 + 0.08 * u, x + w * k / 4, y0 + h - 0.08 * u, 0.025 * u, '#7E8AA0');
    circle(c, x + w * 0.5, W / 2, 0.08 * u, '#566178'); circle(c, x + w * 0.5, W / 2, 0.045 * u, '#9AA7BA'); fill(c, x + w * 0.1, W / 2 - 0.04 * u, w * 0.25, 0.08 * u, 0.04 * u, p.accent || p.body);
    return;
  }
  const base = { cargo: '#4A7BE0', reefer: '#F1F5FB', garbage: '#2FA866', dump: '#F29B1F', fire: p.body, small: '#B7894F', mid: '#E9EEF6', heavy: '#6D7C95', carrier: '#2B3A57', tow: '#26324F', ind: '#4E6B4A', mix: '#C4CCD8', flat: '#2B3A57' }[kind] || p.body;
  body(c, x, y0, w, h, 0.07 * u, p, u, kind === 'fire' ? undefined : base);
  const ix = x + 0.06 * u, iw = w - 0.12 * u, iy = y0 + 0.06 * u, ih = h - 0.12 * u;
  if (kind === 'cargo' || kind === 'mid') { ribs(c, ix, iy, iw, ih, kind === 'cargo' ? 6 : 5, u, 'rgba(0,0,0,.18)'); if (kind === 'cargo') fill(c, ix + iw * 0.05, W / 2 - 0.05 * u, iw * 0.35, 0.1 * u, 0.03 * u, 'rgba(255,255,255,.55)'); }
  if (kind === 'reefer') { fill(c, x + w - 0.2 * u, y0 + 0.08 * u, 0.14 * u, h - 0.16 * u, 0.04 * u, '#5E8FE0'); ribs(c, ix, iy, iw - 0.2 * u, ih, 6, u, 'rgba(0,0,0,.12)'); fill(c, ix, W / 2 - 0.04 * u, iw - 0.3 * u, 0.08 * u, 0, '#2D6BFF'); }
  if (kind === 'garbage') { fill(c, x + 0.05 * u, y0 + 0.08 * u, w * 0.3, h - 0.16 * u, 0.05 * u, '#1C6F43'); fill(c, x + w * 0.4, y0 + 0.06 * u, w * 0.5, h - 0.12 * u, 0.12 * u, '#3DBE7C'); line(c, x + w * 0.4, W / 2, x + w * 0.9, W / 2, 0.02 * u, '#1C6F43'); }
  if (kind === 'dump') { ribs(c, ix, iy, iw, ih, 6, u, 'rgba(0,0,0,.22)'); fill(c, x + 0.02 * u, y0 + 0.02 * u, 0.1 * u, h - 0.04 * u, 0.03 * u, '#8E5A10'); fill(c, ix + iw * 0.15, iy + ih * 0.2, iw * 0.7, ih * 0.6, 0.05 * u, 'rgba(120,70,10,.35)'); }
  if (kind === 'fire') { line(c, ix + 0.04 * u, iy + 0.1 * u, ix + iw - 0.04 * u, iy + 0.1 * u, 0.03 * u, p.metal); line(c, ix + 0.04 * u, iy + ih - 0.1 * u, ix + iw - 0.04 * u, iy + ih - 0.1 * u, 0.03 * u, p.metal); for (let k = 0; k < 9; k++) line(c, ix + 0.1 * u + k * (iw - 0.2 * u) / 8, iy + 0.1 * u, ix + 0.1 * u + k * (iw - 0.2 * u) / 8, iy + ih - 0.1 * u, 0.02 * u, p.metalD); fill(c, x + w * 0.12, W / 2 - 0.08 * u, w * 0.14, 0.16 * u, 0.04 * u, '#111'); bar(c, x + w * 0.35, y0 + 0.01 * u, 0.2 * u, h - 0.02 * u, u, p, 'fire'); }
  if (kind === 'small') { ribs(c, ix, iy, iw, ih, 4, u, 'rgba(0,0,0,.2)'); fill(c, ix, iy, iw, ih, 0.04 * u, 'rgba(0,0,0,.12)'); }
  if (kind === 'heavy') { fill(c, ix, iy + ih * 0.1, iw, ih * 0.8, 0.05 * u, '#55657F'); ribs(c, ix, iy, iw, ih, 8, u, 'rgba(255,255,255,.14)'); }
  if (kind === 'carrier') { fill(c, ix, iy, iw, ih, 0.04 * u, '#16203A'); const cw = iw * 0.46; car2(c, ix + 0.02 * u, iy + 0.04 * u, cw, ih * 0.44, '#E5484D', u); car2(c, ix + iw * 0.5, iy + 0.04 * u, cw, ih * 0.44, '#FFC93C', u); car2(c, ix + 0.02 * u, iy + ih * 0.52, cw, ih * 0.44, '#19B3C9', u); car2(c, ix + iw * 0.5, iy + ih * 0.52, cw, ih * 0.44, '#F1F5FB', u); }
  if (kind === 'tow') { for (let k = 0; k < 7; k++) { c.save(); c.beginPath(); c.rect(ix, iy, iw, ih); c.clip(); line(c, ix + k * 0.2 * u - 0.1 * u, iy + ih, ix + k * 0.2 * u + 0.3 * u, iy, 0.07 * u, k % 2 ? '#FFC93C' : '#111'); c.restore(); } circle(c, x + w - 0.14 * u, W / 2, 0.06 * u, '#FFB020'); }
  if (kind === 'ind') { fill(c, ix + 0.04 * u, iy + 0.06 * u, iw - 0.08 * u, ih - 0.12 * u, 0.1 * u, '#6E8F69'); line(c, ix + iw * 0.5, iy + 0.06 * u, ix + iw * 0.5, iy + ih - 0.06 * u, 0.025 * u, '#3C5238'); }
}
const TRUCK = { truck_small: 'small', truck_mid: 'mid', truck_heavy: 'heavy', truck_cargo: 'cargo', truck_reefer: 'reefer', truck_carcarrier: 'carrier', truck_tanker: 'tanker', truck_garbage: 'garbage', truck_dump: 'dump', truck_fire: 'fire', truck_tow: 'tow' };
function truck(c, L, W, u, p, t) {
  const kind = TRUCK[t.id];
  const cw = (kind === 'small' ? 0.8 : 0.92) * u, bx = 0.07 * u, bw = L - cw - 0.2 * u;
  const wh = [bx + bw * 0.3, bx + bw * 0.62, L - 0.32 * u]; if (t.len < 4) wh.splice(1, 1);
  for (const wx of wh) { tire(c, wx - 0.14 * u, 0.04 * u, 0.28 * u, 0.12 * u, p); tire(c, wx - 0.14 * u, W - 0.16 * u, 0.28 * u, 0.12 * u, p); }
  line(c, bx + bw, W / 2, L - cw, W / 2, 0.08 * u, '#1A2236');
  cargoBox(c, kind, bx, bw, W, u, p.skin === 'classic' || kind !== 'fire' ? Object.assign({}, p) : p);
  cab(c, L - cw - 0.04 * u, cw, W, u, p);
  if (kind === 'fire' || kind === 'tow') fill(c, L - cw + 0.1 * u, W / 2 - 0.06 * u, 0.12 * u, 0.12 * u, 0.04 * u, kind === 'tow' ? '#FFB020' : p.redL);
}

// ---------- semi-trailers ----------
const TRAILER = { semi: 'box', flatbed: 'flat', container: 'cont', reefer_trailer: 'reefer', tanker_trailer: 'tank', car_trailer: 'cars', heavy_hauler: 'low', rigid_artic: 'rigid' };
function trailer(c, L, W, u, p, t) {
  if (t.id === 'tractor_unit') { // cab with fifth wheel plate
    for (const wx of [0.8 * u, L - 0.32 * u]) { tire(c, wx - 0.15 * u, 0.04 * u, 0.3 * u, 0.12 * u, p); tire(c, wx - 0.15 * u, W - 0.16 * u, 0.3 * u, 0.12 * u, p); }
    fill(c, 0.14 * u, 0.15 * u, 1.3 * u, W - 0.3 * u, 0.06 * u, '#1A2236'); circle(c, 0.55 * u, W / 2, 0.26 * u, '#566178'); circle(c, 0.55 * u, W / 2, 0.14 * u, '#2B3650'); fill(c, 0.5 * u, W / 2 - 0.03 * u, 0.3 * u, 0.06 * u, 0, '#2B3650');
    cab(c, L - 1.5 * u, 1.45 * u, W, u, p, true); fill(c, L - 1.45 * u, 0.2 * u, 0.5 * u, W - 0.4 * u, 0.06 * u, p.dark); fill(c, L - 0.62 * u, 0.19 * u, 0.12 * u, 0.11 * u, 0.03 * u, p.metal); return;
  }
  const kind = TRAILER[t.id], cabw = kind === 'rigid' ? 0.9 * u : 1.2 * u, gap = 0.1 * u, tx = 0.05 * u, tl = L - cabw - gap - 0.1 * u;
  const wheels = kind === 'low' ? [0.5, 0.9, 1.3, 1.7].map((k) => tx + k * u) : [tx + tl - 0.55 * u, tx + tl - 0.2 * u];
  for (const wx of wheels) { tire(c, wx - 0.14 * u, 0.04 * u, 0.28 * u, 0.12 * u, p); tire(c, wx - 0.14 * u, W - 0.16 * u, 0.28 * u, 0.12 * u, p); }
  for (const wx of [L - 0.3 * u, L - cabw + 0.1 * u]) { tire(c, wx - 0.14 * u, 0.04 * u, 0.28 * u, 0.12 * u, p); tire(c, wx - 0.14 * u, W - 0.16 * u, 0.28 * u, 0.12 * u, p); }
  line(c, tx + tl, W / 2, L - cabw, W / 2, 0.08 * u, '#1A2236'); circle(c, tx + tl + 0.02 * u, W / 2, 0.07 * u, '#566178');
  const y0 = 0.1 * u, h = W - 0.2 * u;
  if (kind === 'tank') cargoBox(c, 'tanker', tx, tl, W, u, p);
  else if (kind === 'flat') { fill(c, tx, y0 + 0.04 * u, tl, h - 0.08 * u, 0.04 * u, '#26324F'); for (let k = 0; k < 4; k++) { fill(c, tx + 0.12 * u + k * (tl - 0.2 * u) / 4, y0 + 0.1 * u, (tl - 0.2 * u) / 4 - 0.06 * u, h - 0.2 * u, 0.04 * u, ['#C58B4A', '#B07A3E', '#D79B58', '#A66F35'][k]); line(c, tx + 0.12 * u + k * (tl - 0.2 * u) / 4 + (tl - 0.2 * u) / 8, y0 + 0.1 * u, tx + 0.12 * u + k * (tl - 0.2 * u) / 4 + (tl - 0.2 * u) / 8, y0 + h - 0.1 * u, 0.02 * u, 'rgba(0,0,0,.25)'); } }
  else if (kind === 'cont') { body(c, tx, y0, tl, h, 0.04 * u, p, u, COLORS[(t.col + 6) % 11]); const iw = tl - 0.1 * u; for (let k = 0; k < 14; k++) line(c, tx + 0.05 * u + iw * (k + 0.5) / 14, y0 + 0.05 * u, tx + 0.05 * u + iw * (k + 0.5) / 14, y0 + h - 0.05 * u, 0.025 * u, 'rgba(0,0,0,.28)'); fill(c, tx + 0.04 * u, y0 + 0.02 * u, 0.14 * u, h - 0.04 * u, 0.02 * u, 'rgba(0,0,0,.3)'); }
  else if (kind === 'reefer') cargoBox(c, 'reefer', tx, tl, W, u, p);
  else if (kind === 'cars') { body(c, tx, y0, tl, h, 0.05 * u, p, u, '#2B3A57'); const cw2 = (tl - 0.2 * u) / 3; const cols = ['#E5484D', '#FFC93C', '#19B3C9', '#F1F5FB', '#7C5CFF', '#15B887']; for (let k = 0; k < 3; k++) { car2(c, tx + 0.08 * u + k * cw2, y0 + 0.06 * u, cw2 - 0.05 * u, h * 0.44, cols[k], u); car2(c, tx + 0.08 * u + k * cw2, y0 + h * 0.52, cw2 - 0.05 * u, h * 0.42, cols[k + 3], u); } }
  else if (kind === 'low') { fill(c, tx, y0 + 0.06 * u, tl, h - 0.12 * u, 0.05 * u, '#26324F'); fill(c, tx + 0.5 * u, y0 + 0.14 * u, tl - 0.9 * u, h - 0.28 * u, 0.1 * u, '#F2B705'); fill(c, tx + 0.7 * u, W / 2 - 0.16 * u, 0.5 * u, 0.32 * u, 0.06 * u, '#7B5A00'); line(c, tx + 1.2 * u, W / 2, tx + tl - 0.55 * u, W / 2, 0.1 * u, '#C99700'); fill(c, tx + tl - 0.6 * u, W / 2 - 0.2 * u, 0.3 * u, 0.4 * u, 0.04 * u, '#8A6500'); }
  else if (kind === 'rigid') { cargoBox(c, 'cargo', tx, tl, W, u, p); }
  else cargoBox(c, 'mid', tx, tl, W, u, p);
  if (kind === 'box') { body(c, tx, y0, tl, h, 0.05 * u, p, u, '#E9EEF6'); ribs(c, tx + 0.06 * u, y0 + 0.06 * u, tl - 0.12 * u, h - 0.12 * u, 9, u, 'rgba(0,0,0,.13)'); fill(c, tx + tl * 0.15, W / 2 - 0.06 * u, tl * 0.5, 0.12 * u, 0.03 * u, p.body); }
  cab(c, L - cabw - 0.02 * u, cabw, W, u, p, true);
}

// ---------- construction & industrial machines ----------
function tracks(c, x, w, W, u, p) {
  for (const y of [0.04 * u, W - 0.4 * u]) { fill(c, x, y, w, 0.36 * u, 0.14 * u, '#1A2236'); for (let k = 0; k < Math.floor(w / (0.13 * u)); k++) line(c, x + 0.1 * u + k * 0.13 * u, y + 0.05 * u, x + 0.1 * u + k * 0.13 * u, y + 0.31 * u, 0.025 * u, '#38465F'); }
}
function bigWheel(c, x, y, w, h, p) { fill(c, x, y, w, h, h * 0.3, '#0D1424'); fill(c, x + w * 0.15, y + h * 0.18, w * 0.7, h * 0.64, h * 0.2, '#1E2A44'); }
function machine(c, L, W, u, p, t) {
  const id = t.id;
  if (id === 'excavator') {
    tracks(c, 0.1 * u, L - 0.9 * u, W, u, p);
    body(c, 0.3 * u, 0.4 * u, L - 1.2 * u, W - 0.8 * u, 0.2 * u, p, u); glassBox(c, L - 1.15 * u, 0.5 * u, 0.5 * u, 0.55 * u, 0.1 * u, p); fill(c, 0.4 * u, 0.55 * u, 0.5 * u, W - 1.1 * u, 0.1 * u, p.dark);
    line(c, L - 0.9 * u, 0.9 * u, L - 0.2 * u, W / 2 - 0.1 * u, 0.2 * u, p.dark); line(c, L - 1.0 * u, 0.9 * u, L - 0.3 * u, W / 2 - 0.1 * u, 0.1 * u, p.light);
    c.beginPath(); c.moveTo(L - 0.28 * u, W / 2 - 0.35 * u); c.lineTo(L, W / 2 - 0.15 * u); c.lineTo(L, W / 2 + 0.25 * u); c.lineTo(L - 0.28 * u, W / 2 + 0.05 * u); c.closePath(); c.fillStyle = '#4A5775'; c.fill(); c.strokeStyle = p.outline; c.lineWidth = 0.03 * u; c.stroke(); return;
  }
  if (id === 'loader') {
    for (const [x, y] of [[0.2, 0.04], [0.2, 1.64], [1.0, 0.04], [1.0, 1.64]]) bigWheel(c, x * u, y * u, 0.5 * u, 0.32 * u, p);
    body(c, 0.15 * u, 0.3 * u, L - 0.8 * u, W - 0.6 * u, 0.16 * u, p, u); glassBox(c, 0.7 * u, 0.55 * u, 0.5 * u, W - 1.1 * u, 0.1 * u, p); fill(c, 0.25 * u, 0.5 * u, 0.4 * u, W - 1.0 * u, 0.08 * u, p.dark);
    fill(c, L - 0.5 * u, 0.12 * u, 0.42 * u, W - 0.24 * u, 0.1 * u, '#4A5775'); for (let k = 0; k < 6; k++) fill(c, L - 0.12 * u, 0.2 * u + k * (W - 0.5 * u) / 6, 0.12 * u, 0.1 * u, 0.02 * u, '#C3CCDA'); return;
  }
  if (id === 'bulldozer') {
    tracks(c, 0.2 * u, L - 0.8 * u, W, u, p);
    body(c, 0.3 * u, 0.4 * u, L - 1.0 * u, W - 0.8 * u, 0.18 * u, p, u); glassBox(c, 0.8 * u, 0.5 * u, 0.5 * u, W - 1.0 * u, 0.1 * u, p); fill(c, 0.38 * u, 0.55 * u, 0.3 * u, W - 1.1 * u, 0.06 * u, p.dark);
    fill(c, L - 0.34 * u, 0.12 * u, 0.3 * u, W - 0.24 * u, 0.1 * u, '#4A5775'); line(c, L - 0.4 * u, 0.55 * u, L - 0.22 * u, 0.55 * u, 0.1 * u, p.dark); line(c, L - 0.4 * u, W - 0.55 * u, L - 0.22 * u, W - 0.55 * u, 0.1 * u, p.dark); fill(c, 0.02 * u, W / 2 - 0.1 * u, 0.22 * u, 0.2 * u, 0.04 * u, '#26324F'); return;
  }
  if (id === 'roller') {
    fill(c, 0.12 * u, 0.1 * u, 0.78 * u, W - 0.2 * u, 0.2 * u, '#7E8AA0'); fill(c, L - 0.9 * u, 0.1 * u, 0.78 * u, W - 0.2 * u, 0.2 * u, '#7E8AA0');
    for (let k = 1; k < 8; k++) { line(c, 0.12 * u + 0.78 * u * k / 8, 0.14 * u, 0.12 * u + 0.78 * u * k / 8, W - 0.14 * u, 0.02 * u, '#5B6679'); line(c, L - 0.9 * u + 0.78 * u * k / 8, 0.14 * u, L - 0.9 * u + 0.78 * u * k / 8, W - 0.14 * u, 0.02 * u, '#5B6679'); }
    body(c, 0.7 * u, 0.5 * u, L - 1.4 * u + 0.1 * u, W - 1.0 * u, 0.12 * u, p, u); glassBox(c, 0.78 * u, 0.62 * u, L - 1.6 * u + 0.2 * u, W - 1.24 * u, 0.1 * u, p); return;
  }
  if (id === 'forklift') {
    tire(c, 0.2 * u, 0.1 * u, 0.3 * u, 0.15 * u, p); tire(c, 0.2 * u, W - 0.25 * u, 0.3 * u, 0.15 * u, p); tire(c, 0.9 * u, 0.1 * u, 0.3 * u, 0.15 * u, p); tire(c, 0.9 * u, W - 0.25 * u, 0.3 * u, 0.15 * u, p);
    body(c, 0.15 * u, 0.2 * u, 1.1 * u, W - 0.4 * u, 0.14 * u, p, u); fill(c, 0.28 * u, 0.3 * u, 0.4 * u, W - 0.6 * u, 0.08 * u, p.dark); line(c, 0.75 * u, 0.2 * u, 0.75 * u, W - 0.2 * u, 0.04 * u, '#26324F'); line(c, 1.1 * u, 0.2 * u, 1.1 * u, W - 0.2 * u, 0.04 * u, '#26324F');
    fill(c, 1.2 * u, 0.28 * u, 0.7 * u, 0.1 * u, 0.03 * u, '#8C97AA'); fill(c, 1.2 * u, W - 0.38 * u, 0.7 * u, 0.1 * u, 0.03 * u, '#8C97AA'); fill(c, 1.1 * u, 0.2 * u, 0.1 * u, W - 0.4 * u, 0.03 * u, '#26324F'); return;
  }
  if (id === 'crane') {
    for (const [x, y] of [[0.1, 0.0], [0.1, 1.82], [L / u - 0.7, 0.0], [L / u - 0.7, 1.82]]) fill(c, x * u, y * u, 0.6 * u, 0.18 * u, 0.04 * u, '#26324F');
    for (const x of [0.5 * u, 1.4 * u, 2.3 * u]) { tire(c, x - 0.15 * u, 0.2 * u, 0.3 * u, 0.2 * u, p); tire(c, x - 0.15 * u, W - 0.4 * u, 0.3 * u, 0.2 * u, p); }
    body(c, 0.1 * u, 0.4 * u, L - 0.2 * u, W - 0.8 * u, 0.14 * u, p, u); cab(c, L - 0.85 * u, 0.8 * u, W, u, p); 
    fill(c, 0.2 * u, 0.55 * u, L - 1.2 * u, 0.35 * u, 0.05 * u, '#4A5775'); for (let k = 0; k < 9; k++) { line(c, 0.3 * u + k * 0.2 * u, 0.57 * u, 0.4 * u + k * 0.2 * u, 0.88 * u, 0.018 * u, '#C3CCDA'); line(c, 0.4 * u + k * 0.2 * u, 0.57 * u, 0.3 * u + k * 0.2 * u, 0.88 * u, 0.018 * u, '#C3CCDA'); }
    circle(c, 0.5 * u, W / 2 + 0.15 * u, 0.2 * u, '#26324F'); return;
  }
  if (id === 'mixer') {
    for (const x of [0.5 * u, 1.2 * u, L - 0.3 * u]) { tire(c, x - 0.14 * u, 0.04 * u, 0.28 * u, 0.12 * u, p); tire(c, x - 0.14 * u, W - 0.16 * u, 0.28 * u, 0.12 * u, p); }
    c.save(); const g = c.createLinearGradient(0, 0, 0, W); g.addColorStop(0, '#F1F5FB'); g.addColorStop(0.5, '#C4CCD8'); g.addColorStop(1, '#7E8AA0'); rr(c, 0.07 * u, 0.1 * u, L - 1.1 * u, W - 0.2 * u, 0.4 * u); c.fillStyle = g; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 0.1 * u; c.fill(); c.restore();
    for (let k = 0; k < 7; k++) { c.save(); rr(c, 0.07 * u, 0.1 * u, L - 1.1 * u, W - 0.2 * u, 0.4 * u); c.clip(); line(c, 0.1 * u + k * 0.28 * u, W, 0.3 * u + k * 0.28 * u, 0, 0.08 * u, p.body); c.restore(); }
    circle(c, L - 1.05 * u, W / 2, 0.1 * u, '#566178'); cab(c, L - 0.95 * u, 0.9 * u, W, u, p); return;
  }
  if (id === 'mining') {
    for (const [x, y] of [[0.2, 0.0], [0.2, 1.62], [1.8, 0.0], [1.8, 1.62]]) bigWheel(c, x * u, y * u, 0.7 * u, 0.38 * u, p);
    body(c, 0.1 * u, 0.3 * u, L - 0.9 * u, W - 0.6 * u, 0.14 * u, p, u, '#F2B705'); for (let k = 1; k < 9; k++) line(c, 0.2 * u + (L - 1.1 * u) * k / 9, 0.4 * u, 0.2 * u + (L - 1.1 * u) * k / 9, W - 0.4 * u, 0.025 * u, '#B38700');
    fill(c, 0.3 * u, 0.6 * u, L - 1.5 * u, W - 1.2 * u, 0.08 * u, 'rgba(90,60,0,.45)'); body(c, L - 0.9 * u, 0.5 * u, 0.85 * u, 0.7 * u, 0.1 * u, p, u); glassBox(c, L - 0.5 * u, 0.58 * u, 0.4 * u, 0.54 * u, 0.06 * u, p); return;
  }
  if (id === 'tractor') {
    tire(c, 0.1 * u, 0.04 * u, 0.5 * u, 0.2 * u, p); tire(c, 0.1 * u, W - 0.24 * u, 0.5 * u, 0.2 * u, p); tire(c, 1.5 * u, 0.1 * u, 0.3 * u, 0.12 * u, p); tire(c, 1.5 * u, W - 0.22 * u, 0.3 * u, 0.12 * u, p);
    body(c, 0.7 * u, 0.28 * u, L - 0.8 * u, W - 0.56 * u, 0.12 * u, p, u); body(c, 0.2 * u, 0.2 * u, 0.9 * u, W - 0.4 * u, 0.12 * u, p, u); glassBox(c, 0.3 * u, 0.3 * u, 0.7 * u, W - 0.6 * u, 0.08 * u, p); fill(c, 0.38 * u, 0.36 * u, 0.5 * u, W - 0.72 * u, 0.06 * u, p.dark); circle(c, L - 0.4 * u, W / 2, 0.05 * u, '#26324F'); return;
  }
  if (id === 'harvester') {
    fill(c, L - 0.5 * u, 0.05 * u, 0.45 * u, W - 0.1 * u, 0.08 * u, '#B07A3E'); for (let k = 0; k < 9; k++) line(c, L - 0.48 * u, 0.12 * u + k * (W - 0.3 * u) / 8, L - 0.08 * u, 0.12 * u + k * (W - 0.3 * u) / 8, 0.05 * u, k % 2 ? '#F2B705' : '#E5484D');
    for (const [x, y] of [[0.5, 0.0], [0.5, 1.7], [1.8, 0.0], [1.8, 1.8]]) tire(c, x * u, y * u, 0.6 * u, 0.3 * u, p);
    body(c, 0.1 * u, 0.35 * u, L - 0.65 * u, W - 0.7 * u, 0.12 * u, p, u); glassBox(c, L - 1.4 * u, 0.5 * u, 0.6 * u, W - 1.0 * u, 0.1 * u, p); fill(c, 0.25 * u, 0.5 * u, 1.2 * u, W - 1.0 * u, 0.1 * u, '#D9A441'); line(c, 0.6 * u, W / 2, 1.5 * u, W / 2, 0.03 * u, '#8A5A10'); return;
  }
  if (id === 'snowplow') {
    for (const x of [0.5 * u, 1.3 * u]) { tire(c, x - 0.14 * u, 0.04 * u, 0.28 * u, 0.12 * u, p); tire(c, x - 0.14 * u, W - 0.16 * u, 0.28 * u, 0.12 * u, p); }
    fill(c, 0.07 * u, 0.12 * u, 1.2 * u, W - 0.24 * u, 0.08 * u, '#4A5775'); for (let k = 0; k < 6; k++) circle(c, 0.25 * u + k * 0.18 * u, W / 2, 0.05 * u, '#F1F5FB');
    cab(c, 1.3 * u, 0.95 * u, W, u, p); fill(c, 1.4 * u, W / 2 - 0.06 * u, 0.1 * u, 0.12 * u, 0.03 * u, '#FFB020');
    c.beginPath(); c.moveTo(L - 0.25 * u, 0.02 * u); c.lineTo(L, 0.1 * u); c.lineTo(L, W - 0.1 * u); c.lineTo(L - 0.25 * u, W - 0.02 * u); c.closePath(); c.fillStyle = '#F29B1F'; c.fill(); c.strokeStyle = p.outline; c.lineWidth = 0.03 * u; c.stroke(); return;
  }
  // industrial garbage compactor
  for (const x of [0.5 * u, 1.2 * u, L - 0.3 * u]) { tire(c, x - 0.14 * u, 0.04 * u, 0.28 * u, 0.12 * u, p); tire(c, x - 0.14 * u, W - 0.16 * u, 0.28 * u, 0.12 * u, p); }
  cargoBox(c, 'ind', 0.07 * u, L - 1.1 * u, W, u, p); fill(c, 0.1 * u, 0.15 * u, 0.4 * u, W - 0.3 * u, 0.05 * u, '#26324F'); cab(c, L - 0.95 * u, 0.9 * u, W, u, p);
}

// ---------- special service vehicles ----------
function special(c, L, W, u, p, t) {
  const id = t.id;
  if (id === 'road_service' || id === 'city_service') {
    const b = boxy(c, L, W, u, p, { r: 0.2 }); glassBox(c, b.x1 - 0.5 * u, b.y0 + 0.07 * u, 0.4 * u, b.h - 0.14 * u, 0.08 * u, p);
    fill(c, b.x0 + 0.12 * u, b.y0 + 0.08 * u, L - 0.9 * u, b.h - 0.16 * u, 0.06 * u, p.light);
    if (id === 'road_service') { fill(c, b.x0 + 0.2 * u, W / 2 - 0.07 * u, 0.5 * u, 0.14 * u, 0.04 * u, '#FFB020'); circle(c, b.x1 - 0.7 * u, W / 2, 0.07 * u, '#FF8A1F'); for (let k = 0; k < 5; k++) line(c, b.x0 + 0.14 * u, b.y0 + 0.14 * u + k * 0.1 * u, b.x0 + 0.5 * u, b.y0 + 0.14 * u + k * 0.1 * u, 0.02 * u, '#26324F'); }
    else { fill(c, b.x0 + 0.2 * u, W / 2 - 0.09 * u, 0.55 * u, 0.18 * u, 0.04 * u, '#F1F5FB'); fill(c, b.x0 + 0.26 * u, W / 2 - 0.04 * u, 0.4 * u, 0.08 * u, 0.02 * u, '#15B887'); circle(c, b.x1 - 0.7 * u, W / 2, 0.06 * u, '#FFB020'); }
    lights(c, b.x0, b.x1, b.y0, b.y1, u, p); return;
  }
  const b = boxy(c, L, W, u, p, { r: 0.12 });
  glassBox(c, b.x1 - 0.36 * u, b.y0 + 0.06 * u, 0.28 * u, b.h - 0.12 * u, 0.06 * u, p);
  const rx = b.x0 + 0.1 * u, rw = L - 0.9 * u;
  if (id === 'money') { fill(c, rx, b.y0 + 0.07 * u, rw, b.h - 0.14 * u, 0.06 * u, '#566178'); for (let k = 0; k < 3; k++) fill(c, rx + 0.1 * u + k * rw / 3, W / 2 - 0.05 * u, rw / 3 - 0.2 * u, 0.1 * u, 0.02 * u, '#10192E'); circle(c, rx + rw - 0.15 * u, W / 2, 0.07 * u, '#F2B705'); }
  else if (id === 'animal') { fill(c, rx, b.y0 + 0.07 * u, rw, b.h - 0.14 * u, 0.06 * u, p.light); for (let k = 0; k < 7; k++) line(c, rx + 0.08 * u + k * (rw - 0.16 * u) / 6, b.y0 + 0.12 * u, rx + 0.08 * u + k * (rw - 0.16 * u) / 6, b.y1 - 0.12 * u, 0.03 * u, '#8C97AA'); circle(c, rx + rw * 0.5, W / 2 + 0.03 * u, 0.07 * u, '#8A5A10'); for (const [dx, dy] of [[-0.09, -0.1], [0, -0.14], [0.09, -0.1]]) circle(c, rx + rw * 0.5 + dx * u, W / 2 + dy * u, 0.03 * u, '#8A5A10'); }
  else { fill(c, rx, b.y0 + 0.07 * u, rw, b.h - 0.14 * u, 0.06 * u, p.light); for (let k = 0; k < 3; k++) fill(c, rx + 0.08 * u + k * (rw - 0.1 * u) / 3, b.y0 + 0.14 * u, (rw - 0.1 * u) / 3 - 0.08 * u, b.h - 0.28 * u, 0.04 * u, '#B73A3A'); bar(c, rx + rw - 0.35 * u, b.y0 + 0.02 * u, 0.26 * u, b.h - 0.04 * u, u, p, 'fire'); cross(c, rx + 0.3 * u, W / 2, 0.2 * u, '#F1F5FB'); }
  lights(c, b.x0, b.x1, b.y0, b.y1, u, p);
}

const DRAW = { moto, car, van, bus, truck, trailer, machine, special };

// Draw one vehicle into context c at origin, size (L × W) px, facing +x. u = cell size in px.
export function drawVehicleArt(c, type, L, W, u, pal) {
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  if (pal.glow) { c.shadowColor = pal.glow; c.shadowBlur = u * 0.22; }
  DRAW[type.art](c, L, W, u, pal, type);
  c.restore();
}
