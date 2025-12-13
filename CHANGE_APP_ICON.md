# How to Change Your App Icon

## Current Icon Location

Your app icon is located at:
- **`assets/icon.png`** - Main app icon (1024x1024 pixels)

## Requirements

### iOS Icon
- **File:** `assets/icon.png`
- **Size:** 1024x1024 pixels
- **Format:** PNG
- **Background:** Can be transparent or solid color

### Android Icon
- **File:** `assets/adaptive-icon.png`
- **Size:** 1024x1024 pixels
- **Format:** PNG
- **Note:** Should have a foreground image (the icon) and background color

## Step-by-Step Guide

### Option 1: Replace with Your Own Image

1. **Create your icon:**
   - Use any image editor (Photoshop, Figma, Canva, etc.)
   - Create a 1024x1024 pixel square image
   - Save as PNG

2. **Replace the files:**
   ```bash
   # Replace iOS icon
   cp your-icon.png assets/icon.png
   
   # Replace Android adaptive icon (same or different)
   cp your-icon.png assets/adaptive-icon.png
   ```

3. **Update app.json** (if needed):
   - The icon paths are already configured in `app.json`
   - No changes needed unless you want different icons

4. **Rebuild your app:**
   ```bash
   # For development/testing
   eas build --platform ios --profile preview
   
   # For production
   eas build --platform ios --profile production
   ```

### Option 2: Use Online Icon Generators

**Recommended Tools:**
- **AppIcon.co**: https://www.appicon.co/
  - Upload one image
  - Generates all required sizes automatically
  
- **IconKitchen**: https://icon.kitchen/
  - Google's icon generator
  - Great for Android adaptive icons

- **Favicon.io**: https://favicon.io/
  - Simple icon generator
  - Good for quick icons

**Process:**
1. Upload your icon image (or create one)
2. Download the generated icons
3. Replace files in `assets/` folder
4. Rebuild app

### Option 3: Use Expo's Icon Generator

Expo can generate icons from a single source image:

```bash
# Install expo-cli if needed
npm install -g expo-cli

# Generate icons (if you have a source image)
npx expo-cli generate-icon
```

## File Structure

```
assets/
├── icon.png              # iOS app icon (1024x1024)
├── adaptive-icon.png     # Android adaptive icon (1024x1024)
├── splash.png            # Splash screen (1242x2436)
└── favicon.png           # Web favicon (48x48)
```

## Design Tips

### Best Practices:
- ✅ Use simple, recognizable designs
- ✅ Ensure icon looks good at small sizes
- ✅ Use high contrast colors
- ✅ Avoid text (hard to read when small)
- ✅ Test on both light and dark backgrounds

### iOS Guidelines:
- Icons are automatically rounded by iOS
- Don't add rounded corners yourself
- Use square images (iOS will mask them)

### Android Guidelines:
- Adaptive icons support foreground/background layers
- Foreground: Your icon (should be centered)
- Background: Solid color or pattern

## After Changing Icons

1. **Commit changes:**
   ```bash
   git add assets/icon.png assets/adaptive-icon.png
   git commit -m "Update app icons"
   ```

2. **Rebuild:**
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

3. **Test:**
   - Install the new build
   - Verify icon appears correctly
   - Check both light and dark mode (if applicable)

## Quick Example

```bash
# 1. Create your icon (1024x1024 PNG)
# Save as: my-app-icon.png

# 2. Replace existing icon
cp my-app-icon.png assets/icon.png
cp my-app-icon.png assets/adaptive-icon.png

# 3. Commit
git add assets/
git commit -m "Update app icon"

# 4. Rebuild
eas build --platform ios --profile production
```

## Troubleshooting

### Icon doesn't update
- ✅ Make sure you rebuilt the app (icons are baked into the build)
- ✅ Verify file size is 1024x1024
- ✅ Check file format is PNG
- ✅ Clear app cache and reinstall

### Icon looks blurry
- ✅ Ensure source image is 1024x1024 or larger
- ✅ Use high-quality source image
- ✅ Avoid upscaling small images

### Icon not showing
- ✅ Verify file exists at `assets/icon.png`
- ✅ Check `app.json` references correct path
- ✅ Rebuild app after changes

## Current Configuration

Your `app.json` is already configured:
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    }
  }
}
```

Just replace the PNG files and rebuild!

