package com.yourbrand.expal;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.LocaleList;

import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.os.LocaleListCompat;

import com.getcapacitor.BridgeActivity;

import java.util.Locale;

/**
 * Force English for system UI inside the app (incl. WebView date/time pickers),
 * even when the device language is Turkish or another locale.
 */
public class MainActivity extends BridgeActivity {
    @Override
    protected void attachBaseContext(Context newBase) {
        super.attachBaseContext(withEnglishLocale(newBase));
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags("en"));
        applyEnglishLocaleDefaults();
        super.onCreate(savedInstanceState);
    }

    private static Context withEnglishLocale(Context context) {
        Locale locale = Locale.ENGLISH;
        Locale.setDefault(locale);
        Configuration config = new Configuration(context.getResources().getConfiguration());
        config.setLocales(new LocaleList(locale));
        return context.createConfigurationContext(config);
    }

    private static void applyEnglishLocaleDefaults() {
        Locale.setDefault(Locale.ENGLISH);
    }
}
