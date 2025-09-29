import { createClient } from '@supabase/supabase-js';

let cachedClient = null;

export const getServiceSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missingVars = [];
  if (!supabaseUrl) missingVars.push('SUPABASE_URL');
  if (!serviceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missingVars.length > 0) {
    throw new Error(`Supabase service credentials are not configured. Missing: ${missingVars.join(', ')}`);
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey);
  }

  return cachedClient;
};
