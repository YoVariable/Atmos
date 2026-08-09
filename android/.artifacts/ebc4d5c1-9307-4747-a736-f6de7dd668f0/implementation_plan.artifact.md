# Fix com.android.ddmlib.TimeoutException during APK installation

The `com.android.ddmlib.TimeoutException` occurs during the `:app:installDebug` task when the Android Debug Bridge (ADB) takes too long to install the APK on the device or emulator. This is often caused by unstable ADB connections, slow device responses, or a short default timeout (typically 5 seconds).

## User Review Required

> [!IMPORTANT]
> The proposed fix increases the ADB installation timeout to 10 minutes (600 seconds) to accommodate slower devices or unstable connections. If the emulator is completely hung, you may still need to restart it manually.

## Proposed Changes

### [Component: Build Configuration]

I will increase the ADB timeout within the Android Gradle Plugin configuration to allow more time for deployment.

#### [MODIFY] [app/build.gradle](file:///C:/Users/jpadi/Downloads/Atmos/artifacts/weather-app/android/app/build.gradle)
- Add `experimentalProperties` to increase the APK installation timeout.

#### [MODIFY] [build.gradle](file:///C:/Users/jpadi/Downloads/Atmos/artifacts/weather-app/android/build.gradle)
- Add a script block to set the `DdmPreferences` timeout programmatically for the build process, ensuring the underlying `ddmlib` library waits longer.

### [Component: Environment & Tools]

I will provide steps to refresh the ADB connection and set environment variables for persistent stability across all projects.

## Verification Plan

### Automated Tests
- Run `./gradlew clean` to reset the build state.
- Run `./gradlew :app:installDebug` to verify the installation succeeds with the increased timeout.

### Manual Verification
- Run `adb reconnect` to ensure the device is responsive.
- Verify the app is successfully installed and launched on the emulator.
