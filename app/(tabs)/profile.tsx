
import {
  useFocusEffect,
  useRouter,
} from 'expo-router';

import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/profiles';

type ProfileData = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'teacher' | 'admin';
};

const COLORS = {
  burgundy: '#701F35',
  darkBurgundy: '#351923',
  burgundyText: '#4C2531',
  matcha: '#A8B88A',
  paleMatcha: '#E7EDD9',
  cream: '#F8F7F2',
  white: '#FFFFFF',
  muted: '#8A8F7B',
  border: '#E5E3D8',
};

export default function ProfileScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // LOAD PROFILE
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      console.log('PROFILE: Loading authenticated user...');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log('PROFILE: USER ERROR:', userError.message);
        setProfile(null);
        return;
      }

      if (!user) {
        console.log('PROFILE: NO USER');
        setProfile(null);
        setUserEmail('');
        return;
      }

      setUserEmail(user.email ?? '');

      const result = await getProfile(user.id);

      if (result.error) {
        console.log(
          'PROFILE: DATABASE ERROR:',
          result.error.message
        );

        setProfile(null);
        return;
      }

      if (!result.data) {
        console.log('PROFILE: PROFILE NOT FOUND');
        setProfile(null);
        return;
      }

      setProfile(result.data);
    } catch (error: any) {
      console.log('PROFILE: EXCEPTION:', error?.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // LOAD WHEN SCREEN OPENS
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // LOGOUT
  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      const result = await signOut();

      if (result.error) {
        setLoggingOut(false);

        Alert.alert(
          'Logout Error',
          result.error.message
        );

        return;
      }

      // The auth-state listener or existing app routing
      // should handle the redirect after successful logout.
    } catch (error: any) {
      setLoggingOut(false);

      Alert.alert(
        'Logout Error',
        error?.message ?? 'Unable to logout.'
      );
    }
  }

  // LOADING SCREEN
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="person-outline"
              size={34}
              color={COLORS.burgundy}
            />
          </View>

          <ActivityIndicator
            size="large"
            color={COLORS.burgundy}
          />

          <Text style={styles.loadingTitle}>
            Loading Profile
          </Text>

          <Text style={styles.loadingText}>
            Preparing your account information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // PROFILE VALUES
  const fullName = profile?.full_name ?? 'User';
  const email = profile?.email || userEmail || 'No email available';
  const role = profile?.role ?? 'student';

  const roleLabel = role.toUpperCase();

  const roleIcon =
    role === 'admin'
      ? 'shield-checkmark'
      : role === 'teacher'
        ? 'school'
        : 'person';

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* PROFILE HEADER */}
        <View style={styles.header}>
          <View style={styles.headerDecoration} />
          <View style={styles.headerDecorationSmall} />

          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="person-circle-outline"
                size={25}
                color={COLORS.burgundy}
              />
            </View>

            <View style={styles.headerBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerBadgeText}>
                MY ACCOUNT
              </Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>
            QR-ATTENTANCE MANAGEMENT
          </Text>

          <Text style={styles.headerTitle}>
            Your Profile.
          </Text>

          <Text style={styles.headerSubtitle}>
            Manage your account details and view your
            QR-ATT account information.
          </Text>

          <View style={styles.profileIdentity}>
            <View style={styles.avatar}>
              {initials ? (
                <Text style={styles.avatarInitials}>
                  {initials}
                </Text>
              ) : (
                <Ionicons
                  name="person"
                  size={40}
                  color={COLORS.burgundy}
                />
              )}

              <View style={styles.avatarCheck}>
                <Ionicons
                  name="checkmark"
                  size={13}
                  color={COLORS.darkBurgundy}
                />
              </View>
            </View>

            <Text style={styles.name}>
              {fullName}
            </Text>

            <Text style={styles.emailPreview}>
              {email}
            </Text>

            <View style={styles.roleBadge}>
              <Ionicons
                name={roleIcon as any}
                size={14}
                color={COLORS.darkBurgundy}
              />

              <Text style={styles.roleBadgeText}>
                {roleLabel}
              </Text>
            </View>
          </View>

          <View style={styles.headerBottomLine} />
        </View>

        {/* ACCOUNT OVERVIEW */}
        <View style={styles.sectionHeading}>
          <View style={styles.sectionMarker} />

          <View style={styles.sectionHeadingInfo}>
            <Text style={styles.sectionTitle}>
              Account Overview
            </Text>

            <Text style={styles.sectionSubtitle}>
              Your personal account details
            </Text>
          </View>
        </View>

        {/* PERSONAL INFORMATION */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="person-outline"
                size={22}
                color={COLORS.burgundy}
              />
            </View>

            <View style={styles.cardHeaderInfo}>
              <Text style={styles.cardTitle}>
                Personal Information
              </Text>

              <Text style={styles.cardSubtitle}>
                Information linked to your account
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* FULL NAME */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="person-outline"
                size={18}
                color={COLORS.muted}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>
                FULL NAME
              </Text>

              <Text style={styles.value}>
                {fullName}
              </Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* EMAIL */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={COLORS.muted}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>
                EMAIL ADDRESS
              </Text>

              <Text style={styles.value}>
                {email}
              </Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* ACCOUNT TYPE */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={COLORS.muted}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>
                ACCOUNT TYPE
              </Text>

              <Text style={styles.value}>
                {roleLabel}
              </Text>
            </View>

            <View style={styles.roleMiniBadge}>
              <Text style={styles.roleMiniText}>
                VERIFIED ROLE
              </Text>
            </View>
          </View>
        </View>

        {/* ACCOUNT SECURITY NOTE */}
        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={23}
              color={COLORS.burgundy}
            />
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Account Information
            </Text>

            <Text style={styles.securityText}>
              Your profile details are retrieved from your
              authenticated QR-ATT account.
            </Text>
          </View>
        </View>

        {/* LOGOUT */}
        <Text style={styles.logoutHeading}>
          ACCOUNT ACTIONS
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            loggingOut && styles.disabledButton,
            pressed && !loggingOut && styles.logoutPressed,
          ]}
          onPress={handleLogout}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel="Log out of your account"
        >
          {loggingOut ? (
            <>
              <ActivityIndicator
                color={COLORS.white}
                size="small"
              />

              <Text style={styles.logoutText}>
                LOGGING OUT...
              </Text>
            </>
          ) : (
            <>
              <View style={styles.logoutIcon}>
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color={COLORS.white}
                />
              </View>

              <Text style={styles.logoutText}>
                LOG OUT
              </Text>

              <Ionicons
                name="arrow-forward"
                size={19}
                color={COLORS.white}
                style={styles.logoutArrow}
              />
            </>
          )}
        </Pressable>

        <View style={styles.footer}>
          <View style={styles.footerLine} />

          <Text style={styles.footerBrand}>
            QR-ATT
          </Text>

          <Text style={styles.footerText}>
            Smart School Event Attendance Management
          </Text>

          <View style={styles.footerLine} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 35,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    padding: 25,
  },

  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: COLORS.paleMatcha,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  loadingTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.darkBurgundy,
    marginTop: 16,
  },

  loadingText: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
  },

  // HEADER
  header: {
    backgroundColor: COLORS.burgundy,
    padding: 22,
    paddingTop: 20,
    borderRadius: 27,
    marginBottom: 28,
    overflow: 'hidden',
  },

  headerDecoration: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: COLORS.white,
    opacity: 0.045,
    right: -85,
    top: 75,
  },

  headerDecorationSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 22,
    borderColor: COLORS.matcha,
    opacity: 0.14,
    right: 20,
    top: -65,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 27,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: COLORS.paleMatcha,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#78965F',
    marginRight: 7,
  },

  headerBadgeText: {
    color: COLORS.burgundy,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  eyebrow: {
    color: COLORS.matcha,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 8,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -0.6,
  },

  headerSubtitle: {
    color: '#F0E4E6',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 290,
  },

  profileIdentity: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 22,
    marginTop: 25,
    paddingHorizontal: 15,
    paddingTop: 23,
    paddingBottom: 20,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: COLORS.paleMatcha,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  avatarInitials: {
    color: COLORS.burgundy,
    fontSize: 27,
    fontWeight: '900',
  },

  avatarCheck: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: COLORS.matcha,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  name: {
    color: COLORS.darkBurgundy,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },

  emailPreview: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paleMatcha,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginTop: 13,
    gap: 7,
  },

  roleBadgeText: {
    color: COLORS.darkBurgundy,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  headerBottomLine: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 3,
    backgroundColor: COLORS.matcha,
    marginTop: 20,
  },

  // SECTION HEADINGS
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },

  sectionMarker: {
    width: 5,
    height: 43,
    borderRadius: 4,
    backgroundColor: COLORS.matcha,
    marginRight: 12,
  },

  sectionHeadingInfo: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.darkBurgundy,
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },

  // INFORMATION CARD
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 23,
    padding: 19,
    marginBottom: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.darkBurgundy,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.paleMatcha,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  cardHeaderInfo: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.darkBurgundy,
  },

  cardSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 16,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 6,
  },

  // INFORMATION ROWS
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },

  infoIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontSize: 9,
    color: COLORS.muted,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 6,
  },

  value: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.burgundyText,
  },

  rowDivider: {
    height: 1,
    backgroundColor: '#F0EFE9',
  },

  roleMiniBadge: {
    backgroundColor: COLORS.paleMatcha,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 6,
    marginLeft: 7,
  },

  roleMiniText: {
    color: COLORS.burgundy,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // SECURITY NOTE
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F1E8',
    borderWidth: 1,
    borderColor: '#DDE2CF',
    borderRadius: 19,
    padding: 16,
    marginBottom: 25,
  },

  securityIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    fontSize: 13,
    color: COLORS.darkBurgundy,
    fontWeight: '900',
    marginBottom: 5,
  },

  securityText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
  },

  // LOGOUT
  logoutHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 1.5,
    marginBottom: 11,
  },

  logoutButton: {
    minHeight: 61,
    backgroundColor: COLORS.burgundy,
    borderRadius: 17,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: COLORS.darkBurgundy,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  logoutIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  logoutText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  logoutArrow: {
    marginLeft: 'auto',
  },

  disabledButton: {
    opacity: 0.6,
  },

  logoutPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  // FOOTER
  footer: {
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 12,
  },

  footerLine: {
    width: 43,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.matcha,
    marginVertical: 9,
  },

  footerBrand: {
    color: COLORS.burgundy,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
  },
});
