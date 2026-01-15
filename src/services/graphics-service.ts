/**
 * Graphics Service - Brand-Consistent Image Generation
 * 
 * Generates images using templates and brand guidelines.
 * DigitalOcean-native solution using Node.js Canvas API.
 */

import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D } from 'canvas';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface GraphicsRequest {
  template: string;
  data: Record<string, any>;
  format?: 'png' | 'jpg' | 'webp';
  width?: number;
  height?: number;
}

export interface GraphicsResponse {
  imageUrl: string;
  imageBuffer?: Buffer;
  metadata: {
    template: string;
    format: string;
    dimensions: { width: number; height: number };
    generatedAt: string;
  };
}

// Brand colors (grayscale palette)
const BRAND_COLORS = {
  black: '#000000',
  white: '#FFFFFF',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#171717',
} as const;

// High-converting ad templates (proven formats)
const TEMPLATES = {
  // LinkedIn/Facebook ad - proven 1:1.91 ratio
  'linkedin-ad': {
    width: 1200,
    height: 628,
    backgroundColor: BRAND_COLORS.white,
    textColor: BRAND_COLORS.black,
  },
  // Google Display ad - standard sizes
  'google-display': {
    width: 300,
    height: 250,
    backgroundColor: BRAND_COLORS.white,
    textColor: BRAND_COLORS.black,
  },
  // Square ad (Instagram, Facebook feed)
  'square-ad': {
    width: 1080,
    height: 1080,
    backgroundColor: BRAND_COLORS.white,
    textColor: BRAND_COLORS.black,
  },
} as const;

export class GraphicsService {
  private templatesDir: string;

  constructor() {
    this.templatesDir = join(process.cwd(), 'kb', 'brand-assets', 'templates');
  }

  /**
   * Generate a brand-consistent graphic from a template
   */
  async generate(request: GraphicsRequest): Promise<GraphicsResponse> {
    const template = TEMPLATES[request.template as keyof typeof TEMPLATES];
    if (!template) {
      throw new Error(`Unknown template: ${request.template}`);
    }

    const width = request.width || template.width;
    const height = request.height || template.height;
    const format = request.format || 'png';

    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = template.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Render template-specific content
    await this.renderTemplate(ctx, request.template, request.data, width, height);

    // Export image
    const imageBuffer = canvas.toBuffer(`image/${format}` as any);

    return {
      imageUrl: '', // Will be set by storage service
      imageBuffer,
      metadata: {
        template: request.template,
        format,
        dimensions: { width, height },
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Render template-specific content
   */
  private async renderTemplate(
    ctx: CanvasRenderingContext2D,
    templateName: string,
    data: Record<string, any>,
    width: number,
    height: number
  ): Promise<void> {
    // Set default font (Inter - will need to load font file)
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.fillStyle = BRAND_COLORS.black;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    switch (templateName) {
      case 'linkedin-ad':
        await this.renderLinkedInAd(ctx, data, width, height);
        break;
      case 'google-display':
        await this.renderGoogleDisplay(ctx, data, width, height);
        break;
      case 'square-ad':
        await this.renderSquareAd(ctx, data, width, height);
        break;
      default:
        throw new Error(`No renderer for template: ${templateName}`);
    }
  }

  /**
   * Render LinkedIn/Facebook ad (high-converting format)
   * Proven format: Headline + Benefit + CTA
   */
  private async renderLinkedInAd(
    ctx: CanvasRenderingContext2D,
    data: Record<string, any>,
    width: number,
    height: number
  ): Promise<void> {
    const { headline, benefit, cta } = data;

    // Headline (bold, attention-grabbing)
    ctx.font = 'bold 56px Inter, sans-serif';
    ctx.fillStyle = BRAND_COLORS.black;
    ctx.textAlign = 'center';
    ctx.fillText(headline || '', width / 2, height / 2 - 80);

    // Benefit (clear value prop)
    if (benefit) {
      ctx.font = '400 32px Inter, sans-serif';
      ctx.fillStyle = BRAND_COLORS.gray700;
      ctx.fillText(benefit, width / 2, height / 2 - 10);
    }

    // CTA button (high contrast, action-oriented)
    if (cta) {
      ctx.font = '600 28px Inter, sans-serif';
      ctx.fillStyle = BRAND_COLORS.black;
      ctx.fillRect(width / 2 - 140, height / 2 + 50, 280, 60);
      ctx.fillStyle = BRAND_COLORS.white;
      ctx.fillText(cta, width / 2, height / 2 + 85);
    }

    // Logo (bottom right)
    if (data.logo) {
      await this.renderLogo(ctx, data.logo, width, height);
    }
  }

  /**
   * Render Google Display ad (small, focused)
   * Format: Short headline + CTA
   */
  private async renderGoogleDisplay(
    ctx: CanvasRenderingContext2D,
    data: Record<string, any>,
    width: number,
    height: number
  ): Promise<void> {
    const { headline, cta } = data;

    // Headline (concise, benefit-focused)
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillStyle = BRAND_COLORS.black;
    ctx.textAlign = 'center';
    ctx.fillText(headline || '', width / 2, height / 2 - 20);

    // CTA (clear action)
    if (cta) {
      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillStyle = BRAND_COLORS.white;
      ctx.fillRect(width / 2 - 80, height / 2 + 10, 160, 35);
      ctx.fillStyle = BRAND_COLORS.black;
      ctx.fillText(cta, width / 2, height / 2 + 32);
    }
  }

  /**
   * Render square ad (Instagram/Facebook feed)
   * Format: Visual-first with text overlay
   */
  private async renderSquareAd(
    ctx: CanvasRenderingContext2D,
    data: Record<string, any>,
    width: number,
    height: number
  ): Promise<void> {
    const { headline, benefit, cta } = data;

    // Headline (large, centered)
    ctx.font = 'bold 72px Inter, sans-serif';
    ctx.fillStyle = BRAND_COLORS.black;
    ctx.textAlign = 'center';
    ctx.fillText(headline || '', width / 2, height / 2 - 100);

    // Benefit (supporting text)
    if (benefit) {
      ctx.font = '400 36px Inter, sans-serif';
      ctx.fillStyle = BRAND_COLORS.gray700;
      ctx.fillText(benefit, width / 2, height / 2 - 20);
    }

    // CTA (prominent button)
    if (cta) {
      ctx.font = '600 32px Inter, sans-serif';
      ctx.fillStyle = BRAND_COLORS.black;
      ctx.fillRect(width / 2 - 180, height / 2 + 60, 360, 70);
      ctx.fillStyle = BRAND_COLORS.white;
      ctx.fillText(cta, width / 2, height / 2 + 105);
    }

    // Logo (top right)
    if (data.logo) {
      await this.renderLogo(ctx, data.logo, width, height);
    }
  }

  /**
   * Render logo on canvas
   */
  private async renderLogo(
    ctx: CanvasRenderingContext2D,
    logoName: string,
    width: number,
    height: number
  ): Promise<void> {
    // Try to load logo from assets
    const logoPath = join(process.cwd(), 'assets', `${logoName}.png`);
    if (existsSync(logoPath)) {
      try {
        const logo = await loadImage(logoPath);
        const logoSize = 100;
        const x = width - logoSize - 40;
        const y = 40;
        ctx.drawImage(logo, x, y, logoSize, logoSize);
      } catch (error) {
        console.warn(`Could not load logo: ${logoName}`, error);
      }
    }
  }
}

