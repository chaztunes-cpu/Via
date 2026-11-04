// Which data source the app uses.
//  - Live: Supabase, when the URL and publishable key are set (see .env).
//  - Demo: sample data saved in this browser. Used by the shareable
//    preview build, or whenever Supabase isn't configured.

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

export const DEMO_MODE =
  import.meta.env.MODE === 'preview-link' ||
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  !SUPABASE_URL ||
  !SUPABASE_KEY;
