// Copyright 2014 Reece Elliott

(function(window) {
  var DOUBLE_TAP_TIME_MS = 800;
  var MOUSE_CANCEL_TAP_DISTANCE = 10;
  var TOUCH_CANCEL_TAP_DISTANCE = 30;
  var HOLD_TIME_MS = 500;

  function InteractionHelper(elem, onPointerFunc) {
    this.elem = elem;
    this.onPointerFunc = onPointerFunc;
    this.tapTimeMS = 0;
    this.tapPosition = {
      x: -1,
      y: -1
    };

    var self = this;
    elem.addEventListener("mousedown", function(e) {
      self.mouseDown(e);
    });
    elem.addEventListener("touchstart", function(e) {
      self.touchStart(e);
    });
  }

  InteractionHelper.State = Object.freeze({
    Start: 2,
    Move: 3,
    End: 4,
    DoubleTap: 5,
    Held: 6
  });

  InteractionHelper.prototype.heldTimeout = function() {
    interactionEvent = {
      x: this.lastX,
      y: this.lastY,
      deltaX: 0,
      deltaY: 0,
      pinchDistance: 0,
      state: InteractionHelper.State.Held,
      target: this.elem,
      origin: this.elem
    };
    this.onPointerFunc(interactionEvent);
  };

  InteractionHelper.prototype.startHeldTimer = function() {
    clearTimeout(this.heldID);
    var self = this;
    this.heldID = setTimeout(function() {
      self.heldTimeout()
    }, HOLD_TIME_MS);
  };

  InteractionHelper.prototype.stopHeldTimer = function() {
    clearTimeout(this.heldID);
    this.heldID = 0;
  };

  InteractionHelper.prototype.mouseDown = function(e) {
    e.preventDefault();

    var self = this;
    this.mouseMoveHandler = function(e) {
      self.mouseMove(e)
    };
    this.mouseUpHandler = function(e) {
      self.mouseUp(e)
    };
    document.addEventListener("mousemove", this.mouseMoveHandler);
    document.addEventListener("mouseup", this.mouseUpHandler);

    var x = e.pageX - this.elem.offsetLeft;
    var y = e.pageY - this.elem.offsetTop;

    var doubleTap = false;
    var timeMS = Date.now();

    if (timeMS - this.tapTimeMS < DOUBLE_TAP_TIME_MS) {
      if (Math.abs(this.tapPosition.x - x) < MOUSE_CANCEL_TAP_DISTANCE &&
        Math.abs(this.tapPosition.y - y) < MOUSE_CANCEL_TAP_DISTANCE) {
        doubleTap = true;
        timeMS = 0;
      } else {
        if (this.tapTimeMS !== 0) {
          timeMS = 0;
        }
      }
    }
    this.startHeldTimer();
    this.tapTimeMS = timeMS;
    this.tapPosition.x = x;
    this.tapPosition.y = y;
    this.moveStarted = false;

    interactionEvent = {
      x: x,
      y: y,
      deltaX: 0,
      deltaY: 0,
      pinchDistance: 0,
      state: (doubleTap ? InteractionHelper.State.DoubleTap : InteractionHelper.State.Start),
      target: e.target,
      origin: this.elem
    };
    this.onPointerFunc(interactionEvent);
    this.lastX = x;
    this.lastY = y;
  };

  InteractionHelper.prototype.mouseMove = function(e) {
    e.preventDefault();

    var x = e.pageX - this.elem.offsetLeft;
    var y = e.pageY - this.elem.offsetTop;

    if (this.moveStarted ||
      Math.abs(x - this.lastX) >= MOUSE_CANCEL_TAP_DISTANCE ||
      Math.abs(y - this.lastY) >= MOUSE_CANCEL_TAP_DISTANCE) {
      this.stopHeldTimer();
      this.tapTimeMS = 0;
      this.moveStarted = true;

      interactionEvent = {
        x: x,
        y: y,
        deltaX: x - this.lastX,
        deltaY: y - this.lastY,
        pinchDistance: 0,
        state: InteractionHelper.State.Move,
        target: e.target,
        origin: this.elem
      };
      this.onPointerFunc(interactionEvent);
      this.lastX = x;
      this.lastY = y;
    }
  };

  InteractionHelper.prototype.mouseUp = function(e) {
    e.preventDefault();
    document.removeEventListener("mousemove", this.mouseMoveHandler);
    document.removeEventListener("mouseup", this.mouseUpHandler);

    var x = e.pageX - this.elem.offsetLeft;
    var y = e.pageY - this.elem.offsetTop;

    interactionEvent = {
      x: x,
      y: y,
      deltaX: x - this.lastX,
      deltaY: y - this.lastY,
      pinchDistance: 0,
      state: InteractionHelper.State.End,
      target: e.target,
      origin: this.elem
    };
    this.onPointerFunc(interactionEvent);
    this.lastX = 0;
    this.lastY = 0;
    this.stopHeldTimer();
  };

  InteractionHelper.prototype.getPinchInfo = function(e) {
    var touches = e.touches;
    if (touches.length === 0)
      touches = e.changedTouches;

    var x = 0;
    var y = 0;
    var distance = 0;

    if (touches.length >= 2) {
      var x2 = touches[1].pageX - this.elem.offsetLeft;
      var y2 = touches[1].pageY - this.elem.offsetTop;

      distance = Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y));
      x = (x2 + x) * 0.5;
      y = (y2 + y) * 0.5;
    } else if (touches.length == 1) {
      x = touches[0].pageX - this.elem.offsetLeft;
      y = touches[0].pageY - this.elem.offsetTop;
    }

    return {
      x: x,
      y: y,
      distance: distance
    };
  }

  InteractionHelper.prototype.touchStart = function(e) {
    e.preventDefault();

    var self = this;
    this.touchMoveHandler = function(e) {
      self.touchMove(e)
    };
    this.touchEndHandler = function(e) {
      self.touchEnd(e)
    };
    document.addEventListener("touchmove", this.touchMoveHandler);
    document.addEventListener("touchend", this.touchEndHandler);

    var pinch = this.getPinchInfo(e);
    var doubleTap = false;
    var timeMS = Date.now();

    if (timeMS - this.tapTimeMS < DOUBLE_TAP_TIME_MS) {
      if (Math.abs(this.tapPosition.x - pinch.x) < TOUCH_CANCEL_TAP_DISTANCE &&
        Math.abs(this.tapPosition.y - pinch.y) < TOUCH_CANCEL_TAP_DISTANCE) {
        doubleTap = true;
        timeMS = 0;
      } else {
        if (this.tapTimeMS !== 0)
          timeMS = 0;
      }
    }
    this.startHeldTimer();
    this.tapTimeMS = timeMS;
    this.tapPosition.x = pinch.x;
    this.tapPosition.y = pinch.y;
    this.moveStarted = false;

    interactionEvent = {
      x: pinch.x,
      y: pinch.y,
      deltaX: 0,
      deltaY: 0,
      pinchDistance: pinch.distance,
      state: (doubleTap ? InteractionHelper.State.DoubleTap : InteractionHelper.State.Start),
      target: e.target,
      origin: this.elem
    };
    this.onPointerFunc(interactionEvent);
    this.lastX = pinch.x;
    this.lastY = pinch.y;
  };

  InteractionHelper.prototype.touchMove = function(e) {
    e.preventDefault();

    var x = e.pageX - this.elem.offsetLeft;
    var y = e.pageY - this.elem.offsetTop;

    if (this.moveStarted ||
      Math.abs(x - this.lastX) > TOUCH_CANCEL_TAP_DISTANCE ||
      Math.abs(y - this.lastY) > TOUCH_CANCEL_TAP_DISTANCE) {
      this.moveStarted = true;
      var pinch = this.getPinchInfo(e);

      interactionEvent = {
        x: pinch.x,
        y: pinch.y,
        deltaX: x - this.lastX,
        deltaY: y - this.lastY,
        pinchDistance: pinch.distance,
        state: InteractionHelper.State.Move,
        target: e.target,
        origin: this.elem
      };
      this.onPointerFunc(interactionEvent);
      this.lastX = pinch.x;
      this.lastY = pinch.y;

      this.startHeldTimer();
      this.tapTimeMS = 0;
    }
  };

  InteractionHelper.prototype.touchEnd = function(e) {
    e.preventDefault();
    if (e.touches.length === 0) {
      document.removeEventListener("touchmove", this.touchMoveHandler);
      document.removeEventListener("touchup", this.touchEndHandler);
    }

    var x = e.pageX - this.elem.offsetLeft;
    var y = e.pageY - this.elem.offsetTop;

    var pinch = this.getPinchInfo(e);

    interactionEvent = {
      x: pinch.x,
      y: pinch.y,
      deltaX: x - this.lastX,
      deltaY: y - this.lastY,
      pinchDistance: pinch.distance,
      state: InteractionHelper.State.End,
      target: e.target,
      origin: this.elem
    };
    this.onPointerFunc(interactionEvent);
    this.lastX = 0;
    this.lastY = 0;
    this.stopHeldTimer();
  };

  // exports
  window.InteractionHelper = InteractionHelper;
})(window);