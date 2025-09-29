import { getServiceSupabaseClient } from '../lib/supabase.js';
import { buildAggregation } from '../lib/aggregation.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let supabase;
  try {
    supabase = getServiceSupabaseClient();
  } catch (error) {
    console.error('Supabase configuration error:', error);
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const result = await buildAggregation(supabase, {
      start: req.query.start,
      end: req.query.end,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Unexpected error building aggregation:', error);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
