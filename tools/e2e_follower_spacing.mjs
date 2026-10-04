// QA aislada. Fixture inicial declarado por URL; después sólo teclas y lecturas del juego.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const root = process.cwd(), out = path.join(root, 'tools/cache/follower_spacing');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [], results = [], fixtures = [], extraOnly = process.argv.includes('--extra-only');
const corridorOnly = process.argv.includes('--corridor-only');
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
const keys = {2:'ArrowDown',4:'ArrowLeft',6:'ArrowRight',8:'ArrowUp'};
async function snapshot() {
  return page.evaluate(async () => {
    const scene = window.__map, world = scene.world;
    const { followerBounds, boundsSeparated } = await import('/src/world/followerSpacing.js');
    const chars = [world.player, ...world.followers];
    return { map: world.map.id, camera: {x:scene.camera.x,y:scene.camera.y},
      chars: chars.map(ch => ({ id: ch.id, key: ch.characterName, x:ch.x,y:ch.y,dir:ch.direction,
        hidden: ch.hidden || false, transparent:ch.transparent,busy:ch.busy(),
        visible:scene.worldView.sprites.get(ch.uid)?.mesh.visible,
        scale:scene.worldView.sprites.get(ch.uid)?.sheet?.scale,
        bounds:followerBounds(ch), mounted:world.zygMount?.form || null })),
      overlaps: chars.flatMap((a,i) => chars.slice(i+1).filter(b => !a.hidden && !b.hidden && !a.transparent && !b.transparent
        && !boundsSeparated(followerBounds(a),followerBounds(b),0)).map(b => [a.id,b.id])) };
  });
}
async function settle() {
  await page.waitForFunction(() => {
    return Boolean(window.__map?.ready && __map.engine.scenes.top === __map && !__map.runner.busy && __map.world.inputEnabled()
      && __map.worldView.sprites.get(__map.world.player.uid)?.sheet?.key === __map.world.player.characterName
      && !__map.world.player.busy() && __map.world.followers.every(f => f.hidden ||
        (!f.busy() && __map.worldView.sprites.get(f.uid)?.sheet?.key === f.characterName)));
  }, null, {timeout:10000});
  let old = '', stable = 0;
  for (let i=0;i<50&&stable<3;i++) {
    const now = await page.evaluate(() => JSON.stringify(__map.world.followers.map(f => [f.x,f.y,f.busy(),f.direction])));
    const busy = await page.evaluate(() => __map.world.followers.some(f => !f.hidden && f.busy()));
    stable = !busy && now === old ? stable+1 : 0; old=now;
    await page.waitForTimeout(100);
  }
  assert.equal(stable,3,'formación asentada');
}
async function step(dir) {
  const old = await page.evaluate(() => ({x:__map.world.player.x,y:__map.world.player.y}));
  await page.keyboard.down(keys[dir]);
  try {
    await page.waitForFunction(p => __map.world.player.x !== p.x || __map.world.player.y !== p.y, old, {timeout:3000});
  } catch (error) {
    console.log('diagnóstico paso', await page.evaluate(dir => {
      const w=__map.world, p=w.player, input=w.input;
      return {dir,p:{x:p.x,y:p.y,dir:p.direction,busy:p.busy(),canMove:p.canMoveInDirection(dir)},
        input:{keys:[...input.keyDown],enabled:input.enabled,dir:input.dir4()},
        locked:w.inputLocked,scriptBusy:w.scriptBusy(),frame:__map.frame,transferring:__map.transferring};
    },dir));
    throw error;
  } finally { await page.keyboard.up(keys[dir]); }
  await settle();
}
async function capture(label, all = true) {
  const s = await snapshot();
  assert.deepEqual(s.overlaps, [], label + ': sin solapes visibles');
  if (all) assert.ok(s.chars.every(ch => ch.visible), label + ': tres actores visibles ' + JSON.stringify(s.chars));
  const file = path.join(out,label+'.png');
  await page.locator('#stage').screenshot({path:file});
  results.push({label,file:path.relative(root,file),...s});
  console.log(label + ': ' + s.chars.map(ch => `${ch.key}@${ch.x},${ch.y}${ch.visible?'':' oculto'}`).join(' / '));
}
async function fixture(overrides={}) {
  const params=new URLSearchParams({scene:'map',debug:'1',noenc:'1',map:'dev_zygarde',x:'12',y:'26',dir:'4',
    party:'PIKACHU:55',core:'1',zform:'50',zcells:'100',zcores:'5',zygarde:'run,ram,terrain,climb,swim,detect,dive',
    flags:'p1_restored,p2_restored,p3_restored,p4_restored,p5_restored,p6_restored,zyg_10,zyg_50,zyg_dive',time:'13',...overrides});
  fixtures.push(Object.fromEntries(params));await page.goto('http://localhost:8080/?'+params);await settle();
}
async function tap(key,ms=45) {
  await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);await page.waitForTimeout(150);
}
async function turn(dir) {
  const old=await page.evaluate(()=>[__map.world.player.x,__map.world.player.y]);
  await tap(keys[dir],25); await settle();
  assert.deepEqual(await page.evaluate(()=>[__map.world.player.x,__map.world.player.y]),old,'giro sin mover jugador');
}
try {
  for (const form of extraOnly||corridorOnly?[]:['50','10']) {
    const params = new URLSearchParams({scene:'map',debug:'1',noenc:'1',map:'antea_1_antea',x:'16',y:'14',dir:'8',
      party:'TORTERRA:55',core:'1',zform:form,zcells:'76',zcores:'4',zygarde:'run,ram,terrain,climb,swim,detect,dive',
      flags:'p1_restored,p2_restored,p3_restored,p4_restored,p5_restored,p6_restored,zyg_10,zyg_50,zyg_dive,b13_talasa,b14_caracola_tuto,b14_primer_eco,b14_primigenia_vista,b14_bramaluna_vista',time:'13'});
    fixtures.push(Object.fromEntries(params));
    await page.goto('http://localhost:8080/?'+params);
    await page.waitForFunction(() => window.__map?.worldView?.sprites.get(__map.world.core.uid)?.sheet);
    await settle(); await capture('antea_'+form+'_llegada');
    for (const dir of [6,6,8,8,6,6,4,4,2,2]) { await step(dir); await capture('antea_'+form+'_paso'+results.length); }
    await capture('antea_'+form+'_parada');
    for (const dir of [8,8,2,2,2,2,8,8,8,8]) { await step(dir); await capture('antea_'+form+'_reversa'+results.length,false); }
    await capture('antea_'+form+'_recuperacion');
  }
  if(extraOnly||corridorOnly) {
    if(!corridorOnly) {
    for(const {form,species,scale} of [{form:'complete',species:'ONIX',scale:0.5},{form:'50',species:'YANMA',scale:0.75},{form:'core',species:'PIKACHU',scale:1}]) {
      await fixture({zform:form,party:species+':55'});await capture('extremo_'+form+'_'+species);
      const f=(await snapshot()).chars.find(ch=>ch.id==='follower');assert.equal(f.scale,scale);
      for(const dir of [4,4,6,6,6,6,6,6,6,6]) await step(dir);
      const s=await snapshot();assert.ok(s.chars.every(ch=>ch.y===s.chars[0].y),'fila tras recta suficiente');
      await capture('recta_'+form+'_'+species);
    }
    await fixture(); await turn(6); await tap('KeyZ',70);
    await page.waitForFunction(()=>__map.engine.scenes.top?.constructor.name==='MessageScene');
    await page.locator('#stage').screenshot({path:path.join(out,'interaccion_A_Z50.png')});
    results.push({label:'interaccion_A_Z50',...(await snapshot()),messageOpened:true});
    for(let i=0;i<10;i++) {
      const top=await page.evaluate(()=>__map.engine.scenes.top?.constructor.name);
      if(top==='MapScene') break;
      await tap('KeyZ',70);
    }
    await settle(); await capture('interaccion_A_regreso');
    await fixture({zform:'10'});await capture('antes_montar');await tap('KeyE',70);await settle();
    assert.equal((await snapshot()).chars[0].mounted,'10');await capture('montado',false);
    for(let i=0;i<5;i++) await step(6);
    await capture('montura_caminar',false);await tap('KeyE',70);await settle();
    assert.equal((await snapshot()).chars[0].mounted,null);await capture('desmontado');
    }
    await fixture({map:'dev_test_casa',x:'5',y:'6',dir:'2'});
    const narrow=await snapshot();assert.ok(narrow.chars.slice(1).some(ch=>ch.transparent));
    await capture('pasillo_corto_cede_espacio',false);
    for(let i=0;i<6;i++) await step(2);
    await capture('pasillo_fila_recuperada');
    for(let i=0;i<5;i++) await step(6);
    await step(2);await step(2);
    assert.equal((await snapshot()).map,'dev_test','salida natural de la casa');
    await capture('salida_casa',false);
    for(let i=0;i<6;i++) await step(2);
    await capture('ruta_fila_recuperada');
    for(let i=0;i<6;i++) await step(6);
    const straight=await snapshot();
    assert.ok(straight.chars.every(ch=>ch.y===straight.chars[0].y),'fila lateral tras salir de la habitación');
    await capture('ruta_fila_recuperada_lateral');
  }
  assert.deepEqual(errors, []);
} finally {
  fs.writeFileSync(path.join(out,corridorOnly?'corridor_report.json':extraOnly?'extra_report.json':'report.json'),JSON.stringify({fixtures,results,errors},null,2));
  await browser.close();
}
