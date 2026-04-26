import data from './seed-hosts.json';

/**
 * Static seed hosts — 580 accommodations along major European pilgrimage routes.
 * Includes 520 enriched entries and 60 new hosts for E1 and E5 routes.
 * Used as fallback when Supabase returns empty.
 *
 * Data is imported from seed-hosts.json for bundle optimization.
 */
export const SEED_HOSTS = data;
