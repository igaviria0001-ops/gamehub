/* =========================================================================
   POSPROCESO (computador) — la escena se dibuja en una textura con MSAA y
   luego: resplandor (zonas brillantes difuminadas en dos escalas),
   desenfoque radial de velocidad durante el turbo (por vista), corrección
   de color por pista (saturación, contraste, tono de luces y sombras),
   viñeta y paso a sRGB con un poco de ruido para evitar bandas.
   En el celular se dibuja directo (más liviano).
   ========================================================================= */
const POST = (() => {
  let R = null, on = false, cap = false, W = 0, H = 0, cssW = 0, cssH = 0, rt = null, bright = null, blurA = null, blurB = null, blurC = null, blurD = null, quad = null, cam = null, sc = null;
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const mk = (fs, uniforms) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false });
  const mBright = mk(`uniform sampler2D tex; uniform float thr; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tex, vUv).rgb; float l = max(c.r, max(c.g, c.b)); float k = smoothstep(thr, thr + 0.25, l); gl_FragColor = vec4(c * k, 1.0); }`, { tex: { value: null }, thr: { value: 0.72 } });
  const mBlur = mk(`uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tex, vUv).rgb * 0.227; c += (texture2D(tex, vUv + dir * 1.385).rgb + texture2D(tex, vUv - dir * 1.385).rgb) * 0.316; c += (texture2D(tex, vUv + dir * 3.231).rgb + texture2D(tex, vUv - dir * 3.231).rgb) * 0.070; gl_FragColor = vec4(c, 1.0); }`, { tex: { value: null }, dir: { value: new THREE.Vector2() } });
  const mComp = mk(`uniform sampler2D tex, b1, b2; uniform float bloom, sat, con, vig, time; uniform vec3 gain, lift; uniform vec4 view0, view1; uniform float spd0, spd1; varying vec2 vUv;
    vec3 sampleSpeed(vec2 uv, vec4 v, float k){ vec2 c = vec2(v.x + v.z * 0.5, v.y + v.w * 0.52); vec2 d = (uv - c); vec3 acc = vec3(0.0); for (int i = 0; i < 8; i++) { float t = float(i) / 7.0; acc += texture2D(tex, uv - d * t * k).rgb; } return acc / 8.0; }
    float inside(vec2 uv, vec4 v){ return step(v.x, uv.x) * step(uv.x, v.x + v.z) * step(v.y, uv.y) * step(uv.y, v.y + v.w); }
    void main(){
      vec3 c = texture2D(tex, vUv).rgb;
      float i0 = inside(vUv, view0) * spd0, i1 = inside(vUv, view1) * spd1;
      if (i0 > 0.001) c = mix(c, sampleSpeed(vUv, view0, 0.06 * i0), smoothstep(0.08, 0.5, length((vUv - vec2(view0.x + view0.z * 0.5, view0.y + view0.w * 0.52)) / view0.zw)));
      if (i1 > 0.001) c = mix(c, sampleSpeed(vUv, view1, 0.06 * i1), smoothstep(0.08, 0.5, length((vUv - vec2(view1.x + view1.z * 0.5, view1.y + view1.w * 0.52)) / view1.zw)));
      c += (texture2D(b1, vUv).rgb * 0.6 + texture2D(b2, vUv).rgb * 0.8) * bloom;
      // color: tono de sombras/luces, saturación, contraste
      c = c * gain + lift * (1.0 - c); float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); c = mix(vec3(l), c, sat); c = (c - 0.18) * con + 0.18; c = max(c, 0.0);
      // viñeta por vista
      vec4 v = inside(vUv, view1) > 0.5 ? view1 : view0; vec2 q = (vUv - v.xy) / v.zw - 0.5; c *= 1.0 - vig * smoothstep(0.35, 0.95, length(q * vec2(1.0, 0.85)) * 1.25);
      c = pow(c, vec3(1.0 / 2.2)); c += (fract(sin(dot(vUv * 913.7 + time, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
      gl_FragColor = vec4(c, 1.0); }`, { tex: { value: null }, b1: { value: null }, b2: { value: null }, bloom: { value: 0.55 }, sat: { value: 1.08 }, con: { value: 1.06 }, vig: { value: 0.32 }, time: { value: 0 }, gain: { value: new THREE.Vector3(1, 1, 1) }, lift: { value: new THREE.Vector3(0, 0, 0) }, view0: { value: new THREE.Vector4(0, 0, 1, 1) }, view1: { value: new THREE.Vector4(2, 2, 0, 0) }, spd0: { value: 0 }, spd1: { value: 0 } });
  function init(renderer) {
    R = renderer; const gl = R.getContext();
    cap = R.capabilities.isWebGL2 && !!gl.getExtension('EXT_color_buffer_float'); on = cap && GQ.lv === 2;
    quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mBright); quad.frustumCulled = false; sc = new THREE.Scene(); sc.add(quad); cam = new THREE.Camera();
    return on;
  }
  const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  function resize(w, h) {
    cssW = w; cssH = h; if (!on) return; const pr = R.getPixelRatio(); W = Math.round(w * pr); H = Math.round(h * pr);
    for (const t of [rt, bright, blurA, blurB, blurC, blurD]) if (t) t.dispose();
    // stencil = búfer de profundidad de 24 bits (con 16 bits el agua y el terreno lejanos parpadean en franjas)
    rt = THREE.WebGLMultisampleRenderTarget ? new THREE.WebGLMultisampleRenderTarget(W, H, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, stencilBuffer: true }) : new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, stencilBuffer: true });
    if (rt.samples != null) rt.samples = 4;
    const w2 = Math.max(1, W >> 1), h2 = Math.max(1, H >> 1), w4 = Math.max(1, W >> 2), h4 = Math.max(1, H >> 2), w8 = Math.max(1, W >> 3), h8 = Math.max(1, H >> 3);
    bright = new THREE.WebGLRenderTarget(w2, h2, opts); blurA = new THREE.WebGLRenderTarget(w4, h4, opts); blurB = new THREE.WebGLRenderTarget(w4, h4, opts); blurC = new THREE.WebGLRenderTarget(w8, h8, opts); blurD = new THREE.WebGLRenderTarget(w8, h8, opts);
  }
  // vista en píxeles CSS (x, y desde arriba) → región de la textura
  function setView(v) { const pr = R.getPixelRatio(), x = Math.round(v.x * pr), w = Math.round(v.w * pr), h = Math.round(v.h * pr), y = H - Math.round(v.y * pr) - h; rt.viewport.set(x, y, w, h); rt.scissor.set(x, y, w, h); rt.scissorTest = true; }
  function begin() { R.setRenderTarget(rt); rt.scissorTest = false; R.setClearColor(0x03060d); R.clear(); }
  function pass(mat, target) { quad.material = mat; R.setRenderTarget(target); R.render(sc, cam); }
  function end(views, speeds, grade, t) {
    const g = grade || {}, cw = W / R.getPixelRatio(), ch = H / R.getPixelRatio();
    mBright.uniforms.tex.value = rt.texture; mBright.uniforms.thr.value = g.thr != null ? g.thr : 0.72; pass(mBright, bright);
    mBlur.uniforms.tex.value = bright.texture; mBlur.uniforms.dir.value.set(1 / blurA.width, 0); pass(mBlur, blurA);
    mBlur.uniforms.tex.value = blurA.texture; mBlur.uniforms.dir.value.set(0, 1 / blurA.height); pass(mBlur, blurB);
    mBlur.uniforms.tex.value = blurB.texture; mBlur.uniforms.dir.value.set(1 / blurC.width, 0); pass(mBlur, blurC);
    mBlur.uniforms.tex.value = blurC.texture; mBlur.uniforms.dir.value.set(0, 1 / blurC.height); pass(mBlur, blurD);
    const U = mComp.uniforms; U.tex.value = rt.texture; U.b1.value = blurB.texture; U.b2.value = blurD.texture; U.time.value = t % 100;
    U.bloom.value = g.bloom != null ? g.bloom : 0.55; U.sat.value = g.sat || 1.08; U.con.value = g.con || 1.06; U.vig.value = g.vig != null ? g.vig : 0.32;
    U.gain.value.fromArray(g.gain || [1, 1, 1]); U.lift.value.fromArray(g.lift || [0, 0, 0]);
    const toUv = (v, o) => o.set(v.x / cw, 1 - (v.y + v.h) / ch, v.w / cw, v.h / ch);
    toUv(views[0], U.view0.value); if (views[1]) toUv(views[1], U.view1.value); else U.view1.value.set(2, 2, 0, 0);
    U.spd0.value = speeds[0] || 0; U.spd1.value = speeds[1] || 0;
    rt.scissorTest = false; R.setScissorTest(false); quad.material = mComp; R.setRenderTarget(null); R.setViewport(0, 0, cw, ch); R.render(sc, cam); R.setScissorTest(true);
  }
  function quality() { on = cap && GQ.lv === 2; if (on && cssW) resize(cssW, cssH); }
  return { init, resize, quality, begin, setView, end, get on() { return on; }, set on(v) { on = v; } };
})();
