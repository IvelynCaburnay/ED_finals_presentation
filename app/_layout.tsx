
import {
  Stack,
  usePathname,
  useRouter,
} from 'expo-router';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  Session,
  User,
} from '@supabase/supabase-js';

import {
  supabase,
} from '@/lib/supabase';

import {
  getProfile,
} from '@/lib/profiles';

// ========================================
// COLORS
// ========================================

const COLORS = {
  burgundy: '#701F35',
  darkBurgundy: '#351923',
  burgundyText: '#4C2531',
  matcha: '#A8B88A',
  paleMatcha: '#E7EDD9',
  cream: '#F8F7F2',
  muted: '#8A8F7B',
  white: '#FFFFFF',
};

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  // ========================================
  // AUTH STATE
  // ========================================

  const [session, setSession] =
    useState<Session | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  // ========================================
  // ROLE
  // ========================================

  const [role, setRole] =
    useState<string | null>(null);

  const [roleLoading, setRoleLoading] =
    useState(false);

  // ========================================
  // INITIALIZE AUTHENTICATION
  // ========================================

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        console.log('ROOT: INITIALIZING AUTH');

        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (error) {
          console.log(
            'ROOT: AUTH ERROR:',
            error.message
          );

          setSession(null);
          setUser(null);
          setAuthLoading(false);
          return;
        }

        const currentSession =
          data.session ?? null;

        console.log(
          'ROOT: SESSION:',
          currentSession ? 'FOUND' : 'NONE'
        );

        console.log(
          'ROOT: USER:',
          currentSession?.user?.email ?? 'NONE'
        );

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setAuthLoading(false);

        console.log('ROOT: AUTH READY');
      } catch (error: any) {
        console.log(
          'ROOT: AUTH EXCEPTION:',
          error?.message
        );

        if (mounted) {
          setSession(null);
          setUser(null);
          setAuthLoading(false);
        }
      }
    }

    initialize();

    // ========================================
    // AUTH STATE LISTENER
    // ========================================

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log(
          'ROOT: AUTH EVENT:',
          event
        );

        console.log(
          'ROOT: AUTH USER:',
          newSession?.user?.email ?? 'NONE'
        );

        if (!mounted) {
          return;
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setAuthLoading(false);

        if (!newSession?.user) {
          setRole(null);
          setRoleLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ========================================
  // LOAD USER PROFILE AND ROLE
  // ========================================

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!user) {
        setRole(null);
        setRoleLoading(false);
        return;
      }

      console.log('ROOT: LOADING PROFILE');
      console.log('ROOT: USER:', user.email);

      setRoleLoading(true);
      setRole(null);

      try {
        const result = await getProfile(user.id);

        if (!mounted) {
          return;
        }

        if (result.error) {
          console.log(
            'ROOT: PROFILE ERROR:',
            result.error.message
          );

          setRole(null);
          return;
        }

        if (!result.data) {
          console.log('ROOT: PROFILE NOT FOUND');
          setRole(null);
          return;
        }

        console.log(
          'ROOT: ROLE:',
          result.data.role
        );

        setRole(result.data.role);
      } catch (error: any) {
        console.log(
          'ROOT: PROFILE EXCEPTION:',
          error?.message
        );

        if (mounted) {
          setRole(null);
        }
      } finally {
        if (mounted) {
          setRoleLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  // ========================================
  // NAVIGATION
  // ========================================

  useEffect(() => {
    if (authLoading || roleLoading) {
      return;
    }

    console.log('ROOT: NAVIGATION CHECK');
    console.log('ROOT: ROLE:', role ?? 'NONE');
    console.log('ROOT: PATH:', pathname);

    const isLogin = pathname === '/login';
    const isRegister = pathname === '/register';
    const isAuthPage = isLogin || isRegister;

    // ----------------------------------------
    // USER NOT LOGGED IN
    // ----------------------------------------

    if (!user) {
      if (!isAuthPage) {
        console.log('ROOT: REDIRECTING TO LOGIN');
        router.replace('/login');
      }

      return;
    }

    // ----------------------------------------
    // USER LOGGED IN BUT ROLE NOT READY
    // ----------------------------------------

    if (!role) {
      console.log('ROOT: WAITING FOR ROLE');
      return;
    }

    // ----------------------------------------
    // USER ON LOGIN OR REGISTER
    // ----------------------------------------

    if (isAuthPage) {
      console.log('ROOT: REDIRECTING USER');

      if (role === 'admin') {
        router.replace('/(tabs)/admin');
      } else if (role === 'teacher') {
        router.replace('/(tabs)/teacher');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [
    authLoading,
    roleLoading,
    user,
    role,
    pathname,
    router,
  ]);

  // ========================================
  // LOADING SCREEN
  // ========================================

  if (authLoading || roleLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator
            size="large"
            color={COLORS.burgundy}
          />
        </View>

        <Text style={styles.loadingTitle}>
          QR-ATT
        </Text>

        <Text style={styles.loadingText}>
          Preparing your dashboard...
        </Text>

        <View style={styles.loadingBar}>
          <View style={styles.loadingBarFill} />
        </View>
      </View>
    );
  }

  // ========================================
  // ROUTER
  // ========================================

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: COLORS.cream,
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    padding: 24,
  },

  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: COLORS.paleMatcha,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.matcha,
  },

  loadingTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.burgundy,
    letterSpacing: 2,
  },

  loadingText: {
    marginTop: 9,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },

  loadingBar: {
    width: 150,
    height: 5,
    borderRadius: 10,
    backgroundColor: COLORS.paleMatcha,
    overflow: 'hidden',
    marginTop: 25,
  },

  loadingBarFill: {
    width: '65%',
    height: '100%',
    backgroundColor: COLORS.burgundy,
    borderRadius: 10,
  },
});
