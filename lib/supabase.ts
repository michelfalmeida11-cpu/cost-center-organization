import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Table: cost_centers (id, data JSONB)
export async function saveCostCenters(data: any[]) {
  const { error } = await supabase
    .from('cost_centers')
    .upsert({ id: 'main', data }, { onConflict: 'id' });
  if (error) console.error('Supabase save error:', error);
}

export async function loadCostCenters() {
  const { data } = await supabase
    .from('cost_centers')
    .select('data')
    .eq('id', 'main')
    .single();
  return data?.data || null;
}

