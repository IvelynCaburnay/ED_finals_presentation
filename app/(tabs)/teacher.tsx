
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import {
  createEvent,
  updateEvent,
  closeEvent,
  deleteEvent,
  getTeacherEvents,
  type Event,
} from '@/lib/events';

import { buildQRPayload } from '@/lib/qr';
import { getAttendanceForEvent } from '@/lib/attendance';
import { supabase } from '@/lib/supabase';

type AnalyticsReport = {
  eventId: string;
  title: string;
  eventCode: string;
  totalCheckIns: number | null;
  status: Event['status'];
};

const COLORS = {
  burgundy: '#701F35',
  darkBurgundy: '#351923',
  text: '#4C2531',
  matcha: '#A8B88A',
  paleMatcha: '#E7EDD9',
  cream: '#F8F7F2',
  muted: '#8A8F7B',
  white: '#FFFFFF',
  green: '#536746',
  paleRose: '#F2E1E5',
};

export default function TeacherScreen() {
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [attendance, setAttendance] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsReport[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // LOAD EVENTS AND ANALYTICS

  const loadEvents = useCallback(async () => {
    setAnalyticsLoading(true);

    try {
      const { data, error } = await getTeacherEvents();

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      const loadedEvents = data ?? [];
      setEvents(loadedEvents);

      const reports = await Promise.all(
        loadedEvents.map(async (event) => {
          try {
            const { data: attendanceData, error: attendanceError } =
              await getAttendanceForEvent(event.id);

            if (attendanceError) {
              console.log(
                'Analytics attendance error:',
                event.title,
                attendanceError.message
              );

              return {
                eventId: event.id,
                title: event.title,
                eventCode: event.event_code,
                totalCheckIns: null,
                status: event.status,
              };
            }

            return {
              eventId: event.id,
              title: event.title,
              eventCode: event.event_code,
              totalCheckIns: (attendanceData ?? []).length,
              status: event.status,
            };
          } catch (error: any) {
            console.log('Analytics error:', error?.message);

            return {
              eventId: event.id,
              title: event.title,
              eventCode: event.event_code,
              totalCheckIns: null,
              status: event.status,
            };
          }
        })
      );

      setAnalytics(reports);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Unable to load events.'
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  // FORM HELPERS

  function clearForm() {
    setTitle('');
    setEventCode('');
    setVenue('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setEditingId(null);
  }

  function openCreate() {
    clearForm();
    setShowForm(true);
  }

  function openEdit(event: Event) {
    setEditingId(event.id);
    setTitle(event.title);
    setEventCode(event.event_code);
    setVenue(event.venue);
    setDescription(event.description ?? '');
    setStartTime(event.start_time);
    setEndTime(event.end_time);
    setShowForm(true);
  }

  // CREATE OR UPDATE EVENT

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Validation', 'Event title is required.');
      return;
    }

    if (!eventCode.trim()) {
      Alert.alert('Validation', 'Event code is required.');
      return;
    }

    if (!venue.trim()) {
      Alert.alert('Validation', 'Venue is required.');
      return;
    }

    if (!startTime.trim() || !endTime.trim()) {
      Alert.alert('Validation', 'Start and end times are required.');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      Alert.alert(
        'Validation',
        'Use a valid date/time format, such as 2026-10-02T09:00:00.'
      );
      return;
    }

    if (end <= start) {
      Alert.alert('Validation', 'End time must be after start time.');
      return;
    }

    try {
      const eventData = {
        event_code: eventCode.trim(),
        title: title.trim(),
        venue: venue.trim(),
        description: description.trim(),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      };

      const { error } = editingId
        ? await updateEvent(editingId, eventData)
        : await createEvent(eventData);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert(
        'Success',
        editingId
          ? 'Event updated successfully.'
          : 'Event created successfully.'
      );

      setShowForm(false);
      clearForm();
      await loadEvents();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Unable to save event.'
      );
    }
  }

  // CLOSE EVENT

  function handleClose(event: Event) {
    Alert.alert('Close Event', `Close "${event.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await closeEvent(event.id);

            if (error) {
              Alert.alert('Error', error.message);
              return;
            }

            Alert.alert('Success', 'Event closed successfully.');
            await loadEvents();
          } catch (error: any) {
            Alert.alert(
              'Error',
              error?.message || 'Unable to close event.'
            );
          }
        },
      },
    ]);
  }

  // DELETE EVENT

  function handleDelete(event: Event) {
    Alert.alert('Delete Event', `Delete "${event.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await deleteEvent(event.id);

            if (error) {
              Alert.alert('Error', error.message);
              return;
            }

            Alert.alert('Success', 'Event deleted successfully.');
            await loadEvents();
          } catch (error: any) {
            Alert.alert(
              'Error',
              error?.message || 'Unable to delete event.'
            );
          }
        },
      },
    ]);
  }

  // SHOW QR CODE

  function handleShowQR(event: Event) {
    setSelectedEvent(event);
    setShowQR(true);
  }

  // VIEW ATTENDANCE

  async function handleAttendance(event: Event) {
    try {
      const { data, error } = await getAttendanceForEvent(event.id);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      setSelectedEvent(event);
      setAttendance(data ?? []);
      setShowAttendance(true);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Unable to load attendance.'
      );
    }
  }

  // LOGOUT

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut({
        scope: 'local',
      });

      if (error) {
        Alert.alert('Logout Error', error.message);
        return;
      }

      router.replace('/login');
    } catch (error: any) {
      Alert.alert(
        'Logout Error',
        error?.message || 'Unable to logout.'
      );
    }
  }

  // ANALYTICS TOTALS

  const totalCheckIns = analytics.reduce(
    (total, report) => total + (report.totalCheckIns ?? 0),
    0
  );

  const eventsWithCheckIns = analytics.filter(
    (report) =>
      report.totalCheckIns !== null &&
      report.totalCheckIns > 0
  ).length;

  const eventsWithoutCheckIns = analytics.filter(
    (report) => report.totalCheckIns === 0
  ).length;

  const reportsWithErrors = analytics.filter(
    (report) => report.totalCheckIns === null
  ).length;

  // SCREEN

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>QR-ATT • TEACHER PORTAL</Text>
        <Text style={styles.title}>Teacher Dashboard</Text>
        <Text style={styles.subtitle}>
          Create and manage school events
        </Text>
      </View>

      <Pressable style={styles.createButton} onPress={openCreate}>
        <Text style={styles.createButtonText}>＋ CREATE EVENT</Text>
      </Pressable>

      {/* ANALYTICS */}

      <Text style={styles.sectionTitle}>Attendance Analytics</Text>

      {analyticsLoading && (
        <View style={styles.analyticsLoading}>
          <Text style={styles.emptyText}>
            Loading attendance analytics...
          </Text>
        </View>
      )}

      <View style={styles.analyticsGrid}>
        <View style={[styles.analyticsCard, styles.analyticsRose]}>
          <Text style={styles.analyticsLabel}>Total Events</Text>
          <Text style={styles.analyticsNumber}>{events.length}</Text>
          <Text style={styles.analyticsHint}>Events you manage</Text>
        </View>

        <View style={[styles.analyticsCard, styles.analyticsMatcha]}>
          <Text style={styles.analyticsLabel}>Total Check-ins</Text>
          <Text style={styles.analyticsNumber}>{totalCheckIns}</Text>
          <Text style={styles.analyticsHint}>Recorded attendance</Text>
        </View>

        <View style={[styles.analyticsCard, styles.analyticsCream]}>
          <Text style={styles.analyticsLabel}>Events With Check-ins</Text>
          <Text style={styles.analyticsNumber}>{eventsWithCheckIns}</Text>
          <Text style={styles.analyticsHint}>Attendance recorded</Text>
        </View>

        <View style={[styles.analyticsCard, styles.analyticsNeutral]}>
          <Text style={styles.analyticsLabel}>No Check-ins Yet</Text>
          <Text style={styles.analyticsNumber}>{eventsWithoutCheckIns}</Text>
          <Text style={styles.analyticsHint}>No records yet</Text>
        </View>
      </View>

      {reportsWithErrors > 0 && (
        <View style={styles.analyticsWarning}>
          <Text style={styles.analyticsWarningText}>
            Attendance could not be loaded for {reportsWithErrors}{' '}
            event{reportsWithErrors === 1 ? '' : 's'}. Check your
            console for details.
          </Text>
        </View>
      )}

      {/* ATTENDANCE REPORTS */}

      <Text style={styles.sectionTitle}>Attendance Reports</Text>

      {analytics.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No event reports available yet.
          </Text>
        </View>
      ) : (
        analytics.map((report) => (
          <View key={report.eventId} style={styles.reportCard}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportCode}>
              Event Code: {report.eventCode}
            </Text>

            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Event Status</Text>
              <Text style={styles.reportValue}>
                {String(report.status).toUpperCase()}
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Total Check-ins</Text>
              <Text style={styles.reportCount}>
                {report.totalCheckIns === null
                  ? 'Unavailable'
                  : report.totalCheckIns}
              </Text>
            </View>

            <Pressable
              style={styles.reportButton}
              onPress={() => {
                const event = events.find(
                  (item) => item.id === report.eventId
                );

                if (event) {
                  handleAttendance(event);
                }
              }}
            >
              <Text style={styles.reportButtonText}>
                VIEW ATTENDANCE REPORT
              </Text>
            </Pressable>
          </View>
        ))
      )}

      {/* MY EVENTS */}

      <Text style={styles.sectionTitle}>My Events</Text>

      {events.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            You have not created any events yet.
          </Text>
        </View>
      ) : (
        events.map((event) => (
          <View key={event.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.info}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.code}>{event.event_code}</Text>
              </View>

              <View
                style={[
                  styles.status,
                  event.status === 'open'
                    ? styles.open
                    : styles.closed,
                ]}
              >
                <Text style={styles.statusText}>
                  {String(event.status).toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.detail}>📍 {event.venue}</Text>

            <Text style={styles.detail}>
              🕒 {new Date(event.start_time).toLocaleString()}
            </Text>

            <Text style={styles.detail}>
              🕒 End: {new Date(event.end_time).toLocaleString()}
            </Text>

            {event.description ? (
              <Text style={styles.description}>
                {event.description}
              </Text>
            ) : null}

            <View style={styles.actions}>
              {event.status === 'open' && (
                <Pressable
                  style={styles.actionPrimary}
                  onPress={() => handleShowQR(event)}
                >
                  <Text style={styles.actionText}>QR CODE</Text>
                </Pressable>
              )}

              <Pressable
                style={styles.actionGray}
                onPress={() => openEdit(event)}
              >
                <Text style={styles.actionTextDark}>EDIT</Text>
              </Pressable>

              {event.status === 'open' && (
                <Pressable
                  style={styles.actionMatcha}
                  onPress={() => handleClose(event)}
                >
                  <Text style={styles.actionTextDark}>CLOSE</Text>
                </Pressable>
              )}

              <Pressable
                style={styles.actionGreen}
                onPress={() => handleAttendance(event)}
              >
                <Text style={styles.actionText}>ATTENDANCE</Text>
              </Pressable>

              <Pressable
                style={styles.actionRed}
                onPress={() => handleDelete(event)}
              >
                <Text style={styles.actionText}>DELETE</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {/* CREATE / EDIT MODAL */}

      <Modal
        visible={showForm}
        animationType="slide"
        onRequestClose={() => setShowForm(false)}
      >
        <ScrollView
          style={styles.modalContainer}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalEyebrow}>EVENT MANAGEMENT</Text>
          <Text style={styles.modalTitle}>
            {editingId ? 'Edit Event' : 'Create Event'}
          </Text>

          <Text style={styles.label}>Event Name</Text>
          <TextInput
            style={styles.input}
            placeholder="School Foundation Day"
            placeholderTextColor={COLORS.muted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Event Code</Text>
          <TextInput
            style={styles.input}
            placeholder="EVT-2026-001"
            placeholderTextColor={COLORS.muted}
            value={eventCode}
            onChangeText={setEventCode}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Venue</Text>
          <TextInput
            style={styles.input}
            placeholder="School Gymnasium"
            placeholderTextColor={COLORS.muted}
            value={venue}
            onChangeText={setVenue}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Event description"
            placeholderTextColor={COLORS.muted}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.label}>Start Date/Time</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-10-02T09:00:00"
            placeholderTextColor={COLORS.muted}
            value={startTime}
            onChangeText={setStartTime}
          />
          <Text style={styles.helper}>
            Example: 2026-10-02T09:00:00
          </Text>

          <Text style={styles.label}>End Date/Time</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-10-02T12:00:00"
            placeholderTextColor={COLORS.muted}
            value={endTime}
            onChangeText={setEndTime}
          />
          <Text style={styles.helper}>
            Example: 2026-10-02T12:00:00
          </Text>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {editingId ? 'UPDATE EVENT' : 'CREATE EVENT'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() => {
              setShowForm(false);
              clearForm();
            }}
          >
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </Pressable>
        </ScrollView>
      </Modal>

      {/* QR MODAL */}

      <Modal
        visible={showQR}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <Text style={styles.modalEyebrow}>SCAN TO ATTEND</Text>
            <Text style={styles.qrTitle}>Event QR Code</Text>
            <Text style={styles.qrEvent}>
              {selectedEvent?.title}
            </Text>

            {selectedEvent && (
              <View style={styles.qrBox}>
                <QRCode
                  value={buildQRPayload(selectedEvent.event_code)}
                  size={230}
                />
              </View>
            )}

            <Text style={styles.qrCode}>
              {selectedEvent?.event_code}
            </Text>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowQR(false)}
            >
              <Text style={styles.cancelButtonText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ATTENDANCE MODAL */}

      <Modal
        visible={showAttendance}
        animationType="slide"
        onRequestClose={() => setShowAttendance(false)}
      >
        <ScrollView
          style={styles.modalContainer}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalEyebrow}>EVENT RECORDS</Text>
          <Text style={styles.modalTitle}>Attendance</Text>
          <Text style={styles.qrEvent}>
            {selectedEvent?.title}
          </Text>

          {attendance.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No attendance records yet.
              </Text>
            </View>
          ) : (
            attendance.map((item) => (
              <View key={item.id} style={styles.attendanceCard}>
                <Text style={styles.studentName}>
                  {item.profile?.full_name || 'Student'}
                </Text>

                <Text style={styles.studentEmail}>
                  {item.profile?.email || ''}
                </Text>

                <Text style={styles.detail}>
                  {item.scanned_at
                    ? new Date(item.scanned_at).toLocaleString()
                    : 'Scan time unavailable'}
                </Text>

                <Text style={styles.present}>
                  {String(item.status ?? 'unknown').toUpperCase()}
                </Text>
              </View>
            ))
          )}

          <Pressable
            style={styles.cancelButton}
            onPress={() => setShowAttendance(false)}
          >
            <Text style={styles.cancelButtonText}>CLOSE</Text>
          </Pressable>
        </ScrollView>
      </Modal>

      {/* LOGOUT */}

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>LOG OUT</Text>
      </Pressable>
    </ScrollView>
  );
}

