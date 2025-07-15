import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Required environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set.');
  process.exit(1);
}

// Initialize the Supabase client with the service role key (admin privileges)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  try {
    console.log('Starting migration: mmol to mg conversion');
    
    // Read the SQL migration file
    const sqlPath = path.join(process.cwd(), 'scripts', 'mmol-to-mg-migration.sql');
    const sqlCommands = fs.readFileSync(sqlPath, 'utf-8')
      .split(';')
      .filter(cmd => cmd.trim() !== '')
      .map(cmd => cmd.trim() + ';');
    
    // Display sample data before migration
    console.log('\nSample data BEFORE migration:');
    const { data: beforeData } = await supabase
      .from('hydration_options')
      .select('name, na_mmol, k_mmol')
      .limit(5);
    console.table(beforeData);
    
    // Execute each SQL command
    for (const command of sqlCommands) {
      // Skip comments
      if (command.startsWith('--')) continue;
      
      // Skip the verification SELECT statement
      if (command.toLowerCase().includes('select') && command.toLowerCase().includes('limit')) {
        continue;
      }
      
      console.log(`Executing: ${command.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('run_sql', { query: command });
      if (error) {
        throw new Error(`SQL error: ${error.message} while running: ${command}`);
      }
    }
    
    // Display sample data after migration
    console.log('\nSample data AFTER migration:');
    const { data: afterData } = await supabase
      .from('hydration_options')
      .select('name, na_mg, k_mg')
      .limit(5);
    console.table(afterData);
    
    console.log('\nMigration completed successfully!');
    console.log('IMPORTANT: Update all code that references na_mmol and k_mmol to use na_mg and k_mg instead.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
runMigration();
