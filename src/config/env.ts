export const env = {
  apiUrl: import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  appName: import.meta.env.VITE_APP_NAME || 'TAP KLASS',
};

export const isCloudConfigured = Boolean(env.apiUrl || (env.supabaseUrl && env.supabaseAnonKey));