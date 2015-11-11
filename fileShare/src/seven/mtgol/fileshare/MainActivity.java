package seven.mtgol.fileshare;

import java.io.InputStream;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.EditText;
import android.widget.Button;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.net.wifi.WifiInfo;

public class MainActivity extends Activity
{

    private NginxServer server;
    private EditText txtFileDir;
    private Button btnStart, btnStop;

    private String getIPAddress() {
        WifiManager wifiManager = (WifiManager) getSystemService(Context.WIFI_SERVICE);
        WifiInfo wifiInfo = wifiManager.getConnectionInfo();
        int ip = wifiInfo.getIpAddress();
        return String.format("%d.%d.%d.%d", ip & 0xff, (ip >> 8) & 0xff, (ip >> 16) & 0xff, (ip >> 24) & 0xff);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // setContentView(R.layout.main);
        server = NginxServer.server(
            this.getApplicationInfo().dataDir
        );
        if (server == null) {
            throw new RuntimeException("Cannot create Nginx server!");
        }
        LinearLayout view = new LinearLayout(this);
        view.setOrientation(LinearLayout.VERTICAL);
        TextView label = new TextView(this);
        label.setText("Directory:");
        view.addView(label);
        txtFileDir = new EditText(this);
        txtFileDir.setText("/sdcard");
        view.addView(txtFileDir);
        btnStart = new Button(this);
        btnStart.setText("Start Service");
        btnStart.setWidth(300);
        view.addView(btnStart);
        btnStop = new Button(this);
        btnStop.setText("Stop Service");
        btnStop.setWidth(300);
        view.addView(btnStop);

        label = new TextView(this);
        label.setText("Step 1: Connect to a Wifi hotspot");
        view.addView(label);
        label = new TextView(this);
        label.setText("Step 2: Type a directory path and start service");
        view.addView(label);
        label = new TextView(this);
        label.setText(String.format("Step 3: Open a browser and visit at http://%s:9090/", getIPAddress()));
        view.addView(label);

        btnStart.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                String workdir = server.getWorkDir();
                String filedir = txtFileDir.getText().toString();
                NginxConf.prepareNginxDirectories(workdir);
                try {
                    InputStream nginx = getResources().openRawResource(R.raw.nginx);
                    NginxConf.prepareNginx(workdir, nginx);
                    nginx.close();
                } catch (Exception e) {
                    return;
                }
                server.start(filedir);
            }
        });
        btnStop.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                server.stop();
            }
        });

        setContentView(view);
    }

    @Override
    public void onDestroy() {
        server.stop();
        super.onDestroy();
    }
}
