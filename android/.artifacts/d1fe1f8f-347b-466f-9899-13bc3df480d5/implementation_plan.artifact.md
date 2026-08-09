# Fix ADB Timeout Exception during app installation

The user is encountering a `com.android.ddmlib.TimeoutException` when running `./gradlew :app:installDebug`. This error occurs when the Android Debug Bridge (ADB) takes too long to communicate with the device or emulator, typically during the APK installation phase. This is common with large APKs or slow connections/devices.

## Proposed Changes

### Gradle Configuration

I will increase the ADB timeout setting in the project's `gradle.properties` file. This tells the Android Gradle Plugin to wait longer for ADB commands to complete.

#### [MODIFY] [gradle.properties](file:///C:/Users/jpadi/Downloads/Atmos/artifacts/weather-app/android/gradle.properties)
- Add `android.adb.timeout=60000` (60 seconds) to increase the default timeout.

## Verification Plan

### Automated Tests
- Run `./gradlew :app:assembleDebug` to ensure the project still builds correctly after the configuration change.

### Manual Verification
- The user should run `./gradlew :app:installDebug` again to verify that the installation no longer times out.
- If the issue persists, we may need to increase the timeout further (e.g., to `120000` for 2 minutes) or check the device connection.
