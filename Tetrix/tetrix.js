(function () {

const block_size = 25,
      height = 500,
      width = 300;

var player = {
  score: 0,
  game_over: false,
  solid: null,
  drop: null,
  dropping: {
    x: 0,
    y: 0
  },
  next: null,
  init: function () {
    init_config.call(this);
    init_solid.call(this);
    init_player.call(this);
    return this;

    function init_config() {
      this._type_keys = Object.keys(this._types);
    }

    function init_solid() {
      var line = null;
          lines = [];
      for (var i = 0, n = height/block_size; i < n; i++) {
        lines.push(this._new_row());
      }
      this.solid = lines;
    }

    function init_player() {
      this.score = 0;
      this.next = this._random_type();
      this.refill();
      this.game_over = false;
    }
  }, // player.init
  tick: function () {
    if (!this.is_available(this.dropping.x, this.dropping.y + 1)) {
      this.freeze();
      this.refill();
      return;
    }
    this.dropping.y ++;
  }, // player.tick
  refill: function () {
    this.drop = this.next;
    this.next = this._random_type();
    this.dropping.y = - this.drop.h;
    this.dropping.x = ~~(width/block_size / 2 - this.drop.w / 2);
    return this;
  }, // player.refill
  is_available: function (x, y) {
    var rows = this.solid,
        base = this.dropping,
        shape = this.drop.shape;
    if (y + this.drop.h > rows.length) return false;
    if (x < 0 || x + this.drop.w > rows[0].length) return false;
    for (var i = 0, n = shape.length; i < n; i++) {
      if (y + shape[i].y < 0) continue;
      if (rows[y + shape[i].y][x + shape[i].x].block) return false;
    }
    return true;
  }, // player.is_available
  freeze: function () {
    var shape = this.drop.shape,
        base = this.dropping;
    for (var i = 0, n = shape.length; i < n; i++) {
      if (base.y + shape[i].y < 0) continue;
      this.solid[base.y + shape[i].y][base.x + shape[i].x].block = true;
    }
    if (base.y < 0) {
      this.game_over = true;
      return this;
    }
    this._clean_full_row();
    return this;
  }, // player.freeze
  _is_full_row: function (row) {
    for (var i = 0, n = row.length; i < n; i++) {
      if (!row[i].block) return false;
    }
    return true;
  },
  _clean_full_row: function () {
    var full_rows = [],
        rows = this.solid,
        count = 0;
    for (var i = rows.length - 1; i >= 0; i--) {
      if (this._is_full_row(rows[i])) {
        full_rows.push(i);
      }
    }
    count = full_rows.length;
    this._add_score(count);
    for (var i = 0, n = full_rows.length; i < n; i++) {
      rows.splice(full_rows[i], 1);
    }
    for (var i = count; i > 0; i--) {
      rows.splice(0, 0, this._new_row());
    }
    return this;
  }, // player.clean_full_row
  _add_score: function (n) {
    this.score += n;
  }, // player._add_score
  _new_row: function () {
    var row = [],
        n = width / block_size;
    while (n > 0) {
      row.push({block: false});
      n--;
    }
    return row;
  }, // player._new_row
  _type_keys: null,
  _random_type: function () {
    return this._types[
      this._type_keys[~~(Math.random() * this._type_keys.length)]
    ];
  }, // player._random_type
  _types: {
    vertical_line: {
      rotate: 'horizontal_line',
      w: 1, h: 4,
      shape: [
        {x:0, y:0},
        {x:0, y:1},
        {x:0, y:2},
        {x:0, y:3}
      ]
    },
    horizontal_line: {
      rotate: 'vertical_line',
      w: 4, h: 1,
      shape: [
        {x:0, y:0}, {x:1, y:0}, {x:2, y:0}, {x:3, y:0}
      ]
    },
    box: {
      rotate: null,
      w: 2, h: 2,
      shape:[
        {x:0, y:0}, {x:1, y:0},
        {x:0, y:1}, {x:1, y:1}
      ]
    },

    Z1_1: {
      rotate: 'Z1_2',
      w: 3, h: 2,
      shape: [
        {x:0, y:0}, {x:1, y:0},
                    {x:1, y:1}, {x:2, y:1}
      ]
    },
    Z1_2: {
      rotate: 'Z1_1',
      w: 2, h: 3,
      shape: [
                    {x:1, y:0},
        {x:0, y:1}, {x:1, y:1},
        {x:0, y:2}
      ]
    },

    Z2_1: {
      rotate: 'Z2_2',
      w: 3, h: 2,
      shape: [
                    {x:1, y:0}, {x:2, y:0},
        {x:0, y:1}, {x:1, y:1}
      ]
    },
    Z2_2: {
      rotate: 'Z2_1',
      w: 2, h: 3,
      shape: [
        {x:0, y:0},
        {x:0, y:1}, {x:1, y:1},
                    {x:1, y:2}
      ]
    },

    L1_1: {
      rotate: 'L1_2',
      w: 3, h: 2,
      shape: [
        {x:0, y:0}, {x:1, y:0}, {x:2, y:0},
        {x:0, y:1}
      ]
    },
    L1_2: {
      rotate: 'L1_3',
      w: 2, h: 3,
      shape: [
        {x:0, y:0}, {x:1, y:0},
                    {x:1, y:1},
                    {x:1, y:2}
      ]
    },
    L1_3: {
      rotate: 'L1_4',
      w: 3, h: 2,
      shape: [
                                {x:2, y:0},
        {x:0, y:1}, {x:1, y:1}, {x:2, y:1}
      ]
    },
    L1_4: {
      rotate: 'L1_1',
      w: 2, h: 3,
      shape: [
        {x:0, y:0},
        {x:0, y:1},
        {x:0, y:2}, {x:1, y:2}
      ]
    },

    L2_1: {
      rotate: 'L2_2',
      w: 3, h: 2,
      shape: [
        {x:0, y:0}, {x:1, y:0}, {x:2, y:0},
                                {x:2, y:1}
      ]
    },
    L2_2: {
      rotate: 'L2_3',
      w: 2, h: 3,
      shape: [
                    {x:1, y:0},
                    {x:1, y:1},
        {x:0, y:2}, {x:1, y:2}
      ]
    },
    L2_3: {
      rotate: 'L2_4',
      w: 3, h: 2,
      shape: [
        {x:0, y:0},
        {x:0, y:1}, {x:1, y:1}, {x:2, y:1}
      ]
    },
    L2_4: {
      rotate: 'L2_1',
      w: 2, h: 3,
      shape: [
        {x:0, y:0}, {x:1, y:0},
        {x:0, y:1},
        {x:0, y:2}
      ]
    },

    triangle_1: {
      rotate: 'triangle_2',
      w: 3, h: 2,
      shape: [
                    {x:1, y:0},
        {x:0, y:1}, {x:1, y:1}, {x:2, y:1}
      ]
    },
    triangle_2: {
      rotate: 'triangle_3',
      w: 2, h: 3,
      shape: [
        {x:0, y:0},
        {x:0, y:1}, {x:1, y:1},
        {x:0, y:2}
      ]
    },
    triangle_3: {
      rotate: 'triangle_4',
      w: 3, h: 2,
      shape: [
        {x:0, y:0}, {x:1, y:0}, {x:2, y:0},
                    {x:1, y:1}
      ]
    },
    triangle_4: {
      rotate: 'triangle_1',
      w: 2, h: 3,
      shape: [
                    {x:1, y:0},
        {x:0, y:1}, {x:1, y:1},
                    {x:1, y:2}
      ]
    },
  }, // player._types
  rotate: function () {
    if (!this.drop.rotate) return;
    var rollback = this.drop,
        next = this._types[this.drop.rotate];
    this.drop = next;
    if (this.is_available(this.dropping.x, this.dropping.y)) return;
    this.drop = rollback;
  },
  move_left: function () {
    if (!this.is_available(this.dropping.x - 1, this.dropping.y)) return;
    this.dropping.x --;
  },
  move_right: function () {
    if (!this.is_available(this.dropping.x + 1, this.dropping.y)) return;
    this.dropping.x ++;
  }
}; // player

var draw = {
  pen: document.getElementById('paper').getContext('2d'),
  _bind_config: null,
  bind: function (player) {
    this._bind_config = {
      translate_x: 100,
      translate_y: 0,
      player: player
    };
  },
  draw_screen: function () {
    var pen = this.pen;
    pen.clearRect(0, 0, 100 + width + 100, height);
    this.draw_score();
    this.draw_next_block();
    this.draw_main();
  }, // draw.draw_screen

  draw_main: function () {
    var pen = this.pen;
    pen.save();
    pen.translate(
      this._bind_config.translate_x,
      this._bind_config.translate_y
    );
    this.draw_solid_blocks();
    this.draw_dropping_block();
    pen.restore();
  }, // draw.draw_main

  draw_score: function () {
    var pen = this.pen,
        score = this._bind_config.player.score;

    pen.font = '12px Arial';
    pen.textAlign = 'left';
    pen.fillText('score:', 5, 12);
    pen.textAlign = 'center';
    pen.font = '30px Arial';
    pen.fillText('' + score, 50, 50 + 15);

    pen.strokeStyle = '#000';
    pen.rect(0, 0, 100, 100);
    pen.stroke();
  }, // draw.draw_score

  draw_next_block: function () {
    var pen = this.pen,
        player = this._bind_config.player;
    this.draw_block(player.next.shape, {
      x: ~~(100 + width + (100 - player.next.w * block_size)/2),
      y: ~~((100 - player.next.h * block_size)/2)
    });

    pen.strokeStyle = '#000';
    pen.rect(width + 100, 0, 100, 100);
    pen.stroke();
  }, // draw_next_block

  draw_solid_blocks: function() {
    var pen = this.pen,
        player = this._bind_config.player;
    pen.strokeStyle = '#eee';
    for (var y = 0, m = height/block_size; y < m; y++) {
      for (var x = 0, n = width/block_size; x < n; x++) {
        if (player.solid[y][x].block) {
          pen.fillStyle = '#070'
        } else {
          pen.fillStyle = '#fff'
        }
        pen.beginPath();
        pen.fillRect(x * block_size, y * block_size, block_size, block_size);
        pen.rect(x * block_size, y * block_size, block_size, block_size);
        pen.stroke();
      }
    }
    pen.fillStyle = '#fff'
    pen.strokeStyle = '#000';

    pen.beginPath();
    pen.rect(0, 0, width, height);
    pen.stroke();
  }, // draw.draw_bottom_blocks

  draw_dropping_block: function () {
    var player = this._bind_config.player;
    this.draw_block(
      player.drop.shape, {
        x: player.dropping.x * block_size,
        y: player.dropping.y * block_size
      }
    );
  },
  draw_block: function(shape, base) {
    var pen = this.pen;
    pen.save();
    pen.translate(base.x, base.y);
    for (var i = 0, n = shape.length; i < n; i++) {
      pen.fillStyle = '#0f0';
      pen.strokeStyle = '#000';
      pen.beginPath();
      pen.fillRect(
        shape[i].x * block_size, shape[i].y * block_size,
        block_size, block_size
      );
      pen.rect(
        shape[i].x * block_size, shape[i].y * block_size,
        block_size, block_size
      );
      pen.stroke();
    }
    pen.restore();
  } // draw.draw_dropping_block

}; // draw;

player.init();
draw.bind(player);
draw.draw_screen();

var timer = {
  unit: 100,
  count: 10,
  cur: 10,
  change_speed: function (score) {
    if (score > 100) {
      timer.count = 1;
    } else if (score > 50) {
      timer.count = 2;
    } else if (score > 25) {
      timer.count = 4;
    } else if (score > 12) {
      timer.count = 7;
    } else {
      timer.count = 10;
    }
  },
  run: function () {
    if (player.game_over) return;
    timer.cur --;
    if (timer.cur > 0) return;
    timer.cur = timer.count;
    player.tick();
    timer.change_speed(player.score);
    draw.draw_screen();
  }
};
setInterval(timer.run, timer.unit);

var keyboard_event = function (evt) {
  switch (evt.keyCode) {
  case 0x28:
    player.tick();
    break;
  case 0x25: // left
    player.move_left();
    break;
  case 0x27: // right
    player.move_right();
    break;
  case 0x26: // up => rotate
    player.rotate();
    break;
  }
  draw.draw_screen();
};

document.addEventListener('keydown', keyboard_event);

})();
