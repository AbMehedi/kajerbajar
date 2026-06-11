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
  console.log('Testing .gte and .lte on UUID column');
  const minUuid = `${shortId}-0000-0000-0000-000000000000`;
  const maxUuid = `${shortId}-ffff-ffff-ffff-ffffffffffff`;
  
  const { data, error } = await supabase.from('projects').select('id')
    .gte('id', minUuid)
    .lte('id', maxUuid)
    .limit(1);
    
  console.log('Result range UUID:', data);
  if (error) console.error('Error range UUID:', error);
}

main();
