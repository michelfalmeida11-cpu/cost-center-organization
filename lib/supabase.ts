import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  // Keep runtime safe in environments where secrets are not set.
  console.warn('Supabase environment variables are missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).');
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseKey ?? 'placeholder-anon-key'
);

// Table: cost_centers (id, data JSONB)
export async function saveCostCenters(data: any[]) {
  if (!hasSupabaseConfig) return;
  const { error } = await supabase
    .from('cost_centers')
    .upsert({ id: 'main', data }, { onConflict: 'id' });
  if (error) console.error('Supabase save error:', error);
}

export async function loadCostCenters() {
  if (!hasSupabaseConfig) return null;
  const { data } = await supabase
    .from('cost_centers')
    .select('data')
    .eq('id', 'main')
    .single();
  return data?.data || null;
}

