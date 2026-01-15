# Jeff Media Generation Capabilities

## ✅ What Jeff Can Do Now

### 1. **Brand-Consistent Graphics Generation**

Jeff can generate graphics using templates that enforce brand guidelines:

**Templates Available**:
- `social-post` - Social media graphics (1200x630px)
- `email-header` - Email headers (600x200px)
- `blog-featured` - Blog featured images (1200x675px)
- `ad-creative` - Ad creatives (1200x628px)

**Brand Guidelines Enforced**:
- Grayscale palette only (black, white, grays)
- Inter font (Google Fonts)
- Clean, minimal design
- High contrast for readability

**How It Works**:
1. Jeff generates text content (via LLM)
2. Calls `/v1/graphics/generate` endpoint
3. Template fills in text with brand colors/fonts
4. Returns image buffer + metadata

**Example Request**:
```json
POST /v1/graphics/generate
{
  "template": "social-post",
  "data": {
    "title": "Introducing ShopLink",
    "subtitle": "Connect with suppliers instantly",
    "cta": "Learn More",
    "logo": "double-vision-logo"
  },
  "format": "png"
}
```

### 2. **Screenshot Capabilities**

Jeff can capture screenshots using Puppeteer:

**URL Screenshots**:
- Screenshot any website/app
- Configurable dimensions
- Wait for selectors/timeouts
- Full page or viewport

**HTML Rendering**:
- Render HTML + CSS to image
- Perfect for mockups
- Brand-consistent layouts

**How It Works**:
1. Jeff requests screenshot via `/v1/screenshots/capture` or `/v1/screenshots/render`
2. Puppeteer loads page/HTML
3. Captures screenshot
4. Returns image buffer

**Example Request**:
```json
POST /v1/screenshots/capture
{
  "url": "https://shopware.doublevision.company",
  "options": {
    "width": 1200,
    "height": 630,
    "fullPage": false
  }
}
```

### 3. **Integration with Marketing Mode**

All media generation is **MARKETING mode only**:
- Requires API key authentication
- All outputs flagged for review
- Templates enforce brand compliance
- Rate limited to prevent abuse

## ❌ What Jeff Cannot Do (Yet)

### 1. **AI Image Generation**
- No DALL-E, Midjourney, Stable Diffusion integration
- **Reason**: Violates "DigitalOcean-native only" constraint
- **Workaround**: Use templates + screenshots

### 2. **Video Generation**
- No video creation capabilities
- **Future**: Could add video templates using FFmpeg

### 3. **Interactive Graphics**
- No animated GIFs or interactive elements
- **Future**: Could add GIF generation from frames

## 📋 Usage Examples

### Generate Social Media Post

**Jeff's Response**:
```json
{
  "text": "Introducing ShopLink - Connect with suppliers instantly",
  "graphics": {
    "template": "social-post",
    "data": {
      "title": "Introducing ShopLink",
      "subtitle": "Connect with suppliers instantly",
      "cta": "Learn More"
    },
    "format": "png"
  }
}
```

**Result**: Brand-consistent social media graphic + text

### Screenshot App Feature

**Jeff's Response**:
```json
{
  "text": "Here's a screenshot of ShopWare's dashboard",
  "screenshot": {
    "url": "https://shopware.doublevision.company/dashboard",
    "options": {
      "width": 1200,
      "height": 630
    }
  }
}
```

**Result**: Screenshot of app + explanatory text

### Create Email Header

**Jeff's Response**:
```json
{
  "text": "Email header for product announcement",
  "graphics": {
    "template": "email-header",
    "data": {
      "title": "New Feature: ShopLink",
      "subtitle": "Connect with suppliers instantly"
    }
  }
}
```

**Result**: Brand-consistent email header graphic

## 🔒 Security & Guardrails

1. **MARKETING Mode Only**: Graphics/screenshots only in MARKETING mode
2. **API Key Required**: All endpoints require authentication
3. **Review Required**: All generated media flagged for human review
4. **Brand Compliance**: Templates enforce brand guidelines automatically
5. **Rate Limiting**: Prevents abuse of graphics/screenshot endpoints
6. **Storage**: Generated images stored temporarily (24h) or uploaded to CDN

## 🚀 Next Steps

1. ✅ **Templates Created**: Basic templates for common use cases
2. ✅ **Services Implemented**: Graphics and screenshot services
3. ✅ **Endpoints Added**: Internal API endpoints for media generation
4. ⏳ **Integration**: Update agent service to use graphics/screenshots
5. ⏳ **Testing**: Test templates and screenshot capabilities
6. ⏳ **Documentation**: Update HOW_DUSTIN_USES_JEFF_MARKETING.md

## 📝 Notes

- **DigitalOcean-Native**: All solutions use DigitalOcean App Platform services
- **Brand Consistency**: Templates ensure all graphics follow brand guidelines
- **No External APIs**: No DALL-E, Midjourney, etc. (stays DigitalOcean-native)
- **Puppeteer**: Runs in separate worker service for screenshots
- **Canvas**: Node.js Canvas API for graphics generation

