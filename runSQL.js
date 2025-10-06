require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function runSQLCommands() {
  console.log('🗄️  Running SQL commands to add missing columns...');
  
  try {
    // Try to add columns - these will be ignored if they already exist
    const sqlCommands = [
      "ALTER TABLE public.services ADD COLUMN IF NOT EXISTS notes text;",
      "ALTER TABLE public.services ADD COLUMN IF NOT EXISTS inclusions jsonb DEFAULT '[]';",
      "ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url character varying;"
    ];
    
    for (const sql of sqlCommands) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        console.log(`✅ Executed: ${sql}`);
      } catch (err) {
        console.log(`⚠️  Could not execute SQL directly: ${err.message}`);
        console.log('Please run these commands manually in Supabase SQL editor:');
        console.log('----------------------------------------');
        sqlCommands.forEach(cmd => console.log(cmd));
        console.log('----------------------------------------');
        break;
      }
    }
    
    // Test if columns exist by trying to select them
    const { data, error } = await supabase
      .from('services')
      .select('key, notes, inclusions, image_url')
      .limit(1);
      
    if (error) {
      console.log('⚠️  Columns might not exist yet. Please run the SQL commands manually.');
      console.log('SQL Commands to run:');
      console.log('----------------------------------------');
      sqlCommands.forEach(cmd => console.log(cmd));
      console.log('----------------------------------------');
    } else {
      console.log('✅ All columns exist and accessible!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runSQLCommands();