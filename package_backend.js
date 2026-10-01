const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function buildBackendZip() {
  const buildDir = path.join(__dirname, 'backend_build');
  
  // Clean
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
  fs.mkdirSync(buildDir, { recursive: true });

  // Copy API files
  execSync('cp -r packages/api/dist backend_build/');
  execSync('cp packages/api/package.json backend_build/');
  
  if (fs.existsSync('.env')) {
    execSync('cp .env backend_build/');
  }
  if (fs.existsSync('packages/api/assets')) {
    execSync('cp -r packages/api/assets backend_build/');
  }
  if (fs.existsSync('packages/api/uploads')) {
    execSync('cp -r packages/api/uploads backend_build/');
  }

  // Copy shared
  execSync('cp -r shared backend_build/');

  // Modify package.json to include shared as a file dependency
  const pkgPath = path.join(buildDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  if (!pkg.dependencies) pkg.dependencies = {};
  pkg.dependencies['@gm-boutique/shared'] = 'file:./shared';
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  // Zip it
  execSync('cd backend_build && zip -ryq ../finalflash_backend.zip .');
  
  // Clean up
  fs.rmSync(buildDir, { recursive: true, force: true });
  
  console.log('finalflash_backend.zip created successfully with shared dependency injected!');
}

buildBackendZip();
