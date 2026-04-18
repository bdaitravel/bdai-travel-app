import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ BDAI: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file.\n" +
    "Copy .env.example to .env and fill in the values."
  );
}

const originalConsoleError = console.error;
console.error = (...args) => {
    const msg = args[0];
    if (typeof msg === 'string' && (msg.includes('Refresh Token Not Found') || msg.includes('Invalid Refresh Token'))) return;
    if (msg && msg.message && (msg.message.includes('Refresh Token Not Found') || msg.message.includes('Invalid Refresh Token'))) return;
    originalConsoleError(...args);
};

export let supabase: any;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error("Critical Supabase Init Error:", e);
  const createMockQuery = () => {
    const query: any = {
      select: () => query,
      eq: () => query,
      ilike: () => query,
      order: () => query,
      limit: () => query,
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: null }),
      then: (onfulfilled: any) => Promise.resolve({ data: [], error: null }).then(onfulfilled)
    };
    return query;
  };

  supabase = {
    auth: { 
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOtp: async () => ({ error: new Error("Supabase not initialized") }),
      verifyOtp: async () => ({ error: new Error("Supabase not initialized") }),
      signInWithOAuth: async () => ({ error: new Error("Supabase not initialized") }),
      signOut: async () => ({ error: null })
    },
    from: () => ({ 
        select: createMockQuery,
        upsert: async () => ({ error: "Supabase not initialized" }),
        delete: () => ({ eq: () => ({ eq: async () => ({}) }) })
    }),
    storage: { from: () => ({ upload: async () => ({ error: "Storage failure" }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }
  };
}
