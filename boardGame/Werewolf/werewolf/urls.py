# -*- coding: UTF-8 -*-
from django.conf.urls import patterns, include, url

from django.contrib import admin
admin.autodiscover()

import os
import subprocess
import random
import json
from django.http import HttpResponse, HttpResponseRedirect, Http404

gconfig = {
  "roleName": {
    "O": "平民 Ordinary", "K": "狼人 Werewolf",
    "S": "预言家 Seer", "H": "猎人 Hunter",
    "W": "女巫 Witch", "C": "丘比特 Cupid",
    "F": "白痴 Foolish", "G": "守卫 Guard",
    "B": "熊 Bear", "E": "长老 Elder",
    "M": "吹笛者 FlutMusician", "L": "小女孩 LittleGirl",
    "T": "盗贼 Theif", "X": "大野狼 2ndKill Werewolf",
    "I": "种狼 Infect Werewolf", "P": "野孩子 Innocent Child",
    "J": "口吃的法官 Judge",
    "-": "旁观 Viewer"
  },
  "roles": ["O5", "K3", "S", "W", "H"],
  "gameStart": False,
  "ip2no": {},
  "players": {}, # ip: "role"
  "state": {
    "TnCy": False, # T=player, C=hide
    "kill": None,
    "kill2": None,
    "infect": None,
    "admire": None,
    "see": None,
    "poison": None,
    "save": None,
    "watch": None,
    "lover": [],
    "flut": [],
    "theif0": None,
    "theif": [],
  }
}

def play_snd(n):
  args = [
    '/system/bin/python',
    os.path.join(os.path.dirname(__file__), 'play.py'),
    str(n)
  ]
  print args
  try:
    subprocess.Popen(args)
  except:
    print 'pretent it played...'

def _simulate_op(sec1, sec2, base=0):
  n = random.randint(sec1, sec2) + base
  play_snd(n)

def startx(request):
  global gconfig
  t = False
  c = False
  for key in gconfig["players"].keys():
    if gconfig["players"][key] == 'T': t = True
    elif gconfig["players"][key] == 'C': c = True
  if not t and 'T' in gconfig["roles"]:
    _simulate_op(10, 20)
  else:
    t = 0
  if not c and 'C' in gconfig["roles"]:
    if t == 0 and 'T' in gconfig["roles"]:
      gconfig["state"]["TnCy"] = True
    else:
      gconfig["state"]["TnCy"] = False
      _simulate_op(10, 20, t)
  print t, c
  return JsonResponse({})

def lookup(no):
  global gconfig
  if no is None: return None
  ip = None
  for key in gconfig["ip2no"]:
    if gconfig["ip2no"][key] == no:
      ip = key
      break
  if ip is None:
    return '-'
  return gconfig["players"][ip]

def starty(request):
  global gconfig
  k = []
  d = None
  h = True
  p = False
  state = gconfig["state"]
  if state["kill"] is not None and state["kill"] != '_x_':
    if state["infect"] != state["kill"] and state["save"] != state["kill"] and state["watch"] != state["kill"]:
      k.append(state["kill"])
    if state["kill"] in state["lover"]:
      if state["lover"][0] == state["kill"]:
        d = state["lover"][1]
      else:
        d = state["lover"][0]
      k.append(d)
      if lookup(d) == 'H': h = False
  if state["kill2"] is not None and state["kill2"] != '_x_':
    if state["infect"] != state["kill2"] and state["save"] != state["kill2"] and state["watch"] != state["kill2"]:
      k.append(state["kill"])
    if state["kill2"] in state["lover"]:
      if state["lover"][0] == state["kill2"]:
        d = state["lover"][1]
      else:
        d = state["lover"][0]
      k.append(d)
      if lookup(d) == 'H': h = False
  if state["poison"] is not None and state["poison"] != '_x_':
    k.append(state["poison"])
    if lookup(state["poison"]) == 'H': h = False
  if state["watch"] is not None and state["watch"] != '_x_' and state["watch"] == state["save"]:
    k.append(state["watch"])
    if lookup(state["watch"]) == 'H': h = False
  k = list(set(k))
  if state["admire"] in k:
    p = True
  gconfig["state"]["hunter_can_fire"] = h
  gconfig["state"]["child_become_wolf"] = p
  gconfig["state"]["dead"] = k
  return JsonResponse({
    "dead": k
  })

