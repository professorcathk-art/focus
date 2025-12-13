# What is a Favicon?

## Definition

**Favicon** = "Favorite Icon" - a small icon associated with a website or web app.

## Where You See Favicons

### In Web Browsers:
- ✅ **Browser Tab** - Small icon next to the page title
- ✅ **Bookmarks** - Icon shown in bookmark lists
- ✅ **Browser History** - Icon in history entries
- ✅ **Home Screen** - Icon when saving web app to home screen (mobile)
- ✅ **Search Results** - Sometimes shown in search engine results

### Example:
```
┌─────────────────────────────────┐
│ [🔍] Focus - Your Ideas App     │ ← Favicon here
└─────────────────────────────────┘
```

## For Your Focus App

### Current Setup:
- **File:** `assets/favicon.png` (48x48 pixels)
- **Location:** Configured in `app.json` → `web.favicon`
- **Purpose:** Used when your app runs in a web browser

### When It's Used:
- ✅ **Web Version** - If you deploy your app as a web app
- ✅ **Expo Web** - When running `expo start --web`
- ✅ **Browser Testing** - During web development

### When It's NOT Used:
- ❌ **Native iOS App** - Uses `icon.png` instead
- ❌ **Native Android App** - Uses `adaptive-icon.png` instead
- ❌ **Expo Go** - Uses Expo's default icon

## Technical Details

### Standard Sizes:
- **16x16** - Classic favicon size
- **32x32** - Modern standard
- **48x48** - High-resolution (your current)
- **180x180** - Apple touch icon (iOS home screen)

### File Formats:
- **PNG** - Most common (your current)
- **ICO** - Traditional format
- **SVG** - Scalable vector (modern browsers)

### Current Configuration:

In your `app.json`:
```json
{
  "expo": {
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

## Do You Need It?

### If You're Building:
- ✅ **Web App** - Yes, important for branding
- ✅ **PWA (Progressive Web App)** - Yes, required
- ❌ **Native iOS/Android Only** - Not necessary

### For Your Focus App:
Since you're primarily building a **native mobile app**, the favicon is:
- ✅ Nice to have (if you ever deploy web version)
- ✅ Already configured (no action needed)
- ❌ Not critical for mobile app functionality

## How to Update It

1. **Create new favicon:**
   - Size: 48x48 or 32x32 pixels
   - Format: PNG
   - Design: Simple, recognizable icon

2. **Replace file:**
   ```bash
   cp your-favicon.png assets/favicon.png
   ```

3. **Test in browser:**
   ```bash
   npm start
   # Then press 'w' to open web version
   ```

## Best Practices

- ✅ **Keep it simple** - Small size means details get lost
- ✅ **High contrast** - Should be visible at tiny sizes
- ✅ **Square design** - Works best in square format
- ✅ **Brand consistent** - Should match your app icon

## Summary

**Favicon = Small icon for web browsers**

- Used in: Browser tabs, bookmarks, web version
- Not used in: Native iOS/Android apps
- Your app: Already configured, optional for mobile-only app
- Size: 48x48 pixels (current)

**Bottom Line:** 
- For native mobile apps → Not critical
- For web apps → Important for branding
- You already have one → No action needed unless deploying web version

