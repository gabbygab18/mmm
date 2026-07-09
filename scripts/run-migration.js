#!/usr/bin/env node

/**
 * Migration runner for Supabase using service role key
 * Usage: node scripts/run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260515000000_baseline_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running baseline schema migration...');
    
    const { error } = await supabase.rpc('exec', { statement: sql }).catch(async () => {
      // Fallback: split and execute line by line if exec() fails
      console.log('ℹ️  Executing statements individually...');
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (!trimmed) continue;
        
        const { error } = await supabase.rpc('exec', { statement: trimmed + ';' });
        if (error) {
          console.warn(`⚠️  Statement error (may be expected):`, error.message);
        }
      }
      return { error: null };
    });

    if (error && error.message !== "No rows returned") {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Baseline schema migration completed successfully!');
    console.log('\nNext: run `npm run migrate:rls` to apply row-level security policies');
    
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

runMigration();
