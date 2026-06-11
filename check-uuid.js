import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const shortId = '7863e819';
  console.log('Testing .ilike on UUID column directly');
  const { data, error } = await supabase.from('projects').select('id').ilike('id', `${shortId}%`).limit(1);
  console.log('Result ilike UUID:', data);
  if (error) console.error('Error ilike UUID:', error);
  
  console.log('Testing casting with .textSearch');
  const { data: data2, error: error2 } = await supabase.from('projects').select('id').textSearch('id::text', shortId).limit(1);
  console.log('Result textSearch UUID:', data2);
  if (error2) console.error('Error textSearch UUID:', error2);
}

main();
