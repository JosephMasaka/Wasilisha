#!/usr/bin/env node

/**
 * Setup checker script for Wasilisha
 * Run this to diagnose common issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Wasilisha setup...\n');

let hasErrors = false;

// Check 1: .env file exists
console.log('1. Checking .env file...');
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('   ❌ .env file not found. Copy .env.example to .env');
  hasErrors = true;
} else {
  console.log('   ✅ .env file exists');

  // Check required environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'AUTH_SECRET',
  ];

  const missingVars = requiredVars.filter(v => !envContent.includes(v + '='));
  if (missingVars.length > 0) {
    console.log('   ⚠️  Missing environment variables:', missingVars.join(', '));
    hasErrors = true;
  } else {
    console.log('   ✅ All required environment variables present');
  }
}

// Check 2: node_modules
console.log('\n2. Checking node_modules...');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('   ❌ node_modules not found. Run: npm install');
  hasErrors = true;
} else {
  console.log('   ✅ node_modules exists');
}

// Check 3: Prisma client
console.log('\n3. Checking Prisma client...');
const prismaClientPath = path.join(process.cwd(), 'node_modules', '@prisma', 'client');
if (!fs.existsSync(prismaClientPath)) {
  console.log('   ❌ Prisma client not found. Run: npx prisma generate');
  hasErrors = true;
} else {
  console.log('   ✅ Prisma client generated');
}

// Check 4: Database connection
console.log('\n4. Checking database connection...');
if (fs.existsSync(envPath)) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  prisma.$connect()
    .then(async () => {
      console.log('   ✅ Database connection successful');

      // Check if tables exist
      try {
        await prisma.company.findFirst();
        console.log('   ✅ Database tables exist');
      } catch (e) {
        console.log('   ⚠️  Database tables not found. Run: npm run db:push');
        hasErrors = true;
      }

      await prisma.$disconnect();

      if (hasErrors) {
        console.log('\n❌ Setup incomplete. Please fix the issues above.\n');
        process.exit(1);
      } else {
        console.log('\n✅ All checks passed! You\'re ready to run: npm run dev\n');
        process.exit(0);
      }
    })
    .catch((e) => {
      console.log('   ❌ Database connection failed:', e.message);
      console.log('   Check your DATABASE_URL in .env');
      hasErrors = true;
      console.log('\n❌ Setup incomplete. Please fix the issues above.\n');
      process.exit(1);
    });
} else {
  console.log('\n❌ Setup incomplete. Please fix the issues above.\n');
  process.exit(1);
}
