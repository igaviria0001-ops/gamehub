// Travesía en equipo: cada desafío jugado por dos máquinas en los puestos de las personas (¿se puede ganar? ¿cuánto tarda? ¿errores?)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const which = (process.env.ST || '0,1,2,3,4,5,6,7,8,9').split(',').map(Number), L = +(process.env.L || 1);
  for (const st of which) {
    const r = await page.evaluate(async ([st, L]) => {
      const { Game, Bot, UI, STAGES } = VTO, S = STAGES[st], D = S.duo;
      Game.start(D.mode, 2, { id: S.id, arena: D.arena || S.arena, duo: true, coop: D.team || null, tcfg: D, hard: !!D.hard, wins: 1 }); UI.show(null, false);
      const G = Game.G; G.bots = [new Bot(G.birds[0], 3 + st, L), new Bot(G.birds[1], 9 + st, L)];
      const ev = {}; const o2 = G.events.push.bind(G.events); G.events.push = (...a) => { for (const e of a) ev[e.type] = (ev[e.type] || 0) + 1; return o2(...a); };
      let t = 0; while (G.state !== 'matchEnd' && t < 420) { Game.advance(0.5); t += 0.5; }
      const T = G.tm;
      return { etapa: st + 1, nombre: D.name, modo: D.mode, t, estado: G.state, gano: T ? T.ok : G.coopWin, estrellas: T ? T.stars : '-', resumen: T ? Team.summary(G) : `puntos ${G.score.map(Math.floor).join('+')} vidas ${G.lives}`, quedan: Math.round(G.roundT), ev: { deliver: ev.deliver, caseDrop: ev.caseDrop, wave: ev.wave, down: ev.down, disparosDron: ev.enemyShot, golpes: ev.hurt, drones: ev.bossDrone }, hp: G.birds.map(b => Math.round(b.hp)) };
    }, [st, L]);
    console.log(JSON.stringify(r));
    await page.screenshot({ path: path.join(__dirname, 'shots', `team-${st + 1}.png`) });
  }
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
