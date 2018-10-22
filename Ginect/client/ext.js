function math_dist(x1, y1, x2, y2) {
   var dx = x2 - x1, dy = y2 - y1;
   return Math.sqrt(dx * dx + dy * dy);
}

function math_line(x1, y1, x2, y2) {
   var A, B, C;
   A = y1 - y2;
   B = -(x1 - x2);
   C = x1 * y2 - x2 * y1;
   return {
      A: A, B: B, C: C
   };
}

function math_normline(line, x, y) {
   var A, B, C;
   A = line.B;
   B = -line.A;
   C = -A * x - B * y;
   return {
      A: A, B: B, C: C
   }
}

function math_toward(line, x0, y0, dx, dy) {
   var x, y;
   if (Math.abs(line.A) < 10e-8) {
      if (Math.abs(line.B) < 10e-8) {
         return [0, 0];
      }
      x = x0 + dx;
      y = (-line.A * x - line.C) / line.B;
   } else {
      y = y0 + dy;
      x = (-line.B * y - line.C) / line.A;
   }
   return [x, y];
}

function conflict(point, rect) {
   var x = point[0], y = point[1];
   var rx = rect[0], ry = rect[1], rw = rect[2], rh = rect[3];
   if (x < rx) return false;
   if (x > rx + rw) return false;
   if (y < ry) return false;
   if (y > ry + rh) return false;
   return true;
}

function rect_overlap(r1, r2) {
   var left = Math.min(r1.x, r2.x+r2.w);
   var right = Math.max(r1.x+r1.w, r2.x);
   if (left > right) return 0;
   var top = Math.min(r1.y, r2.y+r2.h);
   var bottom = Math.max(r1.y+r1.h, r2.y);
   if (top > bottom) return 0;
   var w = right - left, h = bottom - top;
   var a = w*h;
   var a1 = r1.w*r1.h, a2 = r2.w*r2.h;
   if (a === 0) return 0;
   return a / (a1 + a2 - a);
}

function pose_rect(pose) {
   var left = Infinity, top = Infinity, right = 0, bottom = 0;
   Object.values(pose.body).forEach(function (part) {
      if (part.position.x < left) left = part.position.x;
      if (part.position.x > right) right = part.position.x;
      if (part.position.y < top) top = part.position.y;
      if (part.position.y > bottom) bottom = part.position.y;
   });
   return {
      x: left, y: top,
      w: right - left,
      h: bottom - top
   };
}

function poses_remove_overlap(poses, overlap_rate) {
   var selected_rect = [];
   return poses.map(function (pose) {
      for (var i = 0, n = selected_rect.length; i < n; i++) {
         if (rect_overlap(selected_rect[i], pose.rect) > overlap_rate) return null;
      }
      selected_rect.push(pose.rect);
      return pose;
   }).filter(function (x) { return !!x; });
}

var global = {
   iter: 1,
   cached_poses: []
};
function poses_box(poses, env) {
   poses = poses.map(function (x) {
      if (x.score < env.score_threshold) return null;
      x.body = {};
      var part_count = 0;
      x.keypoints.forEach(function (component) {
         if (component.score < env.part_threshold) return;
         x.body[component.part] = component;
         part_count ++;
      });
      if (part_count < 5) return null;
      if (!x.body.nose) return null;
      if (!x.body.rightEye) return null;
      if (!x.body.leftEye) return null;
      x.rect = pose_rect(x);
      return x;
   }).filter(function (x) { return !!x }).sort(function (a, b) {
      return b.score - a.score;
   });
   poses = poses_remove_overlap(poses, 0.4);
   draw_poses(poses, env);

   // process for each 10 frames
   if (global.iter % 10 === 0) {
      global.iter = 1;
      poses = global.cached_poses.concat(poses).sort(function (a, b) {
         return b.score - a.score;
      });
      global.cached_poses = [];
      poses = poses_remove_overlap(poses, 0.4);
      worker_ref && worker_ref.postMessage(poses);
   } else {
      global.iter ++;
      global.cached_poses = global.cached_poses.concat(poses);
   }
}

function draw_poses(poses, env) {
   poses.forEach(function (x) {
      env.gui.draw_keypoints && env.gui.draw_keypoints(x.keypoints, env.part_threshold, env.gui.ctx);
      env.gui.draw_skeleton && env.gui.draw_skeleton(x.keypoints, env.part_threshold, env.gui.ctx);
      env.gui.draw_boundingbox && env.gui.draw_boundingbox(x.keypoints, env.gui.ctx);
   });
}

// worker
var worker_ref = null;
function worker_init() {
   worker_ref = new Worker('./worker.js');
   worker_ref.addEventListener('message', function (e) {
      console.log('outside:', e.data);
   }, false);
   return worker_ref;
}
