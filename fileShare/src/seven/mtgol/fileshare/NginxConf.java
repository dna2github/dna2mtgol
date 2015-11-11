package seven.mtgol.fileshare;

import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.FileOutputStream;

public class NginxConf {

    public static boolean prepareNginxDirectory(String workdir, String subdir) {
        try {
            File dir = new File(String.format("%s%s", workdir, subdir));
            if (!dir.exists()) {
                return dir.mkdirs();
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean prepareNginxDirectories(String workdir) {
        prepareNginxDirectory(workdir, "/nginx");
        prepareNginxDirectory(workdir, "/nginx/sbin");
        prepareNginxDirectory(workdir, "/nginx/conf");
        prepareNginxDirectory(workdir, "/nginx/html");
        prepareNginxDirectory(workdir, "/nginx/logs");
        prepareNginxDirectory(workdir, "/nginx/client_body_temp");
        prepareNginxDirectory(workdir, "/nginx/proxy_temp");
        prepareNginxDirectory(workdir, "/nginx/fastcgi_temp");
        prepareNginxDirectory(workdir, "/nginx/uwsgi_temp");
        prepareNginxDirectory(workdir, "/nginx/scgi_temp");
        return true;
    }

    public static boolean prepareNginx(String workdir, InputStream nginx_binary) {
        try {
            String nginx_filename = String.format("%s/nginx/sbin/nginx", workdir);
            File nginx_file = new File(nginx_filename);
            if (nginx_file.exists()) {
                return true;
            }
            nginx_file.createNewFile();
            InputStreamReader reader = new InputStreamReader(nginx_binary);
            FileOutputStream writer = new FileOutputStream(nginx_file);
            byte[] binary = new byte[(int)(nginx_binary.available())];
            nginx_binary.read(binary);
            writer.write(binary);
            writer.flush();
            writer.close();
            nginx_file.setExecutable(true, true);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean generateNginxConf(String workdir, String filedir) {
        try {
            String conf_filename = String.format("%s/nginx/conf/nginx.conf", workdir);
            File conf_file = new File(conf_filename);
            if (conf_file.exists()) {
                conf_file.delete();
            }
            conf_file.createNewFile();
            NginxConf conf = new NginxConf();
            if (filedir.charAt(filedir.length() - 1) != '/') {
                filedir += "/";
            }
            conf.server.location_alias = filedir;
            String contents = conf.toString();
            FileOutputStream writer = new FileOutputStream(conf_file);
            writer.write(contents.getBytes());
            writer.flush();
            writer.close();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public NginxConf loadCustomizedConf(String filename) {
        return null;
    }

    // worker_processes 1;
    public int worker_processes = 1;
    // error_log /dev/null;
    public String error_log = "/dev/null";
    // events { worker_connections 1024; }
    public int worker_connections = 1024;

    // http { ... }
    // types { text/html html htm shtml; text/css css; ... }
    public String[] types = new String[] {
        "text/html html htm;",
        "text/plain txt;",
        "text/css css;",
        "application/javascript js;",
        "image/jpeg jpg jpeg;",
        "image/gif gif;",
        "image/png png;",
        "image/x-ms-bmp bmp;",
        "image/svg+xml svg svgz;",
        "application/json json;",
        "text/xml xml;",
        "application/pdf pdf;",
        "application/x-shockwave-flash swf;",
        "audio/midi mid midi kar;",
        "audio/mpeg mp3;",
        "audio/ogg ogg;",
        "video/3gpp 3gp 3gpp;",
        "video/mp4 mp4;",
        "video/x-flv flv;"
    };
    // default_type
    public String default_type = "application/octet-stream";
    // access_log /dev/null;
    public String access_log = "/dev/null";
    // sendfile on;
    public boolean sendfile = true;
    // keepalive_timeout 0;
    public int keepalive_timeout = 65;

    // server { ... }
    public ServerConf server = new ServerConf();

    private String mimeTypes() {
        String mime_types = "types {\n";
        for (String type : types) {
            mime_types += type + "\n";
        }
        mime_types += "}\n";
        return mime_types;
    }

    public String toString() {
        return String.format(
            "worker_processes %d;\nerror_log %s;\n" +
            "events {\nworker_connections %d;\n}\n" +
            "http {\n%s\ndefault_type %s;\naccess_log %s;\n" +
                    "sendfile %s;\nkeepalive_timeout %d;\n%s\n}",
            worker_processes, error_log, worker_connections,
            mimeTypes(), default_type,
            access_log, sendfile?"on":"off", keepalive_timeout,
            server.toString()
        );
    }

    private class ServerConf {
        // listen 9090;
        public int listen = 9090;
        // server_name localhost;
        public String server_name = "localhost";
        // access_log /dev/null;
        public String access_log = "/dev/null";
        // location / { ... }
        // autoindex on;
        public boolean location_autoindex = true;
        // alias directory_path;
        public String location_alias = "/";

        public String toString() {
            return String.format(
                "server {\nlisten 0.0.0.0:%d;\nserver_name %s;\naccess_log %s;\n" +
                "location / {\nautoindex %s;\nalias %s;\n}\n}\n",
                listen, server_name, access_log,
                location_autoindex?"on":"off", location_alias
            );
        }
    }
}
