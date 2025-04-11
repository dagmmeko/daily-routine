#!/usr/bin/env node

/**
 * Database Sync Script
 * This script helps sync your local schema with the hosted Supabase database.
 * 
 * Usage:
 * npm run sync-database
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Constants
const MIGRATION_PATH = path.join(__dirname, '..', 'migrations', 'complete_db_sync.sql');

// Check if environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Environment variables not set. Please set:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    console.log('📊 Starting database schema synchronization...');
    
    // Read migration SQL file
    console.log('📂 Reading migration file...');
    if (!fs.existsSync(MIGRATION_PATH)) {
      console.error(`❌ Migration file not found at: ${MIGRATION_PATH}`);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(MIGRATION_PATH, 'utf8');
    
    // Execute SQL
    console.log('🔄 Applying migration to database...');
    const { error } = await supabase.rpc('pgmigrate', { query: migrationSQL });
    
    if (error) {
      console.error('❌ Error applying migration:');
      console.error(error);
      process.exit(1);
    }
    
    console.log('✅ Database schema synchronized successfully!');
    console.log('');
    console.log('Your local TypeScript types and database schema are now in sync.');
    console.log('You can restart your application to apply these changes.');
    
  } catch (error) {
    console.error('❌ An unexpected error occurred:');
    console.error(error);
    process.exit(1);
  }
}

main(); 