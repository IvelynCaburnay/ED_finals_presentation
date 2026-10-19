
import { Tabs, useRouter } from 'expo-router';
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
  burgundyText: '#4C2531',
  matcha: '#A8B88A',
  paleMatcha: '#E7EDD9',
  cream: '#F8F7F2',
  muted: '#8A8F7B',
  white: '#FFFFFF',
  border: '#E7E5DC',
};

export default function TabsLayout() {
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error || !user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const profileResult = await getProfile(user.id);

        if (!mounted) return;

        if (profileResult.error) {
          console.error(
            'Unable to load profile:',
            profileResult.error.message
          );
          setRole(null);
        } else if (profileResult.data) {
          setRole(profileResult.data.role as Role);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('User loading error:', error);

        if (mounted) {
          setRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (!session?.user) {
          setRole(null);
          setLoading(false);

          // Do not navigate from the tab layout here.
          // The app's authentication routing can handle
          // the login screen.
          return;
        }

        setLoading(true);

        try {
          const profileResult = await getProfile(
            session.user.id
          );

          if (!mounted) return;

          if (profileResult.error) {
            console.error(
              'Auth profile error:',
              profileResult.error.message
            );
            setRole(null);
          } else if (profileResult.data) {
            setRole(profileResult.data.role as Role);
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error('Auth profile error:', error);

          if (mounted) {
            setRole(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
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
              name={
                focused
                  ? 'school'
                  : 'school-outline'
              }
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
              name={
                focused
                  ? 'settings'
                  : 'settings-outline'
              }
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
