const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('Verifying frontend build...');
const buildPath = path.join(__dirname, '../../client-new/build');
const indexHtmlPath = path.join(buildPath, 'index.html');

// Check if we're in production mode
if (process.env.NODE_ENV === 'production') {
  try {
    // Check if build directory exists
    if (!fs.existsSync(buildPath)) {
      console.log('Build directory not found. Attempting to create it...');
      
      // Try to run the build command
      exec('npm run build', (error, stdout, stderr) => {
        if (error) {
          console.error(`Build error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Build stderr: ${stderr}`);
        }
        console.log(`Build output: ${stdout}`);
        console.log('Build completed successfully.');
      });
    } 
    // Check if index.html exists
    else if (!fs.existsSync(indexHtmlPath)) {
      console.warn('Build directory exists but index.html not found. Frontend may not be properly built.');
      console.log('Running build process to fix...');
      
      exec('npm run build', (error, stdout, stderr) => {
        if (error) {
          console.error(`Build error: ${error.message}`);
          return;
        }
        console.log('Build completed successfully.');
      });
    } else {
      console.log('Frontend build verified successfully.');
    }
  } catch (err) {
    console.error('Error verifying build:', err);
  }
} else {
  console.log('Not in production mode. Skipping build verification.');
}
