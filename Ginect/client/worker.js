//importScripts("opencv.js");

function BasePoint(x, y, alpha) {
   this.x = x || 0;
   this.y = y || 0;
   this.alpha = alpha || 0;
}

BasePoint.prototype = {
   _norm_alpha: function () {
      if (this.alpha > Math.PI) this.alpha -= Math.PI * 2;
      else if (this.alpha < -Math.PI) this.alpha += Math.PI * 2;
   },
   clone: function () {
      var p = new BasePoint();
      p.x = this.x;
      p.y = this.y;
      p.alpha = this.alpha;
   },
   distance: function (px, py) {
      var dx = px - this.x, dy = py - this.y;
      return Math.sqrt(dx * dx + dy * dy);
   },
   look_at: function (px, py) {
      var dxgt0, dygt0;
      dxgt0 = (px - this.x > 0);
      dygt0 = (py - this.y >= 0);
      if (px - this.x == 0) {
         if (dygt0) {
            this.alpha = Math.PI / 2;
            return;
         } else {
            this.alpha = -Math.PI / 2;
            return;
         }
      }
      this.alpha = Math.atan((py - this.y) / (px - this.x));
      if (!dxgt0) this.alpha += Math.PI;
      this._norm_alpha();
   },
   side_point: function (direction, distance) {
      var p = new BasePoint();
      var cosa = Math.cos(this.alpha + direction);
      var sina = Math.sin(this.alpha + direction);
      p.x = this.x + distance * cosa;
      p.y = this.y + distance * sina;
      p.alpha = this.alpha + direction;
      p._norm_alpha();
      return p;
   },
   transform: function (dx, dy) {
      this.x += dx;
      this.y += dy;
   },
   rotate: function (ox, oy, angle) {
      var tmpx, tmpy;
      tmpx = this.x;
      tmpy = this.y;
      this.x = ox + tmpx * Math.cos(angle) + tmpy * Math.sin(angle);
      this.y = oy + tmpy * Math.cos(angle) - tmpx * Math.sin(angle);
      alpha -= angle;
      this._norm_alpha();
   },
   mod: function () {
      return Math.sqrt(x * x + y * y);
   },
   as_line: function () {
      var cosa = Math.cos(this.alpha);
      var sina = Math.sin(this.alpha);
      return [sina, -cosa, this.y*cosa-this.x*sina];
   },
   line_cross: function (line) {
      var cross = new BasePoint();
      if (line.alpha == this.alpha) { // no crossing
         return cross;
      }
      var l1 = this.as_line(), l2 = line.as_line();
      var a1 = l1[0], b1 = l1[1], c1 = l1[2];
      var a2 = l2[0], b2 = l2[1], c2 = l2[2];
      var m = a1 * b2 - a2 * b1;
      cross.x = (b1 * c2 - b2 * c1) / m;
      cross.y = (a1 * c2 - a2 * c1) / m;
   },
   line_point: function(distance) {
      var sina, cosa;
      var p = new BasePoint();
      sina = Math.sin(this.alpha);
      cosa = Math.cos(this.alpha);
      p.x = this.x + distance * cosa;
      p.y = this.y + distance * sina;
      p.alpha = this.alpha;
      return p;
   },
   line_point_distance: function (x, y) {
      var line = this.as_line();
      var a = line[0], b = line[1], c = line[2];
      return Math.abs((a*x+b*y+c)/Math.sqrt(a*a+b*b));
   },
   line_proj_point: function (x, y) {
      if (this.x == x && this.y == y) {
         return this.clone();
      }
      var a = this.alpha, a0 = this.alpha;
      var d = this.distance(x, y);
      this.look_at(x, y);
      a = this.alpha - a;
      this.alpha = a0;
      return this.line_point(d*Math.cos(a));
   },
   line_alpha: function (another_line) {
      var a = Math.abs(this.alpha - another_line.alpha);
      if (a > Math.PI) a = Math.PI*2 - a;
      return a;
   }
};

var tracked_poses = [];
var global = {
   count: 0
};

