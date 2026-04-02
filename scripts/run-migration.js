const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read migration SQL
  const migrationPath = path.join(__dirname, '../prisma/migrations/add_friend_system.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Running migration...');

  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      if (error) {
        console.error('Error executing statement:', statement.substring(0, 100));
        console.error(error);
      } else {
        console.log('✓ Executed:', statement.substring(0, 60) + '...');
      }
    } catch (err) {
      console.error('Failed to execute:', statement.substring(0, 100));
      console.error(err);
    }
  }

  console.log('Migration complete!');
}

runMigration().catch(console.error);
