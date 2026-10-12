import type { Page } from '@playwright/test';

// Capture d'écran Playwright, puis lecture de pixels décodée dans la page (canvas 2D, sans paquet).
// Les points sont en pixels CSS de la page.
export async function readPixels(page: Page, points: { x: number; y: number }[]): Promise<number[][]> {
  const png = await page.screenshot();
  return page.evaluate(
    async ({ b64, pts }) => {
      const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
      const bmp = await createImageBitmap(blob);
      const c = new OffscreenCanvas(bmp.width, bmp.height);
      const ctx = c.getContext('2d')!;
      ctx.drawImage(bmp, 0, 0);
      const ratio = bmp.width / window.innerWidth;
      return pts.map((p) => Array.from(ctx.getImageData(Math.round(p.x * ratio), Math.round(p.y * ratio), 1, 1).data).slice(0, 3));
    },
    { b64: png.toString('base64'), pts: points },
  );
}
