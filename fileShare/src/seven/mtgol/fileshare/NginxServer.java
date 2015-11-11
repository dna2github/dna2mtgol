package seven.mtgol.fileshare;

import java.io.File;

import java.io.InputStream;
import android.util.Log;

public class NginxServer {

    private static NginxServer nginxInstance = null;

    public static NginxServer server(String workdir) {
        if (nginxInstance == null) {
            nginxInstance = new NginxServer(workdir);
        }
        return nginxInstance;
    }

    private String workdir;
    private String filedir;

    private NginxServer(String workdir) {
        this.workdir = workdir;
        this.filedir = null;
    }

    public String getWorkDir() {
        return this.workdir;
    }

    public String getFileDir() {
        return this.filedir;
    }

    private int service(String signal) {
        try {
            String dir = String.format("%s/nginx", this.workdir);
            Log.v("NginxServer::service", dir);
            String cmd;
            if (signal == null) {
                cmd = String.format("%s/sbin/nginx -p %s", dir, dir);
            } else {
                cmd = String.format("%s/sbin/nginx -p %s -s %s", dir, dir, signal);
            }
            Log.v("NginxServer::service", cmd);
            Process p;
            p = Runtime.getRuntime().exec(cmd);
            p.waitFor();
            Log.v("NginxServer::service", String.format("running (%d) ...", p.exitValue()) );
            return 0;
        } catch (Exception e) {
            Log.e("NginxServer::service", Log.getStackTraceString(e));
            return 1;
        }
    }

    public int start(String filedir) {
        File pid_file = new File(String.format("%s/nginx/logs/nginx.pid", this.workdir));
        if (pid_file.exists()) {
            // nginx is running
            if (filedir == null) {
                this.filedir = "";
            }
        } else {
            this.filedir = null;
        }
        NginxConf.generateNginxConf(this.workdir, filedir);
        int result = 0;
        if (this.filedir == null) {
            result = this.service(null);
        } else {
            result = this.service("reload");
        }
        Log.v("NginxServer::start", "" + result);
        this.filedir = filedir;
        return result;
    }

    public int stop() {
        File pid_file = new File(String.format("%s/nginx/logs/nginx.pid", this.workdir));
        int result = 0;
        if (pid_file.exists()) {
            result = this.service("stop");
            pid_file.delete();
        }
        Log.v("NginxServer::stop", "" + result);
        return result;
    }
}
