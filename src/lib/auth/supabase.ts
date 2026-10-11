import AsyncStorage from '@react-native-async-storage/async-storage';
import {
	createClient,
	type SupabaseClient,
	type AuthChangeEvent,
	type Session
} from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
	const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
	const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !anon) return null;
	if (!client) {
		client = createClient(url, anon, {
			auth: {
				storage: AsyncStorage,
				storageKey: 'momexe:supabase-auth',
				persistSession: true,
				autoRefreshToken: true,
				detectSessionInUrl: false,
				flowType: 'pkce'
			}
		});
	}
	return client;
}

export async function sendOtp(email: string): Promise<void> {
	const supabase = getSupabase();
	if (!supabase) throw new Error('supabase not configured');
	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: {
			shouldCreateUser: true,
			emailRedirectTo: Linking.createURL('/login')
		}
	});
	if (error) throw new Error(error.message);
}

export async function verifyOtpEmail(email: string, token: string): Promise<string> {
	const supabase = getSupabase();
	if (!supabase) throw new Error('supabase not configured');
	const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
	if (error) throw new Error(error.message);
	return data.user?.id ?? '';
}

const TOKEN_TYPES = ['email', 'magiclink', 'signup', 'invite', 'recovery'] as const;

export async function consumeUrlToken(url: string | null = null): Promise<boolean> {
	const supabase = getSupabase();
	if (!supabase) return false;
	if (url) {
		const { queryParams } = Linking.parse(url);
		const tokenHash = queryParams?.token_hash;
		const type = queryParams?.type;
		if (
			typeof tokenHash === 'string' &&
			typeof type === 'string' &&
			(TOKEN_TYPES as readonly string[]).includes(type)
		) {
			const { data, error } = await supabase.auth.verifyOtp({
				token_hash: tokenHash,
				type: type as (typeof TOKEN_TYPES)[number]
			});
			if (!error && data.session) return true;
		}
	}
	const { data } = await supabase.auth.getSession();
	return Boolean(data.session);
}

export function onAuthEvent(
	cb: (event: AuthChangeEvent, session: Session | null) => void
): () => void {
	const supabase = getSupabase();
	if (!supabase) return () => undefined;
	const { data } = supabase.auth.onAuthStateChange(cb);
	return () => data.subscription.unsubscribe();
}

export async function getSessionUser(): Promise<{ id: string; email: string | null } | null> {
	const supabase = getSupabase();
	if (!supabase) return null;
	const { data } = await supabase.auth.getSession();
	const user = data.session?.user;
	return user ? { id: user.id, email: user.email ?? null } : null;
}

export async function getAuthToken(): Promise<string | undefined> {
	const supabase = getSupabase();
	if (!supabase) return undefined;
	const { data } = await supabase.auth.getSession();
	return data.session?.access_token ?? undefined;
}

export async function signOut(): Promise<void> {
	const supabase = getSupabase();
	if (supabase) await supabase.auth.signOut();
}