self.addEventListener('message', function(e) {
   var detected_poses = e.data;
   var tracked_mark = {}, detected_mark = {};
   var i, j, k;
   var obji, objj, objk;
   var n = tracked_poses.length, m = detected_poses.length;
   if (!m) {
      tracked_poses = [];
      return;
   }
   for (i = 0; i < n; i++) {
      k = 0;
      obji = tracked_poses[i];
      detected_poses.forEach(function (x, index) {
         if (detected_mark[index]) return;
         objj = x;
         objk = detected_poses[k];
         var p = new BasePoint(
            obji.body.nose.position.x,
            obji.body.nose.position.y
         );
         if (p.distance(
               objj.body.nose.position.x, objj.body.nose.position.y
            ) < p.distance(
               objk.body.nose.position.x, objk.body.nose.position.y
            )
         ) {
            k = index;
         }
      });
      if (detected_mark[k]) continue;
      detected_mark[k] = true;
      tracked_mark[i] = k;
      obji.missed = 0;
   }
   var new_tracked_poses = [];
   for (i = 0; i < n; i++) {
      obji = tracked_poses[i];
      if (i in tracked_mark) {
         j = tracked_mark[i];
         objj = detected_poses[j];
         objj.missed = 0;
         objj.history = obji.history;
         new_tracked_poses.push(objj);
      } else {
         obji.missed ++;
         if (obji.missed < 3) {
            new_tracked_poses.push(obji);
         }
      }
   }
   global.new_tracked = 0;
   for (j = 0; j < m; j++) {
      if (j in detected_mark) continue;
      objj = detected_poses[j];
      objj.missed = 0;
      objj.history = [];
      new_tracked_poses.push(objj);
      global.new_tracked++;
   }
   tracked_poses = new_tracked_poses;

   if (global.count !== tracked_poses.length) {
      global.count = tracked_poses.length;
      self.postMessage({"track_count": global.count, "new_tracked": global.new_tracked});
   }

   tracked_poses.forEach(function (pose) {
      analyze_pose(pose);
   });
   //self.postMessage({"type": receivedData.type, "data": e.data});
}, false);

const tag = {
   NONE: 0,
   ACTIVATE: 1
};

function analyze_pose(pose) {
   var state = pose_check_activate(pose);
   switch(state) {
      case tag.ACTIVATE:
      console.log('pose activate!!!!');
      break;
      case tag.NONE:
   }
}

function pose_check_activate(pose) {
   if (!pose.body.rightShoulder || !pose.body.leftShoulder || !pose.body.leftWrist || !pose.body.leftElbow) {
      return tag.NONE;
   }
   var right = pose.body.leftShoulder.position;
   var left = pose.body.rightShoulder.position;
   var wrist = pose.body.leftWrist.position;
   var elbow = pose.body.leftElbow.position;
   var nose = pose.body.nose.position;
   var shoulder = new BasePoint(left.x, left.y);
   shoulder.look_at(right.x, right.y);
   var forearm = new BasePoint(elbow.x, elbow.y);
   forearm.look_at(wrist.x, wrist.y);
   var arm = new BasePoint(elbow.x, elbow.y);
   arm.look_at(right.x, right.y);
   var dn = shoulder.line_point_distance(nose.x, nose.y);
   var dw = shoulder.line_point_distance(wrist.x, wrist.y);
   var pw = shoulder.line_proj_point(wrist.x, wrist.y);
   var dpw = shoulder.distance(pw.x, pw.y);
   var ds = shoulder.distance(right.x, right.y);
   var r_dwdnp3 = dw * 3 / dn;
   var r_dpwds = dpw / ds;
   var sharm_a = shoulder.line_alpha(arm) / Math.PI;
   var arm_a = forearm.line_alpha(arm) / Math.PI;
   pose.history.push([r_dwdnp3, r_dpwds, sharm_a, arm_a]);
   console.log(pose.history);
   //console.log(dw, dn/3, r_dpwds, [nose.x, nose.y], [wrist.x, wrist.y], [left.x, left.y], [pw.x, pw.y], [right.x, right.y]);
   if (dw < dn/3 && r_dpwds > 0.7 && r_dpwds < 0.9) {
      return tag.ACTIVATE;
   } else {
      return tag.None;
   }
}
// importScripts("ParallelJS-CV.min.js");
