/**
 * Screenshot Service - Web Screenshot & HTML Rendering
 * 
 * Uses Puppeteer for headless browser automation.
 * DigitalOcean-native solution.
 * Puppeteer is optional - service will gracefully degrade if not available.
 */

let puppeteer: any = null;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.warn('Puppeteer module not available. Screenshot generation will be disabled.');
}

type Browser = any;
type Page = any;

export interface ScreenshotRequest {
  url?: string;
  html?: string;
  css?: string;
  options?: {
    width?: number;
    height?: number;
    fullPage?: boolean;
    deviceScaleFactor?: number;
    waitForSelector?: string;
    waitForTimeout?: number;
  };
}

export interface ScreenshotResponse {
  imageBuffer: Buffer;
  metadata: {
    url?: string;
    dimensions: { width: number; height: number };
    capturedAt: string;
  };
}

export class ScreenshotService {
  private browser: Browser | null = null;
  private puppeteerAvailable: boolean;

  constructor() {
    this.puppeteerAvailable = !!puppeteer;
  }

  /**
   * Initialize browser (lazy loading)
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.puppeteerAvailable) {
      throw new Error('Screenshot service is not available. Puppeteer module is not installed.');
    }
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Capture screenshot from URL
   */
  async captureUrl(request: ScreenshotRequest): Promise<ScreenshotResponse> {
    if (!request.url) {
      throw new Error('URL is required for captureUrl');
    }

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      const options = request.options || {};
      const width = options.width || 1200;
      const height = options.height || 630;

      await page.setViewport({
        width,
        height,
        deviceScaleFactor: options.deviceScaleFactor || 1,
      });

      await page.goto(request.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for selector if specified
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }

      // Wait for timeout if specified
      if (options.waitForTimeout) {
        await page.waitForTimeout(options.waitForTimeout);
      }

      const imageBuffer = await page.screenshot({
        type: 'png',
        fullPage: options.fullPage || false,
      }) as Buffer;

      return {
        imageBuffer,
        metadata: {
          url: request.url,
          dimensions: { width, height },
          capturedAt: new Date().toISOString(),
        },
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Render HTML to screenshot
   */
  async renderHtml(request: ScreenshotRequest): Promise<ScreenshotResponse> {
    if (!request.html) {
      throw new Error('HTML is required for renderHtml');
    }

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      const options = request.options || {};
      const width = options.width || 1200;
      const height = options.height || 630;

      await page.setViewport({
        width,
        height,
        deviceScaleFactor: options.deviceScaleFactor || 1,
      });

      // Inject CSS if provided
      if (request.css) {
        await page.addStyleTag({ content: request.css });
      }

      // Set HTML content
      await page.setContent(request.html, {
        waitUntil: 'networkidle0',
      });

      // Wait for selector if specified
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }

      // Wait for timeout if specified
      if (options.waitForTimeout) {
        await page.waitForTimeout(options.waitForTimeout);
      }

      const imageBuffer = await page.screenshot({
        type: 'png',
        fullPage: options.fullPage || false,
      }) as Buffer;

      return {
        imageBuffer,
        metadata: {
          dimensions: { width, height },
          capturedAt: new Date().toISOString(),
        },
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Cleanup browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

