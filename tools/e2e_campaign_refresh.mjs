// Actualiza únicamente el conductor de pruebas entre bloques; la misma partida y escena siguen vivas.
export async function refreshDriver(d) {
  const stamp = Date.now();
  const [{ CampaignDriver }, { installCampaignHelpers }] = await Promise.all([
    import(`./e2e_campaign_driver.mjs?v=${stamp}`), import(`./e2e_campaign_page.mjs?v=${stamp}`),
  ]);
  Object.setPrototypeOf(d, CampaignDriver.prototype);
  await installCampaignHelpers(d.page);
  if (!d.liveTicker) {
    const fs = await import('node:fs'), path = await import('node:path');
    d.liveTicker = setInterval(async () => {
      try { fs.writeFileSync(path.join(d.outDir,'campaign_live.json'),JSON.stringify({stage:d.currentStage,state:await d.snap()},null,2)); }
      catch {}
    },15000); d.liveTicker.unref();
  }
}
