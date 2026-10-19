
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import { parseQRPayload } from '@/lib/qr';
import { registerAttendance } from '@/lib/attendance';

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

export default function ScanScreen() {
  const [permission, requestPermission] =
    useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] =
    useState<'success' | 'error' | ''>('');

  // RESET WHEN THE SCREEN GETS FOCUS
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setProcessing(false);
      setMessage('');
      setMessageType('');
    }, [])
  );

  // PROCESS SCANNED QR CODE
  const handleBarcodeScanned = async ({
    data,
  }: {
    data: string;
  }) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);
    setMessage('');
    setMessageType('');

    try {
      const payload = parseQRPayload(data);

      if (!payload) {
        setMessage('This QR code is not valid.');
        setMessageType('error');
        return;
      }

      const { error } = await registerAttendance(payload.event);

      if (error) {
        setMessage(error.message);
        setMessageType('error');
        return;
      }

      setMessage('Attendance recorded successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
      setMessageType('error');
    } finally {
      setProcessing(false);
    }
  };

  // SCAN AGAIN
  const scanAgain = () => {
    setScanned(false);
    setProcessing(false);
    setMessage('');
    setMessageType('');
  };

  // CAMERA PERMISSION LOADING
  if (!permission) {
    return (
      <View style={styles.centerScreen}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />

        <View style={styles.permissionIcon}>
          <Text style={styles.permissionEmoji}>▦</Text>
        </View>

        <ActivityIndicator
          size="large"
          color={COLORS.burgundy}
        />

        <Text style={styles.permissionTitle}>
          Preparing Scanner
        </Text>

        <Text style={styles.permissionText}>
          Checking your camera permission...
        </Text>
      </View>
    );
  }

  // CAMERA PERMISSION REQUEST
  if (!permission.granted) {
    return (
      <View style={styles.centerScreen}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />

        <View style={styles.permissionIcon}>
          <Text style={styles.permissionEmoji}>▦</Text>
        </View>

        <View style={styles.permissionBadge}>
          <View style={styles.permissionDot} />
          <Text style={styles.permissionBadgeText}>
            CAMERA ACCESS
          </Text>
        </View>

        <Text style={styles.permissionTitle}>
          Your scanner awaits
        </Text>

        <Text style={styles.permissionText}>
          Allow camera access to scan school event QR
          codes and record your attendance.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestPermission}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            Allow Camera
          </Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
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
        contentContainerStyle={styles.scrollContent}
      >
        {/* LARGE BURGUNDY HEADER */}
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
                  <Text style={styles.brandName}>
                    QR ATTENDANCE
                  </Text>
                  <Text style={styles.brandCaption}>
                    STUDENT PORTAL
                  </Text>
                </View>
              </View>

              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            </View>

            {/* HERO MESSAGE */}
            <View style={styles.welcomeSection}>
              <View style={styles.greetingBadge}>
                <View style={styles.greetingDot} />
                <Text style={styles.greetingBadgeText}>
                  QUICK CHECK-IN
                </Text>
              </View>

              <Text style={styles.heroTitle}>
                Scan Event
              </Text>

              <Text style={styles.heroTitleAccent}>
                QR Code.
              </Text>

              <Text style={styles.heroDescription}>
                One scan brings you closer to a complete
                attendance record. Let's get you checked in.
              </Text>
            </View>

            {/* DECORATIVE QR GRAPHIC */}
            <View style={styles.qrDecoration}>
              <View style={styles.qrDecorationTop}>
                <View style={styles.qrMiniDot} />
                <Text style={styles.qrDecorationLabel}>
                  READY TO SCAN
                </Text>
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

              <Text style={styles.qrDecorationFooter}>
                SCAN • CHECK IN
              </Text>
            </View>

            {/* HEADER BOTTOM */}
            <View style={styles.heroBottom}>
              <View style={styles.heroBottomIcon}>
                <Text style={styles.heroBottomIconText}>✓</Text>
              </View>

              <View style={styles.heroBottomText}>
                <Text style={styles.heroBottomTitle}>
                  Your attendance matters
                </Text>
                <Text style={styles.heroBottomSubtitle}>
                  Simple, fast, and secure.
                </Text>
              </View>

              <Text style={styles.heroBottomArrow}>↗</Text>
            </View>
          </View>
        </View>

        {/* MAIN CONTENT */}
        <View style={styles.content}>
          {/* SECTION INTRO */}
          <View style={styles.sectionIntro}>
            <View>
              <Text style={styles.eyebrow}>
                YOUR CHECK-IN
              </Text>

              <Text style={styles.sectionTitle}>
                Ready when you are
              </Text>
            </View>

            <View style={styles.sectionIcon}>
              <Text style={styles.sectionIconText}>✳</Text>
            </View>
          </View>

          {/* CAMERA STATUS */}
          <View style={styles.statusCard}>
            <View style={styles.statusIconBox}>
              <Text style={styles.statusIconText}>▦</Text>
            </View>

            <View style={styles.statusDetails}>
              <Text style={styles.statusLabel}>
                CAMERA STATUS
              </Text>

              <Text style={styles.statusTitle}>
                {processing
                  ? 'Verifying attendance'
                  : messageType === 'success'
                    ? 'Check-in complete'
                    : messageType === 'error'
                      ? 'Scan needs attention'
                      : 'Scanner is ready'}
              </Text>

              <Text style={styles.statusSubtitle}>
                {processing
                  ? 'Please wait while we verify your scan.'
                  : messageType === 'success'
                    ? 'Your attendance was submitted.'
                    : messageType === 'error'
                      ? 'Try scanning a valid event QR code.'
                      : 'Position the event code inside the frame.'}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                processing && styles.statusBadgeProcessing,
                messageType === 'success' &&
                  styles.statusBadgeSuccess,
                messageType === 'error' &&
                  styles.statusBadgeError,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  processing && styles.statusDotProcessing,
                  messageType === 'success' &&
                    styles.statusDotSuccess,
                  messageType === 'error' &&
                    styles.statusDotError,
                ]}
              />

              <Text
                style={[
                  styles.statusBadgeText,
                  processing && styles.statusBadgeTextProcessing,
                  messageType === 'success' &&
                    styles.statusBadgeTextSuccess,
                  messageType === 'error' &&
                    styles.statusBadgeTextError,
                ]}
              >
                {processing
                  ? 'BUSY'
                  : messageType === 'success'
                    ? 'DONE'
                    : messageType === 'error'
                      ? 'RETRY'
                      : 'READY'}
              </Text>
            </View>
          </View>

          {/* CAMERA CARD */}
          <View style={styles.cameraCard}>
            <View style={styles.cameraHeader}>
              <View style={styles.cameraHeading}>
                <View style={styles.cameraTitleMarker} />

                <View style={styles.cameraTitleContainer}>
                  <Text style={styles.cameraTitle}>
                    QR Scanner
                  </Text>

                  <Text style={styles.cameraSubtitle}>
                    Align the QR code within the corners
                  </Text>
                </View>
              </View>

              <View style={styles.cameraSmallIcon}>
                <Text style={styles.cameraEmoji}>▦</Text>
              </View>
            </View>

            {/* LIVE CAMERA */}
            <View style={styles.cameraViewport}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={
                  scanned ? undefined : handleBarcodeScanned
                }
              />

              {/* SCANNING FRAME */}
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {!scanned && !processing && (
                  <View style={styles.scanHint}>
                    <Text style={styles.scanHintText}>
                      Align QR code here
                    </Text>
                  </View>
                )}

                {processing && (
                  <View style={styles.resultOverlay}>
                    <View style={styles.processingCircle}>
                      <ActivityIndicator
                        size="large"
                        color={COLORS.white}
                      />
                    </View>

                    <Text style={styles.overlayTitle}>
                      Verifying attendance
                    </Text>

                    <Text style={styles.overlayText}>
                      Please wait a moment...
                    </Text>
                  </View>
                )}

                {messageType === 'success' && !processing && (
                  <View style={styles.resultOverlay}>
                    <View style={styles.successCircle}>
                      <Text style={styles.resultIcon}>✓</Text>
                    </View>

                    <Text style={styles.overlayTitle}>
                      You're checked in!
                    </Text>

                    <Text style={styles.overlayText}>
                      Scan successful
                    </Text>
                  </View>
                )}

                {messageType === 'error' && !processing && (
                  <View style={styles.resultOverlay}>
                    <View style={styles.errorCircle}>
                      <Text style={styles.resultIcon}>!</Text>
                    </View>

                    <Text style={styles.overlayTitle}>
                      Scan unsuccessful
                    </Text>

                    <Text style={styles.overlayText}>
                      Please try again
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* CAMERA FOOTER */}
            <View style={styles.cameraFooter}>
              <View style={styles.cameraFooterIcon}>
                <Text style={styles.cameraFooterIconText}>✓</Text>
              </View>

              <Text style={styles.cameraFooterText}>
                Keep your QR code clearly visible
              </Text>
            </View>
          </View>

          {/* PROCESSING MESSAGE */}
          {processing && (
            <View style={styles.messageCard}>
              <ActivityIndicator
                size="small"
                color={COLORS.burgundy}
              />

              <Text style={styles.messageText}>
                Checking and recording your attendance...
              </Text>
            </View>
          )}

          {/* RESULT MESSAGE */}
          {message !== '' && !processing && (
            <View
              style={[
                styles.messageCard,
                messageType === 'success'
                  ? styles.successMessageCard
                  : styles.errorMessageCard,
              ]}
            >
              <View
                style={[
                  styles.messageIcon,
                  messageType === 'success'
                    ? styles.successMessageIcon
                    : styles.errorMessageIcon,
                ]}
              >
                <Text style={styles.messageIconText}>
                  {messageType === 'success' ? '✓' : '!'}
                </Text>
              </View>

              <View style={styles.messageContent}>
                <Text
                  style={[
                    styles.messageTitle,
                    messageType === 'success'
                      ? styles.successText
                      : styles.errorText,
                  ]}
                >
                  {messageType === 'success'
                    ? 'Attendance Recorded'
                    : 'Unable to Record'}
                </Text>

                <Text style={styles.messageText}>
                  {message}
                </Text>
              </View>
            </View>
          )}

          {/* SCAN AGAIN */}
          {scanned && !processing && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={scanAgain}
              activeOpacity={0.85}
            >
              <Text style={styles.refreshIcon}>↻</Text>

              <Text style={styles.primaryButtonText}>
                Scan Again
              </Text>

              <Text style={styles.buttonArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* SCANNING TIPS */}
          {!message && !processing && (
            <View style={styles.tipsCard}>
              <View style={styles.tipsIcon}>
                <Text style={styles.tipsIconText}>✳</Text>
              </View>

              <View style={styles.tipsContent}>
                <Text style={styles.tipsTitle}>
                  Scanning Tips
                </Text>

                <Text style={styles.tipsText}>
                  Keep your camera steady, ensure good
                  lighting, and fit the entire QR code
                  inside the scanning frame.
                </Text>
              </View>
            </View>
          )}

          {/* SECURITY CARD */}
          <View style={styles.securityCard}>
            <View style={styles.securityIconBox}>
              <Text style={styles.securityIcon}>✓</Text>
            </View>

            <View style={styles.securityDetails}>
              <Text style={styles.securityTitle}>
                Secure check-in
              </Text>

              <Text style={styles.securityDescription}>
                Your attendance is processed through
                the attendance system.
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
                <Text style={styles.footerTitle}>
                  QR Attendance
                </Text>

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
    </View>
  );
}

