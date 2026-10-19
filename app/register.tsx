import { useState } from 'react';

import {
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
} from 'react-native';

import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';
import { signUp } from '@/lib/auth';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [role, setRole] = useState<'student' | 'teacher'>('student');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUp(
        email.trim(),
        password,
        {
          full_name: fullName.trim(),
          role: role,
        }
      );

      if (authError) {
        setError(authError.message);
      } else if (data.session) {
        router.replace('/(tabs)');
      } else {
        setSuccess(true);
      }
    } catch {
      setError(
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <Header title="QR Attendance" />
            </View>

            <View style={styles.headingContainer}>
              <Text style={styles.eyebrow}>
                JOIN QR-ATT
              </Text>

              <Text style={styles.title}>
                Create Account
              </Text>

              <Text style={styles.subtitle}>
                Register to start recording attendance.
              </Text>
            </View>

            {success ? (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>
                    ✓
                  </Text>
                </View>

                <Text style={styles.successTitle}>
                  Check your email!
                </Text>

                <Text style={styles.successText}>
                  We sent a confirmation link to {email}.
                  Click the link to verify your account,
                  then come back and sign in.
                </Text>

                <Link href="/login" style={styles.successButton}>
                  Back to Sign In
                </Link>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.label}>
                  Full Name
                </Text>

                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.greyBlue}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />

                <Text style={styles.label}>
                  Account Type
                </Text>

                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'student' &&
                        styles.roleButtonActive,
                    ]}
                    onPress={() => setRole('student')}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.roleIcon,
                        role === 'student' &&
                          styles.roleIconActive,
                      ]}
                    >
                      <Text style={styles.roleIconText}>
                        S
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.roleText,
                        role === 'student' &&
                          styles.roleTextActive,
                      ]}
                    >
                      Student
                    </Text>

                    <Text style={styles.roleDescription}>
                      Attend events
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'teacher' &&
                        styles.roleButtonActive,
                    ]}
                    onPress={() => setRole('teacher')}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.roleIcon,
                        role === 'teacher' &&
                          styles.roleIconActive,
                      ]}
                    >
                      <Text style={styles.roleIconText}>
                        T
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.roleText,
                        role === 'teacher' &&
                          styles.roleTextActive,
                      ]}
                    >
                      Teacher
                    </Text>

                    <Text style={styles.roleDescription}>
                      Manage attendance
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>
                  Email Address
                </Text>

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@school.edu"
                  placeholderTextColor={COLORS.greyBlue}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!loading}
                />

                <Text style={styles.label}>
                  Password
                </Text>

                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={COLORS.greyBlue}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />

                <Text style={[styles.label, styles.confirmLabel]}>
                  Confirm Password
                </Text>

                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={COLORS.greyBlue}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>!</Text>
                    <Text style={styles.error}>
                      {error}
                    </Text>
                  </View>
                )}

                {loading ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator
                      size="large"
                      color="#701F35"
                    />
                    <Text style={styles.loadingText}>
                      Creating your account...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.buttonContainer}>
                    <AppButton
                      theme="primary"
                      title="Create Account"
                      icon="person-add-outline"
                      onPress={handleRegister}
                    />
                  </View>
                )}
              </View>
            )}

            {!success && (
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Already have an account?
                </Text>

                <Link href="/login" style={styles.loginLink}>
                  Sign In
                </Link>
              </View>
            )}

            <Text style={styles.footerText}>
              QR-ATT · Smart School Attendance
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F2',
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  headerContainer: {
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 30,
  },

  headingContainer: {
    marginBottom: 26,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#8A8F7B',
    marginBottom: 10,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#351923',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: '#8A8F7B',
    lineHeight: 21,
  },

  form: {
    marginBottom: 24,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4C2531',
    marginBottom: 8,
    marginTop: 15,
  },

  confirmLabel: {
    marginTop: 20,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E2D8',
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    color: '#351923',
  },

  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },

  roleButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E2D8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  roleButtonActive: {
    backgroundColor: '#E7EDD9',
    borderColor: '#A8B88A',
  },

  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0F0E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  roleIconActive: {
    backgroundColor: '#A8B88A',
  },

  roleIconText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#351923',
  },

  roleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8A8F7B',
    marginBottom: 4,
  },

  roleTextActive: {
    color: '#351923',
  },

  roleDescription: {
    fontSize: 10,
    color: '#8A8F7B',
    textAlign: 'center',
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FCEBEC',
    borderColor: '#E8C2C7',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },

  errorIcon: {
    color: '#A83245',
    fontWeight: '800',
    fontSize: 14,
  },

  error: {
    flex: 1,
    fontSize: 13,
    color: '#A83245',
    lineHeight: 19,
  },

  loaderContainer: {
    alignItems: 'center',
    marginVertical: 22,
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
    color: '#8A8F7B',
  },

  buttonContainer: {
    marginTop: 25,
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },

  loginText: {
    fontSize: 13,
    color: '#8A8F7B',
  },

  loginLink: {
    fontSize: 13,
    color: '#701F35',
    fontWeight: '800',
  },

  successContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E2D8',
  },

  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E7EDD9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  successIconText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#701F35',
  },

  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#351923',
    marginBottom: 10,
    textAlign: 'center',
  },

  successText: {
    fontSize: 14,
    color: '#8A8F7B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },

  successButton: {
    backgroundColor: '#701F35',
    color: '#FFFFFF',
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },

  footerText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#A4A594',
    textAlign: 'center',
    marginTop: 30,
  },
});