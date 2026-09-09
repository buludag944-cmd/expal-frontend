import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // App UI is English-only. Without this, WKWebView <input type="date"> pickers follow
        // the device language (e.g. Turkish month names on a TR locale phone).
        UserDefaults.standard.set(["en"], forKey: "AppleLanguages")

        // Firebase (reads GoogleService-Info.plist). Safe if Capacitor plugin also configures later.
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }

        // Do NOT set Messaging.messaging().delegate here — @capacitor-firebase/messaging owns it.
        // Stealing the delegate would break JS tokenReceived / notification listeners.

        requestNotificationAuthAndRegister(application)

        // Retry FCM token log after APNs/FCM have had time to settle.
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            self?.logFcmRegistrationToken(reason: "launch+2s")
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 6.0) { [weak self] in
            self?.logFcmRegistrationToken(reason: "launch+6s")
        }

        return true
    }

    /// Request alert/badge/sound if needed, then register for remote notifications.
    private func requestNotificationAuthAndRegister(_ application: UIApplication) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            switch settings.authorizationStatus {
            case .notDetermined:
                UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
                    if let error = error {
                        print("[push] authorization error: \(error.localizedDescription)")
                    }
                    print("[push] authorization granted=\(granted)")
                    guard granted else { return }
                    DispatchQueue.main.async {
                        application.registerForRemoteNotifications()
                    }
                    self.logFcmRegistrationToken(reason: "after-auth-grant")
                }
            case .authorized, .provisional, .ephemeral:
                print("[push] authorization status=authorized — registering for remote notifications")
                DispatchQueue.main.async {
                    application.registerForRemoteNotifications()
                }
                self.logFcmRegistrationToken(reason: "already-authorized")
            case .denied:
                print("[push] notification permission DENIED — enable in Settings → Notifications → EXPal")
            @unknown default:
                print("[push] unknown authorization status")
            }
        }
    }

    /// Prints the FCM registration token for Firebase Console → Cloud Messaging → "Send test message".
    /// Also stores it in UserDefaults so the JS Profile screen can show/copy it.
    private func logFcmRegistrationToken(reason: String) {
        Messaging.messaging().token { token, error in
            if let error = error {
                print("[push] FCM token error (\(reason)): \(error.localizedDescription)")
                return
            }
            guard let token = token, !token.isEmpty else {
                print("[push] FCM token empty (\(reason)) — APNs token may not be ready yet")
                return
            }
            UserDefaults.standard.set(token, forKey: "expal_debug_fcm_token")
            // Single-line marker so you can filter Xcode / device console easily:
            print("[PUSH_FCM_TOKEN] \(token)")
            print("[push] FCM token ready (\(reason)), length=\(token.count)")
        }
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Ensure FCM has the APNs token before getToken() — required for lock-screen delivery.
        Messaging.messaging().apnsToken = deviceToken
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
        let hex = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("[push] APNs device token registered (\(hex.prefix(24))… length=\(deviceToken.count))")
        logFcmRegistrationToken(reason: "after-apns-register")
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
        print("[push] APNs registration FAILED: \(error.localizedDescription)")
        print("[push] APNs failure detail: \(error)")
    }

    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        print("[push] didReceiveRemoteNotification keys=\(Array(userInfo.keys))")
        NotificationCenter.default.post(name: Notification.Name("didReceiveRemoteNotification"), object: completionHandler, userInfo: userInfo)
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            if settings.authorizationStatus == .authorized
                || settings.authorizationStatus == .provisional
                || settings.authorizationStatus == .ephemeral {
                DispatchQueue.main.async {
                    application.registerForRemoteNotifications()
                }
            }
        }
        logFcmRegistrationToken(reason: "become-active")
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
