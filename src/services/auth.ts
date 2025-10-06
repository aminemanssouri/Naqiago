import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: 'customer' | 'worker';
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  // Sign up new user
  async signUp({ email, password, fullName, phone, role = 'customer' }: SignUpData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Supabase may return a user object even when the email already exists
      // In that case, user.identities can be an empty array. Treat this as duplicate email.
      const identities = (authData.user as any)?.identities as any[] | undefined;
      if (Array.isArray(identities) && identities.length === 0) {
        throw Object.assign(new Error('This email is already registered. Please sign in or use a different email.'), {
          code: 'user_already_exists',
          status: 409,
        });
      }

      // If email confirmation is enabled, there may be NO session after signUp.
      // In that case, client-side upsert will run as anon and be blocked by RLS.
      // Only attempt upsert if we have a session; otherwise rely on a DB trigger.
      if (authData.session) {
        const userId = authData.user.id;
        const profilePayload: ProfileInsert = {
          id: userId,
          email,
          full_name: fullName,
          phone,
          role,
        } as ProfileInsert;

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'id' });
        if (profileError) {
          console.error('Create profile error (with session):', profileError);
        }
      } else {
        console.log('No session after signUp; skipping client upsert and relying on DB trigger to create profile.');
      }

      return { user: authData.user, session: authData.session };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Sign in existing user
  async signIn({ email, password }: SignInData) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // If profile is missing (e.g., legacy user), create a minimal one
      let ensuredProfile = profile as Profile | undefined;
      if (!ensuredProfile) {
        const minimal: ProfileInsert = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User'),
          phone: user.user_metadata?.phone || null,
          role: (user.user_metadata?.role as Profile['role']) || 'customer',
        } as ProfileInsert;
        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .upsert(minimal, { onConflict: 'id' })
          .select('*')
          .single();
        if (createErr) {
          console.error('Ensure profile error:', createErr);
        } else {
          ensuredProfile = created as Profile;
        }
      }

      return {
        id: user.id,
        email: user.email!,
        profile: ensuredProfile || undefined,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: ProfileUpdate) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email: string) {
    try {
      const redirectTo = (process.env as any)?.EXPO_PUBLIC_SUPABASE_REDIRECT || 'carwashpro://reset-password';
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Update password after user opens the recovery magic link (session is established)
  async updatePassword(newPassword: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