def act(request):
  global gconfig
  role = request.GET.get("role")
  if role == 'T':
    if gconfig["state"]["theif0"] is None:
      i = 0
      gconfig["state"]["theif"] = request.GET.get("t").split(',')
      for key in gconfig["players"].keys():
        if (gconfig["players"][key] == role):
          gconfig["players"][key] = request.GET.get("data")
          gconfig["state"]["theif0"] = gconfig["ip2no"][key]
          break
      play_snd(0)
      if gconfig["state"]["TnCy"] and request.GET.get("data") != 'C':
        _simulate_op(10, 20)
  elif role == 'C':
    if len(gconfig["state"]["lover"]) == 0:
      gconfig["state"]["lover"] = [request.GET.get("l1"), request.GET.get("l2")]
      play_snd(0)
  elif role == 'M':
    if len(gconfig["state"]["flut"]) == 0:
      gconfig["state"]["flut"] = [request.GET.get("m1"), request.GET.get("m2")]
      play_snd(0)
  elif role == 'W':
    if gconfig["state"]["save"] is None:
      gconfig["state"]["save"] = request.GET.get("s")
      gconfig["state"]["poison"] = request.GET.get("p")
      play_snd(0)
  elif role in 'KSXIPG':
    key = request.GET.get("key")
    if gconfig["state"][key] is None:
      gconfig["state"][key] = request.GET.get("data")
      play_snd(0)
  return HttpResponse({})

def home(request):
  return HttpResponseRedirect("/static/index.html")

def JsonResponse(obj):
  return HttpResponse(json.dumps(obj), content_type="application/json")

def set_game_start(request):
  global gconfig
  x1 = request.GET.get("on") is not None
  x2 = request.GET.get("off") is not None
  if x1:
    gconfig["state"] = {
      "TnCy": False,
      "kill": None,
      "kill2": None,
      "infect": None,
      "admire": None,
      "see": None,
      "poison": None,
      "save": None,
      "watch": None,
      "lover": [],
      "flut": [],
      "theif0": None,
      "theif": [],
    }
    gconfig["gameStart"] = True
  elif x2:
    for key in gconfig["players"].keys():
      gconfig["players"][key] = None
    gconfig["gameStart"] = False
  return JsonResponse({
    "gameStart": gconfig["gameStart"],
    "roles": "".join(gconfig["roles"])
  })

def set_role(request):
  global gconfig
  if gconfig["gameStart"]:
    raise Http404()
  ip = _ip(request)
  no = request.GET.get("no")
  role = request.GET.get("role")
  gconfig["ip2no"][ip] = no
  gconfig["players"][ip] = role
  return JsonResponse({})
  

def set_roles(request):
  global gconfig
  rolestr = request.GET.get("roles")
  roles = []
  if rolestr is None:
    raise Http404()
  has_arg = False
  for ch in rolestr:
    if ch in ['O', 'K']:
      roles.append(ch)
      has_arg = True
    elif has_arg:
      roles[-1] += ch
      has_arg = False
    else:
      roles.append(ch)
  print roles
  gconfig["roles"] = roles
  return JsonResponse({})

def get_info(request):
  ip = _ip(request)
  print ip
  global gconfig
  return JsonResponse({
    "no": gconfig["ip2no"].get(ip),
    "role": gconfig["players"].get(ip),
    "config": gconfig,
  })

def _ip(request):
  return request.META.get('REMOTE_ADDR')

def network(request):
  ifconfig = subprocess.check_output("ifconfig", shell=True)
  ifconfig = ifconfig.split('\n')
  r = []
  for one in ifconfig:
    if 'inet ' in one:
      r.append(one.split('inet ')[1].split(' ')[0])
  return JsonResponse({
    "ifconfig": r
  })

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'werewolf.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^$', home),
    url(r'^api/v1/set_role/', set_role),
    url(r'^api/v1/network/', network),
    url(r'^api/v1/act/', act),
    url(r'^api/v1/startx/', startx),
    url(r'^api/v1/starty/', starty),
    url(r'^api/v1/set_roles/', set_roles),
    url(r'^api/v1/set_game_start/', set_game_start),
    url(r'^api/v1/get_info/', get_info),
    url(r'^admin/', include(admin.site.urls)),
)
