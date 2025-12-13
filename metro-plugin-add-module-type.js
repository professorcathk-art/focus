/**
 * Metro plugin to add type="module" to script tags in HTML output
 */
module.exports = {
  serializer: {
    customSerializer: async (entryPoint, preModules, graph, options) => {
      const defaultSerializer = require('@expo/metro-config/build/serializer/serializerAssets');
      const result = await defaultSerializer(entryPoint, preModules, graph, options);
      
      // If this is a web bundle, modify the HTML to add type="module"
      if (options.platform === 'web' && result && result.html) {
        result.html = result.html.replace(
          /<script([^>]*src="[^"]*entry\.bundle[^"]*"[^>]*)>/g,
          '<script$1 type="module">'
        );
      }
      
      return result;
    },
  },
};

