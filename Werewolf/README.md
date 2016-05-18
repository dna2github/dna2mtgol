```python
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8080
```

http://127.0.0.1:8080/static/host.html for host control
http://127.0.0.1:8080/ for player

-----

Prepare Media Player: create a new playlist and add wolf sound.

The content of `/data/toolchain/tmp/media.sh`

```sh
# script to start "media_cmd" on the device, which has a very rudimentary
# shell.
#
base=/system
export CLASSPATH=$base/framework/media_cmd.jar
exec app_process $base/bin com.android.commands.media.Media "$@"
```
