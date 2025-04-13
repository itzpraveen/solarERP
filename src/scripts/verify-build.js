const fs = require('fs');
const path = require('path');
// Removed require('child_process') as nothing was used from it

console.log('Verifying frontend build...');
const buildPath = path.join(__dirname, '../../client-new/build');
const indexHtmlPath = path.join(buildPath, 'index.html');
const cssPath = path.join(buildPath, 'static/css');
const jsPath = path.join(buildPath, 'static/js');

// Check if we're in production mode
if (process.env.NODE_ENV === 'production') {
  try {
    // Check if build directory exists
    if (!fs.existsSync(buildPath)) {
      console.log(
        'Build directory not found. This could cause "Cannot GET /" errors.'
      );
      console.log(
        'The frontend build may be missing. Check your deployment configuration.'
      );
    }
    // Check if index.html exists
    else if (!fs.existsSync(indexHtmlPath)) {
      console.warn(
        'Build directory exists but index.html not found. Frontend may not be properly built.'
      );
      console.log(
        'Static files may be missing, which could cause "Cannot GET /" errors.'
      );
    }
    // Check for static assets
    else if (!fs.existsSync(cssPath) || !fs.existsSync(jsPath)) {
      console.warn('Static assets (CSS/JS) not found in the build directory.');
      console.log('This may cause the frontend to load incorrectly.');
    } else {
      console.log('Frontend build verified successfully.');
      console.log('Static files will be served from:', buildPath);
    }
  } catch (err) {
    console.error('Error verifying build:', err);
  }
} else {
  console.log('Not in production mode. Skipping build verification.');
}
