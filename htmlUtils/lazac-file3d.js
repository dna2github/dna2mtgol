/*
  @author: Seven Lju
  @date: 2015-09-22

  a tool based on HTML5 to construct content graph from flat file.
 */

function LazacFile3D(text, config) {
  if (!config) config = {};
  if (!config.custom) config.custom = {};

  this.config = config;
  this.text = text;
  this.drewbox = null;
  this.graph = [];
}

LazacFile3D.prototype = {
  _tokenize: function (text) {
    return text.split('\n');
  },
  _search: function (drewbox, str) {
    var search_result = [];
    for (var n=drewbox.length, i=0; i<n; i++) {
      if (drewbox[i].indexOf(str) < 0) continue;
      search_result.push(i);
    }
    return search_result;
  },
  _connect_a2bcd: function (graph, a, bcd) {
    if (!bcd.length) return;
    for (var n=bcd.length, i=0, one=-1; i<n; i++) {
      one = bcd[i];
      if (graph[a].indexOf(one) >= 0) continue;
      graph[a].push(one);
    }
  },
  _connect_abc2d: function (graph, abc, d) {
    if (!abc.length) return;
    for (var n=abc.length, i=0, one=-1; i<n; i++) {
      one = abc[i];
      if (graph[one].indexOf(d) >= 0) continue;
      graph[one].push(d);
    }
  },
  _connect: function (graph, a, b) {
    if (a.length > 0) {
      this._connect_abc2d.call(this, graph, a, b);
    } else if (b.length > 0) {
      this._connect_a2bcd.call(this, graph, a, b);
    } else {
      this._connect_a2bcd.call(this, graph, a, [b]);
    }
    return true;
  },
  _clear_tolist: function (graph, a) {
    graph[a] = [];
    return true;
  },
  _init_graph: function (graph) {
    if (!graph) graph = this.graph;
    for (var n=this.drewbox.length, i=0; i<n; i++) {
      graph[i] = [];
    }
    return graph;
  },
  _load: function (text_file3d, drewbox) {
    text_file3d = text_file3d.split('\n');
    // first line: total of lines
    var n = parseInt(text_file3d.shift()), line, m;
    if (drewbox.length != n) return false;
    var graph = [];
    this._init_graph.call(this, graph);
    while (text_file3d.length > 0) {
      line = text_file3d.shift().split(';');
      if (!line.length) continue;
      // description text
      if (line.length == 1) continue;
      // first index: from; remains: to list
      m = parseInt(line.shift());
      while (line.length > 0) graph[m].push(parseInt(line.shift()));
    }
    return graph;
  },
  _save: function (graph, drewbox) {
    var str = '';
    str += drewbox.length;
    for (var n=graph.length, i=0; i<n; i++) {
      if (!graph[i].length) continue;
      str += '\n' + i;
      for (var m=graph[i].length, j=0; j<m; j++) {
        str += ';' + graph[i][j];
      }
    }
    return str;
  },

  initialize: function () {
    this.drewbox = (
      this.config.custom.tokenize || this._tokenize
    ).call(this, this.text);
    this._init_graph();
    return true;
  },
  search: function (str) {
    return (
      this.config.custom.search || this._search
    ).call(this, this.drewbox, str);
  },
  connect: function (a, b) {
    return (
      this.config.custom.connect || this._connect
    ).call(this, this.graph, a, b);
  },
  disconnect: function (a, b) {
    return (
      this.config.custom.disconnect || this._clear_tolist
    ).call(this, this.graph, a, b);
  },
  load: function (text_file3d) {
    this.graph = (
      this.config.custom.load || this._load
    ).call(this, text_file3d, this.drewbox);
    return true;
  },
  save: function () {
    return (
      this.config.custom.save || this._save
    ).call(this, this.graph, this.drewbox);
  }
};
