import os
import sys
import time
import subprocess

BASE_DIR = os.path.dirname(__file__)
MEDIASH = os.path.join(BASE_DIR, 'media.sh')

t = int(sys.argv[1])

if t > 0:
  time.sleep(t)

try:
  subprocess.check_output('sh %s dispatch play' % MEDIASH, shell=True)
  time.sleep(5)
  subprocess.check_output('sh %s dispatch stop' % MEDIASH, shell=True)
except:
  pass
