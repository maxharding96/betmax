import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { chromium } from 'playwright-extra'

chromium.use(StealthPlugin())

export async function getBrowser({ headless }: { headless: boolean }) {
  const browser = await chromium.launch({ headless })
  return browser
}
