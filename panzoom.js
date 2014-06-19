(function(window) {
  "use strict";

  function clamp(val, min, max) {
    if (val < min) return min;
    else if (val > max) return max;
    else return val;
  }

  function PanZoom() {
    this.pan = {
      x: 0,
      y: 0
    }; // units of the object being zoomed
    this.zoom = {
      x: 1,
      y: 1
    };
    this.pivot = [{
      x: -1,
      y: -1,
      id: -1
    }, {
      x: -1,
      y: -1,
      id: -1
    }];
    this.numPivots = 0;

    this.oldDistance = {
      x: -1,
      y: -1
    };
    this.oldPan = {
      x: -1,
      y: -1
    };
    this.oldZoom = {
      x: -1,
      y: -1
    };
    this.minZoom = {
      x: 1,
      y: 1
    };
    this.maxZoom = {
      x: 4,
      y: 4
    };
    this.minPax = {
      x: -1,
      y: -1
    };
    this.maxPax = {
      x: -1,
      y: -1
    };
    this.fixedAspect = true;

    this.zoomType = PanZoom.ZoomType.ZoomXY;
  }

  PanZoom.ZoomType = Object.freeze({
    ZoomX: 2,
    ZoomY: 4,
    ZoomXY: 6
  });

  PanZoom.prototype.setFixedApsect = function(trueFalse) {
    this.fixedAspect = trueFalse;
  }

  PanZoom.prototype.setZoomType = function(zoomType) {
    this.zoomType = zoomType;
  };

  PanZoom.prototype.syncPivots = function(x, y) {
    // sync only when the points are first created, so the zoom is always based on the delta from 
    // the start of the pinch, rather than a cummulative delta (which could have rounding error)
    var x1 = this.pivot[0].x;
    var y1 = this.pivot[0].y;
    var x2 = this.pivot[1].x;
    var y2 = this.pivot[1].y;

    if (x1 >= 0 && x2 >= 0) {
      this.oldDistance.x = x1 - x2;
      this.oldDistance.y = y1 - y2;
      this.oldPanX = ((x1 + x2) * 0.5 / this.zoom.x) - this.pan.x;
      this.oldPanY = ((y1 + y2) * 0.5 / this.zoom.y) - this.pan.y;
      this.oldZoomX = this.zoom.x;
      this.oldZoomY = this.zoom.y;
    }
  };

  PanZoom.prototype.setPivot = function(x, y, id) {
    id = id || 0;
    var pivot = this.getPivot(id);
    if (!pivot) {
      var created = false;
      for (var i = 0; i < this.pivot.length; ++i) {
        var pivot = this.pivot[i];
        if (pivot.x < 0) {
          pivot.id = id;
          this.numPivots++;
          created = true;
          break;
        }
      }
      if (!created)
        return; // no pivots available
    }

    pivot.x = x;
    pivot.y = y;
    this.syncPivots();
  };

  PanZoom.prototype.getPivot = function(id) {
    id = id || 0;
    for (var i = 0; i < this.pivot.length; ++i) {
      var pivot = this.pivot[i];
      if (pivot.id === id)
        return pivot;
    }

    return null;
  };

  PanZoom.prototype.numPivots = function() {
    return this.numPivots;
  };

  PanZoom.prototype.clearPivot = function(id) {
    id = id || 0;
    for (var i = 0; i < this.pivot.length; ++i) {
      var pivot = this.pivot[i];
      if (pivot.id === id) {
        pivot.x = -1;
        pivot.y = -1;
        pivot.id = -1;

        this.numPivots--;
        break;
      }
    }
  };

  PanZoom.prototype.movePivot = function(x, y, id) {
    id = id || 0;
    var pivot = this.getPivot(id);
    if (!pivot)
      return;

    if (this.numPivots === 1) {
      this.pan.x += (x - pivot.x) / this.zoom.x;
      this.pan.y += (y - pivot.y) / this.zoom.y;
      pivot.x = x;
      pivot.y = y;
    } else {
      pivot.x = x;
      pivot.y = y;
      this.updatePanZoom();
    }
  };

  PanZoom.prototype.updatePanZoom = function() {
    var x1 = this.pivot[0].x;
    var y1 = this.pivot[0].y;
    var x2 = this.pivot[1].x;
    var y2 = this.pivot[1].y;
    var newDistanceX = x1 - x2;
    var newDistanceY = y1 - y2;

    if (this.fixedAspect) {
      var oldDistance = Math.sqrt(this.oldDistance.x * this.oldDistance.x + this.oldDistance.y * this.oldDistance.y);
      var newDistance = Math.sqrt(newDistanceX * newDistanceX + newDistanceY * newDistanceY);
      this.zoom.x = clamp(this.oldZoomX * newDistance / oldDistance, this.minZoom.x, this.maxZoom.x);
      this.zoom.y = clamp(this.oldZoomY * newDistance / oldDistance, this.minZoom.y, this.maxZoom.y);
    } else {
      if (this.zoomType & PanZoom.ZoomType.ZoomX) {
        this.zoom.x = clamp(this.oldZoomX * newDistanceX / this.oldDistance.x, this.minZoom.x, this.maxZoom.x);
      }
      if (this.zoomType & PanZoom.ZoomType.ZoomY) {
        this.zoom.y = clamp(this.oldZoomY * newDistanceY / this.oldDistance.x, this.minZoom.y, this.maxZoom.y);
      }
    }

    var x = (x1 + x2) * 0.5;
    var y = (y1 + y2) * 0.5;
    this.pan.x = x / this.zoom.x - this.oldPanX;
    this.pan.y = y / this.zoom.y - this.oldPanY;
  };

  PanZoom.prototype.scaleZoom = function(sx, sy, x, y) {
    this.addZoom(this.zoom.x * (sx - 1), this.zoom.y * (sy - 1), x, y);
  };

  PanZoom.prototype.addZoom = function(ax, ay, x, y) {
    var oldX = x / this.zoom.x - this.pan.x;
    var oldY = y / this.zoom.y - this.pan.y;

    if (this.zoomType & (PanZoom.ZoomType.ZoomX | PanZoom.ZoomType.FixedAspect)) {
      this.zoom.x = clamp(this.zoom.x + ax, this.minZoom.x, this.maxZoom.x);
    }
    if (this.zoomType & (PanZoom.ZoomType.ZoomY | PanZoom.ZoomType.FixedAspect)) {
      this.zoom.y = clamp(this.zoom.y + ay, this.minZoom.y, this.maxZoom.y);
    }
    if (this.fixedAspect) {
      if (ax === 0) {
        this.zoom.x = this.zoom.y;
      } else {
        this.zoom.y = this.zoom.x;
      }
    }

    this.pan.x = x / this.zoom.x - oldX;
    this.pan.y = y / this.zoom.y - oldY;
  };

  PanZoom.prototype.setZoom = function(zx, zy) {
    this.zoom.x = clamp(zx, this.minZoom.x, this.maxZoom.x);
    this.zoom.y = clamp(zy, this.minZoom.y, this.maxZoom.y);
  };

  PanZoom.prototype.setPan = function(ox, oy) {
    this.pan.x = ox;
    this.pan.y = oy;
  };

  PanZoom.prototype.addPan = function(ox, oy) {
    this.pan.x += ox;
    this.pan.y += oy;
  };

  window.PanZoom = PanZoom;
})(window);