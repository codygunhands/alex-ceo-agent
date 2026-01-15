# Jeff Media Generation Capabilities

## Current Limitations

Jeff currently only handles **text** via DigitalOcean Gradient AI (LLM). No image generation, screenshots, or media capabilities exist.

## Proposed Solutions

### 1. **Brand-Consistent Graphics Generation** ✅

**Approach**: Template-based image generation using brand assets

**Implementation**:
- Store brand templates (SVG/HTML) in `kb/brand-assets/`
- Use Node.js Canvas API (`canvas` package) to render templates
- Jeff generates text content → fills templates → exports images

**Brand Guidelines** (from codebase):
- **Colors**: Grayscale palette (black #000000, white #FFFFFF, grays #F5F5F5 to #171717)
- **Font**: Inter (Google Fonts)
- **Style**: Clean, minimal, professional
- **Assets**: Logos available in `assets/` directory

**Example Templates**:
- Social media graphics (1200x630px)
- Email headers (600x200px)
- Blog post featured images (1200x675px)
- Ad creatives (various sizes)

### 2. **Screenshot Capabilities** ✅

**Approach**: Headless browser automation (Puppeteer/Playwright)

**Implementation**:
- Add `worker-screenshot` service to DigitalOcean App Platform
- Uses Puppeteer to:
  - Screenshot websites/apps
  - Generate HTML → screenshot
  - Create mockups of products/apps

**Use Cases**:
- Screenshot app features for marketing
- Generate product mockups
- Create "before/after" comparisons
- Capture dashboard views for case studies

### 3. **Media Generation via External APIs** ⚠️

**Approach**: Integrate image generation APIs (if needed)

**Options**:
- **DALL-E API** (OpenAI) - High quality, brand-aware prompts
- **Stable Diffusion API** - Open source, customizable
- **Midjourney API** (if available) - Artistic quality

**Note**: This violates "DigitalOcean-native only" but may be necessary for marketing.

**Guardrails**:
- Only in MARKETING mode
- Must include brand guidelines in prompts
- All outputs flagged as "needs review"
- Templates preferred over raw generation

## Recommended Implementation Plan

### Phase 1: Template-Based Graphics (DigitalOcean-Native) ✅

1. **Create Brand Template System**
   - SVG templates with text placeholders
   - HTML templates for complex layouts
   - Canvas rendering service

2. **Add Graphics Endpoint**
   ```
   POST /v1/internal/graphics/generate
   {
     "template": "social-post",
     "data": {
       "title": "...",
       "subtitle": "...",
       "cta": "..."
     },
     "format": "png|jpg|webp"
   }
   ```

3. **Integrate with Jeff**
   - Jeff generates text content
   - Calls graphics endpoint
   - Returns image URL + text

### Phase 2: Screenshot Service (DigitalOcean-Native) ✅

1. **Add Screenshot Worker**
   - Separate service: `worker-screenshot`
   - Uses Puppeteer
   - Runs on DigitalOcean App Platform

2. **Screenshot Endpoint**
   ```
   POST /v1/internal/screenshots/capture
   {
     "url": "https://...",
     "options": {
       "width": 1200,
       "height": 630,
       "fullPage": false
     }
   }
   ```

3. **HTML → Screenshot**
   ```
   POST /v1/internal/screenshots/render
   {
     "html": "<div>...</div>",
     "css": "...",
     "options": {...}
   }
   ```

### Phase 3: External Image Generation (Optional) ⚠️

Only if templates + screenshots aren't sufficient:

1. **Add Image Generation Provider**
   - Environment variable: `IMAGE_GEN_API_KEY`
   - Provider selection: DALL-E, Stable Diffusion, etc.

2. **Brand-Aware Prompts**
   - Include brand guidelines in prompts
   - Grayscale palette enforcement
   - Inter font references

3. **Review Workflow**
   - All generated images flagged for review
   - Templates preferred over raw generation

## Brand Asset Integration

### Available Assets
- Logos: `assets/double-vision-logo.PNG`
- Product logos: `assets/shopware-logo.svg`, `assets/dealio-logo.svg`, etc.
- Icons: Various SVG icons

### Brand Colors (Grayscale)
```javascript
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
  gray900: '#171717'
};
```

### Brand Font
- **Primary**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

## Example: Social Media Post Generation

**Jeff's Response**:
```json
{
  "text": "Introducing ShopLink - Connect with suppliers instantly",
  "graphics": {
    "template": "social-post",
    "data": {
      "title": "Introducing ShopLink",
      "subtitle": "Connect with suppliers instantly",
      "cta": "Learn More",
      "logo": "double-vision-logo"
    },
    "format": "png",
    "size": "1200x630"
  }
}
```

**Result**: Brand-consistent social media graphic + text content

## Security & Guardrails

1. **MARKETING Mode Only**: Graphics generation only in MARKETING mode
2. **Review Required**: All generated media flagged for human review
3. **Brand Compliance**: Templates enforce brand guidelines
4. **Rate Limiting**: Prevent abuse of screenshot/graphics endpoints
5. **Storage**: Generated images stored temporarily (24h) or uploaded to CDN

## Next Steps

1. ✅ **Create template system** (SVG/HTML templates)
2. ✅ **Add Canvas rendering service** (Node.js `canvas` package)
3. ✅ **Add screenshot worker** (Puppeteer service)
4. ⚠️ **Optional**: External image generation API integration

Would you like me to implement Phase 1 (template-based graphics) first?

