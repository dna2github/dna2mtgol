#!/system/bin/sh

base=/system
export CLASSPATH=$base/framework/media_cmd.jar
exec app_process $base/bin com.android.commands.media.Media "$@"
