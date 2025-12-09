package com.blife.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocalNotificationsPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
