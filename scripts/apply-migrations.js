#!/usr/bin/env node

/**
 * Script to apply Supabase migrations
 * 
 * This script applies the database migrations to your Supabase project.
 * Make sure you have the Supabase CLI installed and your project linked.
 * 
 * Usage:
 *   node scripts/apply-migrations.js
 * 
 * Prerequisites:
 *   1. Install Supabase CLI: npm install -g supabase
 *   2. Login to Supabase: supabase login
 *   3. Link your project: supabase link --project-ref YOUR_PROJECT_REF
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Applying Supabase migrations...\n');

try {
  // Check if Supabase CLI is installed
  try {
    execSync('supabase --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Supabase CLI is not installed. Please install it first:');
    console.error('   npm install -g supabase');
    process.exit(1);
  }

  // Check if project is linked
  try {
    execSync('supabase status', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Supabase project is not linked. Please link it first:');
    console.error('   supabase link --project-ref YOUR_PROJECT_REF');
    process.exit(1);
  }

  // Apply migrations
  console.log('📦 Applying migrations...');
  execSync('supabase db push', { stdio: 'inherit' });

  console.log('\n✅ Migrations applied successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Verify your tables in the Supabase dashboard');
  console.log('2. Check that RLS policies are enabled');
  console.log('3. Test the authentication flow');
  console.log('4. Update your environment variables if needed');

} catch (error) {
  console.error('\n❌ Error applying migrations:', error.message);
  process.exit(1);
}
