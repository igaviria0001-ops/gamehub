/* =========================================================================
   CRIATURAS — espantos para la Cacería (cada uno cae solo con su contrario)
   y bichos de la Bruma para la campaña (persiguen, muerden, disparan).
   ========================================================================= */
const CREATURES = {
  // espantos de la Cacería: weak = el elemento que los tumba
  llamita:   { name: 'Llamita', look: 'wisp', el: 'fire', weak: 'water', hp: 16, r: 15, speed: 105, pts: 1 },
  gota:      { name: 'Gota', look: 'wisp', el: 'water', weak: 'bolt', hp: 16, r: 15, speed: 105, pts: 1 },
  remolino:  { name: 'Ventarrón', look: 'wisp', el: 'wind', weak: 'earth', hp: 16, r: 15, speed: 125, pts: 1 },
  piedrita:  { name: 'Piedrita', look: 'wisp', el: 'earth', weak: 'plant', hp: 18, r: 15, speed: 90, pts: 1 },
  matojo:    { name: 'Matojo', look: 'wisp', el: 'plant', weak: 'fire', hp: 16, r: 15, speed: 100, pts: 1 },
  chispita:  { name: 'Chispita', look: 'wisp', el: 'bolt', weak: 'wind', hp: 16, r: 15, speed: 130, pts: 1 },
  dorado:    { name: 'Tunjo dorado', look: 'tunjo', el: 'fire', weak: null, hp: 44, r: 17, speed: 165, pts: 5, flee: 1.4 },
  // bichos de la Bruma (campaña)
  bruma:     { name: 'Espanto de bruma', look: 'ghost', el: 'wind', weak: null, hp: 22, r: 16, speed: 115, chase: 1, bite: 8, team: 9 },
  murcielago:{ name: 'Murciélago', look: 'bat', el: 'wind', weak: null, hp: 14, r: 13, speed: 210, chase: 1, bite: 6, swoop: 1, team: 9 },
  golem:     { name: 'Gólem de piedra', look: 'golem', el: 'earth', weak: 'plant', hp: 70, r: 24, speed: 60, chase: 1, bite: 14, throws: 1, team: 9, heavy: 1 },
  caiman:    { name: 'Caimán de niebla', look: 'caiman', el: 'water', weak: 'bolt', hp: 40, r: 20, speed: 95, chase: 1, bite: 12, team: 9, swim: 1 },
  // Mundo 2: cielo e infierno
  centella:  { name: 'Centella', look: 'spark', el: 'light', weak: 'shadow', hp: 16, r: 13, speed: 185, chase: 1, bite: 6, swoop: 1, team: 9, fly: 1, dazzles: 0.45 , soft: 0.5 },
  arpia:     { name: 'Arpía', look: 'harpy', el: 'wind', weak: null, hp: 34, r: 18, speed: 165, chase: 1, bite: 10, swoop: 1, team: 9, fly: 1 },
  nimbo:     { name: 'Nimbo', look: 'nimbus', el: 'bolt', weak: 'earth', hp: 42, r: 20, speed: 70, chase: 1, bite: 6, shoots: 'bolt', team: 9, fly: 1 , soft: 0.5 },
  diablillo: { name: 'Diablillo', look: 'imp', el: 'fire', weak: 'water', hp: 22, r: 15, speed: 135, chase: 1, bite: 8, shoots: 'fire', burns: 1, team: 9 , soft: 0.5 },
  calavera:  { name: 'Calavera', look: 'skull', el: 'shadow', weak: 'light', hp: 28, r: 16, speed: 95, chase: 1, bite: 8, shoots: 'shadow', team: 9, fly: 1 , soft: 0.5 },
  sombra:    { name: 'Sombra', look: 'shade', el: 'shadow', weak: 'light', hp: 24, r: 16, speed: 125, chase: 1, bite: 9, hexes: 2.5, team: 9 , soft: 0.5 },
  cerbero:   { name: 'Cerbero', look: 'hound', el: 'fire', weak: null, hp: 230, r: 30, speed: 115, chase: 1, bite: 16, burns: 1, team: 9, heavy: 1, charge: 1 },
  magma:     { name: 'Criatura de magma', look: 'magma', el: 'fire', weak: 'water', hp: 36, r: 18, speed: 85, chase: 1, bite: 10, burns: 1, team: 9 },
};
const HUNT_KINDS = ['llamita', 'gota', 'remolino', 'piedrita', 'matojo', 'chispita'];
class Creature extends Unit {
  constructor(G, kind, x, y) {
    const D = CREATURES[kind]; super(x, y, D.r, D.team != null ? D.team : -3);
    this.kind = kind; this.D = D; this.maxHp = this.hp = D.hp * (G.hpMul || 1); this.idx = -1; this.el = D.el; this.t = G.rng() * 10; this.dir = G.rng() * TAU; this.cd = 1 + G.rng(); this.spawnT = 0.6; this.knockMul = D.heavy ? 0.4 : 1.2;
    this.untargetable = false;
  }
  hurt(G, dmg, src = {}) {
    if (this.spawnT > 0) return 0;
    const D = this.D; let d = dmg;
    if (D.weak) { const ok = src.el === D.weak || (src.fk && src.fk.includes(D.weak)); d *= ok ? 1.6 : (D.soft || 0.2); if (ok && !src.dot) this.weakHit = 0.3; }
    if (src.by >= 0) this.lastBy = src.by;
    this.hp -= d; this.flash = 0.12;
    G.events.push({ type: 'hurt', x: this.x, y: this.y, dmg: d, el: src.el, dot: !!src.dot, who: -1, unit: this });
    if (this.hp <= 0 && this.alive) { this.alive = false; G.events.push({ type: 'creatureDown', kind: this.kind, by: this.lastBy != null ? this.lastBy : -1, x: this.x, y: this.y, pts: D.pts || 0, unit: this }); G.fx.push({ type: 'boom', x: this.x, y: this.y - 10, r: 50, el: D.el }); }
    return d;
  }
  update(G, dt) {
    const D = this.D; this.t += dt; this.tickStatus(G, dt); if (!this.alive) return;
    if (this.spawnT > 0) this.spawnT -= dt; if (this.weakHit > 0) this.weakHit -= dt; if (this.castT > 0) this.castT -= dt;
    if (this.busy) { this.vx *= 0.9; this.vy *= 0.9; this.x += this.vx * dt; this.y += this.vy * dt; this.collide(G.T); return; }
    let near = null, nd = 1e9; for (const m of G.mages) if (m.alive) { const d = hypot(m.x - this.x, m.y - this.y); if (d < nd) { nd = d; near = m; } }
    if (D.chase && G.objs) for (const o of G.objs) if ((o.t === 'lantern' || o.t === 'canoe') && o.hp > 0) { const d = hypot(o.x - this.x, o.y - this.y) * (D.swoop ? 1.0 : 1.4); if (d < nd) { nd = d; near = { x: o.x, y: o.y, r: 30, vx: 0, vy: 0, hurt() {}, knock() {}, burn() {}, fake: true }; } }
    let tx = Math.cos(this.dir), ty = Math.sin(this.dir), sp = D.speed;
    if (D.chase && near) {
      tx = near.x - this.x; ty = near.y - this.y; const l = hypot(tx, ty) || 1; tx /= l; ty /= l;
      if (D.swoop) { tx += Math.cos(this.t * 3) * 0.7; ty += Math.sin(this.t * 3) * 0.7; }
      if (D.throws) { this.cd -= dt; if (this.cd <= 0 && nd < 420 && nd > 90) { this.cd = 2.6; const a = Math.atan2(near.y - this.y, near.x - this.x); G.spells.push({ t: 'proj', id: -50, age: 0, S: SPELLS.earth[0], by: -1, team: this.team, el: 'earth', x: this.x + Math.cos(a) * 30, y: this.y + Math.sin(a) * 30, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, r: 14, life: 1.4, dmg: 10, heavy: true, power: 1, size: 1 }); } if (nd < 160) sp *= 0.6; }
      if (D.shoots) { this.cd -= dt; if (nd < 210) sp *= -0.5; else if (nd < 330) sp *= 0.15; if (this.cd <= 0 && nd < 470 && !near.fake) { this.cd = D.shoots === 'bolt' ? 3.6 : 3.3; const a = Math.atan2(near.y - this.y, near.x - this.x); this.castT = 0.3;
          if (D.shoots === 'bolt') Camp.foeCast(G, near.x + near.vx * 0.5, near.y + near.vy * 0.5, Object.assign({}, SPELLS.bolt[1], { range: 1, delay: 0.85, r: 44, dmg: 11, stun: 0.3 }), 'bolt');
          else { const sh = D.shoots === 'shadow'; G.spells.push({ t: 'proj', id: -70, age: 0, S: sh ? { dmg: 7, hex: 2.2, speed: 380, r: 12, life: 1.6 } : { dmg: 7, speed: 420, r: 11, life: 1.5 }, by: -1, team: this.team, el: D.shoots, x: this.x + Math.cos(a) * 24, y: this.y + Math.sin(a) * 24, vx: Math.cos(a) * (sh ? 380 : 420), vy: Math.sin(a) * (sh ? 380 : 420), r: sh ? 12 : 11, life: 1.6, dmg: sh ? 7 : 7, power: 1, size: 1 }); G.events.push({ type: 'cast', who: -1, el: D.shoots, kind: 'proj', x: this.x, y: this.y, level: 1 }); } } }
      if (D.charge) { this.chT = (this.chT == null ? 3 : this.chT) - dt; if (this.rush > 0) { this.rush -= dt; tx = this.rdx; ty = this.rdy; sp = 640; } else if (this.wind > 0) { this.wind -= dt; sp = 0; if (this.wind <= 0) { this.rush = 0.5; G.events.push({ type: 'dash', who: -1, x: this.x, y: this.y }); } } else if (this.chT <= 0 && nd < 520 && nd > 120) { this.chT = 4.2; this.wind = 0.7; this.rdx = tx; this.rdy = ty; G.events.push({ type: 'bossWarn', x: this.x, y: this.y, el: 'fire' }); } }
      if (nd < this.r + near.r + 4 && (!this.biteT || G.time - this.biteT > 0.8)) { this.biteT = G.time; const dd = near.hurt(G, D.bite * (G.biteMul || 1) * (this.rush > 0 ? 1.4 : 1), { by: -1, el: D.el }); near.knock(near.x - this.x, near.y - this.y, this.rush > 0 ? 520 : 260); if (D.burns) near.burn(G, 1.5, -1); if (dd > 0 && D.dazzles && near.st) near.st.blind = Math.max(near.st.blind, D.dazzles); if (dd > 0 && D.hexes && near.st) near.st.hex = Math.max(near.st.hex, D.hexes); }
    } else if (near && nd < 220) { const fl = D.flee || 1; tx = this.x - near.x; ty = this.y - near.y; const l = hypot(tx, ty) || 1; tx = tx / l + Math.cos(this.t) * 0.4; ty = ty / l + Math.sin(this.t) * 0.4; sp *= fl; }
    else if (G.rng() < dt * 0.6) this.dir += (G.rng() - 0.5) * 2.4;
    if (this.st.root > 0) sp = 0; if (this.st.slow > 0) sp *= this.st.slowF; if (this.st.chill > 0) sp *= 0.6;
    const T = G.T, i = Terrain.idx(T, this.x + tx * 30, this.y + ty * 30);
    if (i < 0 || Terrain.solid(T, i) || (!D.swim && T.base[i] === TT.DEEP && T.ice[i] <= 0 && !D.chase)) { this.dir += Math.PI * (0.6 + G.rng() * 0.8); }
    if (!D.fly && i >= 0 && T.base[i] === TT.CHASM) { const px2 = -ty, py2 = tx, j = Terrain.idx(T, this.x + px2 * 34, this.y + py2 * 34); if (j >= 0 && T.base[j] !== TT.CHASM) { tx = px2; ty = py2; } else { tx = -px2; ty = -py2; } }
    const k = 1 - Math.exp(-6 * dt); this.vx += (tx * sp - this.vx) * (this.kt > 0 ? k * 0.2 : k); this.vy += (ty * sp - this.vy) * (this.kt > 0 ? k * 0.2 : k);
    this.x += this.vx * dt; this.y += this.vy * dt; this.collide(T);
    const ci = Terrain.idx(T, this.x, this.y); if (ci >= 0 && !D.fly && T.base[ci] === TT.CHASM && !(this.rush > 0)) { this.hurt(G, 14, { by: this.lastBy != null ? this.lastBy : -1, el: 'fall' }); const [sx, sy] = Arena.safeNear(G, this.x, this.y); this.x = sx; this.y = sy; this.vx = this.vy = 0; this.stun(0.6); }
    if (ci >= 0 && !D.fly) { if (T.fire[ci] > 0 && D.el !== 'fire') this.hurt(G, 5 * dt, { by: T.fireO[ci], el: 'fire', dot: 1 }); if (Terrain.isLava(T, ci) && D.el !== 'fire') this.hurt(G, 15 * dt, { el: 'lava', dot: 1 }); if (T.elec[ci] > 0) this.hurt(G, 12 * dt, { by: T.elecO[ci], el: 'bolt', dot: 1 }); }
  }
}
const ArtCreature = (() => {
  function draw(x, G, c) { return ArtBeast.creature(x, G, c); }
  function drawOld(x, G, c) {
    const D = c.D, E = ELEMENTS[D.el], t = c.t, a = c.spawnT > 0 ? 1 - c.spawnT / 0.6 : 1, bob = Math.sin(t * 4) * 3;
    x.save(); x.translate(c.x, c.y); x.globalAlpha = a;
    x.fillStyle = 'rgba(8,6,20,0.35)'; x.beginPath(); x.ellipse(0, 2, c.r, c.r * 0.4, 0, 0, TAU); x.fill();
    if (D.look === 'wisp' || D.look === 'ghost') {
      const R = c.r, Y = -R - 10 + bob, col1 = D.look === 'ghost' ? '#cfc6e8' : E.c1, col2 = D.look === 'ghost' ? '#8a80b0' : E.c2;
      ArtSpells.glow(x, 0, Y, R * 2.6, (D.look === 'ghost' ? '#b0a0ff' : E.c1) + '88');
      x.fillStyle = col2; x.beginPath(); x.moveTo(-R, Y); x.arc(0, Y, R, Math.PI, 0); for (let k = 0; k <= 4; k++) x.lineTo(R - k * R / 2, Y + R * 0.9 + (k % 2 ? -5 : 4) + Math.sin(t * 8 + k) * 2); x.closePath(); x.fill();
      x.fillStyle = col1; x.beginPath(); x.arc(0, Y - 2, R * 0.75, 0, TAU); x.fill();
      x.fillStyle = '#1a1030'; x.beginPath(); x.ellipse(-R * 0.3, Y - 3, 2.6, 3.6, 0, 0, TAU); x.ellipse(R * 0.3, Y - 3, 2.6, 3.6, 0, 0, TAU); x.fill();
      if (D.look === 'wisp') { x.fillStyle = '#fff'; x.fillRect(-R * 0.3 - 1, Y - 5, 1.5, 1.5); x.fillRect(R * 0.3 - 1, Y - 5, 1.5, 1.5); }
    } else if (D.look === 'tunjo') {
      const Y = -24 + bob; ArtSpells.glow(x, 0, Y, 44, 'rgba(255,210,100,0.8)');
      x.fillStyle = '#c8901e'; x.beginPath(); x.moveTo(-9, Y - 14); x.lineTo(9, Y - 14); x.lineTo(12, Y + 16); x.lineTo(-12, Y + 16); x.closePath(); x.fill();
      x.fillStyle = '#ffd25a'; x.beginPath(); x.ellipse(0, Y - 16, 10, 6, 0, 0, TAU); x.fill(); x.fillRect(-7, Y - 6, 14, 2); x.fillRect(-14, Y - 2, 4, 12); x.fillRect(10, Y - 2, 4, 12);
      x.fillStyle = '#7a4a0a'; x.fillRect(-5, Y - 17, 3, 2); x.fillRect(2, Y - 17, 3, 2); x.fillRect(-4, Y + 2, 8, 1.5);
    } else if (D.look === 'bat') {
      const Y = -30 + Math.sin(t * 10) * 4, w = Math.sin(t * 22) * 8;
      x.fillStyle = '#2a2040'; x.beginPath(); x.moveTo(0, Y); x.quadraticCurveTo(-14, Y - 8 - w, -24, Y - 2 + w * 0.5); x.lineTo(-16, Y + 2); x.lineTo(-10, Y - 1); x.lineTo(0, Y + 5); x.lineTo(10, Y - 1); x.lineTo(16, Y + 2); x.lineTo(24, Y - 2 + w * 0.5); x.quadraticCurveTo(14, Y - 8 - w, 0, Y); x.fill();
      x.fillStyle = '#ff5a5a'; x.fillRect(-3, Y - 1, 2, 2); x.fillRect(1, Y - 1, 2, 2);
    } else if (D.look === 'golem') {
      const Y = -6;
      x.fillStyle = '#5e5a52'; x.beginPath(); x.ellipse(0, Y - 20, 22, 24, 0, 0, TAU); x.fill();
      x.fillStyle = '#7a766a'; x.beginPath(); x.ellipse(0, Y - 42, 13, 11, 0, 0, TAU); x.fill();
      x.fillStyle = '#4e9a3a'; x.beginPath(); x.ellipse(-8, Y - 30, 7, 3, 0.4, 0, TAU); x.fill();
      x.fillStyle = '#ffb04a'; x.fillRect(-6, Y - 44, 4, 3); x.fillRect(2, Y - 44, 4, 3);
      x.fillStyle = '#6a665c'; x.beginPath(); x.arc(-24, Y - 18 + Math.sin(t * 3) * 3, 9, 0, TAU); x.arc(24, Y - 18 - Math.sin(t * 3) * 3, 9, 0, TAU); x.fill();
    } else if (D.look === 'caiman') {
      x.save(); x.rotate(Math.atan2(c.vy, c.vx) * 0.3);
      x.fillStyle = '#3a5a52'; x.beginPath(); x.ellipse(0, -8, 26, 10, 0, 0, TAU); x.fill();
      x.fillStyle = '#4a7266'; x.beginPath(); x.ellipse(c.vx >= 0 ? 22 : -22, -9, 14, 6, 0, 0, TAU); x.fill();
      x.fillStyle = '#d8f0e0'; x.fillRect(c.vx >= 0 ? 14 : -18, -15, 4, 3); x.restore();
    } else if (D.look === 'magma') {
      const Y = -22 + bob; ArtSpells.glow(x, 0, Y, 40, 'rgba(255,110,40,0.8)');
      x.fillStyle = '#3a2222'; x.beginPath(); x.ellipse(0, Y, 18, 20, 0, 0, TAU); x.fill();
      x.strokeStyle = '#ff8a2a'; x.lineWidth = 2; x.beginPath(); x.moveTo(-10, Y - 10); x.lineTo(-2, Y); x.lineTo(-8, Y + 10); x.moveTo(8, Y - 12); x.lineTo(2, Y + 2); x.lineTo(9, Y + 12); x.stroke();
      x.fillStyle = '#ffe07a'; x.fillRect(-7, Y - 6, 4, 3); x.fillRect(3, Y - 6, 4, 3);
    }
    if (c.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,255,255,${c.flash * 4})`; x.beginPath(); x.arc(0, -c.r - 8, c.r * 1.1, 0, TAU); x.fill(); x.globalCompositeOperation = 'source-over'; }
    // qué lo tumba
    if (D.weak) { const W = ELEMENTS[D.weak], Y = -c.r * 2 - 26 + bob; x.fillStyle = 'rgba(12,8,30,0.85)'; x.beginPath(); x.arc(0, Y, 10, 0, TAU); x.fill(); x.fillStyle = W.c1; x.beginPath(); x.arc(0, Y, 8, 0, TAU); x.fill(); HUD.icon(x, D.weak, 0, Y, 5.5, '#fff'); }
    if (c.hp < c.maxHp) { x.fillStyle = 'rgba(10,8,25,0.6)'; x.fillRect(-14, -c.r * 2 - 12, 28, 3.5); x.fillStyle = D.weak ? ELEMENTS[D.weak].c1 : '#ffd25a'; x.fillRect(-14, -c.r * 2 - 12, 28 * c.hp / c.maxHp, 3.5); }
    x.restore();
  }
  return { draw };
})();
