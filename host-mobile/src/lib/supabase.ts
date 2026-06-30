import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

/**
 * Add these keys to your .env file:
 *   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 */
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  (typeof import.meta !== 'undefined'
    ? (import.meta as ImportMeta & { env?: Record<string, string> }).env
        ?.EXPO_PUBLIC_SUPABASE_URL
    : undefined) ??
  '';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (typeof import.meta !== 'undefined'
    ? (import.meta as ImportMeta & { env?: Record<string, string> }).env
        ?.EXPO_PUBLIC_SUPABASE_ANON_KEY
    : undefined) ??
  '';

const normalizedUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');

export const supabase = createClient(normalizedUrl, supabaseAnonKey);
