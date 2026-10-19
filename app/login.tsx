
import { Link } from 'expo-router';
import { useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { signIn } from '@/lib/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    console.log('==========================');
    console.log('LOGIN BUTTON PRESSED');
    console.log('EMAIL:', email);

    setError('');

    // VALIDATION
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);

      // SUPABASE LOGIN
      const result = await signIn(
        email.trim(),
        password
      );

      console.log('SIGN IN RESULT:', result);

      if (result.error) {
        console.log(
          'LOGIN FAILED:',
          result.error.message
        );

        setError(result.error.message);
        return;
      }

      const loggedInUser = result.data?.user;
      const session = result.data?.session;

      if (!loggedInUser) {
        setError(
          'Login succeeded, but no user was returned.'
        );
        return;
      }

      if (!session) {
        setError(
          'Login succeeded, but no session was created.'
        );
        return;
      }

      console.log('LOGIN SUCCESS');
      console.log('USER:', loggedInUser.email);
      console.log('SESSION EXISTS:', !!session);

      // app/_layout.tsx handles authenticated
      // user detection and role-based navigation.
    } catch (error: any) {
      console.log(
        'LOGIN SCREEN ERROR:',
        error?.message
      );

      setError(
        error?.message ??
          'Something went wrong while logging in.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* BACKGROUND DECORATIONS */}
          <View style={styles.backgroundCircleOne} />
          <View style={styles.backgroundCircleTwo} />

          {/* LOGIN CARD */}
          <View style={styles.card}>
            {/* BRAND LOGO */}
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoIconText}>
                  QR
                </Text>
              </View>

              <Text style={styles.logo}>
                QR-ATT
              </Text>

              <View style={styles.logoAccent} />
            </View>

            {/* HEADER */}
            <Text style={styles.title}>
              Welcome Back
            </Text>

            <Text style={styles.subtitle}>
              Login to your account
            </Text>

            <View style={styles.welcomeBadge}>
              <View style={styles.welcomeDot} />

              <Text style={styles.welcomeBadgeText}>
                STUDENT ATTENDANCE PORTAL
              </Text>
            </View>

            {/* LOGIN FORM */}
            <View style={styles.form}>
              {/* EMAIL */}
              <Text style={styles.label}>
                Email Address
              </Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconBox}>
                  <Text style={styles.inputIcon}>
                    @
                  </Text>
                </View>

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#99978E"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!loading}
                  style={styles.input}
                  returnKeyType="next"
                />
              </View>

              {/* PASSWORD */}
              <Text style={styles.label}>
                Password
              </Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconBox}>
                  <Text style={styles.inputIcon}>
                    *
                  </Text>
                </View>

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#99978E"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  style={styles.input}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
              </View>

              {/* ERROR MESSAGE */}
              {error ? (
                <View style={styles.errorBox}>
                  <View style={styles.errorIcon}>
                    <Text style={styles.errorIconText}>
                      !
                    </Text>
                  </View>

                  <Text style={styles.errorText}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* LOGIN BUTTON */}
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.buttonPressed,
                  loading && styles.buttonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.loginButtonContent}>
                    <Text style={styles.loginButtonText}>
                      LOGIN
                    </Text>

                    <Text style={styles.loginButtonArrow}>
                      →
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* REGISTER LINK */}
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>
                  Don't have an account?
                </Text>

                <Link href="/register" asChild>
                  <Pressable
                    disabled={loading}
                    style={styles.registerPressable}
                  >
                    <Text style={styles.registerLink}>
                      Register
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            {/* CARD FOOTER */}
            <View style={styles.cardFooter}>
              <View style={styles.footerLine} />

              <View style={styles.footerSecurity}>
                <Text style={styles.footerCheck}>
                  ✓
                </Text>

                <Text style={styles.footerText}>
                  Secure School Attendance System
                </Text>
              </View>
            </View>
          </View>

          {/* PAGE FOOTER */}
          <View style={styles.pageFooter}>
            <Text style={styles.pageFooterTitle}>
              QR Attendance
            </Text>

            <Text style={styles.pageFooterSubtitle}>
              Simple • Fast • Secure
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// BURGUNDY AND MATCHA GREEN THEME
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7F2',
  },

  keyboard: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 35,
    overflow: 'hidden',
  },

  // BACKGROUND DECORATIONS
  backgroundCircleOne: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#E7EDD9',
    top: -100,
    right: -120,
  },

  backgroundCircleTwo: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#F1E2E6',
    bottom: -70,
    left: -110,
  },

  // LOGIN CARD
  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E9E5DC',
    shadowColor: '#4C2531',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 6,
  },

  // BRAND LOGO
  logoContainer: {
    alignItems: 'center',
    marginBottom: 22,
  },

  logoIcon: {
    width: 68,
    height: 68,
    borderRadius: 23,
    backgroundColor: '#701F35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#701F35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },

  logoIconText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 1,
  },

  logo: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '900',
    color: '#701F35',
    letterSpacing: 1.5,
  },

  logoAccent: {
    width: 45,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#A8B88A',
    marginTop: 10,
  },

  // HEADER
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    color: '#351923',
  },

  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#858578',
    marginTop: 7,
    marginBottom: 20,
  },

  welcomeBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7EDD9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },

  welcomeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#617B4B',
    marginRight: 7,
  },

  welcomeBadgeText: {
    color: '#425632',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  // FORM
  form: {
    width: '100%',
  },

  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4C2531',
    marginBottom: 9,
    marginTop: 14,
  },

  // INPUT FIELDS
  inputContainer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E2D7',
    borderRadius: 13,
    paddingHorizontal: 10,
    backgroundColor: '#FBFBF8',
  },

  inputIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1E2E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  inputIcon: {
    color: '#701F35',
    fontSize: 17,
    fontWeight: '900',
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: 52,
    paddingHorizontal: 4,
    fontSize: 14,
    color: '#351923',
    backgroundColor: 'transparent',
  },

  // ERROR MESSAGE
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCEBEC',
    borderWidth: 1,
    borderColor: '#F0C9D0',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },

  errorIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#701F35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  errorIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  errorText: {
    flex: 1,
    color: '#8A263F',
    fontSize: 12,
    lineHeight: 18,
  },

  // LOGIN BUTTON
  loginButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#701F35',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: 18,
    shadowColor: '#701F35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 4,
  },

  loginButtonContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  loginButtonArrow: {
    color: '#D5E2C2',
    fontSize: 21,
    fontWeight: '900',
    marginLeft: 12,
  },

  // REGISTER LINK
  registerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  registerText: {
    color: '#858578',
    fontSize: 13,
  },

  registerPressable: {
    paddingVertical: 5,
    paddingLeft: 5,
  },

  registerLink: {
    color: '#701F35',
    fontSize: 13,
    fontWeight: '900',
  },

  // CARD FOOTER
  cardFooter: {
    alignItems: 'center',
    marginTop: 25,
  },

  footerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#E9E5DC',
    marginBottom: 17,
  },

  footerSecurity: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  footerCheck: {
    color: '#617B4B',
    fontSize: 15,
    fontWeight: '900',
    marginRight: 7,
  },

  footerText: {
    color: '#858578',
    fontSize: 11,
  },

  // PAGE FOOTER
  pageFooter: {
    alignItems: 'center',
    marginTop: 24,
  },

  pageFooterTitle: {
    color: '#701F35',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  pageFooterSubtitle: {
    color: '#858578',
    fontSize: 11,
    marginTop: 5,
    letterSpacing: 0.5,
  },
});
