import sys
import time
import subprocess


t = int(sys.argv[1])

if t > 0:
  time.sleep(t)

try:
  subprocess.check_output('sh /data/toolchain/tmp/media.sh dispatch play', shell=True)
  time.sleep(5)
  subprocess.check_output('sh /data/toolchain/tmp/media.sh dispatch stop', shell=True)
except:
  pass
