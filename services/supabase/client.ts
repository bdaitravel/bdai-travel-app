import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Placeholder Database type for projects without generated Supabase types.
// All table/view/function access returns `any`-valued rows, preserving existing
// dynamic query patterns. Replace with `npx supabase gen types typescript`
// output for full end-to-end type safety.
//
// The Views entry must include `Relationships` to satisfy `GenericView` (supabase-js 2.49+).
// Without it, the Schema generic collapses to `never` and every query result becomes `never`.
type UntypedDatabase = {
    public: {
        Tables: Record<string, { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: never[]; }>;
        Views: Record<string, { Row: Record<string, any>; Relationships: never[]; }>;
        Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown; }>;
        Enums: Record<string, string>;
        CompositeTypes: Record<string, any>;
    };
};

type SupabaseClientType = SupabaseClient<UntypedDatabase>;

interface MockQueryBuilder {
    select: () => MockQueryBuilder;
    eq: () => MockQueryBuilder;
    ilike: () => MockQueryBuilder;
    order: () => MockQueryBuilder;
    limit: () => MockQueryBuilder;
    maybeSingle: () => Promise<{ data: null; error: null }>;
    single: () => Promise<{ data: null; error: null }>;
    then: <T>(onfulfilled: (value: { data: unknown[]; error: null }) => T) => Promise<T>;
}

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

export let supabase: SupabaseClientType;
try {
    supabase = createClient(supabaseUrl, supabaseAnonKey) as SupabaseClientType;
} catch (e) {
    console.error("Critical Supabase Init Error:", e);
    const createMockQuery = (): MockQueryBuilder => {
        const query: MockQueryBuilder = {
            select: () => query,
            eq: () => query,
            ilike: () => query,
            order: () => query,
            limit: () => query,
            maybeSingle: async () => ({ data: null, error: null }),
            single: async () => ({ data: null, error: null }),
            then: <T>(onfulfilled: (value: { data: unknown[]; error: null }) => T) => Promise.resolve({ data: [], error: null }).then(onfulfilled)
        };
        return query;
    };

    supabase = {
        auth: {
            getSession: async () => ({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
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
    } as unknown as SupabaseClientType;
}
