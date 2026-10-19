
import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/profiles';
import { getAllEvents, type Event } from '../../lib/events';

const COLORS = {
  burgundy: '#701F35',
  burgundyDark: '#4C1729',
  burgundyLight: '#F1E2E6',
  matcha: '#A8B88A',
  matchaDark: '#526B3F',
  matchaLight: '#E7EDD9',
  background: '#F8F7F2',
  white: '#FFFFFF',
  text: '#351923',
  muted: '#858A78',
  border: '#E5E7DB',
  softPink: '#FAF0F2',
};

export default function Index() {
  const [studentName, setStudentName] = useState('Student');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  // LOAD PROFILE AND UPCOMING EVENTS
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      // Load upcoming events
      try {
        const { data: eventData, error: eventError } =
          await getAllEvents();

        if (eventError) {
          console.log('UPCOMING EVENTS ERROR:', eventError.message);
          setUpcomingEvents([]);
        } else {
          const now = new Date();

          const upcoming = (eventData ?? [])
            .filter(
              (event) =>
                Boolean(event.start_time) &&
                new Date(event.start_time).getTime() >= now.getTime()
            )
            .sort(
              (a, b) =>
                new Date(a.start_time).getTime() -
                new Date(b.start_time).getTime()
            )
            .slice(0, 3);

          setUpcomingEvents(upcoming);
        }
      } catch (eventError: any) {
        console.log('UPCOMING EVENTS ERROR:', eventError?.message);
        setUpcomingEvents([]);
      }

      // Get current logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log('USER ERROR:', userError.message);
        setStudentName('Student');
        return;
      }

      if (!user) {
        setStudentName('Student');
        return;
      }

      // Get user profile
      const { data, error } = await getProfile(user.id);

      if (error) {
        console.log('PROFILE ERROR:', error.message);
        setStudentName('Student');
        return;
      }

      setStudentName(
        data?.full_name?.trim() ||
          user.email?.split('@')[0] ||
          'Student'
      );
    } catch (error: any) {
      console.log('DASHBOARD ERROR:', error?.message);
      setStudentName('Student');
    } finally {
      setLoading(false);
    }
  }, []);

  // PULL TO REFRESH
  const refresh = async () => {
    setRefreshing(true);

    try {
      await loadProfile();
    } finally {
      setRefreshing(false);
    }
  };

  // RELOAD WHEN SCREEN GETS FOCUS
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // LOADING SCREEN
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>QR</Text>
          <View style={styles.loadingLogoDot} />
        </View>

        <ActivityIndicator
          size="large"
          color={COLORS.burgundy}
          style={styles.loadingIndicator}
        />

        <Text style={styles.loadingTitle}>QR Attendance</Text>

        <Text style={styles.loadingText}>
          Getting everything ready for you...
        </Text>
      </View>
    );
  }

  // MAIN DASHBOARD
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          colors={[COLORS.burgundy]}
          tintColor={COLORS.burgundy}
        />
      }
    >
      {/* LARGE WELCOME BANNER */}
      <View style={styles.hero}>
        <View style={styles.heroCircleLarge} />
        <View style={styles.heroCircleSmall} />
        <View style={styles.heroOutlineCircle} />

        <View style={styles.heroContent}>
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <View style={styles.brand}>
              <View style={styles.brandLogo}>
                <Text style={styles.brandLogoText}>QR</Text>
              </View>

              <View>
                <Text style={styles.brandName}>QR ATTENDANCE</Text>
                <Text style={styles.brandCaption}>STUDENT PORTAL</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
              accessibilityLabel="Open my profile"
            >
              <Text style={styles.profileEmoji}>👤</Text>
              <View style={styles.profileOnlineDot} />
            </TouchableOpacity>
          </View>

          {/* WELCOME MESSAGE */}
          <View style={styles.welcomeSection}>
            <View style={styles.greetingBadge}>
              <View style={styles.greetingDot} />
              <Text style={styles.greetingBadgeText}>
                YOUR SCHOOL COMPANION
              </Text>
            </View>

            <Text style={styles.welcomeTitle}>Hey there,</Text>

            <Text
              style={styles.studentName}
              numberOfLines={2}
            >
              {studentName}!
            </Text>

            <Text style={styles.welcomeDescription}>
              Your next school event is just a scan away.
              Let's make every attendance count.
            </Text>
          </View>

          {/* DECORATIVE QR CARD */}
          <View style={styles.qrDecoration}>
            <View style={styles.qrDecorationTop}>
              <View style={styles.qrMiniDot} />
              <Text style={styles.qrDecorationLabel}>READY TO SCAN</Text>
            </View>

            <View style={styles.qrGraphic}>
              <View style={styles.qrFinder}>
                <View style={styles.qrFinderInner} />
              </View>

              <View style={styles.qrGraphicMiddle}>
                <View style={styles.qrPixel} />
                <View style={styles.qrPixelSmall} />
                <View style={styles.qrPixel} />
              </View>

              <View style={styles.qrFinder}>
                <View style={styles.qrFinderInner} />
              </View>

              <View style={styles.qrGraphicBottom}>
                <View style={styles.qrFinder}>
                  <View style={styles.qrFinderInner} />
                </View>

                <View style={styles.qrPixel} />
                <View style={styles.qrPixelSmall} />
                <View style={styles.qrPixel} />
              </View>
            </View>

            <Text style={styles.qrDecorationFooter}>SCAN • CHECK IN</Text>
          </View>

          {/* BANNER BOTTOM */}
          <View style={styles.heroBottom}>
            <View style={styles.heroBottomIcon}>
              <Text style={styles.heroBottomIconText}>✓</Text>
            </View>

            <View style={styles.heroBottomText}>
              <Text style={styles.heroBottomTitle}>
                Your attendance journey
              </Text>
              <Text style={styles.heroBottomSubtitle}>
                Simple, fast, and secure.
              </Text>
            </View>

            <Text style={styles.heroBottomArrow}>↗</Text>
          </View>
        </View>
      </View>

      {/* DASHBOARD CONTENT */}
      <View style={styles.content}>
        {/* SECTION INTRODUCTION */}
        <View style={styles.sectionIntro}>
          <View>
            <Text style={styles.eyebrow}>YOUR DASHBOARD</Text>
            <Text style={styles.sectionTitle}>Let's get started</Text>
          </View>

          <View style={styles.sectionIcon}>
            <Text style={styles.sectionIconText}>✳</Text>
          </View>
        </View>

        {/* ATTENDANCE STATUS */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconBox}>
            <Text style={styles.statusIconText}>✓</Text>
          </View>

          <View style={styles.statusDetails}>
            <Text style={styles.statusLabel}>ATTENDANCE STATUS</Text>
            <Text style={styles.statusTitle}>Ready for check-in</Text>
            <Text style={styles.statusSubtitle}>
              You're all set for your next event.
            </Text>
          </View>

          <View style={styles.readyBadge}>
            <View style={styles.readyDot} />
            <Text style={styles.readyText}>READY</Text>
          </View>
        </View>

        {/* PRIMARY QR SCANNER ACTION */}
        <TouchableOpacity
          style={styles.scanCard}
          onPress={() => router.push('/scan')}
          activeOpacity={0.88}
          accessibilityLabel="Start scanning an event QR code"
        >
          <View style={styles.scanCircleOne} />
          <View style={styles.scanCircleTwo} />

          <View style={styles.scanContent}>
            <View style={styles.scanHeader}>
              <View style={styles.scanIconBox}>
                <Text style={styles.scanIcon}>▦</Text>
              </View>

              <View style={styles.scanPill}>
                <Text style={styles.scanPillText}>QUICK CHECK-IN</Text>
              </View>
            </View>

            <Text style={styles.scanTitle}>Scan Event QR</Text>

            <Text style={styles.scanDescription}>
              Open your camera and scan your teacher's QR code
              to record your attendance.
            </Text>

            <View style={styles.scanActionRow}>
              <View style={styles.scanButton}>
                <Text style={styles.scanButtonText}>
                  Start Scanning
                </Text>
                <Text style={styles.scanButtonArrow}>→</Text>
              </View>

              <Text style={styles.scanHint}>Takes only a moment</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* UPCOMING EVENTS */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingLeft}>
            <View style={styles.sectionMarker} />

            <View>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <Text style={styles.sectionSubtitle}>
                What's happening at school
              </Text>
            </View>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {upcomingEvents.length}
            </Text>
          </View>
        </View>

        {upcomingEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyIcon}>▦</Text>
            </View>

            <Text style={styles.emptyTitle}>Nothing scheduled yet</Text>

            <Text style={styles.emptyDescription}>
              When new school activities are announced,
              you'll find them here.
            </Text>

            <View style={styles.emptyBottomLine} />
          </View>
        ) : (
          upcomingEvents.map((event, index) => {
            const eventDate = new Date(event.start_time);

            const day = eventDate.toLocaleDateString('en-US', {
              day: '2-digit',
            });

            const month = eventDate.toLocaleDateString('en-US', {
              month: 'short',
            });

            const weekday = eventDate.toLocaleDateString('en-US', {
              weekday: 'short',
            });

            const time = eventDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <View
                key={event.id}
                style={styles.eventCard}
              >
                <View
                  style={[
                    styles.eventDateBox,
                    index % 2 === 1 && styles.eventDateBoxMatcha,
                  ]}
                >
                  <Text
                    style={[
                      styles.eventMonth,
                      index % 2 === 1 && styles.eventMonthMatcha,
                    ]}
                  >
                    {month.toUpperCase()}
                  </Text>

                  <Text
                    style={[
                      styles.eventDay,
                      index % 2 === 1 && styles.eventDayMatcha,
                    ]}
                  >
                    {day}
                  </Text>

                  <Text
                    style={[
                      styles.eventWeekday,
                      index % 2 === 1 && styles.eventWeekdayMatcha,
                    ]}
                  >
                    {weekday}
                  </Text>
                </View>

                <View style={styles.eventDetails}>
                  <Text
                    style={styles.eventTitle}
                    numberOfLines={2}
                  >
                    {event.title}
                  </Text>

                  <View style={styles.eventInfoRow}>
                    <Text style={styles.eventInfoIcon}>◷</Text>
                    <Text style={styles.eventTime}>{time}</Text>
                  </View>

                  {event.venue ? (
                    <View style={styles.eventInfoRow}>
                      <Text style={styles.eventInfoIcon}>⌖</Text>
                      <Text
                        style={styles.eventVenue}
                        numberOfLines={1}
                      >
                        {event.venue}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.eventAccent}>
                  <Text style={styles.eventAccentText}>↗</Text>
                </View>
              </View>
            );
          })
        )}

        {/* QUICK ACCESS */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingLeft}>
            <View style={[styles.sectionMarker, styles.matchaMarker]} />

            <View>
              <Text style={styles.sectionTitle}>Quick Access</Text>
              <Text style={styles.sectionSubtitle}>
                Everything you need, in one place
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionGrid}>
          {/* HISTORY */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/history')}
            activeOpacity={0.85}
            accessibilityLabel="View attendance history"
          >
            <View style={styles.actionTopRow}>
              <View style={styles.historyIconBox}>
                <Text style={styles.actionIconText}>◷</Text>
              </View>

              <Text style={styles.actionArrow}>↗</Text>
            </View>

            <Text style={styles.actionTitle}>My History</Text>

            <Text style={styles.actionDescription}>
              Review your attendance records and past events.
            </Text>

            <View style={styles.actionBottomLine} />
          </TouchableOpacity>

          {/* PROFILE */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/profile')}
            activeOpacity={0.85}
            accessibilityLabel="Open my profile"
          >
            <View style={styles.actionTopRow}>
              <View style={styles.profileIconBox}>
                <Text style={styles.actionIconText}>◎</Text>
              </View>

              <Text style={styles.actionArrow}>↗</Text>
            </View>

            <Text style={styles.actionTitle}>My Profile</Text>

            <Text style={styles.actionDescription}>
              View and manage your account information.
            </Text>

            <View
              style={[
                styles.actionBottomLine,
                styles.actionBottomLineMatcha,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* HOW IT WORKS */}
        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <View style={styles.guideIconBox}>
              <Text style={styles.guideIconText}>✳</Text>
            </View>

            <View style={styles.guideHeading}>
              <Text style={styles.guideTitle}>How it works</Text>
              <Text style={styles.guideSubtitle}>
                Three simple steps to check in
              </Text>
            </View>
          </View>

          {/* STEP 1 */}
          <View style={styles.stepRow}>
            <View style={styles.stepNumberBox}>
              <Text style={styles.stepNumber}>01</Text>
            </View>

            <View style={styles.stepDetails}>
              <Text style={styles.stepTitle}>Attend your event</Text>
              <Text style={styles.stepDescription}>
                Head to your scheduled school activity.
              </Text>
            </View>

            <Text style={styles.stepSymbol}>↗</Text>
          </View>

          <View style={styles.stepDivider} />

          {/* STEP 2 */}
          <View style={styles.stepRow}>
            <View style={styles.stepNumberBox}>
              <Text style={styles.stepNumber}>02</Text>
            </View>

            <View style={styles.stepDetails}>
              <Text style={styles.stepTitle}>Scan the QR code</Text>
              <Text style={styles.stepDescription}>
                Open the scanner and scan your teacher's code.
              </Text>
            </View>

            <Text style={styles.stepSymbol}>▦</Text>
          </View>

          <View style={styles.stepDivider} />

          {/* STEP 3 */}
          <View style={styles.stepRow}>
            <View style={[styles.stepNumberBox, styles.stepNumberFinal]}>
              <Text style={[styles.stepNumber, styles.stepNumberFinalText]}>
                03
              </Text>
            </View>

            <View style={styles.stepDetails}>
              <Text style={styles.stepTitle}>You're checked in!</Text>
              <Text style={styles.stepDescription}>
                Your attendance is recorded by the system.
              </Text>
            </View>

            <Text style={styles.stepSuccess}>✓</Text>
          </View>
        </View>

        {/* SECURITY CARD */}
        <View style={styles.securityCard}>
          <View style={styles.securityIconBox}>
            <Text style={styles.securityIcon}>✓</Text>
          </View>

          <View style={styles.securityDetails}>
            <Text style={styles.securityTitle}>
              Your attendance matters
            </Text>

            <Text style={styles.securityDescription}>
              Your check-in is recorded through the
              attendance system.
            </Text>
          </View>

          <View style={styles.securityShield}>
            <Text style={styles.securityShieldText}>✓</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <View style={styles.footerLogo}>
              <Text style={styles.footerLogoText}>QR</Text>
            </View>

            <View>
              <Text style={styles.footerTitle}>QR Attendance</Text>
              <Text style={styles.footerSubtitle}>
                School Event Attendance System
              </Text>
            </View>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerBottom}>
            <Text style={styles.footerCopyright}>
              SIMPLE. FAST. SECURE.
            </Text>

            <View style={styles.footerDots}>
              <View style={styles.footerDotBurgundy} />
              <View style={styles.footerDotMatcha} />
              <View style={styles.footerDotCream} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// CREATIVE BURGUNDY AND MATCHA DASHBOARD STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // LOADING SCREEN
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  loadingLogo: {
    width: 78,
    height: 78,
    borderRadius: 25,
    backgroundColor: COLORS.burgundy,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingLogoText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
  },
  loadingLogoDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.matcha,
    right: 9,
    top: 9,
  },
  loadingIndicator: {
    marginBottom: 14,
  },
  loadingTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 7,
    textAlign: 'center',
  },

  // HERO BANNER
  hero: {
    backgroundColor: COLORS.burgundy,
    minHeight: 485,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    overflow: 'hidden',
  },
  heroContent: {
    paddingTop: 52,
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  heroCircleLarge: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.045)',
    right: -115,
    top: 65,
  },
  heroCircleSmall: {
    position: 'absolute',
    width: 185,
    height: 185,
    borderRadius: 93,
    backgroundColor: 'rgba(168,184,138,0.12)',
    right: -65,
    top: 145,
  },
  heroOutlineCircle: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: 'rgba(231,237,217,0.20)',
    right: 22,
    top: 190,
  },

  // BRAND AND PROFILE BUTTON
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: COLORS.matchaLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  brandLogoText: {
    color: COLORS.burgundy,
    fontSize: 15,
    fontWeight: '900',
  },
  brandName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  brandCaption: {
    color: '#DCC5CB',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 21,
  },
  profileOnlineDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.matcha,
    borderWidth: 1.5,
    borderColor: COLORS.burgundy,
    right: 2,
    top: 2,
  },

  // WELCOME MESSAGE
  welcomeSection: {
    marginTop: 34,
    maxWidth: 310,
    zIndex: 1,
  },
  greetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(231,237,217,0.13)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginBottom: 15,
  },
  greetingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.matcha,
    marginRight: 7,
  },
  greetingBadgeText: {
    color: COLORS.matchaLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  welcomeTitle: {
    color: '#E9D9DE',
    fontSize: 20,
    fontWeight: '500',
  },
  studentName: {
    color: COLORS.white,
    fontSize: 33,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 1,
    maxWidth: 310,
  },
  welcomeDescription: {
    color: '#F0E7E9',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    maxWidth: 260,
  },

  // DECORATIVE QR GRAPHIC
  qrDecoration: {
    position: 'absolute',
    right: 20,
    top: 185,
    width: 115,
    minHeight: 145,
    borderRadius: 22,
    backgroundColor: COLORS.matchaLight,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '5deg' }],
    zIndex: 2,
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  qrDecorationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  qrMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.matchaDark,
    marginRight: 4,
  },
  qrDecorationLabel: {
    color: COLORS.matchaDark,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  qrGraphic: {
    width: 75,
    height: 75,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    justifyContent: 'space-between',
  },
  qrFinder: {
    width: 23,
    height: 23,
    borderWidth: 5,
    borderColor: COLORS.burgundy,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrFinderInner: {
    width: 5,
    height: 5,
    backgroundColor: COLORS.burgundy,
  },
  qrGraphicMiddle: {
    width: 14,
    height: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrPixel: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.burgundy,
  },
  qrPixelSmall: {
    width: 4,
    height: 4,
    backgroundColor: COLORS.burgundy,
  },
  qrGraphicBottom: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 1,
  },
  qrDecorationFooter: {
    color: COLORS.burgundy,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 8,
  },

  // BANNER BOTTOM
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  heroBottomIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: COLORS.matcha,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  heroBottomIconText: {
    color: COLORS.burgundyDark,
    fontSize: 19,
    fontWeight: '900',
  },
  heroBottomText: {
    flex: 1,
  },
  heroBottomTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  heroBottomSubtitle: {
    color: '#DDC8CE',
    fontSize: 10,
    marginTop: 4,
  },
  heroBottomArrow: {
    color: COLORS.matcha,
    fontSize: 25,
    fontWeight: '700',
    marginLeft: 8,
  },

  // MAIN CONTENT
  content: {
    paddingHorizontal: 19,
    paddingTop: 25,
  },
  sectionIntro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },
  eyebrow: {
    color: COLORS.matchaDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.matchaLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconText: {
    color: COLORS.matchaDark,
    fontSize: 24,
    fontWeight: '900',
  },

  // ATTENDANCE STATUS
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.burgundyDark,
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },
  statusIconBox: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.matchaLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  statusIconText: {
    color: COLORS.matchaDark,
    fontSize: 23,
    fontWeight: '900',
  },
  statusDetails: {
    flex: 1,
    minWidth: 0,
  },
  statusLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statusTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  statusSubtitle: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.matchaLight,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginLeft: 6,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.matchaDark,
    marginRight: 5,
  },
  readyText: {
    color: COLORS.matchaDark,
    fontSize: 8,
    fontWeight: '900',
  },

  // SCAN CARD
  scanCard: {
    backgroundColor: COLORS.burgundy,
    borderRadius: 25,
    padding: 20,
    marginBottom: 31,
    overflow: 'hidden',
    minHeight: 240,
  },
  scanCircleOne: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168,184,138,0.13)',
    right: -75,
    top: -80,
  },
  scanCircleTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(231,237,217,0.22)',
    right: 15,
    bottom: -55,
  },
  scanContent: {
    zIndex: 1,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scanIconBox: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: 'rgba(231,237,217,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(231,237,217,0.23)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIcon: {
    color: COLORS.matchaLight,
    fontSize: 31,
    fontWeight: '900',
  },
  scanPill: {
    backgroundColor: COLORS.matchaLight,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  scanPillText: {
    color: COLORS.burgundy,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  scanTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scanDescription: {
    color: '#F0E7E9',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 300,
  },
  scanActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 19,
    gap: 12,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.matchaLight,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scanButtonText: {
    color: COLORS.burgundyDark,
    fontSize: 11,
    fontWeight: '900',
  },
  scanButtonArrow: {
    color: COLORS.burgundyDark,
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 12,
  },
  scanHint: {
    color: '#E7D6DC',
    fontSize: 9,
    fontWeight: '600',
  },

  // SECTION HEADERS
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionMarker: {
    width: 5,
    height: 39,
    borderRadius: 4,
    backgroundColor: COLORS.burgundy,
    marginRight: 12,
  },
  matchaMarker: {
    backgroundColor: COLORS.matcha,
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: COLORS.matchaLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    color: COLORS.matchaDark,
    fontSize: 12,
    fontWeight: '900',
  },

  // EMPTY EVENT STATE
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 21,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 31,
  },
  emptyIconBox: {
    width: 59,
    height: 59,
    borderRadius: 20,
    backgroundColor: COLORS.matchaLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIcon: {
    color: COLORS.matchaDark,
    fontSize: 32,
    fontWeight: '800',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 245,
  },
  emptyBottomLine: {
    width: 35,
    height: 4,
    borderRadius: 4,
    backgroundColor: COLORS.matcha,
    marginTop: 18,
  },

  // EVENT CARDS
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 11,
  },
  eventDateBox: {
    width: 59,
    minHeight: 76,
    borderRadius: 15,
    backgroundColor: COLORS.burgundyLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    paddingVertical: 7,
  },
  eventDateBoxMatcha: {
    backgroundColor: COLORS.matchaLight,
  },
  eventMonth: {
    color: COLORS.burgundy,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  eventMonthMatcha: {
    color: COLORS.matchaDark,
  },
  eventDay: {
    color: COLORS.burgundy,
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 1,
  },
  eventDayMatcha: {
    color: COLORS.matchaDark,
  },
  eventWeekday: {
    color: COLORS.burgundy,
    fontSize: 9,
    fontWeight: '700',
  },
  eventWeekdayMatcha: {
    color: COLORS.matchaDark,
  },
  eventDetails: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 3,
  },
  eventTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  eventInfoIcon: {
    color: COLORS.burgundy,
    fontSize: 13,
    fontWeight: '900',
    width: 17,
  },
  eventTime: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },
  eventVenue: {
    color: COLORS.muted,
    fontSize: 10,
    flex: 1,
  },
  eventAccent: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  eventAccentText: {
    color: COLORS.burgundy,
    fontSize: 17,
    fontWeight: '900',
  },

  // QUICK ACCESS CARDS
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  actionCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 192,
    backgroundColor: COLORS.white,
    borderRadius: 21,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  actionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 21,
  },
  historyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.burgundyLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.matchaLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconText: {
    color: COLORS.burgundy,
    fontSize: 26,
    fontWeight: '900',
  },
  actionArrow: {
    color: COLORS.burgundy,
    fontSize: 21,
    fontWeight: '900',
  },
  actionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },
  actionDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 7,
  },
  actionBottomLine: {
    width: 35,
    height: 4,
    borderRadius: 4,
    backgroundColor: COLORS.burgundy,
    marginTop: 'auto',
  },
  actionBottomLineMatcha: {
    backgroundColor: COLORS.matcha,
  },

  // HOW IT WORKS
  guideCard: {
    backgroundColor: COLORS.white,
    borderRadius: 23,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 19,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 23,
  },
  guideIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.matchaLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guideIconText: {
    color: COLORS.matchaDark,
    fontSize: 24,
    fontWeight: '900',
  },
  guideHeading: {
    flex: 1,
  },
  guideTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },
  guideSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 62,
  },
  stepNumberBox: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.burgundyLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  stepNumber: {
    color: COLORS.burgundy,
    fontSize: 13,
    fontWeight: '900',
  },
  stepNumberFinal: {
    backgroundColor: COLORS.matchaLight,
  },
  stepNumberFinalText: {
    color: COLORS.matchaDark,
  },
  stepDetails: {
    flex: 1,
    minWidth: 0,
  },
  stepTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '900',
  },
  stepDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },
  stepSymbol: {
    color: COLORS.burgundy,
    fontSize: 19,
    fontWeight: '800',
    marginLeft: 8,
  },
  stepSuccess: {
    color: COLORS.matchaDark,
    fontSize: 22,
    fontWeight: '900',
    marginLeft: 8,
  },
  stepDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
    marginLeft: 56,
  },

  // SECURITY CARD
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.matchaLight,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#D6E0C8',
    marginBottom: 28,
  },
  securityIconBox: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#D5E2C2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  securityIcon: {
    color: COLORS.matchaDark,
    fontSize: 23,
    fontWeight: '900',
  },
  securityDetails: {
    flex: 1,
  },
  securityTitle: {
    color: '#3D5330',
    fontSize: 12,
    fontWeight: '900',
  },
  securityDescription: {
    color: COLORS.matchaDark,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },
  securityShield: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#D5E2C2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },
  securityShieldText: {
    color: COLORS.matchaDark,
    fontSize: 17,
    fontWeight: '900',
  },

  // FOOTER
  footer: {
    paddingTop: 4,
    paddingBottom: 18,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLogo: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.burgundy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  footerLogoText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
  footerTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
  },
  footerSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },
  footerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 18,
    marginBottom: 13,
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCopyright: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footerDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerDotBurgundy: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.burgundy,
  },
  footerDotMatcha: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.matcha,
  },
  footerDotCream: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DCC9C0',
  },
});
