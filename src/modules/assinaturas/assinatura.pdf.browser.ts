import puppeteer, { Browser } from "puppeteer";


let browserInstance: Browser | null = null;

export async function obterBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) return browserInstance;

  browserInstance = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // necessário em muitos ambientes de container/CI
  });

  return browserInstance;
}

export async function fecharBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}