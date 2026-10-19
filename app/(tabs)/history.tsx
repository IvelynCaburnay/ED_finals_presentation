
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getMyAttendance,
  type Attendance,
} from '@/lib/attendance';

type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';
type FilterStatus = 'all' | AttendanceStatus;

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

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Present', value: 'present' },
  { label: 'Late', value: 'late' },
  { label: 'Excused', value: 'excused' },
  { label: 'Absent', value: 'absent' },
];

const STATUS_COLORS: Record<
  AttendanceStatus,
  { background: string; text: string; dot: string }
> = {
  present: {
    background: '#E7EDD9',
    text: '#48613B',
    dot: '#78965F',
  },
  late: {
    background: '#F8EBD1',
    text: '#94651F',
    dot: '#C9953C',
  },
  excused: {
    background: '#F0E5E9',
    text: '#701F35',
    dot: '#A75C76',
  },
  absent: {
    background: '#F7E1E1',
    text: '#A13D42',
    dot: '#C85B60',
  },
};

function getStatus(status: string): AttendanceStatus | 'unknown' {
  const normalized = status.toLowerCase();

  if (
    normalized === 'present' ||
    normalized === 'late' ||
    normalized === 'excused' ||
    normalized === 'absent'
  ) {
    return normalized;
  }

  return 'unknown';
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Time unavailable';
  }

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] =
    useState<FilterStatus>('all');
  const [errorMessage, setErrorMessage] = useState('');

  const loadHistory = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    setErrorMessage('');

    try {
      const { data, error } = await getMyAttendance();

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setRecords(data ?? []);
    } catch (error) {
      console.log('Failed to load attendance history:', error);

      setErrorMessage(
        'Unable to load your attendance records. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = async () => {
    setRefreshing(true);

    try {
      await loadHistory(false);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const countStatus = (status: AttendanceStatus) =>
    records.filter(
      (record) => getStatus(record.status) === status
    ).length;

  const normalizedSearch = search.trim().toLowerCase();

  const filteredRecords = records.filter((record) => {
    const status = getStatus(record.status);

    const matchesStatus =
      activeFilter === 'all' || status === activeFilter;

    const eventTitle = record.event?.title ?? 'School Event';
    const eventCode = record.event?.event_code ?? '';
    const venue = record.event?.venue ?? '';

    const matchesSearch =
      eventTitle.toLowerCase().includes(normalizedSearch) ||
      eventCode.toLowerCase().includes(normalizedSearch) ||
      venue.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.burgundy}
        />

        <View style={styles.loadingIcon}>
          <Text style={styles.loadingEmoji}>📋</Text>
        </View>

        <ActivityIndicator
          size="large"
          color={COLORS.burgundy}
          style={styles.loadingSpinner}
        />

        <Text style={styles.loadingTitle}>Loading History</Text>

        <Text style={styles.loadingSubtitle}>
          Fetching your attendance records...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.burgundy}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={COLORS.burgundy}
            colors={[COLORS.burgundy, COLORS.matcha]}
          />
        }
      >
        {/* BURGUNDY HEADER */}
        <View style={styles.header}>
          <View style={styles.headerDecoration} />
          <View style={styles.headerDecorationSmall} />

          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>◷</Text>
            </View>

            <View style={styles.headerBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerBadgeText}>MY RECORDS</Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>YOUR SCHOOL JOURNEY</Text>

          <Text style={styles.title}>Attendance</Text>
          <Text style={styles.titleAccent}>History.</Text>

          <Text style={styles.subtitle}>
            Every event counts. Keep track of your attendance
            and stay updated with your school activities.
          </Text>

          {/* TOTAL RECORDS */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Text style={styles.summaryEmoji}>📋</Text>
            </View>

            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>TOTAL RECORDS</Text>
              <Text style={styles.summaryValue}>
                {records.length}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRight}>
              <Text style={styles.summaryLabel}>RECORD STATUS</Text>
              <Text style={styles.summaryStatus}>
                {records.length > 0 ? 'Up to date' : 'No records yet'}
              </Text>
              <View style={styles.summaryStatusLine} />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* ERROR MESSAGE */}
          {errorMessage !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>!</Text>

              <View style={styles.errorContent}>
                <Text style={styles.errorHeading}>
                  Something went wrong
                </Text>

                <Text style={styles.errorText}>
                  {errorMessage}
                </Text>

                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => loadHistory()}
                  accessibilityRole="button"
                >
                  <Text style={styles.retryText}>Try Again ↗</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ATTENDANCE STATISTICS */}
          <View style={styles.introSection}>
            <View style={styles.sectionMarker} />

            <View style={styles.introText}>
              <Text style={styles.sectionTitle}>
                Attendance Summary
              </Text>

              <Text style={styles.sectionSubtitle}>
                An overview of your recorded attendance
              </Text>
            </View>
          </View>

          <View style={styles.statisticsGrid}>
            <View style={[styles.statCard, styles.presentCard]}>
              <View style={styles.statTopRow}>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>✓</Text>
                </View>
                <Text style={styles.statMiniLabel}>01</Text>
              </View>

              <Text style={[styles.statNumber, { color: '#48613B' }]}>
                {countStatus('present')}
              </Text>

              <Text style={styles.statLabel}>Present</Text>
              <View style={[styles.statBottomLine, { backgroundColor: '#A8B88A' }]} />
            </View>

            <View style={[styles.statCard, styles.lateCard]}>
              <View style={styles.statTopRow}>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>◷</Text>
                </View>
                <Text style={styles.statMiniLabel}>02</Text>
              </View>

              <Text style={[styles.statNumber, { color: '#94651F' }]}>
                {countStatus('late')}
              </Text>

              <Text style={styles.statLabel}>Late</Text>
              <View style={[styles.statBottomLine, { backgroundColor: '#D8B46C' }]} />
            </View>

            <View style={[styles.statCard, styles.excusedCard]}>
              <View style={styles.statTopRow}>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>✎</Text>
                </View>
                <Text style={styles.statMiniLabel}>03</Text>
              </View>

              <Text style={[styles.statNumber, { color: '#701F35' }]}>
                {countStatus('excused')}
              </Text>

              <Text style={styles.statLabel}>Excused</Text>
              <View style={[styles.statBottomLine, { backgroundColor: '#B77B91' }]} />
            </View>

            <View style={[styles.statCard, styles.absentCard]}>
              <View style={styles.statTopRow}>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>×</Text>
                </View>
                <Text style={styles.statMiniLabel}>04</Text>
              </View>

              <Text style={[styles.statNumber, { color: '#A13D42' }]}>
                {countStatus('absent')}
              </Text>

              <Text style={styles.statLabel}>Absent</Text>
              <View style={[styles.statBottomLine, { backgroundColor: '#D99191' }]} />
            </View>
          </View>

          {/* RECENT ACTIVITY */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeadingInfo}>
              <Text style={styles.sectionKicker}>YOUR TIMELINE</Text>

              <Text style={styles.sectionTitle}>
                Recent Activity
              </Text>

              <Text style={styles.sectionSubtitle}>
                Your event attendance history
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {filteredRecords.length}
              </Text>
            </View>
          </View>

          {/* SEARCH */}
          <View style={styles.searchContainer}>
            <View style={styles.searchIconCircle}>
              <Text style={styles.searchIcon}>⌕</Text>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search event, code, or venue..."
              placeholderTextColor="#9A978C"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              accessibilityLabel="Search attendance history"
            />
          </View>

          {/* STATUS FILTERS */}
          <Text style={styles.filterHeading}>FILTER BY STATUS</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {FILTERS.map((filter) => {
              const selected = activeFilter === filter.value;

              return (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterButton,
                    selected && styles.filterButtonActive,
                  ]}
                  onPress={() => setActiveFilter(filter.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  {selected && <View style={styles.filterDot} />}

                  <Text
                    style={[
                      styles.filterText,
                      selected && styles.filterTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ATTENDANCE RECORDS */}
          {errorMessage !== '' ? null : filteredRecords.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIcon}>
                  {records.length === 0 ? '📋' : '⌕'}
                </Text>
              </View>

              <Text style={styles.emptyEyebrow}>
                {records.length === 0 ? 'YOUR JOURNEY STARTS HERE' : 'NO RESULTS FOUND'}
              </Text>

              <Text style={styles.emptyTitle}>
                {records.length === 0
                  ? 'No Attendance Yet'
                  : 'No Matching Records'}
              </Text>

              <Text style={styles.emptyText}>
                {records.length === 0
                  ? 'Your attendance records will appear here after you scan an event QR code.'
                  : 'Try another search term or select a different attendance status.'}
              </Text>

              {records.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setSearch('');
                    setActiveFilter('all');
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.clearButtonText}>
                    Clear Filters  ↗
                  </Text>
                </TouchableOpacity>
              )}

              {records.length === 0 && (
                <View style={styles.emptyHint}>
                  <Text style={styles.emptyHintText}>
                    Your event history will be saved here.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            filteredRecords.map((record) => {
              const status = getStatus(record.status);
              const colors =
                status !== 'unknown'
                  ? STATUS_COLORS[status]
                  : null;

              return (
                <View key={record.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.eventIconCircle}>
                      <Text style={styles.eventIcon}>▦</Text>
                    </View>

                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>
                        {record.event?.title ?? 'School Event'}
                      </Text>

                      <Text style={styles.eventCode}>
                        {record.event?.event_code || 'NO EVENT CODE'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            colors?.background ?? '#EDEBE4',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              colors?.dot ?? '#8A8F7B',
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: colors?.text ?? '#4C2531',
                          },
                        ]}
                      >
                        {record.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Text>⌖</Text>
                    </View>

                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>VENUE</Text>

                      <Text style={styles.detailValue}>
                        {record.event?.venue ?? 'No venue specified'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Text>▦</Text>
                    </View>

                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>DATE</Text>

                      <Text style={styles.detailValue}>
                        {formatDate(record.scanned_at)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, styles.lastDetailRow]}>
                    <View style={styles.detailIcon}>
                      <Text>◷</Text>
                    </View>

                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>
                        TIME RECORDED
                      </Text>

                      <Text style={styles.detailValue}>
                        {formatTime(record.scanned_at)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerMark}>QR-ATT</Text>
            <Text style={styles.footerText}>
              Attendance History • Every event counts
            </Text>
            <View style={styles.footerLine} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingIcon: {
    width: 78,
    height: 78,
    borderRadius: 25,
    backgroundColor: COLORS.paleMatcha,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  loadingEmoji: {
    fontSize: 30,
  },

  loadingSpinner: {
    marginBottom: 18,
  },

  loadingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.darkBurgundy,
  },

  loadingSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 8,
  },

  header: {
    backgroundColor: COLORS.burgundy,
    paddingTop: 22,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },

  headerDecoration: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF',
    opacity: 0.045,
    right: -85,
    top: 40,
  },

  headerDecorationSmall: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 65,
    borderWidth: 24,
    borderColor: COLORS.matcha,
    opacity: 0.12,
    right: 25,
    top: -65,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.paleMatcha,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerIconText: {
    fontSize: 32,
    color: COLORS.burgundy,
    fontWeight: '600',
  },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.paleMatcha,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.matcha,
    marginRight: 7,
  },

  headerBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.burgundy,
    letterSpacing: 1,
  },

  eyebrow: {
    fontSize: 10,
    color: COLORS.matcha,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 9,
  },

  title: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.8,
  },

  titleAccent: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.matcha,
    letterSpacing: -0.8,
    marginTop: -3,
  },

  subtitle: {
    color: '#F0E4E6',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 11,
    maxWidth: 310,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.paleMatcha,
    borderRadius: 21,
    padding: 16,
    marginTop: 25,
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.paleMatcha,
    justifyContent: 'center',
    alignItems: 'center',
  },

  summaryEmoji: {
    fontSize: 23,
  },

  summaryInfo: {
    flex: 1,
    marginLeft: 12,
  },

  summaryLabel: {
    fontSize: 9,
    color: COLORS.muted,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  summaryValue: {
    fontSize: 27,
    fontWeight: '900',
    color: COLORS.burgundy,
    marginTop: 3,
  },

  summaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },

  summaryRight: {
    alignItems: 'flex-start',
    minWidth: 85,
  },

  summaryStatus: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.burgundy,
    marginTop: 7,
  },

  summaryStatusLine: {
    width: 35,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.matcha,
    marginTop: 6,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 27,
    paddingBottom: 35,
  },

  introSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 17,
  },

  sectionMarker: {
    width: 5,
    height: 42,
    borderRadius: 4,
    backgroundColor: COLORS.matcha,
    marginRight: 12,
    marginTop: 2,
  },

  introText: {
    flex: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 17,
  },

  sectionHeadingInfo: {
    flex: 1,
  },

  sectionKicker: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 1.8,
    marginBottom: 5,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.darkBurgundy,
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 5,
    marginBottom: 0,
    lineHeight: 18,
  },

  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },

  statCard: {
    width: '47%',
    flexGrow: 1,
    flexBasis: '40%',
    backgroundColor: COLORS.white,
    borderRadius: 19,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  presentCard: {
    backgroundColor: '#F5F7EF',
  },

  lateCard: {
    backgroundColor: '#FBF6EB',
  },

  excusedCard: {
    backgroundColor: '#F7F0F2',
  },

  absentCard: {
    backgroundColor: '#FAF0EE',
  },

  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  statIcon: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statEmoji: {
    fontSize: 23,
    color: COLORS.burgundy,
    fontWeight: '700',
  },

  statMiniLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B6B3A7',
  },

  statNumber: {
    fontSize: 29,
    fontWeight: '900',
  },

  statLabel: {
    color: COLORS.burgundyText,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
    marginBottom: 13,
  },

  statBottomLine: {
    height: 4,
    width: 34,
    borderRadius: 3,
  },

  countBadge: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 9,
    borderRadius: 14,
    backgroundColor: COLORS.paleMatcha,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  countText: {
    color: COLORS.burgundy,
    fontSize: 14,
    fontWeight: '900',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 11,
    marginBottom: 19,
  },

  searchIconCircle: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: COLORS.paleMatcha,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  searchIcon: {
    color: COLORS.burgundy,
    fontSize: 26,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 14,
    fontSize: 12,
    color: COLORS.darkBurgundy,
  },

  filterHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 1.4,
    marginBottom: 11,
  },

  filterScroll: {
    marginBottom: 7,
  },

  filterContainer: {
    gap: 8,
    paddingRight: 5,
    paddingBottom: 8,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterButtonActive: {
    backgroundColor: COLORS.burgundy,
    borderColor: COLORS.burgundy,
  },

  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.matcha,
    marginRight: 6,
  },

  filterText: {
    color: COLORS.burgundyText,
    fontWeight: '800',
    fontSize: 12,
  },

  filterTextActive: {
    color: COLORS.white,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.darkBurgundy,
    shadowOpacity: 0.06,
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
  },

  eventIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.paleMatcha,
    justifyContent: 'center',
    alignItems: 'center',
  },

  eventIcon: {
    fontSize: 25,
    color: COLORS.burgundy,
  },

  eventInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
    marginRight: 6,
  },

  eventTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.darkBurgundy,
    lineHeight: 20,
  },

  eventCode: {
    color: COLORS.burgundy,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
    letterSpacing: 0.4,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#EFEEE7',
    marginVertical: 16,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  lastDetailRow: {
    marginBottom: 0,
  },

  detailIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  detailInfo: {
    flex: 1,
  },

  detailLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  detailValue: {
    color: COLORS.burgundyText,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 34,
    alignItems: 'center',
    marginTop: 6,
  },

  emptyIconCircle: {
    width: 82,
    height: 82,
    borderRadius: 27,
    backgroundColor: COLORS.paleMatcha,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 19,
  },

  emptyIcon: {
    fontSize: 36,
    color: COLORS.burgundy,
  },

  emptyEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 1.4,
    textAlign: 'center',
    marginBottom: 8,
  },

  emptyTitle: {
    color: COLORS.darkBurgundy,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
  },

  emptyHint: {
    backgroundColor: COLORS.paleMatcha,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 22,
  },

  emptyHintText: {
    color: COLORS.burgundy,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  clearButton: {
    marginTop: 17,
    backgroundColor: COLORS.burgundy,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },

  clearButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8E8E8',
    borderWidth: 1,
    borderColor: '#EACACA',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },

  errorIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    color: '#A13D42',
    fontWeight: '900',
    fontSize: 18,
    marginRight: 10,
  },

  errorContent: {
    flex: 1,
  },

  errorHeading: {
    color: '#8D3037',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 5,
  },

  errorText: {
    color: '#8D3037',
    fontSize: 12,
    lineHeight: 18,
  },

  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 9,
  },

  retryText: {
    color: COLORS.burgundy,
    fontWeight: '900',
    fontSize: 11,
  },

  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 10,
  },

  footerLine: {
    height: 1,
    width: 48,
    backgroundColor: COLORS.matcha,
    marginVertical: 9,
  },

  footerMark: {
    color: COLORS.burgundy,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
  },

  footerText: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 6,
  },
});
