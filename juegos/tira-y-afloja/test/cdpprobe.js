const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 693, height: 272 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.setContent('<div id=a style="position:absolute;left:0;top:0;width:300px;height:272px;touch-action:none"></div><div id=b style="position:absolute;left:350px;top:0;width:300px;height:272px;touch-action:none"></div><script>window.L=[];for(const t of ["pointerdown","pointerup","pointercancel"])addEventListener(t,e=>L.push(t+":"+e.pointerId+"@"+e.target.id),true)</script>');
  const cdp = await ctx.newCDPSession(page);
  const s = (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p });
  await s('touchStart', [{ x: 50, y: 50, id: 1 }]);
  await s('touchStart', [{ x: 50, y: 50, id: 1 }, { x: 400, y: 50, id: 2 }]);
  await s('touchEnd', [{ x: 50, y: 50, id: 1 }]);
  console.log(await page.evaluate(() => L.join(' ')));
  await s('touchEnd', []);
  console.log(await page.evaluate(() => L.join(' ')));
  await browser.close();
})();
