# Android releases: set this up once

GitHub can build the Android app and put it in **Play internal testing**. It does not publish to the public store. You install the test build, try it, then tap promote yourself.

Add each secret in GitHub: open the `expal-frontend` repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Paste the value there. Do not paste secrets into chat, email, or a pull request.

## 1. The upload key you already use

This is the keystore file from the computer where you upload the app in Android Studio. It is not the key Google uses for people who install from Play.

Create these four secrets:

| Secret | What to paste |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | The keystore file, turned into one long line of text |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password |
| `ANDROID_KEY_ALIAS` | The name of the key inside the file |
| `ANDROID_KEY_PASSWORD` | The key password (often the same as the keystore password) |

On the computer that has the file, find the `.keystore` or `.jks` you already use. In Terminal on a Mac:

```bash
base64 -i /path/to/your-upload.keystore | pbcopy
```

That copies the long line. Paste it into `ANDROID_KEYSTORE_BASE64`.

If you cannot find the file: Play Console → your app → **Test and release** → **App integrity** → **Request upload key reset**. Follow Google’s steps. Do not invent a new keystore and upload it without that reset. Play will reject it.

## 2. Firebase’s Android file

1. Open [Firebase](https://console.firebase.google.com/) → project **expalapp-a6422**.
2. Project settings → Your apps → Android `com.yourbrand.expal`.
3. Download `google-services.json`.
4. Open it, select all of the text, and paste it into the secret `GOOGLE_SERVICES_JSON`.
5. Delete the downloaded file from your phone or computer when you are done. Do not commit it.

## 3. A free Play upload account

1. Open [Google Cloud](https://console.cloud.google.com/) → **IAM & Admin** → **Service accounts** → **Create service account**. Name it `expal-play-upload`. You do not need to give it Cloud roles.
2. Open that account → **Keys** → **Add key** → **JSON**. A file downloads.
3. Play Console → **Users and permissions** → **Invite new users**. Paste the service account email (it ends in `iam.gserviceaccount.com`).
4. Under app permissions, choose only EXPal (`com.yourbrand.expal`).
5. Turn on permission to **release to testing tracks**. Leave **release to production** off.
6. Open the downloaded JSON, select all, and paste it into `PLAY_SERVICE_ACCOUNT_JSON`. Then delete the file.

This account is free. It can only upload test builds.

## 4. Copy the Play signing SHA-256 while you are there

On the same **App integrity** page, find **App signing key certificate** (not the upload key certificate). Copy the **SHA-256**. It is a long line of letters and numbers with colons.

Paste that line as a comment on the Android workflow pull request. It is not a secret. A follow-up change will put it in `public/.well-known/assetlinks.json` so Android links open the app. The fingerprint in the app today stays as it is until you paste this one. Do not guess it.

Also copy the **SHA-1** on that same certificate into Firebase → Android app → fingerprints, then download `google-services.json` again and update the secret in step 2. Google sign-in on Play installs needs that SHA-1.

## 5. Try one internal build

After the secrets are saved: GitHub → **Actions** → **Android Play internal** → **Run workflow**.

Then Play Console → **Test and release** → **Internal testing**. A new build should appear. Do not tap **Promote to production**.

## What this costs

GitHub’s free plan includes 2,000 minutes a month on a private repo. An Android build uses a normal Linux machine, about one billed minute per minute it runs.

The iPhone build uses a Mac. GitHub counts Mac minutes at about 10 times the clock time. A 30-minute iPhone build is about 300 billed minutes. The iPhone job stops after 60 minutes, so one release is at most about 600 billed minutes. The plan builds phones every two weeks, not on every code change, so two releases a month stay inside the free allowance. An iPhone build starts only from an `ios-*` tag (the release train), not when ordinary code is pushed. You can see usage under GitHub → **Settings** → **Billing and plans**.
