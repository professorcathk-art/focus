const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add path alias support for @/
config.resolver = {
  ...config.resolver,
  alias: {
    "@": path.resolve(__dirname, "src"),
  },
};

// Fix for web platform - ensure proper module handling
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

// Add middleware to modify HTML response for web
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Intercept HTML responses and add type="module" to script tags
      if (req.url === '/' || req.url === '/index.html') {
        const originalEnd = res.end;
        res.end = function(chunk, encoding) {
          if (chunk && typeof chunk === 'string') {
            chunk = chunk.replace(
              /<script([^>]*src="[^"]*entry\.bundle[^"]*"[^>]*)>/g,
              '<script$1 type="module">'
            );
          }
          originalEnd.call(this, chunk, encoding);
        };
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });

