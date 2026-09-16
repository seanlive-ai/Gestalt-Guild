import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixzipadfbaaakwktmqdj.supabase.co';
const supabasePublishableKey = 'sb_publishable_5PIICeK1cUfPhdfs192VxA_xIMt0bM9';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
