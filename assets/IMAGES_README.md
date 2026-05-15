# Image Assets Guide

This file explains what images you need and where to put them.

## Directory Structure

```
assets/
├── npcs/              # NPC character avatars
│   ├── anna.png
│   ├── sarah.png
│   ├── tom.png
│   └── tony.png
├── locations/         # Location background images
│   ├── cafe.png
│   ├── library.png
│   ├── classroom.png
│   └── bank.png
├── icons/            # Small icons for map
│   ├── cafe.png
│   ├── library.png
│   ├── classroom.png
│   └── bank.png
├── icon.png          # App icon
├── splash.png        # Splash screen
└── adaptive-icon.png # Android adaptive icon
```

## Image Specifications

### NPC Avatars (assets/npcs/)
- **Size**: 300x300 pixels
- **Format**: PNG with transparency
- **Style**: Friendly, approachable character illustrations
- **Characters**:
  - **Anna**: Female barista, friendly smile, casual outfit
  - **Sarah**: Female librarian, glasses, professional
  - **Tom**: Male student, casual, energetic
  - **Tony**: Male bank teller, professional suit

### Location Backgrounds (assets/locations/)
- **Size**: 800x600 pixels (or higher, will be scaled)
- **Format**: PNG or JPG
- **Style**: Warm, welcoming Australian environments
- **Scenes**:
  - **Cafe**: Coffee shop interior with counter
  - **Library**: Quiet study space with bookshelves
  - **Classroom**: University classroom setting
  - **Bank**: Professional bank interior

### Location Icons (assets/icons/)
- **Size**: 100x100 pixels
- **Format**: PNG with transparency
- **Style**: Simple, clear icons
- **Icons**:
  - **Cafe**: Coffee cup icon
  - **Library**: Book icon
  - **Classroom**: Graduation cap icon
  - **Bank**: Bank building icon

### App Assets
- **icon.png**: 1024x1024, app icon (rounded corners applied by system)
- **splash.png**: 1080x1920, splash screen with pink background (#FFE3E8)
- **adaptive-icon.png**: 1024x1024, Android adaptive icon (center 66% is safe zone)

## Quick Start: Using Placeholders

If you don't have images ready, use these placeholder options:

### Option 1: Online Placeholder Service

```javascript
// In your code, temporarily replace:
require('../../assets/npcs/anna.png')

// With:
{ uri: 'https://via.placeholder.com/300x300/FFB6C1/FFFFFF?text=Anna' }
```

### Option 2: Simple Colored Squares

Create solid color images:
- Anna: Pink (#FFB6C1)
- Sarah: Blue (#87CEEB)
- Tom: Green (#90EE90)
- Tony: Gray (#D3D3D3)

### Option 3: Use Emoji

Temporarily use emoji instead:
- Anna: ☕ or 👩
- Sarah: 📚 or 👩‍🦰
- Tom: 🎓 or 👨
- Tony: 🏦 or 👨‍💼

## Where to Get Images

### Free Stock Photos
- **Unsplash**: https://unsplash.com/
- **Pexels**: https://pexels.com/
- **Pixabay**: https://pixabay.com/

### AI Generation
- **DALL-E**: https://www.bing.com/images/create
- **Midjourney**: https://midjourney.com/ (requires subscription)
- **Stable Diffusion**: Various free tools

### Commission Artists
- **Fiverr**: Affordable character illustrations
- **Upwork**: Professional designers
- **Behance**: Portfolio browsing and contact

## Image Optimization

Before adding images, optimize them:

1. **Online Tools**:
   - TinyPNG: https://tinypng.com/
   - Squoosh: https://squoosh.app/

2. **Command Line** (if you have ImageMagick):
```bash
# Resize and optimize
magick input.png -resize 300x300 -quality 85 output.png
```

## Tips for Best Results

1. **Consistency**: Keep art style consistent across all NPCs
2. **Clarity**: Make sure faces/scenes are clear and recognizable
3. **File Size**: Keep under 500KB per image
4. **Format**: Use PNG for characters (transparency), JPG for backgrounds
5. **Aspect Ratio**: Maintain correct aspect ratios to avoid distortion

## Export from Figma

If you have designs in Figma:

1. Select the frame/component
2. Right panel > Export section
3. Choose format (PNG for characters, JPG for backgrounds)
4. Set scale (2x or 3x for high-res)
5. Click Export
6. Rename and move to correct folder

## Current Status

- [ ] NPC Avatars (4 images)
- [ ] Location Backgrounds (4 images)
- [ ] Location Icons (4 images)
- [ ] App Icon
- [ ] Splash Screen
- [ ] Adaptive Icon

Replace this checklist as you add images.

## Note

This is for MVP testing. You can use simple placeholders initially and replace with professional artwork later.
