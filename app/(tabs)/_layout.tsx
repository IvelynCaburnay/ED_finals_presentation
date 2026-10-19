
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/profiles';

type Role = 'student' | 'teacher' | 'admin';

const COLORS = {
  burgundy: '#701F35',
  darkBurgundy: '#351923',
  matcha: '#A8B88A',
  paleMatcha: '#E7EDD9',
  cream: '#F8F7F2',
  muted: '#8A8F7B',
  white: '#FFFFFF',
};

export default function TabsLayout() {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadRole(userId: string | null) {
      if (!userId) {
        if (mounted) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      try {
        const result = await getProfile(userId);

        if (!mounted) return;

        if (result.error) {
          console.error(
            'Unable to load profile:',
            result.error.message
          );
          setRole(null);
        } else if (result.data) {
          setRole(result.data.role as Role);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Profile loading error:', error);

        if (mounted) {
          setRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    async function initialize() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error(
            'Unable to get current user:',
            error.message
          );

          if (mounted) {
            setRole(null);
            setLoading(false);
          }

          return;
        }

        await loadRole(user?.id ?? null);
      } catch (error) {
        console.error('User initialization error:', error);

        if (mounted) {
          setRole(null);
          setLoading(false);
        }
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        if (!session?.user) {
          setRole(null);
          setLoading(false);
          return;
        }

        setLoading(true);

        // Load the user's role after the auth callback.
        void Promise.resolve().then(() => {
          if (mounted) {
            void loadRole(session.user.id);
          }
        });
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <Ionicons
            name="qr-code-outline"
            size={34}
            color={COLORS.burgundy}
          />
        </View>

        <ActivityIndicator
          size="large"
          color={COLORS.burgundy}
          style={styles.spinner}
        />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.burgundy,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: role === 'student' ? '/(tabs)' : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          href: role === 'student' ? '/(tabs)/scan' : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'qr-code' : 'qr-code-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          href: role === 'student' ? '/(tabs)/history' : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: role === 'student' ? '/(tabs)/profile' : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="teacher"
        options={{
          title: 'Teacher',
          href: role === 'teacher' ? '/(tabs)/teacher' : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'school' : 'school-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: role === 'admin' ? '/(tabs)/admin' : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },

  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: 23,
    backgroundColor: COLORS.paleMatcha,
    borderWidth: 1,
    borderColor: COLORS.matcha,
    justifyContent: 'center',
    alignItems: 'center',
  },

  spinner: {
    marginTop: 22,
  },

  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.paleMatcha,
    borderTopWidth: 2,
    height: 66,
    paddingTop: 7,
    paddingBottom: 7,
    elevation: 8,
    shadowColor: COLORS.darkBurgundy,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: -3,
    },
  },

  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  tabItem: {
    paddingVertical: 2,
  },
});
