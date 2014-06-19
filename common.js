// Fisher-Yates sort
if (typeof Array.prototype.shuffle === "undefined") {
  Array.prototype.shuffle = function() {
    var i = this.length,
      j, temp;
    if (i == 0) return;
    while (--i) {
      j = Math.floor(Math.random() * (i + 1)); // add 1 because of --1 in while loop
      temp = this[i];
      this[i] = this[j];
      this[j] = temp;
    }
  };
}

// find polyfill
if (typeof Array.prototype.find === "undefined") {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      if (i in list) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          return value;
        }
      }
    }
    return undefined;
  };
}

if (typeof assert === "undefined") {
  assert = function(cond) {
    if (!cond)
      debugger;
  };
}

if (typeof Array.prototype.remove === "undefined") {
  Array.prototype.remove = function(val) {
    for (var i = this.length - 1; i >= 0; i--) {
      if (this[i] === val) {
        this.splice(i, 1);
        break;
      }
    }
  };
}

if (typeof Enum === "undefined") {
  Enum = function() {
    var self = {};
    var bitFlag = 1;
    for (var i = 0; i < arguments.length; i++, bitFlag *= 2) {
      self[arguments[i]] = bitFlag;
    }

    return Object.freeze(self); // return the 'self' object, instead of this function
  };
}

if (typeof clamp === "undefined") {
  clamp = function(val, min, max) {
    if (val < min)
      return min;
    else if (val > max)
      return max;
    else
      return val;
  }
}