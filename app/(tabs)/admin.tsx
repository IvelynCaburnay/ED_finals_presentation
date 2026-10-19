
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Role = 'student' | 'teacher' | 'admin';

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
};

type Event = {
  id: string;
  event_code: string | null;
  title: string;
  venue: string | null;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  created_by: string | null;
};

type Attendance = {
  id: string;
  student_id: string;
  event_id: string;
  status: string | null;
  scanned_at: string | null;
};

type AttendanceDisplay = Attendance & {
  studentName: string;
  studentEmail: string;
  eventTitle: string;
};

const COLORS = {
  burgundy: '#701F35',
  darkBurgundy: '#351923',
  burgundyText: '#4C2531',
  matcha: '#A8B88A',
  paleMatcha: '#E7EDD9',
  cream: '#F8F7F2',
  muted: '#8A8F7B',
  white: '#FFFFFF',
  border: '#E1E4D7',
  gray: '#686B5F',
  red: '#8D344A',
  green: '#536746',
  palePink: '#F2E1E5',
  paleBeige: '#F2EBDD',
};

export default function AdminScreen() {
  const router = useRouter();

  const [users, setUsers] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] =
    useState<AttendanceDisplay[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingEvent, setEditingEvent] =
    useState<Event | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editDescription, setEditDescription] =
    useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  // LOAD DASHBOARD
  const loadDashboard = useCallback(async () => {
    try {
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        router.replace('/login');
        return;
      }

      const {
        data: currentProfile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('id,email,full_name,role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!currentProfile) {
        throw new Error('Your profile was not found.');
      }

      if (currentProfile.role !== 'admin') {
        Alert.alert(
          'Access Denied',
          'Only administrators can access this page.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/'),
            },
          ]
        );
        return;
      }

      // LOAD USERS
      const {
        data: usersData,
        error: usersError,
      } = await supabase
        .from('profiles')
        .select('id,email,full_name,role')
        .order('full_name', { ascending: true });

      if (usersError) throw usersError;

      setUsers((usersData ?? []) as Profile[]);

      // LOAD EVENTS
      const {
        data: eventsData,
        error: eventsError,
      } = await supabase
        .from('events')
        .select(
          'id,event_code,title,venue,description,start_time,end_time,status,created_by'
        )
        .order('start_time', { ascending: false });

      if (eventsError) throw eventsError;

      setEvents((eventsData ?? []) as Event[]);

      // LOAD ATTENDANCE
      const {
        data: attendanceData,
        error: attendanceError,
      } = await supabase
        .from('attendance')
        .select('id,student_id,event_id,status,scanned_at')
        .order('scanned_at', { ascending: false });

      if (attendanceError) throw attendanceError;

      const attendanceRows =
        (attendanceData ?? []) as Attendance[];

      const studentIds = [
        ...new Set(
          attendanceRows.map((item) => item.student_id)
        ),
      ];

      const eventIds = [
        ...new Set(
          attendanceRows.map((item) => item.event_id)
        ),
      ];

      let studentProfiles: Profile[] = [];

      if (studentIds.length > 0) {
        const {
          data: studentData,
          error: studentError,
        } = await supabase
          .from('profiles')
          .select('id,email,full_name,role')
          .in('id', studentIds);

        if (studentError) throw studentError;

        studentProfiles = (studentData ?? []) as Profile[];
      }

      let attendanceEvents: Event[] = [];

      if (eventIds.length > 0) {
        const {
          data: eventData,
          error: eventError,
        } = await supabase
          .from('events')
          .select(
            'id,event_code,title,venue,description,start_time,end_time,status,created_by'
          )
          .in('id', eventIds);

        if (eventError) throw eventError;

        attendanceEvents = (eventData ?? []) as Event[];
      }

      const attendanceDisplay: AttendanceDisplay[] =
        attendanceRows.map((record) => {
          const student = studentProfiles.find(
            (item) => item.id === record.student_id
          );

          const event = attendanceEvents.find(
            (item) => item.id === record.event_id
          );

          return {
            ...record,
            studentName: student?.full_name ?? 'Unknown Student',
            studentEmail: student?.email ?? 'No email',
            eventTitle: event?.title ?? 'Unknown Event',
          };
        });

      setAttendance(attendanceDisplay);
    } catch (err: any) {
      console.error('Dashboard loading error:', err);

      setError(
        err?.message ?? 'Unable to load admin dashboard.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // REFRESH
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  // CHANGE USER ROLE
  const changeUserRole = (user: Profile) => {
    if (user.role === 'admin') {
      Alert.alert(
        'Administrator',
        'Administrator accounts cannot be changed from this screen.'
      );
      return;
    }

    Alert.alert(
      'Change Role',
      `${user.full_name ?? user.email}\n\nCurrent role: ${user.role}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Student',
          onPress: () => updateUserRole(user, 'student'),
        },
        {
          text: 'Teacher',
          onPress: () => updateUserRole(user, 'teacher'),
        },
      ]
    );
  };

  // UPDATE USER ROLE
  const updateUserRole = async (
    user: Profile,
    newRole: 'student' | 'teacher'
  ) => {
    try {
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('You are not logged in.');
      }

      const {
        data: adminProfile,
        error: adminProfileError,
      } = await supabase
        .from('profiles')
        .select('id,email,full_name,role')
        .eq('id', authData.user.id)
        .single();

      if (adminProfileError) throw adminProfileError;

      if (adminProfile?.role !== 'admin') {
        throw new Error(
          'Your account is not an administrator.'
        );
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id)
        .select('id,email,full_name,role');

      if (updateError) throw updateError;

      if (!data || data.length === 0) {
        throw new Error(
          'No user was updated. Check your Supabase RLS policies.'
        );
      }

      Alert.alert(
        'Success',
        `${user.full_name ?? user.email} is now a ${newRole}.`
      );

      await loadDashboard();
    } catch (err: any) {
      console.error('Role update error:', err);

      Alert.alert(
        'Role Update Error',
        err?.message ?? 'Unable to update user role.'
      );
    }
  };

  // OPEN EDIT EVENT
  const editEvent = (event: Event) => {
    setEditingEvent(event);
    setEditTitle(event.title ?? '');
    setEditVenue(event.venue ?? '');
    setEditDescription(event.description ?? '');
  };

  // SAVE EVENT
  const saveEditedEvent = async () => {
    if (!editingEvent) return;

    if (!editTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter an event title.');
      return;
    }

    try {
      setSavingEvent(true);

      const { data, error: updateError } = await supabase
        .from('events')
        .update({
          title: editTitle.trim(),
          venue: editVenue.trim() || null,
          description: editDescription.trim() || null,
        })
        .eq('id', editingEvent.id)
        .select();

      if (updateError) throw updateError;

      if (!data || data.length === 0) {
        throw new Error(
          'Event was not updated. Check your Supabase RLS policies.'
        );
      }

      setEditingEvent(null);
      setEditTitle('');
      setEditVenue('');
      setEditDescription('');

      Alert.alert('Success', 'Event updated successfully.');

      await loadDashboard();
    } catch (err: any) {
      console.error('Edit event error:', err);

      Alert.alert(
        'Edit Event Error',
        err?.message ?? 'Unable to edit event.'
      );
    } finally {
      setSavingEvent(false);
    }
  };

  // DELETE EVENT
  const deleteEvent = (event: Event) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?\n\nAll attendance records for this event will also be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteEvent(event),
        },
      ]
    );
  };

  const confirmDeleteEvent = async (event: Event) => {
    try {
      const {
        error: attendanceDeleteError,
      } = await supabase
        .from('attendance')
        .delete()
        .eq('event_id', event.id);

      if (attendanceDeleteError) {
        throw attendanceDeleteError;
      }

      const { data, error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)
        .select();

      if (deleteError) throw deleteError;

      if (!data || data.length === 0) {
        throw new Error(
          'Event was not deleted. Check your Supabase RLS policies.'
        );
      }

      Alert.alert('Success', 'Event deleted successfully.');

      await loadDashboard();
    } catch (err: any) {
      console.error('Delete event error:', err);

      Alert.alert(
        'Delete Event Error',
        err?.message ?? 'Unable to delete event.'
      );
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) throw signOutError;

      const { data: sessionData } =
        await supabase.auth.getSession();

      if (sessionData.session) {
        throw new Error(
          'The session is still active. Please try again.'
        );
      }

      router.replace('/login');
    } catch (err: any) {
      console.error('Logout error:', err);

      Alert.alert(
        'Logout Error',
        err?.message ?? 'Unable to logout.'
      );
    } finally {
      setLoggingOut(false);
    }
  };

  // FORMAT DATE
  const formatDate = (value: string | null) => {
    if (!value) return 'N/A';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString();
  };

  // LOADING
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.burgundy}
        />
        <Text style={styles.loadingText}>
          Loading admin dashboard...
        </Text>
      </View>
    );
  }

  // DASHBOARD
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.burgundy}
            colors={[COLORS.burgundy]}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="shield-checkmark"
              size={28}
              color={COLORS.paleMatcha}
            />
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Admin Dashboard
            </Text>
            <Text style={styles.headerSubtitle}>
              Manage users, events, and attendance
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator
                size="small"
                color={COLORS.white}
              />
            ) : (
              <Ionicons
                name="log-out-outline"
                size={20}
                color={COLORS.white}
              />
            )}
            <Text style={styles.logoutText}>
              {loggingOut ? 'Logging out...' : 'Logout'}
            </Text>
          </Pressable>
        </View>

        {/* ERROR */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={COLORS.red}
            />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={handleRefresh}>
              <Text style={styles.retryText}>RETRY</Text>
            </Pressable>
          </View>
        )}

        {/* USER MANAGEMENT */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="people-outline"
                  size={21}
                  color={COLORS.burgundy}
                />
              </View>
              <View style={styles.headingText}>
                <Text style={styles.sectionTitle}>
                  User Management
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Change student and teacher roles
                </Text>
              </View>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {users.length}
              </Text>
            </View>
          </View>

          {users.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="people-outline"
                size={38}
                color={COLORS.muted}
              />
              <Text style={styles.emptyText}>
                No users found.
              </Text>
            </View>
          ) : (
            users.map((user) => (
              <View key={user.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Ionicons
                      name="person"
                      size={22}
                      color={COLORS.burgundy}
                    />
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {user.full_name ?? 'No Name'}
                    </Text>
                    <Text style={styles.userEmail}>
                      {user.email ?? 'No Email'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.roleBadge,
                      user.role === 'admin'
                        ? styles.adminBadge
                        : user.role === 'teacher'
                        ? styles.teacherBadge
                        : styles.studentBadge,
                    ]}
                  >
                    <Text style={styles.roleText}>
                      {user.role.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {user.role !== 'admin' && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => changeUserRole(user)}
                  >
                    <Ionicons
                      name="swap-horizontal"
                      size={18}
                      color={COLORS.white}
                    />
                    <Text style={styles.buttonText}>
                      CHANGE ROLE
                    </Text>
                  </Pressable>
                )}
              </View>
            ))
          )}
        </View>

        {/* EVENT MANAGEMENT */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={21}
                  color={COLORS.burgundy}
                />
              </View>
              <View style={styles.headingText}>
                <Text style={styles.sectionTitle}>
                  Event Management
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Edit or delete attendance events
                </Text>
              </View>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {events.length}
              </Text>
            </View>
          </View>

          {events.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="calendar-outline"
                size={38}
                color={COLORS.muted}
              />
              <Text style={styles.emptyText}>
                No events found.
              </Text>
            </View>
          ) : (
            events.map((event) => (
              <View key={event.id} style={styles.card}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventIcon}>
                    <Ionicons
                      name="calendar"
                      size={22}
                      color={COLORS.burgundy}
                    />
                  </View>

                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>
                      {event.title}
                    </Text>

                    {event.event_code && (
                      <Text style={styles.eventCode}>
                        Code: {event.event_code}
                      </Text>
                    )}
                  </View>

                  {event.status && (
                    <View style={styles.eventStatus}>
                      <Text style={styles.eventStatusText}>
                        {event.status.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={COLORS.muted}
                  />
                  <Text style={styles.detailText}>
                    {event.venue ?? 'No venue'}
                  </Text>
                </View>

                {event.description && (
                  <Text style={styles.description}>
                    {event.description}
                  </Text>
                )}

                <View style={styles.detailRow}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={COLORS.muted}
                  />
                  <Text style={styles.detailText}>
                    {formatDate(event.start_time)}
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => editEvent(event)}
                  >
                    <Ionicons
                      name="create-outline"
                      size={17}
                      color={COLORS.white}
                    />
                    <Text style={styles.buttonText}>
                      EDIT
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => deleteEvent(event)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color={COLORS.white}
                    />
                    <Text style={styles.buttonText}>
                      DELETE
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ATTENDANCE RECORDS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={21}
                  color={COLORS.burgundy}
                />
              </View>
              <View style={styles.headingText}>
                <Text style={styles.sectionTitle}>
                  Attendance Records
                </Text>
                <Text style={styles.sectionSubtitle}>
                  View student attendance
                </Text>
              </View>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {attendance.length}
              </Text>
            </View>
          </View>

          {attendance.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="checkmark-done-outline"
                size={38}
                color={COLORS.muted}
              />
              <Text style={styles.emptyText}>
                No attendance records found.
              </Text>
            </View>
          ) : (
            attendance.map((record) => (
              <View key={record.id} style={styles.card}>
                <View style={styles.attendanceHeader}>
                  <View style={styles.avatar}>
                    <Ionicons
                      name="person-outline"
                      size={21}
                      color={COLORS.burgundy}
                    />
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {record.studentName}
                    </Text>
                    <Text style={styles.userEmail}>
                      {record.studentEmail}
                    </Text>
                  </View>

                  <View style={styles.presentBadge}>
                    <Text style={styles.presentText}>
                      {(record.status ?? 'present').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={COLORS.muted}
                  />
                  <Text style={styles.detailText}>
                    {record.eventTitle}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={COLORS.muted}
                  />
                  <Text style={styles.detailText}>
                    {formatDate(record.scanned_at)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* REPORTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="bar-chart-outline"
                  size={21}
                  color={COLORS.burgundy}
                />
              </View>
              <View style={styles.headingText}>
                <Text style={styles.sectionTitle}>
                  Reports
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Dashboard summary
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons
                  name="people-outline"
                  size={25}
                  color={COLORS.burgundy}
                />
              </View>
              <Text style={styles.statNumber}>
                {users.length}
              </Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconMatcha}>
                <Ionicons
                  name="calendar-outline"
                  size={25}
                  color={COLORS.green}
                />
              </View>
              <Text style={styles.statNumber}>
                {events.length}
              </Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconPink}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={25}
                  color={COLORS.red}
                />
              </View>
              <Text style={styles.statNumber}>
                {attendance.length}
              </Text>
              <Text style={styles.statLabel}>
                Attendance
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerText}>
          QR-ATT • Smart School Event Attendance
        </Text>
      </ScrollView>

      {/* EDIT EVENT MODAL */}
      <Modal
        visible={editingEvent !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!savingEvent) setEditingEvent(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>
                  EVENT MANAGEMENT
                </Text>
                <Text style={styles.modalTitle}>
                  Edit Event
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  if (!savingEvent) setEditingEvent(null);
                }}
                disabled={savingEvent}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={23}
                  color={COLORS.burgundyText}
                />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>
              Event Title
            </Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter event title"
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputLabel}>
              Venue
            </Text>
            <TextInput
              style={styles.input}
              value={editVenue}
              onChangeText={setEditVenue}
              placeholder="Enter venue"
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputLabel}>
              Description
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Enter event description"
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  if (!savingEvent) setEditingEvent(null);
                }}
                disabled={savingEvent}
              >
                <Text style={styles.cancelButtonText}>
                  CANCEL
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.pressed,
                  savingEvent && styles.disabledButton,
                ]}
                onPress={saveEditedEvent}
                disabled={savingEvent}
              >
                {savingEvent ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.white}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={18}
                      color={COLORS.white}
                    />
                    <Text style={styles.buttonText}>
                      SAVE CHANGES
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 35,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.gray,
  },

  header: {
    backgroundColor: COLORS.burgundy,
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    flexWrap: 'wrap',
    shadowColor: COLORS.darkBurgundy,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(231,237,217,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 160,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  headerSubtitle: {
    color: COLORS.paleMatcha,
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.darkBurgundy,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  logoutText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.palePink,
    borderWidth: 1,
    borderColor: '#E4C2CB',
    borderRadius: 12,
    padding: 13,
    marginBottom: 20,
    gap: 9,
  },

  errorText: {
    flex: 1,
    color: COLORS.red,
    fontSize: 13,
    lineHeight: 19,
  },

  retryText: {
    color: COLORS.burgundy,
    fontWeight: '800',
    fontSize: 11,
  },

  section: {
    marginBottom: 26,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
    gap: 10,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },

  sectionIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.paleMatcha,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headingText: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.burgundyText,
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },

  countBadge: {
    minWidth: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: COLORS.paleMatcha,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 9,
  },

  countText: {
    color: COLORS.green,
    fontWeight: '800',
    fontSize: 14,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.darkBurgundy,
    shadowOpacity: 0.055,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.paleMatcha,
    justifyContent: 'center',
    alignItems: 'center',
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.burgundyText,
  },

  userEmail: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },

  roleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  adminBadge: {
    backgroundColor: COLORS.palePink,
  },

  teacherBadge: {
    backgroundColor: COLORS.paleMatcha,
  },

  studentBadge: {
    backgroundColor: COLORS.paleBeige,
  },

  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.burgundyText,
  },

  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.burgundy,
    paddingVertical: 12,
    borderRadius: 10,
  },

  editButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.burgundy,
    paddingVertical: 12,
    borderRadius: 10,
  },

  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.red,
    paddingVertical: 12,
    borderRadius: 10,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
    gap: 11,
  },

  eventIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.paleMatcha,
    justifyContent: 'center',
    alignItems: 'center',
  },

  eventInfo: {
    flex: 1,
    minWidth: 0,
  },

  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.burgundyText,
    lineHeight: 22,
  },

  eventCode: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  eventStatus: {
    backgroundColor: COLORS.paleMatcha,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  eventStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.green,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
    gap: 8,
  },

  detailText: {
    flex: 1,
    color: COLORS.gray,
    fontSize: 13,
    lineHeight: 19,
  },

  description: {
    color: COLORS.gray,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 11,
    backgroundColor: COLORS.cream,
    padding: 12,
    borderRadius: 10,
  },

  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },

  presentBadge: {
    backgroundColor: COLORS.paleMatcha,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  presentText: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyText: {
    color: COLORS.muted,
    marginTop: 11,
    fontSize: 14,
    textAlign: 'center',
  },

  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  statCard: {
    flex: 1,
    minWidth: 125,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.darkBurgundy,
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.palePink,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statIconMatcha: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.paleMatcha,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statIconPink: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.paleBeige,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statNumber: {
    fontSize: 27,
    fontWeight: '800',
    color: COLORS.burgundy,
    marginTop: 10,
  },

  statLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
    fontWeight: '700',
  },

  footerText: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
    marginBottom: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(53,25,35,0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: COLORS.cream,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.paleMatcha,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  modalEyebrow: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.burgundy,
  },

  closeButton: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: COLORS.paleMatcha,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.burgundyText,
    marginBottom: 7,
    marginTop: 11,
  },

  input: {
    borderWidth: 1,
    borderColor: '#DADDD0',
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.darkBurgundy,
    backgroundColor: COLORS.white,
  },

  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 23,
  },

  cancelButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.paleMatcha,
    paddingVertical: 14,
    borderRadius: 11,
  },

  cancelButtonText: {
    color: COLORS.burgundyText,
    fontSize: 12,
    fontWeight: '800',
  },

  saveButton: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.burgundy,
    paddingVertical: 14,
    borderRadius: 11,
  },

  disabledButton: {
    opacity: 0.65,
  },

  pressed: {
    opacity: 0.78,
  },
});