// STYLES

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  content: {
    paddingBottom: 40,
  },

  header: {
    backgroundColor: COLORS.burgundy,
    paddingTop: 55,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  eyebrow: {
    color: COLORS.matcha,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  subtitle: {
    color: COLORS.paleMatcha,
    marginTop: 7,
    fontSize: 14,
  },

  createButton: {
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 28,
    minHeight: 54,
    backgroundColor: COLORS.burgundy,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: COLORS.darkBurgundy,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  createButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.8,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 5,
  },

  empty: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.paleMatcha,
  },

  emptyText: {
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 21,
  },

  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 18,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.paleMatcha,
    elevation: 2,
    shadowColor: COLORS.darkBurgundy,
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  info: {
    flex: 1,
  },

  eventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 24,
  },

  code: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },

  status: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  open: {
    backgroundColor: COLORS.paleMatcha,
  },

  closed: {
    backgroundColor: COLORS.paleRose,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text,
  },

  detail: {
    color: '#686B5F',
    fontSize: 13,
    marginTop: 9,
    lineHeight: 19,
  },

  description: {
    color: '#686B5F',
    marginTop: 12,
    lineHeight: 20,
    fontSize: 13,
    backgroundColor: COLORS.cream,
    padding: 12,
    borderRadius: 10,
  },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0EEE7',
  },

  actionPrimary: {
    backgroundColor: COLORS.burgundy,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
  },

  actionGray: {
    backgroundColor: '#F0EEE7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
  },

  actionMatcha: {
    backgroundColor: COLORS.matcha,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
  },

  actionGreen: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
  },

  actionRed: {
    backgroundColor: '#8D344A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
  },

  actionText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  actionTextDark: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  analyticsLoading: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 13,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.paleMatcha,
  },

  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 26,
  },

  analyticsCard: {
    width: '47%',
    flexGrow: 1,
    minHeight: 132,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.paleMatcha,
    elevation: 2,
    shadowColor: COLORS.darkBurgundy,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  analyticsRose: {
    backgroundColor: COLORS.paleRose,
  },

  analyticsMatcha: {
    backgroundColor: COLORS.paleMatcha,
  },

  analyticsCream: {
    backgroundColor: '#F2EBDD',
  },

  analyticsNeutral: {
    backgroundColor: '#EEE8E2',
  },

  analyticsLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },

  analyticsNumber: {
    color: COLORS.burgundy,
    fontSize: 31,
    fontWeight: '800',
    marginTop: 8,
  },

  analyticsHint: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
    lineHeight: 15,
  },

  analyticsWarning: {
    backgroundColor: '#F2EBDD',
    borderWidth: 1,
    borderColor: '#D8C6A7',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 20,
  },

  analyticsWarningText: {
    color: '#6E4F27',
    fontSize: 12,
    lineHeight: 19,
  },

  reportCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.paleMatcha,
    elevation: 2,
    shadowColor: COLORS.darkBurgundy,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  reportTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 23,
  },

  reportCode: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
    marginBottom: 13,
  },

  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingVertical: 4,
  },

  reportLabel: {
    color: '#686B5F',
    fontSize: 13,
    flex: 1,
  },

  reportValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },

  reportCount: {
    color: COLORS.green,
    fontSize: 19,
    fontWeight: '800',
  },

  reportButton: {
    backgroundColor: COLORS.burgundy,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },

  reportButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  modalContent: {
    padding: 22,
    paddingTop: 55,
    paddingBottom: 50,
  },

  modalEyebrow: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
    textAlign: 'center',
  },

  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.burgundy,
    marginBottom: 22,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    minHeight: 50,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#DADDD0',
    borderRadius: 11,
    paddingHorizontal: 14,
    color: COLORS.darkBurgundy,
    fontSize: 14,
  },

  textArea: {
    height: 100,
    paddingTop: 13,
    textAlignVertical: 'top',
  },

  helper: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 16,
  },

  saveButton: {
    minHeight: 53,
    backgroundColor: COLORS.burgundy,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },

  saveButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  cancelButton: {
    minHeight: 50,
    backgroundColor: COLORS.paleMatcha,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(53, 25, 35, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  qrModal: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 26,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.paleMatcha,
  },

  qrTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.burgundy,
    marginBottom: 10,
  },

  qrEvent: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },

  qrBox: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.paleMatcha,
  },

  qrCode: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 5,
  },

  attendanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.paleMatcha,
    elevation: 1,
    shadowColor: COLORS.darkBurgundy,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  studentEmail: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
  },

  present: {
    color: COLORS.green,
    backgroundColor: COLORS.paleMatcha,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    fontWeight: '800',
    fontSize: 11,
    marginTop: 10,
  },

  logoutButton: {
    minHeight: 52,
    backgroundColor: COLORS.burgundy,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 25,
  },

  logoutButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
