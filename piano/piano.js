'use strict';
(function(window, document) {

function base64Decode(str) {
   // ref: https://gist.github.com/stubbetje/229984
   var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
   var r = [];
   var i = 0;
   var padding = characters.indexOf('=');
   for (var i = 0, n = str.length; i < n; i += 4) {
      var b1 = characters.indexOf( str.charAt(i) );
      var b2 = characters.indexOf( str.charAt(i+1) );
      var b3 = characters.indexOf( str.charAt(i+2) );
      var b4 = characters.indexOf( str.charAt(i+3) );
      var a = ( ( b1 ) << 2 ) | ( ( b2 >> 4 ) );
      var b = ( ( b2 & 0xF  ) << 4 ) | ( ( b3 >> 2 ) );
      var c = ( ( b3 & 0x3  ) << 6 ) | ( b4 );
      r.push(a);
      if (b3 !== padding) r.push(b);
      if (b4 !== padding) r.push(c);
   }
   return new Uint8Array(r).buffer;
}

function isMobileBrowser() {
   var userAgent = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
   if (/android|iphone|ipod|kindle/.test(userAgent)) return true;
   return false;
}

var constBlackKey = [
   1, 4, 6, 9, 11, 13, 16, 18, 21, 23, 25, 28, 30,
   33, 35, 37, 40, 42, 45, 47, 49, 52, 54, 57, 59,
   61, 64, 66, 69, 71, 73, 76, 78, 81, 83, 85
];
var constWhiteKey = [
   0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22,
   24, 26, 27, 29, 31, 32, 34, 36, 38, 39, 41, 43, 44,
   46, 48, 50, 51, 53, 55, 56, 58, 60, 62, 63, 65, 67,
   68, 70, 72, 74, 75, 77, 79, 80, 82, 84, 86, 87
];

var env = {
   error: false,
   ready: false,
   pedal: null,
   group: 0,
   keyMap: {}
};
// key = [0, 88)
// note = [A0, Bb0, B0, ... A1, ... ]
var key2note = [];

function buildKey2Note() {
   var notes = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'];
   for (var i = 0; i < 88; i ++) {
      var note = notes[i % 12];
      var lv = ~~((i+9)/12);
      key2note.push(note + lv);
   }
}

// Backquote, Digit0 ... 9, Minus, Equal, Backspace, BracketLeft, BracketRight, Backslash, Semicolon, Quote, Comma, Period, Slash,
// Enter, ArrowLeft...Down, F1...12, Escape, PageUp, PageDown, Home, End
function buildDefaultKeyMap() {
   env.keyMap = {
      // black:
      'Digit1': [28, 1, 45], 'Digit2': [30, 4, 47], 'Digit3': [33, 6, 49], 'Digit4': [35, 9, 52], 'Digit5': [37, 11, 54], 'Digit6': [40, 13, 57],
      'Digit7': [42, 16, 59], 'Digit8': [45, 18, 61], 'Digit9': [47, 21, 64], 'Digit0': [49, 23, 66], 'Minus': [52, 25, 69], 'Equal': [54, 28, 71],
      'BracketLeft': [57, 30, 73], 'Semicolon': [59, 33, 76], 'Period': [61, 35, 78], 'Slash': [64, 37, 81], 'Quote': [66, 40, 83], 'BracketRight': [69, 42, 85],
      // white
      'KeyA': [27, 0, 44], 'KeyB': [29, 2, 46], 'KeyC': [31, 3, 48], 'KeyD': [32, 5, 50], 'KeyE': [34, 7, 51], 'KeyF': [36, 8, 53], 'KeyG': [38, 10, 55],
      'KeyH': [39, 12, 56], 'KeyI': [41, 14, 58], 'KeyJ': [43, 15, 60], 'KeyK': [44, 17, 62], 'KeyL': [46, 19, 63], 'KeyM': [48, 20, 65], 'KeyN': [50, 22, 67],
      'KeyO': [51, 24, 68], 'KeyP': [53, 26, 70], 'KeyQ': [55, 27, 72], 'KeyR': [56, 29, 74], 'KeyS': [58, 31, 75], 'KeyT': [60, 32, 77], 'KeyU': [62, 34, 79],
      'KeyV': [63, 36, 80], 'KeyW': [65, 38, 82], 'KeyX': [67, 39, 84], 'KeyY': [68, 41, 86], 'KeyZ': [70, 43, 87]
   };
}

function getAudioSupportType() {
   var audio = new Audio();
   var mp3stat = audio.canPlayType('audio/mpeg');
   var oggstat = audio.canPlayType('audio/ogg; codecs="vorbis"');
   if (oggstat === 'probably') return 'ogg';
   else if (mp3stat === 'probably') return 'mp3';
   else if (oggstat === 'maybe') return 'ogg';
   return 'mp3';
}

function noteStart(name, key, map) {
   if (key < 0) return;
   if (name in map) return;
   map[name] = env.piano.noteOn(key);
   env.keyboard.syncKey(key, true);
}

function noteStop(name, map) {
   var delay = 400;
   if (env.pedal === 'long') delay += 800;
   else if (env.pedal === 'decay') delay -= 200;
   var pid = map[name];
   env.keyboard.syncKey(env.piano.noteKey(pid), false);
   env.piano.noteOff(pid, delay);
   delete map[name];
}

function registerEvents() {
   var map = {};
   var lastMouseOn = -1;
   var lastTouchOn = {};

   document.body.addEventListener('keydown', function (evt) {
      if (!env.ready) return;
      if (evt.code in env.keyMap) {
         // bounce here to prevent keydown trigger always
         var key = env.keyMap[evt.code][env.group];
         noteStart(evt.code, key, map);
      }
   });
   document.body.addEventListener('keyup', function (evt) {
      if (!env.ready) return;
      if (evt.code in env.keyMap) {
         noteStop(evt.code, map);
      } else {
         switch (evt.code) {
         case 'ControlLeft':
            // longing note
            if (env.pedal === 'long') env.pedal = null;
            else env.pedal = 'long';
            break;
         case 'ControlRight':
            // decay note
            if (env.pedal === 'decay') env.pedal = null;
            else env.pedal = 'decay';
            break;
         // key shift
         case 'ArrowUp': case 'ArrowDown': env.group = 0; break;
         case 'ArrowLeft': env.group = 1; break;
         case 'ArrowRight': env.group = 2; break;
         }
      }
   });

   if (env.keyboard.isMobile()) {
      env.keyboard.dom.addEventListener('touchstart', function (evt) {
         if (!env.ready) return;
         evt.preventDefault();
         var localMap = {};
         for (var i = 0, n = evt.touches.length; i < n; i++) {
            var tp = evt.touches[i];
            toOffset(tp);
            var key = env.keyboard.mouseOnKey(tp.offsetX, tp.offsetY);
            if (key < 0) continue;
            if (key in localMap) continue;
            localMap[key] = key;
         }
         Object.keys(localMap).forEach(function (key) {
            var name = 'touch' + key;
            noteStart(name, parseInt(key), map);
            lastTouchOn[key] = key;
         });
      });
      env.keyboard.dom.addEventListener('touchmove', function (evt) {
         if (!env.ready) return;
         evt.preventDefault();
         var localMap = {};
         for (var i = 0, n = evt.touches.length; i < n; i++) {
            var tp = evt.touches[i];
            toOffset(tp);
            var key = env.keyboard.mouseOnKey(tp.offsetX, tp.offsetY);
            if (key < 0) continue;
            if (key in localMap) continue;
            localMap[key] = key;
         }
         Object.keys(lastTouchOn).forEach(function (key) {
            if (key in localMap) {
               delete localMap[key];
            } else {
               var name = 'touch' + key;
               noteStop(name, map);
               delete lastTouchOn[key];
            }
         });
         Object.keys(localMap).forEach(function (key) {
            var name = 'touch' + key;
            noteStart(name, parseInt(key), map);
            lastTouchOn[key] = key;
         });
      });
      env.keyboard.dom.addEventListener('touchend', function (evt) {
         if (!env.ready) return;
         evt.preventDefault();
         Object.keys(lastTouchOn).forEach(function (key) {
            var name = 'touch' + key;
            noteStop(name, map);
            delete lastTouchOn[key];
         });
      });

      function toOffset(touch) {
         touch.offsetX = touch.clientX - env.keyboard.dom.offsetLeft;
         touch.offsetY = touch.clientY - env.keyboard.dom.offsetTop;
      }
   } else {
      env.keyboard.dom.addEventListener('mousedown', function (evt) {
         if (!env.ready) return;
         evt.preventDefault();
         var key = env.keyboard.mouseOnKey(evt.offsetX, evt.offsetY);
         if (key < 0) return;
         noteStart('mouse', key, map);
         lastMouseOn = key;
      });
      env.keyboard.dom.addEventListener('mousemove', function (evt) {
         if (evt.which !== 1) return;
         var key = env.keyboard.mouseOnKey(evt.offsetX, evt.offsetY);
         if (key < 0) {
            if (lastMouseOn >= 0) {
               noteStop('mouse', map);
               lastMouseOn = -1;
            }
            return;
         }
         if (key === lastMouseOn) return;
         noteStop('mouse', map);
         noteStart('mouse', key, map);
         lastMouseOn = key;
      });
      env.keyboard.dom.addEventListener('mouseup', function (evt) {
         if (!env.ready) return;
         evt.preventDefault();
         var key = env.keyboard.mouseOnKey(evt.offsetX, evt.offsetY);
         if (key < 0) return;
         noteStop('mouse', map);
         lastMouseOn = -1;
      });
   }
}

function buildInstrument() {
   // TODO: in future, should use service worker for cache
   console.log('load acoustic_grand_piano ...');
   env.soundfont.load('acoustic_grand_piano').then(function (font) {
      env.piano.setFont(font);
      console.log('instrument ready');
      env.piano.init().then(function () {
         console.log('piano ready');
         env.ready = true;
      }, function (err) {
         console.error('error to init piano ...', err);
         env.error = true;
      });
   }, function (err) {
      console.error('error to load instrument ...', err);
      env.error = true;
   });
}

function initialize() {
   buildKey2Note();
   buildDefaultKeyMap();
   env.soundfont = new SoundFont();
   env.piano = new Piano();
   env.keyboard = new PianoKeyboard(document.getElementById('piano'));
   buildInstrument();
   registerEvents();
}

function SoundFont() {
   this.fonts = {};
}
SoundFont.prototype = {
   // download sound fonts and get license info from:
   // https://github.com/gleitz/midi-js-soundfonts
   find: function (instrument) {
      return instrument + '-' + getAudioSupportType() + '.js'
   },
   load: function (instrument) {
      var that = this;
      return new Promise(function (resolve, reject) {
         if (that.fonts[instrument]) return resolve(that.fonts[instrument].raw);
         var url = 'soundfont/' + that.find(instrument);
         var script = document.createElement('script');
         script.src = url;
         script.addEventListener('load', init);
         document.body.appendChild(script);

         function init(evt) {
            if (!window.MIDI) return reject();
            if (!window.MIDI.Soundfont) return reject();
            var raw = window.MIDI.Soundfont[instrument];
            if (!raw) return reject();
            that.fonts[instrument] = { raw: raw, dom: evt.target }
            resolve(that.fonts[instrument].raw);
         }
      });
   },
   get: function (instrument) {
      return this.fonts[instrument] || {};
   }
};

function Piano(soundfont) {
   this.ctx = new (window.AudioContext || window.webkitAudioContext)();
   this.font = soundfont;
   this.pid = 0; // auto incrematal id
   this.playing = {};
   this.keyaudio = [];
}
Piano.prototype = {
   setFont: function (soundfont) {
      this.font = soundfont;
   },
   init: function () {
      var that = this;
      return new Promise(function (resolve, reject) {
         var queue = [];
         // decode sound font materials
         for (var i = 0; i < 88; i++) {
            var src = that.font[ key2note[i] ];
            var buf = base64Decode(src.split(',')[1]);
            queue.push(decode(buf, i));
         }
         Promise.all(queue).then(resolve, reject);

         function decode(buf, i) {
            return new Promise(function (r0, e0) {
               that.ctx.decodeAudioData(buf, function (paw) {
                  that.keyaudio[i] = paw;
                  r0(paw);
               }, function (err) {
                  e0(err);
               });
            });
         } // decode
      });
   }, // init
   noteOn: function (key) {
      // XXX: if pid too large, do we want to reset it to 0
      this.pid ++;
      var pid = this.pid;
      var source = this.ctx.createBufferSource();
      source.buffer = this.keyaudio[key];
      var ctrl = this.ctx.createGain();
      ctrl.connect(this.ctx.destination);
      ctrl.gain.value = 0;
      source.connect(ctrl);
      source.start();
      ctrl.gain.linearRampToValueAtTime(3, this.ctx.currentTime + 0.01);
      var note = { pid: pid, key: key, source: source, ctrl: ctrl };
      this.playing[pid] = note;
      return pid;
   },
   noteOff: function (pid, delay) {
      var note = this.playing[pid];
      if (!note) return;
      note.ctrl.gain.linearRampToValueAtTime(note.ctrl.gain.value, this.ctx.currentTime);
      if (delay) {
         var delay_s = delay/1000 - 0.1;
         if (delay_s < 0.3) delay_s = 0.3;
         note.ctrl.gain.linearRampToValueAtTime(0, this.ctx.currentTime + delay_s);
         setTimeout(function (note) {
            note.source.disconnect();
         }, delay, note);
      } else {
         note.ctrl.gain.linearRampToValueAtTime(0, this.ctx.currentTime);
         note.source.disconnect();
      }
      delete this.playing[pid];
   },
   noteKey: function (pid) {
      var note = this.playing[pid];
      if (!note) return -1;
      return note.key;
   },
   halt: function () {
      var pids = Object.keys(this.playing);
      for (var i = 0, n = pids.length; i < n; i++) {
         this.noteOff(pids[i]);
      }
   },
   getBlackKeyOnList: function () {
      var pids = Object.keys(this.playing);
      var on = {};
      for (var i = 0, n = pids.length; i < n; i++) {
         var key = this.playing[pids[i]].key;
         if (on[key]) continue;
         if (constBlackKey.indexOf(key) < 0) continue;
         on[key] = 1;
      }
      return Object.keys(on).map(function (x) { return parseInt(x); });
   },
   getWhiteKeyOnList: function () {
      var pids = Object.keys(this.playing);
      var on = {};
      for (var i = 0, n = pids.length; i < n; i++) {
         var key = this.playing[pids[i]].key;
         if (on[key]) continue;
         if (constWhiteKey.indexOf(key) < 0) continue;
         on[key] = 1;
      }
      return Object.keys(on).map(function (x) { return parseInt(x); });
   }
};

function PianoKeyboard(container) {
   this.container = container;
   this.dom = document.createElement('canvas');
   this.container.appendChild(this.dom);
   this.pen = this.dom.getContext('2d');
   this.selectedBlack = [];
   this.selectedWhite = [];
   this.w = 0; this.h = 0;
   this.mobile = isMobileBrowser();
   if (this.mobile) {
      this.paintBuffer = this.paintBufferMobile;
      this.mouseOnKey = this.mouseOnKeyMobile;
      this.syncKey = this.syncKeyMobile;
   } else {
      this.paintBuffer = this.paintBufferDesktop;
      this.mouseOnKey = this.mouseOnKeyDesktop;
      this.syncKey = this.syncKeyDesktop;
   }

   this.imgbuf = document.createElement('canvas');
   this.imgbufPen = this.imgbuf.getContext('2d');
   this.imgbufReady = false;
   this.keyonCache = {};

   this.resize();
   this.paint();
}

PianoKeyboard.prototype = {
   isMobile: function () {
      return this.mobile;
   },
   resize: function () {
      var w = window.innerWidth - this.container.offsetLeft * 2;
      var h = window.innerHeight - this.container.offsetTop - 10;
      document.body.style.overflow = 'hidden';
      this.container.style.width = w + 'px';
      this.container.style.height = h + 'px';
      this.dom.width = w;
      this.dom.height = h;
      this.dom.style.width = '100%';
      this.dom.style.height = '100%';
      this.imgbuf.width = w;
      this.imgbuf.height = h;
      this.imgbuf.style.width = '100%';
      this.imgbuf.style.height = '100%';
      this.pen.clearRect(0, 0, w, h);
      this.imgbufPen.clearRect(0, 0, w, h);
      this.imgbufReady = false;
      var rotate = false;
      this.w = w;
      this.h = h;
      this.paint();
   },
   paint: function () {
      if (!this.imgbufReady) this.paintBuffer();
      this.pen.clearRect(0, 0, this.w, this.h);
      this.pen.drawImage(this.imgbuf, 0, 0);
   },
   syncKeyMobile: function (key, on) {
      if (key < 0) return;
      var n = constWhiteKey.length;
      var hw = this.h / n * 2;
      var ww = this.w / 2;
      var i = constWhiteKey.indexOf(key);
      if (i < 0) {
         i = constWhiteKey.indexOf(key - 1);
         var j = ~~(i*2/n);
         if (j > 0) i -= n / 2;
         var x = (1 - j + 2/5) * ww, y = (i + 1 - 3/8) * hw, w = ww * 3/5, h = hw * 3/4
         this.paintBlackKey(this.pen, x, y, w, h, on?'red':'black');
         this.keyonCache[key] = on;
      } else {
         var prevWhite = constWhiteKey[i-1];
         var nextWhite = constWhiteKey[i+1];
         var j = ~~(i*2/n);
         if (j > 0) i -= n / 2;
         this.paintWhiteKey(this.pen, (1 - j) * ww, i * hw, ww, hw, on?'red':'white');
         this.keyonCache[key] = on;
         if (key > 0 && key - prevWhite != 1) {
            this.syncKey(key-1, this.keyonCache[key-1]);
         }
         if (key < 87 && nextWhite - key != 1) {
            this.syncKey(key+1, this.keyonCache[key+1]);
         }
      }
   },
   syncKeyDesktop: function (key, on) {
      if (key < 0) return;
      var n = constWhiteKey.length;
      var ww = this.w / n;
      var i = constWhiteKey.indexOf(key);
      if (i < 0) {
         i = constWhiteKey.indexOf(key - 1);
         var x = (i + 1 - 3/8) * ww, y = 0, w = ww * 3/4, h = 100 * 3/5
         this.paintBlackKey(this.pen, x, y, w, h, on?'red':'black');
         this.keyonCache[key] = on;
      } else {
         this.paintWhiteKey(this.pen, i * ww, 0, ww, 100, on?'red':'white');
         this.keyonCache[key] = on;
         var prevWhite = constWhiteKey[i-1];
         var nextWhite = constWhiteKey[i+1];
         if (key > 0 && key - prevWhite != 1) {
            this.syncKey(key-1, this.keyonCache[key-1]);
         }
         if (key < 87 && nextWhite - key != 1) {
            this.syncKey(key+1, this.keyonCache[key+1]);
         }
      }
   },
   paintWhiteKey: function (pen, x, y, w, h, color) {
      pen.fillStyle = color || 'white';
      pen.fillRect(x, y, w, h);
      pen.strokeStyle = '1px solid grey';
      pen.beginPath();
      pen.rect(x, y, w, h);
      pen.stroke();
   },
   paintBlackKey: function (pen, x, y, w, h, color) {
      pen.fillStyle = color || 'black';
      pen.fillRect(x, y, w, h);
      pen.storkeStyle = '1px solid black';
      pen.beginPath();
      pen.rect(x, y, w, h);
      pen.stroke();
   },
   paintBufferMobile: function () {
      // TODO: consider mobile screen auto-rotate
      // 2 lines, 26 white keys per line
      var n = constWhiteKey.length / 2;
      var hw = this.h / n;
      var ww = this.w / 2;
      for (var j = 0; j < 2; j++) {
         var base = j * n;
         for (var i = 0; i < n; i++) {
            // var key = constWhiteKey[i];
            this.paintWhiteKey(this.imgbufPen, (1 - j) * ww, i * hw, ww, hw, 'white');
         }
         for (var i = 0; i < n - 1; i ++) {
            if (constWhiteKey[base+i+1] - constWhiteKey[base+i] == 1) continue;
            this.paintBlackKey(this.imgbufPen, (1 - j + 2/5) * ww, (i + 1 - 3/8) * hw, ww * 3/5, hw * 3/4, 'black');
         }
      }
      this.imgbufReady = true;
   },
   paintBufferDesktop: function () {
      // 1 line, 52 white keys per line
      var n = constWhiteKey.length;
      var ww = this.w / n;
      for (var i = 0; i < n; i ++) {
         // var key = constWhiteKey[i];
         this.paintWhiteKey(this.imgbufPen, i * ww, 0, ww, 100, 'white');
      }
      for (var i = 0; i < n - 1; i ++) {
         if (constWhiteKey[i+1] - constWhiteKey[i] == 1) continue;
         this.paintBlackKey(this.imgbufPen, (i + 1 - 3/8) * ww, 0, ww * 3/4, 100 * 3/5, 'black');
      }
      this.imgbufReady = true;
   },
   mouseOnKeyMobile: function (x, y) {
      // actually touchOnKey
      var n = constWhiteKey.length;
      var hw = this.h / n * 2, hb = hw * 3/4, hbhalf = hb / 2;
      var ww = this.w / 2, wb = ww * 3/5;
      var j = (x < ww)?0:1;
      var i = ~~(y / hw);
      x -= j * ww;
      var wi = (1 - j) * n / 2 + i;
      var key = constWhiteKey[wi];
      if (x < ww - wb) return key;
      y -= j * hw;
      y -= hbhalf;
      if (y < 0) {
         if (wi == 0) return key;
         var prevWhite = constWhiteKey[wi-1];
         if (key - prevWhite == 1) return key;
         return key - 1;
      }
      y -= hw - hb;
      if (x <= 0) return key;
      if (key == 87) return key;
      var nextWhite = constWhiteKey[wi+1];
      if (nextWhite - key == 1) return key;
      return key + 1;
   },
   mouseOnKeyDesktop: function (x, y) {
      var hw = 100, hb = 100 * 3/5;
      if (y > hw) return -1;
      var n = constWhiteKey.length;
      var ww = this.w / n, wb = ww * 3/4, wbhalf = wb/2, dw = ww - wb;
      var i = ~~(x / ww);
      var key = constWhiteKey[i];
      if (y > hb) return key;
      x -= ww * i;
      x -= wbhalf;
      if (x < 0) {
         if (i == 0) return key;
         var prevWhite = constWhiteKey[i-1];
         if (key - prevWhite == 1) return key;
         return key - 1;
      }
      x -= dw;
      if (x <= 0) return key;
      if (key == 87) return key;
      var nextWhite = constWhiteKey[i+1];
      if (nextWhite - key == 1) return key;
      return key + 1;
   }
};

initialize();

})(window, document);
