#!/usr/bin/env node
/**
 * Setup Verification Script
 * Checks that all required configuration is in place before running the app
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== Contract Processor - Setup Verification ===\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Node.js version
console.log('1. Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

if (majorVersion >= 18) {
  console.log(`   ✓ Node.js ${nodeVersion} (OK)`);
} else {
  console.log(`   ✗ Node.js ${nodeVersion} - Version 18+ required`);
  hasErrors = true;
}

// Check 2: .env file exists
console.log('\n2. Checking for .env file...');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('   ✓ .env file found');

  // Check 3: Required environment variables
  console.log('\n3. Checking environment variables...');
  require('dotenv').config();

  const required = [
    'ANTHROPIC_API_KEY',
    'CONFLUENCE_BASE_URL',
    'CONFLUENCE_USER_EMAIL',
    'CONFLUENCE_API_TOKEN',
    'CONFLUENCE_SPACE_KEY'
  ];

  required.forEach(key => {
    if (process.env[key]) {
      const value = process.env[key];
      if (value.includes('your_') || value.includes('your-')) {
        console.log(`   ⚠ ${key}: Set but appears to be placeholder value`);
        hasWarnings = true;
      } else {
        const masked = value.substring(0, 8) + '***';
        console.log(`   ✓ ${key}: ${masked}`);
      }
    } else {
      console.log(`   ✗ ${key}: NOT SET`);
      hasErrors = true;
    }
  });

  // Optional variables
  const optional = ['CONFLUENCE_PARENT_PAGE_ID', 'PORT', 'MAX_FILE_SIZE_MB'];
  optional.forEach(key => {
    if (process.env[key]) {
      console.log(`   ✓ ${key}: ${process.env[key]} (optional)`);
    }
  });

} else {
  console.log('   ✗ .env file not found');
  console.log('   → Run: cp .env.example .env');
  hasErrors = true;
}

// Check 4: Dependencies installed
console.log('\n4. Checking dependencies...');
const nodeModulesPath = path.join(__dirname, 'node_modules');

if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✓ node_modules directory found');

  // Check key dependencies
  const keyDeps = [
    'express',
    '@anthropic-ai/sdk',
    'pdf-parse',
    'axios',
    'dotenv'
  ];

  let missingDeps = [];
  keyDeps.forEach(dep => {
    const depPath = path.join(nodeModulesPath, dep);
    if (fs.existsSync(depPath)) {
      console.log(`   ✓ ${dep} installed`);
    } else {
      console.log(`   ✗ ${dep} not found`);
      missingDeps.push(dep);
    }
  });

  if (missingDeps.length > 0) {
    console.log('\n   → Run: npm install');
    hasErrors = true;
  }
} else {
  console.log('   ✗ node_modules not found');
  console.log('   → Run: npm install');
  hasErrors = true;
}

// Check 5: TypeScript compilation
console.log('\n5. Checking TypeScript setup...');
const tsconfigPath = path.join(__dirname, 'tsconfig.json');

if (fs.existsSync(tsconfigPath)) {
  console.log('   ✓ tsconfig.json found');
} else {
  console.log('   ✗ tsconfig.json not found');
  hasErrors = true;
}

// Check 6: Source files
console.log('\n6. Checking source files...');
const requiredFiles = [
  'src/index.ts',
  'src/services/pdf.service.ts',
  'src/services/ai.service.ts',
  'src/services/confluence.service.ts',
  'src/services/processor.service.ts',
  'src/routes/contract.routes.ts'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} not found`);
    hasErrors = true;
  }
});

// Check 7: Upload directory
console.log('\n7. Checking upload directory...');
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const uploadPath = path.join(__dirname, uploadDir);

if (fs.existsSync(uploadPath)) {
  console.log(`   ✓ Upload directory exists: ${uploadDir}`);
} else {
  console.log(`   ⚠ Upload directory not found: ${uploadDir}`);
  console.log('   → Will be created automatically on first run');
  hasWarnings = true;
}

// Final summary
console.log('\n=== Verification Summary ===\n');

if (hasErrors) {
  console.log('❌ Setup incomplete - please fix the errors above\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Setup complete with warnings - please review above\n');
  console.log('You can proceed but may need to update configuration.\n');
  console.log('To start the server: npm run dev\n');
  process.exit(0);
} else {
  console.log('✅ All checks passed! Setup is complete.\n');
  console.log('To start the server:');
  console.log('  Development: npm run dev');
  console.log('  Production:  npm run build && npm start\n');
  console.log('To test with a contract:');
  console.log('  node example-usage.js\n');
  process.exit(0);
}