// BURGUNDY AND MATCHA GREEN SCANNER STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // PERMISSION SCREENS
  centerScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 25,
    backgroundColor: COLORS.matchaLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionEmoji: {
    color: COLORS.burgundy,
    fontSize: 38,
    fontWeight: '900',
  },
  permissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.burgundyLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 5,
  },
  permissionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.burgundy,
    marginRight: 7,
  },
  permissionBadgeText: {
    color: COLORS.burgundy,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  permissionTitle: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 20,
  },
  permissionText: {
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
    maxWidth: 300,
  },

  // HERO HEADER
  hero: {
    backgroundColor: COLORS.burgundy,
    minHeight: 465,
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
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: 'rgba(255,255,255,0.045)',
    right: -120,
    top: 60,
  },
  heroCircleSmall: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(168,184,138,0.13)',
    right: -60,
    top: 145,
  },
  heroOutlineCircle: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: 'rgba(231,237,217,0.20)',
    right: 20,
    top: 185,
  },

  // BRAND
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
    letterSpacing: 1,
  },
  brandCaption: {
    color: '#DCC5CB',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231,237,217,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(231,237,217,0.20)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.matcha,
    marginRight: 6,
  },
  liveBadgeText: {
    color: COLORS.matchaLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  // HERO TEXT
  welcomeSection: {
    marginTop: 32,
    maxWidth: 300,
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
  heroTitle: {
    color: COLORS.white,
    fontSize: 33,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroTitleAccent: {
    color: '#D5E2C2',
    fontSize: 33,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroDescription: {
    color: '#F0E7E9',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 260,
  },

  // DECORATIVE QR GRAPHIC
  qrDecoration: {
    position: 'absolute',
    right: 20,
    top: 180,
    width: 110,
    minHeight: 140,
    borderRadius: 21,
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

  // HERO BOTTOM
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  heroBottomIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: COLORS.matcha,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 19,
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

  // STATUS CARD
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    marginBottom: 19,
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
    fontSize: 24,
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
    lineHeight: 14,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.matchaLight,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginLeft: 5,
  },
  statusBadgeProcessing: {
    backgroundColor: '#F4E8CB',
  },
  statusBadgeSuccess: {
    backgroundColor: COLORS.matchaLight,
  },
  statusBadgeError: {
    backgroundColor: COLORS.burgundyLight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.matchaDark,
    marginRight: 5,
  },
  statusDotProcessing: {
    backgroundColor: '#9A6C20',
  },
  statusDotSuccess: {
    backgroundColor: COLORS.matchaDark,
  },
  statusDotError: {
    backgroundColor: COLORS.burgundy,
  },
  statusBadgeText: {
    color: COLORS.matchaDark,
    fontSize: 8,
    fontWeight: '900',
  },
  statusBadgeTextProcessing: {
    color: '#805615',
  },
  statusBadgeTextSuccess: {
    color: COLORS.matchaDark,
  },
  statusBadgeTextError: {
    color: COLORS.burgundy,
  },

  // CAMERA CARD
  cameraCard: {
    backgroundColor: COLORS.white,
    borderRadius: 23,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
    elevation: 2,
    shadowColor: COLORS.burgundyDark,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cameraHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cameraTitleMarker: {
    width: 5,
    height: 40,
    borderRadius: 4,
    backgroundColor: COLORS.burgundy,
    marginRight: 11,
  },
  cameraTitleContainer: {
    flex: 1,
  },
  cameraTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },
  cameraSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  cameraSmallIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.matchaLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cameraEmoji: {
    color: COLORS.burgundy,
    fontSize: 26,
    fontWeight: '900',
  },
  cameraViewport: {
    height: 310,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#242522',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // SCAN FRAME
  scanFrame: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderColor: COLORS.matcha,
    borderWidth: 4,
  },
  topLeft: {
    top: 16,
    left: 16,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 16,
    right: 16,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanHint: {
    backgroundColor: 'rgba(76,23,41,0.88)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231,237,217,0.25)',
  },
  scanHintText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },

  // CAMERA RESULT OVERLAY
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(53,25,35,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  processingCircle: {
    width: 67,
    height: 67,
    borderRadius: 23,
    backgroundColor: COLORS.burgundy,
    borderWidth: 1,
    borderColor: 'rgba(231,237,217,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCircle: {
    width: 67,
    height: 67,
    borderRadius: 23,
    backgroundColor: COLORS.matchaDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCircle: {
    width: 67,
    height: 67,
    borderRadius: 23,
    backgroundColor: '#8B263D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultIcon: {
    color: COLORS.white,
    fontSize: 38,
    fontWeight: '900',
  },
  overlayTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 15,
    textAlign: 'center',
  },
  overlayText: {
    color: '#E8DDE0',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },

  // CAMERA FOOTER
  cameraFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  cameraFooterIcon: {
    width: 21,
    height: 21,
    borderRadius: 7,
    backgroundColor: COLORS.matchaLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cameraFooterIconText: {
    color: COLORS.matchaDark,
    fontSize: 12,
    fontWeight: '900',
  },
  cameraFooterText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },

  // RESULT MESSAGES
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginBottom: 16,
  },
  successMessageCard: {
    backgroundColor: COLORS.matchaLight,
    borderColor: '#D0DDBD',
  },
  errorMessageCard: {
    backgroundColor: COLORS.burgundyLight,
    borderColor: '#E8C9D1',
  },
  messageIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successMessageIcon: {
    backgroundColor: COLORS.matchaDark,
  },
  errorMessageIcon: {
    backgroundColor: COLORS.burgundy,
  },
  messageIconText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  messageText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
  },
  successText: {
    color: COLORS.matchaDark,
  },
  errorText: {
    color: COLORS.burgundy,
  },

  // BUTTONS
  primaryButton: {
    backgroundColor: COLORS.burgundy,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 18,
    elevation: 3,
    shadowColor: COLORS.burgundy,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
  buttonArrow: {
    color: COLORS.matchaLight,
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 12,
  },
  refreshIcon: {
    color: COLORS.matchaLight,
    fontSize: 22,
    fontWeight: '900',
    marginRight: 9,
  },

  // SCANNING TIPS
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 1,
    marginBottom: 18,
  },
  tipsIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.matchaLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsIconText: {
    color: COLORS.matchaDark,
    fontSize: 23,
    fontWeight: '900',
  },
  tipsContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipsTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
  },
  tipsText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
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
    marginBottom: 27,
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
