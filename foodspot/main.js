/*
Food Spot — bundled by esbuild. Source: src/ in this repository.
*/
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/leaflet/dist/leaflet-src.js
var require_leaflet_src = __commonJS({
  "node_modules/leaflet/dist/leaflet-src.js"(exports, module2) {
    (function(global, factory) {
      typeof exports === "object" && typeof module2 !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.leaflet = {}));
    })(exports, function(exports2) {
      "use strict";
      var version = "1.9.4";
      function extend(dest) {
        var i, j, len, src;
        for (j = 1, len = arguments.length; j < len; j++) {
          src = arguments[j];
          for (i in src) {
            dest[i] = src[i];
          }
        }
        return dest;
      }
      var create$2 = Object.create || /* @__PURE__ */ function() {
        function F() {
        }
        return function(proto) {
          F.prototype = proto;
          return new F();
        };
      }();
      function bind(fn, obj) {
        var slice = Array.prototype.slice;
        if (fn.bind) {
          return fn.bind.apply(fn, slice.call(arguments, 1));
        }
        var args = slice.call(arguments, 2);
        return function() {
          return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
        };
      }
      var lastId = 0;
      function stamp(obj) {
        if (!("_leaflet_id" in obj)) {
          obj["_leaflet_id"] = ++lastId;
        }
        return obj._leaflet_id;
      }
      function throttle2(fn, time, context) {
        var lock, args, wrapperFn, later;
        later = function() {
          lock = false;
          if (args) {
            wrapperFn.apply(context, args);
            args = false;
          }
        };
        wrapperFn = function() {
          if (lock) {
            args = arguments;
          } else {
            fn.apply(context, arguments);
            setTimeout(later, time);
            lock = true;
          }
        };
        return wrapperFn;
      }
      function wrapNum(x, range, includeMax) {
        var max = range[1], min = range[0], d = max - min;
        return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
      }
      function falseFn() {
        return false;
      }
      function formatNum(num2, precision) {
        if (precision === false) {
          return num2;
        }
        var pow = Math.pow(10, precision === void 0 ? 6 : precision);
        return Math.round(num2 * pow) / pow;
      }
      function trim(str) {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, "");
      }
      function splitWords(str) {
        return trim(str).split(/\s+/);
      }
      function setOptions(obj, options) {
        if (!Object.prototype.hasOwnProperty.call(obj, "options")) {
          obj.options = obj.options ? create$2(obj.options) : {};
        }
        for (var i in options) {
          obj.options[i] = options[i];
        }
        return obj.options;
      }
      function getParamString(obj, existingUrl, uppercase) {
        var params = [];
        for (var i in obj) {
          params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + "=" + encodeURIComponent(obj[i]));
        }
        return (!existingUrl || existingUrl.indexOf("?") === -1 ? "?" : "&") + params.join("&");
      }
      var templateRe = /\{ *([\w_ -]+) *\}/g;
      function template(str, data) {
        return str.replace(templateRe, function(str2, key) {
          var value = data[key];
          if (value === void 0) {
            throw new Error("No value provided for variable " + str2);
          } else if (typeof value === "function") {
            value = value(data);
          }
          return value;
        });
      }
      var isArray2 = Array.isArray || function(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
      };
      function indexOf(array, el) {
        for (var i = 0; i < array.length; i++) {
          if (array[i] === el) {
            return i;
          }
        }
        return -1;
      }
      var emptyImageUrl = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
      function getPrefixed(name) {
        return window["webkit" + name] || window["moz" + name] || window["ms" + name];
      }
      var lastTime = 0;
      function timeoutDefer(fn) {
        var time = +/* @__PURE__ */ new Date(), timeToCall = Math.max(0, 16 - (time - lastTime));
        lastTime = time + timeToCall;
        return window.setTimeout(fn, timeToCall);
      }
      var requestFn = window.requestAnimationFrame || getPrefixed("RequestAnimationFrame") || timeoutDefer;
      var cancelFn = window.cancelAnimationFrame || getPrefixed("CancelAnimationFrame") || getPrefixed("CancelRequestAnimationFrame") || function(id) {
        window.clearTimeout(id);
      };
      function requestAnimFrame(fn, context, immediate) {
        if (immediate && requestFn === timeoutDefer) {
          fn.call(context);
        } else {
          return requestFn.call(window, bind(fn, context));
        }
      }
      function cancelAnimFrame(id) {
        if (id) {
          cancelFn.call(window, id);
        }
      }
      var Util = {
        __proto__: null,
        extend,
        create: create$2,
        bind,
        get lastId() {
          return lastId;
        },
        stamp,
        throttle: throttle2,
        wrapNum,
        falseFn,
        formatNum,
        trim,
        splitWords,
        setOptions,
        getParamString,
        template,
        isArray: isArray2,
        indexOf,
        emptyImageUrl,
        requestFn,
        cancelFn,
        requestAnimFrame,
        cancelAnimFrame
      };
      function Class() {
      }
      Class.extend = function(props) {
        var NewClass = function() {
          setOptions(this);
          if (this.initialize) {
            this.initialize.apply(this, arguments);
          }
          this.callInitHooks();
        };
        var parentProto = NewClass.__super__ = this.prototype;
        var proto = create$2(parentProto);
        proto.constructor = NewClass;
        NewClass.prototype = proto;
        for (var i in this) {
          if (Object.prototype.hasOwnProperty.call(this, i) && i !== "prototype" && i !== "__super__") {
            NewClass[i] = this[i];
          }
        }
        if (props.statics) {
          extend(NewClass, props.statics);
        }
        if (props.includes) {
          checkDeprecatedMixinEvents(props.includes);
          extend.apply(null, [proto].concat(props.includes));
        }
        extend(proto, props);
        delete proto.statics;
        delete proto.includes;
        if (proto.options) {
          proto.options = parentProto.options ? create$2(parentProto.options) : {};
          extend(proto.options, props.options);
        }
        proto._initHooks = [];
        proto.callInitHooks = function() {
          if (this._initHooksCalled) {
            return;
          }
          if (parentProto.callInitHooks) {
            parentProto.callInitHooks.call(this);
          }
          this._initHooksCalled = true;
          for (var i2 = 0, len = proto._initHooks.length; i2 < len; i2++) {
            proto._initHooks[i2].call(this);
          }
        };
        return NewClass;
      };
      Class.include = function(props) {
        var parentOptions = this.prototype.options;
        extend(this.prototype, props);
        if (props.options) {
          this.prototype.options = parentOptions;
          this.mergeOptions(props.options);
        }
        return this;
      };
      Class.mergeOptions = function(options) {
        extend(this.prototype.options, options);
        return this;
      };
      Class.addInitHook = function(fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        var init = typeof fn === "function" ? fn : function() {
          this[fn].apply(this, args);
        };
        this.prototype._initHooks = this.prototype._initHooks || [];
        this.prototype._initHooks.push(init);
        return this;
      };
      function checkDeprecatedMixinEvents(includes) {
        if (typeof L === "undefined" || !L || !L.Mixin) {
          return;
        }
        includes = isArray2(includes) ? includes : [includes];
        for (var i = 0; i < includes.length; i++) {
          if (includes[i] === L.Mixin.Events) {
            console.warn("Deprecated include of L.Mixin.Events: this property will be removed in future releases, please inherit from L.Evented instead.", new Error().stack);
          }
        }
      }
      var Events = {
        /* @method on(type: String, fn: Function, context?: Object): this
         * Adds a listener function (`fn`) to a particular event type of the object. You can optionally specify the context of the listener (object the this keyword will point to). You can also pass several space-separated types (e.g. `'click dblclick'`).
         *
         * @alternative
         * @method on(eventMap: Object): this
         * Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
         */
        on: function(types, fn, context) {
          if (typeof types === "object") {
            for (var type in types) {
              this._on(type, types[type], fn);
            }
          } else {
            types = splitWords(types);
            for (var i = 0, len = types.length; i < len; i++) {
              this._on(types[i], fn, context);
            }
          }
          return this;
        },
        /* @method off(type: String, fn?: Function, context?: Object): this
         * Removes a previously added listener function. If no function is specified, it will remove all the listeners of that particular event from the object. Note that if you passed a custom context to `on`, you must pass the same context to `off` in order to remove the listener.
         *
         * @alternative
         * @method off(eventMap: Object): this
         * Removes a set of type/listener pairs.
         *
         * @alternative
         * @method off: this
         * Removes all listeners to all events on the object. This includes implicitly attached events.
         */
        off: function(types, fn, context) {
          if (!arguments.length) {
            delete this._events;
          } else if (typeof types === "object") {
            for (var type in types) {
              this._off(type, types[type], fn);
            }
          } else {
            types = splitWords(types);
            var removeAll = arguments.length === 1;
            for (var i = 0, len = types.length; i < len; i++) {
              if (removeAll) {
                this._off(types[i]);
              } else {
                this._off(types[i], fn, context);
              }
            }
          }
          return this;
        },
        // attach listener (without syntactic sugar now)
        _on: function(type, fn, context, _once) {
          if (typeof fn !== "function") {
            console.warn("wrong listener type: " + typeof fn);
            return;
          }
          if (this._listens(type, fn, context) !== false) {
            return;
          }
          if (context === this) {
            context = void 0;
          }
          var newListener = { fn, ctx: context };
          if (_once) {
            newListener.once = true;
          }
          this._events = this._events || {};
          this._events[type] = this._events[type] || [];
          this._events[type].push(newListener);
        },
        _off: function(type, fn, context) {
          var listeners, i, len;
          if (!this._events) {
            return;
          }
          listeners = this._events[type];
          if (!listeners) {
            return;
          }
          if (arguments.length === 1) {
            if (this._firingCount) {
              for (i = 0, len = listeners.length; i < len; i++) {
                listeners[i].fn = falseFn;
              }
            }
            delete this._events[type];
            return;
          }
          if (typeof fn !== "function") {
            console.warn("wrong listener type: " + typeof fn);
            return;
          }
          var index2 = this._listens(type, fn, context);
          if (index2 !== false) {
            var listener = listeners[index2];
            if (this._firingCount) {
              listener.fn = falseFn;
              this._events[type] = listeners = listeners.slice();
            }
            listeners.splice(index2, 1);
          }
        },
        // @method fire(type: String, data?: Object, propagate?: Boolean): this
        // Fires an event of the specified type. You can optionally provide a data
        // object — the first argument of the listener function will contain its
        // properties. The event can optionally be propagated to event parents.
        fire: function(type, data, propagate) {
          if (!this.listens(type, propagate)) {
            return this;
          }
          var event = extend({}, data, {
            type,
            target: this,
            sourceTarget: data && data.sourceTarget || this
          });
          if (this._events) {
            var listeners = this._events[type];
            if (listeners) {
              this._firingCount = this._firingCount + 1 || 1;
              for (var i = 0, len = listeners.length; i < len; i++) {
                var l = listeners[i];
                var fn = l.fn;
                if (l.once) {
                  this.off(type, fn, l.ctx);
                }
                fn.call(l.ctx || this, event);
              }
              this._firingCount--;
            }
          }
          if (propagate) {
            this._propagateEvent(event);
          }
          return this;
        },
        // @method listens(type: String, propagate?: Boolean): Boolean
        // @method listens(type: String, fn: Function, context?: Object, propagate?: Boolean): Boolean
        // Returns `true` if a particular event type has any listeners attached to it.
        // The verification can optionally be propagated, it will return `true` if parents have the listener attached to it.
        listens: function(type, fn, context, propagate) {
          if (typeof type !== "string") {
            console.warn('"string" type argument expected');
          }
          var _fn = fn;
          if (typeof fn !== "function") {
            propagate = !!fn;
            _fn = void 0;
            context = void 0;
          }
          var listeners = this._events && this._events[type];
          if (listeners && listeners.length) {
            if (this._listens(type, _fn, context) !== false) {
              return true;
            }
          }
          if (propagate) {
            for (var id in this._eventParents) {
              if (this._eventParents[id].listens(type, fn, context, propagate)) {
                return true;
              }
            }
          }
          return false;
        },
        // returns the index (number) or false
        _listens: function(type, fn, context) {
          if (!this._events) {
            return false;
          }
          var listeners = this._events[type] || [];
          if (!fn) {
            return !!listeners.length;
          }
          if (context === this) {
            context = void 0;
          }
          for (var i = 0, len = listeners.length; i < len; i++) {
            if (listeners[i].fn === fn && listeners[i].ctx === context) {
              return i;
            }
          }
          return false;
        },
        // @method once(…): this
        // Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
        once: function(types, fn, context) {
          if (typeof types === "object") {
            for (var type in types) {
              this._on(type, types[type], fn, true);
            }
          } else {
            types = splitWords(types);
            for (var i = 0, len = types.length; i < len; i++) {
              this._on(types[i], fn, context, true);
            }
          }
          return this;
        },
        // @method addEventParent(obj: Evented): this
        // Adds an event parent - an `Evented` that will receive propagated events
        addEventParent: function(obj) {
          this._eventParents = this._eventParents || {};
          this._eventParents[stamp(obj)] = obj;
          return this;
        },
        // @method removeEventParent(obj: Evented): this
        // Removes an event parent, so it will stop receiving propagated events
        removeEventParent: function(obj) {
          if (this._eventParents) {
            delete this._eventParents[stamp(obj)];
          }
          return this;
        },
        _propagateEvent: function(e) {
          for (var id in this._eventParents) {
            this._eventParents[id].fire(e.type, extend({
              layer: e.target,
              propagatedFrom: e.target
            }, e), true);
          }
        }
      };
      Events.addEventListener = Events.on;
      Events.removeEventListener = Events.clearAllEventListeners = Events.off;
      Events.addOneTimeEventListener = Events.once;
      Events.fireEvent = Events.fire;
      Events.hasEventListeners = Events.listens;
      var Evented = Class.extend(Events);
      function Point(x, y, round) {
        this.x = round ? Math.round(x) : x;
        this.y = round ? Math.round(y) : y;
      }
      var trunc = Math.trunc || function(v) {
        return v > 0 ? Math.floor(v) : Math.ceil(v);
      };
      Point.prototype = {
        // @method clone(): Point
        // Returns a copy of the current point.
        clone: function() {
          return new Point(this.x, this.y);
        },
        // @method add(otherPoint: Point): Point
        // Returns the result of addition of the current and the given points.
        add: function(point) {
          return this.clone()._add(toPoint(point));
        },
        _add: function(point) {
          this.x += point.x;
          this.y += point.y;
          return this;
        },
        // @method subtract(otherPoint: Point): Point
        // Returns the result of subtraction of the given point from the current.
        subtract: function(point) {
          return this.clone()._subtract(toPoint(point));
        },
        _subtract: function(point) {
          this.x -= point.x;
          this.y -= point.y;
          return this;
        },
        // @method divideBy(num: Number): Point
        // Returns the result of division of the current point by the given number.
        divideBy: function(num2) {
          return this.clone()._divideBy(num2);
        },
        _divideBy: function(num2) {
          this.x /= num2;
          this.y /= num2;
          return this;
        },
        // @method multiplyBy(num: Number): Point
        // Returns the result of multiplication of the current point by the given number.
        multiplyBy: function(num2) {
          return this.clone()._multiplyBy(num2);
        },
        _multiplyBy: function(num2) {
          this.x *= num2;
          this.y *= num2;
          return this;
        },
        // @method scaleBy(scale: Point): Point
        // Multiply each coordinate of the current point by each coordinate of
        // `scale`. In linear algebra terms, multiply the point by the
        // [scaling matrix](https://en.wikipedia.org/wiki/Scaling_%28geometry%29#Matrix_representation)
        // defined by `scale`.
        scaleBy: function(point) {
          return new Point(this.x * point.x, this.y * point.y);
        },
        // @method unscaleBy(scale: Point): Point
        // Inverse of `scaleBy`. Divide each coordinate of the current point by
        // each coordinate of `scale`.
        unscaleBy: function(point) {
          return new Point(this.x / point.x, this.y / point.y);
        },
        // @method round(): Point
        // Returns a copy of the current point with rounded coordinates.
        round: function() {
          return this.clone()._round();
        },
        _round: function() {
          this.x = Math.round(this.x);
          this.y = Math.round(this.y);
          return this;
        },
        // @method floor(): Point
        // Returns a copy of the current point with floored coordinates (rounded down).
        floor: function() {
          return this.clone()._floor();
        },
        _floor: function() {
          this.x = Math.floor(this.x);
          this.y = Math.floor(this.y);
          return this;
        },
        // @method ceil(): Point
        // Returns a copy of the current point with ceiled coordinates (rounded up).
        ceil: function() {
          return this.clone()._ceil();
        },
        _ceil: function() {
          this.x = Math.ceil(this.x);
          this.y = Math.ceil(this.y);
          return this;
        },
        // @method trunc(): Point
        // Returns a copy of the current point with truncated coordinates (rounded towards zero).
        trunc: function() {
          return this.clone()._trunc();
        },
        _trunc: function() {
          this.x = trunc(this.x);
          this.y = trunc(this.y);
          return this;
        },
        // @method distanceTo(otherPoint: Point): Number
        // Returns the cartesian distance between the current and the given points.
        distanceTo: function(point) {
          point = toPoint(point);
          var x = point.x - this.x, y = point.y - this.y;
          return Math.sqrt(x * x + y * y);
        },
        // @method equals(otherPoint: Point): Boolean
        // Returns `true` if the given point has the same coordinates.
        equals: function(point) {
          point = toPoint(point);
          return point.x === this.x && point.y === this.y;
        },
        // @method contains(otherPoint: Point): Boolean
        // Returns `true` if both coordinates of the given point are less than the corresponding current point coordinates (in absolute values).
        contains: function(point) {
          point = toPoint(point);
          return Math.abs(point.x) <= Math.abs(this.x) && Math.abs(point.y) <= Math.abs(this.y);
        },
        // @method toString(): String
        // Returns a string representation of the point for debugging purposes.
        toString: function() {
          return "Point(" + formatNum(this.x) + ", " + formatNum(this.y) + ")";
        }
      };
      function toPoint(x, y, round) {
        if (x instanceof Point) {
          return x;
        }
        if (isArray2(x)) {
          return new Point(x[0], x[1]);
        }
        if (x === void 0 || x === null) {
          return x;
        }
        if (typeof x === "object" && "x" in x && "y" in x) {
          return new Point(x.x, x.y);
        }
        return new Point(x, y, round);
      }
      function Bounds(a, b) {
        if (!a) {
          return;
        }
        var points = b ? [a, b] : a;
        for (var i = 0, len = points.length; i < len; i++) {
          this.extend(points[i]);
        }
      }
      Bounds.prototype = {
        // @method extend(point: Point): this
        // Extends the bounds to contain the given point.
        // @alternative
        // @method extend(otherBounds: Bounds): this
        // Extend the bounds to contain the given bounds
        extend: function(obj) {
          var min2, max2;
          if (!obj) {
            return this;
          }
          if (obj instanceof Point || typeof obj[0] === "number" || "x" in obj) {
            min2 = max2 = toPoint(obj);
          } else {
            obj = toBounds(obj);
            min2 = obj.min;
            max2 = obj.max;
            if (!min2 || !max2) {
              return this;
            }
          }
          if (!this.min && !this.max) {
            this.min = min2.clone();
            this.max = max2.clone();
          } else {
            this.min.x = Math.min(min2.x, this.min.x);
            this.max.x = Math.max(max2.x, this.max.x);
            this.min.y = Math.min(min2.y, this.min.y);
            this.max.y = Math.max(max2.y, this.max.y);
          }
          return this;
        },
        // @method getCenter(round?: Boolean): Point
        // Returns the center point of the bounds.
        getCenter: function(round) {
          return toPoint(
            (this.min.x + this.max.x) / 2,
            (this.min.y + this.max.y) / 2,
            round
          );
        },
        // @method getBottomLeft(): Point
        // Returns the bottom-left point of the bounds.
        getBottomLeft: function() {
          return toPoint(this.min.x, this.max.y);
        },
        // @method getTopRight(): Point
        // Returns the top-right point of the bounds.
        getTopRight: function() {
          return toPoint(this.max.x, this.min.y);
        },
        // @method getTopLeft(): Point
        // Returns the top-left point of the bounds (i.e. [`this.min`](#bounds-min)).
        getTopLeft: function() {
          return this.min;
        },
        // @method getBottomRight(): Point
        // Returns the bottom-right point of the bounds (i.e. [`this.max`](#bounds-max)).
        getBottomRight: function() {
          return this.max;
        },
        // @method getSize(): Point
        // Returns the size of the given bounds
        getSize: function() {
          return this.max.subtract(this.min);
        },
        // @method contains(otherBounds: Bounds): Boolean
        // Returns `true` if the rectangle contains the given one.
        // @alternative
        // @method contains(point: Point): Boolean
        // Returns `true` if the rectangle contains the given point.
        contains: function(obj) {
          var min, max;
          if (typeof obj[0] === "number" || obj instanceof Point) {
            obj = toPoint(obj);
          } else {
            obj = toBounds(obj);
          }
          if (obj instanceof Bounds) {
            min = obj.min;
            max = obj.max;
          } else {
            min = max = obj;
          }
          return min.x >= this.min.x && max.x <= this.max.x && min.y >= this.min.y && max.y <= this.max.y;
        },
        // @method intersects(otherBounds: Bounds): Boolean
        // Returns `true` if the rectangle intersects the given bounds. Two bounds
        // intersect if they have at least one point in common.
        intersects: function(bounds) {
          bounds = toBounds(bounds);
          var min = this.min, max = this.max, min2 = bounds.min, max2 = bounds.max, xIntersects = max2.x >= min.x && min2.x <= max.x, yIntersects = max2.y >= min.y && min2.y <= max.y;
          return xIntersects && yIntersects;
        },
        // @method overlaps(otherBounds: Bounds): Boolean
        // Returns `true` if the rectangle overlaps the given bounds. Two bounds
        // overlap if their intersection is an area.
        overlaps: function(bounds) {
          bounds = toBounds(bounds);
          var min = this.min, max = this.max, min2 = bounds.min, max2 = bounds.max, xOverlaps = max2.x > min.x && min2.x < max.x, yOverlaps = max2.y > min.y && min2.y < max.y;
          return xOverlaps && yOverlaps;
        },
        // @method isValid(): Boolean
        // Returns `true` if the bounds are properly initialized.
        isValid: function() {
          return !!(this.min && this.max);
        },
        // @method pad(bufferRatio: Number): Bounds
        // Returns bounds created by extending or retracting the current bounds by a given ratio in each direction.
        // For example, a ratio of 0.5 extends the bounds by 50% in each direction.
        // Negative values will retract the bounds.
        pad: function(bufferRatio) {
          var min = this.min, max = this.max, heightBuffer = Math.abs(min.x - max.x) * bufferRatio, widthBuffer = Math.abs(min.y - max.y) * bufferRatio;
          return toBounds(
            toPoint(min.x - heightBuffer, min.y - widthBuffer),
            toPoint(max.x + heightBuffer, max.y + widthBuffer)
          );
        },
        // @method equals(otherBounds: Bounds): Boolean
        // Returns `true` if the rectangle is equivalent to the given bounds.
        equals: function(bounds) {
          if (!bounds) {
            return false;
          }
          bounds = toBounds(bounds);
          return this.min.equals(bounds.getTopLeft()) && this.max.equals(bounds.getBottomRight());
        }
      };
      function toBounds(a, b) {
        if (!a || a instanceof Bounds) {
          return a;
        }
        return new Bounds(a, b);
      }
      function LatLngBounds(corner1, corner2) {
        if (!corner1) {
          return;
        }
        var latlngs = corner2 ? [corner1, corner2] : corner1;
        for (var i = 0, len = latlngs.length; i < len; i++) {
          this.extend(latlngs[i]);
        }
      }
      LatLngBounds.prototype = {
        // @method extend(latlng: LatLng): this
        // Extend the bounds to contain the given point
        // @alternative
        // @method extend(otherBounds: LatLngBounds): this
        // Extend the bounds to contain the given bounds
        extend: function(obj) {
          var sw = this._southWest, ne = this._northEast, sw2, ne2;
          if (obj instanceof LatLng) {
            sw2 = obj;
            ne2 = obj;
          } else if (obj instanceof LatLngBounds) {
            sw2 = obj._southWest;
            ne2 = obj._northEast;
            if (!sw2 || !ne2) {
              return this;
            }
          } else {
            return obj ? this.extend(toLatLng(obj) || toLatLngBounds(obj)) : this;
          }
          if (!sw && !ne) {
            this._southWest = new LatLng(sw2.lat, sw2.lng);
            this._northEast = new LatLng(ne2.lat, ne2.lng);
          } else {
            sw.lat = Math.min(sw2.lat, sw.lat);
            sw.lng = Math.min(sw2.lng, sw.lng);
            ne.lat = Math.max(ne2.lat, ne.lat);
            ne.lng = Math.max(ne2.lng, ne.lng);
          }
          return this;
        },
        // @method pad(bufferRatio: Number): LatLngBounds
        // Returns bounds created by extending or retracting the current bounds by a given ratio in each direction.
        // For example, a ratio of 0.5 extends the bounds by 50% in each direction.
        // Negative values will retract the bounds.
        pad: function(bufferRatio) {
          var sw = this._southWest, ne = this._northEast, heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio, widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;
          return new LatLngBounds(
            new LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),
            new LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer)
          );
        },
        // @method getCenter(): LatLng
        // Returns the center point of the bounds.
        getCenter: function() {
          return new LatLng(
            (this._southWest.lat + this._northEast.lat) / 2,
            (this._southWest.lng + this._northEast.lng) / 2
          );
        },
        // @method getSouthWest(): LatLng
        // Returns the south-west point of the bounds.
        getSouthWest: function() {
          return this._southWest;
        },
        // @method getNorthEast(): LatLng
        // Returns the north-east point of the bounds.
        getNorthEast: function() {
          return this._northEast;
        },
        // @method getNorthWest(): LatLng
        // Returns the north-west point of the bounds.
        getNorthWest: function() {
          return new LatLng(this.getNorth(), this.getWest());
        },
        // @method getSouthEast(): LatLng
        // Returns the south-east point of the bounds.
        getSouthEast: function() {
          return new LatLng(this.getSouth(), this.getEast());
        },
        // @method getWest(): Number
        // Returns the west longitude of the bounds
        getWest: function() {
          return this._southWest.lng;
        },
        // @method getSouth(): Number
        // Returns the south latitude of the bounds
        getSouth: function() {
          return this._southWest.lat;
        },
        // @method getEast(): Number
        // Returns the east longitude of the bounds
        getEast: function() {
          return this._northEast.lng;
        },
        // @method getNorth(): Number
        // Returns the north latitude of the bounds
        getNorth: function() {
          return this._northEast.lat;
        },
        // @method contains(otherBounds: LatLngBounds): Boolean
        // Returns `true` if the rectangle contains the given one.
        // @alternative
        // @method contains (latlng: LatLng): Boolean
        // Returns `true` if the rectangle contains the given point.
        contains: function(obj) {
          if (typeof obj[0] === "number" || obj instanceof LatLng || "lat" in obj) {
            obj = toLatLng(obj);
          } else {
            obj = toLatLngBounds(obj);
          }
          var sw = this._southWest, ne = this._northEast, sw2, ne2;
          if (obj instanceof LatLngBounds) {
            sw2 = obj.getSouthWest();
            ne2 = obj.getNorthEast();
          } else {
            sw2 = ne2 = obj;
          }
          return sw2.lat >= sw.lat && ne2.lat <= ne.lat && sw2.lng >= sw.lng && ne2.lng <= ne.lng;
        },
        // @method intersects(otherBounds: LatLngBounds): Boolean
        // Returns `true` if the rectangle intersects the given bounds. Two bounds intersect if they have at least one point in common.
        intersects: function(bounds) {
          bounds = toLatLngBounds(bounds);
          var sw = this._southWest, ne = this._northEast, sw2 = bounds.getSouthWest(), ne2 = bounds.getNorthEast(), latIntersects = ne2.lat >= sw.lat && sw2.lat <= ne.lat, lngIntersects = ne2.lng >= sw.lng && sw2.lng <= ne.lng;
          return latIntersects && lngIntersects;
        },
        // @method overlaps(otherBounds: LatLngBounds): Boolean
        // Returns `true` if the rectangle overlaps the given bounds. Two bounds overlap if their intersection is an area.
        overlaps: function(bounds) {
          bounds = toLatLngBounds(bounds);
          var sw = this._southWest, ne = this._northEast, sw2 = bounds.getSouthWest(), ne2 = bounds.getNorthEast(), latOverlaps = ne2.lat > sw.lat && sw2.lat < ne.lat, lngOverlaps = ne2.lng > sw.lng && sw2.lng < ne.lng;
          return latOverlaps && lngOverlaps;
        },
        // @method toBBoxString(): String
        // Returns a string with bounding box coordinates in a 'southwest_lng,southwest_lat,northeast_lng,northeast_lat' format. Useful for sending requests to web services that return geo data.
        toBBoxString: function() {
          return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(",");
        },
        // @method equals(otherBounds: LatLngBounds, maxMargin?: Number): Boolean
        // Returns `true` if the rectangle is equivalent (within a small margin of error) to the given bounds. The margin of error can be overridden by setting `maxMargin` to a small number.
        equals: function(bounds, maxMargin) {
          if (!bounds) {
            return false;
          }
          bounds = toLatLngBounds(bounds);
          return this._southWest.equals(bounds.getSouthWest(), maxMargin) && this._northEast.equals(bounds.getNorthEast(), maxMargin);
        },
        // @method isValid(): Boolean
        // Returns `true` if the bounds are properly initialized.
        isValid: function() {
          return !!(this._southWest && this._northEast);
        }
      };
      function toLatLngBounds(a, b) {
        if (a instanceof LatLngBounds) {
          return a;
        }
        return new LatLngBounds(a, b);
      }
      function LatLng(lat, lng, alt) {
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error("Invalid LatLng object: (" + lat + ", " + lng + ")");
        }
        this.lat = +lat;
        this.lng = +lng;
        if (alt !== void 0) {
          this.alt = +alt;
        }
      }
      LatLng.prototype = {
        // @method equals(otherLatLng: LatLng, maxMargin?: Number): Boolean
        // Returns `true` if the given `LatLng` point is at the same position (within a small margin of error). The margin of error can be overridden by setting `maxMargin` to a small number.
        equals: function(obj, maxMargin) {
          if (!obj) {
            return false;
          }
          obj = toLatLng(obj);
          var margin = Math.max(
            Math.abs(this.lat - obj.lat),
            Math.abs(this.lng - obj.lng)
          );
          return margin <= (maxMargin === void 0 ? 1e-9 : maxMargin);
        },
        // @method toString(): String
        // Returns a string representation of the point (for debugging purposes).
        toString: function(precision) {
          return "LatLng(" + formatNum(this.lat, precision) + ", " + formatNum(this.lng, precision) + ")";
        },
        // @method distanceTo(otherLatLng: LatLng): Number
        // Returns the distance (in meters) to the given `LatLng` calculated using the [Spherical Law of Cosines](https://en.wikipedia.org/wiki/Spherical_law_of_cosines).
        distanceTo: function(other) {
          return Earth.distance(this, toLatLng(other));
        },
        // @method wrap(): LatLng
        // Returns a new `LatLng` object with the longitude wrapped so it's always between -180 and +180 degrees.
        wrap: function() {
          return Earth.wrapLatLng(this);
        },
        // @method toBounds(sizeInMeters: Number): LatLngBounds
        // Returns a new `LatLngBounds` object in which each boundary is `sizeInMeters/2` meters apart from the `LatLng`.
        toBounds: function(sizeInMeters) {
          var latAccuracy = 180 * sizeInMeters / 40075017, lngAccuracy = latAccuracy / Math.cos(Math.PI / 180 * this.lat);
          return toLatLngBounds(
            [this.lat - latAccuracy, this.lng - lngAccuracy],
            [this.lat + latAccuracy, this.lng + lngAccuracy]
          );
        },
        clone: function() {
          return new LatLng(this.lat, this.lng, this.alt);
        }
      };
      function toLatLng(a, b, c) {
        if (a instanceof LatLng) {
          return a;
        }
        if (isArray2(a) && typeof a[0] !== "object") {
          if (a.length === 3) {
            return new LatLng(a[0], a[1], a[2]);
          }
          if (a.length === 2) {
            return new LatLng(a[0], a[1]);
          }
          return null;
        }
        if (a === void 0 || a === null) {
          return a;
        }
        if (typeof a === "object" && "lat" in a) {
          return new LatLng(a.lat, "lng" in a ? a.lng : a.lon, a.alt);
        }
        if (b === void 0) {
          return null;
        }
        return new LatLng(a, b, c);
      }
      var CRS = {
        // @method latLngToPoint(latlng: LatLng, zoom: Number): Point
        // Projects geographical coordinates into pixel coordinates for a given zoom.
        latLngToPoint: function(latlng, zoom2) {
          var projectedPoint = this.projection.project(latlng), scale2 = this.scale(zoom2);
          return this.transformation._transform(projectedPoint, scale2);
        },
        // @method pointToLatLng(point: Point, zoom: Number): LatLng
        // The inverse of `latLngToPoint`. Projects pixel coordinates on a given
        // zoom into geographical coordinates.
        pointToLatLng: function(point, zoom2) {
          var scale2 = this.scale(zoom2), untransformedPoint = this.transformation.untransform(point, scale2);
          return this.projection.unproject(untransformedPoint);
        },
        // @method project(latlng: LatLng): Point
        // Projects geographical coordinates into coordinates in units accepted for
        // this CRS (e.g. meters for EPSG:3857, for passing it to WMS services).
        project: function(latlng) {
          return this.projection.project(latlng);
        },
        // @method unproject(point: Point): LatLng
        // Given a projected coordinate returns the corresponding LatLng.
        // The inverse of `project`.
        unproject: function(point) {
          return this.projection.unproject(point);
        },
        // @method scale(zoom: Number): Number
        // Returns the scale used when transforming projected coordinates into
        // pixel coordinates for a particular zoom. For example, it returns
        // `256 * 2^zoom` for Mercator-based CRS.
        scale: function(zoom2) {
          return 256 * Math.pow(2, zoom2);
        },
        // @method zoom(scale: Number): Number
        // Inverse of `scale()`, returns the zoom level corresponding to a scale
        // factor of `scale`.
        zoom: function(scale2) {
          return Math.log(scale2 / 256) / Math.LN2;
        },
        // @method getProjectedBounds(zoom: Number): Bounds
        // Returns the projection's bounds scaled and transformed for the provided `zoom`.
        getProjectedBounds: function(zoom2) {
          if (this.infinite) {
            return null;
          }
          var b = this.projection.bounds, s = this.scale(zoom2), min = this.transformation.transform(b.min, s), max = this.transformation.transform(b.max, s);
          return new Bounds(min, max);
        },
        // @method distance(latlng1: LatLng, latlng2: LatLng): Number
        // Returns the distance between two geographical coordinates.
        // @property code: String
        // Standard code name of the CRS passed into WMS services (e.g. `'EPSG:3857'`)
        //
        // @property wrapLng: Number[]
        // An array of two numbers defining whether the longitude (horizontal) coordinate
        // axis wraps around a given range and how. Defaults to `[-180, 180]` in most
        // geographical CRSs. If `undefined`, the longitude axis does not wrap around.
        //
        // @property wrapLat: Number[]
        // Like `wrapLng`, but for the latitude (vertical) axis.
        // wrapLng: [min, max],
        // wrapLat: [min, max],
        // @property infinite: Boolean
        // If true, the coordinate space will be unbounded (infinite in both axes)
        infinite: false,
        // @method wrapLatLng(latlng: LatLng): LatLng
        // Returns a `LatLng` where lat and lng has been wrapped according to the
        // CRS's `wrapLat` and `wrapLng` properties, if they are outside the CRS's bounds.
        wrapLatLng: function(latlng) {
          var lng = this.wrapLng ? wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng, lat = this.wrapLat ? wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat, alt = latlng.alt;
          return new LatLng(lat, lng, alt);
        },
        // @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
        // Returns a `LatLngBounds` with the same size as the given one, ensuring
        // that its center is within the CRS's bounds.
        // Only accepts actual `L.LatLngBounds` instances, not arrays.
        wrapLatLngBounds: function(bounds) {
          var center = bounds.getCenter(), newCenter = this.wrapLatLng(center), latShift = center.lat - newCenter.lat, lngShift = center.lng - newCenter.lng;
          if (latShift === 0 && lngShift === 0) {
            return bounds;
          }
          var sw = bounds.getSouthWest(), ne = bounds.getNorthEast(), newSw = new LatLng(sw.lat - latShift, sw.lng - lngShift), newNe = new LatLng(ne.lat - latShift, ne.lng - lngShift);
          return new LatLngBounds(newSw, newNe);
        }
      };
      var Earth = extend({}, CRS, {
        wrapLng: [-180, 180],
        // Mean Earth Radius, as recommended for use by
        // the International Union of Geodesy and Geophysics,
        // see https://rosettacode.org/wiki/Haversine_formula
        R: 6371e3,
        // distance between two geographical points using spherical law of cosines approximation
        distance: function(latlng1, latlng2) {
          var rad = Math.PI / 180, lat1 = latlng1.lat * rad, lat2 = latlng2.lat * rad, sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2), sinDLon = Math.sin((latlng2.lng - latlng1.lng) * rad / 2), a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon, c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return this.R * c;
        }
      });
      var earthRadius = 6378137;
      var SphericalMercator = {
        R: earthRadius,
        MAX_LATITUDE: 85.0511287798,
        project: function(latlng) {
          var d = Math.PI / 180, max = this.MAX_LATITUDE, lat = Math.max(Math.min(max, latlng.lat), -max), sin = Math.sin(lat * d);
          return new Point(
            this.R * latlng.lng * d,
            this.R * Math.log((1 + sin) / (1 - sin)) / 2
          );
        },
        unproject: function(point) {
          var d = 180 / Math.PI;
          return new LatLng(
            (2 * Math.atan(Math.exp(point.y / this.R)) - Math.PI / 2) * d,
            point.x * d / this.R
          );
        },
        bounds: function() {
          var d = earthRadius * Math.PI;
          return new Bounds([-d, -d], [d, d]);
        }()
      };
      function Transformation(a, b, c, d) {
        if (isArray2(a)) {
          this._a = a[0];
          this._b = a[1];
          this._c = a[2];
          this._d = a[3];
          return;
        }
        this._a = a;
        this._b = b;
        this._c = c;
        this._d = d;
      }
      Transformation.prototype = {
        // @method transform(point: Point, scale?: Number): Point
        // Returns a transformed point, optionally multiplied by the given scale.
        // Only accepts actual `L.Point` instances, not arrays.
        transform: function(point, scale2) {
          return this._transform(point.clone(), scale2);
        },
        // destructive transform (faster)
        _transform: function(point, scale2) {
          scale2 = scale2 || 1;
          point.x = scale2 * (this._a * point.x + this._b);
          point.y = scale2 * (this._c * point.y + this._d);
          return point;
        },
        // @method untransform(point: Point, scale?: Number): Point
        // Returns the reverse transformation of the given point, optionally divided
        // by the given scale. Only accepts actual `L.Point` instances, not arrays.
        untransform: function(point, scale2) {
          scale2 = scale2 || 1;
          return new Point(
            (point.x / scale2 - this._b) / this._a,
            (point.y / scale2 - this._d) / this._c
          );
        }
      };
      function toTransformation(a, b, c, d) {
        return new Transformation(a, b, c, d);
      }
      var EPSG3857 = extend({}, Earth, {
        code: "EPSG:3857",
        projection: SphericalMercator,
        transformation: function() {
          var scale2 = 0.5 / (Math.PI * SphericalMercator.R);
          return toTransformation(scale2, 0.5, -scale2, 0.5);
        }()
      });
      var EPSG900913 = extend({}, EPSG3857, {
        code: "EPSG:900913"
      });
      function svgCreate(name) {
        return document.createElementNS("http://www.w3.org/2000/svg", name);
      }
      function pointsToPath(rings, closed) {
        var str = "", i, j, len, len2, points, p;
        for (i = 0, len = rings.length; i < len; i++) {
          points = rings[i];
          for (j = 0, len2 = points.length; j < len2; j++) {
            p = points[j];
            str += (j ? "L" : "M") + p.x + " " + p.y;
          }
          str += closed ? Browser.svg ? "z" : "x" : "";
        }
        return str || "M0 0";
      }
      var style = document.documentElement.style;
      var ie = "ActiveXObject" in window;
      var ielt9 = ie && !document.addEventListener;
      var edge = "msLaunchUri" in navigator && !("documentMode" in document);
      var webkit = userAgentContains("webkit");
      var android = userAgentContains("android");
      var android23 = userAgentContains("android 2") || userAgentContains("android 3");
      var webkitVer = parseInt(/WebKit\/([0-9]+)|$/.exec(navigator.userAgent)[1], 10);
      var androidStock = android && userAgentContains("Google") && webkitVer < 537 && !("AudioNode" in window);
      var opera = !!window.opera;
      var chrome = !edge && userAgentContains("chrome");
      var gecko = userAgentContains("gecko") && !webkit && !opera && !ie;
      var safari = !chrome && userAgentContains("safari");
      var phantom = userAgentContains("phantom");
      var opera12 = "OTransition" in style;
      var win = navigator.platform.indexOf("Win") === 0;
      var ie3d = ie && "transition" in style;
      var webkit3d = "WebKitCSSMatrix" in window && "m11" in new window.WebKitCSSMatrix() && !android23;
      var gecko3d = "MozPerspective" in style;
      var any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d) && !opera12 && !phantom;
      var mobile = typeof orientation !== "undefined" || userAgentContains("mobile");
      var mobileWebkit = mobile && webkit;
      var mobileWebkit3d = mobile && webkit3d;
      var msPointer = !window.PointerEvent && window.MSPointerEvent;
      var pointer = !!(window.PointerEvent || msPointer);
      var touchNative = "ontouchstart" in window || !!window.TouchEvent;
      var touch = !window.L_NO_TOUCH && (touchNative || pointer);
      var mobileOpera = mobile && opera;
      var mobileGecko = mobile && gecko;
      var retina = (window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI) > 1;
      var passiveEvents = function() {
        var supportsPassiveOption = false;
        try {
          var opts = Object.defineProperty({}, "passive", {
            get: function() {
              supportsPassiveOption = true;
            }
          });
          window.addEventListener("testPassiveEventSupport", falseFn, opts);
          window.removeEventListener("testPassiveEventSupport", falseFn, opts);
        } catch (e) {
        }
        return supportsPassiveOption;
      }();
      var canvas$1 = function() {
        return !!document.createElement("canvas").getContext;
      }();
      var svg$1 = !!(document.createElementNS && svgCreate("svg").createSVGRect);
      var inlineSvg = !!svg$1 && function() {
        var div = document.createElement("div");
        div.innerHTML = "<svg/>";
        return (div.firstChild && div.firstChild.namespaceURI) === "http://www.w3.org/2000/svg";
      }();
      var vml = !svg$1 && function() {
        try {
          var div = document.createElement("div");
          div.innerHTML = '<v:shape adj="1"/>';
          var shape = div.firstChild;
          shape.style.behavior = "url(#default#VML)";
          return shape && typeof shape.adj === "object";
        } catch (e) {
          return false;
        }
      }();
      var mac = navigator.platform.indexOf("Mac") === 0;
      var linux = navigator.platform.indexOf("Linux") === 0;
      function userAgentContains(str) {
        return navigator.userAgent.toLowerCase().indexOf(str) >= 0;
      }
      var Browser = {
        ie,
        ielt9,
        edge,
        webkit,
        android,
        android23,
        androidStock,
        opera,
        chrome,
        gecko,
        safari,
        phantom,
        opera12,
        win,
        ie3d,
        webkit3d,
        gecko3d,
        any3d,
        mobile,
        mobileWebkit,
        mobileWebkit3d,
        msPointer,
        pointer,
        touch,
        touchNative,
        mobileOpera,
        mobileGecko,
        retina,
        passiveEvents,
        canvas: canvas$1,
        svg: svg$1,
        vml,
        inlineSvg,
        mac,
        linux
      };
      var POINTER_DOWN = Browser.msPointer ? "MSPointerDown" : "pointerdown";
      var POINTER_MOVE = Browser.msPointer ? "MSPointerMove" : "pointermove";
      var POINTER_UP = Browser.msPointer ? "MSPointerUp" : "pointerup";
      var POINTER_CANCEL = Browser.msPointer ? "MSPointerCancel" : "pointercancel";
      var pEvent = {
        touchstart: POINTER_DOWN,
        touchmove: POINTER_MOVE,
        touchend: POINTER_UP,
        touchcancel: POINTER_CANCEL
      };
      var handle = {
        touchstart: _onPointerStart,
        touchmove: _handlePointer,
        touchend: _handlePointer,
        touchcancel: _handlePointer
      };
      var _pointers = {};
      var _pointerDocListener = false;
      function addPointerListener(obj, type, handler) {
        if (type === "touchstart") {
          _addPointerDocListener();
        }
        if (!handle[type]) {
          console.warn("wrong event specified:", type);
          return falseFn;
        }
        handler = handle[type].bind(this, handler);
        obj.addEventListener(pEvent[type], handler, false);
        return handler;
      }
      function removePointerListener(obj, type, handler) {
        if (!pEvent[type]) {
          console.warn("wrong event specified:", type);
          return;
        }
        obj.removeEventListener(pEvent[type], handler, false);
      }
      function _globalPointerDown(e) {
        _pointers[e.pointerId] = e;
      }
      function _globalPointerMove(e) {
        if (_pointers[e.pointerId]) {
          _pointers[e.pointerId] = e;
        }
      }
      function _globalPointerUp(e) {
        delete _pointers[e.pointerId];
      }
      function _addPointerDocListener() {
        if (!_pointerDocListener) {
          document.addEventListener(POINTER_DOWN, _globalPointerDown, true);
          document.addEventListener(POINTER_MOVE, _globalPointerMove, true);
          document.addEventListener(POINTER_UP, _globalPointerUp, true);
          document.addEventListener(POINTER_CANCEL, _globalPointerUp, true);
          _pointerDocListener = true;
        }
      }
      function _handlePointer(handler, e) {
        if (e.pointerType === (e.MSPOINTER_TYPE_MOUSE || "mouse")) {
          return;
        }
        e.touches = [];
        for (var i in _pointers) {
          e.touches.push(_pointers[i]);
        }
        e.changedTouches = [e];
        handler(e);
      }
      function _onPointerStart(handler, e) {
        if (e.MSPOINTER_TYPE_TOUCH && e.pointerType === e.MSPOINTER_TYPE_TOUCH) {
          preventDefault(e);
        }
        _handlePointer(handler, e);
      }
      function makeDblclick(event) {
        var newEvent = {}, prop, i;
        for (i in event) {
          prop = event[i];
          newEvent[i] = prop && prop.bind ? prop.bind(event) : prop;
        }
        event = newEvent;
        newEvent.type = "dblclick";
        newEvent.detail = 2;
        newEvent.isTrusted = false;
        newEvent._simulated = true;
        return newEvent;
      }
      var delay = 200;
      function addDoubleTapListener(obj, handler) {
        obj.addEventListener("dblclick", handler);
        var last = 0, detail;
        function simDblclick(e) {
          if (e.detail !== 1) {
            detail = e.detail;
            return;
          }
          if (e.pointerType === "mouse" || e.sourceCapabilities && !e.sourceCapabilities.firesTouchEvents) {
            return;
          }
          var path = getPropagationPath(e);
          if (path.some(function(el) {
            return el instanceof HTMLLabelElement && el.attributes.for;
          }) && !path.some(function(el) {
            return el instanceof HTMLInputElement || el instanceof HTMLSelectElement;
          })) {
            return;
          }
          var now = Date.now();
          if (now - last <= delay) {
            detail++;
            if (detail === 2) {
              handler(makeDblclick(e));
            }
          } else {
            detail = 1;
          }
          last = now;
        }
        obj.addEventListener("click", simDblclick);
        return {
          dblclick: handler,
          simDblclick
        };
      }
      function removeDoubleTapListener(obj, handlers) {
        obj.removeEventListener("dblclick", handlers.dblclick);
        obj.removeEventListener("click", handlers.simDblclick);
      }
      var TRANSFORM = testProp(
        ["transform", "webkitTransform", "OTransform", "MozTransform", "msTransform"]
      );
      var TRANSITION = testProp(
        ["webkitTransition", "transition", "OTransition", "MozTransition", "msTransition"]
      );
      var TRANSITION_END = TRANSITION === "webkitTransition" || TRANSITION === "OTransition" ? TRANSITION + "End" : "transitionend";
      function get2(id) {
        return typeof id === "string" ? document.getElementById(id) : id;
      }
      function getStyle(el, style2) {
        var value = el.style[style2] || el.currentStyle && el.currentStyle[style2];
        if ((!value || value === "auto") && document.defaultView) {
          var css = document.defaultView.getComputedStyle(el, null);
          value = css ? css[style2] : null;
        }
        return value === "auto" ? null : value;
      }
      function create$1(tagName, className, container) {
        var el = document.createElement(tagName);
        el.className = className || "";
        if (container) {
          container.appendChild(el);
        }
        return el;
      }
      function remove(el) {
        var parent = el.parentNode;
        if (parent) {
          parent.removeChild(el);
        }
      }
      function empty(el) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
      }
      function toFront(el) {
        var parent = el.parentNode;
        if (parent && parent.lastChild !== el) {
          parent.appendChild(el);
        }
      }
      function toBack(el) {
        var parent = el.parentNode;
        if (parent && parent.firstChild !== el) {
          parent.insertBefore(el, parent.firstChild);
        }
      }
      function hasClass(el, name) {
        if (el.classList !== void 0) {
          return el.classList.contains(name);
        }
        var className = getClass(el);
        return className.length > 0 && new RegExp("(^|\\s)" + name + "(\\s|$)").test(className);
      }
      function addClass(el, name) {
        if (el.classList !== void 0) {
          var classes = splitWords(name);
          for (var i = 0, len = classes.length; i < len; i++) {
            el.classList.add(classes[i]);
          }
        } else if (!hasClass(el, name)) {
          var className = getClass(el);
          setClass(el, (className ? className + " " : "") + name);
        }
      }
      function removeClass(el, name) {
        if (el.classList !== void 0) {
          el.classList.remove(name);
        } else {
          setClass(el, trim((" " + getClass(el) + " ").replace(" " + name + " ", " ")));
        }
      }
      function setClass(el, name) {
        if (el.className.baseVal === void 0) {
          el.className = name;
        } else {
          el.className.baseVal = name;
        }
      }
      function getClass(el) {
        if (el.correspondingElement) {
          el = el.correspondingElement;
        }
        return el.className.baseVal === void 0 ? el.className : el.className.baseVal;
      }
      function setOpacity(el, value) {
        if ("opacity" in el.style) {
          el.style.opacity = value;
        } else if ("filter" in el.style) {
          _setOpacityIE(el, value);
        }
      }
      function _setOpacityIE(el, value) {
        var filter = false, filterName = "DXImageTransform.Microsoft.Alpha";
        try {
          filter = el.filters.item(filterName);
        } catch (e) {
          if (value === 1) {
            return;
          }
        }
        value = Math.round(value * 100);
        if (filter) {
          filter.Enabled = value !== 100;
          filter.Opacity = value;
        } else {
          el.style.filter += " progid:" + filterName + "(opacity=" + value + ")";
        }
      }
      function testProp(props) {
        var style2 = document.documentElement.style;
        for (var i = 0; i < props.length; i++) {
          if (props[i] in style2) {
            return props[i];
          }
        }
        return false;
      }
      function setTransform(el, offset, scale2) {
        var pos = offset || new Point(0, 0);
        el.style[TRANSFORM] = (Browser.ie3d ? "translate(" + pos.x + "px," + pos.y + "px)" : "translate3d(" + pos.x + "px," + pos.y + "px,0)") + (scale2 ? " scale(" + scale2 + ")" : "");
      }
      function setPosition(el, point) {
        el._leaflet_pos = point;
        if (Browser.any3d) {
          setTransform(el, point);
        } else {
          el.style.left = point.x + "px";
          el.style.top = point.y + "px";
        }
      }
      function getPosition(el) {
        return el._leaflet_pos || new Point(0, 0);
      }
      var disableTextSelection;
      var enableTextSelection;
      var _userSelect;
      if ("onselectstart" in document) {
        disableTextSelection = function() {
          on(window, "selectstart", preventDefault);
        };
        enableTextSelection = function() {
          off(window, "selectstart", preventDefault);
        };
      } else {
        var userSelectProperty = testProp(
          ["userSelect", "WebkitUserSelect", "OUserSelect", "MozUserSelect", "msUserSelect"]
        );
        disableTextSelection = function() {
          if (userSelectProperty) {
            var style2 = document.documentElement.style;
            _userSelect = style2[userSelectProperty];
            style2[userSelectProperty] = "none";
          }
        };
        enableTextSelection = function() {
          if (userSelectProperty) {
            document.documentElement.style[userSelectProperty] = _userSelect;
            _userSelect = void 0;
          }
        };
      }
      function disableImageDrag() {
        on(window, "dragstart", preventDefault);
      }
      function enableImageDrag() {
        off(window, "dragstart", preventDefault);
      }
      var _outlineElement, _outlineStyle;
      function preventOutline(element) {
        while (element.tabIndex === -1) {
          element = element.parentNode;
        }
        if (!element.style) {
          return;
        }
        restoreOutline();
        _outlineElement = element;
        _outlineStyle = element.style.outlineStyle;
        element.style.outlineStyle = "none";
        on(window, "keydown", restoreOutline);
      }
      function restoreOutline() {
        if (!_outlineElement) {
          return;
        }
        _outlineElement.style.outlineStyle = _outlineStyle;
        _outlineElement = void 0;
        _outlineStyle = void 0;
        off(window, "keydown", restoreOutline);
      }
      function getSizedParentNode(element) {
        do {
          element = element.parentNode;
        } while ((!element.offsetWidth || !element.offsetHeight) && element !== document.body);
        return element;
      }
      function getScale(element) {
        var rect = element.getBoundingClientRect();
        return {
          x: rect.width / element.offsetWidth || 1,
          y: rect.height / element.offsetHeight || 1,
          boundingClientRect: rect
        };
      }
      var DomUtil = {
        __proto__: null,
        TRANSFORM,
        TRANSITION,
        TRANSITION_END,
        get: get2,
        getStyle,
        create: create$1,
        remove,
        empty,
        toFront,
        toBack,
        hasClass,
        addClass,
        removeClass,
        setClass,
        getClass,
        setOpacity,
        testProp,
        setTransform,
        setPosition,
        getPosition,
        get disableTextSelection() {
          return disableTextSelection;
        },
        get enableTextSelection() {
          return enableTextSelection;
        },
        disableImageDrag,
        enableImageDrag,
        preventOutline,
        restoreOutline,
        getSizedParentNode,
        getScale
      };
      function on(obj, types, fn, context) {
        if (types && typeof types === "object") {
          for (var type in types) {
            addOne(obj, type, types[type], fn);
          }
        } else {
          types = splitWords(types);
          for (var i = 0, len = types.length; i < len; i++) {
            addOne(obj, types[i], fn, context);
          }
        }
        return this;
      }
      var eventsKey = "_leaflet_events";
      function off(obj, types, fn, context) {
        if (arguments.length === 1) {
          batchRemove(obj);
          delete obj[eventsKey];
        } else if (types && typeof types === "object") {
          for (var type in types) {
            removeOne(obj, type, types[type], fn);
          }
        } else {
          types = splitWords(types);
          if (arguments.length === 2) {
            batchRemove(obj, function(type2) {
              return indexOf(types, type2) !== -1;
            });
          } else {
            for (var i = 0, len = types.length; i < len; i++) {
              removeOne(obj, types[i], fn, context);
            }
          }
        }
        return this;
      }
      function batchRemove(obj, filterFn) {
        for (var id in obj[eventsKey]) {
          var type = id.split(/\d/)[0];
          if (!filterFn || filterFn(type)) {
            removeOne(obj, type, null, null, id);
          }
        }
      }
      var mouseSubst = {
        mouseenter: "mouseover",
        mouseleave: "mouseout",
        wheel: !("onwheel" in window) && "mousewheel"
      };
      function addOne(obj, type, fn, context) {
        var id = type + stamp(fn) + (context ? "_" + stamp(context) : "");
        if (obj[eventsKey] && obj[eventsKey][id]) {
          return this;
        }
        var handler = function(e) {
          return fn.call(context || obj, e || window.event);
        };
        var originalHandler = handler;
        if (!Browser.touchNative && Browser.pointer && type.indexOf("touch") === 0) {
          handler = addPointerListener(obj, type, handler);
        } else if (Browser.touch && type === "dblclick") {
          handler = addDoubleTapListener(obj, handler);
        } else if ("addEventListener" in obj) {
          if (type === "touchstart" || type === "touchmove" || type === "wheel" || type === "mousewheel") {
            obj.addEventListener(mouseSubst[type] || type, handler, Browser.passiveEvents ? { passive: false } : false);
          } else if (type === "mouseenter" || type === "mouseleave") {
            handler = function(e) {
              e = e || window.event;
              if (isExternalTarget(obj, e)) {
                originalHandler(e);
              }
            };
            obj.addEventListener(mouseSubst[type], handler, false);
          } else {
            obj.addEventListener(type, originalHandler, false);
          }
        } else {
          obj.attachEvent("on" + type, handler);
        }
        obj[eventsKey] = obj[eventsKey] || {};
        obj[eventsKey][id] = handler;
      }
      function removeOne(obj, type, fn, context, id) {
        id = id || type + stamp(fn) + (context ? "_" + stamp(context) : "");
        var handler = obj[eventsKey] && obj[eventsKey][id];
        if (!handler) {
          return this;
        }
        if (!Browser.touchNative && Browser.pointer && type.indexOf("touch") === 0) {
          removePointerListener(obj, type, handler);
        } else if (Browser.touch && type === "dblclick") {
          removeDoubleTapListener(obj, handler);
        } else if ("removeEventListener" in obj) {
          obj.removeEventListener(mouseSubst[type] || type, handler, false);
        } else {
          obj.detachEvent("on" + type, handler);
        }
        obj[eventsKey][id] = null;
      }
      function stopPropagation(e) {
        if (e.stopPropagation) {
          e.stopPropagation();
        } else if (e.originalEvent) {
          e.originalEvent._stopped = true;
        } else {
          e.cancelBubble = true;
        }
        return this;
      }
      function disableScrollPropagation(el) {
        addOne(el, "wheel", stopPropagation);
        return this;
      }
      function disableClickPropagation(el) {
        on(el, "mousedown touchstart dblclick contextmenu", stopPropagation);
        el["_leaflet_disable_click"] = true;
        return this;
      }
      function preventDefault(e) {
        if (e.preventDefault) {
          e.preventDefault();
        } else {
          e.returnValue = false;
        }
        return this;
      }
      function stop(e) {
        preventDefault(e);
        stopPropagation(e);
        return this;
      }
      function getPropagationPath(ev) {
        if (ev.composedPath) {
          return ev.composedPath();
        }
        var path = [];
        var el = ev.target;
        while (el) {
          path.push(el);
          el = el.parentNode;
        }
        return path;
      }
      function getMousePosition(e, container) {
        if (!container) {
          return new Point(e.clientX, e.clientY);
        }
        var scale2 = getScale(container), offset = scale2.boundingClientRect;
        return new Point(
          // offset.left/top values are in page scale (like clientX/Y),
          // whereas clientLeft/Top (border width) values are the original values (before CSS scale applies).
          (e.clientX - offset.left) / scale2.x - container.clientLeft,
          (e.clientY - offset.top) / scale2.y - container.clientTop
        );
      }
      var wheelPxFactor = Browser.linux && Browser.chrome ? window.devicePixelRatio : Browser.mac ? window.devicePixelRatio * 3 : window.devicePixelRatio > 0 ? 2 * window.devicePixelRatio : 1;
      function getWheelDelta(e) {
        return Browser.edge ? e.wheelDeltaY / 2 : (
          // Don't trust window-geometry-based delta
          e.deltaY && e.deltaMode === 0 ? -e.deltaY / wheelPxFactor : (
            // Pixels
            e.deltaY && e.deltaMode === 1 ? -e.deltaY * 20 : (
              // Lines
              e.deltaY && e.deltaMode === 2 ? -e.deltaY * 60 : (
                // Pages
                e.deltaX || e.deltaZ ? 0 : (
                  // Skip horizontal/depth wheel events
                  e.wheelDelta ? (e.wheelDeltaY || e.wheelDelta) / 2 : (
                    // Legacy IE pixels
                    e.detail && Math.abs(e.detail) < 32765 ? -e.detail * 20 : (
                      // Legacy Moz lines
                      e.detail ? e.detail / -32765 * 60 : (
                        // Legacy Moz pages
                        0
                      )
                    )
                  )
                )
              )
            )
          )
        );
      }
      function isExternalTarget(el, e) {
        var related = e.relatedTarget;
        if (!related) {
          return true;
        }
        try {
          while (related && related !== el) {
            related = related.parentNode;
          }
        } catch (err) {
          return false;
        }
        return related !== el;
      }
      var DomEvent = {
        __proto__: null,
        on,
        off,
        stopPropagation,
        disableScrollPropagation,
        disableClickPropagation,
        preventDefault,
        stop,
        getPropagationPath,
        getMousePosition,
        getWheelDelta,
        isExternalTarget,
        addListener: on,
        removeListener: off
      };
      var PosAnimation = Evented.extend({
        // @method run(el: HTMLElement, newPos: Point, duration?: Number, easeLinearity?: Number)
        // Run an animation of a given element to a new position, optionally setting
        // duration in seconds (`0.25` by default) and easing linearity factor (3rd
        // argument of the [cubic bezier curve](https://cubic-bezier.com/#0,0,.5,1),
        // `0.5` by default).
        run: function(el, newPos, duration, easeLinearity) {
          this.stop();
          this._el = el;
          this._inProgress = true;
          this._duration = duration || 0.25;
          this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);
          this._startPos = getPosition(el);
          this._offset = newPos.subtract(this._startPos);
          this._startTime = +/* @__PURE__ */ new Date();
          this.fire("start");
          this._animate();
        },
        // @method stop()
        // Stops the animation (if currently running).
        stop: function() {
          if (!this._inProgress) {
            return;
          }
          this._step(true);
          this._complete();
        },
        _animate: function() {
          this._animId = requestAnimFrame(this._animate, this);
          this._step();
        },
        _step: function(round) {
          var elapsed = +/* @__PURE__ */ new Date() - this._startTime, duration = this._duration * 1e3;
          if (elapsed < duration) {
            this._runFrame(this._easeOut(elapsed / duration), round);
          } else {
            this._runFrame(1);
            this._complete();
          }
        },
        _runFrame: function(progress, round) {
          var pos = this._startPos.add(this._offset.multiplyBy(progress));
          if (round) {
            pos._round();
          }
          setPosition(this._el, pos);
          this.fire("step");
        },
        _complete: function() {
          cancelAnimFrame(this._animId);
          this._inProgress = false;
          this.fire("end");
        },
        _easeOut: function(t) {
          return 1 - Math.pow(1 - t, this._easeOutPower);
        }
      });
      var Map2 = Evented.extend({
        options: {
          // @section Map State Options
          // @option crs: CRS = L.CRS.EPSG3857
          // The [Coordinate Reference System](#crs) to use. Don't change this if you're not
          // sure what it means.
          crs: EPSG3857,
          // @option center: LatLng = undefined
          // Initial geographic center of the map
          center: void 0,
          // @option zoom: Number = undefined
          // Initial map zoom level
          zoom: void 0,
          // @option minZoom: Number = *
          // Minimum zoom level of the map.
          // If not specified and at least one `GridLayer` or `TileLayer` is in the map,
          // the lowest of their `minZoom` options will be used instead.
          minZoom: void 0,
          // @option maxZoom: Number = *
          // Maximum zoom level of the map.
          // If not specified and at least one `GridLayer` or `TileLayer` is in the map,
          // the highest of their `maxZoom` options will be used instead.
          maxZoom: void 0,
          // @option layers: Layer[] = []
          // Array of layers that will be added to the map initially
          layers: [],
          // @option maxBounds: LatLngBounds = null
          // When this option is set, the map restricts the view to the given
          // geographical bounds, bouncing the user back if the user tries to pan
          // outside the view. To set the restriction dynamically, use
          // [`setMaxBounds`](#map-setmaxbounds) method.
          maxBounds: void 0,
          // @option renderer: Renderer = *
          // The default method for drawing vector layers on the map. `L.SVG`
          // or `L.Canvas` by default depending on browser support.
          renderer: void 0,
          // @section Animation Options
          // @option zoomAnimation: Boolean = true
          // Whether the map zoom animation is enabled. By default it's enabled
          // in all browsers that support CSS3 Transitions except Android.
          zoomAnimation: true,
          // @option zoomAnimationThreshold: Number = 4
          // Won't animate zoom if the zoom difference exceeds this value.
          zoomAnimationThreshold: 4,
          // @option fadeAnimation: Boolean = true
          // Whether the tile fade animation is enabled. By default it's enabled
          // in all browsers that support CSS3 Transitions except Android.
          fadeAnimation: true,
          // @option markerZoomAnimation: Boolean = true
          // Whether markers animate their zoom with the zoom animation, if disabled
          // they will disappear for the length of the animation. By default it's
          // enabled in all browsers that support CSS3 Transitions except Android.
          markerZoomAnimation: true,
          // @option transform3DLimit: Number = 2^23
          // Defines the maximum size of a CSS translation transform. The default
          // value should not be changed unless a web browser positions layers in
          // the wrong place after doing a large `panBy`.
          transform3DLimit: 8388608,
          // Precision limit of a 32-bit float
          // @section Interaction Options
          // @option zoomSnap: Number = 1
          // Forces the map's zoom level to always be a multiple of this, particularly
          // right after a [`fitBounds()`](#map-fitbounds) or a pinch-zoom.
          // By default, the zoom level snaps to the nearest integer; lower values
          // (e.g. `0.5` or `0.1`) allow for greater granularity. A value of `0`
          // means the zoom level will not be snapped after `fitBounds` or a pinch-zoom.
          zoomSnap: 1,
          // @option zoomDelta: Number = 1
          // Controls how much the map's zoom level will change after a
          // [`zoomIn()`](#map-zoomin), [`zoomOut()`](#map-zoomout), pressing `+`
          // or `-` on the keyboard, or using the [zoom controls](#control-zoom).
          // Values smaller than `1` (e.g. `0.5`) allow for greater granularity.
          zoomDelta: 1,
          // @option trackResize: Boolean = true
          // Whether the map automatically handles browser window resize to update itself.
          trackResize: true
        },
        initialize: function(id, options) {
          options = setOptions(this, options);
          this._handlers = [];
          this._layers = {};
          this._zoomBoundLayers = {};
          this._sizeChanged = true;
          this._initContainer(id);
          this._initLayout();
          this._onResize = bind(this._onResize, this);
          this._initEvents();
          if (options.maxBounds) {
            this.setMaxBounds(options.maxBounds);
          }
          if (options.zoom !== void 0) {
            this._zoom = this._limitZoom(options.zoom);
          }
          if (options.center && options.zoom !== void 0) {
            this.setView(toLatLng(options.center), options.zoom, { reset: true });
          }
          this.callInitHooks();
          this._zoomAnimated = TRANSITION && Browser.any3d && !Browser.mobileOpera && this.options.zoomAnimation;
          if (this._zoomAnimated) {
            this._createAnimProxy();
            on(this._proxy, TRANSITION_END, this._catchTransitionEnd, this);
          }
          this._addLayers(this.options.layers);
        },
        // @section Methods for modifying map state
        // @method setView(center: LatLng, zoom: Number, options?: Zoom/pan options): this
        // Sets the view of the map (geographical center and zoom) with the given
        // animation options.
        setView: function(center, zoom2, options) {
          zoom2 = zoom2 === void 0 ? this._zoom : this._limitZoom(zoom2);
          center = this._limitCenter(toLatLng(center), zoom2, this.options.maxBounds);
          options = options || {};
          this._stop();
          if (this._loaded && !options.reset && options !== true) {
            if (options.animate !== void 0) {
              options.zoom = extend({ animate: options.animate }, options.zoom);
              options.pan = extend({ animate: options.animate, duration: options.duration }, options.pan);
            }
            var moved = this._zoom !== zoom2 ? this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom2, options.zoom) : this._tryAnimatedPan(center, options.pan);
            if (moved) {
              clearTimeout(this._sizeTimer);
              return this;
            }
          }
          this._resetView(center, zoom2, options.pan && options.pan.noMoveStart);
          return this;
        },
        // @method setZoom(zoom: Number, options?: Zoom/pan options): this
        // Sets the zoom of the map.
        setZoom: function(zoom2, options) {
          if (!this._loaded) {
            this._zoom = zoom2;
            return this;
          }
          return this.setView(this.getCenter(), zoom2, { zoom: options });
        },
        // @method zoomIn(delta?: Number, options?: Zoom options): this
        // Increases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
        zoomIn: function(delta, options) {
          delta = delta || (Browser.any3d ? this.options.zoomDelta : 1);
          return this.setZoom(this._zoom + delta, options);
        },
        // @method zoomOut(delta?: Number, options?: Zoom options): this
        // Decreases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
        zoomOut: function(delta, options) {
          delta = delta || (Browser.any3d ? this.options.zoomDelta : 1);
          return this.setZoom(this._zoom - delta, options);
        },
        // @method setZoomAround(latlng: LatLng, zoom: Number, options: Zoom options): this
        // Zooms the map while keeping a specified geographical point on the map
        // stationary (e.g. used internally for scroll zoom and double-click zoom).
        // @alternative
        // @method setZoomAround(offset: Point, zoom: Number, options: Zoom options): this
        // Zooms the map while keeping a specified pixel on the map (relative to the top-left corner) stationary.
        setZoomAround: function(latlng, zoom2, options) {
          var scale2 = this.getZoomScale(zoom2), viewHalf = this.getSize().divideBy(2), containerPoint = latlng instanceof Point ? latlng : this.latLngToContainerPoint(latlng), centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale2), newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));
          return this.setView(newCenter, zoom2, { zoom: options });
        },
        _getBoundsCenterZoom: function(bounds, options) {
          options = options || {};
          bounds = bounds.getBounds ? bounds.getBounds() : toLatLngBounds(bounds);
          var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]), paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]), zoom2 = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));
          zoom2 = typeof options.maxZoom === "number" ? Math.min(options.maxZoom, zoom2) : zoom2;
          if (zoom2 === Infinity) {
            return {
              center: bounds.getCenter(),
              zoom: zoom2
            };
          }
          var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2), swPoint = this.project(bounds.getSouthWest(), zoom2), nePoint = this.project(bounds.getNorthEast(), zoom2), center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom2);
          return {
            center,
            zoom: zoom2
          };
        },
        // @method fitBounds(bounds: LatLngBounds, options?: fitBounds options): this
        // Sets a map view that contains the given geographical bounds with the
        // maximum zoom level possible.
        fitBounds: function(bounds, options) {
          bounds = toLatLngBounds(bounds);
          if (!bounds.isValid()) {
            throw new Error("Bounds are not valid.");
          }
          var target = this._getBoundsCenterZoom(bounds, options);
          return this.setView(target.center, target.zoom, options);
        },
        // @method fitWorld(options?: fitBounds options): this
        // Sets a map view that mostly contains the whole world with the maximum
        // zoom level possible.
        fitWorld: function(options) {
          return this.fitBounds([[-90, -180], [90, 180]], options);
        },
        // @method panTo(latlng: LatLng, options?: Pan options): this
        // Pans the map to a given center.
        panTo: function(center, options) {
          return this.setView(center, this._zoom, { pan: options });
        },
        // @method panBy(offset: Point, options?: Pan options): this
        // Pans the map by a given number of pixels (animated).
        panBy: function(offset, options) {
          offset = toPoint(offset).round();
          options = options || {};
          if (!offset.x && !offset.y) {
            return this.fire("moveend");
          }
          if (options.animate !== true && !this.getSize().contains(offset)) {
            this._resetView(this.unproject(this.project(this.getCenter()).add(offset)), this.getZoom());
            return this;
          }
          if (!this._panAnim) {
            this._panAnim = new PosAnimation();
            this._panAnim.on({
              "step": this._onPanTransitionStep,
              "end": this._onPanTransitionEnd
            }, this);
          }
          if (!options.noMoveStart) {
            this.fire("movestart");
          }
          if (options.animate !== false) {
            addClass(this._mapPane, "leaflet-pan-anim");
            var newPos = this._getMapPanePos().subtract(offset).round();
            this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
          } else {
            this._rawPanBy(offset);
            this.fire("move").fire("moveend");
          }
          return this;
        },
        // @method flyTo(latlng: LatLng, zoom?: Number, options?: Zoom/pan options): this
        // Sets the view of the map (geographical center and zoom) performing a smooth
        // pan-zoom animation.
        flyTo: function(targetCenter, targetZoom, options) {
          options = options || {};
          if (options.animate === false || !Browser.any3d) {
            return this.setView(targetCenter, targetZoom, options);
          }
          this._stop();
          var from = this.project(this.getCenter()), to = this.project(targetCenter), size = this.getSize(), startZoom = this._zoom;
          targetCenter = toLatLng(targetCenter);
          targetZoom = targetZoom === void 0 ? startZoom : targetZoom;
          var w0 = Math.max(size.x, size.y), w1 = w0 * this.getZoomScale(startZoom, targetZoom), u1 = to.distanceTo(from) || 1, rho = 1.42, rho2 = rho * rho;
          function r(i) {
            var s1 = i ? -1 : 1, s2 = i ? w1 : w0, t1 = w1 * w1 - w0 * w0 + s1 * rho2 * rho2 * u1 * u1, b1 = 2 * s2 * rho2 * u1, b = t1 / b1, sq = Math.sqrt(b * b + 1) - b;
            var log = sq < 1e-9 ? -18 : Math.log(sq);
            return log;
          }
          function sinh(n) {
            return (Math.exp(n) - Math.exp(-n)) / 2;
          }
          function cosh(n) {
            return (Math.exp(n) + Math.exp(-n)) / 2;
          }
          function tanh(n) {
            return sinh(n) / cosh(n);
          }
          var r0 = r(0);
          function w(s) {
            return w0 * (cosh(r0) / cosh(r0 + rho * s));
          }
          function u(s) {
            return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2;
          }
          function easeOut(t) {
            return 1 - Math.pow(1 - t, 1.5);
          }
          var start = Date.now(), S = (r(1) - r0) / rho, duration = options.duration ? 1e3 * options.duration : 1e3 * S * 0.8;
          function frame() {
            var t = (Date.now() - start) / duration, s = easeOut(t) * S;
            if (t <= 1) {
              this._flyToFrame = requestAnimFrame(frame, this);
              this._move(
                this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom),
                this.getScaleZoom(w0 / w(s), startZoom),
                { flyTo: true }
              );
            } else {
              this._move(targetCenter, targetZoom)._moveEnd(true);
            }
          }
          this._moveStart(true, options.noMoveStart);
          frame.call(this);
          return this;
        },
        // @method flyToBounds(bounds: LatLngBounds, options?: fitBounds options): this
        // Sets the view of the map with a smooth animation like [`flyTo`](#map-flyto),
        // but takes a bounds parameter like [`fitBounds`](#map-fitbounds).
        flyToBounds: function(bounds, options) {
          var target = this._getBoundsCenterZoom(bounds, options);
          return this.flyTo(target.center, target.zoom, options);
        },
        // @method setMaxBounds(bounds: LatLngBounds): this
        // Restricts the map view to the given bounds (see the [maxBounds](#map-maxbounds) option).
        setMaxBounds: function(bounds) {
          bounds = toLatLngBounds(bounds);
          if (this.listens("moveend", this._panInsideMaxBounds)) {
            this.off("moveend", this._panInsideMaxBounds);
          }
          if (!bounds.isValid()) {
            this.options.maxBounds = null;
            return this;
          }
          this.options.maxBounds = bounds;
          if (this._loaded) {
            this._panInsideMaxBounds();
          }
          return this.on("moveend", this._panInsideMaxBounds);
        },
        // @method setMinZoom(zoom: Number): this
        // Sets the lower limit for the available zoom levels (see the [minZoom](#map-minzoom) option).
        setMinZoom: function(zoom2) {
          var oldZoom = this.options.minZoom;
          this.options.minZoom = zoom2;
          if (this._loaded && oldZoom !== zoom2) {
            this.fire("zoomlevelschange");
            if (this.getZoom() < this.options.minZoom) {
              return this.setZoom(zoom2);
            }
          }
          return this;
        },
        // @method setMaxZoom(zoom: Number): this
        // Sets the upper limit for the available zoom levels (see the [maxZoom](#map-maxzoom) option).
        setMaxZoom: function(zoom2) {
          var oldZoom = this.options.maxZoom;
          this.options.maxZoom = zoom2;
          if (this._loaded && oldZoom !== zoom2) {
            this.fire("zoomlevelschange");
            if (this.getZoom() > this.options.maxZoom) {
              return this.setZoom(zoom2);
            }
          }
          return this;
        },
        // @method panInsideBounds(bounds: LatLngBounds, options?: Pan options): this
        // Pans the map to the closest view that would lie inside the given bounds (if it's not already), controlling the animation using the options specific, if any.
        panInsideBounds: function(bounds, options) {
          this._enforcingBounds = true;
          var center = this.getCenter(), newCenter = this._limitCenter(center, this._zoom, toLatLngBounds(bounds));
          if (!center.equals(newCenter)) {
            this.panTo(newCenter, options);
          }
          this._enforcingBounds = false;
          return this;
        },
        // @method panInside(latlng: LatLng, options?: padding options): this
        // Pans the map the minimum amount to make the `latlng` visible. Use
        // padding options to fit the display to more restricted bounds.
        // If `latlng` is already within the (optionally padded) display bounds,
        // the map will not be panned.
        panInside: function(latlng, options) {
          options = options || {};
          var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]), paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]), pixelCenter = this.project(this.getCenter()), pixelPoint = this.project(latlng), pixelBounds = this.getPixelBounds(), paddedBounds = toBounds([pixelBounds.min.add(paddingTL), pixelBounds.max.subtract(paddingBR)]), paddedSize = paddedBounds.getSize();
          if (!paddedBounds.contains(pixelPoint)) {
            this._enforcingBounds = true;
            var centerOffset = pixelPoint.subtract(paddedBounds.getCenter());
            var offset = paddedBounds.extend(pixelPoint).getSize().subtract(paddedSize);
            pixelCenter.x += centerOffset.x < 0 ? -offset.x : offset.x;
            pixelCenter.y += centerOffset.y < 0 ? -offset.y : offset.y;
            this.panTo(this.unproject(pixelCenter), options);
            this._enforcingBounds = false;
          }
          return this;
        },
        // @method invalidateSize(options: Zoom/pan options): this
        // Checks if the map container size changed and updates the map if so —
        // call it after you've changed the map size dynamically, also animating
        // pan by default. If `options.pan` is `false`, panning will not occur.
        // If `options.debounceMoveend` is `true`, it will delay `moveend` event so
        // that it doesn't happen often even if the method is called many
        // times in a row.
        // @alternative
        // @method invalidateSize(animate: Boolean): this
        // Checks if the map container size changed and updates the map if so —
        // call it after you've changed the map size dynamically, also animating
        // pan by default.
        invalidateSize: function(options) {
          if (!this._loaded) {
            return this;
          }
          options = extend({
            animate: false,
            pan: true
          }, options === true ? { animate: true } : options);
          var oldSize = this.getSize();
          this._sizeChanged = true;
          this._lastCenter = null;
          var newSize = this.getSize(), oldCenter = oldSize.divideBy(2).round(), newCenter = newSize.divideBy(2).round(), offset = oldCenter.subtract(newCenter);
          if (!offset.x && !offset.y) {
            return this;
          }
          if (options.animate && options.pan) {
            this.panBy(offset);
          } else {
            if (options.pan) {
              this._rawPanBy(offset);
            }
            this.fire("move");
            if (options.debounceMoveend) {
              clearTimeout(this._sizeTimer);
              this._sizeTimer = setTimeout(bind(this.fire, this, "moveend"), 200);
            } else {
              this.fire("moveend");
            }
          }
          return this.fire("resize", {
            oldSize,
            newSize
          });
        },
        // @section Methods for modifying map state
        // @method stop(): this
        // Stops the currently running `panTo` or `flyTo` animation, if any.
        stop: function() {
          this.setZoom(this._limitZoom(this._zoom));
          if (!this.options.zoomSnap) {
            this.fire("viewreset");
          }
          return this._stop();
        },
        // @section Geolocation methods
        // @method locate(options?: Locate options): this
        // Tries to locate the user using the Geolocation API, firing a [`locationfound`](#map-locationfound)
        // event with location data on success or a [`locationerror`](#map-locationerror) event on failure,
        // and optionally sets the map view to the user's location with respect to
        // detection accuracy (or to the world view if geolocation failed).
        // Note that, if your page doesn't use HTTPS, this method will fail in
        // modern browsers ([Chrome 50 and newer](https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins))
        // See `Locate options` for more details.
        locate: function(options) {
          options = this._locateOptions = extend({
            timeout: 1e4,
            watch: false
            // setView: false
            // maxZoom: <Number>
            // maximumAge: 0
            // enableHighAccuracy: false
          }, options);
          if (!("geolocation" in navigator)) {
            this._handleGeolocationError({
              code: 0,
              message: "Geolocation not supported."
            });
            return this;
          }
          var onResponse = bind(this._handleGeolocationResponse, this), onError = bind(this._handleGeolocationError, this);
          if (options.watch) {
            this._locationWatchId = navigator.geolocation.watchPosition(onResponse, onError, options);
          } else {
            navigator.geolocation.getCurrentPosition(onResponse, onError, options);
          }
          return this;
        },
        // @method stopLocate(): this
        // Stops watching location previously initiated by `map.locate({watch: true})`
        // and aborts resetting the map view if map.locate was called with
        // `{setView: true}`.
        stopLocate: function() {
          if (navigator.geolocation && navigator.geolocation.clearWatch) {
            navigator.geolocation.clearWatch(this._locationWatchId);
          }
          if (this._locateOptions) {
            this._locateOptions.setView = false;
          }
          return this;
        },
        _handleGeolocationError: function(error) {
          if (!this._container._leaflet_id) {
            return;
          }
          var c = error.code, message = error.message || (c === 1 ? "permission denied" : c === 2 ? "position unavailable" : "timeout");
          if (this._locateOptions.setView && !this._loaded) {
            this.fitWorld();
          }
          this.fire("locationerror", {
            code: c,
            message: "Geolocation error: " + message + "."
          });
        },
        _handleGeolocationResponse: function(pos) {
          if (!this._container._leaflet_id) {
            return;
          }
          var lat = pos.coords.latitude, lng = pos.coords.longitude, latlng = new LatLng(lat, lng), bounds = latlng.toBounds(pos.coords.accuracy * 2), options = this._locateOptions;
          if (options.setView) {
            var zoom2 = this.getBoundsZoom(bounds);
            this.setView(latlng, options.maxZoom ? Math.min(zoom2, options.maxZoom) : zoom2);
          }
          var data = {
            latlng,
            bounds,
            timestamp: pos.timestamp
          };
          for (var i in pos.coords) {
            if (typeof pos.coords[i] === "number") {
              data[i] = pos.coords[i];
            }
          }
          this.fire("locationfound", data);
        },
        // TODO Appropriate docs section?
        // @section Other Methods
        // @method addHandler(name: String, HandlerClass: Function): this
        // Adds a new `Handler` to the map, given its name and constructor function.
        addHandler: function(name, HandlerClass) {
          if (!HandlerClass) {
            return this;
          }
          var handler = this[name] = new HandlerClass(this);
          this._handlers.push(handler);
          if (this.options[name]) {
            handler.enable();
          }
          return this;
        },
        // @method remove(): this
        // Destroys the map and clears all related event listeners.
        remove: function() {
          this._initEvents(true);
          if (this.options.maxBounds) {
            this.off("moveend", this._panInsideMaxBounds);
          }
          if (this._containerId !== this._container._leaflet_id) {
            throw new Error("Map container is being reused by another instance");
          }
          try {
            delete this._container._leaflet_id;
            delete this._containerId;
          } catch (e) {
            this._container._leaflet_id = void 0;
            this._containerId = void 0;
          }
          if (this._locationWatchId !== void 0) {
            this.stopLocate();
          }
          this._stop();
          remove(this._mapPane);
          if (this._clearControlPos) {
            this._clearControlPos();
          }
          if (this._resizeRequest) {
            cancelAnimFrame(this._resizeRequest);
            this._resizeRequest = null;
          }
          this._clearHandlers();
          if (this._loaded) {
            this.fire("unload");
          }
          var i;
          for (i in this._layers) {
            this._layers[i].remove();
          }
          for (i in this._panes) {
            remove(this._panes[i]);
          }
          this._layers = [];
          this._panes = [];
          delete this._mapPane;
          delete this._renderer;
          return this;
        },
        // @section Other Methods
        // @method createPane(name: String, container?: HTMLElement): HTMLElement
        // Creates a new [map pane](#map-pane) with the given name if it doesn't exist already,
        // then returns it. The pane is created as a child of `container`, or
        // as a child of the main map pane if not set.
        createPane: function(name, container) {
          var className = "leaflet-pane" + (name ? " leaflet-" + name.replace("Pane", "") + "-pane" : ""), pane = create$1("div", className, container || this._mapPane);
          if (name) {
            this._panes[name] = pane;
          }
          return pane;
        },
        // @section Methods for Getting Map State
        // @method getCenter(): LatLng
        // Returns the geographical center of the map view
        getCenter: function() {
          this._checkIfLoaded();
          if (this._lastCenter && !this._moved()) {
            return this._lastCenter.clone();
          }
          return this.layerPointToLatLng(this._getCenterLayerPoint());
        },
        // @method getZoom(): Number
        // Returns the current zoom level of the map view
        getZoom: function() {
          return this._zoom;
        },
        // @method getBounds(): LatLngBounds
        // Returns the geographical bounds visible in the current map view
        getBounds: function() {
          var bounds = this.getPixelBounds(), sw = this.unproject(bounds.getBottomLeft()), ne = this.unproject(bounds.getTopRight());
          return new LatLngBounds(sw, ne);
        },
        // @method getMinZoom(): Number
        // Returns the minimum zoom level of the map (if set in the `minZoom` option of the map or of any layers), or `0` by default.
        getMinZoom: function() {
          return this.options.minZoom === void 0 ? this._layersMinZoom || 0 : this.options.minZoom;
        },
        // @method getMaxZoom(): Number
        // Returns the maximum zoom level of the map (if set in the `maxZoom` option of the map or of any layers).
        getMaxZoom: function() {
          return this.options.maxZoom === void 0 ? this._layersMaxZoom === void 0 ? Infinity : this._layersMaxZoom : this.options.maxZoom;
        },
        // @method getBoundsZoom(bounds: LatLngBounds, inside?: Boolean, padding?: Point): Number
        // Returns the maximum zoom level on which the given bounds fit to the map
        // view in its entirety. If `inside` (optional) is set to `true`, the method
        // instead returns the minimum zoom level on which the map view fits into
        // the given bounds in its entirety.
        getBoundsZoom: function(bounds, inside, padding) {
          bounds = toLatLngBounds(bounds);
          padding = toPoint(padding || [0, 0]);
          var zoom2 = this.getZoom() || 0, min = this.getMinZoom(), max = this.getMaxZoom(), nw = bounds.getNorthWest(), se = bounds.getSouthEast(), size = this.getSize().subtract(padding), boundsSize = toBounds(this.project(se, zoom2), this.project(nw, zoom2)).getSize(), snap = Browser.any3d ? this.options.zoomSnap : 1, scalex = size.x / boundsSize.x, scaley = size.y / boundsSize.y, scale2 = inside ? Math.max(scalex, scaley) : Math.min(scalex, scaley);
          zoom2 = this.getScaleZoom(scale2, zoom2);
          if (snap) {
            zoom2 = Math.round(zoom2 / (snap / 100)) * (snap / 100);
            zoom2 = inside ? Math.ceil(zoom2 / snap) * snap : Math.floor(zoom2 / snap) * snap;
          }
          return Math.max(min, Math.min(max, zoom2));
        },
        // @method getSize(): Point
        // Returns the current size of the map container (in pixels).
        getSize: function() {
          if (!this._size || this._sizeChanged) {
            this._size = new Point(
              this._container.clientWidth || 0,
              this._container.clientHeight || 0
            );
            this._sizeChanged = false;
          }
          return this._size.clone();
        },
        // @method getPixelBounds(): Bounds
        // Returns the bounds of the current map view in projected pixel
        // coordinates (sometimes useful in layer and overlay implementations).
        getPixelBounds: function(center, zoom2) {
          var topLeftPoint = this._getTopLeftPoint(center, zoom2);
          return new Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
        },
        // TODO: Check semantics - isn't the pixel origin the 0,0 coord relative to
        // the map pane? "left point of the map layer" can be confusing, specially
        // since there can be negative offsets.
        // @method getPixelOrigin(): Point
        // Returns the projected pixel coordinates of the top left point of
        // the map layer (useful in custom layer and overlay implementations).
        getPixelOrigin: function() {
          this._checkIfLoaded();
          return this._pixelOrigin;
        },
        // @method getPixelWorldBounds(zoom?: Number): Bounds
        // Returns the world's bounds in pixel coordinates for zoom level `zoom`.
        // If `zoom` is omitted, the map's current zoom level is used.
        getPixelWorldBounds: function(zoom2) {
          return this.options.crs.getProjectedBounds(zoom2 === void 0 ? this.getZoom() : zoom2);
        },
        // @section Other Methods
        // @method getPane(pane: String|HTMLElement): HTMLElement
        // Returns a [map pane](#map-pane), given its name or its HTML element (its identity).
        getPane: function(pane) {
          return typeof pane === "string" ? this._panes[pane] : pane;
        },
        // @method getPanes(): Object
        // Returns a plain object containing the names of all [panes](#map-pane) as keys and
        // the panes as values.
        getPanes: function() {
          return this._panes;
        },
        // @method getContainer: HTMLElement
        // Returns the HTML element that contains the map.
        getContainer: function() {
          return this._container;
        },
        // @section Conversion Methods
        // @method getZoomScale(toZoom: Number, fromZoom: Number): Number
        // Returns the scale factor to be applied to a map transition from zoom level
        // `fromZoom` to `toZoom`. Used internally to help with zoom animations.
        getZoomScale: function(toZoom, fromZoom) {
          var crs = this.options.crs;
          fromZoom = fromZoom === void 0 ? this._zoom : fromZoom;
          return crs.scale(toZoom) / crs.scale(fromZoom);
        },
        // @method getScaleZoom(scale: Number, fromZoom: Number): Number
        // Returns the zoom level that the map would end up at, if it is at `fromZoom`
        // level and everything is scaled by a factor of `scale`. Inverse of
        // [`getZoomScale`](#map-getZoomScale).
        getScaleZoom: function(scale2, fromZoom) {
          var crs = this.options.crs;
          fromZoom = fromZoom === void 0 ? this._zoom : fromZoom;
          var zoom2 = crs.zoom(scale2 * crs.scale(fromZoom));
          return isNaN(zoom2) ? Infinity : zoom2;
        },
        // @method project(latlng: LatLng, zoom: Number): Point
        // Projects a geographical coordinate `LatLng` according to the projection
        // of the map's CRS, then scales it according to `zoom` and the CRS's
        // `Transformation`. The result is pixel coordinate relative to
        // the CRS origin.
        project: function(latlng, zoom2) {
          zoom2 = zoom2 === void 0 ? this._zoom : zoom2;
          return this.options.crs.latLngToPoint(toLatLng(latlng), zoom2);
        },
        // @method unproject(point: Point, zoom: Number): LatLng
        // Inverse of [`project`](#map-project).
        unproject: function(point, zoom2) {
          zoom2 = zoom2 === void 0 ? this._zoom : zoom2;
          return this.options.crs.pointToLatLng(toPoint(point), zoom2);
        },
        // @method layerPointToLatLng(point: Point): LatLng
        // Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
        // returns the corresponding geographical coordinate (for the current zoom level).
        layerPointToLatLng: function(point) {
          var projectedPoint = toPoint(point).add(this.getPixelOrigin());
          return this.unproject(projectedPoint);
        },
        // @method latLngToLayerPoint(latlng: LatLng): Point
        // Given a geographical coordinate, returns the corresponding pixel coordinate
        // relative to the [origin pixel](#map-getpixelorigin).
        latLngToLayerPoint: function(latlng) {
          var projectedPoint = this.project(toLatLng(latlng))._round();
          return projectedPoint._subtract(this.getPixelOrigin());
        },
        // @method wrapLatLng(latlng: LatLng): LatLng
        // Returns a `LatLng` where `lat` and `lng` has been wrapped according to the
        // map's CRS's `wrapLat` and `wrapLng` properties, if they are outside the
        // CRS's bounds.
        // By default this means longitude is wrapped around the dateline so its
        // value is between -180 and +180 degrees.
        wrapLatLng: function(latlng) {
          return this.options.crs.wrapLatLng(toLatLng(latlng));
        },
        // @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
        // Returns a `LatLngBounds` with the same size as the given one, ensuring that
        // its center is within the CRS's bounds.
        // By default this means the center longitude is wrapped around the dateline so its
        // value is between -180 and +180 degrees, and the majority of the bounds
        // overlaps the CRS's bounds.
        wrapLatLngBounds: function(latlng) {
          return this.options.crs.wrapLatLngBounds(toLatLngBounds(latlng));
        },
        // @method distance(latlng1: LatLng, latlng2: LatLng): Number
        // Returns the distance between two geographical coordinates according to
        // the map's CRS. By default this measures distance in meters.
        distance: function(latlng1, latlng2) {
          return this.options.crs.distance(toLatLng(latlng1), toLatLng(latlng2));
        },
        // @method containerPointToLayerPoint(point: Point): Point
        // Given a pixel coordinate relative to the map container, returns the corresponding
        // pixel coordinate relative to the [origin pixel](#map-getpixelorigin).
        containerPointToLayerPoint: function(point) {
          return toPoint(point).subtract(this._getMapPanePos());
        },
        // @method layerPointToContainerPoint(point: Point): Point
        // Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
        // returns the corresponding pixel coordinate relative to the map container.
        layerPointToContainerPoint: function(point) {
          return toPoint(point).add(this._getMapPanePos());
        },
        // @method containerPointToLatLng(point: Point): LatLng
        // Given a pixel coordinate relative to the map container, returns
        // the corresponding geographical coordinate (for the current zoom level).
        containerPointToLatLng: function(point) {
          var layerPoint = this.containerPointToLayerPoint(toPoint(point));
          return this.layerPointToLatLng(layerPoint);
        },
        // @method latLngToContainerPoint(latlng: LatLng): Point
        // Given a geographical coordinate, returns the corresponding pixel coordinate
        // relative to the map container.
        latLngToContainerPoint: function(latlng) {
          return this.layerPointToContainerPoint(this.latLngToLayerPoint(toLatLng(latlng)));
        },
        // @method mouseEventToContainerPoint(ev: MouseEvent): Point
        // Given a MouseEvent object, returns the pixel coordinate relative to the
        // map container where the event took place.
        mouseEventToContainerPoint: function(e) {
          return getMousePosition(e, this._container);
        },
        // @method mouseEventToLayerPoint(ev: MouseEvent): Point
        // Given a MouseEvent object, returns the pixel coordinate relative to
        // the [origin pixel](#map-getpixelorigin) where the event took place.
        mouseEventToLayerPoint: function(e) {
          return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
        },
        // @method mouseEventToLatLng(ev: MouseEvent): LatLng
        // Given a MouseEvent object, returns geographical coordinate where the
        // event took place.
        mouseEventToLatLng: function(e) {
          return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
        },
        // map initialization methods
        _initContainer: function(id) {
          var container = this._container = get2(id);
          if (!container) {
            throw new Error("Map container not found.");
          } else if (container._leaflet_id) {
            throw new Error("Map container is already initialized.");
          }
          on(container, "scroll", this._onScroll, this);
          this._containerId = stamp(container);
        },
        _initLayout: function() {
          var container = this._container;
          this._fadeAnimated = this.options.fadeAnimation && Browser.any3d;
          addClass(container, "leaflet-container" + (Browser.touch ? " leaflet-touch" : "") + (Browser.retina ? " leaflet-retina" : "") + (Browser.ielt9 ? " leaflet-oldie" : "") + (Browser.safari ? " leaflet-safari" : "") + (this._fadeAnimated ? " leaflet-fade-anim" : ""));
          var position = getStyle(container, "position");
          if (position !== "absolute" && position !== "relative" && position !== "fixed" && position !== "sticky") {
            container.style.position = "relative";
          }
          this._initPanes();
          if (this._initControlPos) {
            this._initControlPos();
          }
        },
        _initPanes: function() {
          var panes = this._panes = {};
          this._paneRenderers = {};
          this._mapPane = this.createPane("mapPane", this._container);
          setPosition(this._mapPane, new Point(0, 0));
          this.createPane("tilePane");
          this.createPane("overlayPane");
          this.createPane("shadowPane");
          this.createPane("markerPane");
          this.createPane("tooltipPane");
          this.createPane("popupPane");
          if (!this.options.markerZoomAnimation) {
            addClass(panes.markerPane, "leaflet-zoom-hide");
            addClass(panes.shadowPane, "leaflet-zoom-hide");
          }
        },
        // private methods that modify map state
        // @section Map state change events
        _resetView: function(center, zoom2, noMoveStart) {
          setPosition(this._mapPane, new Point(0, 0));
          var loading = !this._loaded;
          this._loaded = true;
          zoom2 = this._limitZoom(zoom2);
          this.fire("viewprereset");
          var zoomChanged = this._zoom !== zoom2;
          this._moveStart(zoomChanged, noMoveStart)._move(center, zoom2)._moveEnd(zoomChanged);
          this.fire("viewreset");
          if (loading) {
            this.fire("load");
          }
        },
        _moveStart: function(zoomChanged, noMoveStart) {
          if (zoomChanged) {
            this.fire("zoomstart");
          }
          if (!noMoveStart) {
            this.fire("movestart");
          }
          return this;
        },
        _move: function(center, zoom2, data, supressEvent) {
          if (zoom2 === void 0) {
            zoom2 = this._zoom;
          }
          var zoomChanged = this._zoom !== zoom2;
          this._zoom = zoom2;
          this._lastCenter = center;
          this._pixelOrigin = this._getNewPixelOrigin(center);
          if (!supressEvent) {
            if (zoomChanged || data && data.pinch) {
              this.fire("zoom", data);
            }
            this.fire("move", data);
          } else if (data && data.pinch) {
            this.fire("zoom", data);
          }
          return this;
        },
        _moveEnd: function(zoomChanged) {
          if (zoomChanged) {
            this.fire("zoomend");
          }
          return this.fire("moveend");
        },
        _stop: function() {
          cancelAnimFrame(this._flyToFrame);
          if (this._panAnim) {
            this._panAnim.stop();
          }
          return this;
        },
        _rawPanBy: function(offset) {
          setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
        },
        _getZoomSpan: function() {
          return this.getMaxZoom() - this.getMinZoom();
        },
        _panInsideMaxBounds: function() {
          if (!this._enforcingBounds) {
            this.panInsideBounds(this.options.maxBounds);
          }
        },
        _checkIfLoaded: function() {
          if (!this._loaded) {
            throw new Error("Set map center and zoom first.");
          }
        },
        // DOM event handling
        // @section Interaction events
        _initEvents: function(remove2) {
          this._targets = {};
          this._targets[stamp(this._container)] = this;
          var onOff = remove2 ? off : on;
          onOff(this._container, "click dblclick mousedown mouseup mouseover mouseout mousemove contextmenu keypress keydown keyup", this._handleDOMEvent, this);
          if (this.options.trackResize) {
            onOff(window, "resize", this._onResize, this);
          }
          if (Browser.any3d && this.options.transform3DLimit) {
            (remove2 ? this.off : this.on).call(this, "moveend", this._onMoveEnd);
          }
        },
        _onResize: function() {
          cancelAnimFrame(this._resizeRequest);
          this._resizeRequest = requestAnimFrame(
            function() {
              this.invalidateSize({ debounceMoveend: true });
            },
            this
          );
        },
        _onScroll: function() {
          this._container.scrollTop = 0;
          this._container.scrollLeft = 0;
        },
        _onMoveEnd: function() {
          var pos = this._getMapPanePos();
          if (Math.max(Math.abs(pos.x), Math.abs(pos.y)) >= this.options.transform3DLimit) {
            this._resetView(this.getCenter(), this.getZoom());
          }
        },
        _findEventTargets: function(e, type) {
          var targets = [], target, isHover = type === "mouseout" || type === "mouseover", src = e.target || e.srcElement, dragging = false;
          while (src) {
            target = this._targets[stamp(src)];
            if (target && (type === "click" || type === "preclick") && this._draggableMoved(target)) {
              dragging = true;
              break;
            }
            if (target && target.listens(type, true)) {
              if (isHover && !isExternalTarget(src, e)) {
                break;
              }
              targets.push(target);
              if (isHover) {
                break;
              }
            }
            if (src === this._container) {
              break;
            }
            src = src.parentNode;
          }
          if (!targets.length && !dragging && !isHover && this.listens(type, true)) {
            targets = [this];
          }
          return targets;
        },
        _isClickDisabled: function(el) {
          while (el && el !== this._container) {
            if (el["_leaflet_disable_click"]) {
              return true;
            }
            el = el.parentNode;
          }
        },
        _handleDOMEvent: function(e) {
          var el = e.target || e.srcElement;
          if (!this._loaded || el["_leaflet_disable_events"] || e.type === "click" && this._isClickDisabled(el)) {
            return;
          }
          var type = e.type;
          if (type === "mousedown") {
            preventOutline(el);
          }
          this._fireDOMEvent(e, type);
        },
        _mouseEvents: ["click", "dblclick", "mouseover", "mouseout", "contextmenu"],
        _fireDOMEvent: function(e, type, canvasTargets) {
          if (e.type === "click") {
            var synth = extend({}, e);
            synth.type = "preclick";
            this._fireDOMEvent(synth, synth.type, canvasTargets);
          }
          var targets = this._findEventTargets(e, type);
          if (canvasTargets) {
            var filtered = [];
            for (var i = 0; i < canvasTargets.length; i++) {
              if (canvasTargets[i].listens(type, true)) {
                filtered.push(canvasTargets[i]);
              }
            }
            targets = filtered.concat(targets);
          }
          if (!targets.length) {
            return;
          }
          if (type === "contextmenu") {
            preventDefault(e);
          }
          var target = targets[0];
          var data = {
            originalEvent: e
          };
          if (e.type !== "keypress" && e.type !== "keydown" && e.type !== "keyup") {
            var isMarker = target.getLatLng && (!target._radius || target._radius <= 10);
            data.containerPoint = isMarker ? this.latLngToContainerPoint(target.getLatLng()) : this.mouseEventToContainerPoint(e);
            data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
            data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
          }
          for (i = 0; i < targets.length; i++) {
            targets[i].fire(type, data, true);
            if (data.originalEvent._stopped || targets[i].options.bubblingMouseEvents === false && indexOf(this._mouseEvents, type) !== -1) {
              return;
            }
          }
        },
        _draggableMoved: function(obj) {
          obj = obj.dragging && obj.dragging.enabled() ? obj : this;
          return obj.dragging && obj.dragging.moved() || this.boxZoom && this.boxZoom.moved();
        },
        _clearHandlers: function() {
          for (var i = 0, len = this._handlers.length; i < len; i++) {
            this._handlers[i].disable();
          }
        },
        // @section Other Methods
        // @method whenReady(fn: Function, context?: Object): this
        // Runs the given function `fn` when the map gets initialized with
        // a view (center and zoom) and at least one layer, or immediately
        // if it's already initialized, optionally passing a function context.
        whenReady: function(callback, context) {
          if (this._loaded) {
            callback.call(context || this, { target: this });
          } else {
            this.on("load", callback, context);
          }
          return this;
        },
        // private methods for getting map state
        _getMapPanePos: function() {
          return getPosition(this._mapPane) || new Point(0, 0);
        },
        _moved: function() {
          var pos = this._getMapPanePos();
          return pos && !pos.equals([0, 0]);
        },
        _getTopLeftPoint: function(center, zoom2) {
          var pixelOrigin = center && zoom2 !== void 0 ? this._getNewPixelOrigin(center, zoom2) : this.getPixelOrigin();
          return pixelOrigin.subtract(this._getMapPanePos());
        },
        _getNewPixelOrigin: function(center, zoom2) {
          var viewHalf = this.getSize()._divideBy(2);
          return this.project(center, zoom2)._subtract(viewHalf)._add(this._getMapPanePos())._round();
        },
        _latLngToNewLayerPoint: function(latlng, zoom2, center) {
          var topLeft = this._getNewPixelOrigin(center, zoom2);
          return this.project(latlng, zoom2)._subtract(topLeft);
        },
        _latLngBoundsToNewLayerBounds: function(latLngBounds, zoom2, center) {
          var topLeft = this._getNewPixelOrigin(center, zoom2);
          return toBounds([
            this.project(latLngBounds.getSouthWest(), zoom2)._subtract(topLeft),
            this.project(latLngBounds.getNorthWest(), zoom2)._subtract(topLeft),
            this.project(latLngBounds.getSouthEast(), zoom2)._subtract(topLeft),
            this.project(latLngBounds.getNorthEast(), zoom2)._subtract(topLeft)
          ]);
        },
        // layer point of the current center
        _getCenterLayerPoint: function() {
          return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
        },
        // offset of the specified place to the current center in pixels
        _getCenterOffset: function(latlng) {
          return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
        },
        // adjust center for view to get inside bounds
        _limitCenter: function(center, zoom2, bounds) {
          if (!bounds) {
            return center;
          }
          var centerPoint = this.project(center, zoom2), viewHalf = this.getSize().divideBy(2), viewBounds = new Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)), offset = this._getBoundsOffset(viewBounds, bounds, zoom2);
          if (Math.abs(offset.x) <= 1 && Math.abs(offset.y) <= 1) {
            return center;
          }
          return this.unproject(centerPoint.add(offset), zoom2);
        },
        // adjust offset for view to get inside bounds
        _limitOffset: function(offset, bounds) {
          if (!bounds) {
            return offset;
          }
          var viewBounds = this.getPixelBounds(), newBounds = new Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));
          return offset.add(this._getBoundsOffset(newBounds, bounds));
        },
        // returns offset needed for pxBounds to get inside maxBounds at a specified zoom
        _getBoundsOffset: function(pxBounds, maxBounds, zoom2) {
          var projectedMaxBounds = toBounds(
            this.project(maxBounds.getNorthEast(), zoom2),
            this.project(maxBounds.getSouthWest(), zoom2)
          ), minOffset = projectedMaxBounds.min.subtract(pxBounds.min), maxOffset = projectedMaxBounds.max.subtract(pxBounds.max), dx = this._rebound(minOffset.x, -maxOffset.x), dy = this._rebound(minOffset.y, -maxOffset.y);
          return new Point(dx, dy);
        },
        _rebound: function(left, right) {
          return left + right > 0 ? Math.round(left - right) / 2 : Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
        },
        _limitZoom: function(zoom2) {
          var min = this.getMinZoom(), max = this.getMaxZoom(), snap = Browser.any3d ? this.options.zoomSnap : 1;
          if (snap) {
            zoom2 = Math.round(zoom2 / snap) * snap;
          }
          return Math.max(min, Math.min(max, zoom2));
        },
        _onPanTransitionStep: function() {
          this.fire("move");
        },
        _onPanTransitionEnd: function() {
          removeClass(this._mapPane, "leaflet-pan-anim");
          this.fire("moveend");
        },
        _tryAnimatedPan: function(center, options) {
          var offset = this._getCenterOffset(center)._trunc();
          if ((options && options.animate) !== true && !this.getSize().contains(offset)) {
            return false;
          }
          this.panBy(offset, options);
          return true;
        },
        _createAnimProxy: function() {
          var proxy = this._proxy = create$1("div", "leaflet-proxy leaflet-zoom-animated");
          this._panes.mapPane.appendChild(proxy);
          this.on("zoomanim", function(e) {
            var prop = TRANSFORM, transform = this._proxy.style[prop];
            setTransform(this._proxy, this.project(e.center, e.zoom), this.getZoomScale(e.zoom, 1));
            if (transform === this._proxy.style[prop] && this._animatingZoom) {
              this._onZoomTransitionEnd();
            }
          }, this);
          this.on("load moveend", this._animMoveEnd, this);
          this._on("unload", this._destroyAnimProxy, this);
        },
        _destroyAnimProxy: function() {
          remove(this._proxy);
          this.off("load moveend", this._animMoveEnd, this);
          delete this._proxy;
        },
        _animMoveEnd: function() {
          var c = this.getCenter(), z = this.getZoom();
          setTransform(this._proxy, this.project(c, z), this.getZoomScale(z, 1));
        },
        _catchTransitionEnd: function(e) {
          if (this._animatingZoom && e.propertyName.indexOf("transform") >= 0) {
            this._onZoomTransitionEnd();
          }
        },
        _nothingToAnimate: function() {
          return !this._container.getElementsByClassName("leaflet-zoom-animated").length;
        },
        _tryAnimatedZoom: function(center, zoom2, options) {
          if (this._animatingZoom) {
            return true;
          }
          options = options || {};
          if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() || Math.abs(zoom2 - this._zoom) > this.options.zoomAnimationThreshold) {
            return false;
          }
          var scale2 = this.getZoomScale(zoom2), offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale2);
          if (options.animate !== true && !this.getSize().contains(offset)) {
            return false;
          }
          requestAnimFrame(function() {
            this._moveStart(true, options.noMoveStart || false)._animateZoom(center, zoom2, true);
          }, this);
          return true;
        },
        _animateZoom: function(center, zoom2, startAnim, noUpdate) {
          if (!this._mapPane) {
            return;
          }
          if (startAnim) {
            this._animatingZoom = true;
            this._animateToCenter = center;
            this._animateToZoom = zoom2;
            addClass(this._mapPane, "leaflet-zoom-anim");
          }
          this.fire("zoomanim", {
            center,
            zoom: zoom2,
            noUpdate
          });
          if (!this._tempFireZoomEvent) {
            this._tempFireZoomEvent = this._zoom !== this._animateToZoom;
          }
          this._move(this._animateToCenter, this._animateToZoom, void 0, true);
          setTimeout(bind(this._onZoomTransitionEnd, this), 250);
        },
        _onZoomTransitionEnd: function() {
          if (!this._animatingZoom) {
            return;
          }
          if (this._mapPane) {
            removeClass(this._mapPane, "leaflet-zoom-anim");
          }
          this._animatingZoom = false;
          this._move(this._animateToCenter, this._animateToZoom, void 0, true);
          if (this._tempFireZoomEvent) {
            this.fire("zoom");
          }
          delete this._tempFireZoomEvent;
          this.fire("move");
          this._moveEnd(true);
        }
      });
      function createMap(id, options) {
        return new Map2(id, options);
      }
      var Control = Class.extend({
        // @section
        // @aka Control Options
        options: {
          // @option position: String = 'topright'
          // The position of the control (one of the map corners). Possible values are `'topleft'`,
          // `'topright'`, `'bottomleft'` or `'bottomright'`
          position: "topright"
        },
        initialize: function(options) {
          setOptions(this, options);
        },
        /* @section
         * Classes extending L.Control will inherit the following methods:
         *
         * @method getPosition: string
         * Returns the position of the control.
         */
        getPosition: function() {
          return this.options.position;
        },
        // @method setPosition(position: string): this
        // Sets the position of the control.
        setPosition: function(position) {
          var map = this._map;
          if (map) {
            map.removeControl(this);
          }
          this.options.position = position;
          if (map) {
            map.addControl(this);
          }
          return this;
        },
        // @method getContainer: HTMLElement
        // Returns the HTMLElement that contains the control.
        getContainer: function() {
          return this._container;
        },
        // @method addTo(map: Map): this
        // Adds the control to the given map.
        addTo: function(map) {
          this.remove();
          this._map = map;
          var container = this._container = this.onAdd(map), pos = this.getPosition(), corner = map._controlCorners[pos];
          addClass(container, "leaflet-control");
          if (pos.indexOf("bottom") !== -1) {
            corner.insertBefore(container, corner.firstChild);
          } else {
            corner.appendChild(container);
          }
          this._map.on("unload", this.remove, this);
          return this;
        },
        // @method remove: this
        // Removes the control from the map it is currently active on.
        remove: function() {
          if (!this._map) {
            return this;
          }
          remove(this._container);
          if (this.onRemove) {
            this.onRemove(this._map);
          }
          this._map.off("unload", this.remove, this);
          this._map = null;
          return this;
        },
        _refocusOnMap: function(e) {
          if (this._map && e && e.screenX > 0 && e.screenY > 0) {
            this._map.getContainer().focus();
          }
        }
      });
      var control = function(options) {
        return new Control(options);
      };
      Map2.include({
        // @method addControl(control: Control): this
        // Adds the given control to the map
        addControl: function(control2) {
          control2.addTo(this);
          return this;
        },
        // @method removeControl(control: Control): this
        // Removes the given control from the map
        removeControl: function(control2) {
          control2.remove();
          return this;
        },
        _initControlPos: function() {
          var corners = this._controlCorners = {}, l = "leaflet-", container = this._controlContainer = create$1("div", l + "control-container", this._container);
          function createCorner(vSide, hSide) {
            var className = l + vSide + " " + l + hSide;
            corners[vSide + hSide] = create$1("div", className, container);
          }
          createCorner("top", "left");
          createCorner("top", "right");
          createCorner("bottom", "left");
          createCorner("bottom", "right");
        },
        _clearControlPos: function() {
          for (var i in this._controlCorners) {
            remove(this._controlCorners[i]);
          }
          remove(this._controlContainer);
          delete this._controlCorners;
          delete this._controlContainer;
        }
      });
      var Layers = Control.extend({
        // @section
        // @aka Control.Layers options
        options: {
          // @option collapsed: Boolean = true
          // If `true`, the control will be collapsed into an icon and expanded on mouse hover, touch, or keyboard activation.
          collapsed: true,
          position: "topright",
          // @option autoZIndex: Boolean = true
          // If `true`, the control will assign zIndexes in increasing order to all of its layers so that the order is preserved when switching them on/off.
          autoZIndex: true,
          // @option hideSingleBase: Boolean = false
          // If `true`, the base layers in the control will be hidden when there is only one.
          hideSingleBase: false,
          // @option sortLayers: Boolean = false
          // Whether to sort the layers. When `false`, layers will keep the order
          // in which they were added to the control.
          sortLayers: false,
          // @option sortFunction: Function = *
          // A [compare function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
          // that will be used for sorting the layers, when `sortLayers` is `true`.
          // The function receives both the `L.Layer` instances and their names, as in
          // `sortFunction(layerA, layerB, nameA, nameB)`.
          // By default, it sorts layers alphabetically by their name.
          sortFunction: function(layerA, layerB, nameA, nameB) {
            return nameA < nameB ? -1 : nameB < nameA ? 1 : 0;
          }
        },
        initialize: function(baseLayers, overlays, options) {
          setOptions(this, options);
          this._layerControlInputs = [];
          this._layers = [];
          this._lastZIndex = 0;
          this._handlingClick = false;
          this._preventClick = false;
          for (var i in baseLayers) {
            this._addLayer(baseLayers[i], i);
          }
          for (i in overlays) {
            this._addLayer(overlays[i], i, true);
          }
        },
        onAdd: function(map) {
          this._initLayout();
          this._update();
          this._map = map;
          map.on("zoomend", this._checkDisabledLayers, this);
          for (var i = 0; i < this._layers.length; i++) {
            this._layers[i].layer.on("add remove", this._onLayerChange, this);
          }
          return this._container;
        },
        addTo: function(map) {
          Control.prototype.addTo.call(this, map);
          return this._expandIfNotCollapsed();
        },
        onRemove: function() {
          this._map.off("zoomend", this._checkDisabledLayers, this);
          for (var i = 0; i < this._layers.length; i++) {
            this._layers[i].layer.off("add remove", this._onLayerChange, this);
          }
        },
        // @method addBaseLayer(layer: Layer, name: String): this
        // Adds a base layer (radio button entry) with the given name to the control.
        addBaseLayer: function(layer, name) {
          this._addLayer(layer, name);
          return this._map ? this._update() : this;
        },
        // @method addOverlay(layer: Layer, name: String): this
        // Adds an overlay (checkbox entry) with the given name to the control.
        addOverlay: function(layer, name) {
          this._addLayer(layer, name, true);
          return this._map ? this._update() : this;
        },
        // @method removeLayer(layer: Layer): this
        // Remove the given layer from the control.
        removeLayer: function(layer) {
          layer.off("add remove", this._onLayerChange, this);
          var obj = this._getLayer(stamp(layer));
          if (obj) {
            this._layers.splice(this._layers.indexOf(obj), 1);
          }
          return this._map ? this._update() : this;
        },
        // @method expand(): this
        // Expand the control container if collapsed.
        expand: function() {
          addClass(this._container, "leaflet-control-layers-expanded");
          this._section.style.height = null;
          var acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50);
          if (acceptableHeight < this._section.clientHeight) {
            addClass(this._section, "leaflet-control-layers-scrollbar");
            this._section.style.height = acceptableHeight + "px";
          } else {
            removeClass(this._section, "leaflet-control-layers-scrollbar");
          }
          this._checkDisabledLayers();
          return this;
        },
        // @method collapse(): this
        // Collapse the control container if expanded.
        collapse: function() {
          removeClass(this._container, "leaflet-control-layers-expanded");
          return this;
        },
        _initLayout: function() {
          var className = "leaflet-control-layers", container = this._container = create$1("div", className), collapsed = this.options.collapsed;
          container.setAttribute("aria-haspopup", true);
          disableClickPropagation(container);
          disableScrollPropagation(container);
          var section = this._section = create$1("section", className + "-list");
          if (collapsed) {
            this._map.on("click", this.collapse, this);
            on(container, {
              mouseenter: this._expandSafely,
              mouseleave: this.collapse
            }, this);
          }
          var link = this._layersLink = create$1("a", className + "-toggle", container);
          link.href = "#";
          link.title = "Layers";
          link.setAttribute("role", "button");
          on(link, {
            keydown: function(e) {
              if (e.keyCode === 13) {
                this._expandSafely();
              }
            },
            // Certain screen readers intercept the key event and instead send a click event
            click: function(e) {
              preventDefault(e);
              this._expandSafely();
            }
          }, this);
          if (!collapsed) {
            this.expand();
          }
          this._baseLayersList = create$1("div", className + "-base", section);
          this._separator = create$1("div", className + "-separator", section);
          this._overlaysList = create$1("div", className + "-overlays", section);
          container.appendChild(section);
        },
        _getLayer: function(id) {
          for (var i = 0; i < this._layers.length; i++) {
            if (this._layers[i] && stamp(this._layers[i].layer) === id) {
              return this._layers[i];
            }
          }
        },
        _addLayer: function(layer, name, overlay) {
          if (this._map) {
            layer.on("add remove", this._onLayerChange, this);
          }
          this._layers.push({
            layer,
            name,
            overlay
          });
          if (this.options.sortLayers) {
            this._layers.sort(bind(function(a, b) {
              return this.options.sortFunction(a.layer, b.layer, a.name, b.name);
            }, this));
          }
          if (this.options.autoZIndex && layer.setZIndex) {
            this._lastZIndex++;
            layer.setZIndex(this._lastZIndex);
          }
          this._expandIfNotCollapsed();
        },
        _update: function() {
          if (!this._container) {
            return this;
          }
          empty(this._baseLayersList);
          empty(this._overlaysList);
          this._layerControlInputs = [];
          var baseLayersPresent, overlaysPresent, i, obj, baseLayersCount = 0;
          for (i = 0; i < this._layers.length; i++) {
            obj = this._layers[i];
            this._addItem(obj);
            overlaysPresent = overlaysPresent || obj.overlay;
            baseLayersPresent = baseLayersPresent || !obj.overlay;
            baseLayersCount += !obj.overlay ? 1 : 0;
          }
          if (this.options.hideSingleBase) {
            baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
            this._baseLayersList.style.display = baseLayersPresent ? "" : "none";
          }
          this._separator.style.display = overlaysPresent && baseLayersPresent ? "" : "none";
          return this;
        },
        _onLayerChange: function(e) {
          if (!this._handlingClick) {
            this._update();
          }
          var obj = this._getLayer(stamp(e.target));
          var type = obj.overlay ? e.type === "add" ? "overlayadd" : "overlayremove" : e.type === "add" ? "baselayerchange" : null;
          if (type) {
            this._map.fire(type, obj);
          }
        },
        // IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see https://stackoverflow.com/a/119079)
        _createRadioElement: function(name, checked) {
          var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"' + (checked ? ' checked="checked"' : "") + "/>";
          var radioFragment = document.createElement("div");
          radioFragment.innerHTML = radioHtml;
          return radioFragment.firstChild;
        },
        _addItem: function(obj) {
          var label = document.createElement("label"), checked = this._map.hasLayer(obj.layer), input;
          if (obj.overlay) {
            input = document.createElement("input");
            input.type = "checkbox";
            input.className = "leaflet-control-layers-selector";
            input.defaultChecked = checked;
          } else {
            input = this._createRadioElement("leaflet-base-layers_" + stamp(this), checked);
          }
          this._layerControlInputs.push(input);
          input.layerId = stamp(obj.layer);
          on(input, "click", this._onInputClick, this);
          var name = document.createElement("span");
          name.innerHTML = " " + obj.name;
          var holder = document.createElement("span");
          label.appendChild(holder);
          holder.appendChild(input);
          holder.appendChild(name);
          var container = obj.overlay ? this._overlaysList : this._baseLayersList;
          container.appendChild(label);
          this._checkDisabledLayers();
          return label;
        },
        _onInputClick: function() {
          if (this._preventClick) {
            return;
          }
          var inputs = this._layerControlInputs, input, layer;
          var addedLayers = [], removedLayers = [];
          this._handlingClick = true;
          for (var i = inputs.length - 1; i >= 0; i--) {
            input = inputs[i];
            layer = this._getLayer(input.layerId).layer;
            if (input.checked) {
              addedLayers.push(layer);
            } else if (!input.checked) {
              removedLayers.push(layer);
            }
          }
          for (i = 0; i < removedLayers.length; i++) {
            if (this._map.hasLayer(removedLayers[i])) {
              this._map.removeLayer(removedLayers[i]);
            }
          }
          for (i = 0; i < addedLayers.length; i++) {
            if (!this._map.hasLayer(addedLayers[i])) {
              this._map.addLayer(addedLayers[i]);
            }
          }
          this._handlingClick = false;
          this._refocusOnMap();
        },
        _checkDisabledLayers: function() {
          var inputs = this._layerControlInputs, input, layer, zoom2 = this._map.getZoom();
          for (var i = inputs.length - 1; i >= 0; i--) {
            input = inputs[i];
            layer = this._getLayer(input.layerId).layer;
            input.disabled = layer.options.minZoom !== void 0 && zoom2 < layer.options.minZoom || layer.options.maxZoom !== void 0 && zoom2 > layer.options.maxZoom;
          }
        },
        _expandIfNotCollapsed: function() {
          if (this._map && !this.options.collapsed) {
            this.expand();
          }
          return this;
        },
        _expandSafely: function() {
          var section = this._section;
          this._preventClick = true;
          on(section, "click", preventDefault);
          this.expand();
          var that = this;
          setTimeout(function() {
            off(section, "click", preventDefault);
            that._preventClick = false;
          });
        }
      });
      var layers = function(baseLayers, overlays, options) {
        return new Layers(baseLayers, overlays, options);
      };
      var Zoom = Control.extend({
        // @section
        // @aka Control.Zoom options
        options: {
          position: "topleft",
          // @option zoomInText: String = '<span aria-hidden="true">+</span>'
          // The text set on the 'zoom in' button.
          zoomInText: '<span aria-hidden="true">+</span>',
          // @option zoomInTitle: String = 'Zoom in'
          // The title set on the 'zoom in' button.
          zoomInTitle: "Zoom in",
          // @option zoomOutText: String = '<span aria-hidden="true">&#x2212;</span>'
          // The text set on the 'zoom out' button.
          zoomOutText: '<span aria-hidden="true">&#x2212;</span>',
          // @option zoomOutTitle: String = 'Zoom out'
          // The title set on the 'zoom out' button.
          zoomOutTitle: "Zoom out"
        },
        onAdd: function(map) {
          var zoomName = "leaflet-control-zoom", container = create$1("div", zoomName + " leaflet-bar"), options = this.options;
          this._zoomInButton = this._createButton(
            options.zoomInText,
            options.zoomInTitle,
            zoomName + "-in",
            container,
            this._zoomIn
          );
          this._zoomOutButton = this._createButton(
            options.zoomOutText,
            options.zoomOutTitle,
            zoomName + "-out",
            container,
            this._zoomOut
          );
          this._updateDisabled();
          map.on("zoomend zoomlevelschange", this._updateDisabled, this);
          return container;
        },
        onRemove: function(map) {
          map.off("zoomend zoomlevelschange", this._updateDisabled, this);
        },
        disable: function() {
          this._disabled = true;
          this._updateDisabled();
          return this;
        },
        enable: function() {
          this._disabled = false;
          this._updateDisabled();
          return this;
        },
        _zoomIn: function(e) {
          if (!this._disabled && this._map._zoom < this._map.getMaxZoom()) {
            this._map.zoomIn(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
          }
        },
        _zoomOut: function(e) {
          if (!this._disabled && this._map._zoom > this._map.getMinZoom()) {
            this._map.zoomOut(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
          }
        },
        _createButton: function(html, title, className, container, fn) {
          var link = create$1("a", className, container);
          link.innerHTML = html;
          link.href = "#";
          link.title = title;
          link.setAttribute("role", "button");
          link.setAttribute("aria-label", title);
          disableClickPropagation(link);
          on(link, "click", stop);
          on(link, "click", fn, this);
          on(link, "click", this._refocusOnMap, this);
          return link;
        },
        _updateDisabled: function() {
          var map = this._map, className = "leaflet-disabled";
          removeClass(this._zoomInButton, className);
          removeClass(this._zoomOutButton, className);
          this._zoomInButton.setAttribute("aria-disabled", "false");
          this._zoomOutButton.setAttribute("aria-disabled", "false");
          if (this._disabled || map._zoom === map.getMinZoom()) {
            addClass(this._zoomOutButton, className);
            this._zoomOutButton.setAttribute("aria-disabled", "true");
          }
          if (this._disabled || map._zoom === map.getMaxZoom()) {
            addClass(this._zoomInButton, className);
            this._zoomInButton.setAttribute("aria-disabled", "true");
          }
        }
      });
      Map2.mergeOptions({
        zoomControl: true
      });
      Map2.addInitHook(function() {
        if (this.options.zoomControl) {
          this.zoomControl = new Zoom();
          this.addControl(this.zoomControl);
        }
      });
      var zoom = function(options) {
        return new Zoom(options);
      };
      var Scale = Control.extend({
        // @section
        // @aka Control.Scale options
        options: {
          position: "bottomleft",
          // @option maxWidth: Number = 100
          // Maximum width of the control in pixels. The width is set dynamically to show round values (e.g. 100, 200, 500).
          maxWidth: 100,
          // @option metric: Boolean = True
          // Whether to show the metric scale line (m/km).
          metric: true,
          // @option imperial: Boolean = True
          // Whether to show the imperial scale line (mi/ft).
          imperial: true
          // @option updateWhenIdle: Boolean = false
          // If `true`, the control is updated on [`moveend`](#map-moveend), otherwise it's always up-to-date (updated on [`move`](#map-move)).
        },
        onAdd: function(map) {
          var className = "leaflet-control-scale", container = create$1("div", className), options = this.options;
          this._addScales(options, className + "-line", container);
          map.on(options.updateWhenIdle ? "moveend" : "move", this._update, this);
          map.whenReady(this._update, this);
          return container;
        },
        onRemove: function(map) {
          map.off(this.options.updateWhenIdle ? "moveend" : "move", this._update, this);
        },
        _addScales: function(options, className, container) {
          if (options.metric) {
            this._mScale = create$1("div", className, container);
          }
          if (options.imperial) {
            this._iScale = create$1("div", className, container);
          }
        },
        _update: function() {
          var map = this._map, y = map.getSize().y / 2;
          var maxMeters = map.distance(
            map.containerPointToLatLng([0, y]),
            map.containerPointToLatLng([this.options.maxWidth, y])
          );
          this._updateScales(maxMeters);
        },
        _updateScales: function(maxMeters) {
          if (this.options.metric && maxMeters) {
            this._updateMetric(maxMeters);
          }
          if (this.options.imperial && maxMeters) {
            this._updateImperial(maxMeters);
          }
        },
        _updateMetric: function(maxMeters) {
          var meters = this._getRoundNum(maxMeters), label = meters < 1e3 ? meters + " m" : meters / 1e3 + " km";
          this._updateScale(this._mScale, label, meters / maxMeters);
        },
        _updateImperial: function(maxMeters) {
          var maxFeet = maxMeters * 3.2808399, maxMiles, miles, feet;
          if (maxFeet > 5280) {
            maxMiles = maxFeet / 5280;
            miles = this._getRoundNum(maxMiles);
            this._updateScale(this._iScale, miles + " mi", miles / maxMiles);
          } else {
            feet = this._getRoundNum(maxFeet);
            this._updateScale(this._iScale, feet + " ft", feet / maxFeet);
          }
        },
        _updateScale: function(scale2, text, ratio) {
          scale2.style.width = Math.round(this.options.maxWidth * ratio) + "px";
          scale2.innerHTML = text;
        },
        _getRoundNum: function(num2) {
          var pow10 = Math.pow(10, (Math.floor(num2) + "").length - 1), d = num2 / pow10;
          d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;
          return pow10 * d;
        }
      });
      var scale = function(options) {
        return new Scale(options);
      };
      var ukrainianFlag = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" class="leaflet-attribution-flag"><path fill="#4C7BE1" d="M0 0h12v4H0z"/><path fill="#FFD500" d="M0 4h12v3H0z"/><path fill="#E0BC00" d="M0 7h12v1H0z"/></svg>';
      var Attribution = Control.extend({
        // @section
        // @aka Control.Attribution options
        options: {
          position: "bottomright",
          // @option prefix: String|false = 'Leaflet'
          // The HTML text shown before the attributions. Pass `false` to disable.
          prefix: '<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">' + (Browser.inlineSvg ? ukrainianFlag + " " : "") + "Leaflet</a>"
        },
        initialize: function(options) {
          setOptions(this, options);
          this._attributions = {};
        },
        onAdd: function(map) {
          map.attributionControl = this;
          this._container = create$1("div", "leaflet-control-attribution");
          disableClickPropagation(this._container);
          for (var i in map._layers) {
            if (map._layers[i].getAttribution) {
              this.addAttribution(map._layers[i].getAttribution());
            }
          }
          this._update();
          map.on("layeradd", this._addAttribution, this);
          return this._container;
        },
        onRemove: function(map) {
          map.off("layeradd", this._addAttribution, this);
        },
        _addAttribution: function(ev) {
          if (ev.layer.getAttribution) {
            this.addAttribution(ev.layer.getAttribution());
            ev.layer.once("remove", function() {
              this.removeAttribution(ev.layer.getAttribution());
            }, this);
          }
        },
        // @method setPrefix(prefix: String|false): this
        // The HTML text shown before the attributions. Pass `false` to disable.
        setPrefix: function(prefix) {
          this.options.prefix = prefix;
          this._update();
          return this;
        },
        // @method addAttribution(text: String): this
        // Adds an attribution text (e.g. `'&copy; OpenStreetMap contributors'`).
        addAttribution: function(text) {
          if (!text) {
            return this;
          }
          if (!this._attributions[text]) {
            this._attributions[text] = 0;
          }
          this._attributions[text]++;
          this._update();
          return this;
        },
        // @method removeAttribution(text: String): this
        // Removes an attribution text.
        removeAttribution: function(text) {
          if (!text) {
            return this;
          }
          if (this._attributions[text]) {
            this._attributions[text]--;
            this._update();
          }
          return this;
        },
        _update: function() {
          if (!this._map) {
            return;
          }
          var attribs = [];
          for (var i in this._attributions) {
            if (this._attributions[i]) {
              attribs.push(i);
            }
          }
          var prefixAndAttribs = [];
          if (this.options.prefix) {
            prefixAndAttribs.push(this.options.prefix);
          }
          if (attribs.length) {
            prefixAndAttribs.push(attribs.join(", "));
          }
          this._container.innerHTML = prefixAndAttribs.join(' <span aria-hidden="true">|</span> ');
        }
      });
      Map2.mergeOptions({
        attributionControl: true
      });
      Map2.addInitHook(function() {
        if (this.options.attributionControl) {
          new Attribution().addTo(this);
        }
      });
      var attribution = function(options) {
        return new Attribution(options);
      };
      Control.Layers = Layers;
      Control.Zoom = Zoom;
      Control.Scale = Scale;
      Control.Attribution = Attribution;
      control.layers = layers;
      control.zoom = zoom;
      control.scale = scale;
      control.attribution = attribution;
      var Handler = Class.extend({
        initialize: function(map) {
          this._map = map;
        },
        // @method enable(): this
        // Enables the handler
        enable: function() {
          if (this._enabled) {
            return this;
          }
          this._enabled = true;
          this.addHooks();
          return this;
        },
        // @method disable(): this
        // Disables the handler
        disable: function() {
          if (!this._enabled) {
            return this;
          }
          this._enabled = false;
          this.removeHooks();
          return this;
        },
        // @method enabled(): Boolean
        // Returns `true` if the handler is enabled
        enabled: function() {
          return !!this._enabled;
        }
        // @section Extension methods
        // Classes inheriting from `Handler` must implement the two following methods:
        // @method addHooks()
        // Called when the handler is enabled, should add event hooks.
        // @method removeHooks()
        // Called when the handler is disabled, should remove the event hooks added previously.
      });
      Handler.addTo = function(map, name) {
        map.addHandler(name, this);
        return this;
      };
      var Mixin = { Events };
      var START = Browser.touch ? "touchstart mousedown" : "mousedown";
      var Draggable = Evented.extend({
        options: {
          // @section
          // @aka Draggable options
          // @option clickTolerance: Number = 3
          // The max number of pixels a user can shift the mouse pointer during a click
          // for it to be considered a valid click (as opposed to a mouse drag).
          clickTolerance: 3
        },
        // @constructor L.Draggable(el: HTMLElement, dragHandle?: HTMLElement, preventOutline?: Boolean, options?: Draggable options)
        // Creates a `Draggable` object for moving `el` when you start dragging the `dragHandle` element (equals `el` itself by default).
        initialize: function(element, dragStartTarget, preventOutline2, options) {
          setOptions(this, options);
          this._element = element;
          this._dragStartTarget = dragStartTarget || element;
          this._preventOutline = preventOutline2;
        },
        // @method enable()
        // Enables the dragging ability
        enable: function() {
          if (this._enabled) {
            return;
          }
          on(this._dragStartTarget, START, this._onDown, this);
          this._enabled = true;
        },
        // @method disable()
        // Disables the dragging ability
        disable: function() {
          if (!this._enabled) {
            return;
          }
          if (Draggable._dragging === this) {
            this.finishDrag(true);
          }
          off(this._dragStartTarget, START, this._onDown, this);
          this._enabled = false;
          this._moved = false;
        },
        _onDown: function(e) {
          if (!this._enabled) {
            return;
          }
          this._moved = false;
          if (hasClass(this._element, "leaflet-zoom-anim")) {
            return;
          }
          if (e.touches && e.touches.length !== 1) {
            if (Draggable._dragging === this) {
              this.finishDrag();
            }
            return;
          }
          if (Draggable._dragging || e.shiftKey || e.which !== 1 && e.button !== 1 && !e.touches) {
            return;
          }
          Draggable._dragging = this;
          if (this._preventOutline) {
            preventOutline(this._element);
          }
          disableImageDrag();
          disableTextSelection();
          if (this._moving) {
            return;
          }
          this.fire("down");
          var first = e.touches ? e.touches[0] : e, sizedParent = getSizedParentNode(this._element);
          this._startPoint = new Point(first.clientX, first.clientY);
          this._startPos = getPosition(this._element);
          this._parentScale = getScale(sizedParent);
          var mouseevent = e.type === "mousedown";
          on(document, mouseevent ? "mousemove" : "touchmove", this._onMove, this);
          on(document, mouseevent ? "mouseup" : "touchend touchcancel", this._onUp, this);
        },
        _onMove: function(e) {
          if (!this._enabled) {
            return;
          }
          if (e.touches && e.touches.length > 1) {
            this._moved = true;
            return;
          }
          var first = e.touches && e.touches.length === 1 ? e.touches[0] : e, offset = new Point(first.clientX, first.clientY)._subtract(this._startPoint);
          if (!offset.x && !offset.y) {
            return;
          }
          if (Math.abs(offset.x) + Math.abs(offset.y) < this.options.clickTolerance) {
            return;
          }
          offset.x /= this._parentScale.x;
          offset.y /= this._parentScale.y;
          preventDefault(e);
          if (!this._moved) {
            this.fire("dragstart");
            this._moved = true;
            addClass(document.body, "leaflet-dragging");
            this._lastTarget = e.target || e.srcElement;
            if (window.SVGElementInstance && this._lastTarget instanceof window.SVGElementInstance) {
              this._lastTarget = this._lastTarget.correspondingUseElement;
            }
            addClass(this._lastTarget, "leaflet-drag-target");
          }
          this._newPos = this._startPos.add(offset);
          this._moving = true;
          this._lastEvent = e;
          this._updatePosition();
        },
        _updatePosition: function() {
          var e = { originalEvent: this._lastEvent };
          this.fire("predrag", e);
          setPosition(this._element, this._newPos);
          this.fire("drag", e);
        },
        _onUp: function() {
          if (!this._enabled) {
            return;
          }
          this.finishDrag();
        },
        finishDrag: function(noInertia) {
          removeClass(document.body, "leaflet-dragging");
          if (this._lastTarget) {
            removeClass(this._lastTarget, "leaflet-drag-target");
            this._lastTarget = null;
          }
          off(document, "mousemove touchmove", this._onMove, this);
          off(document, "mouseup touchend touchcancel", this._onUp, this);
          enableImageDrag();
          enableTextSelection();
          var fireDragend = this._moved && this._moving;
          this._moving = false;
          Draggable._dragging = false;
          if (fireDragend) {
            this.fire("dragend", {
              noInertia,
              distance: this._newPos.distanceTo(this._startPos)
            });
          }
        }
      });
      function clipPolygon(points, bounds, round) {
        var clippedPoints, edges = [1, 4, 2, 8], i, j, k, a, b, len, edge2, p;
        for (i = 0, len = points.length; i < len; i++) {
          points[i]._code = _getBitCode(points[i], bounds);
        }
        for (k = 0; k < 4; k++) {
          edge2 = edges[k];
          clippedPoints = [];
          for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
            a = points[i];
            b = points[j];
            if (!(a._code & edge2)) {
              if (b._code & edge2) {
                p = _getEdgeIntersection(b, a, edge2, bounds, round);
                p._code = _getBitCode(p, bounds);
                clippedPoints.push(p);
              }
              clippedPoints.push(a);
            } else if (!(b._code & edge2)) {
              p = _getEdgeIntersection(b, a, edge2, bounds, round);
              p._code = _getBitCode(p, bounds);
              clippedPoints.push(p);
            }
          }
          points = clippedPoints;
        }
        return points;
      }
      function polygonCenter(latlngs, crs) {
        var i, j, p1, p2, f, area, x, y, center;
        if (!latlngs || latlngs.length === 0) {
          throw new Error("latlngs not passed");
        }
        if (!isFlat(latlngs)) {
          console.warn("latlngs are not flat! Only the first ring will be used");
          latlngs = latlngs[0];
        }
        var centroidLatLng = toLatLng([0, 0]);
        var bounds = toLatLngBounds(latlngs);
        var areaBounds = bounds.getNorthWest().distanceTo(bounds.getSouthWest()) * bounds.getNorthEast().distanceTo(bounds.getNorthWest());
        if (areaBounds < 1700) {
          centroidLatLng = centroid(latlngs);
        }
        var len = latlngs.length;
        var points = [];
        for (i = 0; i < len; i++) {
          var latlng = toLatLng(latlngs[i]);
          points.push(crs.project(toLatLng([latlng.lat - centroidLatLng.lat, latlng.lng - centroidLatLng.lng])));
        }
        area = x = y = 0;
        for (i = 0, j = len - 1; i < len; j = i++) {
          p1 = points[i];
          p2 = points[j];
          f = p1.y * p2.x - p2.y * p1.x;
          x += (p1.x + p2.x) * f;
          y += (p1.y + p2.y) * f;
          area += f * 3;
        }
        if (area === 0) {
          center = points[0];
        } else {
          center = [x / area, y / area];
        }
        var latlngCenter = crs.unproject(toPoint(center));
        return toLatLng([latlngCenter.lat + centroidLatLng.lat, latlngCenter.lng + centroidLatLng.lng]);
      }
      function centroid(coords) {
        var latSum = 0;
        var lngSum = 0;
        var len = 0;
        for (var i = 0; i < coords.length; i++) {
          var latlng = toLatLng(coords[i]);
          latSum += latlng.lat;
          lngSum += latlng.lng;
          len++;
        }
        return toLatLng([latSum / len, lngSum / len]);
      }
      var PolyUtil = {
        __proto__: null,
        clipPolygon,
        polygonCenter,
        centroid
      };
      function simplify(points, tolerance) {
        if (!tolerance || !points.length) {
          return points.slice();
        }
        var sqTolerance = tolerance * tolerance;
        points = _reducePoints(points, sqTolerance);
        points = _simplifyDP(points, sqTolerance);
        return points;
      }
      function pointToSegmentDistance(p, p1, p2) {
        return Math.sqrt(_sqClosestPointOnSegment(p, p1, p2, true));
      }
      function closestPointOnSegment(p, p1, p2) {
        return _sqClosestPointOnSegment(p, p1, p2);
      }
      function _simplifyDP(points, sqTolerance) {
        var len = points.length, ArrayConstructor = typeof Uint8Array !== "undefined" ? Uint8Array : Array, markers = new ArrayConstructor(len);
        markers[0] = markers[len - 1] = 1;
        _simplifyDPStep(points, markers, sqTolerance, 0, len - 1);
        var i, newPoints = [];
        for (i = 0; i < len; i++) {
          if (markers[i]) {
            newPoints.push(points[i]);
          }
        }
        return newPoints;
      }
      function _simplifyDPStep(points, markers, sqTolerance, first, last) {
        var maxSqDist = 0, index2, i, sqDist;
        for (i = first + 1; i <= last - 1; i++) {
          sqDist = _sqClosestPointOnSegment(points[i], points[first], points[last], true);
          if (sqDist > maxSqDist) {
            index2 = i;
            maxSqDist = sqDist;
          }
        }
        if (maxSqDist > sqTolerance) {
          markers[index2] = 1;
          _simplifyDPStep(points, markers, sqTolerance, first, index2);
          _simplifyDPStep(points, markers, sqTolerance, index2, last);
        }
      }
      function _reducePoints(points, sqTolerance) {
        var reducedPoints = [points[0]];
        for (var i = 1, prev = 0, len = points.length; i < len; i++) {
          if (_sqDist(points[i], points[prev]) > sqTolerance) {
            reducedPoints.push(points[i]);
            prev = i;
          }
        }
        if (prev < len - 1) {
          reducedPoints.push(points[len - 1]);
        }
        return reducedPoints;
      }
      var _lastCode;
      function clipSegment(a, b, bounds, useLastCode, round) {
        var codeA = useLastCode ? _lastCode : _getBitCode(a, bounds), codeB = _getBitCode(b, bounds), codeOut, p, newCode;
        _lastCode = codeB;
        while (true) {
          if (!(codeA | codeB)) {
            return [a, b];
          }
          if (codeA & codeB) {
            return false;
          }
          codeOut = codeA || codeB;
          p = _getEdgeIntersection(a, b, codeOut, bounds, round);
          newCode = _getBitCode(p, bounds);
          if (codeOut === codeA) {
            a = p;
            codeA = newCode;
          } else {
            b = p;
            codeB = newCode;
          }
        }
      }
      function _getEdgeIntersection(a, b, code, bounds, round) {
        var dx = b.x - a.x, dy = b.y - a.y, min = bounds.min, max = bounds.max, x, y;
        if (code & 8) {
          x = a.x + dx * (max.y - a.y) / dy;
          y = max.y;
        } else if (code & 4) {
          x = a.x + dx * (min.y - a.y) / dy;
          y = min.y;
        } else if (code & 2) {
          x = max.x;
          y = a.y + dy * (max.x - a.x) / dx;
        } else if (code & 1) {
          x = min.x;
          y = a.y + dy * (min.x - a.x) / dx;
        }
        return new Point(x, y, round);
      }
      function _getBitCode(p, bounds) {
        var code = 0;
        if (p.x < bounds.min.x) {
          code |= 1;
        } else if (p.x > bounds.max.x) {
          code |= 2;
        }
        if (p.y < bounds.min.y) {
          code |= 4;
        } else if (p.y > bounds.max.y) {
          code |= 8;
        }
        return code;
      }
      function _sqDist(p1, p2) {
        var dx = p2.x - p1.x, dy = p2.y - p1.y;
        return dx * dx + dy * dy;
      }
      function _sqClosestPointOnSegment(p, p1, p2, sqDist) {
        var x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y, dot = dx * dx + dy * dy, t;
        if (dot > 0) {
          t = ((p.x - x) * dx + (p.y - y) * dy) / dot;
          if (t > 1) {
            x = p2.x;
            y = p2.y;
          } else if (t > 0) {
            x += dx * t;
            y += dy * t;
          }
        }
        dx = p.x - x;
        dy = p.y - y;
        return sqDist ? dx * dx + dy * dy : new Point(x, y);
      }
      function isFlat(latlngs) {
        return !isArray2(latlngs[0]) || typeof latlngs[0][0] !== "object" && typeof latlngs[0][0] !== "undefined";
      }
      function _flat(latlngs) {
        console.warn("Deprecated use of _flat, please use L.LineUtil.isFlat instead.");
        return isFlat(latlngs);
      }
      function polylineCenter(latlngs, crs) {
        var i, halfDist, segDist, dist, p1, p2, ratio, center;
        if (!latlngs || latlngs.length === 0) {
          throw new Error("latlngs not passed");
        }
        if (!isFlat(latlngs)) {
          console.warn("latlngs are not flat! Only the first ring will be used");
          latlngs = latlngs[0];
        }
        var centroidLatLng = toLatLng([0, 0]);
        var bounds = toLatLngBounds(latlngs);
        var areaBounds = bounds.getNorthWest().distanceTo(bounds.getSouthWest()) * bounds.getNorthEast().distanceTo(bounds.getNorthWest());
        if (areaBounds < 1700) {
          centroidLatLng = centroid(latlngs);
        }
        var len = latlngs.length;
        var points = [];
        for (i = 0; i < len; i++) {
          var latlng = toLatLng(latlngs[i]);
          points.push(crs.project(toLatLng([latlng.lat - centroidLatLng.lat, latlng.lng - centroidLatLng.lng])));
        }
        for (i = 0, halfDist = 0; i < len - 1; i++) {
          halfDist += points[i].distanceTo(points[i + 1]) / 2;
        }
        if (halfDist === 0) {
          center = points[0];
        } else {
          for (i = 0, dist = 0; i < len - 1; i++) {
            p1 = points[i];
            p2 = points[i + 1];
            segDist = p1.distanceTo(p2);
            dist += segDist;
            if (dist > halfDist) {
              ratio = (dist - halfDist) / segDist;
              center = [
                p2.x - ratio * (p2.x - p1.x),
                p2.y - ratio * (p2.y - p1.y)
              ];
              break;
            }
          }
        }
        var latlngCenter = crs.unproject(toPoint(center));
        return toLatLng([latlngCenter.lat + centroidLatLng.lat, latlngCenter.lng + centroidLatLng.lng]);
      }
      var LineUtil = {
        __proto__: null,
        simplify,
        pointToSegmentDistance,
        closestPointOnSegment,
        clipSegment,
        _getEdgeIntersection,
        _getBitCode,
        _sqClosestPointOnSegment,
        isFlat,
        _flat,
        polylineCenter
      };
      var LonLat = {
        project: function(latlng) {
          return new Point(latlng.lng, latlng.lat);
        },
        unproject: function(point) {
          return new LatLng(point.y, point.x);
        },
        bounds: new Bounds([-180, -90], [180, 90])
      };
      var Mercator = {
        R: 6378137,
        R_MINOR: 6356752314245179e-9,
        bounds: new Bounds([-2003750834279e-5, -1549657073972e-5], [2003750834279e-5, 1876465623138e-5]),
        project: function(latlng) {
          var d = Math.PI / 180, r = this.R, y = latlng.lat * d, tmp = this.R_MINOR / r, e = Math.sqrt(1 - tmp * tmp), con = e * Math.sin(y);
          var ts = Math.tan(Math.PI / 4 - y / 2) / Math.pow((1 - con) / (1 + con), e / 2);
          y = -r * Math.log(Math.max(ts, 1e-10));
          return new Point(latlng.lng * d * r, y);
        },
        unproject: function(point) {
          var d = 180 / Math.PI, r = this.R, tmp = this.R_MINOR / r, e = Math.sqrt(1 - tmp * tmp), ts = Math.exp(-point.y / r), phi = Math.PI / 2 - 2 * Math.atan(ts);
          for (var i = 0, dphi = 0.1, con; i < 15 && Math.abs(dphi) > 1e-7; i++) {
            con = e * Math.sin(phi);
            con = Math.pow((1 - con) / (1 + con), e / 2);
            dphi = Math.PI / 2 - 2 * Math.atan(ts * con) - phi;
            phi += dphi;
          }
          return new LatLng(phi * d, point.x * d / r);
        }
      };
      var index = {
        __proto__: null,
        LonLat,
        Mercator,
        SphericalMercator
      };
      var EPSG3395 = extend({}, Earth, {
        code: "EPSG:3395",
        projection: Mercator,
        transformation: function() {
          var scale2 = 0.5 / (Math.PI * Mercator.R);
          return toTransformation(scale2, 0.5, -scale2, 0.5);
        }()
      });
      var EPSG4326 = extend({}, Earth, {
        code: "EPSG:4326",
        projection: LonLat,
        transformation: toTransformation(1 / 180, 1, -1 / 180, 0.5)
      });
      var Simple = extend({}, CRS, {
        projection: LonLat,
        transformation: toTransformation(1, 0, -1, 0),
        scale: function(zoom2) {
          return Math.pow(2, zoom2);
        },
        zoom: function(scale2) {
          return Math.log(scale2) / Math.LN2;
        },
        distance: function(latlng1, latlng2) {
          var dx = latlng2.lng - latlng1.lng, dy = latlng2.lat - latlng1.lat;
          return Math.sqrt(dx * dx + dy * dy);
        },
        infinite: true
      });
      CRS.Earth = Earth;
      CRS.EPSG3395 = EPSG3395;
      CRS.EPSG3857 = EPSG3857;
      CRS.EPSG900913 = EPSG900913;
      CRS.EPSG4326 = EPSG4326;
      CRS.Simple = Simple;
      var Layer = Evented.extend({
        // Classes extending `L.Layer` will inherit the following options:
        options: {
          // @option pane: String = 'overlayPane'
          // By default the layer will be added to the map's [overlay pane](#map-overlaypane). Overriding this option will cause the layer to be placed on another pane by default.
          pane: "overlayPane",
          // @option attribution: String = null
          // String to be shown in the attribution control, e.g. "© OpenStreetMap contributors". It describes the layer data and is often a legal obligation towards copyright holders and tile providers.
          attribution: null,
          bubblingMouseEvents: true
        },
        /* @section
         * Classes extending `L.Layer` will inherit the following methods:
         *
         * @method addTo(map: Map|LayerGroup): this
         * Adds the layer to the given map or layer group.
         */
        addTo: function(map) {
          map.addLayer(this);
          return this;
        },
        // @method remove: this
        // Removes the layer from the map it is currently active on.
        remove: function() {
          return this.removeFrom(this._map || this._mapToAdd);
        },
        // @method removeFrom(map: Map): this
        // Removes the layer from the given map
        //
        // @alternative
        // @method removeFrom(group: LayerGroup): this
        // Removes the layer from the given `LayerGroup`
        removeFrom: function(obj) {
          if (obj) {
            obj.removeLayer(this);
          }
          return this;
        },
        // @method getPane(name? : String): HTMLElement
        // Returns the `HTMLElement` representing the named pane on the map. If `name` is omitted, returns the pane for this layer.
        getPane: function(name) {
          return this._map.getPane(name ? this.options[name] || name : this.options.pane);
        },
        addInteractiveTarget: function(targetEl) {
          this._map._targets[stamp(targetEl)] = this;
          return this;
        },
        removeInteractiveTarget: function(targetEl) {
          delete this._map._targets[stamp(targetEl)];
          return this;
        },
        // @method getAttribution: String
        // Used by the `attribution control`, returns the [attribution option](#gridlayer-attribution).
        getAttribution: function() {
          return this.options.attribution;
        },
        _layerAdd: function(e) {
          var map = e.target;
          if (!map.hasLayer(this)) {
            return;
          }
          this._map = map;
          this._zoomAnimated = map._zoomAnimated;
          if (this.getEvents) {
            var events = this.getEvents();
            map.on(events, this);
            this.once("remove", function() {
              map.off(events, this);
            }, this);
          }
          this.onAdd(map);
          this.fire("add");
          map.fire("layeradd", { layer: this });
        }
      });
      Map2.include({
        // @method addLayer(layer: Layer): this
        // Adds the given layer to the map
        addLayer: function(layer) {
          if (!layer._layerAdd) {
            throw new Error("The provided object is not a Layer.");
          }
          var id = stamp(layer);
          if (this._layers[id]) {
            return this;
          }
          this._layers[id] = layer;
          layer._mapToAdd = this;
          if (layer.beforeAdd) {
            layer.beforeAdd(this);
          }
          this.whenReady(layer._layerAdd, layer);
          return this;
        },
        // @method removeLayer(layer: Layer): this
        // Removes the given layer from the map.
        removeLayer: function(layer) {
          var id = stamp(layer);
          if (!this._layers[id]) {
            return this;
          }
          if (this._loaded) {
            layer.onRemove(this);
          }
          delete this._layers[id];
          if (this._loaded) {
            this.fire("layerremove", { layer });
            layer.fire("remove");
          }
          layer._map = layer._mapToAdd = null;
          return this;
        },
        // @method hasLayer(layer: Layer): Boolean
        // Returns `true` if the given layer is currently added to the map
        hasLayer: function(layer) {
          return stamp(layer) in this._layers;
        },
        /* @method eachLayer(fn: Function, context?: Object): this
         * Iterates over the layers of the map, optionally specifying context of the iterator function.
         * ```
         * map.eachLayer(function(layer){
         *     layer.bindPopup('Hello');
         * });
         * ```
         */
        eachLayer: function(method, context) {
          for (var i in this._layers) {
            method.call(context, this._layers[i]);
          }
          return this;
        },
        _addLayers: function(layers2) {
          layers2 = layers2 ? isArray2(layers2) ? layers2 : [layers2] : [];
          for (var i = 0, len = layers2.length; i < len; i++) {
            this.addLayer(layers2[i]);
          }
        },
        _addZoomLimit: function(layer) {
          if (!isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom)) {
            this._zoomBoundLayers[stamp(layer)] = layer;
            this._updateZoomLevels();
          }
        },
        _removeZoomLimit: function(layer) {
          var id = stamp(layer);
          if (this._zoomBoundLayers[id]) {
            delete this._zoomBoundLayers[id];
            this._updateZoomLevels();
          }
        },
        _updateZoomLevels: function() {
          var minZoom = Infinity, maxZoom = -Infinity, oldZoomSpan = this._getZoomSpan();
          for (var i in this._zoomBoundLayers) {
            var options = this._zoomBoundLayers[i].options;
            minZoom = options.minZoom === void 0 ? minZoom : Math.min(minZoom, options.minZoom);
            maxZoom = options.maxZoom === void 0 ? maxZoom : Math.max(maxZoom, options.maxZoom);
          }
          this._layersMaxZoom = maxZoom === -Infinity ? void 0 : maxZoom;
          this._layersMinZoom = minZoom === Infinity ? void 0 : minZoom;
          if (oldZoomSpan !== this._getZoomSpan()) {
            this.fire("zoomlevelschange");
          }
          if (this.options.maxZoom === void 0 && this._layersMaxZoom && this.getZoom() > this._layersMaxZoom) {
            this.setZoom(this._layersMaxZoom);
          }
          if (this.options.minZoom === void 0 && this._layersMinZoom && this.getZoom() < this._layersMinZoom) {
            this.setZoom(this._layersMinZoom);
          }
        }
      });
      var LayerGroup = Layer.extend({
        initialize: function(layers2, options) {
          setOptions(this, options);
          this._layers = {};
          var i, len;
          if (layers2) {
            for (i = 0, len = layers2.length; i < len; i++) {
              this.addLayer(layers2[i]);
            }
          }
        },
        // @method addLayer(layer: Layer): this
        // Adds the given layer to the group.
        addLayer: function(layer) {
          var id = this.getLayerId(layer);
          this._layers[id] = layer;
          if (this._map) {
            this._map.addLayer(layer);
          }
          return this;
        },
        // @method removeLayer(layer: Layer): this
        // Removes the given layer from the group.
        // @alternative
        // @method removeLayer(id: Number): this
        // Removes the layer with the given internal ID from the group.
        removeLayer: function(layer) {
          var id = layer in this._layers ? layer : this.getLayerId(layer);
          if (this._map && this._layers[id]) {
            this._map.removeLayer(this._layers[id]);
          }
          delete this._layers[id];
          return this;
        },
        // @method hasLayer(layer: Layer): Boolean
        // Returns `true` if the given layer is currently added to the group.
        // @alternative
        // @method hasLayer(id: Number): Boolean
        // Returns `true` if the given internal ID is currently added to the group.
        hasLayer: function(layer) {
          var layerId = typeof layer === "number" ? layer : this.getLayerId(layer);
          return layerId in this._layers;
        },
        // @method clearLayers(): this
        // Removes all the layers from the group.
        clearLayers: function() {
          return this.eachLayer(this.removeLayer, this);
        },
        // @method invoke(methodName: String, …): this
        // Calls `methodName` on every layer contained in this group, passing any
        // additional parameters. Has no effect if the layers contained do not
        // implement `methodName`.
        invoke: function(methodName) {
          var args = Array.prototype.slice.call(arguments, 1), i, layer;
          for (i in this._layers) {
            layer = this._layers[i];
            if (layer[methodName]) {
              layer[methodName].apply(layer, args);
            }
          }
          return this;
        },
        onAdd: function(map) {
          this.eachLayer(map.addLayer, map);
        },
        onRemove: function(map) {
          this.eachLayer(map.removeLayer, map);
        },
        // @method eachLayer(fn: Function, context?: Object): this
        // Iterates over the layers of the group, optionally specifying context of the iterator function.
        // ```js
        // group.eachLayer(function (layer) {
        // 	layer.bindPopup('Hello');
        // });
        // ```
        eachLayer: function(method, context) {
          for (var i in this._layers) {
            method.call(context, this._layers[i]);
          }
          return this;
        },
        // @method getLayer(id: Number): Layer
        // Returns the layer with the given internal ID.
        getLayer: function(id) {
          return this._layers[id];
        },
        // @method getLayers(): Layer[]
        // Returns an array of all the layers added to the group.
        getLayers: function() {
          var layers2 = [];
          this.eachLayer(layers2.push, layers2);
          return layers2;
        },
        // @method setZIndex(zIndex: Number): this
        // Calls `setZIndex` on every layer contained in this group, passing the z-index.
        setZIndex: function(zIndex) {
          return this.invoke("setZIndex", zIndex);
        },
        // @method getLayerId(layer: Layer): Number
        // Returns the internal ID for a layer
        getLayerId: function(layer) {
          return stamp(layer);
        }
      });
      var layerGroup = function(layers2, options) {
        return new LayerGroup(layers2, options);
      };
      var FeatureGroup = LayerGroup.extend({
        addLayer: function(layer) {
          if (this.hasLayer(layer)) {
            return this;
          }
          layer.addEventParent(this);
          LayerGroup.prototype.addLayer.call(this, layer);
          return this.fire("layeradd", { layer });
        },
        removeLayer: function(layer) {
          if (!this.hasLayer(layer)) {
            return this;
          }
          if (layer in this._layers) {
            layer = this._layers[layer];
          }
          layer.removeEventParent(this);
          LayerGroup.prototype.removeLayer.call(this, layer);
          return this.fire("layerremove", { layer });
        },
        // @method setStyle(style: Path options): this
        // Sets the given path options to each layer of the group that has a `setStyle` method.
        setStyle: function(style2) {
          return this.invoke("setStyle", style2);
        },
        // @method bringToFront(): this
        // Brings the layer group to the top of all other layers
        bringToFront: function() {
          return this.invoke("bringToFront");
        },
        // @method bringToBack(): this
        // Brings the layer group to the back of all other layers
        bringToBack: function() {
          return this.invoke("bringToBack");
        },
        // @method getBounds(): LatLngBounds
        // Returns the LatLngBounds of the Feature Group (created from bounds and coordinates of its children).
        getBounds: function() {
          var bounds = new LatLngBounds();
          for (var id in this._layers) {
            var layer = this._layers[id];
            bounds.extend(layer.getBounds ? layer.getBounds() : layer.getLatLng());
          }
          return bounds;
        }
      });
      var featureGroup = function(layers2, options) {
        return new FeatureGroup(layers2, options);
      };
      var Icon = Class.extend({
        /* @section
         * @aka Icon options
         *
         * @option iconUrl: String = null
         * **(required)** The URL to the icon image (absolute or relative to your script path).
         *
         * @option iconRetinaUrl: String = null
         * The URL to a retina sized version of the icon image (absolute or relative to your
         * script path). Used for Retina screen devices.
         *
         * @option iconSize: Point = null
         * Size of the icon image in pixels.
         *
         * @option iconAnchor: Point = null
         * The coordinates of the "tip" of the icon (relative to its top left corner). The icon
         * will be aligned so that this point is at the marker's geographical location. Centered
         * by default if size is specified, also can be set in CSS with negative margins.
         *
         * @option popupAnchor: Point = [0, 0]
         * The coordinates of the point from which popups will "open", relative to the icon anchor.
         *
         * @option tooltipAnchor: Point = [0, 0]
         * The coordinates of the point from which tooltips will "open", relative to the icon anchor.
         *
         * @option shadowUrl: String = null
         * The URL to the icon shadow image. If not specified, no shadow image will be created.
         *
         * @option shadowRetinaUrl: String = null
         *
         * @option shadowSize: Point = null
         * Size of the shadow image in pixels.
         *
         * @option shadowAnchor: Point = null
         * The coordinates of the "tip" of the shadow (relative to its top left corner) (the same
         * as iconAnchor if not specified).
         *
         * @option className: String = ''
         * A custom class name to assign to both icon and shadow images. Empty by default.
         */
        options: {
          popupAnchor: [0, 0],
          tooltipAnchor: [0, 0],
          // @option crossOrigin: Boolean|String = false
          // Whether the crossOrigin attribute will be added to the tiles.
          // If a String is provided, all tiles will have their crossOrigin attribute set to the String provided. This is needed if you want to access tile pixel data.
          // Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
          crossOrigin: false
        },
        initialize: function(options) {
          setOptions(this, options);
        },
        // @method createIcon(oldIcon?: HTMLElement): HTMLElement
        // Called internally when the icon has to be shown, returns a `<img>` HTML element
        // styled according to the options.
        createIcon: function(oldIcon) {
          return this._createIcon("icon", oldIcon);
        },
        // @method createShadow(oldIcon?: HTMLElement): HTMLElement
        // As `createIcon`, but for the shadow beneath it.
        createShadow: function(oldIcon) {
          return this._createIcon("shadow", oldIcon);
        },
        _createIcon: function(name, oldIcon) {
          var src = this._getIconUrl(name);
          if (!src) {
            if (name === "icon") {
              throw new Error("iconUrl not set in Icon options (see the docs).");
            }
            return null;
          }
          var img = this._createImg(src, oldIcon && oldIcon.tagName === "IMG" ? oldIcon : null);
          this._setIconStyles(img, name);
          if (this.options.crossOrigin || this.options.crossOrigin === "") {
            img.crossOrigin = this.options.crossOrigin === true ? "" : this.options.crossOrigin;
          }
          return img;
        },
        _setIconStyles: function(img, name) {
          var options = this.options;
          var sizeOption = options[name + "Size"];
          if (typeof sizeOption === "number") {
            sizeOption = [sizeOption, sizeOption];
          }
          var size = toPoint(sizeOption), anchor = toPoint(name === "shadow" && options.shadowAnchor || options.iconAnchor || size && size.divideBy(2, true));
          img.className = "leaflet-marker-" + name + " " + (options.className || "");
          if (anchor) {
            img.style.marginLeft = -anchor.x + "px";
            img.style.marginTop = -anchor.y + "px";
          }
          if (size) {
            img.style.width = size.x + "px";
            img.style.height = size.y + "px";
          }
        },
        _createImg: function(src, el) {
          el = el || document.createElement("img");
          el.src = src;
          return el;
        },
        _getIconUrl: function(name) {
          return Browser.retina && this.options[name + "RetinaUrl"] || this.options[name + "Url"];
        }
      });
      function icon(options) {
        return new Icon(options);
      }
      var IconDefault = Icon.extend({
        options: {
          iconUrl: "marker-icon.png",
          iconRetinaUrl: "marker-icon-2x.png",
          shadowUrl: "marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          tooltipAnchor: [16, -28],
          shadowSize: [41, 41]
        },
        _getIconUrl: function(name) {
          if (typeof IconDefault.imagePath !== "string") {
            IconDefault.imagePath = this._detectIconPath();
          }
          return (this.options.imagePath || IconDefault.imagePath) + Icon.prototype._getIconUrl.call(this, name);
        },
        _stripUrl: function(path) {
          var strip = function(str, re, idx) {
            var match = re.exec(str);
            return match && match[idx];
          };
          path = strip(path, /^url\((['"])?(.+)\1\)$/, 2);
          return path && strip(path, /^(.*)marker-icon\.png$/, 1);
        },
        _detectIconPath: function() {
          var el = create$1("div", "leaflet-default-icon-path", document.body);
          var path = getStyle(el, "background-image") || getStyle(el, "backgroundImage");
          document.body.removeChild(el);
          path = this._stripUrl(path);
          if (path) {
            return path;
          }
          var link = document.querySelector('link[href$="leaflet.css"]');
          if (!link) {
            return "";
          }
          return link.href.substring(0, link.href.length - "leaflet.css".length - 1);
        }
      });
      var MarkerDrag = Handler.extend({
        initialize: function(marker2) {
          this._marker = marker2;
        },
        addHooks: function() {
          var icon2 = this._marker._icon;
          if (!this._draggable) {
            this._draggable = new Draggable(icon2, icon2, true);
          }
          this._draggable.on({
            dragstart: this._onDragStart,
            predrag: this._onPreDrag,
            drag: this._onDrag,
            dragend: this._onDragEnd
          }, this).enable();
          addClass(icon2, "leaflet-marker-draggable");
        },
        removeHooks: function() {
          this._draggable.off({
            dragstart: this._onDragStart,
            predrag: this._onPreDrag,
            drag: this._onDrag,
            dragend: this._onDragEnd
          }, this).disable();
          if (this._marker._icon) {
            removeClass(this._marker._icon, "leaflet-marker-draggable");
          }
        },
        moved: function() {
          return this._draggable && this._draggable._moved;
        },
        _adjustPan: function(e) {
          var marker2 = this._marker, map = marker2._map, speed = this._marker.options.autoPanSpeed, padding = this._marker.options.autoPanPadding, iconPos = getPosition(marker2._icon), bounds = map.getPixelBounds(), origin = map.getPixelOrigin();
          var panBounds = toBounds(
            bounds.min._subtract(origin).add(padding),
            bounds.max._subtract(origin).subtract(padding)
          );
          if (!panBounds.contains(iconPos)) {
            var movement = toPoint(
              (Math.max(panBounds.max.x, iconPos.x) - panBounds.max.x) / (bounds.max.x - panBounds.max.x) - (Math.min(panBounds.min.x, iconPos.x) - panBounds.min.x) / (bounds.min.x - panBounds.min.x),
              (Math.max(panBounds.max.y, iconPos.y) - panBounds.max.y) / (bounds.max.y - panBounds.max.y) - (Math.min(panBounds.min.y, iconPos.y) - panBounds.min.y) / (bounds.min.y - panBounds.min.y)
            ).multiplyBy(speed);
            map.panBy(movement, { animate: false });
            this._draggable._newPos._add(movement);
            this._draggable._startPos._add(movement);
            setPosition(marker2._icon, this._draggable._newPos);
            this._onDrag(e);
            this._panRequest = requestAnimFrame(this._adjustPan.bind(this, e));
          }
        },
        _onDragStart: function() {
          this._oldLatLng = this._marker.getLatLng();
          this._marker.closePopup && this._marker.closePopup();
          this._marker.fire("movestart").fire("dragstart");
        },
        _onPreDrag: function(e) {
          if (this._marker.options.autoPan) {
            cancelAnimFrame(this._panRequest);
            this._panRequest = requestAnimFrame(this._adjustPan.bind(this, e));
          }
        },
        _onDrag: function(e) {
          var marker2 = this._marker, shadow = marker2._shadow, iconPos = getPosition(marker2._icon), latlng = marker2._map.layerPointToLatLng(iconPos);
          if (shadow) {
            setPosition(shadow, iconPos);
          }
          marker2._latlng = latlng;
          e.latlng = latlng;
          e.oldLatLng = this._oldLatLng;
          marker2.fire("move", e).fire("drag", e);
        },
        _onDragEnd: function(e) {
          cancelAnimFrame(this._panRequest);
          delete this._oldLatLng;
          this._marker.fire("moveend").fire("dragend", e);
        }
      });
      var Marker = Layer.extend({
        // @section
        // @aka Marker options
        options: {
          // @option icon: Icon = *
          // Icon instance to use for rendering the marker.
          // See [Icon documentation](#L.Icon) for details on how to customize the marker icon.
          // If not specified, a common instance of `L.Icon.Default` is used.
          icon: new IconDefault(),
          // Option inherited from "Interactive layer" abstract class
          interactive: true,
          // @option keyboard: Boolean = true
          // Whether the marker can be tabbed to with a keyboard and clicked by pressing enter.
          keyboard: true,
          // @option title: String = ''
          // Text for the browser tooltip that appear on marker hover (no tooltip by default).
          // [Useful for accessibility](https://leafletjs.com/examples/accessibility/#markers-must-be-labelled).
          title: "",
          // @option alt: String = 'Marker'
          // Text for the `alt` attribute of the icon image.
          // [Useful for accessibility](https://leafletjs.com/examples/accessibility/#markers-must-be-labelled).
          alt: "Marker",
          // @option zIndexOffset: Number = 0
          // By default, marker images zIndex is set automatically based on its latitude. Use this option if you want to put the marker on top of all others (or below), specifying a high value like `1000` (or high negative value, respectively).
          zIndexOffset: 0,
          // @option opacity: Number = 1.0
          // The opacity of the marker.
          opacity: 1,
          // @option riseOnHover: Boolean = false
          // If `true`, the marker will get on top of others when you hover the mouse over it.
          riseOnHover: false,
          // @option riseOffset: Number = 250
          // The z-index offset used for the `riseOnHover` feature.
          riseOffset: 250,
          // @option pane: String = 'markerPane'
          // `Map pane` where the markers icon will be added.
          pane: "markerPane",
          // @option shadowPane: String = 'shadowPane'
          // `Map pane` where the markers shadow will be added.
          shadowPane: "shadowPane",
          // @option bubblingMouseEvents: Boolean = false
          // When `true`, a mouse event on this marker will trigger the same event on the map
          // (unless [`L.DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
          bubblingMouseEvents: false,
          // @option autoPanOnFocus: Boolean = true
          // When `true`, the map will pan whenever the marker is focused (via
          // e.g. pressing `tab` on the keyboard) to ensure the marker is
          // visible within the map's bounds
          autoPanOnFocus: true,
          // @section Draggable marker options
          // @option draggable: Boolean = false
          // Whether the marker is draggable with mouse/touch or not.
          draggable: false,
          // @option autoPan: Boolean = false
          // Whether to pan the map when dragging this marker near its edge or not.
          autoPan: false,
          // @option autoPanPadding: Point = Point(50, 50)
          // Distance (in pixels to the left/right and to the top/bottom) of the
          // map edge to start panning the map.
          autoPanPadding: [50, 50],
          // @option autoPanSpeed: Number = 10
          // Number of pixels the map should pan by.
          autoPanSpeed: 10
        },
        /* @section
         *
         * In addition to [shared layer methods](#Layer) like `addTo()` and `remove()` and [popup methods](#Popup) like bindPopup() you can also use the following methods:
         */
        initialize: function(latlng, options) {
          setOptions(this, options);
          this._latlng = toLatLng(latlng);
        },
        onAdd: function(map) {
          this._zoomAnimated = this._zoomAnimated && map.options.markerZoomAnimation;
          if (this._zoomAnimated) {
            map.on("zoomanim", this._animateZoom, this);
          }
          this._initIcon();
          this.update();
        },
        onRemove: function(map) {
          if (this.dragging && this.dragging.enabled()) {
            this.options.draggable = true;
            this.dragging.removeHooks();
          }
          delete this.dragging;
          if (this._zoomAnimated) {
            map.off("zoomanim", this._animateZoom, this);
          }
          this._removeIcon();
          this._removeShadow();
        },
        getEvents: function() {
          return {
            zoom: this.update,
            viewreset: this.update
          };
        },
        // @method getLatLng: LatLng
        // Returns the current geographical position of the marker.
        getLatLng: function() {
          return this._latlng;
        },
        // @method setLatLng(latlng: LatLng): this
        // Changes the marker position to the given point.
        setLatLng: function(latlng) {
          var oldLatLng = this._latlng;
          this._latlng = toLatLng(latlng);
          this.update();
          return this.fire("move", { oldLatLng, latlng: this._latlng });
        },
        // @method setZIndexOffset(offset: Number): this
        // Changes the [zIndex offset](#marker-zindexoffset) of the marker.
        setZIndexOffset: function(offset) {
          this.options.zIndexOffset = offset;
          return this.update();
        },
        // @method getIcon: Icon
        // Returns the current icon used by the marker
        getIcon: function() {
          return this.options.icon;
        },
        // @method setIcon(icon: Icon): this
        // Changes the marker icon.
        setIcon: function(icon2) {
          this.options.icon = icon2;
          if (this._map) {
            this._initIcon();
            this.update();
          }
          if (this._popup) {
            this.bindPopup(this._popup, this._popup.options);
          }
          return this;
        },
        getElement: function() {
          return this._icon;
        },
        update: function() {
          if (this._icon && this._map) {
            var pos = this._map.latLngToLayerPoint(this._latlng).round();
            this._setPos(pos);
          }
          return this;
        },
        _initIcon: function() {
          var options = this.options, classToAdd = "leaflet-zoom-" + (this._zoomAnimated ? "animated" : "hide");
          var icon2 = options.icon.createIcon(this._icon), addIcon = false;
          if (icon2 !== this._icon) {
            if (this._icon) {
              this._removeIcon();
            }
            addIcon = true;
            if (options.title) {
              icon2.title = options.title;
            }
            if (icon2.tagName === "IMG") {
              icon2.alt = options.alt || "";
            }
          }
          addClass(icon2, classToAdd);
          if (options.keyboard) {
            icon2.tabIndex = "0";
            icon2.setAttribute("role", "button");
          }
          this._icon = icon2;
          if (options.riseOnHover) {
            this.on({
              mouseover: this._bringToFront,
              mouseout: this._resetZIndex
            });
          }
          if (this.options.autoPanOnFocus) {
            on(icon2, "focus", this._panOnFocus, this);
          }
          var newShadow = options.icon.createShadow(this._shadow), addShadow = false;
          if (newShadow !== this._shadow) {
            this._removeShadow();
            addShadow = true;
          }
          if (newShadow) {
            addClass(newShadow, classToAdd);
            newShadow.alt = "";
          }
          this._shadow = newShadow;
          if (options.opacity < 1) {
            this._updateOpacity();
          }
          if (addIcon) {
            this.getPane().appendChild(this._icon);
          }
          this._initInteraction();
          if (newShadow && addShadow) {
            this.getPane(options.shadowPane).appendChild(this._shadow);
          }
        },
        _removeIcon: function() {
          if (this.options.riseOnHover) {
            this.off({
              mouseover: this._bringToFront,
              mouseout: this._resetZIndex
            });
          }
          if (this.options.autoPanOnFocus) {
            off(this._icon, "focus", this._panOnFocus, this);
          }
          remove(this._icon);
          this.removeInteractiveTarget(this._icon);
          this._icon = null;
        },
        _removeShadow: function() {
          if (this._shadow) {
            remove(this._shadow);
          }
          this._shadow = null;
        },
        _setPos: function(pos) {
          if (this._icon) {
            setPosition(this._icon, pos);
          }
          if (this._shadow) {
            setPosition(this._shadow, pos);
          }
          this._zIndex = pos.y + this.options.zIndexOffset;
          this._resetZIndex();
        },
        _updateZIndex: function(offset) {
          if (this._icon) {
            this._icon.style.zIndex = this._zIndex + offset;
          }
        },
        _animateZoom: function(opt) {
          var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();
          this._setPos(pos);
        },
        _initInteraction: function() {
          if (!this.options.interactive) {
            return;
          }
          addClass(this._icon, "leaflet-interactive");
          this.addInteractiveTarget(this._icon);
          if (MarkerDrag) {
            var draggable = this.options.draggable;
            if (this.dragging) {
              draggable = this.dragging.enabled();
              this.dragging.disable();
            }
            this.dragging = new MarkerDrag(this);
            if (draggable) {
              this.dragging.enable();
            }
          }
        },
        // @method setOpacity(opacity: Number): this
        // Changes the opacity of the marker.
        setOpacity: function(opacity) {
          this.options.opacity = opacity;
          if (this._map) {
            this._updateOpacity();
          }
          return this;
        },
        _updateOpacity: function() {
          var opacity = this.options.opacity;
          if (this._icon) {
            setOpacity(this._icon, opacity);
          }
          if (this._shadow) {
            setOpacity(this._shadow, opacity);
          }
        },
        _bringToFront: function() {
          this._updateZIndex(this.options.riseOffset);
        },
        _resetZIndex: function() {
          this._updateZIndex(0);
        },
        _panOnFocus: function() {
          var map = this._map;
          if (!map) {
            return;
          }
          var iconOpts = this.options.icon.options;
          var size = iconOpts.iconSize ? toPoint(iconOpts.iconSize) : toPoint(0, 0);
          var anchor = iconOpts.iconAnchor ? toPoint(iconOpts.iconAnchor) : toPoint(0, 0);
          map.panInside(this._latlng, {
            paddingTopLeft: anchor,
            paddingBottomRight: size.subtract(anchor)
          });
        },
        _getPopupAnchor: function() {
          return this.options.icon.options.popupAnchor;
        },
        _getTooltipAnchor: function() {
          return this.options.icon.options.tooltipAnchor;
        }
      });
      function marker(latlng, options) {
        return new Marker(latlng, options);
      }
      var Path = Layer.extend({
        // @section
        // @aka Path options
        options: {
          // @option stroke: Boolean = true
          // Whether to draw stroke along the path. Set it to `false` to disable borders on polygons or circles.
          stroke: true,
          // @option color: String = '#3388ff'
          // Stroke color
          color: "#3388ff",
          // @option weight: Number = 3
          // Stroke width in pixels
          weight: 3,
          // @option opacity: Number = 1.0
          // Stroke opacity
          opacity: 1,
          // @option lineCap: String= 'round'
          // A string that defines [shape to be used at the end](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linecap) of the stroke.
          lineCap: "round",
          // @option lineJoin: String = 'round'
          // A string that defines [shape to be used at the corners](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linejoin) of the stroke.
          lineJoin: "round",
          // @option dashArray: String = null
          // A string that defines the stroke [dash pattern](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dasharray). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
          dashArray: null,
          // @option dashOffset: String = null
          // A string that defines the [distance into the dash pattern to start the dash](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dashoffset). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
          dashOffset: null,
          // @option fill: Boolean = depends
          // Whether to fill the path with color. Set it to `false` to disable filling on polygons or circles.
          fill: false,
          // @option fillColor: String = *
          // Fill color. Defaults to the value of the [`color`](#path-color) option
          fillColor: null,
          // @option fillOpacity: Number = 0.2
          // Fill opacity.
          fillOpacity: 0.2,
          // @option fillRule: String = 'evenodd'
          // A string that defines [how the inside of a shape](https://developer.mozilla.org/docs/Web/SVG/Attribute/fill-rule) is determined.
          fillRule: "evenodd",
          // className: '',
          // Option inherited from "Interactive layer" abstract class
          interactive: true,
          // @option bubblingMouseEvents: Boolean = true
          // When `true`, a mouse event on this path will trigger the same event on the map
          // (unless [`L.DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
          bubblingMouseEvents: true
        },
        beforeAdd: function(map) {
          this._renderer = map.getRenderer(this);
        },
        onAdd: function() {
          this._renderer._initPath(this);
          this._reset();
          this._renderer._addPath(this);
        },
        onRemove: function() {
          this._renderer._removePath(this);
        },
        // @method redraw(): this
        // Redraws the layer. Sometimes useful after you changed the coordinates that the path uses.
        redraw: function() {
          if (this._map) {
            this._renderer._updatePath(this);
          }
          return this;
        },
        // @method setStyle(style: Path options): this
        // Changes the appearance of a Path based on the options in the `Path options` object.
        setStyle: function(style2) {
          setOptions(this, style2);
          if (this._renderer) {
            this._renderer._updateStyle(this);
            if (this.options.stroke && style2 && Object.prototype.hasOwnProperty.call(style2, "weight")) {
              this._updateBounds();
            }
          }
          return this;
        },
        // @method bringToFront(): this
        // Brings the layer to the top of all path layers.
        bringToFront: function() {
          if (this._renderer) {
            this._renderer._bringToFront(this);
          }
          return this;
        },
        // @method bringToBack(): this
        // Brings the layer to the bottom of all path layers.
        bringToBack: function() {
          if (this._renderer) {
            this._renderer._bringToBack(this);
          }
          return this;
        },
        getElement: function() {
          return this._path;
        },
        _reset: function() {
          this._project();
          this._update();
        },
        _clickTolerance: function() {
          return (this.options.stroke ? this.options.weight / 2 : 0) + (this._renderer.options.tolerance || 0);
        }
      });
      var CircleMarker = Path.extend({
        // @section
        // @aka CircleMarker options
        options: {
          fill: true,
          // @option radius: Number = 10
          // Radius of the circle marker, in pixels
          radius: 10
        },
        initialize: function(latlng, options) {
          setOptions(this, options);
          this._latlng = toLatLng(latlng);
          this._radius = this.options.radius;
        },
        // @method setLatLng(latLng: LatLng): this
        // Sets the position of a circle marker to a new location.
        setLatLng: function(latlng) {
          var oldLatLng = this._latlng;
          this._latlng = toLatLng(latlng);
          this.redraw();
          return this.fire("move", { oldLatLng, latlng: this._latlng });
        },
        // @method getLatLng(): LatLng
        // Returns the current geographical position of the circle marker
        getLatLng: function() {
          return this._latlng;
        },
        // @method setRadius(radius: Number): this
        // Sets the radius of a circle marker. Units are in pixels.
        setRadius: function(radius) {
          this.options.radius = this._radius = radius;
          return this.redraw();
        },
        // @method getRadius(): Number
        // Returns the current radius of the circle
        getRadius: function() {
          return this._radius;
        },
        setStyle: function(options) {
          var radius = options && options.radius || this._radius;
          Path.prototype.setStyle.call(this, options);
          this.setRadius(radius);
          return this;
        },
        _project: function() {
          this._point = this._map.latLngToLayerPoint(this._latlng);
          this._updateBounds();
        },
        _updateBounds: function() {
          var r = this._radius, r2 = this._radiusY || r, w = this._clickTolerance(), p = [r + w, r2 + w];
          this._pxBounds = new Bounds(this._point.subtract(p), this._point.add(p));
        },
        _update: function() {
          if (this._map) {
            this._updatePath();
          }
        },
        _updatePath: function() {
          this._renderer._updateCircle(this);
        },
        _empty: function() {
          return this._radius && !this._renderer._bounds.intersects(this._pxBounds);
        },
        // Needed by the `Canvas` renderer for interactivity
        _containsPoint: function(p) {
          return p.distanceTo(this._point) <= this._radius + this._clickTolerance();
        }
      });
      function circleMarker(latlng, options) {
        return new CircleMarker(latlng, options);
      }
      var Circle = CircleMarker.extend({
        initialize: function(latlng, options, legacyOptions) {
          if (typeof options === "number") {
            options = extend({}, legacyOptions, { radius: options });
          }
          setOptions(this, options);
          this._latlng = toLatLng(latlng);
          if (isNaN(this.options.radius)) {
            throw new Error("Circle radius cannot be NaN");
          }
          this._mRadius = this.options.radius;
        },
        // @method setRadius(radius: Number): this
        // Sets the radius of a circle. Units are in meters.
        setRadius: function(radius) {
          this._mRadius = radius;
          return this.redraw();
        },
        // @method getRadius(): Number
        // Returns the current radius of a circle. Units are in meters.
        getRadius: function() {
          return this._mRadius;
        },
        // @method getBounds(): LatLngBounds
        // Returns the `LatLngBounds` of the path.
        getBounds: function() {
          var half = [this._radius, this._radiusY || this._radius];
          return new LatLngBounds(
            this._map.layerPointToLatLng(this._point.subtract(half)),
            this._map.layerPointToLatLng(this._point.add(half))
          );
        },
        setStyle: Path.prototype.setStyle,
        _project: function() {
          var lng = this._latlng.lng, lat = this._latlng.lat, map = this._map, crs = map.options.crs;
          if (crs.distance === Earth.distance) {
            var d = Math.PI / 180, latR = this._mRadius / Earth.R / d, top = map.project([lat + latR, lng]), bottom = map.project([lat - latR, lng]), p = top.add(bottom).divideBy(2), lat2 = map.unproject(p).lat, lngR = Math.acos((Math.cos(latR * d) - Math.sin(lat * d) * Math.sin(lat2 * d)) / (Math.cos(lat * d) * Math.cos(lat2 * d))) / d;
            if (isNaN(lngR) || lngR === 0) {
              lngR = latR / Math.cos(Math.PI / 180 * lat);
            }
            this._point = p.subtract(map.getPixelOrigin());
            this._radius = isNaN(lngR) ? 0 : p.x - map.project([lat2, lng - lngR]).x;
            this._radiusY = p.y - top.y;
          } else {
            var latlng2 = crs.unproject(crs.project(this._latlng).subtract([this._mRadius, 0]));
            this._point = map.latLngToLayerPoint(this._latlng);
            this._radius = this._point.x - map.latLngToLayerPoint(latlng2).x;
          }
          this._updateBounds();
        }
      });
      function circle(latlng, options, legacyOptions) {
        return new Circle(latlng, options, legacyOptions);
      }
      var Polyline = Path.extend({
        // @section
        // @aka Polyline options
        options: {
          // @option smoothFactor: Number = 1.0
          // How much to simplify the polyline on each zoom level. More means
          // better performance and smoother look, and less means more accurate representation.
          smoothFactor: 1,
          // @option noClip: Boolean = false
          // Disable polyline clipping.
          noClip: false
        },
        initialize: function(latlngs, options) {
          setOptions(this, options);
          this._setLatLngs(latlngs);
        },
        // @method getLatLngs(): LatLng[]
        // Returns an array of the points in the path, or nested arrays of points in case of multi-polyline.
        getLatLngs: function() {
          return this._latlngs;
        },
        // @method setLatLngs(latlngs: LatLng[]): this
        // Replaces all the points in the polyline with the given array of geographical points.
        setLatLngs: function(latlngs) {
          this._setLatLngs(latlngs);
          return this.redraw();
        },
        // @method isEmpty(): Boolean
        // Returns `true` if the Polyline has no LatLngs.
        isEmpty: function() {
          return !this._latlngs.length;
        },
        // @method closestLayerPoint(p: Point): Point
        // Returns the point closest to `p` on the Polyline.
        closestLayerPoint: function(p) {
          var minDistance = Infinity, minPoint = null, closest = _sqClosestPointOnSegment, p1, p2;
          for (var j = 0, jLen = this._parts.length; j < jLen; j++) {
            var points = this._parts[j];
            for (var i = 1, len = points.length; i < len; i++) {
              p1 = points[i - 1];
              p2 = points[i];
              var sqDist = closest(p, p1, p2, true);
              if (sqDist < minDistance) {
                minDistance = sqDist;
                minPoint = closest(p, p1, p2);
              }
            }
          }
          if (minPoint) {
            minPoint.distance = Math.sqrt(minDistance);
          }
          return minPoint;
        },
        // @method getCenter(): LatLng
        // Returns the center ([centroid](https://en.wikipedia.org/wiki/Centroid)) of the polyline.
        getCenter: function() {
          if (!this._map) {
            throw new Error("Must add layer to map before using getCenter()");
          }
          return polylineCenter(this._defaultShape(), this._map.options.crs);
        },
        // @method getBounds(): LatLngBounds
        // Returns the `LatLngBounds` of the path.
        getBounds: function() {
          return this._bounds;
        },
        // @method addLatLng(latlng: LatLng, latlngs?: LatLng[]): this
        // Adds a given point to the polyline. By default, adds to the first ring of
        // the polyline in case of a multi-polyline, but can be overridden by passing
        // a specific ring as a LatLng array (that you can earlier access with [`getLatLngs`](#polyline-getlatlngs)).
        addLatLng: function(latlng, latlngs) {
          latlngs = latlngs || this._defaultShape();
          latlng = toLatLng(latlng);
          latlngs.push(latlng);
          this._bounds.extend(latlng);
          return this.redraw();
        },
        _setLatLngs: function(latlngs) {
          this._bounds = new LatLngBounds();
          this._latlngs = this._convertLatLngs(latlngs);
        },
        _defaultShape: function() {
          return isFlat(this._latlngs) ? this._latlngs : this._latlngs[0];
        },
        // recursively convert latlngs input into actual LatLng instances; calculate bounds along the way
        _convertLatLngs: function(latlngs) {
          var result = [], flat = isFlat(latlngs);
          for (var i = 0, len = latlngs.length; i < len; i++) {
            if (flat) {
              result[i] = toLatLng(latlngs[i]);
              this._bounds.extend(result[i]);
            } else {
              result[i] = this._convertLatLngs(latlngs[i]);
            }
          }
          return result;
        },
        _project: function() {
          var pxBounds = new Bounds();
          this._rings = [];
          this._projectLatlngs(this._latlngs, this._rings, pxBounds);
          if (this._bounds.isValid() && pxBounds.isValid()) {
            this._rawPxBounds = pxBounds;
            this._updateBounds();
          }
        },
        _updateBounds: function() {
          var w = this._clickTolerance(), p = new Point(w, w);
          if (!this._rawPxBounds) {
            return;
          }
          this._pxBounds = new Bounds([
            this._rawPxBounds.min.subtract(p),
            this._rawPxBounds.max.add(p)
          ]);
        },
        // recursively turns latlngs into a set of rings with projected coordinates
        _projectLatlngs: function(latlngs, result, projectedBounds) {
          var flat = latlngs[0] instanceof LatLng, len = latlngs.length, i, ring;
          if (flat) {
            ring = [];
            for (i = 0; i < len; i++) {
              ring[i] = this._map.latLngToLayerPoint(latlngs[i]);
              projectedBounds.extend(ring[i]);
            }
            result.push(ring);
          } else {
            for (i = 0; i < len; i++) {
              this._projectLatlngs(latlngs[i], result, projectedBounds);
            }
          }
        },
        // clip polyline by renderer bounds so that we have less to render for performance
        _clipPoints: function() {
          var bounds = this._renderer._bounds;
          this._parts = [];
          if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
            return;
          }
          if (this.options.noClip) {
            this._parts = this._rings;
            return;
          }
          var parts = this._parts, i, j, k, len, len2, segment, points;
          for (i = 0, k = 0, len = this._rings.length; i < len; i++) {
            points = this._rings[i];
            for (j = 0, len2 = points.length; j < len2 - 1; j++) {
              segment = clipSegment(points[j], points[j + 1], bounds, j, true);
              if (!segment) {
                continue;
              }
              parts[k] = parts[k] || [];
              parts[k].push(segment[0]);
              if (segment[1] !== points[j + 1] || j === len2 - 2) {
                parts[k].push(segment[1]);
                k++;
              }
            }
          }
        },
        // simplify each clipped part of the polyline for performance
        _simplifyPoints: function() {
          var parts = this._parts, tolerance = this.options.smoothFactor;
          for (var i = 0, len = parts.length; i < len; i++) {
            parts[i] = simplify(parts[i], tolerance);
          }
        },
        _update: function() {
          if (!this._map) {
            return;
          }
          this._clipPoints();
          this._simplifyPoints();
          this._updatePath();
        },
        _updatePath: function() {
          this._renderer._updatePoly(this);
        },
        // Needed by the `Canvas` renderer for interactivity
        _containsPoint: function(p, closed) {
          var i, j, k, len, len2, part, w = this._clickTolerance();
          if (!this._pxBounds || !this._pxBounds.contains(p)) {
            return false;
          }
          for (i = 0, len = this._parts.length; i < len; i++) {
            part = this._parts[i];
            for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
              if (!closed && j === 0) {
                continue;
              }
              if (pointToSegmentDistance(p, part[k], part[j]) <= w) {
                return true;
              }
            }
          }
          return false;
        }
      });
      function polyline(latlngs, options) {
        return new Polyline(latlngs, options);
      }
      Polyline._flat = _flat;
      var Polygon = Polyline.extend({
        options: {
          fill: true
        },
        isEmpty: function() {
          return !this._latlngs.length || !this._latlngs[0].length;
        },
        // @method getCenter(): LatLng
        // Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the Polygon.
        getCenter: function() {
          if (!this._map) {
            throw new Error("Must add layer to map before using getCenter()");
          }
          return polygonCenter(this._defaultShape(), this._map.options.crs);
        },
        _convertLatLngs: function(latlngs) {
          var result = Polyline.prototype._convertLatLngs.call(this, latlngs), len = result.length;
          if (len >= 2 && result[0] instanceof LatLng && result[0].equals(result[len - 1])) {
            result.pop();
          }
          return result;
        },
        _setLatLngs: function(latlngs) {
          Polyline.prototype._setLatLngs.call(this, latlngs);
          if (isFlat(this._latlngs)) {
            this._latlngs = [this._latlngs];
          }
        },
        _defaultShape: function() {
          return isFlat(this._latlngs[0]) ? this._latlngs[0] : this._latlngs[0][0];
        },
        _clipPoints: function() {
          var bounds = this._renderer._bounds, w = this.options.weight, p = new Point(w, w);
          bounds = new Bounds(bounds.min.subtract(p), bounds.max.add(p));
          this._parts = [];
          if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
            return;
          }
          if (this.options.noClip) {
            this._parts = this._rings;
            return;
          }
          for (var i = 0, len = this._rings.length, clipped; i < len; i++) {
            clipped = clipPolygon(this._rings[i], bounds, true);
            if (clipped.length) {
              this._parts.push(clipped);
            }
          }
        },
        _updatePath: function() {
          this._renderer._updatePoly(this, true);
        },
        // Needed by the `Canvas` renderer for interactivity
        _containsPoint: function(p) {
          var inside = false, part, p1, p2, i, j, k, len, len2;
          if (!this._pxBounds || !this._pxBounds.contains(p)) {
            return false;
          }
          for (i = 0, len = this._parts.length; i < len; i++) {
            part = this._parts[i];
            for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
              p1 = part[j];
              p2 = part[k];
              if (p1.y > p.y !== p2.y > p.y && p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x) {
                inside = !inside;
              }
            }
          }
          return inside || Polyline.prototype._containsPoint.call(this, p, true);
        }
      });
      function polygon(latlngs, options) {
        return new Polygon(latlngs, options);
      }
      var GeoJSON = FeatureGroup.extend({
        /* @section
         * @aka GeoJSON options
         *
         * @option pointToLayer: Function = *
         * A `Function` defining how GeoJSON points spawn Leaflet layers. It is internally
         * called when data is added, passing the GeoJSON point feature and its `LatLng`.
         * The default is to spawn a default `Marker`:
         * ```js
         * function(geoJsonPoint, latlng) {
         * 	return L.marker(latlng);
         * }
         * ```
         *
         * @option style: Function = *
         * A `Function` defining the `Path options` for styling GeoJSON lines and polygons,
         * called internally when data is added.
         * The default value is to not override any defaults:
         * ```js
         * function (geoJsonFeature) {
         * 	return {}
         * }
         * ```
         *
         * @option onEachFeature: Function = *
         * A `Function` that will be called once for each created `Feature`, after it has
         * been created and styled. Useful for attaching events and popups to features.
         * The default is to do nothing with the newly created layers:
         * ```js
         * function (feature, layer) {}
         * ```
         *
         * @option filter: Function = *
         * A `Function` that will be used to decide whether to include a feature or not.
         * The default is to include all features:
         * ```js
         * function (geoJsonFeature) {
         * 	return true;
         * }
         * ```
         * Note: dynamically changing the `filter` option will have effect only on newly
         * added data. It will _not_ re-evaluate already included features.
         *
         * @option coordsToLatLng: Function = *
         * A `Function` that will be used for converting GeoJSON coordinates to `LatLng`s.
         * The default is the `coordsToLatLng` static method.
         *
         * @option markersInheritOptions: Boolean = false
         * Whether default Markers for "Point" type Features inherit from group options.
         */
        initialize: function(geojson, options) {
          setOptions(this, options);
          this._layers = {};
          if (geojson) {
            this.addData(geojson);
          }
        },
        // @method addData( <GeoJSON> data ): this
        // Adds a GeoJSON object to the layer.
        addData: function(geojson) {
          var features = isArray2(geojson) ? geojson : geojson.features, i, len, feature;
          if (features) {
            for (i = 0, len = features.length; i < len; i++) {
              feature = features[i];
              if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
                this.addData(feature);
              }
            }
            return this;
          }
          var options = this.options;
          if (options.filter && !options.filter(geojson)) {
            return this;
          }
          var layer = geometryToLayer(geojson, options);
          if (!layer) {
            return this;
          }
          layer.feature = asFeature(geojson);
          layer.defaultOptions = layer.options;
          this.resetStyle(layer);
          if (options.onEachFeature) {
            options.onEachFeature(geojson, layer);
          }
          return this.addLayer(layer);
        },
        // @method resetStyle( <Path> layer? ): this
        // Resets the given vector layer's style to the original GeoJSON style, useful for resetting style after hover events.
        // If `layer` is omitted, the style of all features in the current layer is reset.
        resetStyle: function(layer) {
          if (layer === void 0) {
            return this.eachLayer(this.resetStyle, this);
          }
          layer.options = extend({}, layer.defaultOptions);
          this._setLayerStyle(layer, this.options.style);
          return this;
        },
        // @method setStyle( <Function> style ): this
        // Changes styles of GeoJSON vector layers with the given style function.
        setStyle: function(style2) {
          return this.eachLayer(function(layer) {
            this._setLayerStyle(layer, style2);
          }, this);
        },
        _setLayerStyle: function(layer, style2) {
          if (layer.setStyle) {
            if (typeof style2 === "function") {
              style2 = style2(layer.feature);
            }
            layer.setStyle(style2);
          }
        }
      });
      function geometryToLayer(geojson, options) {
        var geometry = geojson.type === "Feature" ? geojson.geometry : geojson, coords = geometry ? geometry.coordinates : null, layers2 = [], pointToLayer = options && options.pointToLayer, _coordsToLatLng = options && options.coordsToLatLng || coordsToLatLng, latlng, latlngs, i, len;
        if (!coords && !geometry) {
          return null;
        }
        switch (geometry.type) {
          case "Point":
            latlng = _coordsToLatLng(coords);
            return _pointToLayer(pointToLayer, geojson, latlng, options);
          case "MultiPoint":
            for (i = 0, len = coords.length; i < len; i++) {
              latlng = _coordsToLatLng(coords[i]);
              layers2.push(_pointToLayer(pointToLayer, geojson, latlng, options));
            }
            return new FeatureGroup(layers2);
          case "LineString":
          case "MultiLineString":
            latlngs = coordsToLatLngs(coords, geometry.type === "LineString" ? 0 : 1, _coordsToLatLng);
            return new Polyline(latlngs, options);
          case "Polygon":
          case "MultiPolygon":
            latlngs = coordsToLatLngs(coords, geometry.type === "Polygon" ? 1 : 2, _coordsToLatLng);
            return new Polygon(latlngs, options);
          case "GeometryCollection":
            for (i = 0, len = geometry.geometries.length; i < len; i++) {
              var geoLayer = geometryToLayer({
                geometry: geometry.geometries[i],
                type: "Feature",
                properties: geojson.properties
              }, options);
              if (geoLayer) {
                layers2.push(geoLayer);
              }
            }
            return new FeatureGroup(layers2);
          case "FeatureCollection":
            for (i = 0, len = geometry.features.length; i < len; i++) {
              var featureLayer = geometryToLayer(geometry.features[i], options);
              if (featureLayer) {
                layers2.push(featureLayer);
              }
            }
            return new FeatureGroup(layers2);
          default:
            throw new Error("Invalid GeoJSON object.");
        }
      }
      function _pointToLayer(pointToLayerFn, geojson, latlng, options) {
        return pointToLayerFn ? pointToLayerFn(geojson, latlng) : new Marker(latlng, options && options.markersInheritOptions && options);
      }
      function coordsToLatLng(coords) {
        return new LatLng(coords[1], coords[0], coords[2]);
      }
      function coordsToLatLngs(coords, levelsDeep, _coordsToLatLng) {
        var latlngs = [];
        for (var i = 0, len = coords.length, latlng; i < len; i++) {
          latlng = levelsDeep ? coordsToLatLngs(coords[i], levelsDeep - 1, _coordsToLatLng) : (_coordsToLatLng || coordsToLatLng)(coords[i]);
          latlngs.push(latlng);
        }
        return latlngs;
      }
      function latLngToCoords(latlng, precision) {
        latlng = toLatLng(latlng);
        return latlng.alt !== void 0 ? [formatNum(latlng.lng, precision), formatNum(latlng.lat, precision), formatNum(latlng.alt, precision)] : [formatNum(latlng.lng, precision), formatNum(latlng.lat, precision)];
      }
      function latLngsToCoords(latlngs, levelsDeep, closed, precision) {
        var coords = [];
        for (var i = 0, len = latlngs.length; i < len; i++) {
          coords.push(levelsDeep ? latLngsToCoords(latlngs[i], isFlat(latlngs[i]) ? 0 : levelsDeep - 1, closed, precision) : latLngToCoords(latlngs[i], precision));
        }
        if (!levelsDeep && closed && coords.length > 0) {
          coords.push(coords[0].slice());
        }
        return coords;
      }
      function getFeature(layer, newGeometry) {
        return layer.feature ? extend({}, layer.feature, { geometry: newGeometry }) : asFeature(newGeometry);
      }
      function asFeature(geojson) {
        if (geojson.type === "Feature" || geojson.type === "FeatureCollection") {
          return geojson;
        }
        return {
          type: "Feature",
          properties: {},
          geometry: geojson
        };
      }
      var PointToGeoJSON = {
        toGeoJSON: function(precision) {
          return getFeature(this, {
            type: "Point",
            coordinates: latLngToCoords(this.getLatLng(), precision)
          });
        }
      };
      Marker.include(PointToGeoJSON);
      Circle.include(PointToGeoJSON);
      CircleMarker.include(PointToGeoJSON);
      Polyline.include({
        toGeoJSON: function(precision) {
          var multi = !isFlat(this._latlngs);
          var coords = latLngsToCoords(this._latlngs, multi ? 1 : 0, false, precision);
          return getFeature(this, {
            type: (multi ? "Multi" : "") + "LineString",
            coordinates: coords
          });
        }
      });
      Polygon.include({
        toGeoJSON: function(precision) {
          var holes = !isFlat(this._latlngs), multi = holes && !isFlat(this._latlngs[0]);
          var coords = latLngsToCoords(this._latlngs, multi ? 2 : holes ? 1 : 0, true, precision);
          if (!holes) {
            coords = [coords];
          }
          return getFeature(this, {
            type: (multi ? "Multi" : "") + "Polygon",
            coordinates: coords
          });
        }
      });
      LayerGroup.include({
        toMultiPoint: function(precision) {
          var coords = [];
          this.eachLayer(function(layer) {
            coords.push(layer.toGeoJSON(precision).geometry.coordinates);
          });
          return getFeature(this, {
            type: "MultiPoint",
            coordinates: coords
          });
        },
        // @method toGeoJSON(precision?: Number|false): Object
        // Coordinates values are rounded with [`formatNum`](#util-formatnum) function with given `precision`.
        // Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON) representation of the layer group (as a GeoJSON `FeatureCollection`, `GeometryCollection`, or `MultiPoint`).
        toGeoJSON: function(precision) {
          var type = this.feature && this.feature.geometry && this.feature.geometry.type;
          if (type === "MultiPoint") {
            return this.toMultiPoint(precision);
          }
          var isGeometryCollection = type === "GeometryCollection", jsons = [];
          this.eachLayer(function(layer) {
            if (layer.toGeoJSON) {
              var json = layer.toGeoJSON(precision);
              if (isGeometryCollection) {
                jsons.push(json.geometry);
              } else {
                var feature = asFeature(json);
                if (feature.type === "FeatureCollection") {
                  jsons.push.apply(jsons, feature.features);
                } else {
                  jsons.push(feature);
                }
              }
            }
          });
          if (isGeometryCollection) {
            return getFeature(this, {
              geometries: jsons,
              type: "GeometryCollection"
            });
          }
          return {
            type: "FeatureCollection",
            features: jsons
          };
        }
      });
      function geoJSON(geojson, options) {
        return new GeoJSON(geojson, options);
      }
      var geoJson = geoJSON;
      var ImageOverlay = Layer.extend({
        // @section
        // @aka ImageOverlay options
        options: {
          // @option opacity: Number = 1.0
          // The opacity of the image overlay.
          opacity: 1,
          // @option alt: String = ''
          // Text for the `alt` attribute of the image (useful for accessibility).
          alt: "",
          // @option interactive: Boolean = false
          // If `true`, the image overlay will emit [mouse events](#interactive-layer) when clicked or hovered.
          interactive: false,
          // @option crossOrigin: Boolean|String = false
          // Whether the crossOrigin attribute will be added to the image.
          // If a String is provided, the image will have its crossOrigin attribute set to the String provided. This is needed if you want to access image pixel data.
          // Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
          crossOrigin: false,
          // @option errorOverlayUrl: String = ''
          // URL to the overlay image to show in place of the overlay that failed to load.
          errorOverlayUrl: "",
          // @option zIndex: Number = 1
          // The explicit [zIndex](https://developer.mozilla.org/docs/Web/CSS/CSS_Positioning/Understanding_z_index) of the overlay layer.
          zIndex: 1,
          // @option className: String = ''
          // A custom class name to assign to the image. Empty by default.
          className: ""
        },
        initialize: function(url, bounds, options) {
          this._url = url;
          this._bounds = toLatLngBounds(bounds);
          setOptions(this, options);
        },
        onAdd: function() {
          if (!this._image) {
            this._initImage();
            if (this.options.opacity < 1) {
              this._updateOpacity();
            }
          }
          if (this.options.interactive) {
            addClass(this._image, "leaflet-interactive");
            this.addInteractiveTarget(this._image);
          }
          this.getPane().appendChild(this._image);
          this._reset();
        },
        onRemove: function() {
          remove(this._image);
          if (this.options.interactive) {
            this.removeInteractiveTarget(this._image);
          }
        },
        // @method setOpacity(opacity: Number): this
        // Sets the opacity of the overlay.
        setOpacity: function(opacity) {
          this.options.opacity = opacity;
          if (this._image) {
            this._updateOpacity();
          }
          return this;
        },
        setStyle: function(styleOpts) {
          if (styleOpts.opacity) {
            this.setOpacity(styleOpts.opacity);
          }
          return this;
        },
        // @method bringToFront(): this
        // Brings the layer to the top of all overlays.
        bringToFront: function() {
          if (this._map) {
            toFront(this._image);
          }
          return this;
        },
        // @method bringToBack(): this
        // Brings the layer to the bottom of all overlays.
        bringToBack: function() {
          if (this._map) {
            toBack(this._image);
          }
          return this;
        },
        // @method setUrl(url: String): this
        // Changes the URL of the image.
        setUrl: function(url) {
          this._url = url;
          if (this._image) {
            this._image.src = url;
          }
          return this;
        },
        // @method setBounds(bounds: LatLngBounds): this
        // Update the bounds that this ImageOverlay covers
        setBounds: function(bounds) {
          this._bounds = toLatLngBounds(bounds);
          if (this._map) {
            this._reset();
          }
          return this;
        },
        getEvents: function() {
          var events = {
            zoom: this._reset,
            viewreset: this._reset
          };
          if (this._zoomAnimated) {
            events.zoomanim = this._animateZoom;
          }
          return events;
        },
        // @method setZIndex(value: Number): this
        // Changes the [zIndex](#imageoverlay-zindex) of the image overlay.
        setZIndex: function(value) {
          this.options.zIndex = value;
          this._updateZIndex();
          return this;
        },
        // @method getBounds(): LatLngBounds
        // Get the bounds that this ImageOverlay covers
        getBounds: function() {
          return this._bounds;
        },
        // @method getElement(): HTMLElement
        // Returns the instance of [`HTMLImageElement`](https://developer.mozilla.org/docs/Web/API/HTMLImageElement)
        // used by this overlay.
        getElement: function() {
          return this._image;
        },
        _initImage: function() {
          var wasElementSupplied = this._url.tagName === "IMG";
          var img = this._image = wasElementSupplied ? this._url : create$1("img");
          addClass(img, "leaflet-image-layer");
          if (this._zoomAnimated) {
            addClass(img, "leaflet-zoom-animated");
          }
          if (this.options.className) {
            addClass(img, this.options.className);
          }
          img.onselectstart = falseFn;
          img.onmousemove = falseFn;
          img.onload = bind(this.fire, this, "load");
          img.onerror = bind(this._overlayOnError, this, "error");
          if (this.options.crossOrigin || this.options.crossOrigin === "") {
            img.crossOrigin = this.options.crossOrigin === true ? "" : this.options.crossOrigin;
          }
          if (this.options.zIndex) {
            this._updateZIndex();
          }
          if (wasElementSupplied) {
            this._url = img.src;
            return;
          }
          img.src = this._url;
          img.alt = this.options.alt;
        },
        _animateZoom: function(e) {
          var scale2 = this._map.getZoomScale(e.zoom), offset = this._map._latLngBoundsToNewLayerBounds(this._bounds, e.zoom, e.center).min;
          setTransform(this._image, offset, scale2);
        },
        _reset: function() {
          var image = this._image, bounds = new Bounds(
            this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
            this._map.latLngToLayerPoint(this._bounds.getSouthEast())
          ), size = bounds.getSize();
          setPosition(image, bounds.min);
          image.style.width = size.x + "px";
          image.style.height = size.y + "px";
        },
        _updateOpacity: function() {
          setOpacity(this._image, this.options.opacity);
        },
        _updateZIndex: function() {
          if (this._image && this.options.zIndex !== void 0 && this.options.zIndex !== null) {
            this._image.style.zIndex = this.options.zIndex;
          }
        },
        _overlayOnError: function() {
          this.fire("error");
          var errorUrl = this.options.errorOverlayUrl;
          if (errorUrl && this._url !== errorUrl) {
            this._url = errorUrl;
            this._image.src = errorUrl;
          }
        },
        // @method getCenter(): LatLng
        // Returns the center of the ImageOverlay.
        getCenter: function() {
          return this._bounds.getCenter();
        }
      });
      var imageOverlay = function(url, bounds, options) {
        return new ImageOverlay(url, bounds, options);
      };
      var VideoOverlay = ImageOverlay.extend({
        // @section
        // @aka VideoOverlay options
        options: {
          // @option autoplay: Boolean = true
          // Whether the video starts playing automatically when loaded.
          // On some browsers autoplay will only work with `muted: true`
          autoplay: true,
          // @option loop: Boolean = true
          // Whether the video will loop back to the beginning when played.
          loop: true,
          // @option keepAspectRatio: Boolean = true
          // Whether the video will save aspect ratio after the projection.
          // Relevant for supported browsers. See [browser compatibility](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)
          keepAspectRatio: true,
          // @option muted: Boolean = false
          // Whether the video starts on mute when loaded.
          muted: false,
          // @option playsInline: Boolean = true
          // Mobile browsers will play the video right where it is instead of open it up in fullscreen mode.
          playsInline: true
        },
        _initImage: function() {
          var wasElementSupplied = this._url.tagName === "VIDEO";
          var vid = this._image = wasElementSupplied ? this._url : create$1("video");
          addClass(vid, "leaflet-image-layer");
          if (this._zoomAnimated) {
            addClass(vid, "leaflet-zoom-animated");
          }
          if (this.options.className) {
            addClass(vid, this.options.className);
          }
          vid.onselectstart = falseFn;
          vid.onmousemove = falseFn;
          vid.onloadeddata = bind(this.fire, this, "load");
          if (wasElementSupplied) {
            var sourceElements = vid.getElementsByTagName("source");
            var sources = [];
            for (var j = 0; j < sourceElements.length; j++) {
              sources.push(sourceElements[j].src);
            }
            this._url = sourceElements.length > 0 ? sources : [vid.src];
            return;
          }
          if (!isArray2(this._url)) {
            this._url = [this._url];
          }
          if (!this.options.keepAspectRatio && Object.prototype.hasOwnProperty.call(vid.style, "objectFit")) {
            vid.style["objectFit"] = "fill";
          }
          vid.autoplay = !!this.options.autoplay;
          vid.loop = !!this.options.loop;
          vid.muted = !!this.options.muted;
          vid.playsInline = !!this.options.playsInline;
          for (var i = 0; i < this._url.length; i++) {
            var source = create$1("source");
            source.src = this._url[i];
            vid.appendChild(source);
          }
        }
        // @method getElement(): HTMLVideoElement
        // Returns the instance of [`HTMLVideoElement`](https://developer.mozilla.org/docs/Web/API/HTMLVideoElement)
        // used by this overlay.
      });
      function videoOverlay(video, bounds, options) {
        return new VideoOverlay(video, bounds, options);
      }
      var SVGOverlay = ImageOverlay.extend({
        _initImage: function() {
          var el = this._image = this._url;
          addClass(el, "leaflet-image-layer");
          if (this._zoomAnimated) {
            addClass(el, "leaflet-zoom-animated");
          }
          if (this.options.className) {
            addClass(el, this.options.className);
          }
          el.onselectstart = falseFn;
          el.onmousemove = falseFn;
        }
        // @method getElement(): SVGElement
        // Returns the instance of [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)
        // used by this overlay.
      });
      function svgOverlay(el, bounds, options) {
        return new SVGOverlay(el, bounds, options);
      }
      var DivOverlay = Layer.extend({
        // @section
        // @aka DivOverlay options
        options: {
          // @option interactive: Boolean = false
          // If true, the popup/tooltip will listen to the mouse events.
          interactive: false,
          // @option offset: Point = Point(0, 0)
          // The offset of the overlay position.
          offset: [0, 0],
          // @option className: String = ''
          // A custom CSS class name to assign to the overlay.
          className: "",
          // @option pane: String = undefined
          // `Map pane` where the overlay will be added.
          pane: void 0,
          // @option content: String|HTMLElement|Function = ''
          // Sets the HTML content of the overlay while initializing. If a function is passed the source layer will be
          // passed to the function. The function should return a `String` or `HTMLElement` to be used in the overlay.
          content: ""
        },
        initialize: function(options, source) {
          if (options && (options instanceof LatLng || isArray2(options))) {
            this._latlng = toLatLng(options);
            setOptions(this, source);
          } else {
            setOptions(this, options);
            this._source = source;
          }
          if (this.options.content) {
            this._content = this.options.content;
          }
        },
        // @method openOn(map: Map): this
        // Adds the overlay to the map.
        // Alternative to `map.openPopup(popup)`/`.openTooltip(tooltip)`.
        openOn: function(map) {
          map = arguments.length ? map : this._source._map;
          if (!map.hasLayer(this)) {
            map.addLayer(this);
          }
          return this;
        },
        // @method close(): this
        // Closes the overlay.
        // Alternative to `map.closePopup(popup)`/`.closeTooltip(tooltip)`
        // and `layer.closePopup()`/`.closeTooltip()`.
        close: function() {
          if (this._map) {
            this._map.removeLayer(this);
          }
          return this;
        },
        // @method toggle(layer?: Layer): this
        // Opens or closes the overlay bound to layer depending on its current state.
        // Argument may be omitted only for overlay bound to layer.
        // Alternative to `layer.togglePopup()`/`.toggleTooltip()`.
        toggle: function(layer) {
          if (this._map) {
            this.close();
          } else {
            if (arguments.length) {
              this._source = layer;
            } else {
              layer = this._source;
            }
            this._prepareOpen();
            this.openOn(layer._map);
          }
          return this;
        },
        onAdd: function(map) {
          this._zoomAnimated = map._zoomAnimated;
          if (!this._container) {
            this._initLayout();
          }
          if (map._fadeAnimated) {
            setOpacity(this._container, 0);
          }
          clearTimeout(this._removeTimeout);
          this.getPane().appendChild(this._container);
          this.update();
          if (map._fadeAnimated) {
            setOpacity(this._container, 1);
          }
          this.bringToFront();
          if (this.options.interactive) {
            addClass(this._container, "leaflet-interactive");
            this.addInteractiveTarget(this._container);
          }
        },
        onRemove: function(map) {
          if (map._fadeAnimated) {
            setOpacity(this._container, 0);
            this._removeTimeout = setTimeout(bind(remove, void 0, this._container), 200);
          } else {
            remove(this._container);
          }
          if (this.options.interactive) {
            removeClass(this._container, "leaflet-interactive");
            this.removeInteractiveTarget(this._container);
          }
        },
        // @namespace DivOverlay
        // @method getLatLng: LatLng
        // Returns the geographical point of the overlay.
        getLatLng: function() {
          return this._latlng;
        },
        // @method setLatLng(latlng: LatLng): this
        // Sets the geographical point where the overlay will open.
        setLatLng: function(latlng) {
          this._latlng = toLatLng(latlng);
          if (this._map) {
            this._updatePosition();
            this._adjustPan();
          }
          return this;
        },
        // @method getContent: String|HTMLElement
        // Returns the content of the overlay.
        getContent: function() {
          return this._content;
        },
        // @method setContent(htmlContent: String|HTMLElement|Function): this
        // Sets the HTML content of the overlay. If a function is passed the source layer will be passed to the function.
        // The function should return a `String` or `HTMLElement` to be used in the overlay.
        setContent: function(content) {
          this._content = content;
          this.update();
          return this;
        },
        // @method getElement: String|HTMLElement
        // Returns the HTML container of the overlay.
        getElement: function() {
          return this._container;
        },
        // @method update: null
        // Updates the overlay content, layout and position. Useful for updating the overlay after something inside changed, e.g. image loaded.
        update: function() {
          if (!this._map) {
            return;
          }
          this._container.style.visibility = "hidden";
          this._updateContent();
          this._updateLayout();
          this._updatePosition();
          this._container.style.visibility = "";
          this._adjustPan();
        },
        getEvents: function() {
          var events = {
            zoom: this._updatePosition,
            viewreset: this._updatePosition
          };
          if (this._zoomAnimated) {
            events.zoomanim = this._animateZoom;
          }
          return events;
        },
        // @method isOpen: Boolean
        // Returns `true` when the overlay is visible on the map.
        isOpen: function() {
          return !!this._map && this._map.hasLayer(this);
        },
        // @method bringToFront: this
        // Brings this overlay in front of other overlays (in the same map pane).
        bringToFront: function() {
          if (this._map) {
            toFront(this._container);
          }
          return this;
        },
        // @method bringToBack: this
        // Brings this overlay to the back of other overlays (in the same map pane).
        bringToBack: function() {
          if (this._map) {
            toBack(this._container);
          }
          return this;
        },
        // prepare bound overlay to open: update latlng pos / content source (for FeatureGroup)
        _prepareOpen: function(latlng) {
          var source = this._source;
          if (!source._map) {
            return false;
          }
          if (source instanceof FeatureGroup) {
            source = null;
            var layers2 = this._source._layers;
            for (var id in layers2) {
              if (layers2[id]._map) {
                source = layers2[id];
                break;
              }
            }
            if (!source) {
              return false;
            }
            this._source = source;
          }
          if (!latlng) {
            if (source.getCenter) {
              latlng = source.getCenter();
            } else if (source.getLatLng) {
              latlng = source.getLatLng();
            } else if (source.getBounds) {
              latlng = source.getBounds().getCenter();
            } else {
              throw new Error("Unable to get source layer LatLng.");
            }
          }
          this.setLatLng(latlng);
          if (this._map) {
            this.update();
          }
          return true;
        },
        _updateContent: function() {
          if (!this._content) {
            return;
          }
          var node = this._contentNode;
          var content = typeof this._content === "function" ? this._content(this._source || this) : this._content;
          if (typeof content === "string") {
            node.innerHTML = content;
          } else {
            while (node.hasChildNodes()) {
              node.removeChild(node.firstChild);
            }
            node.appendChild(content);
          }
          this.fire("contentupdate");
        },
        _updatePosition: function() {
          if (!this._map) {
            return;
          }
          var pos = this._map.latLngToLayerPoint(this._latlng), offset = toPoint(this.options.offset), anchor = this._getAnchor();
          if (this._zoomAnimated) {
            setPosition(this._container, pos.add(anchor));
          } else {
            offset = offset.add(pos).add(anchor);
          }
          var bottom = this._containerBottom = -offset.y, left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;
          this._container.style.bottom = bottom + "px";
          this._container.style.left = left + "px";
        },
        _getAnchor: function() {
          return [0, 0];
        }
      });
      Map2.include({
        _initOverlay: function(OverlayClass, content, latlng, options) {
          var overlay = content;
          if (!(overlay instanceof OverlayClass)) {
            overlay = new OverlayClass(options).setContent(content);
          }
          if (latlng) {
            overlay.setLatLng(latlng);
          }
          return overlay;
        }
      });
      Layer.include({
        _initOverlay: function(OverlayClass, old, content, options) {
          var overlay = content;
          if (overlay instanceof OverlayClass) {
            setOptions(overlay, options);
            overlay._source = this;
          } else {
            overlay = old && !options ? old : new OverlayClass(options, this);
            overlay.setContent(content);
          }
          return overlay;
        }
      });
      var Popup = DivOverlay.extend({
        // @section
        // @aka Popup options
        options: {
          // @option pane: String = 'popupPane'
          // `Map pane` where the popup will be added.
          pane: "popupPane",
          // @option offset: Point = Point(0, 7)
          // The offset of the popup position.
          offset: [0, 7],
          // @option maxWidth: Number = 300
          // Max width of the popup, in pixels.
          maxWidth: 300,
          // @option minWidth: Number = 50
          // Min width of the popup, in pixels.
          minWidth: 50,
          // @option maxHeight: Number = null
          // If set, creates a scrollable container of the given height
          // inside a popup if its content exceeds it.
          // The scrollable container can be styled using the
          // `leaflet-popup-scrolled` CSS class selector.
          maxHeight: null,
          // @option autoPan: Boolean = true
          // Set it to `false` if you don't want the map to do panning animation
          // to fit the opened popup.
          autoPan: true,
          // @option autoPanPaddingTopLeft: Point = null
          // The margin between the popup and the top left corner of the map
          // view after autopanning was performed.
          autoPanPaddingTopLeft: null,
          // @option autoPanPaddingBottomRight: Point = null
          // The margin between the popup and the bottom right corner of the map
          // view after autopanning was performed.
          autoPanPaddingBottomRight: null,
          // @option autoPanPadding: Point = Point(5, 5)
          // Equivalent of setting both top left and bottom right autopan padding to the same value.
          autoPanPadding: [5, 5],
          // @option keepInView: Boolean = false
          // Set it to `true` if you want to prevent users from panning the popup
          // off of the screen while it is open.
          keepInView: false,
          // @option closeButton: Boolean = true
          // Controls the presence of a close button in the popup.
          closeButton: true,
          // @option autoClose: Boolean = true
          // Set it to `false` if you want to override the default behavior of
          // the popup closing when another popup is opened.
          autoClose: true,
          // @option closeOnEscapeKey: Boolean = true
          // Set it to `false` if you want to override the default behavior of
          // the ESC key for closing of the popup.
          closeOnEscapeKey: true,
          // @option closeOnClick: Boolean = *
          // Set it if you want to override the default behavior of the popup closing when user clicks
          // on the map. Defaults to the map's [`closePopupOnClick`](#map-closepopuponclick) option.
          // @option className: String = ''
          // A custom CSS class name to assign to the popup.
          className: ""
        },
        // @namespace Popup
        // @method openOn(map: Map): this
        // Alternative to `map.openPopup(popup)`.
        // Adds the popup to the map and closes the previous one.
        openOn: function(map) {
          map = arguments.length ? map : this._source._map;
          if (!map.hasLayer(this) && map._popup && map._popup.options.autoClose) {
            map.removeLayer(map._popup);
          }
          map._popup = this;
          return DivOverlay.prototype.openOn.call(this, map);
        },
        onAdd: function(map) {
          DivOverlay.prototype.onAdd.call(this, map);
          map.fire("popupopen", { popup: this });
          if (this._source) {
            this._source.fire("popupopen", { popup: this }, true);
            if (!(this._source instanceof Path)) {
              this._source.on("preclick", stopPropagation);
            }
          }
        },
        onRemove: function(map) {
          DivOverlay.prototype.onRemove.call(this, map);
          map.fire("popupclose", { popup: this });
          if (this._source) {
            this._source.fire("popupclose", { popup: this }, true);
            if (!(this._source instanceof Path)) {
              this._source.off("preclick", stopPropagation);
            }
          }
        },
        getEvents: function() {
          var events = DivOverlay.prototype.getEvents.call(this);
          if (this.options.closeOnClick !== void 0 ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
            events.preclick = this.close;
          }
          if (this.options.keepInView) {
            events.moveend = this._adjustPan;
          }
          return events;
        },
        _initLayout: function() {
          var prefix = "leaflet-popup", container = this._container = create$1(
            "div",
            prefix + " " + (this.options.className || "") + " leaflet-zoom-animated"
          );
          var wrapper = this._wrapper = create$1("div", prefix + "-content-wrapper", container);
          this._contentNode = create$1("div", prefix + "-content", wrapper);
          disableClickPropagation(container);
          disableScrollPropagation(this._contentNode);
          on(container, "contextmenu", stopPropagation);
          this._tipContainer = create$1("div", prefix + "-tip-container", container);
          this._tip = create$1("div", prefix + "-tip", this._tipContainer);
          if (this.options.closeButton) {
            var closeButton = this._closeButton = create$1("a", prefix + "-close-button", container);
            closeButton.setAttribute("role", "button");
            closeButton.setAttribute("aria-label", "Close popup");
            closeButton.href = "#close";
            closeButton.innerHTML = '<span aria-hidden="true">&#215;</span>';
            on(closeButton, "click", function(ev) {
              preventDefault(ev);
              this.close();
            }, this);
          }
        },
        _updateLayout: function() {
          var container = this._contentNode, style2 = container.style;
          style2.width = "";
          style2.whiteSpace = "nowrap";
          var width = container.offsetWidth;
          width = Math.min(width, this.options.maxWidth);
          width = Math.max(width, this.options.minWidth);
          style2.width = width + 1 + "px";
          style2.whiteSpace = "";
          style2.height = "";
          var height = container.offsetHeight, maxHeight = this.options.maxHeight, scrolledClass = "leaflet-popup-scrolled";
          if (maxHeight && height > maxHeight) {
            style2.height = maxHeight + "px";
            addClass(container, scrolledClass);
          } else {
            removeClass(container, scrolledClass);
          }
          this._containerWidth = this._container.offsetWidth;
        },
        _animateZoom: function(e) {
          var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center), anchor = this._getAnchor();
          setPosition(this._container, pos.add(anchor));
        },
        _adjustPan: function() {
          if (!this.options.autoPan) {
            return;
          }
          if (this._map._panAnim) {
            this._map._panAnim.stop();
          }
          if (this._autopanning) {
            this._autopanning = false;
            return;
          }
          var map = this._map, marginBottom = parseInt(getStyle(this._container, "marginBottom"), 10) || 0, containerHeight = this._container.offsetHeight + marginBottom, containerWidth = this._containerWidth, layerPos = new Point(this._containerLeft, -containerHeight - this._containerBottom);
          layerPos._add(getPosition(this._container));
          var containerPos = map.layerPointToContainerPoint(layerPos), padding = toPoint(this.options.autoPanPadding), paddingTL = toPoint(this.options.autoPanPaddingTopLeft || padding), paddingBR = toPoint(this.options.autoPanPaddingBottomRight || padding), size = map.getSize(), dx = 0, dy = 0;
          if (containerPos.x + containerWidth + paddingBR.x > size.x) {
            dx = containerPos.x + containerWidth - size.x + paddingBR.x;
          }
          if (containerPos.x - dx - paddingTL.x < 0) {
            dx = containerPos.x - paddingTL.x;
          }
          if (containerPos.y + containerHeight + paddingBR.y > size.y) {
            dy = containerPos.y + containerHeight - size.y + paddingBR.y;
          }
          if (containerPos.y - dy - paddingTL.y < 0) {
            dy = containerPos.y - paddingTL.y;
          }
          if (dx || dy) {
            if (this.options.keepInView) {
              this._autopanning = true;
            }
            map.fire("autopanstart").panBy([dx, dy]);
          }
        },
        _getAnchor: function() {
          return toPoint(this._source && this._source._getPopupAnchor ? this._source._getPopupAnchor() : [0, 0]);
        }
      });
      var popup = function(options, source) {
        return new Popup(options, source);
      };
      Map2.mergeOptions({
        closePopupOnClick: true
      });
      Map2.include({
        // @method openPopup(popup: Popup): this
        // Opens the specified popup while closing the previously opened (to make sure only one is opened at one time for usability).
        // @alternative
        // @method openPopup(content: String|HTMLElement, latlng: LatLng, options?: Popup options): this
        // Creates a popup with the specified content and options and opens it in the given point on a map.
        openPopup: function(popup2, latlng, options) {
          this._initOverlay(Popup, popup2, latlng, options).openOn(this);
          return this;
        },
        // @method closePopup(popup?: Popup): this
        // Closes the popup previously opened with [openPopup](#map-openpopup) (or the given one).
        closePopup: function(popup2) {
          popup2 = arguments.length ? popup2 : this._popup;
          if (popup2) {
            popup2.close();
          }
          return this;
        }
      });
      Layer.include({
        // @method bindPopup(content: String|HTMLElement|Function|Popup, options?: Popup options): this
        // Binds a popup to the layer with the passed `content` and sets up the
        // necessary event listeners. If a `Function` is passed it will receive
        // the layer as the first argument and should return a `String` or `HTMLElement`.
        bindPopup: function(content, options) {
          this._popup = this._initOverlay(Popup, this._popup, content, options);
          if (!this._popupHandlersAdded) {
            this.on({
              click: this._openPopup,
              keypress: this._onKeyPress,
              remove: this.closePopup,
              move: this._movePopup
            });
            this._popupHandlersAdded = true;
          }
          return this;
        },
        // @method unbindPopup(): this
        // Removes the popup previously bound with `bindPopup`.
        unbindPopup: function() {
          if (this._popup) {
            this.off({
              click: this._openPopup,
              keypress: this._onKeyPress,
              remove: this.closePopup,
              move: this._movePopup
            });
            this._popupHandlersAdded = false;
            this._popup = null;
          }
          return this;
        },
        // @method openPopup(latlng?: LatLng): this
        // Opens the bound popup at the specified `latlng` or at the default popup anchor if no `latlng` is passed.
        openPopup: function(latlng) {
          if (this._popup) {
            if (!(this instanceof FeatureGroup)) {
              this._popup._source = this;
            }
            if (this._popup._prepareOpen(latlng || this._latlng)) {
              this._popup.openOn(this._map);
            }
          }
          return this;
        },
        // @method closePopup(): this
        // Closes the popup bound to this layer if it is open.
        closePopup: function() {
          if (this._popup) {
            this._popup.close();
          }
          return this;
        },
        // @method togglePopup(): this
        // Opens or closes the popup bound to this layer depending on its current state.
        togglePopup: function() {
          if (this._popup) {
            this._popup.toggle(this);
          }
          return this;
        },
        // @method isPopupOpen(): boolean
        // Returns `true` if the popup bound to this layer is currently open.
        isPopupOpen: function() {
          return this._popup ? this._popup.isOpen() : false;
        },
        // @method setPopupContent(content: String|HTMLElement|Popup): this
        // Sets the content of the popup bound to this layer.
        setPopupContent: function(content) {
          if (this._popup) {
            this._popup.setContent(content);
          }
          return this;
        },
        // @method getPopup(): Popup
        // Returns the popup bound to this layer.
        getPopup: function() {
          return this._popup;
        },
        _openPopup: function(e) {
          if (!this._popup || !this._map) {
            return;
          }
          stop(e);
          var target = e.layer || e.target;
          if (this._popup._source === target && !(target instanceof Path)) {
            if (this._map.hasLayer(this._popup)) {
              this.closePopup();
            } else {
              this.openPopup(e.latlng);
            }
            return;
          }
          this._popup._source = target;
          this.openPopup(e.latlng);
        },
        _movePopup: function(e) {
          this._popup.setLatLng(e.latlng);
        },
        _onKeyPress: function(e) {
          if (e.originalEvent.keyCode === 13) {
            this._openPopup(e);
          }
        }
      });
      var Tooltip = DivOverlay.extend({
        // @section
        // @aka Tooltip options
        options: {
          // @option pane: String = 'tooltipPane'
          // `Map pane` where the tooltip will be added.
          pane: "tooltipPane",
          // @option offset: Point = Point(0, 0)
          // Optional offset of the tooltip position.
          offset: [0, 0],
          // @option direction: String = 'auto'
          // Direction where to open the tooltip. Possible values are: `right`, `left`,
          // `top`, `bottom`, `center`, `auto`.
          // `auto` will dynamically switch between `right` and `left` according to the tooltip
          // position on the map.
          direction: "auto",
          // @option permanent: Boolean = false
          // Whether to open the tooltip permanently or only on mouseover.
          permanent: false,
          // @option sticky: Boolean = false
          // If true, the tooltip will follow the mouse instead of being fixed at the feature center.
          sticky: false,
          // @option opacity: Number = 0.9
          // Tooltip container opacity.
          opacity: 0.9
        },
        onAdd: function(map) {
          DivOverlay.prototype.onAdd.call(this, map);
          this.setOpacity(this.options.opacity);
          map.fire("tooltipopen", { tooltip: this });
          if (this._source) {
            this.addEventParent(this._source);
            this._source.fire("tooltipopen", { tooltip: this }, true);
          }
        },
        onRemove: function(map) {
          DivOverlay.prototype.onRemove.call(this, map);
          map.fire("tooltipclose", { tooltip: this });
          if (this._source) {
            this.removeEventParent(this._source);
            this._source.fire("tooltipclose", { tooltip: this }, true);
          }
        },
        getEvents: function() {
          var events = DivOverlay.prototype.getEvents.call(this);
          if (!this.options.permanent) {
            events.preclick = this.close;
          }
          return events;
        },
        _initLayout: function() {
          var prefix = "leaflet-tooltip", className = prefix + " " + (this.options.className || "") + " leaflet-zoom-" + (this._zoomAnimated ? "animated" : "hide");
          this._contentNode = this._container = create$1("div", className);
          this._container.setAttribute("role", "tooltip");
          this._container.setAttribute("id", "leaflet-tooltip-" + stamp(this));
        },
        _updateLayout: function() {
        },
        _adjustPan: function() {
        },
        _setPosition: function(pos) {
          var subX, subY, map = this._map, container = this._container, centerPoint = map.latLngToContainerPoint(map.getCenter()), tooltipPoint = map.layerPointToContainerPoint(pos), direction = this.options.direction, tooltipWidth = container.offsetWidth, tooltipHeight = container.offsetHeight, offset = toPoint(this.options.offset), anchor = this._getAnchor();
          if (direction === "top") {
            subX = tooltipWidth / 2;
            subY = tooltipHeight;
          } else if (direction === "bottom") {
            subX = tooltipWidth / 2;
            subY = 0;
          } else if (direction === "center") {
            subX = tooltipWidth / 2;
            subY = tooltipHeight / 2;
          } else if (direction === "right") {
            subX = 0;
            subY = tooltipHeight / 2;
          } else if (direction === "left") {
            subX = tooltipWidth;
            subY = tooltipHeight / 2;
          } else if (tooltipPoint.x < centerPoint.x) {
            direction = "right";
            subX = 0;
            subY = tooltipHeight / 2;
          } else {
            direction = "left";
            subX = tooltipWidth + (offset.x + anchor.x) * 2;
            subY = tooltipHeight / 2;
          }
          pos = pos.subtract(toPoint(subX, subY, true)).add(offset).add(anchor);
          removeClass(container, "leaflet-tooltip-right");
          removeClass(container, "leaflet-tooltip-left");
          removeClass(container, "leaflet-tooltip-top");
          removeClass(container, "leaflet-tooltip-bottom");
          addClass(container, "leaflet-tooltip-" + direction);
          setPosition(container, pos);
        },
        _updatePosition: function() {
          var pos = this._map.latLngToLayerPoint(this._latlng);
          this._setPosition(pos);
        },
        setOpacity: function(opacity) {
          this.options.opacity = opacity;
          if (this._container) {
            setOpacity(this._container, opacity);
          }
        },
        _animateZoom: function(e) {
          var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
          this._setPosition(pos);
        },
        _getAnchor: function() {
          return toPoint(this._source && this._source._getTooltipAnchor && !this.options.sticky ? this._source._getTooltipAnchor() : [0, 0]);
        }
      });
      var tooltip = function(options, source) {
        return new Tooltip(options, source);
      };
      Map2.include({
        // @method openTooltip(tooltip: Tooltip): this
        // Opens the specified tooltip.
        // @alternative
        // @method openTooltip(content: String|HTMLElement, latlng: LatLng, options?: Tooltip options): this
        // Creates a tooltip with the specified content and options and open it.
        openTooltip: function(tooltip2, latlng, options) {
          this._initOverlay(Tooltip, tooltip2, latlng, options).openOn(this);
          return this;
        },
        // @method closeTooltip(tooltip: Tooltip): this
        // Closes the tooltip given as parameter.
        closeTooltip: function(tooltip2) {
          tooltip2.close();
          return this;
        }
      });
      Layer.include({
        // @method bindTooltip(content: String|HTMLElement|Function|Tooltip, options?: Tooltip options): this
        // Binds a tooltip to the layer with the passed `content` and sets up the
        // necessary event listeners. If a `Function` is passed it will receive
        // the layer as the first argument and should return a `String` or `HTMLElement`.
        bindTooltip: function(content, options) {
          if (this._tooltip && this.isTooltipOpen()) {
            this.unbindTooltip();
          }
          this._tooltip = this._initOverlay(Tooltip, this._tooltip, content, options);
          this._initTooltipInteractions();
          if (this._tooltip.options.permanent && this._map && this._map.hasLayer(this)) {
            this.openTooltip();
          }
          return this;
        },
        // @method unbindTooltip(): this
        // Removes the tooltip previously bound with `bindTooltip`.
        unbindTooltip: function() {
          if (this._tooltip) {
            this._initTooltipInteractions(true);
            this.closeTooltip();
            this._tooltip = null;
          }
          return this;
        },
        _initTooltipInteractions: function(remove2) {
          if (!remove2 && this._tooltipHandlersAdded) {
            return;
          }
          var onOff = remove2 ? "off" : "on", events = {
            remove: this.closeTooltip,
            move: this._moveTooltip
          };
          if (!this._tooltip.options.permanent) {
            events.mouseover = this._openTooltip;
            events.mouseout = this.closeTooltip;
            events.click = this._openTooltip;
            if (this._map) {
              this._addFocusListeners();
            } else {
              events.add = this._addFocusListeners;
            }
          } else {
            events.add = this._openTooltip;
          }
          if (this._tooltip.options.sticky) {
            events.mousemove = this._moveTooltip;
          }
          this[onOff](events);
          this._tooltipHandlersAdded = !remove2;
        },
        // @method openTooltip(latlng?: LatLng): this
        // Opens the bound tooltip at the specified `latlng` or at the default tooltip anchor if no `latlng` is passed.
        openTooltip: function(latlng) {
          if (this._tooltip) {
            if (!(this instanceof FeatureGroup)) {
              this._tooltip._source = this;
            }
            if (this._tooltip._prepareOpen(latlng)) {
              this._tooltip.openOn(this._map);
              if (this.getElement) {
                this._setAriaDescribedByOnLayer(this);
              } else if (this.eachLayer) {
                this.eachLayer(this._setAriaDescribedByOnLayer, this);
              }
            }
          }
          return this;
        },
        // @method closeTooltip(): this
        // Closes the tooltip bound to this layer if it is open.
        closeTooltip: function() {
          if (this._tooltip) {
            return this._tooltip.close();
          }
        },
        // @method toggleTooltip(): this
        // Opens or closes the tooltip bound to this layer depending on its current state.
        toggleTooltip: function() {
          if (this._tooltip) {
            this._tooltip.toggle(this);
          }
          return this;
        },
        // @method isTooltipOpen(): boolean
        // Returns `true` if the tooltip bound to this layer is currently open.
        isTooltipOpen: function() {
          return this._tooltip.isOpen();
        },
        // @method setTooltipContent(content: String|HTMLElement|Tooltip): this
        // Sets the content of the tooltip bound to this layer.
        setTooltipContent: function(content) {
          if (this._tooltip) {
            this._tooltip.setContent(content);
          }
          return this;
        },
        // @method getTooltip(): Tooltip
        // Returns the tooltip bound to this layer.
        getTooltip: function() {
          return this._tooltip;
        },
        _addFocusListeners: function() {
          if (this.getElement) {
            this._addFocusListenersOnLayer(this);
          } else if (this.eachLayer) {
            this.eachLayer(this._addFocusListenersOnLayer, this);
          }
        },
        _addFocusListenersOnLayer: function(layer) {
          var el = typeof layer.getElement === "function" && layer.getElement();
          if (el) {
            on(el, "focus", function() {
              this._tooltip._source = layer;
              this.openTooltip();
            }, this);
            on(el, "blur", this.closeTooltip, this);
          }
        },
        _setAriaDescribedByOnLayer: function(layer) {
          var el = typeof layer.getElement === "function" && layer.getElement();
          if (el) {
            el.setAttribute("aria-describedby", this._tooltip._container.id);
          }
        },
        _openTooltip: function(e) {
          if (!this._tooltip || !this._map) {
            return;
          }
          if (this._map.dragging && this._map.dragging.moving() && !this._openOnceFlag) {
            this._openOnceFlag = true;
            var that = this;
            this._map.once("moveend", function() {
              that._openOnceFlag = false;
              that._openTooltip(e);
            });
            return;
          }
          this._tooltip._source = e.layer || e.target;
          this.openTooltip(this._tooltip.options.sticky ? e.latlng : void 0);
        },
        _moveTooltip: function(e) {
          var latlng = e.latlng, containerPoint, layerPoint;
          if (this._tooltip.options.sticky && e.originalEvent) {
            containerPoint = this._map.mouseEventToContainerPoint(e.originalEvent);
            layerPoint = this._map.containerPointToLayerPoint(containerPoint);
            latlng = this._map.layerPointToLatLng(layerPoint);
          }
          this._tooltip.setLatLng(latlng);
        }
      });
      var DivIcon = Icon.extend({
        options: {
          // @section
          // @aka DivIcon options
          iconSize: [12, 12],
          // also can be set through CSS
          // iconAnchor: (Point),
          // popupAnchor: (Point),
          // @option html: String|HTMLElement = ''
          // Custom HTML code to put inside the div element, empty by default. Alternatively,
          // an instance of `HTMLElement`.
          html: false,
          // @option bgPos: Point = [0, 0]
          // Optional relative position of the background, in pixels
          bgPos: null,
          className: "leaflet-div-icon"
        },
        createIcon: function(oldIcon) {
          var div = oldIcon && oldIcon.tagName === "DIV" ? oldIcon : document.createElement("div"), options = this.options;
          if (options.html instanceof Element) {
            empty(div);
            div.appendChild(options.html);
          } else {
            div.innerHTML = options.html !== false ? options.html : "";
          }
          if (options.bgPos) {
            var bgPos = toPoint(options.bgPos);
            div.style.backgroundPosition = -bgPos.x + "px " + -bgPos.y + "px";
          }
          this._setIconStyles(div, "icon");
          return div;
        },
        createShadow: function() {
          return null;
        }
      });
      function divIcon(options) {
        return new DivIcon(options);
      }
      Icon.Default = IconDefault;
      var GridLayer = Layer.extend({
        // @section
        // @aka GridLayer options
        options: {
          // @option tileSize: Number|Point = 256
          // Width and height of tiles in the grid. Use a number if width and height are equal, or `L.point(width, height)` otherwise.
          tileSize: 256,
          // @option opacity: Number = 1.0
          // Opacity of the tiles. Can be used in the `createTile()` function.
          opacity: 1,
          // @option updateWhenIdle: Boolean = (depends)
          // Load new tiles only when panning ends.
          // `true` by default on mobile browsers, in order to avoid too many requests and keep smooth navigation.
          // `false` otherwise in order to display new tiles _during_ panning, since it is easy to pan outside the
          // [`keepBuffer`](#gridlayer-keepbuffer) option in desktop browsers.
          updateWhenIdle: Browser.mobile,
          // @option updateWhenZooming: Boolean = true
          // By default, a smooth zoom animation (during a [touch zoom](#map-touchzoom) or a [`flyTo()`](#map-flyto)) will update grid layers every integer zoom level. Setting this option to `false` will update the grid layer only when the smooth animation ends.
          updateWhenZooming: true,
          // @option updateInterval: Number = 200
          // Tiles will not update more than once every `updateInterval` milliseconds when panning.
          updateInterval: 200,
          // @option zIndex: Number = 1
          // The explicit zIndex of the tile layer.
          zIndex: 1,
          // @option bounds: LatLngBounds = undefined
          // If set, tiles will only be loaded inside the set `LatLngBounds`.
          bounds: null,
          // @option minZoom: Number = 0
          // The minimum zoom level down to which this layer will be displayed (inclusive).
          minZoom: 0,
          // @option maxZoom: Number = undefined
          // The maximum zoom level up to which this layer will be displayed (inclusive).
          maxZoom: void 0,
          // @option maxNativeZoom: Number = undefined
          // Maximum zoom number the tile source has available. If it is specified,
          // the tiles on all zoom levels higher than `maxNativeZoom` will be loaded
          // from `maxNativeZoom` level and auto-scaled.
          maxNativeZoom: void 0,
          // @option minNativeZoom: Number = undefined
          // Minimum zoom number the tile source has available. If it is specified,
          // the tiles on all zoom levels lower than `minNativeZoom` will be loaded
          // from `minNativeZoom` level and auto-scaled.
          minNativeZoom: void 0,
          // @option noWrap: Boolean = false
          // Whether the layer is wrapped around the antimeridian. If `true`, the
          // GridLayer will only be displayed once at low zoom levels. Has no
          // effect when the [map CRS](#map-crs) doesn't wrap around. Can be used
          // in combination with [`bounds`](#gridlayer-bounds) to prevent requesting
          // tiles outside the CRS limits.
          noWrap: false,
          // @option pane: String = 'tilePane'
          // `Map pane` where the grid layer will be added.
          pane: "tilePane",
          // @option className: String = ''
          // A custom class name to assign to the tile layer. Empty by default.
          className: "",
          // @option keepBuffer: Number = 2
          // When panning the map, keep this many rows and columns of tiles before unloading them.
          keepBuffer: 2
        },
        initialize: function(options) {
          setOptions(this, options);
        },
        onAdd: function() {
          this._initContainer();
          this._levels = {};
          this._tiles = {};
          this._resetView();
        },
        beforeAdd: function(map) {
          map._addZoomLimit(this);
        },
        onRemove: function(map) {
          this._removeAllTiles();
          remove(this._container);
          map._removeZoomLimit(this);
          this._container = null;
          this._tileZoom = void 0;
        },
        // @method bringToFront: this
        // Brings the tile layer to the top of all tile layers.
        bringToFront: function() {
          if (this._map) {
            toFront(this._container);
            this._setAutoZIndex(Math.max);
          }
          return this;
        },
        // @method bringToBack: this
        // Brings the tile layer to the bottom of all tile layers.
        bringToBack: function() {
          if (this._map) {
            toBack(this._container);
            this._setAutoZIndex(Math.min);
          }
          return this;
        },
        // @method getContainer: HTMLElement
        // Returns the HTML element that contains the tiles for this layer.
        getContainer: function() {
          return this._container;
        },
        // @method setOpacity(opacity: Number): this
        // Changes the [opacity](#gridlayer-opacity) of the grid layer.
        setOpacity: function(opacity) {
          this.options.opacity = opacity;
          this._updateOpacity();
          return this;
        },
        // @method setZIndex(zIndex: Number): this
        // Changes the [zIndex](#gridlayer-zindex) of the grid layer.
        setZIndex: function(zIndex) {
          this.options.zIndex = zIndex;
          this._updateZIndex();
          return this;
        },
        // @method isLoading: Boolean
        // Returns `true` if any tile in the grid layer has not finished loading.
        isLoading: function() {
          return this._loading;
        },
        // @method redraw: this
        // Causes the layer to clear all the tiles and request them again.
        redraw: function() {
          if (this._map) {
            this._removeAllTiles();
            var tileZoom = this._clampZoom(this._map.getZoom());
            if (tileZoom !== this._tileZoom) {
              this._tileZoom = tileZoom;
              this._updateLevels();
            }
            this._update();
          }
          return this;
        },
        getEvents: function() {
          var events = {
            viewprereset: this._invalidateAll,
            viewreset: this._resetView,
            zoom: this._resetView,
            moveend: this._onMoveEnd
          };
          if (!this.options.updateWhenIdle) {
            if (!this._onMove) {
              this._onMove = throttle2(this._onMoveEnd, this.options.updateInterval, this);
            }
            events.move = this._onMove;
          }
          if (this._zoomAnimated) {
            events.zoomanim = this._animateZoom;
          }
          return events;
        },
        // @section Extension methods
        // Layers extending `GridLayer` shall reimplement the following method.
        // @method createTile(coords: Object, done?: Function): HTMLElement
        // Called only internally, must be overridden by classes extending `GridLayer`.
        // Returns the `HTMLElement` corresponding to the given `coords`. If the `done` callback
        // is specified, it must be called when the tile has finished loading and drawing.
        createTile: function() {
          return document.createElement("div");
        },
        // @section
        // @method getTileSize: Point
        // Normalizes the [tileSize option](#gridlayer-tilesize) into a point. Used by the `createTile()` method.
        getTileSize: function() {
          var s = this.options.tileSize;
          return s instanceof Point ? s : new Point(s, s);
        },
        _updateZIndex: function() {
          if (this._container && this.options.zIndex !== void 0 && this.options.zIndex !== null) {
            this._container.style.zIndex = this.options.zIndex;
          }
        },
        _setAutoZIndex: function(compare) {
          var layers2 = this.getPane().children, edgeZIndex = -compare(-Infinity, Infinity);
          for (var i = 0, len = layers2.length, zIndex; i < len; i++) {
            zIndex = layers2[i].style.zIndex;
            if (layers2[i] !== this._container && zIndex) {
              edgeZIndex = compare(edgeZIndex, +zIndex);
            }
          }
          if (isFinite(edgeZIndex)) {
            this.options.zIndex = edgeZIndex + compare(-1, 1);
            this._updateZIndex();
          }
        },
        _updateOpacity: function() {
          if (!this._map) {
            return;
          }
          if (Browser.ielt9) {
            return;
          }
          setOpacity(this._container, this.options.opacity);
          var now = +/* @__PURE__ */ new Date(), nextFrame = false, willPrune = false;
          for (var key in this._tiles) {
            var tile = this._tiles[key];
            if (!tile.current || !tile.loaded) {
              continue;
            }
            var fade = Math.min(1, (now - tile.loaded) / 200);
            setOpacity(tile.el, fade);
            if (fade < 1) {
              nextFrame = true;
            } else {
              if (tile.active) {
                willPrune = true;
              } else {
                this._onOpaqueTile(tile);
              }
              tile.active = true;
            }
          }
          if (willPrune && !this._noPrune) {
            this._pruneTiles();
          }
          if (nextFrame) {
            cancelAnimFrame(this._fadeFrame);
            this._fadeFrame = requestAnimFrame(this._updateOpacity, this);
          }
        },
        _onOpaqueTile: falseFn,
        _initContainer: function() {
          if (this._container) {
            return;
          }
          this._container = create$1("div", "leaflet-layer " + (this.options.className || ""));
          this._updateZIndex();
          if (this.options.opacity < 1) {
            this._updateOpacity();
          }
          this.getPane().appendChild(this._container);
        },
        _updateLevels: function() {
          var zoom2 = this._tileZoom, maxZoom = this.options.maxZoom;
          if (zoom2 === void 0) {
            return void 0;
          }
          for (var z in this._levels) {
            z = Number(z);
            if (this._levels[z].el.children.length || z === zoom2) {
              this._levels[z].el.style.zIndex = maxZoom - Math.abs(zoom2 - z);
              this._onUpdateLevel(z);
            } else {
              remove(this._levels[z].el);
              this._removeTilesAtZoom(z);
              this._onRemoveLevel(z);
              delete this._levels[z];
            }
          }
          var level = this._levels[zoom2], map = this._map;
          if (!level) {
            level = this._levels[zoom2] = {};
            level.el = create$1("div", "leaflet-tile-container leaflet-zoom-animated", this._container);
            level.el.style.zIndex = maxZoom;
            level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom2).round();
            level.zoom = zoom2;
            this._setZoomTransform(level, map.getCenter(), map.getZoom());
            falseFn(level.el.offsetWidth);
            this._onCreateLevel(level);
          }
          this._level = level;
          return level;
        },
        _onUpdateLevel: falseFn,
        _onRemoveLevel: falseFn,
        _onCreateLevel: falseFn,
        _pruneTiles: function() {
          if (!this._map) {
            return;
          }
          var key, tile;
          var zoom2 = this._map.getZoom();
          if (zoom2 > this.options.maxZoom || zoom2 < this.options.minZoom) {
            this._removeAllTiles();
            return;
          }
          for (key in this._tiles) {
            tile = this._tiles[key];
            tile.retain = tile.current;
          }
          for (key in this._tiles) {
            tile = this._tiles[key];
            if (tile.current && !tile.active) {
              var coords = tile.coords;
              if (!this._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) {
                this._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
              }
            }
          }
          for (key in this._tiles) {
            if (!this._tiles[key].retain) {
              this._removeTile(key);
            }
          }
        },
        _removeTilesAtZoom: function(zoom2) {
          for (var key in this._tiles) {
            if (this._tiles[key].coords.z !== zoom2) {
              continue;
            }
            this._removeTile(key);
          }
        },
        _removeAllTiles: function() {
          for (var key in this._tiles) {
            this._removeTile(key);
          }
        },
        _invalidateAll: function() {
          for (var z in this._levels) {
            remove(this._levels[z].el);
            this._onRemoveLevel(Number(z));
            delete this._levels[z];
          }
          this._removeAllTiles();
          this._tileZoom = void 0;
        },
        _retainParent: function(x, y, z, minZoom) {
          var x2 = Math.floor(x / 2), y2 = Math.floor(y / 2), z2 = z - 1, coords2 = new Point(+x2, +y2);
          coords2.z = +z2;
          var key = this._tileCoordsToKey(coords2), tile = this._tiles[key];
          if (tile && tile.active) {
            tile.retain = true;
            return true;
          } else if (tile && tile.loaded) {
            tile.retain = true;
          }
          if (z2 > minZoom) {
            return this._retainParent(x2, y2, z2, minZoom);
          }
          return false;
        },
        _retainChildren: function(x, y, z, maxZoom) {
          for (var i = 2 * x; i < 2 * x + 2; i++) {
            for (var j = 2 * y; j < 2 * y + 2; j++) {
              var coords = new Point(i, j);
              coords.z = z + 1;
              var key = this._tileCoordsToKey(coords), tile = this._tiles[key];
              if (tile && tile.active) {
                tile.retain = true;
                continue;
              } else if (tile && tile.loaded) {
                tile.retain = true;
              }
              if (z + 1 < maxZoom) {
                this._retainChildren(i, j, z + 1, maxZoom);
              }
            }
          }
        },
        _resetView: function(e) {
          var animating = e && (e.pinch || e.flyTo);
          this._setView(this._map.getCenter(), this._map.getZoom(), animating, animating);
        },
        _animateZoom: function(e) {
          this._setView(e.center, e.zoom, true, e.noUpdate);
        },
        _clampZoom: function(zoom2) {
          var options = this.options;
          if (void 0 !== options.minNativeZoom && zoom2 < options.minNativeZoom) {
            return options.minNativeZoom;
          }
          if (void 0 !== options.maxNativeZoom && options.maxNativeZoom < zoom2) {
            return options.maxNativeZoom;
          }
          return zoom2;
        },
        _setView: function(center, zoom2, noPrune, noUpdate) {
          var tileZoom = Math.round(zoom2);
          if (this.options.maxZoom !== void 0 && tileZoom > this.options.maxZoom || this.options.minZoom !== void 0 && tileZoom < this.options.minZoom) {
            tileZoom = void 0;
          } else {
            tileZoom = this._clampZoom(tileZoom);
          }
          var tileZoomChanged = this.options.updateWhenZooming && tileZoom !== this._tileZoom;
          if (!noUpdate || tileZoomChanged) {
            this._tileZoom = tileZoom;
            if (this._abortLoading) {
              this._abortLoading();
            }
            this._updateLevels();
            this._resetGrid();
            if (tileZoom !== void 0) {
              this._update(center);
            }
            if (!noPrune) {
              this._pruneTiles();
            }
            this._noPrune = !!noPrune;
          }
          this._setZoomTransforms(center, zoom2);
        },
        _setZoomTransforms: function(center, zoom2) {
          for (var i in this._levels) {
            this._setZoomTransform(this._levels[i], center, zoom2);
          }
        },
        _setZoomTransform: function(level, center, zoom2) {
          var scale2 = this._map.getZoomScale(zoom2, level.zoom), translate = level.origin.multiplyBy(scale2).subtract(this._map._getNewPixelOrigin(center, zoom2)).round();
          if (Browser.any3d) {
            setTransform(level.el, translate, scale2);
          } else {
            setPosition(level.el, translate);
          }
        },
        _resetGrid: function() {
          var map = this._map, crs = map.options.crs, tileSize = this._tileSize = this.getTileSize(), tileZoom = this._tileZoom;
          var bounds = this._map.getPixelWorldBounds(this._tileZoom);
          if (bounds) {
            this._globalTileRange = this._pxBoundsToTileRange(bounds);
          }
          this._wrapX = crs.wrapLng && !this.options.noWrap && [
            Math.floor(map.project([0, crs.wrapLng[0]], tileZoom).x / tileSize.x),
            Math.ceil(map.project([0, crs.wrapLng[1]], tileZoom).x / tileSize.y)
          ];
          this._wrapY = crs.wrapLat && !this.options.noWrap && [
            Math.floor(map.project([crs.wrapLat[0], 0], tileZoom).y / tileSize.x),
            Math.ceil(map.project([crs.wrapLat[1], 0], tileZoom).y / tileSize.y)
          ];
        },
        _onMoveEnd: function() {
          if (!this._map || this._map._animatingZoom) {
            return;
          }
          this._update();
        },
        _getTiledPixelBounds: function(center) {
          var map = this._map, mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(), scale2 = map.getZoomScale(mapZoom, this._tileZoom), pixelCenter = map.project(center, this._tileZoom).floor(), halfSize = map.getSize().divideBy(scale2 * 2);
          return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
        },
        // Private method to load tiles in the grid's active zoom level according to map bounds
        _update: function(center) {
          var map = this._map;
          if (!map) {
            return;
          }
          var zoom2 = this._clampZoom(map.getZoom());
          if (center === void 0) {
            center = map.getCenter();
          }
          if (this._tileZoom === void 0) {
            return;
          }
          var pixelBounds = this._getTiledPixelBounds(center), tileRange = this._pxBoundsToTileRange(pixelBounds), tileCenter = tileRange.getCenter(), queue = [], margin = this.options.keepBuffer, noPruneRange = new Bounds(
            tileRange.getBottomLeft().subtract([margin, -margin]),
            tileRange.getTopRight().add([margin, -margin])
          );
          if (!(isFinite(tileRange.min.x) && isFinite(tileRange.min.y) && isFinite(tileRange.max.x) && isFinite(tileRange.max.y))) {
            throw new Error("Attempted to load an infinite number of tiles");
          }
          for (var key in this._tiles) {
            var c = this._tiles[key].coords;
            if (c.z !== this._tileZoom || !noPruneRange.contains(new Point(c.x, c.y))) {
              this._tiles[key].current = false;
            }
          }
          if (Math.abs(zoom2 - this._tileZoom) > 1) {
            this._setView(center, zoom2);
            return;
          }
          for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
            for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
              var coords = new Point(i, j);
              coords.z = this._tileZoom;
              if (!this._isValidTile(coords)) {
                continue;
              }
              var tile = this._tiles[this._tileCoordsToKey(coords)];
              if (tile) {
                tile.current = true;
              } else {
                queue.push(coords);
              }
            }
          }
          queue.sort(function(a, b) {
            return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
          });
          if (queue.length !== 0) {
            if (!this._loading) {
              this._loading = true;
              this.fire("loading");
            }
            var fragment = document.createDocumentFragment();
            for (i = 0; i < queue.length; i++) {
              this._addTile(queue[i], fragment);
            }
            this._level.el.appendChild(fragment);
          }
        },
        _isValidTile: function(coords) {
          var crs = this._map.options.crs;
          if (!crs.infinite) {
            var bounds = this._globalTileRange;
            if (!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x) || !crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y)) {
              return false;
            }
          }
          if (!this.options.bounds) {
            return true;
          }
          var tileBounds = this._tileCoordsToBounds(coords);
          return toLatLngBounds(this.options.bounds).overlaps(tileBounds);
        },
        _keyToBounds: function(key) {
          return this._tileCoordsToBounds(this._keyToTileCoords(key));
        },
        _tileCoordsToNwSe: function(coords) {
          var map = this._map, tileSize = this.getTileSize(), nwPoint = coords.scaleBy(tileSize), sePoint = nwPoint.add(tileSize), nw = map.unproject(nwPoint, coords.z), se = map.unproject(sePoint, coords.z);
          return [nw, se];
        },
        // converts tile coordinates to its geographical bounds
        _tileCoordsToBounds: function(coords) {
          var bp = this._tileCoordsToNwSe(coords), bounds = new LatLngBounds(bp[0], bp[1]);
          if (!this.options.noWrap) {
            bounds = this._map.wrapLatLngBounds(bounds);
          }
          return bounds;
        },
        // converts tile coordinates to key for the tile cache
        _tileCoordsToKey: function(coords) {
          return coords.x + ":" + coords.y + ":" + coords.z;
        },
        // converts tile cache key to coordinates
        _keyToTileCoords: function(key) {
          var k = key.split(":"), coords = new Point(+k[0], +k[1]);
          coords.z = +k[2];
          return coords;
        },
        _removeTile: function(key) {
          var tile = this._tiles[key];
          if (!tile) {
            return;
          }
          remove(tile.el);
          delete this._tiles[key];
          this.fire("tileunload", {
            tile: tile.el,
            coords: this._keyToTileCoords(key)
          });
        },
        _initTile: function(tile) {
          addClass(tile, "leaflet-tile");
          var tileSize = this.getTileSize();
          tile.style.width = tileSize.x + "px";
          tile.style.height = tileSize.y + "px";
          tile.onselectstart = falseFn;
          tile.onmousemove = falseFn;
          if (Browser.ielt9 && this.options.opacity < 1) {
            setOpacity(tile, this.options.opacity);
          }
        },
        _addTile: function(coords, container) {
          var tilePos = this._getTilePos(coords), key = this._tileCoordsToKey(coords);
          var tile = this.createTile(this._wrapCoords(coords), bind(this._tileReady, this, coords));
          this._initTile(tile);
          if (this.createTile.length < 2) {
            requestAnimFrame(bind(this._tileReady, this, coords, null, tile));
          }
          setPosition(tile, tilePos);
          this._tiles[key] = {
            el: tile,
            coords,
            current: true
          };
          container.appendChild(tile);
          this.fire("tileloadstart", {
            tile,
            coords
          });
        },
        _tileReady: function(coords, err, tile) {
          if (err) {
            this.fire("tileerror", {
              error: err,
              tile,
              coords
            });
          }
          var key = this._tileCoordsToKey(coords);
          tile = this._tiles[key];
          if (!tile) {
            return;
          }
          tile.loaded = +/* @__PURE__ */ new Date();
          if (this._map._fadeAnimated) {
            setOpacity(tile.el, 0);
            cancelAnimFrame(this._fadeFrame);
            this._fadeFrame = requestAnimFrame(this._updateOpacity, this);
          } else {
            tile.active = true;
            this._pruneTiles();
          }
          if (!err) {
            addClass(tile.el, "leaflet-tile-loaded");
            this.fire("tileload", {
              tile: tile.el,
              coords
            });
          }
          if (this._noTilesToLoad()) {
            this._loading = false;
            this.fire("load");
            if (Browser.ielt9 || !this._map._fadeAnimated) {
              requestAnimFrame(this._pruneTiles, this);
            } else {
              setTimeout(bind(this._pruneTiles, this), 250);
            }
          }
        },
        _getTilePos: function(coords) {
          return coords.scaleBy(this.getTileSize()).subtract(this._level.origin);
        },
        _wrapCoords: function(coords) {
          var newCoords = new Point(
            this._wrapX ? wrapNum(coords.x, this._wrapX) : coords.x,
            this._wrapY ? wrapNum(coords.y, this._wrapY) : coords.y
          );
          newCoords.z = coords.z;
          return newCoords;
        },
        _pxBoundsToTileRange: function(bounds) {
          var tileSize = this.getTileSize();
          return new Bounds(
            bounds.min.unscaleBy(tileSize).floor(),
            bounds.max.unscaleBy(tileSize).ceil().subtract([1, 1])
          );
        },
        _noTilesToLoad: function() {
          for (var key in this._tiles) {
            if (!this._tiles[key].loaded) {
              return false;
            }
          }
          return true;
        }
      });
      function gridLayer(options) {
        return new GridLayer(options);
      }
      var TileLayer = GridLayer.extend({
        // @section
        // @aka TileLayer options
        options: {
          // @option minZoom: Number = 0
          // The minimum zoom level down to which this layer will be displayed (inclusive).
          minZoom: 0,
          // @option maxZoom: Number = 18
          // The maximum zoom level up to which this layer will be displayed (inclusive).
          maxZoom: 18,
          // @option subdomains: String|String[] = 'abc'
          // Subdomains of the tile service. Can be passed in the form of one string (where each letter is a subdomain name) or an array of strings.
          subdomains: "abc",
          // @option errorTileUrl: String = ''
          // URL to the tile image to show in place of the tile that failed to load.
          errorTileUrl: "",
          // @option zoomOffset: Number = 0
          // The zoom number used in tile URLs will be offset with this value.
          zoomOffset: 0,
          // @option tms: Boolean = false
          // If `true`, inverses Y axis numbering for tiles (turn this on for [TMS](https://en.wikipedia.org/wiki/Tile_Map_Service) services).
          tms: false,
          // @option zoomReverse: Boolean = false
          // If set to true, the zoom number used in tile URLs will be reversed (`maxZoom - zoom` instead of `zoom`)
          zoomReverse: false,
          // @option detectRetina: Boolean = false
          // If `true` and user is on a retina display, it will request four tiles of half the specified size and a bigger zoom level in place of one to utilize the high resolution.
          detectRetina: false,
          // @option crossOrigin: Boolean|String = false
          // Whether the crossOrigin attribute will be added to the tiles.
          // If a String is provided, all tiles will have their crossOrigin attribute set to the String provided. This is needed if you want to access tile pixel data.
          // Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
          crossOrigin: false,
          // @option referrerPolicy: Boolean|String = false
          // Whether the referrerPolicy attribute will be added to the tiles.
          // If a String is provided, all tiles will have their referrerPolicy attribute set to the String provided.
          // This may be needed if your map's rendering context has a strict default but your tile provider expects a valid referrer
          // (e.g. to validate an API token).
          // Refer to [HTMLImageElement.referrerPolicy](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/referrerPolicy) for valid String values.
          referrerPolicy: false
        },
        initialize: function(url, options) {
          this._url = url;
          options = setOptions(this, options);
          if (options.detectRetina && Browser.retina && options.maxZoom > 0) {
            options.tileSize = Math.floor(options.tileSize / 2);
            if (!options.zoomReverse) {
              options.zoomOffset++;
              options.maxZoom = Math.max(options.minZoom, options.maxZoom - 1);
            } else {
              options.zoomOffset--;
              options.minZoom = Math.min(options.maxZoom, options.minZoom + 1);
            }
            options.minZoom = Math.max(0, options.minZoom);
          } else if (!options.zoomReverse) {
            options.maxZoom = Math.max(options.minZoom, options.maxZoom);
          } else {
            options.minZoom = Math.min(options.maxZoom, options.minZoom);
          }
          if (typeof options.subdomains === "string") {
            options.subdomains = options.subdomains.split("");
          }
          this.on("tileunload", this._onTileRemove);
        },
        // @method setUrl(url: String, noRedraw?: Boolean): this
        // Updates the layer's URL template and redraws it (unless `noRedraw` is set to `true`).
        // If the URL does not change, the layer will not be redrawn unless
        // the noRedraw parameter is set to false.
        setUrl: function(url, noRedraw) {
          if (this._url === url && noRedraw === void 0) {
            noRedraw = true;
          }
          this._url = url;
          if (!noRedraw) {
            this.redraw();
          }
          return this;
        },
        // @method createTile(coords: Object, done?: Function): HTMLElement
        // Called only internally, overrides GridLayer's [`createTile()`](#gridlayer-createtile)
        // to return an `<img>` HTML element with the appropriate image URL given `coords`. The `done`
        // callback is called when the tile has been loaded.
        createTile: function(coords, done) {
          var tile = document.createElement("img");
          on(tile, "load", bind(this._tileOnLoad, this, done, tile));
          on(tile, "error", bind(this._tileOnError, this, done, tile));
          if (this.options.crossOrigin || this.options.crossOrigin === "") {
            tile.crossOrigin = this.options.crossOrigin === true ? "" : this.options.crossOrigin;
          }
          if (typeof this.options.referrerPolicy === "string") {
            tile.referrerPolicy = this.options.referrerPolicy;
          }
          tile.alt = "";
          tile.src = this.getTileUrl(coords);
          return tile;
        },
        // @section Extension methods
        // @uninheritable
        // Layers extending `TileLayer` might reimplement the following method.
        // @method getTileUrl(coords: Object): String
        // Called only internally, returns the URL for a tile given its coordinates.
        // Classes extending `TileLayer` can override this function to provide custom tile URL naming schemes.
        getTileUrl: function(coords) {
          var data = {
            r: Browser.retina ? "@2x" : "",
            s: this._getSubdomain(coords),
            x: coords.x,
            y: coords.y,
            z: this._getZoomForUrl()
          };
          if (this._map && !this._map.options.crs.infinite) {
            var invertedY = this._globalTileRange.max.y - coords.y;
            if (this.options.tms) {
              data["y"] = invertedY;
            }
            data["-y"] = invertedY;
          }
          return template(this._url, extend(data, this.options));
        },
        _tileOnLoad: function(done, tile) {
          if (Browser.ielt9) {
            setTimeout(bind(done, this, null, tile), 0);
          } else {
            done(null, tile);
          }
        },
        _tileOnError: function(done, tile, e) {
          var errorUrl = this.options.errorTileUrl;
          if (errorUrl && tile.getAttribute("src") !== errorUrl) {
            tile.src = errorUrl;
          }
          done(e, tile);
        },
        _onTileRemove: function(e) {
          e.tile.onload = null;
        },
        _getZoomForUrl: function() {
          var zoom2 = this._tileZoom, maxZoom = this.options.maxZoom, zoomReverse = this.options.zoomReverse, zoomOffset = this.options.zoomOffset;
          if (zoomReverse) {
            zoom2 = maxZoom - zoom2;
          }
          return zoom2 + zoomOffset;
        },
        _getSubdomain: function(tilePoint) {
          var index2 = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
          return this.options.subdomains[index2];
        },
        // stops loading all tiles in the background layer
        _abortLoading: function() {
          var i, tile;
          for (i in this._tiles) {
            if (this._tiles[i].coords.z !== this._tileZoom) {
              tile = this._tiles[i].el;
              tile.onload = falseFn;
              tile.onerror = falseFn;
              if (!tile.complete) {
                tile.src = emptyImageUrl;
                var coords = this._tiles[i].coords;
                remove(tile);
                delete this._tiles[i];
                this.fire("tileabort", {
                  tile,
                  coords
                });
              }
            }
          }
        },
        _removeTile: function(key) {
          var tile = this._tiles[key];
          if (!tile) {
            return;
          }
          tile.el.setAttribute("src", emptyImageUrl);
          return GridLayer.prototype._removeTile.call(this, key);
        },
        _tileReady: function(coords, err, tile) {
          if (!this._map || tile && tile.getAttribute("src") === emptyImageUrl) {
            return;
          }
          return GridLayer.prototype._tileReady.call(this, coords, err, tile);
        }
      });
      function tileLayer(url, options) {
        return new TileLayer(url, options);
      }
      var TileLayerWMS = TileLayer.extend({
        // @section
        // @aka TileLayer.WMS options
        // If any custom options not documented here are used, they will be sent to the
        // WMS server as extra parameters in each request URL. This can be useful for
        // [non-standard vendor WMS parameters](https://docs.geoserver.org/stable/en/user/services/wms/vendor.html).
        defaultWmsParams: {
          service: "WMS",
          request: "GetMap",
          // @option layers: String = ''
          // **(required)** Comma-separated list of WMS layers to show.
          layers: "",
          // @option styles: String = ''
          // Comma-separated list of WMS styles.
          styles: "",
          // @option format: String = 'image/jpeg'
          // WMS image format (use `'image/png'` for layers with transparency).
          format: "image/jpeg",
          // @option transparent: Boolean = false
          // If `true`, the WMS service will return images with transparency.
          transparent: false,
          // @option version: String = '1.1.1'
          // Version of the WMS service to use
          version: "1.1.1"
        },
        options: {
          // @option crs: CRS = null
          // Coordinate Reference System to use for the WMS requests, defaults to
          // map CRS. Don't change this if you're not sure what it means.
          crs: null,
          // @option uppercase: Boolean = false
          // If `true`, WMS request parameter keys will be uppercase.
          uppercase: false
        },
        initialize: function(url, options) {
          this._url = url;
          var wmsParams = extend({}, this.defaultWmsParams);
          for (var i in options) {
            if (!(i in this.options)) {
              wmsParams[i] = options[i];
            }
          }
          options = setOptions(this, options);
          var realRetina = options.detectRetina && Browser.retina ? 2 : 1;
          var tileSize = this.getTileSize();
          wmsParams.width = tileSize.x * realRetina;
          wmsParams.height = tileSize.y * realRetina;
          this.wmsParams = wmsParams;
        },
        onAdd: function(map) {
          this._crs = this.options.crs || map.options.crs;
          this._wmsVersion = parseFloat(this.wmsParams.version);
          var projectionKey = this._wmsVersion >= 1.3 ? "crs" : "srs";
          this.wmsParams[projectionKey] = this._crs.code;
          TileLayer.prototype.onAdd.call(this, map);
        },
        getTileUrl: function(coords) {
          var tileBounds = this._tileCoordsToNwSe(coords), crs = this._crs, bounds = toBounds(crs.project(tileBounds[0]), crs.project(tileBounds[1])), min = bounds.min, max = bounds.max, bbox = (this._wmsVersion >= 1.3 && this._crs === EPSG4326 ? [min.y, min.x, max.y, max.x] : [min.x, min.y, max.x, max.y]).join(","), url = TileLayer.prototype.getTileUrl.call(this, coords);
          return url + getParamString(this.wmsParams, url, this.options.uppercase) + (this.options.uppercase ? "&BBOX=" : "&bbox=") + bbox;
        },
        // @method setParams(params: Object, noRedraw?: Boolean): this
        // Merges an object with the new parameters and re-requests tiles on the current screen (unless `noRedraw` was set to true).
        setParams: function(params, noRedraw) {
          extend(this.wmsParams, params);
          if (!noRedraw) {
            this.redraw();
          }
          return this;
        }
      });
      function tileLayerWMS(url, options) {
        return new TileLayerWMS(url, options);
      }
      TileLayer.WMS = TileLayerWMS;
      tileLayer.wms = tileLayerWMS;
      var Renderer = Layer.extend({
        // @section
        // @aka Renderer options
        options: {
          // @option padding: Number = 0.1
          // How much to extend the clip area around the map view (relative to its size)
          // e.g. 0.1 would be 10% of map view in each direction
          padding: 0.1
        },
        initialize: function(options) {
          setOptions(this, options);
          stamp(this);
          this._layers = this._layers || {};
        },
        onAdd: function() {
          if (!this._container) {
            this._initContainer();
            addClass(this._container, "leaflet-zoom-animated");
          }
          this.getPane().appendChild(this._container);
          this._update();
          this.on("update", this._updatePaths, this);
        },
        onRemove: function() {
          this.off("update", this._updatePaths, this);
          this._destroyContainer();
        },
        getEvents: function() {
          var events = {
            viewreset: this._reset,
            zoom: this._onZoom,
            moveend: this._update,
            zoomend: this._onZoomEnd
          };
          if (this._zoomAnimated) {
            events.zoomanim = this._onAnimZoom;
          }
          return events;
        },
        _onAnimZoom: function(ev) {
          this._updateTransform(ev.center, ev.zoom);
        },
        _onZoom: function() {
          this._updateTransform(this._map.getCenter(), this._map.getZoom());
        },
        _updateTransform: function(center, zoom2) {
          var scale2 = this._map.getZoomScale(zoom2, this._zoom), viewHalf = this._map.getSize().multiplyBy(0.5 + this.options.padding), currentCenterPoint = this._map.project(this._center, zoom2), topLeftOffset = viewHalf.multiplyBy(-scale2).add(currentCenterPoint).subtract(this._map._getNewPixelOrigin(center, zoom2));
          if (Browser.any3d) {
            setTransform(this._container, topLeftOffset, scale2);
          } else {
            setPosition(this._container, topLeftOffset);
          }
        },
        _reset: function() {
          this._update();
          this._updateTransform(this._center, this._zoom);
          for (var id in this._layers) {
            this._layers[id]._reset();
          }
        },
        _onZoomEnd: function() {
          for (var id in this._layers) {
            this._layers[id]._project();
          }
        },
        _updatePaths: function() {
          for (var id in this._layers) {
            this._layers[id]._update();
          }
        },
        _update: function() {
          var p = this.options.padding, size = this._map.getSize(), min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();
          this._bounds = new Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());
          this._center = this._map.getCenter();
          this._zoom = this._map.getZoom();
        }
      });
      var Canvas = Renderer.extend({
        // @section
        // @aka Canvas options
        options: {
          // @option tolerance: Number = 0
          // How much to extend the click tolerance around a path/object on the map.
          tolerance: 0
        },
        getEvents: function() {
          var events = Renderer.prototype.getEvents.call(this);
          events.viewprereset = this._onViewPreReset;
          return events;
        },
        _onViewPreReset: function() {
          this._postponeUpdatePaths = true;
        },
        onAdd: function() {
          Renderer.prototype.onAdd.call(this);
          this._draw();
        },
        _initContainer: function() {
          var container = this._container = document.createElement("canvas");
          on(container, "mousemove", this._onMouseMove, this);
          on(container, "click dblclick mousedown mouseup contextmenu", this._onClick, this);
          on(container, "mouseout", this._handleMouseOut, this);
          container["_leaflet_disable_events"] = true;
          this._ctx = container.getContext("2d");
        },
        _destroyContainer: function() {
          cancelAnimFrame(this._redrawRequest);
          delete this._ctx;
          remove(this._container);
          off(this._container);
          delete this._container;
        },
        _updatePaths: function() {
          if (this._postponeUpdatePaths) {
            return;
          }
          var layer;
          this._redrawBounds = null;
          for (var id in this._layers) {
            layer = this._layers[id];
            layer._update();
          }
          this._redraw();
        },
        _update: function() {
          if (this._map._animatingZoom && this._bounds) {
            return;
          }
          Renderer.prototype._update.call(this);
          var b = this._bounds, container = this._container, size = b.getSize(), m = Browser.retina ? 2 : 1;
          setPosition(container, b.min);
          container.width = m * size.x;
          container.height = m * size.y;
          container.style.width = size.x + "px";
          container.style.height = size.y + "px";
          if (Browser.retina) {
            this._ctx.scale(2, 2);
          }
          this._ctx.translate(-b.min.x, -b.min.y);
          this.fire("update");
        },
        _reset: function() {
          Renderer.prototype._reset.call(this);
          if (this._postponeUpdatePaths) {
            this._postponeUpdatePaths = false;
            this._updatePaths();
          }
        },
        _initPath: function(layer) {
          this._updateDashArray(layer);
          this._layers[stamp(layer)] = layer;
          var order = layer._order = {
            layer,
            prev: this._drawLast,
            next: null
          };
          if (this._drawLast) {
            this._drawLast.next = order;
          }
          this._drawLast = order;
          this._drawFirst = this._drawFirst || this._drawLast;
        },
        _addPath: function(layer) {
          this._requestRedraw(layer);
        },
        _removePath: function(layer) {
          var order = layer._order;
          var next = order.next;
          var prev = order.prev;
          if (next) {
            next.prev = prev;
          } else {
            this._drawLast = prev;
          }
          if (prev) {
            prev.next = next;
          } else {
            this._drawFirst = next;
          }
          delete layer._order;
          delete this._layers[stamp(layer)];
          this._requestRedraw(layer);
        },
        _updatePath: function(layer) {
          this._extendRedrawBounds(layer);
          layer._project();
          layer._update();
          this._requestRedraw(layer);
        },
        _updateStyle: function(layer) {
          this._updateDashArray(layer);
          this._requestRedraw(layer);
        },
        _updateDashArray: function(layer) {
          if (typeof layer.options.dashArray === "string") {
            var parts = layer.options.dashArray.split(/[, ]+/), dashArray = [], dashValue, i;
            for (i = 0; i < parts.length; i++) {
              dashValue = Number(parts[i]);
              if (isNaN(dashValue)) {
                return;
              }
              dashArray.push(dashValue);
            }
            layer.options._dashArray = dashArray;
          } else {
            layer.options._dashArray = layer.options.dashArray;
          }
        },
        _requestRedraw: function(layer) {
          if (!this._map) {
            return;
          }
          this._extendRedrawBounds(layer);
          this._redrawRequest = this._redrawRequest || requestAnimFrame(this._redraw, this);
        },
        _extendRedrawBounds: function(layer) {
          if (layer._pxBounds) {
            var padding = (layer.options.weight || 0) + 1;
            this._redrawBounds = this._redrawBounds || new Bounds();
            this._redrawBounds.extend(layer._pxBounds.min.subtract([padding, padding]));
            this._redrawBounds.extend(layer._pxBounds.max.add([padding, padding]));
          }
        },
        _redraw: function() {
          this._redrawRequest = null;
          if (this._redrawBounds) {
            this._redrawBounds.min._floor();
            this._redrawBounds.max._ceil();
          }
          this._clear();
          this._draw();
          this._redrawBounds = null;
        },
        _clear: function() {
          var bounds = this._redrawBounds;
          if (bounds) {
            var size = bounds.getSize();
            this._ctx.clearRect(bounds.min.x, bounds.min.y, size.x, size.y);
          } else {
            this._ctx.save();
            this._ctx.setTransform(1, 0, 0, 1, 0, 0);
            this._ctx.clearRect(0, 0, this._container.width, this._container.height);
            this._ctx.restore();
          }
        },
        _draw: function() {
          var layer, bounds = this._redrawBounds;
          this._ctx.save();
          if (bounds) {
            var size = bounds.getSize();
            this._ctx.beginPath();
            this._ctx.rect(bounds.min.x, bounds.min.y, size.x, size.y);
            this._ctx.clip();
          }
          this._drawing = true;
          for (var order = this._drawFirst; order; order = order.next) {
            layer = order.layer;
            if (!bounds || layer._pxBounds && layer._pxBounds.intersects(bounds)) {
              layer._updatePath();
            }
          }
          this._drawing = false;
          this._ctx.restore();
        },
        _updatePoly: function(layer, closed) {
          if (!this._drawing) {
            return;
          }
          var i, j, len2, p, parts = layer._parts, len = parts.length, ctx = this._ctx;
          if (!len) {
            return;
          }
          ctx.beginPath();
          for (i = 0; i < len; i++) {
            for (j = 0, len2 = parts[i].length; j < len2; j++) {
              p = parts[i][j];
              ctx[j ? "lineTo" : "moveTo"](p.x, p.y);
            }
            if (closed) {
              ctx.closePath();
            }
          }
          this._fillStroke(ctx, layer);
        },
        _updateCircle: function(layer) {
          if (!this._drawing || layer._empty()) {
            return;
          }
          var p = layer._point, ctx = this._ctx, r = Math.max(Math.round(layer._radius), 1), s = (Math.max(Math.round(layer._radiusY), 1) || r) / r;
          if (s !== 1) {
            ctx.save();
            ctx.scale(1, s);
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y / s, r, 0, Math.PI * 2, false);
          if (s !== 1) {
            ctx.restore();
          }
          this._fillStroke(ctx, layer);
        },
        _fillStroke: function(ctx, layer) {
          var options = layer.options;
          if (options.fill) {
            ctx.globalAlpha = options.fillOpacity;
            ctx.fillStyle = options.fillColor || options.color;
            ctx.fill(options.fillRule || "evenodd");
          }
          if (options.stroke && options.weight !== 0) {
            if (ctx.setLineDash) {
              ctx.setLineDash(layer.options && layer.options._dashArray || []);
            }
            ctx.globalAlpha = options.opacity;
            ctx.lineWidth = options.weight;
            ctx.strokeStyle = options.color;
            ctx.lineCap = options.lineCap;
            ctx.lineJoin = options.lineJoin;
            ctx.stroke();
          }
        },
        // Canvas obviously doesn't have mouse events for individual drawn objects,
        // so we emulate that by calculating what's under the mouse on mousemove/click manually
        _onClick: function(e) {
          var point = this._map.mouseEventToLayerPoint(e), layer, clickedLayer;
          for (var order = this._drawFirst; order; order = order.next) {
            layer = order.layer;
            if (layer.options.interactive && layer._containsPoint(point)) {
              if (!(e.type === "click" || e.type === "preclick") || !this._map._draggableMoved(layer)) {
                clickedLayer = layer;
              }
            }
          }
          this._fireEvent(clickedLayer ? [clickedLayer] : false, e);
        },
        _onMouseMove: function(e) {
          if (!this._map || this._map.dragging.moving() || this._map._animatingZoom) {
            return;
          }
          var point = this._map.mouseEventToLayerPoint(e);
          this._handleMouseHover(e, point);
        },
        _handleMouseOut: function(e) {
          var layer = this._hoveredLayer;
          if (layer) {
            removeClass(this._container, "leaflet-interactive");
            this._fireEvent([layer], e, "mouseout");
            this._hoveredLayer = null;
            this._mouseHoverThrottled = false;
          }
        },
        _handleMouseHover: function(e, point) {
          if (this._mouseHoverThrottled) {
            return;
          }
          var layer, candidateHoveredLayer;
          for (var order = this._drawFirst; order; order = order.next) {
            layer = order.layer;
            if (layer.options.interactive && layer._containsPoint(point)) {
              candidateHoveredLayer = layer;
            }
          }
          if (candidateHoveredLayer !== this._hoveredLayer) {
            this._handleMouseOut(e);
            if (candidateHoveredLayer) {
              addClass(this._container, "leaflet-interactive");
              this._fireEvent([candidateHoveredLayer], e, "mouseover");
              this._hoveredLayer = candidateHoveredLayer;
            }
          }
          this._fireEvent(this._hoveredLayer ? [this._hoveredLayer] : false, e);
          this._mouseHoverThrottled = true;
          setTimeout(bind(function() {
            this._mouseHoverThrottled = false;
          }, this), 32);
        },
        _fireEvent: function(layers2, e, type) {
          this._map._fireDOMEvent(e, type || e.type, layers2);
        },
        _bringToFront: function(layer) {
          var order = layer._order;
          if (!order) {
            return;
          }
          var next = order.next;
          var prev = order.prev;
          if (next) {
            next.prev = prev;
          } else {
            return;
          }
          if (prev) {
            prev.next = next;
          } else if (next) {
            this._drawFirst = next;
          }
          order.prev = this._drawLast;
          this._drawLast.next = order;
          order.next = null;
          this._drawLast = order;
          this._requestRedraw(layer);
        },
        _bringToBack: function(layer) {
          var order = layer._order;
          if (!order) {
            return;
          }
          var next = order.next;
          var prev = order.prev;
          if (prev) {
            prev.next = next;
          } else {
            return;
          }
          if (next) {
            next.prev = prev;
          } else if (prev) {
            this._drawLast = prev;
          }
          order.prev = null;
          order.next = this._drawFirst;
          this._drawFirst.prev = order;
          this._drawFirst = order;
          this._requestRedraw(layer);
        }
      });
      function canvas(options) {
        return Browser.canvas ? new Canvas(options) : null;
      }
      var vmlCreate = function() {
        try {
          document.namespaces.add("lvml", "urn:schemas-microsoft-com:vml");
          return function(name) {
            return document.createElement("<lvml:" + name + ' class="lvml">');
          };
        } catch (e) {
        }
        return function(name) {
          return document.createElement("<" + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');
        };
      }();
      var vmlMixin = {
        _initContainer: function() {
          this._container = create$1("div", "leaflet-vml-container");
        },
        _update: function() {
          if (this._map._animatingZoom) {
            return;
          }
          Renderer.prototype._update.call(this);
          this.fire("update");
        },
        _initPath: function(layer) {
          var container = layer._container = vmlCreate("shape");
          addClass(container, "leaflet-vml-shape " + (this.options.className || ""));
          container.coordsize = "1 1";
          layer._path = vmlCreate("path");
          container.appendChild(layer._path);
          this._updateStyle(layer);
          this._layers[stamp(layer)] = layer;
        },
        _addPath: function(layer) {
          var container = layer._container;
          this._container.appendChild(container);
          if (layer.options.interactive) {
            layer.addInteractiveTarget(container);
          }
        },
        _removePath: function(layer) {
          var container = layer._container;
          remove(container);
          layer.removeInteractiveTarget(container);
          delete this._layers[stamp(layer)];
        },
        _updateStyle: function(layer) {
          var stroke = layer._stroke, fill = layer._fill, options = layer.options, container = layer._container;
          container.stroked = !!options.stroke;
          container.filled = !!options.fill;
          if (options.stroke) {
            if (!stroke) {
              stroke = layer._stroke = vmlCreate("stroke");
            }
            container.appendChild(stroke);
            stroke.weight = options.weight + "px";
            stroke.color = options.color;
            stroke.opacity = options.opacity;
            if (options.dashArray) {
              stroke.dashStyle = isArray2(options.dashArray) ? options.dashArray.join(" ") : options.dashArray.replace(/( *, *)/g, " ");
            } else {
              stroke.dashStyle = "";
            }
            stroke.endcap = options.lineCap.replace("butt", "flat");
            stroke.joinstyle = options.lineJoin;
          } else if (stroke) {
            container.removeChild(stroke);
            layer._stroke = null;
          }
          if (options.fill) {
            if (!fill) {
              fill = layer._fill = vmlCreate("fill");
            }
            container.appendChild(fill);
            fill.color = options.fillColor || options.color;
            fill.opacity = options.fillOpacity;
          } else if (fill) {
            container.removeChild(fill);
            layer._fill = null;
          }
        },
        _updateCircle: function(layer) {
          var p = layer._point.round(), r = Math.round(layer._radius), r2 = Math.round(layer._radiusY || r);
          this._setPath(layer, layer._empty() ? "M0 0" : "AL " + p.x + "," + p.y + " " + r + "," + r2 + " 0," + 65535 * 360);
        },
        _setPath: function(layer, path) {
          layer._path.v = path;
        },
        _bringToFront: function(layer) {
          toFront(layer._container);
        },
        _bringToBack: function(layer) {
          toBack(layer._container);
        }
      };
      var create = Browser.vml ? vmlCreate : svgCreate;
      var SVG = Renderer.extend({
        _initContainer: function() {
          this._container = create("svg");
          this._container.setAttribute("pointer-events", "none");
          this._rootGroup = create("g");
          this._container.appendChild(this._rootGroup);
        },
        _destroyContainer: function() {
          remove(this._container);
          off(this._container);
          delete this._container;
          delete this._rootGroup;
          delete this._svgSize;
        },
        _update: function() {
          if (this._map._animatingZoom && this._bounds) {
            return;
          }
          Renderer.prototype._update.call(this);
          var b = this._bounds, size = b.getSize(), container = this._container;
          if (!this._svgSize || !this._svgSize.equals(size)) {
            this._svgSize = size;
            container.setAttribute("width", size.x);
            container.setAttribute("height", size.y);
          }
          setPosition(container, b.min);
          container.setAttribute("viewBox", [b.min.x, b.min.y, size.x, size.y].join(" "));
          this.fire("update");
        },
        // methods below are called by vector layers implementations
        _initPath: function(layer) {
          var path = layer._path = create("path");
          if (layer.options.className) {
            addClass(path, layer.options.className);
          }
          if (layer.options.interactive) {
            addClass(path, "leaflet-interactive");
          }
          this._updateStyle(layer);
          this._layers[stamp(layer)] = layer;
        },
        _addPath: function(layer) {
          if (!this._rootGroup) {
            this._initContainer();
          }
          this._rootGroup.appendChild(layer._path);
          layer.addInteractiveTarget(layer._path);
        },
        _removePath: function(layer) {
          remove(layer._path);
          layer.removeInteractiveTarget(layer._path);
          delete this._layers[stamp(layer)];
        },
        _updatePath: function(layer) {
          layer._project();
          layer._update();
        },
        _updateStyle: function(layer) {
          var path = layer._path, options = layer.options;
          if (!path) {
            return;
          }
          if (options.stroke) {
            path.setAttribute("stroke", options.color);
            path.setAttribute("stroke-opacity", options.opacity);
            path.setAttribute("stroke-width", options.weight);
            path.setAttribute("stroke-linecap", options.lineCap);
            path.setAttribute("stroke-linejoin", options.lineJoin);
            if (options.dashArray) {
              path.setAttribute("stroke-dasharray", options.dashArray);
            } else {
              path.removeAttribute("stroke-dasharray");
            }
            if (options.dashOffset) {
              path.setAttribute("stroke-dashoffset", options.dashOffset);
            } else {
              path.removeAttribute("stroke-dashoffset");
            }
          } else {
            path.setAttribute("stroke", "none");
          }
          if (options.fill) {
            path.setAttribute("fill", options.fillColor || options.color);
            path.setAttribute("fill-opacity", options.fillOpacity);
            path.setAttribute("fill-rule", options.fillRule || "evenodd");
          } else {
            path.setAttribute("fill", "none");
          }
        },
        _updatePoly: function(layer, closed) {
          this._setPath(layer, pointsToPath(layer._parts, closed));
        },
        _updateCircle: function(layer) {
          var p = layer._point, r = Math.max(Math.round(layer._radius), 1), r2 = Math.max(Math.round(layer._radiusY), 1) || r, arc = "a" + r + "," + r2 + " 0 1,0 ";
          var d = layer._empty() ? "M0 0" : "M" + (p.x - r) + "," + p.y + arc + r * 2 + ",0 " + arc + -r * 2 + ",0 ";
          this._setPath(layer, d);
        },
        _setPath: function(layer, path) {
          layer._path.setAttribute("d", path);
        },
        // SVG does not have the concept of zIndex so we resort to changing the DOM order of elements
        _bringToFront: function(layer) {
          toFront(layer._path);
        },
        _bringToBack: function(layer) {
          toBack(layer._path);
        }
      });
      if (Browser.vml) {
        SVG.include(vmlMixin);
      }
      function svg(options) {
        return Browser.svg || Browser.vml ? new SVG(options) : null;
      }
      Map2.include({
        // @namespace Map; @method getRenderer(layer: Path): Renderer
        // Returns the instance of `Renderer` that should be used to render the given
        // `Path`. It will ensure that the `renderer` options of the map and paths
        // are respected, and that the renderers do exist on the map.
        getRenderer: function(layer) {
          var renderer = layer.options.renderer || this._getPaneRenderer(layer.options.pane) || this.options.renderer || this._renderer;
          if (!renderer) {
            renderer = this._renderer = this._createRenderer();
          }
          if (!this.hasLayer(renderer)) {
            this.addLayer(renderer);
          }
          return renderer;
        },
        _getPaneRenderer: function(name) {
          if (name === "overlayPane" || name === void 0) {
            return false;
          }
          var renderer = this._paneRenderers[name];
          if (renderer === void 0) {
            renderer = this._createRenderer({ pane: name });
            this._paneRenderers[name] = renderer;
          }
          return renderer;
        },
        _createRenderer: function(options) {
          return this.options.preferCanvas && canvas(options) || svg(options);
        }
      });
      var Rectangle = Polygon.extend({
        initialize: function(latLngBounds, options) {
          Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options);
        },
        // @method setBounds(latLngBounds: LatLngBounds): this
        // Redraws the rectangle with the passed bounds.
        setBounds: function(latLngBounds) {
          return this.setLatLngs(this._boundsToLatLngs(latLngBounds));
        },
        _boundsToLatLngs: function(latLngBounds) {
          latLngBounds = toLatLngBounds(latLngBounds);
          return [
            latLngBounds.getSouthWest(),
            latLngBounds.getNorthWest(),
            latLngBounds.getNorthEast(),
            latLngBounds.getSouthEast()
          ];
        }
      });
      function rectangle(latLngBounds, options) {
        return new Rectangle(latLngBounds, options);
      }
      SVG.create = create;
      SVG.pointsToPath = pointsToPath;
      GeoJSON.geometryToLayer = geometryToLayer;
      GeoJSON.coordsToLatLng = coordsToLatLng;
      GeoJSON.coordsToLatLngs = coordsToLatLngs;
      GeoJSON.latLngToCoords = latLngToCoords;
      GeoJSON.latLngsToCoords = latLngsToCoords;
      GeoJSON.getFeature = getFeature;
      GeoJSON.asFeature = asFeature;
      Map2.mergeOptions({
        // @option boxZoom: Boolean = true
        // Whether the map can be zoomed to a rectangular area specified by
        // dragging the mouse while pressing the shift key.
        boxZoom: true
      });
      var BoxZoom = Handler.extend({
        initialize: function(map) {
          this._map = map;
          this._container = map._container;
          this._pane = map._panes.overlayPane;
          this._resetStateTimeout = 0;
          map.on("unload", this._destroy, this);
        },
        addHooks: function() {
          on(this._container, "mousedown", this._onMouseDown, this);
        },
        removeHooks: function() {
          off(this._container, "mousedown", this._onMouseDown, this);
        },
        moved: function() {
          return this._moved;
        },
        _destroy: function() {
          remove(this._pane);
          delete this._pane;
        },
        _resetState: function() {
          this._resetStateTimeout = 0;
          this._moved = false;
        },
        _clearDeferredResetState: function() {
          if (this._resetStateTimeout !== 0) {
            clearTimeout(this._resetStateTimeout);
            this._resetStateTimeout = 0;
          }
        },
        _onMouseDown: function(e) {
          if (!e.shiftKey || e.which !== 1 && e.button !== 1) {
            return false;
          }
          this._clearDeferredResetState();
          this._resetState();
          disableTextSelection();
          disableImageDrag();
          this._startPoint = this._map.mouseEventToContainerPoint(e);
          on(document, {
            contextmenu: stop,
            mousemove: this._onMouseMove,
            mouseup: this._onMouseUp,
            keydown: this._onKeyDown
          }, this);
        },
        _onMouseMove: function(e) {
          if (!this._moved) {
            this._moved = true;
            this._box = create$1("div", "leaflet-zoom-box", this._container);
            addClass(this._container, "leaflet-crosshair");
            this._map.fire("boxzoomstart");
          }
          this._point = this._map.mouseEventToContainerPoint(e);
          var bounds = new Bounds(this._point, this._startPoint), size = bounds.getSize();
          setPosition(this._box, bounds.min);
          this._box.style.width = size.x + "px";
          this._box.style.height = size.y + "px";
        },
        _finish: function() {
          if (this._moved) {
            remove(this._box);
            removeClass(this._container, "leaflet-crosshair");
          }
          enableTextSelection();
          enableImageDrag();
          off(document, {
            contextmenu: stop,
            mousemove: this._onMouseMove,
            mouseup: this._onMouseUp,
            keydown: this._onKeyDown
          }, this);
        },
        _onMouseUp: function(e) {
          if (e.which !== 1 && e.button !== 1) {
            return;
          }
          this._finish();
          if (!this._moved) {
            return;
          }
          this._clearDeferredResetState();
          this._resetStateTimeout = setTimeout(bind(this._resetState, this), 0);
          var bounds = new LatLngBounds(
            this._map.containerPointToLatLng(this._startPoint),
            this._map.containerPointToLatLng(this._point)
          );
          this._map.fitBounds(bounds).fire("boxzoomend", { boxZoomBounds: bounds });
        },
        _onKeyDown: function(e) {
          if (e.keyCode === 27) {
            this._finish();
            this._clearDeferredResetState();
            this._resetState();
          }
        }
      });
      Map2.addInitHook("addHandler", "boxZoom", BoxZoom);
      Map2.mergeOptions({
        // @option doubleClickZoom: Boolean|String = true
        // Whether the map can be zoomed in by double clicking on it and
        // zoomed out by double clicking while holding shift. If passed
        // `'center'`, double-click zoom will zoom to the center of the
        //  view regardless of where the mouse was.
        doubleClickZoom: true
      });
      var DoubleClickZoom = Handler.extend({
        addHooks: function() {
          this._map.on("dblclick", this._onDoubleClick, this);
        },
        removeHooks: function() {
          this._map.off("dblclick", this._onDoubleClick, this);
        },
        _onDoubleClick: function(e) {
          var map = this._map, oldZoom = map.getZoom(), delta = map.options.zoomDelta, zoom2 = e.originalEvent.shiftKey ? oldZoom - delta : oldZoom + delta;
          if (map.options.doubleClickZoom === "center") {
            map.setZoom(zoom2);
          } else {
            map.setZoomAround(e.containerPoint, zoom2);
          }
        }
      });
      Map2.addInitHook("addHandler", "doubleClickZoom", DoubleClickZoom);
      Map2.mergeOptions({
        // @option dragging: Boolean = true
        // Whether the map is draggable with mouse/touch or not.
        dragging: true,
        // @section Panning Inertia Options
        // @option inertia: Boolean = *
        // If enabled, panning of the map will have an inertia effect where
        // the map builds momentum while dragging and continues moving in
        // the same direction for some time. Feels especially nice on touch
        // devices. Enabled by default.
        inertia: true,
        // @option inertiaDeceleration: Number = 3000
        // The rate with which the inertial movement slows down, in pixels/second².
        inertiaDeceleration: 3400,
        // px/s^2
        // @option inertiaMaxSpeed: Number = Infinity
        // Max speed of the inertial movement, in pixels/second.
        inertiaMaxSpeed: Infinity,
        // px/s
        // @option easeLinearity: Number = 0.2
        easeLinearity: 0.2,
        // TODO refactor, move to CRS
        // @option worldCopyJump: Boolean = false
        // With this option enabled, the map tracks when you pan to another "copy"
        // of the world and seamlessly jumps to the original one so that all overlays
        // like markers and vector layers are still visible.
        worldCopyJump: false,
        // @option maxBoundsViscosity: Number = 0.0
        // If `maxBounds` is set, this option will control how solid the bounds
        // are when dragging the map around. The default value of `0.0` allows the
        // user to drag outside the bounds at normal speed, higher values will
        // slow down map dragging outside bounds, and `1.0` makes the bounds fully
        // solid, preventing the user from dragging outside the bounds.
        maxBoundsViscosity: 0
      });
      var Drag = Handler.extend({
        addHooks: function() {
          if (!this._draggable) {
            var map = this._map;
            this._draggable = new Draggable(map._mapPane, map._container);
            this._draggable.on({
              dragstart: this._onDragStart,
              drag: this._onDrag,
              dragend: this._onDragEnd
            }, this);
            this._draggable.on("predrag", this._onPreDragLimit, this);
            if (map.options.worldCopyJump) {
              this._draggable.on("predrag", this._onPreDragWrap, this);
              map.on("zoomend", this._onZoomEnd, this);
              map.whenReady(this._onZoomEnd, this);
            }
          }
          addClass(this._map._container, "leaflet-grab leaflet-touch-drag");
          this._draggable.enable();
          this._positions = [];
          this._times = [];
        },
        removeHooks: function() {
          removeClass(this._map._container, "leaflet-grab");
          removeClass(this._map._container, "leaflet-touch-drag");
          this._draggable.disable();
        },
        moved: function() {
          return this._draggable && this._draggable._moved;
        },
        moving: function() {
          return this._draggable && this._draggable._moving;
        },
        _onDragStart: function() {
          var map = this._map;
          map._stop();
          if (this._map.options.maxBounds && this._map.options.maxBoundsViscosity) {
            var bounds = toLatLngBounds(this._map.options.maxBounds);
            this._offsetLimit = toBounds(
              this._map.latLngToContainerPoint(bounds.getNorthWest()).multiplyBy(-1),
              this._map.latLngToContainerPoint(bounds.getSouthEast()).multiplyBy(-1).add(this._map.getSize())
            );
            this._viscosity = Math.min(1, Math.max(0, this._map.options.maxBoundsViscosity));
          } else {
            this._offsetLimit = null;
          }
          map.fire("movestart").fire("dragstart");
          if (map.options.inertia) {
            this._positions = [];
            this._times = [];
          }
        },
        _onDrag: function(e) {
          if (this._map.options.inertia) {
            var time = this._lastTime = +/* @__PURE__ */ new Date(), pos = this._lastPos = this._draggable._absPos || this._draggable._newPos;
            this._positions.push(pos);
            this._times.push(time);
            this._prunePositions(time);
          }
          this._map.fire("move", e).fire("drag", e);
        },
        _prunePositions: function(time) {
          while (this._positions.length > 1 && time - this._times[0] > 50) {
            this._positions.shift();
            this._times.shift();
          }
        },
        _onZoomEnd: function() {
          var pxCenter = this._map.getSize().divideBy(2), pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);
          this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
          this._worldWidth = this._map.getPixelWorldBounds().getSize().x;
        },
        _viscousLimit: function(value, threshold) {
          return value - (value - threshold) * this._viscosity;
        },
        _onPreDragLimit: function() {
          if (!this._viscosity || !this._offsetLimit) {
            return;
          }
          var offset = this._draggable._newPos.subtract(this._draggable._startPos);
          var limit = this._offsetLimit;
          if (offset.x < limit.min.x) {
            offset.x = this._viscousLimit(offset.x, limit.min.x);
          }
          if (offset.y < limit.min.y) {
            offset.y = this._viscousLimit(offset.y, limit.min.y);
          }
          if (offset.x > limit.max.x) {
            offset.x = this._viscousLimit(offset.x, limit.max.x);
          }
          if (offset.y > limit.max.y) {
            offset.y = this._viscousLimit(offset.y, limit.max.y);
          }
          this._draggable._newPos = this._draggable._startPos.add(offset);
        },
        _onPreDragWrap: function() {
          var worldWidth = this._worldWidth, halfWidth = Math.round(worldWidth / 2), dx = this._initialWorldOffset, x = this._draggable._newPos.x, newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx, newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx, newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;
          this._draggable._absPos = this._draggable._newPos.clone();
          this._draggable._newPos.x = newX;
        },
        _onDragEnd: function(e) {
          var map = this._map, options = map.options, noInertia = !options.inertia || e.noInertia || this._times.length < 2;
          map.fire("dragend", e);
          if (noInertia) {
            map.fire("moveend");
          } else {
            this._prunePositions(+/* @__PURE__ */ new Date());
            var direction = this._lastPos.subtract(this._positions[0]), duration = (this._lastTime - this._times[0]) / 1e3, ease = options.easeLinearity, speedVector = direction.multiplyBy(ease / duration), speed = speedVector.distanceTo([0, 0]), limitedSpeed = Math.min(options.inertiaMaxSpeed, speed), limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed), decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease), offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();
            if (!offset.x && !offset.y) {
              map.fire("moveend");
            } else {
              offset = map._limitOffset(offset, map.options.maxBounds);
              requestAnimFrame(function() {
                map.panBy(offset, {
                  duration: decelerationDuration,
                  easeLinearity: ease,
                  noMoveStart: true,
                  animate: true
                });
              });
            }
          }
        }
      });
      Map2.addInitHook("addHandler", "dragging", Drag);
      Map2.mergeOptions({
        // @option keyboard: Boolean = true
        // Makes the map focusable and allows users to navigate the map with keyboard
        // arrows and `+`/`-` keys.
        keyboard: true,
        // @option keyboardPanDelta: Number = 80
        // Amount of pixels to pan when pressing an arrow key.
        keyboardPanDelta: 80
      });
      var Keyboard = Handler.extend({
        keyCodes: {
          left: [37],
          right: [39],
          down: [40],
          up: [38],
          zoomIn: [187, 107, 61, 171],
          zoomOut: [189, 109, 54, 173]
        },
        initialize: function(map) {
          this._map = map;
          this._setPanDelta(map.options.keyboardPanDelta);
          this._setZoomDelta(map.options.zoomDelta);
        },
        addHooks: function() {
          var container = this._map._container;
          if (container.tabIndex <= 0) {
            container.tabIndex = "0";
          }
          on(container, {
            focus: this._onFocus,
            blur: this._onBlur,
            mousedown: this._onMouseDown
          }, this);
          this._map.on({
            focus: this._addHooks,
            blur: this._removeHooks
          }, this);
        },
        removeHooks: function() {
          this._removeHooks();
          off(this._map._container, {
            focus: this._onFocus,
            blur: this._onBlur,
            mousedown: this._onMouseDown
          }, this);
          this._map.off({
            focus: this._addHooks,
            blur: this._removeHooks
          }, this);
        },
        _onMouseDown: function() {
          if (this._focused) {
            return;
          }
          var body = document.body, docEl = document.documentElement, top = body.scrollTop || docEl.scrollTop, left = body.scrollLeft || docEl.scrollLeft;
          this._map._container.focus();
          window.scrollTo(left, top);
        },
        _onFocus: function() {
          this._focused = true;
          this._map.fire("focus");
        },
        _onBlur: function() {
          this._focused = false;
          this._map.fire("blur");
        },
        _setPanDelta: function(panDelta) {
          var keys = this._panKeys = {}, codes = this.keyCodes, i, len;
          for (i = 0, len = codes.left.length; i < len; i++) {
            keys[codes.left[i]] = [-1 * panDelta, 0];
          }
          for (i = 0, len = codes.right.length; i < len; i++) {
            keys[codes.right[i]] = [panDelta, 0];
          }
          for (i = 0, len = codes.down.length; i < len; i++) {
            keys[codes.down[i]] = [0, panDelta];
          }
          for (i = 0, len = codes.up.length; i < len; i++) {
            keys[codes.up[i]] = [0, -1 * panDelta];
          }
        },
        _setZoomDelta: function(zoomDelta) {
          var keys = this._zoomKeys = {}, codes = this.keyCodes, i, len;
          for (i = 0, len = codes.zoomIn.length; i < len; i++) {
            keys[codes.zoomIn[i]] = zoomDelta;
          }
          for (i = 0, len = codes.zoomOut.length; i < len; i++) {
            keys[codes.zoomOut[i]] = -zoomDelta;
          }
        },
        _addHooks: function() {
          on(document, "keydown", this._onKeyDown, this);
        },
        _removeHooks: function() {
          off(document, "keydown", this._onKeyDown, this);
        },
        _onKeyDown: function(e) {
          if (e.altKey || e.ctrlKey || e.metaKey) {
            return;
          }
          var key = e.keyCode, map = this._map, offset;
          if (key in this._panKeys) {
            if (!map._panAnim || !map._panAnim._inProgress) {
              offset = this._panKeys[key];
              if (e.shiftKey) {
                offset = toPoint(offset).multiplyBy(3);
              }
              if (map.options.maxBounds) {
                offset = map._limitOffset(toPoint(offset), map.options.maxBounds);
              }
              if (map.options.worldCopyJump) {
                var newLatLng = map.wrapLatLng(map.unproject(map.project(map.getCenter()).add(offset)));
                map.panTo(newLatLng);
              } else {
                map.panBy(offset);
              }
            }
          } else if (key in this._zoomKeys) {
            map.setZoom(map.getZoom() + (e.shiftKey ? 3 : 1) * this._zoomKeys[key]);
          } else if (key === 27 && map._popup && map._popup.options.closeOnEscapeKey) {
            map.closePopup();
          } else {
            return;
          }
          stop(e);
        }
      });
      Map2.addInitHook("addHandler", "keyboard", Keyboard);
      Map2.mergeOptions({
        // @section Mouse wheel options
        // @option scrollWheelZoom: Boolean|String = true
        // Whether the map can be zoomed by using the mouse wheel. If passed `'center'`,
        // it will zoom to the center of the view regardless of where the mouse was.
        scrollWheelZoom: true,
        // @option wheelDebounceTime: Number = 40
        // Limits the rate at which a wheel can fire (in milliseconds). By default
        // user can't zoom via wheel more often than once per 40 ms.
        wheelDebounceTime: 40,
        // @option wheelPxPerZoomLevel: Number = 60
        // How many scroll pixels (as reported by [L.DomEvent.getWheelDelta](#domevent-getwheeldelta))
        // mean a change of one full zoom level. Smaller values will make wheel-zooming
        // faster (and vice versa).
        wheelPxPerZoomLevel: 60
      });
      var ScrollWheelZoom = Handler.extend({
        addHooks: function() {
          on(this._map._container, "wheel", this._onWheelScroll, this);
          this._delta = 0;
        },
        removeHooks: function() {
          off(this._map._container, "wheel", this._onWheelScroll, this);
        },
        _onWheelScroll: function(e) {
          var delta = getWheelDelta(e);
          var debounce2 = this._map.options.wheelDebounceTime;
          this._delta += delta;
          this._lastMousePos = this._map.mouseEventToContainerPoint(e);
          if (!this._startTime) {
            this._startTime = +/* @__PURE__ */ new Date();
          }
          var left = Math.max(debounce2 - (+/* @__PURE__ */ new Date() - this._startTime), 0);
          clearTimeout(this._timer);
          this._timer = setTimeout(bind(this._performZoom, this), left);
          stop(e);
        },
        _performZoom: function() {
          var map = this._map, zoom2 = map.getZoom(), snap = this._map.options.zoomSnap || 0;
          map._stop();
          var d2 = this._delta / (this._map.options.wheelPxPerZoomLevel * 4), d3 = 4 * Math.log(2 / (1 + Math.exp(-Math.abs(d2)))) / Math.LN2, d4 = snap ? Math.ceil(d3 / snap) * snap : d3, delta = map._limitZoom(zoom2 + (this._delta > 0 ? d4 : -d4)) - zoom2;
          this._delta = 0;
          this._startTime = null;
          if (!delta) {
            return;
          }
          if (map.options.scrollWheelZoom === "center") {
            map.setZoom(zoom2 + delta);
          } else {
            map.setZoomAround(this._lastMousePos, zoom2 + delta);
          }
        }
      });
      Map2.addInitHook("addHandler", "scrollWheelZoom", ScrollWheelZoom);
      var tapHoldDelay = 600;
      Map2.mergeOptions({
        // @section Touch interaction options
        // @option tapHold: Boolean
        // Enables simulation of `contextmenu` event, default is `true` for mobile Safari.
        tapHold: Browser.touchNative && Browser.safari && Browser.mobile,
        // @option tapTolerance: Number = 15
        // The max number of pixels a user can shift his finger during touch
        // for it to be considered a valid tap.
        tapTolerance: 15
      });
      var TapHold = Handler.extend({
        addHooks: function() {
          on(this._map._container, "touchstart", this._onDown, this);
        },
        removeHooks: function() {
          off(this._map._container, "touchstart", this._onDown, this);
        },
        _onDown: function(e) {
          clearTimeout(this._holdTimeout);
          if (e.touches.length !== 1) {
            return;
          }
          var first = e.touches[0];
          this._startPos = this._newPos = new Point(first.clientX, first.clientY);
          this._holdTimeout = setTimeout(bind(function() {
            this._cancel();
            if (!this._isTapValid()) {
              return;
            }
            on(document, "touchend", preventDefault);
            on(document, "touchend touchcancel", this._cancelClickPrevent);
            this._simulateEvent("contextmenu", first);
          }, this), tapHoldDelay);
          on(document, "touchend touchcancel contextmenu", this._cancel, this);
          on(document, "touchmove", this._onMove, this);
        },
        _cancelClickPrevent: function cancelClickPrevent() {
          off(document, "touchend", preventDefault);
          off(document, "touchend touchcancel", cancelClickPrevent);
        },
        _cancel: function() {
          clearTimeout(this._holdTimeout);
          off(document, "touchend touchcancel contextmenu", this._cancel, this);
          off(document, "touchmove", this._onMove, this);
        },
        _onMove: function(e) {
          var first = e.touches[0];
          this._newPos = new Point(first.clientX, first.clientY);
        },
        _isTapValid: function() {
          return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
        },
        _simulateEvent: function(type, e) {
          var simulatedEvent = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            // detail: 1,
            screenX: e.screenX,
            screenY: e.screenY,
            clientX: e.clientX,
            clientY: e.clientY
            // button: 2,
            // buttons: 2
          });
          simulatedEvent._simulated = true;
          e.target.dispatchEvent(simulatedEvent);
        }
      });
      Map2.addInitHook("addHandler", "tapHold", TapHold);
      Map2.mergeOptions({
        // @section Touch interaction options
        // @option touchZoom: Boolean|String = *
        // Whether the map can be zoomed by touch-dragging with two fingers. If
        // passed `'center'`, it will zoom to the center of the view regardless of
        // where the touch events (fingers) were. Enabled for touch-capable web
        // browsers.
        touchZoom: Browser.touch,
        // @option bounceAtZoomLimits: Boolean = true
        // Set it to false if you don't want the map to zoom beyond min/max zoom
        // and then bounce back when pinch-zooming.
        bounceAtZoomLimits: true
      });
      var TouchZoom = Handler.extend({
        addHooks: function() {
          addClass(this._map._container, "leaflet-touch-zoom");
          on(this._map._container, "touchstart", this._onTouchStart, this);
        },
        removeHooks: function() {
          removeClass(this._map._container, "leaflet-touch-zoom");
          off(this._map._container, "touchstart", this._onTouchStart, this);
        },
        _onTouchStart: function(e) {
          var map = this._map;
          if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) {
            return;
          }
          var p1 = map.mouseEventToContainerPoint(e.touches[0]), p2 = map.mouseEventToContainerPoint(e.touches[1]);
          this._centerPoint = map.getSize()._divideBy(2);
          this._startLatLng = map.containerPointToLatLng(this._centerPoint);
          if (map.options.touchZoom !== "center") {
            this._pinchStartLatLng = map.containerPointToLatLng(p1.add(p2)._divideBy(2));
          }
          this._startDist = p1.distanceTo(p2);
          this._startZoom = map.getZoom();
          this._moved = false;
          this._zooming = true;
          map._stop();
          on(document, "touchmove", this._onTouchMove, this);
          on(document, "touchend touchcancel", this._onTouchEnd, this);
          preventDefault(e);
        },
        _onTouchMove: function(e) {
          if (!e.touches || e.touches.length !== 2 || !this._zooming) {
            return;
          }
          var map = this._map, p1 = map.mouseEventToContainerPoint(e.touches[0]), p2 = map.mouseEventToContainerPoint(e.touches[1]), scale2 = p1.distanceTo(p2) / this._startDist;
          this._zoom = map.getScaleZoom(scale2, this._startZoom);
          if (!map.options.bounceAtZoomLimits && (this._zoom < map.getMinZoom() && scale2 < 1 || this._zoom > map.getMaxZoom() && scale2 > 1)) {
            this._zoom = map._limitZoom(this._zoom);
          }
          if (map.options.touchZoom === "center") {
            this._center = this._startLatLng;
            if (scale2 === 1) {
              return;
            }
          } else {
            var delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);
            if (scale2 === 1 && delta.x === 0 && delta.y === 0) {
              return;
            }
            this._center = map.unproject(map.project(this._pinchStartLatLng, this._zoom).subtract(delta), this._zoom);
          }
          if (!this._moved) {
            map._moveStart(true, false);
            this._moved = true;
          }
          cancelAnimFrame(this._animRequest);
          var moveFn = bind(map._move, map, this._center, this._zoom, { pinch: true, round: false }, void 0);
          this._animRequest = requestAnimFrame(moveFn, this, true);
          preventDefault(e);
        },
        _onTouchEnd: function() {
          if (!this._moved || !this._zooming) {
            this._zooming = false;
            return;
          }
          this._zooming = false;
          cancelAnimFrame(this._animRequest);
          off(document, "touchmove", this._onTouchMove, this);
          off(document, "touchend touchcancel", this._onTouchEnd, this);
          if (this._map.options.zoomAnimation) {
            this._map._animateZoom(this._center, this._map._limitZoom(this._zoom), true, this._map.options.zoomSnap);
          } else {
            this._map._resetView(this._center, this._map._limitZoom(this._zoom));
          }
        }
      });
      Map2.addInitHook("addHandler", "touchZoom", TouchZoom);
      Map2.BoxZoom = BoxZoom;
      Map2.DoubleClickZoom = DoubleClickZoom;
      Map2.Drag = Drag;
      Map2.Keyboard = Keyboard;
      Map2.ScrollWheelZoom = ScrollWheelZoom;
      Map2.TapHold = TapHold;
      Map2.TouchZoom = TouchZoom;
      exports2.Bounds = Bounds;
      exports2.Browser = Browser;
      exports2.CRS = CRS;
      exports2.Canvas = Canvas;
      exports2.Circle = Circle;
      exports2.CircleMarker = CircleMarker;
      exports2.Class = Class;
      exports2.Control = Control;
      exports2.DivIcon = DivIcon;
      exports2.DivOverlay = DivOverlay;
      exports2.DomEvent = DomEvent;
      exports2.DomUtil = DomUtil;
      exports2.Draggable = Draggable;
      exports2.Evented = Evented;
      exports2.FeatureGroup = FeatureGroup;
      exports2.GeoJSON = GeoJSON;
      exports2.GridLayer = GridLayer;
      exports2.Handler = Handler;
      exports2.Icon = Icon;
      exports2.ImageOverlay = ImageOverlay;
      exports2.LatLng = LatLng;
      exports2.LatLngBounds = LatLngBounds;
      exports2.Layer = Layer;
      exports2.LayerGroup = LayerGroup;
      exports2.LineUtil = LineUtil;
      exports2.Map = Map2;
      exports2.Marker = Marker;
      exports2.Mixin = Mixin;
      exports2.Path = Path;
      exports2.Point = Point;
      exports2.PolyUtil = PolyUtil;
      exports2.Polygon = Polygon;
      exports2.Polyline = Polyline;
      exports2.Popup = Popup;
      exports2.PosAnimation = PosAnimation;
      exports2.Projection = index;
      exports2.Rectangle = Rectangle;
      exports2.Renderer = Renderer;
      exports2.SVG = SVG;
      exports2.SVGOverlay = SVGOverlay;
      exports2.TileLayer = TileLayer;
      exports2.Tooltip = Tooltip;
      exports2.Transformation = Transformation;
      exports2.Util = Util;
      exports2.VideoOverlay = VideoOverlay;
      exports2.bind = bind;
      exports2.bounds = toBounds;
      exports2.canvas = canvas;
      exports2.circle = circle;
      exports2.circleMarker = circleMarker;
      exports2.control = control;
      exports2.divIcon = divIcon;
      exports2.extend = extend;
      exports2.featureGroup = featureGroup;
      exports2.geoJSON = geoJSON;
      exports2.geoJson = geoJson;
      exports2.gridLayer = gridLayer;
      exports2.icon = icon;
      exports2.imageOverlay = imageOverlay;
      exports2.latLng = toLatLng;
      exports2.latLngBounds = toLatLngBounds;
      exports2.layerGroup = layerGroup;
      exports2.map = createMap;
      exports2.marker = marker;
      exports2.point = toPoint;
      exports2.polygon = polygon;
      exports2.polyline = polyline;
      exports2.popup = popup;
      exports2.rectangle = rectangle;
      exports2.setOptions = setOptions;
      exports2.stamp = stamp;
      exports2.svg = svg;
      exports2.svgOverlay = svgOverlay;
      exports2.tileLayer = tileLayer;
      exports2.tooltip = tooltip;
      exports2.transformation = toTransformation;
      exports2.version = version;
      exports2.videoOverlay = videoOverlay;
      var oldL = window.L;
      exports2.noConflict = function() {
        window.L = oldL;
        return this;
      };
      window.L = exports2;
    });
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => FoodSpotPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian39 = require("obsidian");

// src/types.ts
var SPOT_STATUSES = ["want-to-try", "visited"];
var RATING_SOURCES = [
  "google",
  "tripadvisor",
  "yelp",
  "thefork",
  "facebook",
  "opentable",
  "eetnu"
];
var EMPTY_FILTER_STATE = {
  excludedStatuses: [],
  excludedCuisines: [],
  excludedCountries: [],
  excludedCities: [],
  excludedPrices: [],
  minRating: 0,
  favoritesOnly: false
};
var DEFAULT_SETTINGS = {
  spotsFolder: "Food Spot",
  organizeByCountry: true,
  mediaFolder: "Food Spot/_media",
  defaultCountry: "",
  currencySymbol: "\u20AC",
  dateFormat: "european",
  halfStarRatings: true,
  staleRatingThresholdDays: 180,
  duplicateDetectionEnabled: true,
  duplicateDetectionRadiusMeters: 75,
  reviewBeforeSave: true,
  apiKeys: {},
  cardSizeDesktop: 0,
  cardSizeMobile: -1,
  cardTextPlacement: "inside",
  dashboardCardStyle: "rings",
  statusColors: {
    wantToTry: "#ff9500",
    visited: "#30d158",
    favorite: "#ff2d55"
  },
  ratingTiers: [
    { label: "Avoid", color: "#e5484d" },
    { label: "Meh", color: "#e0a83c" },
    { label: "Good", color: "#8fbc5c" },
    { label: "Great", color: "#4caf7d" },
    { label: "Outstanding", color: "#3d9ede" }
  ],
  spotViewMode: "cards",
  filterState: { ...EMPTY_FILTER_STATE },
  sort: { key: "date-added", direction: "desc" },
  activeTab: "dashboard",
  legacyMigrationDone: false
};
var DATA_CHANGED_EVENT = "foodspot-data-changed";
var VIEW_TYPE = "foodspot-view";
var PLUGIN_ICON = "utensils";
var CODE_BLOCK_LANG = "foodspot";
var FRONTMATTER_TYPE = "foodspot";

// src/store/spotStore.ts
var import_obsidian = require("obsidian");

// src/util/dates.ts
function todayIso() {
  return formatCalendarDate(/* @__PURE__ */ new Date());
}
function parseCalendarDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m === null) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
}
function formatCalendarDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function daysBetweenCalendar(aIso, bIso) {
  const a = parseCalendarDate(aIso);
  const b = parseCalendarDate(bIso);
  if (a === null || b === null) return Number.NaN;
  const DAY = 864e5;
  return Math.round((b.getTime() - a.getTime()) / DAY);
}
function daysSinceCalendar(iso) {
  return daysBetweenCalendar(iso, todayIso());
}

// src/store/visitsParser.ts
var KNOWN_FIELD_RE = /\[\s*(date|rating|spent)\s*::\s*([^\]]*)\]/gi;
var ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}/;
var EMBED_RE = /!\[\[([^\]]+?)\]\]/g;
function embedRefPath(ref) {
  const bar = ref.indexOf("|");
  return (bar === -1 ? ref : ref.slice(0, bar)).trim();
}
function parseNumber(raw) {
  const cleaned = raw.trim().replace(",", ".");
  if (!cleaned) return void 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : void 0;
}
function parseVisitLine(line) {
  let date;
  let rating;
  let spent;
  KNOWN_FIELD_RE.lastIndex = 0;
  let m;
  while ((m = KNOWN_FIELD_RE.exec(line)) !== null) {
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "date" && date === void 0) {
      const iso = ISO_DATE_RE.exec(value);
      if (iso) date = iso[0];
    } else if (key === "rating" && rating === void 0) {
      rating = parseNumber(value);
    } else if (key === "spent" && spent === void 0) {
      spent = parseNumber(value);
    }
  }
  if (!date) return null;
  const photos = [];
  EMBED_RE.lastIndex = 0;
  let e;
  while ((e = EMBED_RE.exec(line)) !== null) {
    const ref = e[1].trim();
    if (ref) photos.push(ref);
  }
  const note = line.replace(KNOWN_FIELD_RE, " ").replace(EMBED_RE, " ").replace(/^\s*[-*+]\s*/, "").replace(/\s+/g, " ").trim();
  const visit = { date, note };
  if (rating !== void 0) visit.rating = rating;
  if (spent !== void 0) visit.spent = spent;
  if (photos.length > 0) visit.photos = photos;
  return visit;
}
function parseVisitLines(sectionText) {
  const lines = [];
  for (const line of sectionText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const visit = parseVisitLine(line);
    if (visit) lines.push({ kind: "visit", visit });
    else lines.push({ kind: "raw", text: line });
  }
  return lines;
}
function parseVisitsSection(sectionText) {
  const visits = [];
  for (const line of parseVisitLines(sectionText)) {
    if (line.kind === "visit") visits.push(line.visit);
  }
  return visits;
}
function serializeVisit(visit) {
  let out = `- [date:: ${visit.date}]`;
  if (visit.rating !== void 0) out += ` [rating:: ${visit.rating}]`;
  if (visit.spent !== void 0) out += ` [spent:: ${visit.spent}]`;
  const note = visit.note.trim();
  if (note) out += ` ${note}`;
  for (const p of visit.photos ?? []) {
    const ref = p.trim();
    if (ref) out += ` ![[${ref}]]`;
  }
  return out;
}
function serializeVisitLines(lines) {
  return lines.map((l) => l.kind === "visit" ? serializeVisit(l.visit) : l.text).join("\n");
}
function serializeVisits(visits) {
  return visits.map(serializeVisit).join("\n");
}

// src/store/legacyMap.ts
function sanitizeFileName(name) {
  const cleaned = name.replace(/[\\/:*?"<>|#^[\]]/g, " ").replace(/\s+/g, " ").trim().replace(/^\.+/, "").replace(/\.+$/, "");
  return cleaned || "Untitled spot";
}
function spotFileName(name, city) {
  const base = city && city.trim() ? `${name} (${city.trim()})` : name;
  return `${sanitizeFileName(base)}.md`;
}
function spotFolder(settings, country) {
  const root = settings.spotsFolder.replace(/^\/+|\/+$/g, "");
  if (settings.organizeByCountry && country.trim()) {
    return root ? `${root}/${sanitizeFileName(country)}` : sanitizeFileName(country);
  }
  return root;
}
function todayISO() {
  return todayIso();
}
var ZONED_TIMESTAMP_RE = /T.*(?:Z|[+-]\d{2}:?\d{2})$/i;
function dateOnly(value) {
  if (typeof value !== "string" || !value.trim()) return void 0;
  const raw = value.trim();
  const parsed = new Date(raw);
  const valid = !Number.isNaN(parsed.getTime());
  if (valid && ZONED_TIMESTAMP_RE.test(raw)) return formatCalendarDate(parsed);
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  if (m) return m[1];
  if (!valid) return void 0;
  return formatCalendarDate(parsed);
}
function roundHalf(n) {
  return Math.round(n * 2) / 2;
}
function deriveFromVisits(visits) {
  let lastVisit;
  const rated = [];
  for (const v of visits) {
    if (!lastVisit || v.date > lastVisit) lastVisit = v.date;
    if (typeof v.rating === "number") rated.push(v.rating);
  }
  const avgRating = rated.length ? roundHalf(rated.reduce((a, b) => a + b, 0) / rated.length) : void 0;
  return { visitCount: visits.length, lastVisit, avgRating };
}

// src/store/noteWriter.ts
function asStr(v) {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return void 0;
}
function asNum(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return void 0;
}
function asBool(v) {
  return v === true || v === "true";
}
function asStrArray(v) {
  if (Array.isArray(v)) {
    return v.map((x) => asStr(x)).filter((x) => x !== void 0);
  }
  const single = asStr(v);
  return single ? [single] : [];
}
function parseLocation(v) {
  const raw = asStr(v);
  if (!raw) return void 0;
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(raw);
  if (!m) return void 0;
  return { lat: Number(m[1]), lng: Number(m[2]) };
}
function serializeLocation(c) {
  return c ? `${c.lat},${c.lng}` : void 0;
}
var FM_OPEN = /^---\r?\n/;
function splitFrontmatter(content) {
  if (!FM_OPEN.test(content)) return ["", content];
  const close = /\r?\n---(?:\r?\n|$)/g;
  close.lastIndex = 3;
  const m = close.exec(content);
  if (!m) return ["", content];
  const end = m.index + m[0].length;
  return [content.slice(0, end), content.slice(end)];
}
var FENCE_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
function findSection(body, heading) {
  const nextHeading = /^#{1,2}[ \t]/;
  const blank = /^[ \t]*$/;
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;
  let pos = 0;
  let start = -1;
  let contentStart = -1;
  while (pos <= body.length) {
    const lineEnd = body.indexOf("\n", pos);
    const end = lineEnd === -1 ? body.length : lineEnd;
    const line = body.slice(pos, end).replace(/\r$/, "");
    const fence2 = FENCE_RE.exec(line);
    if (fence2) {
      const marker = fence2[1];
      const rest = fence2[2];
      if (inFence) {
        if (marker[0] === fenceChar && marker.length >= fenceLen && blank.test(rest)) {
          inFence = false;
        }
      } else if (marker[0] === "~" || !rest.includes("`")) {
        inFence = true;
        fenceChar = marker[0];
        fenceLen = marker.length;
      }
    } else if (!inFence) {
      if (start === -1) {
        if (line.replace(/[ \t]+$/, "") === heading) {
          start = pos;
          contentStart = lineEnd === -1 ? body.length : lineEnd + 1;
        }
      } else if (nextHeading.test(line)) {
        return { start, contentStart, end: pos };
      }
    }
    if (lineEnd === -1) break;
    pos = lineEnd + 1;
  }
  if (start === -1) return null;
  return { start, contentStart, end: body.length };
}
function extractSection(content, heading) {
  const [, body] = splitFrontmatter(content);
  const range = findSection(body, heading);
  if (!range) return "";
  return body.slice(range.contentStart, range.end).replace(/^(?:[ \t]*\r?\n)+/, "").replace(/\s+$/, "");
}
function replaceSection(content, heading, sectionBody) {
  const [fm, body] = splitFrontmatter(content);
  const trimmedSection = sectionBody.replace(/\s+$/, "");
  const block = trimmedSection ? `${heading}

${trimmedSection}

` : `${heading}

`;
  const range = findSection(body, heading);
  if (!range) {
    let base = body.replace(/\s+$/, "");
    base = base ? `${base}

` : "";
    return `${fm}${base}${block.replace(/\n+$/, "\n")}`;
  }
  const before = body.slice(0, range.start);
  const after = body.slice(range.end);
  const newBody = after.trim() ? `${before}${block}${after}` : `${before}${block.replace(/\n+$/, "\n")}`;
  return `${fm}${newBody}`;
}
function buildNoteBody(notes, visits) {
  const notesPart = notes.trim() ? `${notes.trim()}

` : "";
  const visitsPart = visits.length ? `

${serializeVisits(visits)}
` : "\n";
  return `## Notes

${notesPart}## Visits${visitsPart}`;
}
function computeDerived(visits, ratingLocked, currentRating) {
  const d = deriveFromVisits(visits);
  const rating = !ratingLocked && d.avgRating !== void 0 ? d.avgRating : currentRating;
  return { visitCount: d.visitCount, lastVisit: d.lastVisit, rating };
}
function frontmatterFromInput(input, derived, dates) {
  return {
    type: "foodspot",
    name: input.name,
    cuisines: input.cuisines,
    country: input.country,
    city: asStr(input.city),
    district: asStr(input.district),
    address: asStr(input.address),
    location: serializeLocation(input.coordinates),
    status: input.status,
    favorite: input.favorite,
    rating: derived.rating,
    rating_locked: input.ratingLocked ? true : void 0,
    price: input.price,
    url: asStr(input.url),
    phone: asStr(input.phone),
    source: input.source,
    source_url: asStr(input.sourceUrl),
    google_rating: input.external.googleRating,
    google_rating_count: input.external.googleRatingCount,
    google_place_id: asStr(input.external.googlePlaceId),
    tripadvisor_rating: input.external.tripadvisorRating,
    tripadvisor_rating_count: input.external.tripadvisorRatingCount,
    tripadvisor_url: asStr(input.external.tripadvisorUrl),
    yelp_rating: input.external.yelpRating,
    yelp_rating_count: input.external.yelpRatingCount,
    yelp_url: asStr(input.external.yelpUrl),
    thefork_rating: input.external.theforkRating,
    thefork_rating_count: input.external.theforkRatingCount,
    thefork_url: asStr(input.external.theforkUrl),
    facebook_rating: input.external.facebookRating,
    facebook_rating_count: input.external.facebookRatingCount,
    facebook_url: asStr(input.external.facebookUrl),
    opentable_rating: input.external.opentableRating,
    opentable_rating_count: input.external.opentableRatingCount,
    opentable_url: asStr(input.external.opentableUrl),
    eetnu_rating: input.external.eetnuRating,
    eetnu_rating_count: input.external.eetnuRatingCount,
    eetnu_url: asStr(input.external.eetnuUrl),
    ratings_updated: asStr(input.external.ratingsUpdated),
    photo: asStr(input.photo),
    menu: asStr(input.menu),
    hours: input.hours && input.hours.length > 0 ? input.hours : void 0,
    visit_count: derived.visitCount,
    last_visit: derived.lastVisit,
    tags: input.tags,
    legacy_id: asStr(input.legacyId),
    created: dates.created,
    updated: dates.updated
  };
}
function applyFrontmatter(fm, data) {
  for (const [key, value] of Object.entries(data)) {
    if (value === void 0) delete fm[key];
    else fm[key] = value;
  }
}
async function writeSpotFrontmatter(app, file, data) {
  await app.fileManager.processFrontMatter(
    file,
    (fm) => applyFrontmatter(fm, data)
  );
}
var VALID_SOURCES = ["manual", "google-maps", "tripadvisor", "url"];
function buildSpot(path, fm, body, ctime) {
  const baseName = path.split("/").pop()?.replace(/\.md$/i, "") ?? path;
  const visits = parseVisitsSection(extractSection(body, "## Visits"));
  let ratingLocked = asBool(fm.rating_locked ?? fm.ratingLocked);
  const fmRating = asNum(fm.rating);
  if (!ratingLocked && fmRating !== void 0) {
    const avg = deriveFromVisits(visits).avgRating;
    if (avg !== void 0 && avg !== fmRating) ratingLocked = true;
  }
  const derived = computeDerived(visits, ratingLocked, fmRating);
  const statusRaw = asStr(fm.status);
  const sourceRaw = asStr(fm.source);
  const created = dateOnly(asStr(fm.created)) ?? dateOnly(asStr(fm.updated)) ?? todayISO();
  return {
    path,
    name: asStr(fm.name) ?? baseName,
    cuisines: asStrArray(fm.cuisines),
    country: asStr(fm.country) ?? "",
    city: asStr(fm.city),
    district: asStr(fm.district),
    address: asStr(fm.address),
    coordinates: parseLocation(fm.location),
    status: SPOT_STATUSES.includes(statusRaw) ? statusRaw : "want-to-try",
    favorite: asBool(fm.favorite),
    rating: derived.rating,
    ratingLocked,
    price: asNum(fm.price),
    url: asStr(fm.url),
    phone: asStr(fm.phone),
    source: VALID_SOURCES.includes(sourceRaw) ? sourceRaw : "manual",
    sourceUrl: asStr(fm.source_url ?? fm.sourceUrl),
    external: {
      googleRating: asNum(fm.google_rating),
      googleRatingCount: asNum(fm.google_rating_count),
      googlePlaceId: asStr(fm.google_place_id),
      tripadvisorRating: asNum(fm.tripadvisor_rating),
      tripadvisorRatingCount: asNum(fm.tripadvisor_rating_count),
      tripadvisorUrl: asStr(fm.tripadvisor_url),
      yelpRating: asNum(fm.yelp_rating),
      yelpRatingCount: asNum(fm.yelp_rating_count),
      yelpUrl: asStr(fm.yelp_url),
      theforkRating: asNum(fm.thefork_rating),
      theforkRatingCount: asNum(fm.thefork_rating_count),
      theforkUrl: asStr(fm.thefork_url),
      facebookRating: asNum(fm.facebook_rating),
      facebookRatingCount: asNum(fm.facebook_rating_count),
      facebookUrl: asStr(fm.facebook_url),
      opentableRating: asNum(fm.opentable_rating),
      opentableRatingCount: asNum(fm.opentable_rating_count),
      opentableUrl: asStr(fm.opentable_url),
      eetnuRating: asNum(fm.eetnu_rating),
      eetnuRatingCount: asNum(fm.eetnu_rating_count),
      eetnuUrl: asStr(fm.eetnu_url),
      ratingsUpdated: dateOnly(asStr(fm.ratings_updated))
    },
    photo: asStr(fm.photo),
    menu: asStr(fm.menu),
    hours: asStrArray(fm.hours).length > 0 ? asStrArray(fm.hours) : void 0,
    tags: asStrArray(fm.tags),
    visits,
    visitCount: derived.visitCount,
    lastVisit: derived.lastVisit,
    legacyId: asStr(fm.legacy_id ?? fm.legacyId),
    created,
    updated: dateOnly(asStr(fm.updated)) ?? created,
    ctime,
    notes: extractSection(body, "## Notes")
  };
}
async function ensureFolder(app, folder) {
  const parts = folder.split("/").filter(Boolean);
  let path = "";
  for (const part of parts) {
    path = path ? `${path}/${part}` : part;
    if (app.vault.getAbstractFileByPath(path)) continue;
    try {
      await app.vault.createFolder(path);
    } catch {
    }
  }
}
function availablePath(app, folder, fileName) {
  const base = fileName.replace(/\.md$/i, "");
  const prefix = folder ? `${folder}/` : "";
  let candidate = `${prefix}${base}.md`;
  let n = 2;
  while (app.vault.getAbstractFileByPath(candidate)) {
    candidate = `${prefix}${base} ${n}.md`;
    n += 1;
  }
  return candidate;
}
async function createSpotNote(app, folder, fileName, frontmatter, body) {
  await ensureFolder(app, folder);
  const path = availablePath(app, folder, fileName);
  const file = await app.vault.create(path, body);
  await writeSpotFrontmatter(app, file, frontmatter);
  return file;
}
async function writeNotesSection(app, file, notes) {
  await app.vault.process(
    file,
    (content) => replaceSection(content, "## Notes", notes.trim())
  );
}
async function mutateVisitLines(app, file, mutate) {
  let result = [];
  await app.vault.process(file, (content) => {
    const lines = parseVisitLines(extractSection(content, "## Visits"));
    const next = mutate(lines);
    result = next.filter((l) => l.kind === "visit").map((l) => l.visit);
    return replaceSection(content, "## Visits", serializeVisitLines(next));
  });
  return result;
}

// src/store/spotStore.ts
var FILE_DEBOUNCE_MS = 150;
var NOTIFY_DEBOUNCE_MS = 100;
function sameFrontmatterValue(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return a === b;
}
function changedFrontmatter(before, next) {
  const patch = {};
  for (const [key, value] of Object.entries(next)) {
    if (!sameFrontmatterValue(before[key], value)) patch[key] = value;
  }
  return patch;
}
var SpotStore = class {
  constructor(plugin) {
    this.byPath = /* @__PURE__ */ new Map();
    /** Stable array identity until the next index change. */
    this.list = [];
    this.listeners = /* @__PURE__ */ new Set();
    this.fileTimers = /* @__PURE__ */ new Map();
    /** Tail of the in-flight write chain per note path (never rejects). */
    this.writeChains = /* @__PURE__ */ new Map();
    this.notifyTimer = null;
    this.disposed = false;
    this.plugin = plugin;
  }
  /** Full scan (only here) + event subscriptions. Call once, on layout ready. */
  async initialize() {
    const { app } = this.plugin;
    for (const file of app.vault.getMarkdownFiles()) {
      await this.indexFile(file);
    }
    this.rebuildList();
    this.notifyChange();
    this.plugin.registerEvent(
      app.metadataCache.on("changed", (file) => this.scheduleReindex(file.path))
    );
    this.plugin.registerEvent(
      app.vault.on("create", (file) => {
        if (this.isMarkdown(file)) this.scheduleReindex(file.path);
      })
    );
    this.plugin.registerEvent(
      app.vault.on("delete", (file) => this.removeFromIndex(file.path))
    );
    this.plugin.registerEvent(
      app.vault.on("rename", (file, oldPath) => {
        this.removeFromIndex(oldPath);
        if (this.isMarkdown(file)) this.scheduleReindex(file.path);
      })
    );
  }
  dispose() {
    this.disposed = true;
    for (const timer of this.fileTimers.values()) window.clearTimeout(timer);
    this.fileTimers.clear();
    if (this.notifyTimer !== null) {
      window.clearTimeout(this.notifyTimer);
      this.notifyTimer = null;
    }
    this.listeners.clear();
  }
  // -------------------------------------------------------------------------
  // SpotStoreApi — reads
  // -------------------------------------------------------------------------
  getSpots() {
    return this.list;
  }
  getByPath(path) {
    return this.byPath.get(path);
  }
  distinct(field) {
    const values = /* @__PURE__ */ new Set();
    for (const spot of this.byPath.values()) {
      if (field === "cuisines" || field === "tags") {
        for (const v of spot[field]) if (v) values.add(v);
      } else {
        const v = spot[field];
        if (v) values.add(v);
      }
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }
  fileFor(path) {
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    return file instanceof import_obsidian.TFile ? file : null;
  }
  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  // -------------------------------------------------------------------------
  // SpotStoreApi — writes
  // -------------------------------------------------------------------------
  async createSpot(input) {
    const { app, settings } = this.plugin;
    const created = input.created ?? todayISO();
    const updated = todayISO();
    const derived = computeDerived(input.visits, input.ratingLocked, input.rating);
    const folder = spotFolder(settings, input.country);
    const fileName = spotFileName(input.name, input.city);
    const file = await createSpotNote(
      app,
      folder,
      fileName,
      frontmatterFromInput(input, derived, { created, updated }),
      buildNoteBody(input.notes, input.visits)
    );
    const spot = {
      ...input,
      path: file.path,
      visitCount: derived.visitCount,
      lastVisit: derived.lastVisit,
      rating: derived.rating,
      created,
      updated
    };
    this.setSpot(spot);
    return spot;
  }
  async updateSpot(path, input) {
    return this.queueWrite(path, async () => {
      const existing = this.requireSpot(path);
      const file = this.requireFile(path);
      const merged = {
        name: input.name ?? existing.name,
        cuisines: input.cuisines ?? existing.cuisines,
        country: input.country ?? existing.country,
        city: "city" in input ? input.city : existing.city,
        district: "district" in input ? input.district : existing.district,
        address: "address" in input ? input.address : existing.address,
        coordinates: "coordinates" in input ? input.coordinates : existing.coordinates,
        status: input.status ?? existing.status,
        favorite: input.favorite ?? existing.favorite,
        rating: "rating" in input ? input.rating : existing.rating,
        ratingLocked: input.ratingLocked ?? existing.ratingLocked,
        price: "price" in input ? input.price : existing.price,
        url: "url" in input ? input.url : existing.url,
        phone: "phone" in input ? input.phone : existing.phone,
        source: input.source ?? existing.source,
        sourceUrl: "sourceUrl" in input ? input.sourceUrl : existing.sourceUrl,
        external: input.external ?? existing.external,
        photo: "photo" in input ? input.photo : existing.photo,
        menu: "menu" in input ? input.menu : existing.menu,
        hours: "hours" in input ? input.hours : existing.hours,
        tags: input.tags ?? existing.tags,
        visits: input.visits ?? existing.visits,
        // Migration idempotency key: owned by the store, never patched.
        legacyId: existing.legacyId,
        notes: input.notes ?? existing.notes,
        ctime: existing.ctime,
        created: existing.created
      };
      const updated = todayISO();
      const derived = computeDerived(merged.visits, merged.ratingLocked, merged.rating);
      const before = frontmatterFromInput(
        existing,
        {
          visitCount: existing.visitCount,
          lastVisit: existing.lastVisit,
          rating: existing.rating
        },
        { created: existing.created, updated: existing.updated }
      );
      const next = frontmatterFromInput(merged, derived, {
        created: existing.created,
        updated
      });
      const patch = changedFrontmatter(before, next);
      delete patch.updated;
      const nextNotes = input.notes !== void 0 && input.notes !== existing.notes ? input.notes : void 0;
      const nextVisits = input.visits;
      const changed = Object.keys(patch).length > 0 || nextNotes !== void 0 || nextVisits !== void 0;
      if (changed) {
        patch.updated = updated;
        await writeSpotFrontmatter(this.plugin.app, file, patch);
      }
      if (nextNotes !== void 0) {
        await writeNotesSection(this.plugin.app, file, nextNotes);
      }
      if (nextVisits !== void 0) {
        await mutateVisitLines(this.plugin.app, file, (lines) => {
          let vi = 0;
          const out = [];
          for (const line of lines) {
            if (line.kind === "raw") {
              out.push(line);
              continue;
            }
            if (vi < nextVisits.length) {
              out.push({ kind: "visit", visit: nextVisits[vi] });
              vi += 1;
            }
          }
          for (; vi < nextVisits.length; vi += 1) {
            out.push({ kind: "visit", visit: nextVisits[vi] });
          }
          return out;
        });
      }
      const spot = {
        ...merged,
        path,
        visitCount: derived.visitCount,
        lastVisit: derived.lastVisit,
        rating: derived.rating,
        created: existing.created,
        updated: changed ? updated : existing.updated
      };
      this.setSpot(spot);
      return spot;
    });
  }
  async addVisit(path, visit) {
    return this.mutateVisits(path, (lines) => [
      ...lines,
      { kind: "visit", visit }
    ]);
  }
  async updateVisit(path, index, visit) {
    return this.mutateVisits(path, (lines) => {
      let seen = -1;
      return lines.map((line) => {
        if (line.kind !== "visit") return line;
        seen += 1;
        return seen === index ? { kind: "visit", visit } : line;
      });
    });
  }
  async deleteVisit(path, index) {
    return this.mutateVisits(path, (lines) => {
      let seen = -1;
      return lines.filter((line) => {
        if (line.kind !== "visit") return true;
        seen += 1;
        return seen !== index;
      });
    });
  }
  async deleteSpot(path) {
    await this.queueWrite(path, async () => {
      const file = this.requireFile(path);
      await this.plugin.app.fileManager.trashFile(file);
      this.removeFromIndex(path);
    });
  }
  async setNotes(path, notes) {
    await this.queueWrite(path, async () => {
      const file = this.requireFile(path);
      await writeNotesSection(this.plugin.app, file, notes);
      const existing = this.byPath.get(path);
      if (existing) this.setSpot({ ...existing, notes: notes.trim() });
    });
  }
  async openNote(path) {
    const file = this.requireFile(path);
    const leaf = this.plugin.app.workspace.getLeaf("tab");
    await leaf.openFile(file);
  }
  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------
  /** Shared visit mutation: raw-line-safe body rewrite + derived frontmatter. */
  async mutateVisits(path, mutate) {
    return this.queueWrite(path, async () => {
      const existing = this.requireSpot(path);
      const file = this.requireFile(path);
      const visits = await mutateVisitLines(this.plugin.app, file, mutate);
      const derived = computeDerived(visits, existing.ratingLocked, existing.rating);
      const updated = todayISO();
      await writeSpotFrontmatter(this.plugin.app, file, {
        rating: derived.rating,
        visit_count: derived.visitCount,
        last_visit: derived.lastVisit,
        updated
      });
      const spot = {
        ...existing,
        visits,
        visitCount: derived.visitCount,
        lastVisit: derived.lastVisit,
        rating: derived.rating,
        updated
      };
      this.setSpot(spot);
      return spot;
    });
  }
  /**
   * Run `task` after every write already queued for this note. Two updates to
   * the same note would otherwise interleave their read-modify-write cycles
   * and the later one would base its patch on state the earlier one has
   * already replaced. Failures do not break the chain for the next writer.
   */
  queueWrite(path, task) {
    const previous = this.writeChains.get(path) ?? Promise.resolve();
    const run = previous.then(task, task);
    const tail = run.then(
      () => void 0,
      () => void 0
    );
    this.writeChains.set(path, tail);
    void tail.then(() => {
      if (this.writeChains.get(path) === tail) this.writeChains.delete(path);
    });
    return run;
  }
  isMarkdown(file) {
    return file instanceof import_obsidian.TFile && file.extension === "md";
  }
  requireSpot(path) {
    const spot = this.byPath.get(path);
    if (!spot) throw new Error(`Food Spot: no spot indexed at "${path}"`);
    return spot;
  }
  requireFile(path) {
    const file = this.fileFor(path);
    if (!file) throw new Error(`Food Spot: note not found at "${path}"`);
    return file;
  }
  /** Debounced per-file re-index (metadataCache "changed" can burst). */
  scheduleReindex(path) {
    if (this.disposed) return;
    const pending = this.fileTimers.get(path);
    if (pending !== void 0) window.clearTimeout(pending);
    this.fileTimers.set(
      path,
      window.setTimeout(() => {
        this.fileTimers.delete(path);
        void this.reindexPath(path);
      }, FILE_DEBOUNCE_MS)
    );
  }
  async reindexPath(path) {
    if (this.disposed) return;
    const file = this.fileFor(path);
    if (!file) {
      this.removeFromIndex(path);
      return;
    }
    const changed = await this.indexFile(file);
    if (changed) {
      this.rebuildList();
      this.notifyChange();
    }
  }
  /**
   * (Re)index one file from metadataCache + body. Returns true when the
   * index changed. Files without `type: foodspot` are removed if present.
   */
  async indexFile(file) {
    const cache = this.plugin.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    if (!fm || fm.type !== FRONTMATTER_TYPE) {
      return this.byPath.delete(file.path);
    }
    const body = await this.plugin.app.vault.cachedRead(file);
    this.byPath.set(file.path, buildSpot(file.path, fm, body, file.stat?.ctime));
    return true;
  }
  removeFromIndex(path) {
    if (this.byPath.delete(path)) {
      this.rebuildList();
      this.notifyChange();
    }
  }
  /** Insert/replace a spot we just wrote, without waiting for cache events. */
  setSpot(spot) {
    this.byPath.set(spot.path, spot);
    this.rebuildList();
    this.notifyChange();
  }
  rebuildList() {
    this.list = [...this.byPath.values()];
  }
  /** Debounced ~100ms: listeners + workspace trigger + DOM CustomEvent. */
  notifyChange() {
    if (this.disposed) return;
    if (this.notifyTimer !== null) window.clearTimeout(this.notifyTimer);
    this.notifyTimer = window.setTimeout(() => {
      this.notifyTimer = null;
      for (const cb of [...this.listeners]) {
        try {
          cb();
        } catch (e) {
          console.error("Food Spot: onChange listener failed", e);
        }
      }
      this.plugin.app.workspace.trigger(DATA_CHANGED_EVENT);
      document.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
    }, NOTIFY_DEBOUNCE_MS);
  }
};

// src/import/net.ts
var import_obsidian2 = require("obsidian");
var DEFAULT_TIMEOUT_MS = 8e3;
var MIN_INTERVAL_MS = 300;
var MAX_REDIRECT_HOPS = 3;
var BOT_CHECK_RE = /just a moment|g-recaptcha|cf-challenge|captcha/i;
var REDIRECT_STATUSES = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
var SHORTLINK_HOSTS = /* @__PURE__ */ new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "www.goo.gl",
  "g.co",
  "bit.ly",
  "tinyurl.com",
  "t.co"
]);
var DEFAULT_HEADERS = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en"
};
var BotCheckError = class extends Error {
  constructor(url) {
    super(
      `${hostOf(url)} is showing a bot-check page instead of content. Open the link once in your browser, then retry \u2014 or add the spot manually.`
    );
    this.name = "BotCheckError";
  }
};
var TimeoutError = class extends Error {
  constructor(url, ms) {
    super(`Request to ${hostOf(url)} timed out after ${Math.round(ms / 1e3)}s.`);
    this.name = "TimeoutError";
  }
};
var lastCallAt = /* @__PURE__ */ new Map();
var hostQueues = /* @__PURE__ */ new Map();
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
function throttle(host) {
  const prev = hostQueues.get(host) ?? Promise.resolve();
  const next = prev.then(async () => {
    const wait = (lastCallAt.get(host) ?? 0) + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCallAt.set(host, Date.now());
  });
  hostQueues.set(
    host,
    next.catch(() => void 0)
  );
  return next;
}
function safeText(res) {
  try {
    const t = res.text;
    return typeof t === "string" ? t : null;
  } catch {
    return null;
  }
}
function headerOf(res, name) {
  const headers = res.headers ?? {};
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key];
  }
  return void 0;
}
async function fetchWithTimeout(url, opts = {}) {
  await throttle(hostOf(url));
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(url, timeoutMs)), timeoutMs);
  });
  try {
    const res = await Promise.race([
      (0, import_obsidian2.requestUrl)({
        url,
        method: opts.method ?? "GET",
        headers: { ...DEFAULT_HEADERS, ...opts.headers ?? {} },
        throw: opts.throw ?? true
      }),
      timeout
    ]);
    if (!opts.skipBotCheck) {
      const body = safeText(res);
      if (body !== null && BOT_CHECK_RE.test(body)) throw new BotCheckError(url);
    }
    return res;
  } finally {
    if (timer !== void 0) clearTimeout(timer);
  }
}
function isShortlinkHost(url) {
  return SHORTLINK_HOSTS.has(hostOf(url).toLowerCase());
}
function unwrapConsent(url) {
  try {
    const u = new URL(url);
    if (!/^consent\.google\.[a-z.]+$/.test(u.hostname)) return null;
    const cont = u.searchParams.get("continue");
    if (cont && /^https?:\/\//.test(cont)) return cont;
  } catch {
  }
  return null;
}
function extractTargetFromHtml(html, baseUrl) {
  const unescape = (s) => s.replace(/\\u0026/g, "&").replace(/&amp;/g, "&");
  const og = html.match(
    /<meta[^>]+property\s*=\s*["']og:url["'][^>]*content\s*=\s*["']([^"']+)["']/i
  ) ?? html.match(
    /<meta[^>]+content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:url["']/i
  );
  const canonical = html.match(
    /<link[^>]+rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["']/i
  );
  const refresh = html.match(
    /<meta[^>]+http-equiv\s*=\s*["']refresh["'][^>]*content\s*=\s*["'][^"']*url=([^"']+)["']/i
  );
  const mapsInBody = html.match(
    /https:\/\/www\.google\.[a-z.]+\/maps\/(?:place|search)\/[^"'\\\s<>]+/i
  );
  for (const m of [og, canonical, refresh, mapsInBody]) {
    if (!m) continue;
    const raw = unescape(m[1] ?? m[0]).trim();
    try {
      const abs = new URL(raw, baseUrl).toString();
      if (abs !== baseUrl) return abs;
    } catch {
    }
  }
  return null;
}
async function resolveRedirects(url) {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
    const consentTarget = unwrapConsent(current);
    if (consentTarget) {
      current = consentTarget;
      continue;
    }
    let res;
    try {
      res = await fetchWithTimeout(current, { throw: false, skipBotCheck: true });
    } catch (e) {
      if (hop === 0) throw e;
      return { finalUrl: current };
    }
    const location = headerOf(res, "location");
    if (REDIRECT_STATUSES.has(res.status) && location) {
      try {
        current = new URL(location, current).toString();
      } catch {
        return { finalUrl: current };
      }
      continue;
    }
    if (res.status >= 400) return { finalUrl: current };
    const body = safeText(res);
    if (body === null) return { finalUrl: current };
    if (BOT_CHECK_RE.test(body)) throw new BotCheckError(current);
    if (isShortlinkHost(current) && hop < MAX_REDIRECT_HOPS) {
      const target = extractTargetFromHtml(body, current);
      if (target !== null) {
        current = target;
        continue;
      }
    }
    return { finalUrl: current, html: body };
  }
  return { finalUrl: current };
}

// src/import/jsonld.ts
var FOOD_TYPES = /* @__PURE__ */ new Set([
  "restaurant",
  "foodestablishment",
  "cafeorcoffeeshop",
  "bakery",
  "barorpub",
  "brewery",
  "fastfoodrestaurant",
  "icecreamshop",
  "winery",
  "distillery"
]);
var BUSINESS_TYPES = /* @__PURE__ */ new Set(["localbusiness"]);
function isObj(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asString(v) {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return void 0;
}
function cleanStr(v) {
  const s = asString(v);
  if (s === void 0) return void 0;
  const out = decodeEntities(s).replace(/\s+/g, " ").trim();
  return out === "" ? void 0 : out;
}
function num(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return void 0;
}
function decodeEntities(s) {
  return s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d))).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}
function tolerantParse(raw) {
  const attempts = [
    raw,
    raw.replace(/<!--[\s\S]*?-->/g, "").replace(/^\s*\/\/<!\[CDATA\[/, "").replace(/\/\/\]\]>\s*$/, "").replace(/;\s*$/, "").trim()
  ];
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
    }
  }
  return void 0;
}
function collectNodes(value, out, depth = 0) {
  if (depth > 4 || value === null || value === void 0) return;
  if (Array.isArray(value)) {
    for (const item of value) collectNodes(item, out, depth + 1);
    return;
  }
  if (!isObj(value)) return;
  out.push(value);
  collectNodes(value["@graph"], out, depth + 1);
  collectNodes(value["mainEntity"], out, depth + 1);
}
function typeScore(node) {
  const t = node["@type"];
  const types = (Array.isArray(t) ? t : [t]).map((x) => typeof x === "string" ? x.toLowerCase().trim() : "").filter((x) => x !== "");
  if (types.some((x) => FOOD_TYPES.has(x))) return 2;
  if (types.some((x) => BUSINESS_TYPES.has(x))) return 1;
  return 0;
}
function pickFoodNode(nodes) {
  let best = null;
  let bestScore = 0;
  for (const node of nodes) {
    const score = typeScore(node);
    if (score > bestScore) {
      best = node;
      bestScore = score;
      if (score === 2) break;
    }
  }
  return best;
}
function parsePriceRange(v) {
  const runs = v.match(/[$€£¥]+/g);
  if (!runs || runs.length === 0) return void 0;
  const first = runs[0];
  return Math.min(Math.max(first.length, 1), 4);
}
function mapImage(v) {
  if (typeof v === "string") return cleanStr(v);
  if (Array.isArray(v)) {
    for (const item of v) {
      const found = mapImage(item);
      if (found !== void 0) return found;
    }
    return void 0;
  }
  if (isObj(v)) return cleanStr(v["url"] ?? v["contentUrl"]);
  return void 0;
}
function mapCuisines(v) {
  const raw = [];
  const push = (s) => {
    const c = cleanStr(s);
    if (c !== void 0) {
      for (const part of c.split(/[,·]/)) {
        const p = part.trim();
        if (p !== "") raw.push(p);
      }
    }
  };
  if (Array.isArray(v)) for (const item of v) push(item);
  else push(v);
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const c of raw) {
    const key = c.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }
  return out.length > 0 ? out.slice(0, 8) : void 0;
}
function mapAddress(addr) {
  if (typeof addr === "string") {
    const full = cleanStr(addr);
    return full !== void 0 ? { full } : void 0;
  }
  if (!isObj(addr)) return void 0;
  const a = {};
  a.street = cleanStr(addr["streetAddress"]);
  a.city = cleanStr(addr["addressLocality"]);
  a.region = cleanStr(addr["addressRegion"]);
  a.postalCode = cleanStr(addr["postalCode"]);
  const c = addr["addressCountry"];
  a.country = isObj(c) ? cleanStr(c["name"]) : cleanStr(c);
  const parts = [a.street, a.city].filter((x) => x !== void 0);
  if (parts.length > 0) a.full = parts.join(", ");
  return Object.values(a).some((x) => x !== void 0) ? a : void 0;
}
function mapRating(node) {
  const agg = node["aggregateRating"];
  if (!isObj(agg)) return {};
  const raw = num(agg["ratingValue"]);
  let rating = raw;
  const best = num(agg["bestRating"]);
  if (rating !== void 0) {
    if (best === 10) rating = rating / 2;
    else if (best === 100) rating = rating / 20;
    rating = Math.round(rating * 10) / 10;
    if (rating < 0 || rating > 5) rating = void 0;
  }
  const ratingCount = num(agg["ratingCount"]) ?? num(agg["reviewCount"]);
  const out = {};
  if (rating !== void 0) out.rating = rating;
  if (raw !== void 0 && raw >= 0) out.ratingRaw = raw;
  if (best !== void 0) out.ratingBest = best;
  if (ratingCount !== void 0 && ratingCount >= 0) out.ratingCount = Math.round(ratingCount);
  return out;
}
function theforkRating10(ld) {
  if (ld.ratingRaw === void 0) return void 0;
  const best = ld.ratingBest;
  if (best === void 0 || best === 10) return ld.ratingRaw;
  if (best <= 0) return void 0;
  return Math.round(ld.ratingRaw * 10 / best * 10) / 10;
}
function mapNode(node) {
  const out = {};
  out.name = cleanStr(node["name"]);
  out.address = mapAddress(node["address"]);
  const geo = node["geo"];
  if (isObj(geo)) {
    const lat = num(geo["latitude"]);
    const lng = num(geo["longitude"]);
    if (lat !== void 0 && lng !== void 0 && !(lat === 0 && lng === 0) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      out.lat = lat;
      out.lng = lng;
    }
  }
  out.cuisines = mapCuisines(node["servesCuisine"]);
  const priceRange = asString(node["priceRange"]);
  if (priceRange !== void 0) out.price = parsePriceRange(priceRange);
  const { rating, ratingRaw, ratingBest, ratingCount } = mapRating(node);
  out.rating = rating;
  out.ratingRaw = ratingRaw;
  out.ratingBest = ratingBest;
  out.ratingCount = ratingCount;
  out.image = mapImage(node["image"] ?? node["photo"]);
  out.phone = cleanStr(node["telephone"]);
  out.url = cleanStr(node["url"]);
  return out;
}
function extractJsonLd(html) {
  const nodes = [];
  const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const parsed = tolerantParse(m[1]);
    if (parsed !== void 0) collectNodes(parsed, nodes);
  }
  const node = pickFoodNode(nodes);
  return node !== null ? mapNode(node) : null;
}
function metaContent(html, prop) {
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tagRe = new RegExp(
    `<meta\\s[^>]*(?:property|name)\\s*=\\s*["']${escaped}["'][^>]*>`,
    "i"
  );
  const tag = html.match(tagRe);
  if (!tag) return void 0;
  const content = tag[0].match(/content\s*=\s*["']([^"']*)["']/i);
  if (!content) return void 0;
  const value = decodeEntities(content[1]).replace(/\s+/g, " ").trim();
  return value === "" ? void 0 : value;
}
function extractOpenGraph(html) {
  const out = {};
  out.title = metaContent(html, "og:title");
  out.description = metaContent(html, "og:description") ?? metaContent(html, "description");
  out.image = metaContent(html, "og:image");
  out.url = metaContent(html, "og:url");
  if (out.title === void 0) {
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (title) {
      const t = decodeEntities(title[1]).replace(/\s+/g, " ").trim();
      if (t !== "") out.title = t;
    }
  }
  return out;
}

// src/import/importers.ts
function setDraftField(draft, key, value, conf) {
  if (value === void 0 || value === null) return;
  if (typeof value === "string" && value.trim() === "") return;
  if (Array.isArray(value) && value.length === 0) return;
  if (draft.fields[key] !== void 0) {
    const existing = draft.confidence[key];
    if (!(existing === "low" && conf === "high")) return;
  }
  draft.fields[key] = value;
  draft.confidence[key] = conf;
}
function mergeExternal(draft, ext) {
  const defined = {};
  for (const [k, v] of Object.entries(ext)) {
    if (v !== void 0) defined[k] = v;
  }
  if (Object.keys(defined).length === 0) return;
  draft.fields.external = { ...draft.fields.external ?? {}, ...defined };
  draft.confidence.external = "high";
}
function newDraft(kind, sourceUrl) {
  const draft = {
    fields: {},
    confidence: {},
    importerKind: kind,
    sourceUrl,
    warnings: []
  };
  const source = kind === "google-maps" ? "google-maps" : kind === "tripadvisor" ? "tripadvisor" : "url";
  setDraftField(draft, "source", source, "high");
  setDraftField(draft, "sourceUrl", sourceUrl, "high");
  return draft;
}
function expandCountry(value) {
  const v = value.trim();
  if (!/^[A-Za-z]{2}$/.test(v)) return { name: v, confident: true };
  try {
    const intl = Intl;
    if (intl.DisplayNames) {
      const name = new intl.DisplayNames(["en"], { type: "region" }).of(v.toUpperCase());
      if (name !== void 0 && name !== v.toUpperCase()) return { name, confident: true };
    }
  } catch {
  }
  return { name: v.toUpperCase(), confident: false };
}
function applyJsonLd(draft, ld, ratingTarget) {
  setDraftField(draft, "name", ld.name, "high");
  if (ld.address) {
    setDraftField(draft, "address", ld.address.street ?? ld.address.full, "high");
    setDraftField(draft, "city", ld.address.city, "high");
    if (ld.address.country !== void 0) {
      const { name, confident } = expandCountry(ld.address.country);
      setDraftField(draft, "country", name, confident ? "high" : "low");
    }
  }
  if (ld.lat !== void 0 && ld.lng !== void 0) {
    setDraftField(draft, "coordinates", { lat: ld.lat, lng: ld.lng }, "high");
  }
  setDraftField(draft, "cuisines", ld.cuisines, "high");
  setDraftField(draft, "price", ld.price, "high");
  setDraftField(draft, "phone", ld.phone, "high");
  setDraftField(draft, "photo", ld.image, "high");
  if (ratingTarget === "thefork") {
    const thefork10 = theforkRating10(ld);
    if (thefork10 !== void 0) {
      mergeExternal(draft, {
        theforkRating: thefork10,
        theforkRatingCount: ld.ratingCount
      });
    }
    return;
  }
  if (ld.rating !== void 0) {
    if (ratingTarget === "google") {
      mergeExternal(draft, { googleRating: ld.rating, googleRatingCount: ld.ratingCount });
    } else if (ratingTarget === "tripadvisor") {
      mergeExternal(draft, {
        tripadvisorRating: ld.rating,
        tripadvisorRatingCount: ld.ratingCount
      });
    } else if (ratingTarget === "yelp") {
      mergeExternal(draft, { yelpRating: ld.rating, yelpRatingCount: ld.ratingCount });
    } else {
      draft.warnings.push(
        `Found an on-page rating (${ld.rating}${ld.ratingCount !== void 0 ? `, ${ld.ratingCount} reviews` : ""}) from an unknown provider \u2014 not saved.`
      );
    }
  }
}
function applyOpenGraph(draft, html, cleanTitle) {
  const og = extractOpenGraph(html);
  if (og.title !== void 0) {
    const title = cleanTitle(og.title);
    if (title !== "") setDraftField(draft, "name", title, "low");
  }
  setDraftField(draft, "photo", og.image, "low");
}
var COORD_PAIR_RE = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/;
function validCoords(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
}
var googleMapsImporter = {
  kind: "google-maps",
  matches(u) {
    const h = u.hostname.toLowerCase();
    if (h === "maps.app.goo.gl") return true;
    if ((h === "goo.gl" || h === "www.goo.gl") && u.pathname.startsWith("/maps")) return true;
    if (/^(www\.)?google\.[a-z.]+$/.test(h) && u.pathname.startsWith("/maps")) return true;
    if (/^maps\.google\.[a-z.]+$/.test(h)) return true;
    return false;
  },
  parse(resolvedUrl, html) {
    const draft = newDraft("google-maps", resolvedUrl);
    const bang = resolvedUrl.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    const at = resolvedUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    for (const [m, conf] of [
      [bang, "high"],
      [at, "low"]
    ]) {
      if (m) {
        const lat = Number.parseFloat(m[1]);
        const lng = Number.parseFloat(m[2]);
        if (validCoords(lat, lng)) setDraftField(draft, "coordinates", { lat, lng }, conf);
      }
    }
    const place = resolvedUrl.match(/\/maps\/place\/([^/@?#]+)/);
    if (place) {
      try {
        const name = decodeURIComponent(place[1].replace(/\+/g, " ")).trim();
        if (name !== "" && !COORD_PAIR_RE.test(name)) setDraftField(draft, "name", name, "high");
      } catch {
      }
    }
    const search2 = resolvedUrl.match(/\/maps\/search\/([^/@?#]+)/);
    if (search2 && draft.fields.name === void 0) {
      try {
        const q = decodeURIComponent(search2[1].replace(/\+/g, " ")).trim();
        if (q !== "" && !COORD_PAIR_RE.test(q)) setDraftField(draft, "name", q, "low");
      } catch {
      }
    }
    try {
      const q = new URL(resolvedUrl).searchParams.get("q") ?? "";
      const pair = q.match(COORD_PAIR_RE);
      if (pair) {
        const lat = Number.parseFloat(pair[1]);
        const lng = Number.parseFloat(pair[2]);
        if (validCoords(lat, lng)) setDraftField(draft, "coordinates", { lat, lng }, "high");
      } else if (q.trim() !== "" && !q.startsWith("place_id:")) {
        setDraftField(draft, "name", q.trim(), "low");
      }
    } catch {
    }
    if (html !== null) {
      const ld = extractJsonLd(html);
      if (ld !== null) applyJsonLd(draft, ld, "google");
      applyOpenGraph(
        draft,
        html,
        (t) => t.replace(/\s*[-–·|]\s*Google\s*Maps\s*$/i, "").split(" \xB7 ")[0].trim()
      );
    }
    if (draft.fields.name === void 0 && draft.fields.coordinates === void 0) {
      draft.warnings.push(
        "Could not read a place name or coordinates from this Google Maps link."
      );
    }
    return draft;
  }
};
var tripadvisorImporter = {
  kind: "tripadvisor",
  matches(u) {
    return u.hostname.toLowerCase().includes("tripadvisor.");
  },
  parse(resolvedUrl, html) {
    const draft = newDraft("tripadvisor", resolvedUrl);
    mergeExternal(draft, { tripadvisorUrl: resolvedUrl });
    if (html !== null) {
      const ld = extractJsonLd(html);
      if (ld !== null) applyJsonLd(draft, ld, "tripadvisor");
      applyOpenGraph(
        draft,
        html,
        (t) => t.replace(/\s*[-–|]\s*Tripadvisor\s*$/i, "").replace(/^\s*[A-Z ]+’?S?\s*,/, "").trim()
      );
    }
    const slug = resolvedUrl.match(/-Reviews-([^/]+?)-([^/.]+?)\.html/i);
    if (slug) {
      const name = slug[1].replace(/_/g, " ").trim();
      const city = slug[2].replace(/_/g, " ").trim();
      if (name !== "") setDraftField(draft, "name", name, "low");
      if (city !== "") setDraftField(draft, "city", city, "low");
    }
    if (draft.fields.name === void 0) {
      draft.warnings.push("Could not read the restaurant name from this TripAdvisor page.");
    }
    return draft;
  }
};
var yelpImporter = {
  kind: "generic",
  matches(u) {
    return u.hostname.toLowerCase().includes("yelp.");
  },
  parse(resolvedUrl, html) {
    const draft = newDraft("generic", resolvedUrl);
    mergeExternal(draft, { yelpUrl: resolvedUrl });
    if (html !== null) {
      const ld = extractJsonLd(html);
      if (ld !== null) applyJsonLd(draft, ld, "yelp");
      applyOpenGraph(
        draft,
        html,
        (t) => t.replace(/\s*[-–|]\s*Yelp\s*$/i, "").trim()
      );
    }
    if (draft.fields.name === void 0) {
      draft.warnings.push("Could not read the restaurant name from this Yelp page.");
    }
    return draft;
  }
};
var theforkImporter = {
  kind: "generic",
  matches(u) {
    const h = u.hostname.toLowerCase();
    return h.includes("thefork.") || h.includes("lafourchette.");
  },
  parse(resolvedUrl, html) {
    const draft = newDraft("generic", resolvedUrl);
    mergeExternal(draft, { theforkUrl: resolvedUrl });
    if (html !== null) {
      const ld = extractJsonLd(html);
      if (ld !== null) applyJsonLd(draft, ld, "thefork");
      applyOpenGraph(
        draft,
        html,
        (t) => t.replace(/\s*[-–|]\s*(?:TheFork|LaFourchette)\s*$/i, "").trim()
      );
    }
    if (draft.fields.name === void 0) {
      draft.warnings.push("Could not read the restaurant name from this TheFork page.");
    }
    return draft;
  }
};
var genericImporter = {
  kind: "generic",
  matches() {
    return true;
  },
  parse(resolvedUrl, html) {
    const draft = newDraft("generic", resolvedUrl);
    setDraftField(draft, "url", resolvedUrl, "low");
    if (html !== null) {
      const ld = extractJsonLd(html);
      if (ld !== null) {
        applyJsonLd(draft, ld, "none");
        if (ld.url !== void 0) setDraftField(draft, "url", ld.url, "high");
      }
      applyOpenGraph(draft, html, (t) => t.split(/\s*[|–]\s*/)[0].trim());
    }
    if (draft.fields.name === void 0) {
      draft.warnings.push(
        "No restaurant metadata (JSON-LD or OpenGraph) found on this page \u2014 fill in the details manually."
      );
    }
    return draft;
  }
};
var IMPORTERS = [
  googleMapsImporter,
  tripadvisorImporter,
  yelpImporter,
  theforkImporter,
  genericImporter
];
function pickImporter(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Not a valid URL: ${url}`);
  }
  for (const importer of IMPORTERS) {
    if (importer.matches(parsed)) return importer;
  }
  return genericImporter;
}
function detectRatingSource(url) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host.includes("tripadvisor.")) return "tripadvisor";
  if (host.includes("yelp.")) return "yelp";
  if (host.includes("thefork.") || host.includes("lafourchette.")) return "thefork";
  if (host.includes("facebook.com") || host === "fb.com" || host.endsWith(".fb.com")) return "facebook";
  if (host.includes("opentable.")) return "opentable";
  if (host.includes("eet.nu")) return "eetnu";
  return null;
}

// src/import/menuDiscovery.ts
var MENU_WORD_RE = /menu|menukaart|kaart|carte|speisekarte/i;
var STRONG_MENU_RE = /menu|speisekarte|\bcartes?\b/i;
var NOT_MENU_RE = /cadeau|gift|voucher|tegoed|kado|(?<!menu)kaartje/i;
var ANCHOR_RE = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
function findMenuUrl(html, baseUrl) {
  let baseHost = "";
  try {
    baseHost = new URL(baseUrl).hostname.toLowerCase();
  } catch {
  }
  const candidates = [null, null, null];
  const re = new RegExp(ANCHOR_RE.source, "gi");
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = (m[1] ?? m[2] ?? m[3] ?? "").trim();
    if (href === "" || href.startsWith("#")) continue;
    if (/^(javascript|mailto|tel|data):/i.test(href)) continue;
    const text = m[4].replace(/<[^>]*>/g, " ");
    if (!MENU_WORD_RE.test(href) && !MENU_WORD_RE.test(text)) continue;
    if (NOT_MENU_RE.test(href) || NOT_MENU_RE.test(text)) continue;
    let resolved;
    try {
      resolved = new URL(href, baseUrl);
    } catch {
      continue;
    }
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") continue;
    const abs = resolved.toString();
    const strong = STRONG_MENU_RE.test(href) || STRONG_MENU_RE.test(text);
    const sameHost = baseHost !== "" && resolved.hostname.toLowerCase() === baseHost;
    if (strong && sameHost) return abs;
    const rank = sameHost ? 0 : strong ? 1 : 2;
    if (candidates[rank] === null) candidates[rank] = abs;
  }
  return candidates[0] ?? candidates[1] ?? candidates[2];
}

// src/import/sourceDiscovery.ts
function namesMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const ta = new Set(na.split(" ").filter((t) => t.length > 1));
  const tb = new Set(nb.split(" ").filter((t) => t.length > 1));
  if (ta.size === 0 || tb.size === 0) return false;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  return overlap / Math.min(ta.size, tb.size) >= 0.6;
}
function citySlug(city) {
  return city.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function pickEetnuVenue(venues, spotName, spotCity) {
  const matches = venues.filter((v) => v.name !== void 0 && namesMatch(spotName, v.name));
  if (matches.length === 0) return null;
  if (spotCity !== void 0 && spotCity !== "") {
    const slug = citySlug(spotCity);
    const cityLower = spotCity.toLowerCase();
    const inCity = matches.filter(
      (v) => v.address?.city?.toLowerCase() === cityLower || v.url !== void 0 && new RegExp(`/${slug}/`, "i").test(v.url)
    );
    return inCity[0] ?? null;
  }
  return matches.length === 1 ? matches[0] : null;
}
var WALLED = "auto-discovery blocked by the site \u2014 use its + chip to paste the link";
async function discoverSources(spot, onProgress) {
  const patch = {};
  const attached = [];
  const skipped = [];
  const needsEetnu = spot.external.eetnuUrl === void 0 || spot.external.eetnuRating === void 0;
  const needsFacebookLink = spot.external.facebookUrl === void 0;
  if (needsEetnu || needsFacebookLink) {
    onProgress?.("Eet.nu");
    try {
      const q = encodeURIComponent(`${spot.name} ${spot.city ?? ""}`.trim());
      const res = await fetchWithTimeout(`https://api.eet.nu/venues?query=${q}`);
      const body = JSON.parse(res.text);
      const venue = pickEetnuVenue(body.results ?? [], spot.name, spot.city);
      if (venue === null) {
        skipped.push({ label: "Eet.nu", reason: "no verified match" });
      } else {
        if (needsEetnu && venue.url !== void 0) {
          patch.eetnuUrl = venue.url;
          if (typeof venue.rating === "number" && venue.rating > 0) {
            patch.eetnuRating = Math.round(venue.rating) / 10;
            attached.push("Eet.nu");
          } else {
            attached.push("Eet.nu (link only)");
          }
        }
        if (needsFacebookLink && typeof venue.facebook_url === "string" && venue.facebook_url !== "") {
          patch.facebookUrl = venue.facebook_url;
          attached.push("Facebook (link only)");
        }
      }
    } catch (e) {
      skipped.push({
        label: "Eet.nu",
        reason: e instanceof Error ? e.message : String(e)
      });
    }
  }
  for (const label of ["TripAdvisor", "Yelp", "TheFork", "OpenTable"]) {
    const rated = {
      TripAdvisor: spot.external.tripadvisorRating,
      Yelp: spot.external.yelpRating,
      TheFork: spot.external.theforkRating,
      OpenTable: spot.external.opentableRating
    };
    if (rated[label] === void 0) skipped.push({ label, reason: WALLED });
  }
  return { patch, attached, skipped };
}

// src/import/places.ts
var BASE = "https://maps.googleapis.com/maps/api/place";
var CUISINE_BY_TYPE = {
  seafood_restaurant: "Seafood",
  chinese_restaurant: "Chinese",
  thai_restaurant: "Thai",
  indian_restaurant: "Indian",
  italian_restaurant: "Italian",
  japanese_restaurant: "Japanese",
  sushi_restaurant: "Sushi",
  french_restaurant: "French",
  mexican_restaurant: "Mexican",
  korean_restaurant: "Korean",
  vietnamese_restaurant: "Vietnamese",
  turkish_restaurant: "Turkish",
  greek_restaurant: "Greek",
  spanish_restaurant: "Spanish",
  american_restaurant: "American",
  brazilian_restaurant: "Brazilian",
  lebanese_restaurant: "Lebanese",
  middle_eastern_restaurant: "Middle Eastern",
  mediterranean_restaurant: "Mediterranean",
  asian_restaurant: "Asian",
  ramen_restaurant: "Ramen",
  pizza_restaurant: "Pizza",
  hamburger_restaurant: "Burgers",
  steak_house: "Steakhouse",
  barbecue_restaurant: "BBQ",
  vegetarian_restaurant: "Vegetarian",
  vegan_restaurant: "Vegan",
  breakfast_restaurant: "Breakfast",
  brunch_restaurant: "Brunch",
  cafe: "Caf\xE9",
  coffee_shop: "Coffee",
  bakery: "Bakery",
  bar: "Bar",
  wine_bar: "Wine bar",
  pub: "Pub",
  fine_dining_restaurant: "Fine dining",
  buffet_restaurant: "Buffet",
  fast_food_restaurant: "Fast food",
  dessert_shop: "Desserts",
  ice_cream_shop: "Ice cream",
  sandwich_shop: "Sandwiches",
  african_restaurant: "African",
  indonesian_restaurant: "Indonesian",
  afghani_restaurant: "Afghan",
  tapas_restaurant: "Tapas",
  persian_restaurant: "Persian",
  sushi_bar: "Sushi",
  bar_and_grill: "Grill",
  bagel_shop: "Bagels",
  donut_shop: "Donuts",
  juice_shop: "Juice",
  tea_house: "Tea",
  chocolate_shop: "Chocolate",
  candy_store: "Sweets",
  deli: "Deli",
  diner: "Diner"
};
var DETAILS_FIELDS = [
  "name",
  "formatted_address",
  "address_component",
  "geometry",
  "price_level",
  "rating",
  "user_ratings_total",
  "website",
  "international_phone_number",
  "place_id",
  "photo",
  "opening_hours"
].join(",");
var FIND_PLACE_FIELDS = [
  "place_id",
  "name",
  "formatted_address",
  "geometry",
  "rating",
  "user_ratings_total",
  "price_level"
].join(",");
var PlacesError = class extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "PlacesError";
  }
};
var NEXT_PAGE_DELAY_MS = 2e3;
function componentValue(comps, ...types) {
  for (const wanted of types) {
    for (const comp of comps) {
      if (comp.types?.includes(wanted) === true) {
        const v = comp.long_name ?? comp.short_name;
        if (v !== void 0 && v.trim() !== "") return v.trim();
      }
    }
  }
  return void 0;
}
function mapLocation(raw) {
  const loc = raw.geometry?.location;
  if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
    return { lat: loc.lat, lng: loc.lng };
  }
  return void 0;
}
function mapPriceLevel(level) {
  if (level === void 0 || level < 1) return void 0;
  return Math.min(level, 4);
}
var DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
function mapClockTime(time) {
  if (typeof time !== "string" || !/^\d{4}$/.test(time)) return void 0;
  return `${time.slice(0, 2)}:${time.slice(2)}`;
}
function mapOpeningHours(raw) {
  const periods = raw.opening_hours?.periods;
  if (periods === void 0 || periods.length === 0) return void 0;
  if (periods.length === 1 && periods[0].close === void 0) {
    return DAY_ORDER.map((d) => `${DAY_LABELS[d]} 00:00-23:59`);
  }
  const byDay = /* @__PURE__ */ new Map();
  for (const period of periods) {
    const day = period.open?.day;
    if (typeof day !== "number" || day < 0 || day > 6) continue;
    const open = mapClockTime(period.open?.time);
    const close = mapClockTime(period.close?.time);
    if (open === void 0 || close === void 0) return void 0;
    const ranges = byDay.get(day) ?? [];
    ranges.push(`${open}-${close}`);
    byDay.set(day, ranges);
  }
  if (byDay.size === 0) return void 0;
  return DAY_ORDER.map((day) => {
    const ranges = byDay.get(day);
    return ranges === void 0 || ranges.length === 0 ? `${DAY_LABELS[day]} closed` : `${DAY_LABELS[day]} ${ranges.sort().join(",")}`;
  });
}
function toCandidate(raw) {
  if (raw.place_id === void 0 || raw.name === void 0) return null;
  const candidate = {
    placeId: raw.place_id,
    name: raw.name,
    address: raw.formatted_address ?? raw.vicinity ?? ""
  };
  if (typeof raw.rating === "number") candidate.rating = raw.rating;
  if (typeof raw.user_ratings_total === "number") candidate.ratingCount = raw.user_ratings_total;
  const price = mapPriceLevel(raw.price_level);
  if (price !== void 0) candidate.priceLevel = price;
  const location = mapLocation(raw);
  if (location) candidate.location = location;
  return candidate;
}
function toPhotoCandidate(raw) {
  const base = toCandidate(raw);
  if (base === null) return null;
  const ref = raw.photos?.[0]?.photo_reference;
  if (typeof ref !== "string" || ref === "") return base;
  return { ...base, photoRef: ref };
}
function toPaged(data) {
  const out = {
    candidates: (data.results ?? []).map(toPhotoCandidate).filter((c) => c !== null)
  };
  const token = data.next_page_token;
  if (typeof token === "string" && token !== "") out.nextPageToken = token;
  return out;
}
var PlacesClient = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  hasKey() {
    const key = this.plugin.settings.apiKeys.googlePlaces;
    return key !== void 0 && key.trim() !== "";
  }
  key() {
    const key = this.plugin.settings.apiKeys.googlePlaces?.trim();
    if (key === void 0 || key === "") {
      throw new PlacesError(
        "No Google Places API key configured. Add one under Settings \u2192 Food Spot \u2192 API."
      );
    }
    return key;
  }
  async call(path, params) {
    const qs = new URLSearchParams({ ...params, key: this.key() });
    const url = `${BASE}/${path}/json?${qs.toString()}`;
    const res = await fetchWithTimeout(url, {
      throw: false,
      skipBotCheck: true,
      headers: { accept: "application/json" }
    });
    let data;
    try {
      data = res.json;
      if (typeof data !== "object" || data === null) throw new Error("not an object");
    } catch {
      throw new PlacesError(`Google Places returned an unreadable response (HTTP ${res.status}).`);
    }
    const status = data.status ?? "";
    if (status === "OK" || status === "ZERO_RESULTS") return data;
    const detail = data.error_message !== void 0 ? ` \u2014 ${data.error_message}` : "";
    throw new PlacesError(`Google Places error: ${status}${detail}`, status);
  }
  /** Text Search — Add modal "Search online". */
  async textSearch(query, near) {
    const params = { query };
    if (near) {
      params.location = `${near.lat},${near.lng}`;
      params.radius = "2000";
    }
    const data = await this.call("textsearch", params);
    return (data.results ?? []).map(toCandidate).filter((c) => c !== null);
  }
  /**
   * Text Search keeping Google's pagination cursor — Discover tab. Photo
   * references ride along so tiles can pull a thumbnail on demand.
   */
  async textSearchPaged(query) {
    return toPaged(await this.call("textsearch", { query }));
  }
  /**
   * Fetch the next page of a `textSearchPaged` run. The caller MUST wait
   * NEXT_PAGE_DELAY_MS after receiving the token — an early call comes back
   * INVALID_REQUEST, which surfaces verbatim like any other Places error.
   */
  async textSearchNextPage(token) {
    return toPaged(await this.call("textsearch", { pagetoken: token }));
  }
  /** Find Place from text, optionally biased to a circle around coordinates. */
  async findPlace(input, near, radiusMeters = 200) {
    const params = {
      input,
      inputtype: "textquery",
      fields: FIND_PLACE_FIELDS
    };
    if (near) params.locationbias = `circle:${radiusMeters}@${near.lat},${near.lng}`;
    const data = await this.call("findplacefromtext", params);
    return (data.candidates ?? []).map(toCandidate).filter((c) => c !== null);
  }
  /** Place Details with the fixed field mask; maps address components. */
  /**
   * Cuisines from the Places API (New): the legacy details endpoint only
   * reports generic types ("restaurant", "food"), while v1 exposes real ones
   * ("seafood_restaurant"). Best-effort — never throws, empty on failure.
   */
  async cuisinesFor(placeId) {
    if (!this.hasKey()) return [];
    const key = this.key();
    try {
      const res = await fetchWithTimeout(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=types,primaryTypeDisplayName`,
        { headers: { "X-Goog-Api-Key": key }, throw: false }
      );
      if (res.status >= 400) return [];
      const body = JSON.parse(res.text);
      const out = [];
      for (const t of body.types ?? []) {
        const name = CUISINE_BY_TYPE[t];
        if (name !== void 0 && !out.includes(name)) out.push(name);
      }
      if (out.length === 0) {
        const primary = (body.primaryTypeDisplayName?.text ?? "").replace(/\s*Restaurant$/i, "").trim();
        if (primary !== "" && primary.toLowerCase() !== "restaurant") out.push(primary);
      }
      return out.slice(0, 3);
    } catch {
      return [];
    }
  }
  async details(placeId) {
    const data = await this.call("details", {
      place_id: placeId,
      fields: DETAILS_FIELDS
    });
    const raw = data.result;
    if (raw === void 0) {
      throw new PlacesError(`Google Places returned no details for place ${placeId}.`);
    }
    const comps = raw.address_components ?? [];
    const details = {
      placeId: raw.place_id ?? placeId,
      name: raw.name,
      address: raw.formatted_address,
      country: componentValue(comps, "country"),
      city: componentValue(comps, "locality", "postal_town"),
      district: componentValue(comps, "sublocality_level_1", "sublocality", "neighborhood"),
      location: mapLocation(raw),
      priceLevel: mapPriceLevel(raw.price_level),
      website: raw.website,
      phone: raw.international_phone_number
    };
    if (typeof raw.rating === "number") details.rating = raw.rating;
    if (typeof raw.user_ratings_total === "number") details.ratingCount = raw.user_ratings_total;
    const photoRef = raw.photos?.[0]?.photo_reference;
    if (typeof photoRef === "string" && photoRef !== "") details.photoReference = photoRef;
    const hours = mapOpeningHours(raw);
    if (hours !== void 0) details.hours = hours;
    return details;
  }
  /**
   * Download a place photo via the Place Photo endpoint. requestUrl follows
   * the redirect to the image internally; non-2xx statuses surface as errors.
   * The body is validated (non-empty, image/* content type) so an HTML error
   * page or empty response never lands in the vault as a corrupt "photo";
   * the file extension is derived from the content type.
   */
  async fetchPlacePhoto(photoReference, maxWidth = 640) {
    const qs = new URLSearchParams({
      maxwidth: String(maxWidth),
      photo_reference: photoReference,
      key: this.key()
    });
    const url = `${BASE}/photo?${qs.toString()}`;
    const res = await fetchWithTimeout(url, {
      throw: false,
      skipBotCheck: true,
      headers: { accept: "image/*" }
    });
    if (res.status >= 400) {
      throw new PlacesError(`Google Place Photo request failed (HTTP ${res.status}).`);
    }
    const headers = res.headers ?? {};
    let contentType = "";
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === "content-type") {
        contentType = (headers[key] ?? "").split(";")[0].trim().toLowerCase();
        break;
      }
    }
    if (!contentType.startsWith("image/")) {
      throw new PlacesError(
        `Google Place Photo returned ${contentType === "" ? "no content type" : contentType} instead of an image.`
      );
    }
    const data = res.arrayBuffer;
    if (!data || data.byteLength === 0) {
      throw new PlacesError("Google Place Photo returned an empty body.");
    }
    const EXT_BY_TYPE = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/avif": "avif"
    };
    return { data, ext: EXT_BY_TYPE[contentType] ?? "jpg" };
  }
};

// src/import/pipeline.ts
var ENRICH_BIAS_RADIUS_METERS = 200;
var BULK_THROTTLE_MS = 400;
var PHOTO_MAX_WIDTH = 640;
function errMsg(e) {
  return e instanceof Error ? e.message : String(e);
}
var EnrichStepError = class extends Error {
  constructor(message, partial) {
    super(message);
    this.partial = partial;
    this.name = "EnrichStepError";
  }
};
function describeSourceFailure(f) {
  const msg = errMsg(f.e);
  if (f.e instanceof BotCheckError || /\b403\b/.test(msg)) {
    const key = f.label.toLowerCase().replace(/[^a-z]/g, "");
    return `${f.label} blocks automated fetches \u2014 the rating can\u2019t be pulled. You can type it into the note yourself (e.g. "${key}_rating: 4.5").`;
  }
  return `${f.label}: ${msg}`;
}
function isTripadvisorUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase().includes("tripadvisor.");
  } catch {
    return false;
  }
}
function isBlank(v) {
  return v === void 0 || v.trim() === "";
}
function sleep2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function sanitizeFileName2(name) {
  return name.replace(/[\\/:*?"<>|#^[\]]/g, " ").replace(/\s+/g, " ").trim();
}
function normalizeName(name) {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function haversineMeters(a, b) {
  const R = 6371e3;
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
var ImportPipeline = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.places = new PlacesClient(plugin);
  }
  hasGoogleKey() {
    return this.places.hasKey();
  }
  discoverSources(spot, onProgress) {
    return discoverSources(spot, onProgress);
  }
  // -------------------------------------------------------------------------
  // URL import
  // -------------------------------------------------------------------------
  async importFromUrl(url) {
    const trimmed2 = url.trim();
    const resolved = await resolveRedirects(trimmed2);
    const importer = pickImporter(resolved.finalUrl);
    let html = resolved.html ?? null;
    let botChecked = false;
    if (html === null) {
      try {
        const res = await fetchWithTimeout(resolved.finalUrl, { throw: false });
        html = res.status < 400 && typeof res.text === "string" ? res.text : null;
      } catch (e) {
        if (e instanceof BotCheckError) {
          if (importer.kind === "generic") throw e;
          botChecked = true;
        }
        html = null;
      }
    }
    const draft = importer.parse(resolved.finalUrl, html);
    if (botChecked) {
      draft.warnings.push(
        "The site showed a bot-check page \u2014 parsed what was possible from the URL alone."
      );
    } else if (html === null) {
      draft.warnings.push("Could not load the page body \u2014 parsed from the URL alone.");
    }
    await this.enrich(draft);
    return draft;
  }
  /** Google Places enrichment: Find Place (biased 200m when coords) → Details. */
  async enrich(draft) {
    if (!this.hasGoogleKey()) return;
    const name = draft.fields.name;
    const coords = draft.fields.coordinates;
    if (name === void 0 && coords === void 0) return;
    if (name === void 0) {
      draft.warnings.push(
        "Coordinates found but no name \u2014 skipped Google Places enrichment."
      );
      return;
    }
    try {
      const candidates = await this.places.findPlace(name, coords, ENRICH_BIAS_RADIUS_METERS);
      const first = candidates[0];
      if (first === void 0) {
        draft.warnings.push(`Google Places found no match for "${name}".`);
        return;
      }
      const details = await this.places.details(first.placeId);
      this.mergeDetails(draft, details);
    } catch (e) {
      draft.warnings.push(`Google Places enrichment failed: ${errMsg(e)}`);
    }
  }
  /** Fold Place Details into a draft: high confidence, never clobbers existing high fields. */
  mergeDetails(draft, details) {
    setDraftField(draft, "name", details.name, "high");
    setDraftField(draft, "address", details.address, "high");
    setDraftField(draft, "country", details.country, "high");
    setDraftField(draft, "city", details.city, "high");
    setDraftField(draft, "district", details.district, "high");
    setDraftField(draft, "coordinates", details.location, "high");
    setDraftField(draft, "price", details.priceLevel, "high");
    setDraftField(draft, "cuisines", details.cuisines, "high");
    setDraftField(draft, "url", details.website, "high");
    setDraftField(draft, "phone", details.phone, "high");
    setDraftField(draft, "hours", details.hours, "high");
    mergeExternal(draft, {
      googlePlaceId: details.placeId,
      googleRating: details.rating,
      googleRatingCount: details.ratingCount,
      ratingsUpdated: todayIso()
    });
  }
  // -------------------------------------------------------------------------
  // Places search (Add modal)
  // -------------------------------------------------------------------------
  async searchPlaces(query, near) {
    return this.places.textSearch(query, near);
  }
  async placeDetails(placeId) {
    const details = await this.places.details(placeId);
    if (details.cuisines === void 0 || details.cuisines.length === 0) {
      const cuisines = await this.places.cuisinesFor(placeId);
      if (cuisines.length > 0) details.cuisines = cuisines;
    }
    const sourceUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    const draft = {
      fields: { source: "google-maps", sourceUrl },
      confidence: { source: "high", sourceUrl: "high" },
      importerKind: "google-maps",
      sourceUrl,
      warnings: []
    };
    this.mergeDetails(draft, details);
    return draft;
  }
  // -------------------------------------------------------------------------
  // Rating refresh (Google API + TripAdvisor/Yelp/TheFork page JSON-LD)
  // -------------------------------------------------------------------------
  /** Resolve a spot to Place Details: stored place_id else Find Place ("name city"). */
  async resolveDetails(spot) {
    let placeId = spot.external.googlePlaceId;
    if (placeId === void 0) {
      const query = [spot.name, spot.city].filter((x) => x !== void 0 && x !== "").join(" ");
      const candidates = await this.places.findPlace(
        query,
        spot.coordinates,
        ENRICH_BIAS_RADIUS_METERS
      );
      placeId = candidates[0]?.placeId;
    }
    if (placeId === void 0) return null;
    return this.places.details(placeId);
  }
  /** Fetch a rating-source page and extract its JSON-LD (BotCheckError propagates). */
  async fetchPageJsonLd(url) {
    const res = await fetchWithTimeout(url);
    return typeof res.text === "string" ? extractJsonLd(res.text) : null;
  }
  async refreshRatings(spot, onWarning) {
    const out = {};
    const errors = [];
    if (this.hasGoogleKey()) {
      try {
        const details = await this.resolveDetails(spot);
        if (details !== null) {
          out.googlePlaceId = details.placeId;
          if (details.rating !== void 0) out.googleRating = details.rating;
          if (details.ratingCount !== void 0) out.googleRatingCount = details.ratingCount;
        }
      } catch (e) {
        errors.push({ label: "Google", e });
      }
    }
    Object.assign(out, await this.fetchSourceRatings(spot, errors));
    for (const f of errors) onWarning?.(describeSourceFailure(f));
    if (Object.keys(out).length === 0) {
      if (errors.length > 0 && onWarning === void 0) throw errors[0].e;
      return null;
    }
    out.ratingsUpdated = todayIso();
    return out;
  }
  /**
   * Fetch every linked rating-source page (TripAdvisor / Yelp / TheFork) and
   * extract its JSON-LD rating. Per-source failures land in `errors` and skip
   * that source only. Shared by refreshRatings and enrichSpot.
   */
  async fetchSourceRatings(spot, errors) {
    const out = {};
    const sourceUrl = spot.sourceUrl ?? "";
    const tripadvisorUrl = spot.external.tripadvisorUrl ?? (isTripadvisorUrl(sourceUrl) ? sourceUrl : void 0);
    if (tripadvisorUrl !== void 0) {
      try {
        const ld = await this.fetchPageJsonLd(tripadvisorUrl);
        if (ld !== null && ld.rating !== void 0) {
          out.tripadvisorRating = ld.rating;
          if (ld.ratingCount !== void 0) out.tripadvisorRatingCount = ld.ratingCount;
          if (spot.external.tripadvisorUrl === void 0) out.tripadvisorUrl = tripadvisorUrl;
        }
      } catch (e) {
        errors.push({ label: "TripAdvisor", e });
      }
    }
    if (spot.external.yelpUrl !== void 0) {
      try {
        const ld = await this.fetchPageJsonLd(spot.external.yelpUrl);
        if (ld !== null && ld.rating !== void 0) {
          out.yelpRating = ld.rating;
          if (ld.ratingCount !== void 0) out.yelpRatingCount = ld.ratingCount;
        }
      } catch (e) {
        errors.push({ label: "Yelp", e });
      }
    }
    if (spot.external.theforkUrl !== void 0) {
      try {
        const ld = await this.fetchPageJsonLd(spot.external.theforkUrl);
        const thefork10 = ld !== null ? theforkRating10(ld) : void 0;
        if (ld !== null && thefork10 !== void 0) {
          out.theforkRating = thefork10;
          if (ld.ratingCount !== void 0) out.theforkRatingCount = ld.ratingCount;
        }
      } catch (e) {
        errors.push({ label: "TheFork", e });
      }
    }
    if (spot.external.facebookUrl !== void 0) {
      try {
        const ld = await this.fetchPageJsonLd(spot.external.facebookUrl);
        if (ld !== null && ld.rating !== void 0) {
          out.facebookRating = ld.rating;
          if (ld.ratingCount !== void 0) out.facebookRatingCount = ld.ratingCount;
        }
      } catch (e) {
        errors.push({ label: "Facebook", e });
      }
    }
    if (spot.external.opentableUrl !== void 0) {
      try {
        const ld = await this.fetchPageJsonLd(spot.external.opentableUrl);
        if (ld !== null && ld.rating !== void 0) {
          out.opentableRating = ld.rating;
          if (ld.ratingCount !== void 0) out.opentableRatingCount = ld.ratingCount;
        }
      } catch (e) {
        errors.push({ label: "OpenTable", e });
      }
    }
    if (spot.external.eetnuUrl !== void 0) {
      try {
        const ld = await this.fetchPageJsonLd(spot.external.eetnuUrl);
        const eetnu10 = ld !== null ? theforkRating10(ld) : void 0;
        if (ld !== null && eetnu10 !== void 0) {
          out.eetnuRating = eetnu10;
          if (ld.ratingCount !== void 0) out.eetnuRatingCount = ld.ratingCount;
        }
      } catch (e) {
        errors.push({ label: "Eet.nu", e });
      }
    }
    return out;
  }
  // -------------------------------------------------------------------------
  // Enrichment (single spot + bulk)
  // -------------------------------------------------------------------------
  /**
   * Fill-gaps-only single-spot enrichment (see ImportPipelineApi contract).
   * Google fields come from one Details call; the photo is downloaded into
   * settings.mediaFolder; the menu URL is discovered on the spot's website.
   */
  async enrichSpot(spot, opts) {
    const overwrite = opts.overwrite === true;
    const out = {};
    const ext = {};
    let photoError = null;
    const wantsGoogle = opts.photo || opts.ratings || opts.coords || opts.address;
    let details = null;
    if (wantsGoogle && this.hasGoogleKey()) {
      details = await this.resolveDetails(spot);
    }
    if (details !== null) {
      if (spot.external.googlePlaceId !== details.placeId) ext.googlePlaceId = details.placeId;
      if (opts.coords && details.location !== void 0 && (overwrite || spot.coordinates === void 0)) {
        out.coordinates = details.location;
      }
      if (opts.address) {
        if (details.address !== void 0 && (overwrite || isBlank(spot.address))) {
          out.address = details.address;
        }
        if (details.city !== void 0 && (overwrite || isBlank(spot.city))) out.city = details.city;
        if (details.district !== void 0 && (overwrite || isBlank(spot.district))) {
          out.district = details.district;
        }
        if (details.country !== void 0 && (overwrite || isBlank(spot.country))) {
          out.country = details.country;
        }
        if (details.hours !== void 0 && (overwrite || (spot.hours ?? []).length === 0)) {
          out.hours = details.hours;
        }
      }
      if (details.priceLevel !== void 0 && spot.price === void 0) {
        out.price = details.priceLevel;
      }
      if (details.website !== void 0 && isBlank(spot.url)) out.url = details.website;
      if (details.phone !== void 0 && isBlank(spot.phone)) out.phone = details.phone;
      if (opts.ratings) {
        if (details.rating !== void 0) ext.googleRating = details.rating;
        if (details.ratingCount !== void 0) ext.googleRatingCount = details.ratingCount;
      }
      if (opts.photo && details.photoReference !== void 0 && (overwrite || isBlank(spot.photo))) {
        try {
          out.photo = await this.downloadPhoto(spot.name, details.photoReference);
        } catch (e) {
          photoError = errMsg(e);
        }
      }
    }
    if (opts.ratings) {
      Object.assign(ext, await this.fetchSourceRatings(spot, []));
    }
    if (spot.cuisines.length === 0 && details?.placeId !== void 0) {
      const cuisines = await this.places.cuisinesFor(details.placeId);
      if (cuisines.length > 0) out.cuisines = cuisines;
    }
    if (opts.menu && (overwrite || isBlank(spot.menu))) {
      const website = out.url ?? spot.url;
      if (!isBlank(website)) {
        const menu = await this.discoverMenu(website);
        if (menu !== null) out.menu = menu;
      }
    }
    if (opts.discoverSources === true) {
      try {
        const found = await discoverSources(spot);
        Object.assign(ext, found.patch);
      } catch {
      }
    }
    if (Object.keys(ext).length > 0) {
      const external = { ...spot.external, ...ext };
      const fetchedRating = ext.googleRating !== void 0 || ext.tripadvisorRating !== void 0 || ext.yelpRating !== void 0 || ext.theforkRating !== void 0 || ext.opentableRating !== void 0 || ext.eetnuRating !== void 0 || ext.facebookRating !== void 0;
      if (fetchedRating) external.ratingsUpdated = todayIso();
      out.external = external;
    }
    const gathered = Object.keys(out).length > 0 ? out : null;
    if (photoError !== null) {
      throw new EnrichStepError(`photo download failed \u2014 ${photoError}`, gathered);
    }
    return gathered;
  }
  async bulkEnrich(spots, opts, onProgress, signal) {
    let updated = 0;
    let skipped = 0;
    const failed = [];
    let done = 0;
    for (const spot of spots) {
      if (signal.cancelled) break;
      onProgress(done, spots.length, spot.name);
      try {
        const fresh = this.plugin.store.getByPath(spot.path);
        if (fresh === void 0) {
          skipped += 1;
        } else {
          const partial = await this.enrichSpot(fresh, opts);
          if (partial !== null) {
            await this.plugin.store.updateSpot(fresh.path, partial);
            updated += 1;
          } else {
            skipped += 1;
          }
        }
      } catch (e) {
        if (e instanceof EnrichStepError && e.partial !== null) {
          try {
            await this.plugin.store.updateSpot(spot.path, e.partial);
          } catch {
          }
        }
        failed.push(spot.name);
      }
      done += 1;
      onProgress(done, spots.length, spot.name);
      if (signal.cancelled) break;
      if (done < spots.length) await sleep2(BULK_THROTTLE_MS);
    }
    return { updated, skipped, failed };
  }
  /** Download the place photo into settings.mediaFolder; returns the vault path. */
  async downloadPhoto(spotName, photoReference) {
    const { data, ext } = await this.places.fetchPlacePhoto(photoReference, PHOTO_MAX_WIDTH);
    const app = this.plugin.app;
    const folder = this.plugin.settings.mediaFolder.replace(/^\/+|\/+$/g, "");
    await ensureFolder(app, folder);
    const base = sanitizeFileName2(spotName) || "spot";
    const prefix = folder ? `${folder}/` : "";
    let candidate = `${prefix}${base}.${ext}`;
    let n = 2;
    while (app.vault.getAbstractFileByPath(candidate)) {
      candidate = `${prefix}${base} ${n}.${ext}`;
      n += 1;
    }
    await app.vault.createBinary(candidate, data);
    return candidate;
  }
  /** Best-effort menu-link discovery on the spot's website; null on any failure. */
  async discoverMenu(websiteUrl) {
    try {
      const res = await fetchWithTimeout(websiteUrl, { throw: false });
      if (res.status >= 400 || typeof res.text !== "string") return null;
      return findMenuUrl(res.text, websiteUrl);
    } catch {
      return null;
    }
  }
  // -------------------------------------------------------------------------
  // Duplicate detection
  // -------------------------------------------------------------------------
  /**
   * Normalized-name equality AND-ed with distance: when both sides have
   * coordinates the spot must be within the configured radius (same name far
   * apart = a chain, NOT a duplicate — v0.1 got this wrong). When either side
   * lacks coordinates, a name match still flags, ordered after
   * distance-confirmed hits (closest first). place_id equality ranks first.
   */
  findDuplicates(draft, spots) {
    if (!this.plugin.settings.duplicateDetectionEnabled) return [];
    const radius = this.plugin.settings.duplicateDetectionRadiusMeters;
    const draftPlaceId = draft.external?.googlePlaceId;
    const draftName = draft.name !== void 0 ? normalizeName(draft.name) : "";
    const draftCoords = draft.coordinates;
    const hits = [];
    for (const spot of spots) {
      if (draftPlaceId !== void 0 && spot.external.googlePlaceId === draftPlaceId) {
        hits.push({ spot, rank: 0, dist: 0 });
        continue;
      }
      if (draftName === "" || normalizeName(spot.name) !== draftName) continue;
      if (draftCoords !== void 0 && spot.coordinates !== void 0) {
        const dist = haversineMeters(draftCoords, spot.coordinates);
        if (dist <= radius) hits.push({ spot, rank: 1, dist });
      } else {
        hits.push({ spot, rank: 2, dist: Number.POSITIVE_INFINITY });
      }
    }
    hits.sort((a, b) => a.rank - b.rank || a.dist - b.dist);
    const seen = /* @__PURE__ */ new Set();
    const result = [];
    for (const hit of hits) {
      if (!seen.has(hit.spot.path)) {
        seen.add(hit.spot.path);
        result.push(hit.spot);
      }
    }
    return result;
  }
};

// src/ui/view.ts
var import_obsidian31 = require("obsidian");

// src/ui/tabs/spots.ts
var import_obsidian21 = require("obsidian");

// node_modules/fuse.js/dist/fuse.mjs
function isArray(value) {
  return !Array.isArray ? getTag(value) === "[object Array]" : Array.isArray(value);
}
function baseToString(value) {
  if (typeof value == "string") return value;
  if (typeof value === "bigint") return value.toString();
  const result = value + "";
  return result == "0" && 1 / value == -Infinity ? "-0" : result;
}
function toString(value) {
  return value == null ? "" : baseToString(value);
}
function isString(value) {
  return typeof value === "string";
}
function isNumber(value) {
  return typeof value === "number";
}
function isBoolean(value) {
  return value === true || value === false || isObjectLike(value) && getTag(value) == "[object Boolean]";
}
function isObject(value) {
  return typeof value === "object";
}
function isObjectLike(value) {
  return isObject(value) && value !== null;
}
function isDefined(value) {
  return value !== void 0 && value !== null;
}
function isBlank2(value) {
  return !value.trim().length;
}
function getTag(value) {
  return value == null ? value === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(value);
}
var INCORRECT_INDEX_TYPE = "Incorrect 'index' type";
var INVALID_DOC_INDEX = "Invalid doc index: must be a non-negative integer within the bounds of the docs array";
var LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY = (key) => `Invalid value for key ${key}`;
var PATTERN_LENGTH_TOO_LARGE = (max) => `Pattern length exceeds max of ${max}.`;
var MISSING_KEY_PROPERTY = (name) => `Missing ${name} property in key`;
var INVALID_KEY_WEIGHT_VALUE = (key) => `Property 'weight' in key '${key}' must be a positive integer`;
var FUSE_MATCH_TOKEN_SEARCH_UNSUPPORTED = "Fuse.match does not support useTokenSearch: token search requires corpus-level statistics (df, fieldCount) that a one-off string comparison does not have. Use new Fuse(...).search(...) instead.";
var hasOwn = Object.prototype.hasOwnProperty;
var KeyStore = class {
  constructor(keys) {
    this._keys = [];
    this._keyMap = {};
    let totalWeight = 0;
    keys.forEach((key) => {
      const obj = createKey(key);
      this._keys.push(obj);
      this._keyMap[obj.id] = obj;
      totalWeight += obj.weight;
    });
    this._keys.forEach((key) => {
      key.weight /= totalWeight;
    });
  }
  get(keyId) {
    return this._keyMap[keyId];
  }
  keys() {
    return this._keys;
  }
  toJSON() {
    return JSON.stringify(this._keys);
  }
};
function createKey(key) {
  let path = null;
  let id = null;
  let src = null;
  let weight = 1;
  let getFn = null;
  if (isString(key) || isArray(key)) {
    src = key;
    path = createKeyPath(key);
    id = createKeyId(key);
  } else {
    if (!hasOwn.call(key, "name")) throw new Error(MISSING_KEY_PROPERTY("name"));
    const name = key.name;
    src = name;
    if (hasOwn.call(key, "weight") && key.weight !== void 0) {
      weight = key.weight;
      if (weight <= 0) throw new Error(INVALID_KEY_WEIGHT_VALUE(createKeyId(name)));
    }
    path = createKeyPath(name);
    id = createKeyId(name);
    getFn = key.getFn ?? null;
  }
  return {
    path,
    id,
    weight,
    src,
    getFn
  };
}
function createKeyPath(key) {
  return isArray(key) ? key : key.split(".");
}
function createKeyId(key) {
  return isArray(key) ? key.join(".") : key;
}
function get(obj, path) {
  const list = [];
  let arr = false;
  const deepGet = (obj2, path2, index, arrayIndex) => {
    if (!isDefined(obj2)) return;
    if (!path2[index]) list.push(arrayIndex !== void 0 ? {
      v: obj2,
      i: arrayIndex
    } : obj2);
    else {
      const value = obj2[path2[index]];
      if (!isDefined(value)) return;
      if (index === path2.length - 1 && (isString(value) || isNumber(value) || isBoolean(value) || typeof value === "bigint")) list.push(arrayIndex !== void 0 ? {
        v: toString(value),
        i: arrayIndex
      } : toString(value));
      else if (isArray(value)) {
        arr = true;
        for (let i = 0, len = value.length; i < len; i += 1) deepGet(value[i], path2, index + 1, i);
      } else if (path2.length) deepGet(value, path2, index + 1, arrayIndex);
    }
  };
  deepGet(obj, isString(path) ? path.split(".") : path, 0);
  return arr ? list : list[0];
}
var MatchOptions = {
  includeMatches: false,
  findAllMatches: false,
  minMatchCharLength: 1
};
var BasicOptions = {
  isCaseSensitive: false,
  ignoreDiacritics: false,
  includeScore: false,
  keys: [],
  shouldSort: true,
  sortFn: (a, b) => a.score === b.score ? a.idx < b.idx ? -1 : 1 : a.score < b.score ? -1 : 1
};
var FuzzyOptions = {
  location: 0,
  threshold: 0.6,
  distance: 100
};
var AdvancedOptions = {
  useExtendedSearch: false,
  useTokenSearch: false,
  tokenize: void 0,
  tokenMatch: "any",
  getFn: get,
  ignoreLocation: false,
  ignoreFieldNorm: false,
  fieldNormWeight: 1
};
var Config = Object.freeze({
  ...BasicOptions,
  ...MatchOptions,
  ...FuzzyOptions,
  ...AdvancedOptions
});
function isWordSeparator(code) {
  return code >= 9 && code <= 13 || code === 32 || code === 160;
}
function norm(weight = 1, mantissa = 3) {
  const cache = /* @__PURE__ */ new Map();
  const m = Math.pow(10, mantissa);
  return {
    get(value) {
      let numTokens = 0;
      let inWord = false;
      for (let i = 0; i < value.length; i++) if (!isWordSeparator(value.charCodeAt(i))) {
        if (!inWord) {
          numTokens++;
          inWord = true;
        }
      } else inWord = false;
      if (numTokens === 0) numTokens = 1;
      if (cache.has(numTokens)) return cache.get(numTokens);
      const n = Math.round(m / Math.pow(numTokens, 0.5 * weight)) / m;
      cache.set(numTokens, n);
      return n;
    },
    clear() {
      cache.clear();
    }
  };
}
var FuseIndex = class {
  constructor({ getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
    this.norm = norm(fieldNormWeight, 3);
    this.getFn = getFn;
    this.isCreated = false;
    this.docs = [];
    this.keys = [];
    this._keysMap = {};
    this.setIndexRecords();
  }
  setSources(docs = []) {
    this.docs = docs;
  }
  setIndexRecords(records = []) {
    this.records = records;
  }
  setKeys(keys = []) {
    this.keys = keys;
    this._keysMap = {};
    keys.forEach((key, idx) => {
      this._keysMap[key.id] = idx;
    });
  }
  create() {
    if (this.isCreated || !this.docs.length) return;
    this.isCreated = true;
    const len = this.docs.length;
    this.records = new Array(len);
    let recordCount = 0;
    if (isString(this.docs[0])) for (let i = 0; i < len; i++) {
      const record = this._createStringRecord(this.docs[i], i);
      if (record) this.records[recordCount++] = record;
    }
    else for (let i = 0; i < len; i++) this.records[recordCount++] = this._createObjectRecord(this.docs[i], i);
    this.records.length = recordCount;
    this.norm.clear();
  }
  add(doc, docIndex) {
    if (!Number.isInteger(docIndex) || docIndex < 0) throw new Error(INVALID_DOC_INDEX);
    if (isString(doc)) {
      const record2 = this._createStringRecord(doc, docIndex);
      if (record2) this.records.push(record2);
      return record2;
    }
    const record = this._createObjectRecord(doc, docIndex);
    this.records.push(record);
    return record;
  }
  removeAt(idx) {
    if (!Number.isInteger(idx) || idx < 0) throw new Error(INVALID_DOC_INDEX);
    for (let i = 0, len = this.records.length; i < len; i += 1) if (this.records[i].i === idx) {
      this.records.splice(i, 1);
      break;
    }
    for (let i = 0, len = this.records.length; i < len; i += 1) if (this.records[i].i > idx) this.records[i].i -= 1;
  }
  removeAll(indices) {
    const toRemove = /* @__PURE__ */ new Set();
    for (const v of indices) if (Number.isInteger(v) && v >= 0) toRemove.add(v);
    if (toRemove.size === 0) return;
    this.records = this.records.filter((r) => !toRemove.has(r.i));
    const sorted = Array.from(toRemove).sort((a, b) => a - b);
    for (const record of this.records) {
      let lo = 0;
      let hi = sorted.length;
      while (lo < hi) {
        const mid = lo + hi >>> 1;
        if (sorted[mid] < record.i) lo = mid + 1;
        else hi = mid;
      }
      record.i -= lo;
    }
  }
  getValueForItemAtKeyId(item, keyId) {
    return item[this._keysMap[keyId]];
  }
  size() {
    return this.records.length;
  }
  _createStringRecord(doc, docIndex) {
    if (!isDefined(doc) || isBlank2(doc)) return null;
    return {
      v: doc,
      i: docIndex,
      n: this.norm.get(doc)
    };
  }
  _createObjectRecord(doc, docIndex) {
    const record = {
      i: docIndex,
      $: {}
    };
    for (let keyIndex = 0, keyLen = this.keys.length; keyIndex < keyLen; keyIndex++) {
      const key = this.keys[keyIndex];
      const value = key.getFn ? key.getFn(doc) : this.getFn(doc, key.path);
      if (!isDefined(value)) continue;
      if (isArray(value)) {
        const subRecords = [];
        for (let i = 0, len = value.length; i < len; i += 1) {
          const item = value[i];
          if (!isDefined(item)) continue;
          if (isString(item)) {
            if (!isBlank2(item)) {
              const subRecord = {
                v: item,
                i,
                n: this.norm.get(item)
              };
              subRecords.push(subRecord);
            }
          } else if (isDefined(item.v)) {
            const text = isString(item.v) ? item.v : toString(item.v);
            if (!isBlank2(text)) {
              const subRecord = {
                v: text,
                i: item.i,
                n: this.norm.get(text)
              };
              subRecords.push(subRecord);
            }
          }
        }
        record.$[keyIndex] = subRecords;
      } else if (isString(value) && !isBlank2(value)) {
        const subRecord = {
          v: value,
          n: this.norm.get(value)
        };
        record.$[keyIndex] = subRecord;
      }
    }
    return record;
  }
  toJSON() {
    return {
      keys: this.keys.map(({ getFn, ...key }) => key),
      records: this.records
    };
  }
};
function createIndex(keys, docs, { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
  const myIndex = new FuseIndex({
    getFn,
    fieldNormWeight
  });
  myIndex.setKeys(keys.map(createKey));
  myIndex.setSources(docs);
  myIndex.create();
  return myIndex;
}
function parseIndex(data, { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
  const { keys, records } = data;
  const myIndex = new FuseIndex({
    getFn,
    fieldNormWeight
  });
  myIndex.setKeys(keys);
  myIndex.setIndexRecords(records);
  return myIndex;
}
function convertMaskToIndices(matchmask = [], minMatchCharLength = Config.minMatchCharLength) {
  const indices = [];
  let start = -1;
  let end = -1;
  let i = 0;
  for (let len = matchmask.length; i < len; i += 1) {
    const match = matchmask[i];
    if (match && start === -1) start = i;
    else if (!match && start !== -1) {
      end = i - 1;
      if (end - start + 1 >= minMatchCharLength) indices.push([start, end]);
      start = -1;
    }
  }
  if (matchmask[i - 1] && i - start >= minMatchCharLength) indices.push([start, i - 1]);
  return indices;
}
function search(text, pattern, patternAlphabet, { location = Config.location, distance = Config.distance, threshold = Config.threshold, findAllMatches = Config.findAllMatches, minMatchCharLength = Config.minMatchCharLength, includeMatches = Config.includeMatches, ignoreLocation = Config.ignoreLocation } = {}) {
  if (pattern.length > 32) throw new Error(PATTERN_LENGTH_TOO_LARGE(32));
  const patternLen = pattern.length;
  const textLen = text.length;
  const expectedLocation = Math.max(0, Math.min(location, textLen));
  let currentThreshold = threshold;
  let bestLocation = expectedLocation;
  const calcScore = (errors, currentLocation) => {
    const accuracy = errors / patternLen;
    if (ignoreLocation) return accuracy;
    const proximity = Math.abs(expectedLocation - currentLocation);
    if (!distance) return proximity ? 1 : accuracy;
    return accuracy + proximity / distance;
  };
  const computeMatches = minMatchCharLength > 1 || includeMatches;
  const matchMask = computeMatches ? Array(textLen) : [];
  let index;
  while ((index = text.indexOf(pattern, bestLocation)) > -1) {
    const score = calcScore(0, index);
    currentThreshold = Math.min(score, currentThreshold);
    bestLocation = index + patternLen;
    if (computeMatches) {
      let i = 0;
      while (i < patternLen) {
        matchMask[index + i] = 1;
        i += 1;
      }
    }
  }
  bestLocation = -1;
  let lastBitArr = [];
  let finalScore = 1;
  let bestErrors = 0;
  let binMax = patternLen + textLen;
  const mask = 1 << patternLen - 1;
  for (let i = 0; i < patternLen; i += 1) {
    let binMin = 0;
    let binMid = binMax;
    while (binMin < binMid) {
      if (calcScore(i, expectedLocation + binMid) <= currentThreshold) binMin = binMid;
      else binMax = binMid;
      binMid = Math.floor((binMax - binMin) / 2 + binMin);
    }
    binMax = binMid;
    let start = Math.max(1, expectedLocation - binMid + 1);
    const finish = findAllMatches ? textLen : Math.min(expectedLocation + binMid, textLen) + patternLen;
    const bitArr = Array(finish + 2);
    bitArr[finish + 1] = (1 << i) - 1;
    for (let j = finish; j >= start; j -= 1) {
      const currentLocation = j - 1;
      const charMatch = patternAlphabet[text[currentLocation]];
      bitArr[j] = (bitArr[j + 1] << 1 | 1) & charMatch;
      if (i) bitArr[j] |= (lastBitArr[j + 1] | lastBitArr[j]) << 1 | 1 | lastBitArr[j + 1];
      if (bitArr[j] & mask) {
        finalScore = calcScore(i, currentLocation);
        if (finalScore <= currentThreshold) {
          currentThreshold = finalScore;
          bestLocation = currentLocation;
          bestErrors = i;
          if (bestLocation <= expectedLocation) break;
          start = Math.max(1, 2 * expectedLocation - bestLocation);
        }
      }
    }
    if (calcScore(i + 1, expectedLocation) > currentThreshold) break;
    lastBitArr = bitArr;
  }
  if (computeMatches && bestLocation >= 0) {
    const matchEnd = Math.min(textLen - 1, bestLocation + patternLen - 1 + bestErrors);
    for (let k = bestLocation; k <= matchEnd; k += 1) if (patternAlphabet[text[k]]) matchMask[k] = 1;
  }
  const result = {
    isMatch: bestLocation >= 0,
    score: Math.max(1e-3, finalScore)
  };
  if (computeMatches) {
    const indices = convertMaskToIndices(matchMask, minMatchCharLength);
    if (!indices.length) result.isMatch = false;
    else if (includeMatches) result.indices = indices;
  }
  return result;
}
function createPatternAlphabet(pattern) {
  const mask = {};
  for (let i = 0, len = pattern.length; i < len; i += 1) {
    const char = pattern.charAt(i);
    mask[char] = (mask[char] || 0) | 1 << len - i - 1;
  }
  return mask;
}
function mergeIndices(indices) {
  if (indices.length <= 1) return indices;
  indices.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [indices[0]];
  for (let i = 1, len = indices.length; i < len; i += 1) {
    const last = merged[merged.length - 1];
    const curr = indices[i];
    if (curr[0] <= last[1] + 1) last[1] = Math.max(last[1], curr[1]);
    else merged.push(curr);
  }
  return merged;
}
var NON_DECOMPOSABLE_MAP = {
  "\u0142": "l",
  "\u0141": "L",
  "\u0111": "d",
  "\u0110": "D",
  "\xF8": "o",
  "\xD8": "O",
  "\u0127": "h",
  "\u0126": "H",
  "\u0167": "t",
  "\u0166": "T",
  "\u0131": "i",
  "\xDF": "ss"
};
var NON_DECOMPOSABLE_RE = new RegExp("[" + Object.keys(NON_DECOMPOSABLE_MAP).join("") + "]", "g");
var stripDiacritics = typeof String.prototype.normalize === "function" ? (str) => str.normalize("NFD").replace(/[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]/g, "").replace(NON_DECOMPOSABLE_RE, (ch) => NON_DECOMPOSABLE_MAP[ch]) : (str) => str;
var BitapSearch = class {
  constructor(pattern, { location = Config.location, threshold = Config.threshold, distance = Config.distance, includeMatches = Config.includeMatches, findAllMatches = Config.findAllMatches, minMatchCharLength = Config.minMatchCharLength, isCaseSensitive = Config.isCaseSensitive, ignoreDiacritics = Config.ignoreDiacritics, ignoreLocation = Config.ignoreLocation } = {}) {
    this.options = {
      location,
      threshold,
      distance,
      includeMatches,
      findAllMatches,
      minMatchCharLength,
      isCaseSensitive,
      ignoreDiacritics,
      ignoreLocation
    };
    pattern = isCaseSensitive ? pattern : pattern.toLowerCase();
    pattern = ignoreDiacritics ? stripDiacritics(pattern) : pattern;
    this.pattern = pattern;
    this.chunks = [];
    if (!this.pattern.length) return;
    const addChunk = (pattern2, startIndex) => {
      this.chunks.push({
        pattern: pattern2,
        alphabet: createPatternAlphabet(pattern2),
        startIndex
      });
    };
    const len = this.pattern.length;
    if (len > 32) {
      let i = 0;
      const remainder = len % 32;
      const end = len - remainder;
      while (i < end) {
        addChunk(this.pattern.substr(i, 32), i);
        i += 32;
      }
      if (remainder) {
        const startIndex = len - 32;
        addChunk(this.pattern.substr(startIndex), startIndex);
      }
    } else addChunk(this.pattern, 0);
  }
  searchIn(text) {
    const { isCaseSensitive, ignoreDiacritics, includeMatches } = this.options;
    text = isCaseSensitive ? text : text.toLowerCase();
    text = ignoreDiacritics ? stripDiacritics(text) : text;
    if (this.pattern === text) {
      if (text.length < this.options.minMatchCharLength) return {
        isMatch: false,
        score: 1
      };
      const result2 = {
        isMatch: true,
        score: 0
      };
      if (includeMatches) result2.indices = [[0, text.length - 1]];
      return result2;
    }
    const { location, distance, threshold, findAllMatches, minMatchCharLength, ignoreLocation } = this.options;
    const allIndices = [];
    let totalScore = 0;
    let hasMatches = false;
    this.chunks.forEach(({ pattern, alphabet, startIndex }) => {
      const { isMatch, score, indices } = search(text, pattern, alphabet, {
        location: location + startIndex,
        distance,
        threshold,
        findAllMatches,
        minMatchCharLength,
        includeMatches,
        ignoreLocation
      });
      if (isMatch) hasMatches = true;
      totalScore += score;
      if (isMatch && indices) allIndices.push(...indices);
    });
    const result = {
      isMatch: hasMatches,
      score: hasMatches ? totalScore / this.chunks.length : 1
    };
    if (hasMatches && includeMatches) result.indices = mergeIndices(allIndices);
    return result;
  }
};
var MULTI_MATCH_TYPES = /* @__PURE__ */ new Set(["fuzzy", "include"]);
function isInverse(type) {
  return type.startsWith("inverse");
}
var matchers = [
  {
    type: "exact",
    multiRegex: /^="(.*)"$/,
    singleRegex: /^=(.*)$/,
    create: (pattern) => ({
      type: "exact",
      search(text) {
        const isMatch = text === pattern;
        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, pattern.length - 1]
        };
      }
    })
  },
  {
    type: "include",
    multiRegex: /^'"(.*)"$/,
    singleRegex: /^'(.*)$/,
    create: (pattern) => ({
      type: "include",
      search(text) {
        let location = 0;
        let index;
        const indices = [];
        const patternLen = pattern.length;
        while ((index = text.indexOf(pattern, location)) > -1) {
          location = index + patternLen;
          indices.push([index, location - 1]);
        }
        const isMatch = !!indices.length;
        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices
        };
      }
    })
  },
  {
    type: "prefix-exact",
    multiRegex: /^\^"(.*)"$/,
    singleRegex: /^\^(.*)$/,
    create: (pattern) => ({
      type: "prefix-exact",
      search(text) {
        const isMatch = text.startsWith(pattern);
        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, pattern.length - 1]
        };
      }
    })
  },
  {
    type: "inverse-prefix-exact",
    multiRegex: /^!\^"(.*)"$/,
    singleRegex: /^!\^(.*)$/,
    create: (pattern) => ({
      type: "inverse-prefix-exact",
      search(text) {
        const isMatch = !text.startsWith(pattern);
        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, text.length - 1]
        };
      }
    })
  },
  {
    type: "inverse-suffix-exact",
    multiRegex: /^!"(.*)"\$$/,
    singleRegex: /^!(.*)\$$/,
    create: (pattern) => ({
      type: "inverse-suffix-exact",
      search(text) {
        const isMatch = !text.endsWith(pattern);
        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, text.length - 1]
        };
      }
    })
  },
  {
    type: "suffix-exact",
    multiRegex: /^"(.*)"\$$/,
    singleRegex: /^(.*)\$$/,
    create: (pattern) => ({
      type: "suffix-exact",
      search(text) {
        const isMatch = text.endsWith(pattern);
        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [text.length - pattern.length, text.length - 1]
        };
      }
    })
  },
  {
    type: "inverse-exact",
    multiRegex: /^!"(.*)"$/,
    singleRegex: /^!(.*)$/,
    create: (pattern) => ({
      type: "inverse-exact",
      search(text) {
        const isMatch = text.indexOf(pattern) === -1;
        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, text.length - 1]
        };
      }
    })
  },
  {
    type: "fuzzy",
    multiRegex: /^"(.*)"$/,
    singleRegex: /^(.*)$/,
    create: (pattern, options = {}) => {
      const bitap = new BitapSearch(pattern, {
        location: options.location ?? Config.location,
        threshold: options.threshold ?? Config.threshold,
        distance: options.distance ?? Config.distance,
        includeMatches: options.includeMatches ?? Config.includeMatches,
        findAllMatches: options.findAllMatches ?? Config.findAllMatches,
        minMatchCharLength: options.minMatchCharLength ?? Config.minMatchCharLength,
        isCaseSensitive: options.isCaseSensitive ?? Config.isCaseSensitive,
        ignoreDiacritics: options.ignoreDiacritics ?? Config.ignoreDiacritics,
        ignoreLocation: options.ignoreLocation ?? Config.ignoreLocation
      });
      return {
        type: "fuzzy",
        search(text) {
          return bitap.searchIn(text);
        }
      };
    }
  }
];
var matchersLen = matchers.length;
var ESCAPED_PIPE = "\0";
var OR_TOKEN = "|";
function tokenize(pattern) {
  const tokens = [];
  const len = pattern.length;
  let i = 0;
  while (i < len) {
    while (i < len && pattern[i] === " ") i++;
    if (i >= len) break;
    let j = i;
    while (j < len && pattern[j] !== " " && pattern[j] !== '"') j++;
    if (j < len && pattern[j] === '"') {
      j++;
      while (j < len) {
        if (pattern[j] === '"') {
          const next = j + 1;
          if (next >= len || pattern[next] === " ") {
            j++;
            break;
          }
          if (pattern[next] === "$" && (next + 1 >= len || pattern[next + 1] === " ")) {
            j += 2;
            break;
          }
        }
        j++;
      }
      tokens.push(pattern.substring(i, j));
      i = j;
    } else {
      while (j < len && pattern[j] !== " ") j++;
      tokens.push(pattern.substring(i, j));
      i = j;
    }
  }
  return tokens;
}
function getMatch(pattern, exp) {
  const matches = pattern.match(exp);
  return matches ? matches[1] : null;
}
function parseQuery(pattern, options = {}) {
  return pattern.replace(/\\\|/g, ESCAPED_PIPE).split(OR_TOKEN).map((item) => {
    const query = tokenize(item.replace(/\u0000/g, "|").trim()).filter((item2) => item2 && !!item2.trim());
    const results = [];
    for (let i = 0, len = query.length; i < len; i += 1) {
      const queryItem = query[i];
      let found = false;
      let idx = -1;
      while (!found && ++idx < matchersLen) {
        const def = matchers[idx];
        const token = getMatch(queryItem, def.multiRegex);
        if (token) {
          results.push(def.create(token, options));
          found = true;
        }
      }
      if (found) continue;
      idx = -1;
      while (++idx < matchersLen) {
        const def = matchers[idx];
        const token = getMatch(queryItem, def.singleRegex);
        if (token) {
          results.push(def.create(token, options));
          break;
        }
      }
    }
    return results;
  });
}
var ExtendedSearch = class {
  constructor(pattern, { isCaseSensitive = Config.isCaseSensitive, ignoreDiacritics = Config.ignoreDiacritics, includeMatches = Config.includeMatches, minMatchCharLength = Config.minMatchCharLength, ignoreLocation = Config.ignoreLocation, findAllMatches = Config.findAllMatches, location = Config.location, threshold = Config.threshold, distance = Config.distance } = {}) {
    this.query = null;
    this.options = {
      isCaseSensitive,
      ignoreDiacritics,
      includeMatches,
      minMatchCharLength,
      findAllMatches,
      ignoreLocation,
      location,
      threshold,
      distance
    };
    pattern = isCaseSensitive ? pattern : pattern.toLowerCase();
    pattern = ignoreDiacritics ? stripDiacritics(pattern) : pattern;
    this.pattern = pattern;
    this.query = parseQuery(this.pattern, this.options);
  }
  static condition(_, options) {
    return options.useExtendedSearch;
  }
  searchIn(text) {
    const query = this.query;
    if (!query) return {
      isMatch: false,
      score: 1
    };
    const { includeMatches, isCaseSensitive, ignoreDiacritics } = this.options;
    text = isCaseSensitive ? text : text.toLowerCase();
    text = ignoreDiacritics ? stripDiacritics(text) : text;
    let numMatches = 0;
    const allIndices = [];
    let totalScore = 0;
    let hasInverse = false;
    for (let i = 0, qLen = query.length; i < qLen; i += 1) {
      const searchers = query[i];
      allIndices.length = 0;
      numMatches = 0;
      hasInverse = false;
      for (let j = 0, pLen = searchers.length; j < pLen; j += 1) {
        const matcher = searchers[j];
        const { isMatch, indices, score } = matcher.search(text);
        if (isMatch) {
          numMatches += 1;
          totalScore += score;
          if (isInverse(matcher.type)) hasInverse = true;
          if (includeMatches) if (MULTI_MATCH_TYPES.has(matcher.type)) allIndices.push(...indices);
          else allIndices.push(indices);
        } else {
          totalScore = 0;
          numMatches = 0;
          allIndices.length = 0;
          hasInverse = false;
          break;
        }
      }
      if (numMatches) {
        const result = {
          isMatch: true,
          score: totalScore / numMatches
        };
        if (hasInverse) result.hasInverse = true;
        if (includeMatches) result.indices = mergeIndices(allIndices);
        return result;
      }
    }
    return {
      isMatch: false,
      score: 1
    };
  }
};
var registeredSearchers = [];
function register(...args) {
  registeredSearchers.push(...args);
}
function createSearcher(pattern, options) {
  for (let i = 0, len = registeredSearchers.length; i < len; i += 1) {
    const searcherClass = registeredSearchers[i];
    if (searcherClass.condition(pattern, options)) return new searcherClass(pattern, options);
  }
  return new BitapSearch(pattern, options);
}
var LogicalOperator = {
  AND: "$and",
  OR: "$or"
};
var KeyType = {
  PATH: "$path",
  PATTERN: "$val"
};
var isExpression = (query) => !!(query[LogicalOperator.AND] || query[LogicalOperator.OR]);
var isPath = (query) => !!query[KeyType.PATH];
var isLeaf = (query) => !isArray(query) && isObject(query) && !isExpression(query);
var convertToExplicit = (query) => ({ [LogicalOperator.AND]: Object.keys(query).map((key) => ({ [key]: query[key] })) });
function parse(query, options, { auto = true } = {}) {
  const next = (query2) => {
    if (isString(query2)) {
      const obj = {
        keyId: null,
        pattern: query2
      };
      if (auto) obj.searcher = createSearcher(query2, options);
      return obj;
    }
    const keys = Object.keys(query2);
    const isQueryPath = isPath(query2);
    if (!isQueryPath && keys.length > 1 && !isExpression(query2)) return next(convertToExplicit(query2));
    if (isLeaf(query2)) {
      const key = isQueryPath ? query2[KeyType.PATH] : keys[0];
      const pattern = isQueryPath ? query2[KeyType.PATTERN] : query2[key];
      if (!isString(pattern)) throw new Error(LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY(key));
      const obj = {
        keyId: createKeyId(key),
        pattern
      };
      if (auto) obj.searcher = createSearcher(pattern, options);
      return obj;
    }
    const node = {
      children: [],
      operator: keys[0]
    };
    keys.forEach((key) => {
      const value = query2[key];
      if (isArray(value)) value.forEach((item) => {
        node.children.push(next(item));
      });
    });
    return node;
  };
  if (!isExpression(query)) query = convertToExplicit(query);
  return next(query);
}
function computeScoreSingle(matches, { ignoreFieldNorm = Config.ignoreFieldNorm }) {
  let totalScore = 1;
  matches.forEach(({ key, norm: norm3, score }) => {
    const weight = key ? key.weight : null;
    totalScore *= Math.pow(score === 0 && weight ? Number.EPSILON : score, (weight || 1) * (ignoreFieldNorm ? 1 : norm3));
  });
  return totalScore;
}
function computeScore(results, { ignoreFieldNorm = Config.ignoreFieldNorm }) {
  results.forEach((result) => {
    result.score = computeScoreSingle(result.matches, { ignoreFieldNorm });
  });
}
var MaxHeap = class {
  constructor(limit, comparator) {
    this.limit = limit;
    this.heap = [];
    this.comparator = comparator;
  }
  get size() {
    return this.heap.length;
  }
  insert(item) {
    if (this.size < this.limit) {
      this.heap.push(item);
      this._bubbleUp(this.size - 1);
    } else if (this.comparator(item, this.heap[0]) < 0) {
      this.heap[0] = item;
      this._sinkDown(0);
    }
  }
  extractSorted() {
    return this.heap.sort(this.comparator);
  }
  _bubbleUp(i) {
    const heap = this.heap;
    while (i > 0) {
      const parent = i - 1 >> 1;
      if (this.comparator(heap[i], heap[parent]) <= 0) break;
      const tmp = heap[i];
      heap[i] = heap[parent];
      heap[parent] = tmp;
      i = parent;
    }
  }
  _sinkDown(i) {
    const heap = this.heap;
    const len = heap.length;
    let largest = i;
    do {
      i = largest;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < len && this.comparator(heap[left], heap[largest]) > 0) largest = left;
      if (right < len && this.comparator(heap[right], heap[largest]) > 0) largest = right;
      if (largest !== i) {
        const tmp = heap[i];
        heap[i] = heap[largest];
        heap[largest] = tmp;
      }
    } while (largest !== i);
  }
};
function formatMatches(result) {
  const matches = [];
  result.matches.forEach((match) => {
    if (!isDefined(match.indices) || !match.indices.length) return;
    const obj = {
      indices: match.indices,
      value: match.value
    };
    if (match.key) obj.key = match.key.id;
    if (match.idx > -1) obj.refIndex = match.idx;
    matches.push(obj);
  });
  return matches;
}
function format(results, docs, { includeMatches = Config.includeMatches, includeScore = Config.includeScore } = {}) {
  return results.map((result) => {
    const { idx } = result;
    const data = {
      item: docs[idx],
      refIndex: idx
    };
    if (includeMatches) data.matches = formatMatches(result);
    if (includeScore) data.score = result.score;
    return data;
  });
}
var DEFAULT_TOKEN = /[\p{L}\p{M}\p{N}_]+/gu;
var warned = /* @__PURE__ */ new WeakSet();
function warnNonGlobal(regex) {
  if (!warned.has(regex)) {
    warned.add(regex);
    console.warn(`[Fuse] tokenize regex ${regex} lacks the global flag; only the first match per text will be returned. Add the 'g' flag.`);
  }
}
function resolveTokenize(tokenize3) {
  if (typeof tokenize3 === "function") {
    let validated = false;
    return (text) => {
      const result = tokenize3(text);
      if (!validated) {
        validated = true;
        if (!Array.isArray(result) || result.some((t) => typeof t !== "string")) throw new Error(`[Fuse] tokenize function must return string[]; received ${Array.isArray(result) ? "array containing non-strings" : typeof result}.`);
      }
      return result;
    };
  }
  if (tokenize3 instanceof RegExp) {
    if (!tokenize3.global) warnNonGlobal(tokenize3);
    return (text) => text.match(tokenize3) || [];
  }
  return (text) => text.match(DEFAULT_TOKEN) || [];
}
function createAnalyzer({ isCaseSensitive = false, ignoreDiacritics = false, tokenize: tokenize3 } = {}) {
  const tokenizeFn = resolveTokenize(tokenize3);
  return { tokenize(text) {
    if (!isCaseSensitive) text = text.toLowerCase();
    if (ignoreDiacritics) text = stripDiacritics(text);
    return tokenizeFn(text);
  } };
}
var TokenSearch = class {
  static condition(_, options) {
    return options.useTokenSearch;
  }
  constructor(pattern, options) {
    this.options = options;
    this.analyzer = createAnalyzer({
      isCaseSensitive: options.isCaseSensitive,
      ignoreDiacritics: options.ignoreDiacritics,
      tokenize: options.tokenize
    });
    const queryTerms = this.analyzer.tokenize(pattern);
    const { df, fieldCount } = options._invertedIndex;
    this.termSearchers = [];
    this.idfWeights = [];
    for (const term of queryTerms) {
      this.termSearchers.push(new BitapSearch(term, {
        location: options.location,
        threshold: options.threshold,
        distance: options.distance,
        includeMatches: options.includeMatches,
        findAllMatches: options.findAllMatches,
        minMatchCharLength: options.minMatchCharLength,
        isCaseSensitive: options.isCaseSensitive,
        ignoreDiacritics: options.ignoreDiacritics,
        ignoreLocation: true
      }));
      const docFreq = df.get(term) || 0;
      const idf = Math.log(1 + (fieldCount - docFreq + 0.5) / (docFreq + 0.5));
      this.idfWeights.push(idf);
    }
    this.combineAll = options.tokenMatch === "all";
    this.numTerms = this.termSearchers.length;
    this.useMask = this.numTerms <= 31;
  }
  searchIn(text) {
    if (!this.termSearchers.length) return {
      isMatch: false,
      score: 1
    };
    const allIndices = [];
    let weightedScore = 0;
    let maxPossibleScore = 0;
    let matchedCount = 0;
    let matchedMask = 0;
    const matchedTerms = this.combineAll && !this.useMask ? /* @__PURE__ */ new Set() : null;
    for (let i = 0; i < this.termSearchers.length; i++) {
      const result = this.termSearchers[i].searchIn(text);
      const idf = this.idfWeights[i];
      maxPossibleScore += idf;
      if (result.isMatch) {
        matchedCount++;
        weightedScore += idf * (1 - result.score);
        if (result.indices) allIndices.push(...result.indices);
        if (this.combineAll) if (this.useMask) matchedMask |= 1 << i;
        else matchedTerms.add(i);
      }
    }
    if (matchedCount === 0) return {
      isMatch: false,
      score: 1
    };
    const normalized = maxPossibleScore > 0 ? 1 - weightedScore / maxPossibleScore : 0;
    const searchResult = {
      isMatch: true,
      score: Math.max(1e-3, normalized)
    };
    if (this.options.includeMatches && allIndices.length) searchResult.indices = mergeIndices(allIndices);
    if (this.combineAll) {
      if (this.useMask) searchResult.matchedMask = matchedMask;
      else searchResult.matchedTerms = matchedTerms;
      searchResult.termCount = this.numTerms;
    }
    return searchResult;
  }
};
function addField(index, text, docIdx, analyzer) {
  const tokens = analyzer.tokenize(text);
  if (!tokens.length) return;
  index.fieldCount++;
  index.docFieldCount.set(docIdx, (index.docFieldCount.get(docIdx) || 0) + 1);
  const distinctTerms = new Set(tokens);
  let perDocTerms = index.docTermFieldHits.get(docIdx);
  if (!perDocTerms) {
    perDocTerms = /* @__PURE__ */ new Map();
    index.docTermFieldHits.set(docIdx, perDocTerms);
  }
  for (const term of distinctTerms) {
    perDocTerms.set(term, (perDocTerms.get(term) || 0) + 1);
    index.df.set(term, (index.df.get(term) || 0) + 1);
  }
}
function ingestRecord(index, record, keyCount, analyzer) {
  const { i: docIdx, v, $: fields } = record;
  if (v !== void 0) {
    addField(index, v, docIdx, analyzer);
    return;
  }
  if (!fields) return;
  for (let keyIdx = 0; keyIdx < keyCount; keyIdx++) {
    const value = fields[keyIdx];
    if (!value) continue;
    if (Array.isArray(value)) for (const sub of value) addField(index, sub.v, docIdx, analyzer);
    else addField(index, value.v, docIdx, analyzer);
  }
}
function buildInvertedIndex(records, keyCount, analyzer) {
  const index = {
    fieldCount: 0,
    df: /* @__PURE__ */ new Map(),
    docFieldCount: /* @__PURE__ */ new Map(),
    docTermFieldHits: /* @__PURE__ */ new Map()
  };
  for (const record of records) ingestRecord(index, record, keyCount, analyzer);
  return index;
}
function addToInvertedIndex(index, record, keyCount, analyzer) {
  ingestRecord(index, record, keyCount, analyzer);
}
function removeFromInvertedIndex(index, docIdx) {
  const fieldCount = index.docFieldCount.get(docIdx);
  if (fieldCount === void 0) return;
  index.fieldCount -= fieldCount;
  index.docFieldCount.delete(docIdx);
  const perDocTerms = index.docTermFieldHits.get(docIdx);
  if (!perDocTerms) return;
  for (const [term, hits] of perDocTerms) {
    const next = (index.df.get(term) || 0) - hits;
    if (next <= 0) index.df.delete(term);
    else index.df.set(term, next);
  }
  index.docTermFieldHits.delete(docIdx);
}
function removeAndShiftInvertedIndex(index, removedIndices) {
  if (removedIndices.length === 0) return;
  const sorted = Array.from(new Set(removedIndices)).sort((a, b) => a - b);
  for (const idx of sorted) removeFromInvertedIndex(index, idx);
  const shift = (oldIdx) => {
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const mid = lo + hi >>> 1;
      if (sorted[mid] < oldIdx) lo = mid + 1;
      else hi = mid;
    }
    return oldIdx - lo;
  };
  const firstRemoved = sorted[0];
  const shiftedDocFieldCount = /* @__PURE__ */ new Map();
  for (const [oldKey, count] of index.docFieldCount) shiftedDocFieldCount.set(oldKey > firstRemoved ? shift(oldKey) : oldKey, count);
  index.docFieldCount = shiftedDocFieldCount;
  const shiftedDocTermFieldHits = /* @__PURE__ */ new Map();
  for (const [oldKey, terms] of index.docTermFieldHits) shiftedDocTermFieldHits.set(oldKey > firstRemoved ? shift(oldKey) : oldKey, terms);
  index.docTermFieldHits = shiftedDocTermFieldHits;
}
var Fuse = class {
  constructor(docs, options, index) {
    this.options = {
      ...Config,
      ...options
    };
    if (this.options.useExtendedSearch && false) ;
    if (this.options.useTokenSearch && false) ;
    this._keyStore = new KeyStore(this.options.keys);
    this._docs = docs;
    this._myIndex = null;
    this._invertedIndex = null;
    this.setCollection(docs, index);
    this._lastQuery = null;
    this._lastSearcher = null;
  }
  _getSearcher(query) {
    if (this._lastQuery === query) return this._lastSearcher;
    const searcher = createSearcher(query, this._invertedIndex ? {
      ...this.options,
      _invertedIndex: this._invertedIndex
    } : this.options);
    this._lastQuery = query;
    this._lastSearcher = searcher;
    return searcher;
  }
  setCollection(docs, index) {
    this._docs = docs;
    if (index && !(index instanceof FuseIndex)) throw new Error(INCORRECT_INDEX_TYPE);
    this._myIndex = index || createIndex(this.options.keys, this._docs, {
      getFn: this.options.getFn,
      fieldNormWeight: this.options.fieldNormWeight
    });
    if (this.options.useTokenSearch) {
      const analyzer = createAnalyzer({
        isCaseSensitive: this.options.isCaseSensitive,
        ignoreDiacritics: this.options.ignoreDiacritics,
        tokenize: this.options.tokenize
      });
      this._invertedIndex = buildInvertedIndex(this._myIndex.records, this._myIndex.keys.length, analyzer);
    }
    this._invalidateSearcherCache();
  }
  add(doc) {
    if (!isDefined(doc)) return;
    this._docs.push(doc);
    const record = this._myIndex.add(doc, this._docs.length - 1);
    if (this._invertedIndex && record) {
      const analyzer = createAnalyzer({
        isCaseSensitive: this.options.isCaseSensitive,
        ignoreDiacritics: this.options.ignoreDiacritics,
        tokenize: this.options.tokenize
      });
      addToInvertedIndex(this._invertedIndex, record, this._myIndex.keys.length, analyzer);
    }
    this._invalidateSearcherCache();
  }
  remove(predicate = () => false) {
    const results = [];
    const indicesToRemove = [];
    for (let i = 0, len = this._docs.length; i < len; i += 1) if (predicate(this._docs[i], i)) {
      results.push(this._docs[i]);
      indicesToRemove.push(i);
    }
    if (indicesToRemove.length) {
      if (this._invertedIndex) removeAndShiftInvertedIndex(this._invertedIndex, indicesToRemove);
      const toRemove = new Set(indicesToRemove);
      this._docs = this._docs.filter((_, i) => !toRemove.has(i));
      this._myIndex.removeAll(indicesToRemove);
      this._invalidateSearcherCache();
    }
    return results;
  }
  removeAt(idx) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= this._docs.length) throw new Error(INVALID_DOC_INDEX);
    if (this._invertedIndex) removeAndShiftInvertedIndex(this._invertedIndex, [idx]);
    const doc = this._docs.splice(idx, 1)[0];
    this._myIndex.removeAt(idx);
    this._invalidateSearcherCache();
    return doc;
  }
  _invalidateSearcherCache() {
    this._lastQuery = null;
    this._lastSearcher = null;
  }
  getIndex() {
    return this._myIndex;
  }
  _normalizedKeys() {
    return this._myIndex.keys.map((key) => this._keyStore.get(key.id) || key);
  }
  search(query, options) {
    const { limit = -1 } = options || {};
    const { includeMatches, includeScore, shouldSort, sortFn, ignoreFieldNorm } = this.options;
    if (isString(query) && !query.trim()) {
      let docs = this._docs.map((item, idx) => ({
        item,
        refIndex: idx
      }));
      if (isNumber(limit) && limit > -1) docs = docs.slice(0, limit);
      return docs;
    }
    const useHeap = shouldSort && isNumber(limit) && limit > 0 && isString(query);
    const comparator = sortFn;
    const stable = (a, b) => comparator(a, b) || a.idx - b.idx;
    let results;
    if (useHeap) {
      const heap = new MaxHeap(limit, stable);
      if (isString(this._docs[0])) this._searchStringList(query, {
        heap,
        ignoreFieldNorm
      });
      else this._searchObjectList(query, {
        heap,
        ignoreFieldNorm
      });
      results = heap.extractSorted();
    } else {
      results = isString(query) ? isString(this._docs[0]) ? this._searchStringList(query) : this._searchObjectList(query) : this._searchLogical(query);
      computeScore(results, { ignoreFieldNorm });
      if (shouldSort) results.sort(isString(query) ? stable : comparator);
      if (isNumber(limit) && limit > -1) results = results.slice(0, limit);
    }
    return format(results, this._docs, {
      includeMatches,
      includeScore
    });
  }
  _searchStringList(query, { heap, ignoreFieldNorm } = {}) {
    const searcher = this._getSearcher(query);
    const requireAllTokens = this.options.useTokenSearch && this.options.tokenMatch === "all";
    const { records } = this._myIndex;
    const results = heap ? null : [];
    records.forEach(({ v: text, i: idx, n: norm3 }) => {
      if (!isDefined(text)) return;
      const searchResult = searcher.searchIn(text);
      if (searchResult.isMatch) {
        const match = {
          score: searchResult.score,
          value: text,
          norm: norm3,
          indices: searchResult.indices
        };
        if (requireAllTokens) {
          match.matchedMask = searchResult.matchedMask;
          match.matchedTerms = searchResult.matchedTerms;
          match.termCount = searchResult.termCount;
        }
        const matches = [match];
        if (!requireAllTokens || this._coversAllTokens(matches)) {
          const result = {
            item: text,
            idx,
            matches
          };
          if (heap) {
            result.score = computeScoreSingle(result.matches, { ignoreFieldNorm });
            heap.insert(result);
          } else results.push(result);
        }
      }
    });
    return results;
  }
  _searchLogical(query) {
    const expression = parse(query, this.options);
    const keys = this._normalizedKeys();
    const evaluate = (node, item, idx) => {
      if (!("children" in node)) {
        const { keyId, searcher } = node;
        let matches;
        if (keyId === null) {
          matches = [];
          keys.forEach((key, keyIndex) => {
            matches.push(...this._findMatches({
              key,
              value: item[keyIndex],
              searcher
            }));
          });
        } else matches = this._findMatches({
          key: this._keyStore.get(keyId),
          value: this._myIndex.getValueForItemAtKeyId(item, keyId),
          searcher
        });
        if (matches && matches.length) return [{
          idx,
          item,
          matches
        }];
        return [];
      }
      const { children, operator } = node;
      const res = [];
      for (let i = 0, len = children.length; i < len; i += 1) {
        const child = children[i];
        const result = evaluate(child, item, idx);
        if (result.length) res.push(...result);
        else if (operator === LogicalOperator.AND) return [];
      }
      return res;
    };
    const records = this._myIndex.records;
    const resultMap = /* @__PURE__ */ new Map();
    const results = [];
    records.forEach(({ $: item, i: idx }) => {
      if (isDefined(item)) {
        const expResults = evaluate(expression, item, idx);
        if (expResults.length) {
          if (!resultMap.has(idx)) {
            resultMap.set(idx, {
              idx,
              item,
              matches: []
            });
            results.push(resultMap.get(idx));
          }
          expResults.forEach(({ matches }) => {
            resultMap.get(idx).matches.push(...matches);
          });
        }
      }
    });
    return results;
  }
  _searchObjectList(query, { heap, ignoreFieldNorm } = {}) {
    const searcher = this._getSearcher(query);
    const requireAllTokens = this.options.useTokenSearch && this.options.tokenMatch === "all";
    const { records } = this._myIndex;
    const keys = this._normalizedKeys();
    const results = heap ? null : [];
    records.forEach(({ $: item, i: idx }) => {
      if (!isDefined(item)) return;
      const matches = [];
      let anyKeyFailed = false;
      let hasInverse = false;
      keys.forEach((key, keyIndex) => {
        const keyMatches = this._findMatches({
          key,
          value: item[keyIndex],
          searcher
        });
        if (keyMatches.length) {
          matches.push(...keyMatches);
          if (keyMatches[0].hasInverse) hasInverse = true;
        } else anyKeyFailed = true;
      });
      if (hasInverse && anyKeyFailed) return;
      if (matches.length && (!requireAllTokens || this._coversAllTokens(matches))) {
        const result = {
          idx,
          item,
          matches
        };
        if (heap) {
          result.score = computeScoreSingle(result.matches, { ignoreFieldNorm });
          heap.insert(result);
        } else results.push(result);
      }
    });
    return results;
  }
  _findMatches({ key, value, searcher }) {
    if (!isDefined(value)) return [];
    const matches = [];
    if (isArray(value)) value.forEach(({ v: text, i: idx, n: norm3 }) => {
      if (!isDefined(text)) return;
      const searchResult = searcher.searchIn(text);
      if (searchResult.isMatch) {
        const match = {
          score: searchResult.score,
          key,
          value: text,
          idx,
          norm: norm3,
          indices: searchResult.indices,
          hasInverse: searchResult.hasInverse
        };
        if (searchResult.termCount !== void 0) {
          match.matchedMask = searchResult.matchedMask;
          match.matchedTerms = searchResult.matchedTerms;
          match.termCount = searchResult.termCount;
        }
        matches.push(match);
      }
    });
    else {
      const { v: text, n: norm3 } = value;
      const searchResult = searcher.searchIn(text);
      if (searchResult.isMatch) {
        const match = {
          score: searchResult.score,
          key,
          value: text,
          norm: norm3,
          indices: searchResult.indices,
          hasInverse: searchResult.hasInverse
        };
        if (searchResult.termCount !== void 0) {
          match.matchedMask = searchResult.matchedMask;
          match.matchedTerms = searchResult.matchedTerms;
          match.termCount = searchResult.termCount;
        }
        matches.push(match);
      }
    }
    return matches;
  }
  _coversAllTokens(matches) {
    const termCount = matches.length ? matches[0].termCount : void 0;
    if (termCount === void 0) return true;
    if (termCount <= 31) {
      let coverage2 = 0;
      for (let i = 0; i < matches.length; i++) coverage2 |= matches[i].matchedMask || 0;
      return coverage2 === 2 ** termCount - 1;
    }
    const coverage = /* @__PURE__ */ new Set();
    for (let i = 0; i < matches.length; i++) {
      const terms = matches[i].matchedTerms;
      if (terms) for (const t of terms) coverage.add(t);
    }
    return coverage.size === termCount;
  }
};
Fuse.version = "7.5.0";
Fuse.createIndex = createIndex;
Fuse.parseIndex = parseIndex;
Fuse.config = Config;
Fuse.match = function(pattern, text, options) {
  if (options && options.useTokenSearch) throw new Error(FUSE_MATCH_TOKEN_SEARCH_UNSUPPORTED);
  return createSearcher(pattern, {
    ...Config,
    ...options
  }).searchIn(text);
};
Fuse.parseQuery = parse;
register(ExtendedSearch);
register(TokenSearch);
Fuse.use = function(...plugins) {
  plugins.forEach((plugin) => register(plugin));
};
var entry_default = Fuse;

// src/search/query.ts
var TEXT_FIELDS = /* @__PURE__ */ new Set([
  "cuisine",
  "cuisines",
  "city",
  "country",
  "district",
  "tag",
  "tags",
  "status",
  "dish",
  "name"
]);
var NUM_FIELDS = /* @__PURE__ */ new Set(["rating", "google", "price", "visits"]);
var TOKEN_RE = /(-)?(?:([A-Za-z]+):)?(?:"([^"]*)"|([^\s"]+))/g;
function norm2(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}
function tokenize2(query) {
  const groups = [];
  let current = [];
  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(query)) !== null) {
    const minus = m[1];
    const field = m[2];
    const quotedVal = m[3];
    const bareVal = m[4];
    if (!minus && !field && bareVal === "|") {
      if (current.length) groups.push(current);
      current = [];
      continue;
    }
    const value = quotedVal !== void 0 ? quotedVal : bareVal ?? "";
    if (!value || /^[-|]+$/.test(value)) continue;
    let f = field ? field.toLowerCase() : void 0;
    let v = value;
    if (f && !TEXT_FIELDS.has(f) && !NUM_FIELDS.has(f)) {
      v = `${field ?? ""}:${value}`;
      f = void 0;
    }
    current.push({
      exclude: !!minus,
      field: f,
      quoted: quotedVal !== void 0,
      value: v
    });
  }
  if (current.length) groups.push(current);
  return groups;
}
function textFieldValues(spot, field) {
  switch (field) {
    case "cuisine":
    case "cuisines":
      return spot.cuisines;
    case "city":
      return spot.city ? [spot.city] : [];
    case "country":
      return [spot.country];
    case "district":
      return spot.district ? [spot.district] : [];
    case "tag":
    case "tags":
      return spot.tags;
    case "status":
      return [spot.status];
    case "dish":
      return spot.visits.map((v) => v.note).filter((n) => n.length > 0);
    case "name":
      return [spot.name];
    default:
      return [];
  }
}
function numFieldValue(spot, field) {
  switch (field) {
    case "rating":
      return spot.rating;
    case "google":
      return spot.external.googleRating;
    case "price":
      return spot.price;
    case "visits":
      return spot.visitCount;
    default:
      return void 0;
  }
}
var CMP_RE = /^(>=|<=|>|<|=)?\s*(\d+(?:[.,]\d+)?)$/;
function matchNumeric(value, raw) {
  const m = CMP_RE.exec(raw.trim());
  if (!m || value === void 0) return false;
  const target = parseFloat(m[2].replace(",", "."));
  switch (m[1] ?? "=") {
    case ">":
      return value > target;
    case ">=":
      return value >= target;
    case "<":
      return value < target;
    case "<=":
      return value <= target;
    default:
      return value === target;
  }
}
function haystack(spot) {
  return norm2(
    [
      spot.name,
      spot.cuisines.join(" "),
      spot.city ?? "",
      spot.district ?? "",
      spot.country,
      spot.tags.join(" "),
      spot.address ?? "",
      spot.notes,
      spot.visits.map((v) => v.note).join(" ")
    ].join(" ")
  );
}
function buildFuse(spots) {
  const docs = spots.map((s) => ({
    path: s.path,
    name: s.name,
    cuisines: s.cuisines,
    city: s.city ?? "",
    district: s.district ?? "",
    country: s.country,
    tags: s.tags,
    address: s.address ?? "",
    notes: s.notes,
    visitNotes: s.visits.map((v) => v.note).join(" ")
  }));
  return new entry_default(docs, {
    threshold: 0.24,
    ignoreLocation: true,
    keys: [
      { name: "name", weight: 0.6 },
      { name: "cuisines", weight: 0.3 },
      { name: "city", weight: 0.25 },
      { name: "district", weight: 0.15 },
      { name: "country", weight: 0.15 },
      { name: "tags", weight: 0.2 },
      { name: "address", weight: 0.1 },
      { name: "notes", weight: 0.1 },
      { name: "visitNotes", weight: 0.15 }
    ]
  });
}
function passesFilters(s, f) {
  if (f.favoritesOnly && !s.favorite) return false;
  if (f.excludedStatuses.includes(s.status)) return false;
  if (f.excludedCountries.includes(s.country ?? "")) return false;
  if (f.excludedCities.includes(s.city ?? "")) return false;
  if (f.excludedCuisines.length > 0) {
    if (s.cuisines.length === 0) {
      if (f.excludedCuisines.includes("")) return false;
    } else if (s.cuisines.every((c) => f.excludedCuisines.includes(c))) {
      return false;
    }
  }
  if (f.excludedPrices.includes(s.price ?? 0)) return false;
  if (f.minRating > 0 && s.rating !== void 0 && s.rating < f.minRating) return false;
  return true;
}
function filterSpots(spots, query, filters) {
  const pool = spots.filter((s) => passesFilters(s, filters));
  const q = query.trim();
  if (!q) return pool;
  const groups = tokenize2(q);
  if (groups.length === 0) return pool;
  let fuse = null;
  const fuzzyCache = /* @__PURE__ */ new Map();
  const fuzzyPaths = (term) => {
    let hit = fuzzyCache.get(term);
    if (!hit) {
      if (!fuse) fuse = buildFuse(pool);
      hit = new Set(fuse.search(term).map((r) => r.item.path));
      fuzzyCache.set(term, hit);
    }
    return hit;
  };
  const matchesTerm = (spot, t) => {
    let ok;
    if (t.field && NUM_FIELDS.has(t.field)) {
      ok = matchNumeric(numFieldValue(spot, t.field), t.value);
    } else if (t.field && TEXT_FIELDS.has(t.field)) {
      const needle = norm2(t.value);
      ok = textFieldValues(spot, t.field).some((v) => norm2(v).includes(needle));
    } else if (t.quoted || t.exclude) {
      ok = haystack(spot).includes(norm2(t.value));
    } else {
      ok = fuzzyPaths(t.value).has(spot.path);
    }
    return t.exclude ? !ok : ok;
  };
  return pool.filter(
    (spot) => groups.some((group) => group.every((t) => matchesTerm(spot, t)))
  );
}
var SORT_VALUES = {
  name: (s) => s.name.toLowerCase(),
  rating: (s) => s.rating,
  "external-rating": (s) => s.external.googleRating ?? s.external.tripadvisorRating,
  price: (s) => s.price,
  // Always numeric: ctime breaks same-day ties (created is date-only), and a
  // mixed number/string pair would compare as NaN. `created` is parsed at LOCAL
  // midnight — Date.parse treats a bare YYYY-MM-DD as UTC, which sorts it
  // against real ctime values as if it were up to a day off.
  "date-added": (s) => {
    if (s.ctime !== void 0) return s.ctime;
    const d = s.created ? parseCalendarDate(s.created) : null;
    return d === null ? void 0 : d.getTime();
  },
  "last-visit": (s) => s.lastVisit,
  "visit-count": (s) => s.visitCount
};
function sortSpots(spots, primary, secondary) {
  const cmp = (spec) => (a, b) => {
    const get2 = SORT_VALUES[spec.key];
    if (!get2) return 0;
    const av = get2(a);
    const bv = get2(b);
    const aEmpty = av === void 0 || av === "";
    const bEmpty = bv === void 0 || bv === "";
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    let c;
    if (typeof av === "string" && typeof bv === "string") c = av.localeCompare(bv);
    else c = av - bv;
    return spec.direction === "desc" ? -c : c;
  };
  const p = cmp(primary);
  const s = secondary ? cmp(secondary) : null;
  return [...spots].sort(
    (a, b) => p(a, b) || (s ? s(a, b) : 0) || a.name.localeCompare(b.name)
  );
}

// src/search/searchTips.ts
var import_obsidian3 = require("obsidian");
var FIELDS = [
  "name",
  "cuisine",
  "city",
  "country",
  "district",
  "tag",
  "status",
  "dish",
  "rating",
  "google",
  "price",
  "visits"
];
var SearchTipsModal = class extends import_obsidian3.Modal {
  constructor(app) {
    super(app);
  }
  onOpen() {
    this.modalEl.addClass("fs-tips-modal");
    this.titleEl.setText("Search syntax");
    const c = this.contentEl;
    const tok = (parent, text, cls) => {
      parent.createSpan({ cls: `fs-qtok ${cls}`, text });
    };
    const row = (desc, build) => {
      const r = c.createDiv({ cls: "fs-tips-row" });
      const ex = r.createSpan({ cls: "fs-tips-example" });
      build(ex);
      r.createSpan({ cls: "fs-tips-desc", text: desc });
    };
    row("Fuzzy-matches name, cuisine, city, tags and notes", (p) => {
      tok(p, "momiji sushi", "fs-qtok-value");
    });
    row("Exact text with quotes", (p) => {
      tok(p, '"den haag"', "fs-qtok-quote");
    });
    row("Limit a word to one field", (p) => {
      tok(p, "cuisine:", "fs-qtok-field");
      tok(p, "japanese", "fs-qtok-value");
    });
    row("Search dishes in your visit notes", (p) => {
      tok(p, "dish:", "fs-qtok-field");
      tok(p, "omakase", "fs-qtok-value");
    });
    row("Compare numbers with >, >=, <, <= or =", (p) => {
      tok(p, "rating:", "fs-qtok-field");
      tok(p, ">=4", "fs-qtok-op");
    });
    row("Public rating, price tier and visit count too", (p) => {
      tok(p, "google:", "fs-qtok-field");
      tok(p, ">=4.5", "fs-qtok-op");
      tok(p, "price:", "fs-qtok-field");
      tok(p, "<=2", "fs-qtok-op");
      tok(p, "visits:", "fs-qtok-field");
      tok(p, ">0", "fs-qtok-op");
    });
    row("Exclude a term with a leading minus", (p) => {
      tok(p, "-sushi", "fs-qtok-neg");
    });
    row("Either side of a pipe matches", (p) => {
      tok(p, "ramen", "fs-qtok-value");
      tok(p, "|", "fs-qtok-op");
      tok(p, "sushi", "fs-qtok-value");
    });
    c.createDiv({ cls: "fs-tips-fields-title", text: "Searchable fields" });
    const chips = c.createDiv({ cls: "fs-tips-fields" });
    for (const f of FIELDS) chips.createSpan({ cls: "fs-qtok fs-qtok-field", text: `${f}:` });
  }
  onClose() {
    this.contentEl.empty();
  }
};
function attachSearchTips(plugin, anchorEl) {
  anchorEl.addClass("fs-search-tips-btn");
  (0, import_obsidian3.setIcon)(anchorEl, "help-circle");
  if (!anchorEl.getAttribute("aria-label")) {
    anchorEl.setAttribute("aria-label", "Search syntax");
  }
  anchorEl.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    new SearchTipsModal(plugin.app).open();
  });
}

// src/ui/components/card.ts
var import_obsidian12 = require("obsidian");

// src/ui/components/hours.ts
var DISPLAY_DAYS = [1, 2, 3, 4, 5, 6, 0];
var DAY_LABELS2 = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat"
};
var DAY_BY_PREFIX = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
};
function dayFromWord(word) {
  return DAY_BY_PREFIX[word.slice(0, 3).toLowerCase()];
}
function localClockApplies(spotCountry, homeCountry) {
  const spot = (spotCountry ?? "").trim().toLowerCase();
  const home = (homeCountry ?? "").trim().toLowerCase();
  if (spot === "" || home === "") return true;
  return spot === home;
}
function parseTime(text) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (m === null) return void 0;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) return void 0;
  if (h === 24 && min !== 0) return void 0;
  const total = h * 60 + min;
  return total === 1440 ? 0 : total;
}
function fmtTime(minutes) {
  const m = (minutes % 1440 + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function parseHours(lines) {
  const byDay = /* @__PURE__ */ new Map();
  for (const raw of lines) {
    if (typeof raw !== "string") continue;
    const line = raw.replace(/[‐-―]/g, "-").trim();
    if (line === "") continue;
    const head = /^([A-Za-z]+)\s*:?\s*(.*)$/.exec(line);
    if (head === null) continue;
    const day = dayFromWord(head[1]);
    if (day === void 0) continue;
    const rest = head[2].trim();
    const ranges = byDay.get(day) ?? [];
    if (!byDay.has(day)) byDay.set(day, ranges);
    if (rest === "" || /closed/i.test(rest)) continue;
    for (const part of rest.split(",")) {
      const pair = part.split("-");
      if (pair.length !== 2) continue;
      const open = parseTime(pair[0]);
      const close = parseTime(pair[1]);
      if (open === void 0 || close === void 0) continue;
      ranges.push({ open, close });
    }
    ranges.sort((a, b) => a.open - b.open);
  }
  return [...byDay.entries()].map(([day, ranges]) => ({ day, ranges })).sort((a, b) => a.day - b.day);
}
function wallClock(now, timeZone) {
  if (timeZone === void 0 || timeZone.trim() === "") {
    return { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() };
  }
  let parts;
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone.trim(),
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(now);
  } catch {
    return null;
  }
  const partValue = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const day = dayFromWord(partValue("weekday"));
  const hourText = partValue("hour");
  const minuteText = partValue("minute");
  if (day === void 0 || !/^\d{1,2}$/.test(hourText) || !/^\d{1,2}$/.test(minuteText)) {
    return null;
  }
  return { day, minutes: Number(hourText) % 24 * 60 + Number(minuteText) };
}
function openState(hours, now, timeZone) {
  if (hours === void 0 || hours.length === 0) return null;
  const parsed = parseHours(hours);
  if (parsed.length === 0) return null;
  const clock = wallClock(now, timeZone);
  if (clock === null) return null;
  const byDay = new Map(parsed.map((d) => [d.day, d.ranges]));
  const today = clock.day;
  const minutes = clock.minutes;
  for (const range of byDay.get(today) ?? []) {
    const overnight = range.close <= range.open;
    if (minutes >= range.open && (overnight || minutes < range.close)) {
      return { open: true, label: `Open until ${fmtTime(range.close)}` };
    }
  }
  for (const range of byDay.get((today + 6) % 7) ?? []) {
    if (range.close < range.open && minutes < range.close) {
      return { open: true, label: `Open until ${fmtTime(range.close)}` };
    }
  }
  const laterToday = (byDay.get(today) ?? []).filter((r) => r.open > minutes).sort((a, b) => a.open - b.open)[0];
  if (laterToday !== void 0) {
    return { open: false, label: `Closed \u2014 opens ${fmtTime(laterToday.open)}` };
  }
  for (let offset = 1; offset <= 7; offset++) {
    const day = (today + offset) % 7;
    const next = (byDay.get(day) ?? []).slice().sort((a, b) => a.open - b.open)[0];
    if (next !== void 0) {
      return { open: false, label: `Closed \u2014 opens ${DAY_LABELS2[day]} ${fmtTime(next.open)}` };
    }
  }
  return { open: false, label: "Closed today" };
}
function formatHoursForDisplay(hours) {
  const lineByDay = /* @__PURE__ */ new Map();
  for (const raw of hours) {
    if (typeof raw !== "string") continue;
    const line = raw.trim();
    if (line === "") continue;
    const head = /^([A-Za-z]+)/.exec(line);
    if (head === null) continue;
    const day = dayFromWord(head[1]);
    if (day === void 0 || lineByDay.has(day)) continue;
    lineByDay.set(day, line);
  }
  return DISPLAY_DAYS.map((day) => lineByDay.get(day) ?? `${DAY_LABELS2[day]} \u2014`);
}

// src/ui/modals/detail.ts
var import_obsidian10 = require("obsidian");

// src/ui/components/starRating.ts
var import_obsidian4 = require("obsidian");
var STAR_COUNT = 5;
function starRating(parent, opts) {
  const root = parent.createDiv({ cls: "fs-star-rating" });
  if (opts.readOnly) root.addClass("fs-readonly");
  root.setAttribute("role", opts.readOnly ? "img" : "slider");
  const starsEl = root.createDiv({ cls: "fs-stars" });
  const starEls = [];
  const fillEls = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const star = starsEl.createDiv({ cls: "fs-star" });
    const bg = star.createDiv({ cls: "fs-star-bg" });
    (0, import_obsidian4.setIcon)(bg, "star");
    const fill = star.createDiv({ cls: "fs-star-fill" });
    (0, import_obsidian4.setIcon)(fill, "star");
    starEls.push(star);
    fillEls.push(fill);
  }
  const labelEl = opts.showLabel ? root.createSpan({ cls: "fs-star-tier-label" }) : null;
  let value = clampValue(opts.value);
  const tierFor2 = (v) => {
    if (v <= 0 || opts.tiers.length === 0) return void 0;
    const idx = Math.min(opts.tiers.length - 1, Math.max(0, Math.ceil(v) - 1));
    return opts.tiers[idx];
  };
  const paint = (v, preview = false) => {
    const tier = tierFor2(v);
    root.style.setProperty("--fs-rating-color", tier ? tier.color : "var(--text-faint)");
    root.toggleClass("fs-previewing", preview);
    for (let i = 0; i < STAR_COUNT; i++) {
      const pct = Math.max(0, Math.min(1, v - i)) * 100;
      const fill = fillEls[i];
      if (fill) fill.style.width = `${pct}%`;
    }
    if (labelEl) labelEl.setText(tier ? tier.label : "");
    root.setAttribute("aria-label", v > 0 ? `${v} out of 5 stars` : "Not rated");
    if (!opts.readOnly) root.setAttribute("aria-valuenow", String(v));
  };
  paint(value);
  if (!opts.readOnly) {
    root.setAttribute("aria-valuemin", "0");
    root.setAttribute("aria-valuemax", "5");
    root.setAttribute("tabindex", "0");
    const valueAt = (starIndex, ev) => {
      const star = starEls[starIndex];
      if (!star) return starIndex + 1;
      if (!opts.halfSteps) return starIndex + 1;
      const rect = star.getBoundingClientRect();
      const half = ev.clientX - rect.left < rect.width / 2;
      return half ? starIndex + 0.5 : starIndex + 1;
    };
    starEls.forEach((star, i) => {
      star.addEventListener("mousemove", (ev) => paint(valueAt(i, ev), true));
      star.addEventListener("click", (ev) => {
        const v = valueAt(i, ev);
        value = Math.abs(v - value) < 1e-3 ? 0 : v;
        paint(value);
        opts.onChange?.(value);
      });
    });
    starsEl.addEventListener("mouseleave", () => paint(value));
    root.addEventListener("keydown", (ev) => {
      const step = opts.halfSteps ? 0.5 : 1;
      let next = null;
      if (ev.key === "ArrowRight" || ev.key === "ArrowUp") next = Math.min(5, value + step);
      else if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") next = Math.max(0, value - step);
      else if (ev.key === "Backspace" || ev.key === "Delete") next = 0;
      if (next === null || next === value) return;
      ev.preventDefault();
      value = next;
      paint(value);
      opts.onChange?.(value);
    });
  }
  return {
    set(v) {
      value = clampValue(v);
      paint(value);
    }
  };
}
function clampValue(v) {
  if (v === void 0 || Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(5, v));
}

// src/ui/modals/confirm.ts
var import_obsidian5 = require("obsidian");
function confirmModal(app, opts) {
  return new Promise((resolve) => {
    new ConfirmModal(app, opts, (r) => resolve(r.confirmed)).open();
  });
}
function confirmModalWithOption(app, opts) {
  return new Promise((resolve) => {
    new ConfirmModal(app, opts, resolve).open();
  });
}
var ConfirmModal = class extends import_obsidian5.Modal {
  constructor(app, opts, resolve) {
    super(app);
    this.opts = opts;
    this.resolve = resolve;
    this.resolved = false;
    this.checked = false;
  }
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-confirm-modal");
    this.titleEl.setText(this.opts.title);
    this.contentEl.createEl("p", { cls: "fs-confirm-body", text: this.opts.body });
    if (this.opts.checkbox) {
      this.checked = this.opts.checkbox.default === true;
      const label = this.contentEl.createEl("label", { cls: "fs-checkbox-label" });
      const cb = label.createEl("input", { type: "checkbox" });
      cb.checked = this.checked;
      label.createSpan({ text: ` ${this.opts.checkbox.label}` });
      cb.addEventListener("change", () => {
        this.checked = cb.checked;
      });
    }
    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const cta = buttons.createEl("button", {
      text: this.opts.cta,
      cls: this.opts.danger ? "mod-warning" : "mod-cta"
    });
    cta.type = "button";
    cta.addEventListener("click", () => {
      this.resolved = true;
      this.resolve({ confirmed: true, checked: this.checked });
      this.close();
    });
    cta.focus();
  }
  onClose() {
    this.contentEl.empty();
    if (!this.resolved) {
      this.resolved = true;
      this.resolve({ confirmed: false, checked: false });
    }
  }
};

// src/ui/modals/addEdit.ts
var import_obsidian6 = require("obsidian");

// src/ui/components/autocomplete.ts
function attachAutocomplete(inputEl, opts) {
  const maxItems = opts.maxItems ?? 8;
  const host = inputEl.parentElement ?? inputEl.ownerDocument.body;
  host.addClass("fs-ac-host");
  const dropdown = host.createDiv({ cls: "fs-ac-dropdown" });
  let open = false;
  let items = [];
  let active = -1;
  let blurTimer;
  const tokens = () => opts.multi ? inputEl.value.split(",").map((t) => t.trim()) : [inputEl.value.trim()];
  const currentToken = () => {
    const t = tokens();
    return (t[t.length - 1] ?? "").toLowerCase();
  };
  const close = () => {
    open = false;
    active = -1;
    dropdown.removeClass("fs-open");
    dropdown.empty();
  };
  const select = (idx) => {
    const chosen = items[idx];
    if (chosen === void 0) return;
    if (opts.multi) {
      const t = tokens();
      t[t.length - 1] = chosen;
      inputEl.value = t.filter(Boolean).join(", ");
    } else {
      inputEl.value = chosen;
    }
    close();
    inputEl.focus();
    inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const paintActive = () => {
    dropdown.querySelectorAll(".fs-ac-item").forEach((el, i) => {
      el.toggleClass("fs-ac-active", i === active);
    });
  };
  const update = () => {
    const token = currentToken();
    const taken = new Set(
      opts.multi ? tokens().slice(0, -1).map((t) => t.toLowerCase()).filter(Boolean) : []
    );
    items = opts.getSuggestions().filter((s) => !taken.has(s.toLowerCase())).filter((s) => token === "" || s.toLowerCase().includes(token)).sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(token) ? 0 : 1;
      const bStarts = b.toLowerCase().startsWith(token) ? 0 : 1;
      return aStarts - bStarts || a.localeCompare(b);
    }).slice(0, maxItems);
    if (items.length === 1 && items[0]?.toLowerCase() === token) items = [];
    if (items.length === 0) {
      close();
      return;
    }
    open = true;
    active = 0;
    dropdown.addClass("fs-open");
    dropdown.empty();
    items.forEach((s, i) => {
      const item = dropdown.createDiv({ cls: "fs-ac-item", text: s });
      if (i === active) item.addClass("fs-ac-active");
      item.addEventListener("mousedown", (ev) => ev.preventDefault());
      item.addEventListener("click", () => select(i));
    });
  };
  const onInput = () => update();
  const onFocus = () => update();
  const onBlur = () => {
    window.clearTimeout(blurTimer);
    blurTimer = window.setTimeout(close, 120);
  };
  const onKeydown = (ev) => {
    if (ev.key === "ArrowDown") {
      if (!open) {
        update();
      } else {
        active = (active + 1) % items.length;
        paintActive();
      }
      if (open) ev.preventDefault();
    } else if (ev.key === "ArrowUp") {
      if (!open) return;
      active = (active - 1 + items.length) % items.length;
      paintActive();
      ev.preventDefault();
    } else if (ev.key === "Enter") {
      if (!open || active < 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      select(active);
    } else if (ev.key === "Escape") {
      if (!open) return;
      ev.preventDefault();
      ev.stopPropagation();
      close();
    }
  };
  inputEl.addEventListener("input", onInput);
  inputEl.addEventListener("focus", onFocus);
  inputEl.addEventListener("blur", onBlur);
  inputEl.addEventListener("keydown", onKeydown);
  return {
    destroy() {
      window.clearTimeout(blurTimer);
      inputEl.removeEventListener("input", onInput);
      inputEl.removeEventListener("focus", onFocus);
      inputEl.removeEventListener("blur", onBlur);
      inputEl.removeEventListener("keydown", onKeydown);
      dropdown.remove();
    }
  };
}

// src/ui/modals/addEdit.ts
function openAddModal(plugin, draft, opts) {
  new AddEditModal(plugin, { mode: "add", draft, focusSearch: opts?.focusSearch }).open();
}
function openEditModal(plugin, path) {
  new AddEditModal(plugin, { mode: "edit", path }).open();
}
function openMergeModal(plugin, path, mergeFields) {
  new AddEditModal(plugin, { mode: "edit", path, mergeFields }).open();
}
var STATUS_LABELS = {
  "want-to-try": "Want to try",
  visited: "Visited"
};
var AddEditModal = class _AddEditModal extends import_obsidian6.Modal {
  constructor(plugin, opts) {
    super(plugin.app);
    this.plugin = plugin;
    this.opts = opts;
    this.existingVisits = [];
    /**
     * Edit mode: the spot as it was when the modal opened. On save, only the
     * fields the user actually changed relative to this snapshot are written —
     * anything edited elsewhere (note editor, sync, rating refresh) while the
     * modal sat open is preserved instead of being clobbered by stale values.
     */
    this.editBaseline = null;
    this.lowConfidence = /* @__PURE__ */ new Set();
    this.mergedKeys = /* @__PURE__ */ new Set();
    this.dupDismissed = false;
    this.dupBannerEl = null;
    this.saving = false;
    this.searchGen = 0;
    this.acHandles = [];
    // Control refs (incremental updates only — never rebuild on input).
    this.searchInput = null;
    this.statusBtns = /* @__PURE__ */ new Map();
    this.priceBtns = [];
    this.state = this.initialState();
  }
  // -------------------------------------------------------------- state
  initialState() {
    const s = {
      name: "",
      cuisines: [],
      status: "want-to-try",
      favorite: false,
      country: this.plugin.settings.defaultCountry ?? "",
      city: "",
      district: "",
      address: "",
      coordsRaw: "",
      ratingLocked: false,
      url: "",
      phone: "",
      tags: [],
      photo: "",
      menu: "",
      notes: "",
      source: "manual",
      external: {}
    };
    if (this.opts.mode === "edit" && this.opts.path) {
      const spot = this.plugin.store.getByPath(this.opts.path);
      if (spot) {
        s.name = spot.name;
        s.cuisines = [...spot.cuisines];
        s.status = spot.status;
        s.favorite = spot.favorite;
        s.country = spot.country;
        s.city = spot.city ?? "";
        s.district = spot.district ?? "";
        s.address = spot.address ?? "";
        s.coordsRaw = spot.coordinates ? `${spot.coordinates.lat}, ${spot.coordinates.lng}` : "";
        s.rating = spot.rating;
        s.ratingLocked = spot.ratingLocked;
        s.price = spot.price;
        s.url = spot.url ?? "";
        s.phone = spot.phone ?? "";
        s.tags = [...spot.tags];
        s.photo = spot.photo ?? "";
        s.menu = spot.menu ?? "";
        s.notes = spot.notes;
        s.source = spot.source;
        s.sourceUrl = spot.sourceUrl;
        s.external = { ...spot.external };
        s.legacyId = spot.legacyId;
        this.existingVisits = spot.visits.map((v) => ({ ...v }));
        this.editBaseline = baselineFromSpot(spot);
      }
    }
    if (this.opts.draft) this.applyDraftTo(s, this.opts.draft);
    if (this.opts.mergeFields) this.applyMergeTo(s, this.opts.mergeFields);
    return s;
  }
  applyDraftTo(s, draft) {
    const f = draft.fields;
    if (f.name !== void 0) s.name = f.name;
    if (f.cuisines !== void 0) s.cuisines = [...f.cuisines];
    if (f.status !== void 0) s.status = f.status;
    if (f.favorite !== void 0) s.favorite = f.favorite;
    if (f.country !== void 0) s.country = f.country;
    if (f.city !== void 0) s.city = f.city;
    if (f.district !== void 0) s.district = f.district;
    if (f.address !== void 0) s.address = f.address;
    if (f.coordinates !== void 0)
      s.coordsRaw = `${f.coordinates.lat}, ${f.coordinates.lng}`;
    if (f.rating !== void 0) s.rating = f.rating;
    if (f.ratingLocked !== void 0) s.ratingLocked = f.ratingLocked;
    if (f.price !== void 0) s.price = f.price;
    if (f.url !== void 0) s.url = f.url;
    if (f.phone !== void 0) s.phone = f.phone;
    if (f.tags !== void 0) s.tags = [...f.tags];
    if (f.photo !== void 0) s.photo = f.photo;
    if (f.menu !== void 0) s.menu = f.menu;
    if (f.notes !== void 0) s.notes = f.notes;
    s.source = f.source ?? kindToSource(draft.importerKind);
    s.sourceUrl = f.sourceUrl ?? draft.sourceUrl;
    if (f.external) s.external = { ...s.external, ...f.external };
    this.lowConfidence = new Set(
      Object.entries(draft.confidence).filter(([, c]) => c === "low").map(([k]) => k === "coordinates" ? "coords" : k)
    );
  }
  /** Fill empty fields of an existing spot from merged draft values. */
  applyMergeTo(s, m) {
    const fill = (key, cur, val) => {
      if (cur.trim() === "" && val && val.trim() !== "") {
        this.mergedKeys.add(key);
        return val;
      }
      return cur;
    };
    s.city = fill("city", s.city, m.city);
    s.district = fill("district", s.district, m.district);
    s.address = fill("address", s.address, m.address);
    s.url = fill("url", s.url, m.url);
    s.phone = fill("phone", s.phone, m.phone);
    s.photo = fill("photo", s.photo, m.photo);
    s.menu = fill("menu", s.menu, m.menu);
    s.country = fill("country", s.country, m.country);
    if (s.coordsRaw.trim() === "" && m.coordinates) {
      s.coordsRaw = `${m.coordinates.lat}, ${m.coordinates.lng}`;
      this.mergedKeys.add("coords");
    }
    if (s.price === void 0 && m.price !== void 0) s.price = m.price;
    if (m.cuisines?.length) {
      const have = new Set(s.cuisines.map((c) => c.toLowerCase()));
      for (const c of m.cuisines) if (!have.has(c.toLowerCase())) s.cuisines.push(c);
    }
    if (m.tags?.length) {
      const have = new Set(s.tags.map((t) => t.toLowerCase()));
      for (const t of m.tags) if (!have.has(t.toLowerCase())) s.tags.push(t);
    }
    if (m.external) {
      s.external = { ...m.external, ...stripUndefined(s.external) };
    }
    if (!s.sourceUrl && m.sourceUrl) s.sourceUrl = m.sourceUrl;
  }
  // -------------------------------------------------------------- render
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-addedit-modal");
    if (this.opts.mode === "edit" && !this.plugin.store.getByPath(this.opts.path ?? "")) {
      new import_obsidian6.Notice("That spot no longer exists.");
      this.close();
      return;
    }
    this.titleEl.setText(
      this.opts.mode === "add" ? "Add a food spot" : `Edit \u2014 ${this.state.name || "spot"}`
    );
    const warnings = this.opts.draft?.warnings ?? [];
    if (warnings.length > 0) {
      const banner = this.contentEl.createDiv({ cls: "fs-import-warnings" });
      const icon = banner.createSpan({ cls: "fs-dup-icon" });
      (0, import_obsidian6.setIcon)(icon, "alert-triangle");
      const list = banner.createDiv();
      for (const w of warnings) list.createDiv({ cls: "fs-import-warning", text: w });
    }
    const body = this.contentEl.createDiv({ cls: "fs-addedit-body" });
    if (this.opts.mode === "add" && this.plugin.importer.hasGoogleKey()) {
      this.buildSearchSection(body);
    }
    this.buildEssentials(body);
    this.buildLocation(body);
    this.buildRatingsPrice(body);
    this.buildExtra(body);
    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    this.saveBtn = buttons.createEl("button", {
      text: this.opts.mode === "add" ? "Add spot" : "Save changes",
      cls: "mod-cta"
    });
    this.saveBtn.type = "button";
    this.saveBtn.addEventListener("click", () => void this.save());
    this.markProvenance();
    window.setTimeout(() => {
      if (this.opts.focusSearch && this.searchInput) this.searchInput.focus();
      else this.nameInput.focus();
    }, 0);
  }
  section(parent, title, icon) {
    const sec = parent.createDiv({ cls: "fs-form-section" });
    const head = sec.createDiv({ cls: "fs-form-section-title" });
    const ic = head.createSpan({ cls: "fs-section-icon" });
    (0, import_obsidian6.setIcon)(ic, icon);
    head.createSpan({ text: title });
    return sec.createDiv({ cls: "fs-form-section-body" });
  }
  field(parent, label, key, wide = false) {
    const wrap = parent.createDiv({ cls: "fs-field" });
    if (wide) wrap.addClass("fs-field-wide");
    wrap.dataset["key"] = key;
    wrap.createEl("label", { cls: "fs-field-label", text: label });
    return wrap;
  }
  textField(parent, label, key, opts) {
    const wrap = this.field(parent, label, key, opts.wide ?? false);
    const input = wrap.createEl("input", { type: "text" });
    if (opts.placeholder) input.placeholder = opts.placeholder;
    input.value = opts.value;
    input.addEventListener("input", () => {
      opts.onInput(input.value);
      this.clearError(key);
      input.removeClass("fs-conf-low");
    });
    wrap.createDiv({ cls: "fs-field-msg" });
    return input;
  }
  // ------------------------------------------------ Google Places search
  buildSearchSection(parent) {
    const body = this.section(parent, "Search online", "search");
    body.addClass("fs-search-section");
    const wrap = body.createDiv({ cls: "fs-field fs-field-wide" });
    this.searchInput = wrap.createEl("input", {
      type: "text",
      cls: "fs-places-search",
      placeholder: "Search Google Places \u2014 \u201Cmomiji den haag\u201D\u2026"
    });
    const results = body.createDiv({ cls: "fs-search-results" });
    this.searchInput.addEventListener("input", () => {
      window.clearTimeout(this.searchTimer);
      const q = this.searchInput?.value.trim() ?? "";
      const gen = ++this.searchGen;
      if (q.length < 2) {
        results.empty();
        return;
      }
      this.searchTimer = window.setTimeout(
        () => void this.runSearch(q, gen, results),
        600
      );
    });
  }
  async runSearch(q, gen, resultsEl) {
    resultsEl.empty();
    resultsEl.createDiv({ cls: "fs-search-status", text: "Searching\u2026" });
    let candidates;
    try {
      candidates = await this.plugin.importer.searchPlaces(q);
    } catch (e) {
      if (gen !== this.searchGen) return;
      resultsEl.empty();
      resultsEl.createDiv({
        cls: "fs-search-status fs-search-error",
        text: `Search failed \u2014 ${errorMessage(e)}`
      });
      return;
    }
    if (gen !== this.searchGen) return;
    resultsEl.empty();
    if (candidates.length === 0) {
      resultsEl.createDiv({ cls: "fs-search-status", text: `No places found for \u201C${q}\u201D.` });
      return;
    }
    const spots = this.plugin.store.getSpots();
    const savedIds = new Set(
      spots.map((s) => s.external.googlePlaceId).filter((id) => !!id)
    );
    const savedNames = new Set(spots.map((s) => normalizeName2(s.name)));
    for (const c of candidates.slice(0, 8)) {
      const saved = savedIds.has(c.placeId) || savedNames.has(normalizeName2(c.name));
      const tile = resultsEl.createDiv({ cls: "fs-result-tile" });
      if (saved) tile.addClass("fs-in-library");
      const main = tile.createDiv({ cls: "fs-result-main" });
      const nameRow = main.createDiv({ cls: "fs-result-name" });
      nameRow.createSpan({ text: c.name });
      if (saved) nameRow.createSpan({ cls: "fs-badge-saved", text: "\u2713 Already saved" });
      main.createDiv({ cls: "fs-result-address", text: c.address });
      const meta = tile.createDiv({ cls: "fs-result-meta" });
      if (c.rating !== void 0) {
        meta.createSpan({
          cls: "fs-result-rating",
          text: `\u2605 ${c.rating.toFixed(1)}${c.ratingCount ? ` (${formatCount(c.ratingCount)})` : ""}`
        });
      }
      if (c.priceLevel !== void 0 && c.priceLevel > 0) {
        meta.createSpan({
          cls: "fs-result-price",
          text: this.plugin.settings.currencySymbol.repeat(Math.min(4, c.priceLevel))
        });
      }
      tile.addEventListener("click", () => void this.pickCandidate(c, resultsEl));
    }
  }
  async pickCandidate(c, resultsEl) {
    const gen = ++this.searchGen;
    resultsEl.empty();
    resultsEl.createDiv({ cls: "fs-search-status", text: `Loading details for ${c.name}\u2026` });
    try {
      const draft = await this.plugin.importer.placeDetails(c.placeId);
      if (gen !== this.searchGen) return;
      this.applyDraftTo(this.state, draft);
      this.syncInputs();
      this.markProvenance();
      resultsEl.empty();
      resultsEl.createDiv({
        cls: "fs-search-status",
        text: `Prefilled from Google \u2014 review the fields below.`
      });
    } catch (e) {
      if (gen !== this.searchGen) return;
      resultsEl.empty();
      resultsEl.createDiv({
        cls: "fs-search-status fs-search-error",
        text: `Couldn't load details \u2014 ${errorMessage(e)}`
      });
    }
  }
  // ------------------------------------------------------------ sections
  buildEssentials(parent) {
    const body = this.section(parent, "Essentials", "utensils");
    const grid = body.createDiv({ cls: "fs-field-grid" });
    this.nameInput = this.textField(grid, "Name", "name", {
      value: this.state.name,
      placeholder: "Momiji",
      wide: true,
      onInput: (v) => {
        this.state.name = v;
        this.resetDupBanner();
      }
    });
    this.cuisinesInput = this.textField(grid, "Cuisines", "cuisines", {
      value: this.state.cuisines.join(", "),
      placeholder: "Japanese, Sushi",
      wide: true,
      onInput: (v) => {
        this.state.cuisines = splitList(v);
      }
    });
    this.acHandles.push(
      attachAutocomplete(this.cuisinesInput, {
        getSuggestions: () => this.plugin.store.distinct("cuisines"),
        multi: true
      })
    );
    const statusWrap = this.field(grid, "Status", "status");
    const seg = statusWrap.createDiv({ cls: "fs-segmented" });
    for (const st of SPOT_STATUSES) {
      const btn = seg.createEl("button", { cls: "fs-seg-btn", text: STATUS_LABELS[st] });
      btn.type = "button";
      btn.addEventListener("click", () => {
        this.state.status = st;
        this.paintStatus();
      });
      this.statusBtns.set(st, btn);
    }
    this.paintStatus();
    const favWrap = this.field(grid, "Favorite", "favorite");
    const favLabel = favWrap.createEl("label", { cls: "fs-checkbox-label" });
    this.favoriteInput = favLabel.createEl("input", { type: "checkbox" });
    this.favoriteInput.checked = this.state.favorite;
    favLabel.createSpan({ text: "Mark as favorite" });
    this.favoriteInput.addEventListener("change", () => {
      this.state.favorite = this.favoriteInput.checked;
    });
  }
  buildLocation(parent) {
    const body = this.section(parent, "Location", "map-pin");
    const grid = body.createDiv({ cls: "fs-field-grid" });
    this.countryInput = this.textField(grid, "Country", "country", {
      value: this.state.country,
      placeholder: "Netherlands",
      onInput: (v) => {
        this.state.country = v;
      }
    });
    this.acHandles.push(
      attachAutocomplete(this.countryInput, {
        getSuggestions: () => this.plugin.store.distinct("country")
      })
    );
    this.cityInput = this.textField(grid, "City", "city", {
      value: this.state.city,
      placeholder: "Den Haag",
      onInput: (v) => {
        this.state.city = v;
      }
    });
    this.acHandles.push(
      attachAutocomplete(this.cityInput, {
        getSuggestions: () => this.plugin.store.distinct("city")
      })
    );
    this.districtInput = this.textField(grid, "District", "district", {
      value: this.state.district,
      placeholder: "Scheveningen",
      onInput: (v) => {
        this.state.district = v;
      }
    });
    this.acHandles.push(
      attachAutocomplete(this.districtInput, {
        getSuggestions: () => this.plugin.store.distinct("district")
      })
    );
    this.addressInput = this.textField(grid, "Address", "address", {
      value: this.state.address,
      placeholder: "Street 1, 2511 XX",
      onInput: (v) => {
        this.state.address = v;
      }
    });
    this.coordsInput = this.textField(grid, "Coordinates", "coords", {
      value: this.state.coordsRaw,
      placeholder: "52.0808, 4.2889 \u2014 paste \u201Clat, lng\u201D; clear to remove both",
      wide: true,
      onInput: (v) => {
        this.state.coordsRaw = v;
      }
    });
  }
  buildRatingsPrice(parent) {
    const body = this.section(parent, "Ratings & price", "star");
    const grid = body.createDiv({ cls: "fs-field-grid" });
    const ratingWrap = this.field(grid, "My rating", "rating");
    this.starHandle = starRating(ratingWrap, {
      value: this.state.rating,
      halfSteps: this.plugin.settings.halfStarRatings,
      tiers: this.plugin.settings.ratingTiers,
      showLabel: true,
      onChange: (v) => {
        if (v > 0) {
          this.state.rating = v;
          this.state.ratingLocked = true;
        } else {
          this.state.rating = void 0;
          this.state.ratingLocked = false;
        }
      }
    });
    ratingWrap.createDiv({
      cls: "fs-field-hint",
      text: "Set manually to lock it; otherwise it follows your visit ratings."
    });
    const priceWrap = this.field(grid, "Price", "price");
    const seg = priceWrap.createDiv({ cls: "fs-segmented" });
    this.priceBtns = [];
    for (let n = 1; n <= 4; n++) {
      const btn = seg.createEl("button", {
        cls: "fs-seg-btn",
        text: this.plugin.settings.currencySymbol.repeat(n)
      });
      btn.type = "button";
      btn.addEventListener("click", () => {
        this.state.price = this.state.price === n ? void 0 : n;
        this.paintPrice();
      });
      this.priceBtns.push(btn);
    }
    this.paintPrice();
    this.urlInput = this.textField(grid, "Website", "url", {
      value: this.state.url,
      placeholder: "https://\u2026",
      onInput: (v) => {
        this.state.url = v;
      }
    });
    this.phoneInput = this.textField(grid, "Phone", "phone", {
      value: this.state.phone,
      placeholder: "+31 70 \u2026",
      onInput: (v) => {
        this.state.phone = v;
      }
    });
    this.taUrlInput = this.textField(grid, "TripAdvisor URL", "tripadvisorUrl", {
      value: this.state.external.tripadvisorUrl ?? "",
      placeholder: "https://www.tripadvisor.com/\u2026",
      wide: true,
      onInput: (v) => {
        this.state.external.tripadvisorUrl = emptyToUndef(v);
      }
    });
    this.yelpUrlInput = this.textField(grid, "Yelp URL", "yelpUrl", {
      value: this.state.external.yelpUrl ?? "",
      placeholder: "https://www.yelp.com/biz/\u2026",
      wide: true,
      onInput: (v) => {
        this.state.external.yelpUrl = emptyToUndef(v);
      }
    });
    this.theforkUrlInput = this.textField(grid, "TheFork URL", "theforkUrl", {
      value: this.state.external.theforkUrl ?? "",
      placeholder: "https://www.thefork.com/restaurant/\u2026",
      wide: true,
      onInput: (v) => {
        this.state.external.theforkUrl = emptyToUndef(v);
      }
    });
    this.facebookUrlInput = this.textField(grid, "Facebook URL", "facebookUrl", {
      value: this.state.external.facebookUrl ?? "",
      placeholder: "https://www.facebook.com/\u2026",
      wide: true,
      onInput: (v) => {
        this.state.external.facebookUrl = emptyToUndef(v);
      }
    });
    this.opentableUrlInput = this.textField(grid, "OpenTable URL", "opentableUrl", {
      value: this.state.external.opentableUrl ?? "",
      placeholder: "https://www.opentable.com/r/\u2026",
      wide: true,
      onInput: (v) => {
        this.state.external.opentableUrl = emptyToUndef(v);
      }
    });
    this.eetnuUrlInput = this.textField(grid, "Eet.nu URL", "eetnuUrl", {
      value: this.state.external.eetnuUrl ?? "",
      placeholder: "https://www.eet.nu/\u2026",
      wide: true,
      onInput: (v) => {
        this.state.external.eetnuUrl = emptyToUndef(v);
      }
    });
    const hint = grid.createDiv({ cls: "fs-field-hint fs-field-wide" });
    hint.setText(
      "Paste the spot's page link per source \u2014 public ratings are fetched from it on Refresh. TheFork and Eet.nu use a 10-scale. Facebook only works for pages that expose ratings publicly."
    );
  }
  buildExtra(parent) {
    const body = this.section(parent, "Extra", "tag");
    const grid = body.createDiv({ cls: "fs-field-grid" });
    this.tagsInput = this.textField(grid, "Tags", "tags", {
      value: this.state.tags.join(", "),
      placeholder: "date-night, terrace",
      wide: true,
      onInput: (v) => {
        this.state.tags = splitList(v);
      }
    });
    this.acHandles.push(
      attachAutocomplete(this.tagsInput, {
        getSuggestions: () => this.plugin.store.distinct("tags"),
        multi: true
      })
    );
    this.photoInput = this.textField(grid, "Photo", "photo", {
      value: this.state.photo,
      placeholder: "https://\u2026 or a vault path",
      wide: true,
      onInput: (v) => {
        this.state.photo = v;
      }
    });
    this.menuInput = this.textField(grid, "Menu", "menu", {
      value: this.state.menu,
      placeholder: "https://\u2026 or a vault path (image/PDF)",
      wide: true,
      onInput: (v) => {
        this.state.menu = v;
      }
    });
    const notesWrap = this.field(grid, "Notes", "notes", true);
    this.notesArea = notesWrap.createEl("textarea", { cls: "fs-notes-input" });
    this.notesArea.rows = 3;
    this.notesArea.value = this.state.notes;
    this.notesArea.addEventListener("input", () => {
      this.state.notes = this.notesArea.value;
    });
  }
  // --------------------------------------------------------- sync/paint
  paintStatus() {
    for (const [st, btn] of this.statusBtns) {
      btn.toggleClass("fs-active", st === this.state.status);
    }
  }
  paintPrice() {
    this.priceBtns.forEach((btn, i) => {
      btn.toggleClass("fs-active", this.state.price !== void 0 && i < this.state.price);
    });
  }
  /** Push state into existing controls (used after search prefill). */
  syncInputs() {
    this.nameInput.value = this.state.name;
    this.cuisinesInput.value = this.state.cuisines.join(", ");
    this.favoriteInput.checked = this.state.favorite;
    this.countryInput.value = this.state.country;
    this.cityInput.value = this.state.city;
    this.districtInput.value = this.state.district;
    this.addressInput.value = this.state.address;
    this.coordsInput.value = this.state.coordsRaw;
    this.urlInput.value = this.state.url;
    this.phoneInput.value = this.state.phone;
    this.tagsInput.value = this.state.tags.join(", ");
    this.photoInput.value = this.state.photo;
    this.menuInput.value = this.state.menu;
    this.taUrlInput.value = this.state.external.tripadvisorUrl ?? "";
    this.yelpUrlInput.value = this.state.external.yelpUrl ?? "";
    this.theforkUrlInput.value = this.state.external.theforkUrl ?? "";
    this.facebookUrlInput.value = this.state.external.facebookUrl ?? "";
    this.opentableUrlInput.value = this.state.external.opentableUrl ?? "";
    this.eetnuUrlInput.value = this.state.external.eetnuUrl ?? "";
    this.notesArea.value = this.state.notes;
    this.starHandle.set(this.state.rating);
    this.paintStatus();
    this.paintPrice();
    this.resetDupBanner();
  }
  /** Italic/faded styling on low-confidence or merged-in fields. */
  markProvenance() {
    const keys = /* @__PURE__ */ new Set([...this.lowConfidence, ...this.mergedKeys]);
    this.contentEl.querySelectorAll(".fs-field").forEach((wrap) => {
      const key = wrap.dataset["key"] ?? "";
      const control = wrap.querySelector("input, textarea");
      if (!control) return;
      control.toggleClass("fs-conf-low", keys.has(key));
    });
  }
  // ---------------------------------------------------------- validation
  setError(key, msg) {
    const wrap = this.contentEl.querySelector(`.fs-field[data-key="${key}"]`);
    if (!wrap) return false;
    wrap.addClass("fs-field-error");
    wrap.querySelector(".fs-field-msg")?.setText(msg);
    return true;
  }
  clearError(key) {
    const wrap = this.contentEl.querySelector(`.fs-field[data-key="${key}"]`);
    if (!wrap) return;
    wrap.removeClass("fs-field-error");
    wrap.querySelector(".fs-field-msg")?.setText("");
  }
  validate() {
    for (const key of [
      "name",
      "coords",
      "url",
      "tripadvisorUrl",
      "yelpUrl",
      "theforkUrl",
      "facebookUrl",
      "opentableUrl",
      "eetnuUrl"
    ]) {
      this.clearError(key);
    }
    let firstBad = null;
    let ok = true;
    if (this.state.name.trim() === "") {
      this.setError("name", "A name is required.");
      firstBad = firstBad ?? this.nameInput;
      ok = false;
    }
    let coordinates;
    const parsed = parseCoords(this.state.coordsRaw);
    if (parsed === "invalid") {
      this.setError("coords", "Use \u201Clat, lng\u201D \u2014 e.g. 52.0808, 4.2889 (lat \u221290\u202690, lng \u2212180\u2026180).");
      firstBad = firstBad ?? this.coordsInput;
      ok = false;
    } else if (parsed) {
      coordinates = parsed;
    }
    const url = this.state.url.trim();
    if (url !== "" && !/^https?:\/\//i.test(url)) {
      this.setError("url", "Must be a full link starting with http:// or https://.");
      firstBad = firstBad ?? this.urlInput;
      ok = false;
    }
    const sourceUrls = [
      ["tripadvisorUrl", this.state.external.tripadvisorUrl, this.taUrlInput],
      ["yelpUrl", this.state.external.yelpUrl, this.yelpUrlInput],
      ["theforkUrl", this.state.external.theforkUrl, this.theforkUrlInput],
      ["facebookUrl", this.state.external.facebookUrl, this.facebookUrlInput],
      ["opentableUrl", this.state.external.opentableUrl, this.opentableUrlInput],
      ["eetnuUrl", this.state.external.eetnuUrl, this.eetnuUrlInput]
    ];
    for (const [key, value, input] of sourceUrls) {
      if (value !== void 0 && !/^https?:\/\//i.test(value)) {
        this.setError(key, "Must be a full link starting with http:// or https://.");
        firstBad = firstBad ?? input;
        ok = false;
      }
    }
    if (firstBad) firstBad.focus();
    return ok ? { ok, coordinates } : { ok };
  }
  buildInput(coordinates) {
    const s = this.state;
    return {
      name: s.name.trim(),
      cuisines: s.cuisines,
      country: s.country.trim(),
      city: emptyToUndef(s.city),
      district: emptyToUndef(s.district),
      address: emptyToUndef(s.address),
      coordinates,
      status: s.status,
      favorite: s.favorite,
      rating: s.rating,
      ratingLocked: s.ratingLocked,
      price: s.price,
      url: emptyToUndef(s.url),
      phone: emptyToUndef(s.phone),
      source: s.source,
      sourceUrl: s.sourceUrl,
      // v0.1 defect #3: external ratings must survive the save.
      external: { ...s.external },
      photo: emptyToUndef(s.photo),
      menu: emptyToUndef(s.menu),
      tags: s.tags,
      visits: this.existingVisits,
      legacyId: s.legacyId,
      notes: s.notes
    };
  }
  /**
   * Edit mode: only the fields the user changed vs. the open-time snapshot.
   * `visits` is deliberately NEVER included — this modal doesn't edit visits,
   * and writing a full list would erase visits logged while it was open and
   * flatten non-visit lines the user keeps inside `## Visits`.
   */
  editPartial(input) {
    const base = this.editBaseline;
    if (!base) {
      const { visits: _visits, ...rest } = input;
      return rest;
    }
    const out = {};
    const scalars = [
      "name",
      "country",
      "city",
      "district",
      "address",
      "status",
      "favorite",
      "rating",
      "ratingLocked",
      "price",
      "url",
      "phone",
      "source",
      "sourceUrl",
      "photo",
      "menu",
      "notes"
    ];
    for (const key of scalars) {
      if (input[key] !== base[key]) {
        out[key] = input[key];
      }
    }
    if (!sameList(input.cuisines, base.cuisines)) out.cuisines = input.cuisines;
    if (!sameList(input.tags, base.tags)) out.tags = input.tags;
    if (input.coordinates?.lat !== base.coordinates?.lat || input.coordinates?.lng !== base.coordinates?.lng) {
      out.coordinates = input.coordinates;
    }
    if (!sameExternal(input.external, base.external)) {
      out.external = input.external;
    }
    return out;
  }
  // ------------------------------------------------------------- saving
  async save() {
    if (this.saving) return;
    const { ok, coordinates } = this.validate();
    if (!ok) return;
    const input = this.buildInput(coordinates);
    if (this.opts.mode === "add" && this.plugin.settings.duplicateDetectionEnabled && !this.dupDismissed) {
      let dups = [];
      try {
        dups = this.plugin.importer.findDuplicates(input, this.plugin.store.getSpots());
      } catch {
      }
      if (dups.length > 0) {
        this.showDupBanner(dups);
        return;
      }
    }
    this.saving = true;
    this.saveBtn.disabled = true;
    try {
      if (this.opts.mode === "add") {
        const spot = await this.plugin.store.createSpot(input);
        new import_obsidian6.Notice(`Added \u201C${spot.name}\u201D.`);
      } else if (this.opts.path) {
        await this.plugin.store.updateSpot(this.opts.path, this.editPartial(input));
        new import_obsidian6.Notice(`Saved \u201C${input.name}\u201D.`);
      }
      this.close();
    } catch (e) {
      this.saving = false;
      this.saveBtn.disabled = false;
      new import_obsidian6.Notice(`Food Spot: save failed \u2014 ${errorMessage(e)}`);
    }
  }
  // ---------------------------------------------------- duplicate banner
  showDupBanner(dups) {
    this.dupBannerEl?.remove();
    const dup = dups[0];
    if (!dup) return;
    const banner = createDiv({ cls: "fs-dup-banner" });
    const icon = banner.createSpan({ cls: "fs-dup-icon" });
    (0, import_obsidian6.setIcon)(icon, "alert-triangle");
    const text = banner.createDiv({ cls: "fs-dup-text" });
    text.createDiv({
      text: `This looks like \u201C${dup.name}\u201D${dup.city ? ` in ${dup.city}` : ""}, which is already in your library.`
    });
    const actions = text.createDiv({ cls: "fs-dup-actions" });
    const merge = actions.createEl("button", { text: "Merge into existing", cls: "mod-cta" });
    merge.type = "button";
    merge.addEventListener("click", () => {
      const fields = this.buildInput(parseCoordsSafe(this.state.coordsRaw));
      this.close();
      new _AddEditModal(this.plugin, {
        mode: "edit",
        path: dup.path,
        mergeFields: fields
      }).open();
    });
    const keep = actions.createEl("button", { text: "Keep as new" });
    keep.type = "button";
    keep.addEventListener("click", () => {
      this.dupDismissed = true;
      this.resetDupBanner();
      void this.save();
    });
    this.contentEl.prepend(banner);
    this.dupBannerEl = banner;
    banner.scrollIntoView({ block: "nearest" });
  }
  resetDupBanner() {
    this.dupBannerEl?.remove();
    this.dupBannerEl = null;
  }
  onClose() {
    window.clearTimeout(this.searchTimer);
    this.searchGen++;
    for (const h of this.acHandles) h.destroy();
    this.acHandles = [];
    this.contentEl.empty();
  }
};
function kindToSource(kind) {
  switch (kind) {
    case "google-maps":
      return "google-maps";
    case "tripadvisor":
      return "tripadvisor";
    default:
      return "url";
  }
}
function normalizeName2(name) {
  return name.normalize("NFKD").replace(/\p{M}+/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}
function splitList(v) {
  return v.split(",").map((t) => t.trim()).filter(Boolean);
}
function emptyToUndef(v) {
  const t = v.trim();
  return t === "" ? void 0 : t;
}
function parseCoords(raw) {
  const t = raw.trim().replace(/^[([]+/, "").replace(/[)\]]+$/, "").trim();
  if (t === "") return null;
  const m = t.match(/^(-?\d+(?:[.,]\d+)?)\s*(?:[,;]|\s)\s*(-?\d+(?:[.,]\d+)?)$/);
  if (!m || m[1] === void 0 || m[2] === void 0) return "invalid";
  const lat = parseFloat(m[1].replace(",", "."));
  const lng = parseFloat(m[2].replace(",", "."));
  if (Number.isNaN(lat) || Number.isNaN(lng)) return "invalid";
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return "invalid";
  return { lat, lng };
}
function parseCoordsSafe(raw) {
  const p = parseCoords(raw);
  return p === null || p === "invalid" ? void 0 : p;
}
function formatCount(n) {
  return n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}
function baselineFromSpot(spot) {
  return {
    name: spot.name,
    cuisines: [...spot.cuisines],
    country: spot.country,
    city: spot.city,
    district: spot.district,
    address: spot.address,
    coordinates: spot.coordinates ? { ...spot.coordinates } : void 0,
    status: spot.status,
    favorite: spot.favorite,
    rating: spot.rating,
    ratingLocked: spot.ratingLocked,
    price: spot.price,
    url: spot.url,
    phone: spot.phone,
    source: spot.source,
    sourceUrl: spot.sourceUrl,
    external: { ...spot.external },
    photo: spot.photo,
    menu: spot.menu,
    tags: [...spot.tags],
    visits: [],
    legacyId: spot.legacyId,
    notes: spot.notes
  };
}
function sameList(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
function sameExternal(a, b) {
  const av = a;
  const bv = b;
  for (const key of /* @__PURE__ */ new Set([...Object.keys(av), ...Object.keys(bv)])) {
    if (av[key] !== bv[key]) return false;
  }
  return true;
}
function stripUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== void 0) out[k] = v;
  }
  return out;
}
function errorMessage(e) {
  return e instanceof Error ? e.message : String(e);
}

// src/ui/modals/browserFetch.ts
var import_obsidian7 = require("obsidian");
function canBrowserFetch() {
  return import_obsidian7.Platform.isDesktopApp;
}
var POLL_MS = 1500;
var TIMEOUT_MS = 12e4;
function mapToExternal(url, ld) {
  const source = detectRatingSource(url);
  const out = {};
  if (ld.rating === void 0 || source === null) return out;
  switch (source) {
    case "tripadvisor":
      out.tripadvisorRating = ld.rating;
      if (ld.ratingCount !== void 0) out.tripadvisorRatingCount = ld.ratingCount;
      out.tripadvisorUrl = url;
      break;
    case "yelp":
      out.yelpRating = ld.rating;
      if (ld.ratingCount !== void 0) out.yelpRatingCount = ld.ratingCount;
      out.yelpUrl = url;
      break;
    case "facebook":
      out.facebookRating = ld.rating;
      if (ld.ratingCount !== void 0) out.facebookRatingCount = ld.ratingCount;
      out.facebookUrl = url;
      break;
    case "opentable":
      out.opentableRating = ld.rating;
      if (ld.ratingCount !== void 0) out.opentableRatingCount = ld.ratingCount;
      out.opentableUrl = url;
      break;
    case "thefork": {
      const v = theforkRating10(ld);
      if (v !== void 0) {
        out.theforkRating = v;
        if (ld.ratingCount !== void 0) out.theforkRatingCount = ld.ratingCount;
        out.theforkUrl = url;
      }
      break;
    }
    case "eetnu": {
      const v = theforkRating10(ld);
      if (v !== void 0) {
        out.eetnuRating = v;
        if (ld.ratingCount !== void 0) out.eetnuRatingCount = ld.ratingCount;
        out.eetnuUrl = url;
      }
      break;
    }
    case "google":
      break;
  }
  return out;
}
function errorMessage2(e) {
  return e instanceof Error ? e.message : String(e);
}
var BrowserFetchModal = class extends import_obsidian7.Modal {
  constructor(plugin, path, url, onFinished) {
    super(plugin.app);
    this.plugin = plugin;
    this.path = path;
    this.url = url;
    this.onFinished = onFinished;
    this.timer = null;
    /** Stops the poll loop: the modal is closed, finished, or waiting on a retry. */
    this.done = false;
    /** The queue must advance exactly once, whatever order close/save happen in. */
    this.settled = false;
    /** Whether a rating was actually written before the modal closed. */
    this.found = false;
  }
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-browser-fetch-modal");
    let host = "the page";
    try {
      host = new URL(this.url).hostname.replace(/^www\./, "");
    } catch {
    }
    this.titleEl.setText(`Fetching rating from ${host}\u2026`);
    const status = this.contentEl.createDiv({
      cls: "fs-import-status",
      text: "Loading the real page \u2014 the rating is saved automatically. If a captcha appears, solve it here and I'll take it from there."
    });
    const wv = this.contentEl.createEl("webview", {
      attr: { src: this.url },
      cls: "fs-browser-webview"
    });
    const actions = this.contentEl.createDiv({ cls: "fs-modal-buttons is-hidden" });
    const retryBtn = actions.createEl("button", { text: "Try again", cls: "mod-cta" });
    retryBtn.type = "button";
    const closeBtn = actions.createEl("button", { text: "Close" });
    closeBtn.type = "button";
    closeBtn.addEventListener("click", () => this.close());
    let started = Date.now();
    const EXTRACT = `JSON.stringify(Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => s.textContent || ''))`;
    const stall = (message) => {
      this.done = true;
      status.setText(message);
      actions.removeClass("is-hidden");
    };
    const poll = async () => {
      if (this.done) return;
      if (Date.now() - started > TIMEOUT_MS) {
        stall("Timed out \u2014 the page never produced a rating. Try again or close.");
        return;
      }
      try {
        const raw = await wv.executeJavaScript?.(EXTRACT);
        if (this.done) return;
        if (typeof raw === "string") {
          const scripts = JSON.parse(raw);
          const html = scripts.map((t) => `<script type="application/ld+json">${t}<\/script>`).join("\n");
          const ld = extractJsonLd(html);
          if (ld !== null && ld.rating !== void 0) {
            const patch = mapToExternal(this.url, ld);
            if (Object.keys(patch).length > 0) {
              const spot = this.plugin.store.getByPath(this.path);
              if (!spot) {
                stall(
                  "That spot is no longer in your library \u2014 the rating was read but not saved."
                );
                return;
              }
              patch.ratingsUpdated = todayIso();
              try {
                await this.plugin.store.updateSpot(this.path, {
                  external: { ...spot.external, ...patch }
                });
              } catch (e) {
                const why = errorMessage2(e);
                new import_obsidian7.Notice(`Food Spot: couldn't save the ${host} rating \u2014 ${why}`);
                stall(`The rating was read but saving it failed \u2014 ${why}. Try again or close.`);
                return;
              }
              this.found = true;
              new import_obsidian7.Notice(`Rating fetched from ${host} and saved.`);
              if (this.done) return;
              this.done = true;
              this.close();
              return;
            }
          }
        }
      } catch {
      }
      this.timer = window.setTimeout(() => void poll(), POLL_MS);
    };
    retryBtn.addEventListener("click", () => {
      actions.addClass("is-hidden");
      status.setText("Trying again \u2014 reading the page\u2026");
      started = Date.now();
      this.done = false;
      if (this.timer !== null) window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => void poll(), POLL_MS);
    });
    this.timer = window.setTimeout(() => void poll(), POLL_MS);
  }
  /** Advances the queue at most once. */
  finish(found) {
    if (this.settled) return;
    this.settled = true;
    this.onFinished(found);
  }
  onClose() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.done = true;
    this.contentEl.empty();
    this.finish(this.found);
  }
};
function openBrowserFetchQueue(plugin, path, urls) {
  if (!canBrowserFetch()) {
    new import_obsidian7.Notice("Browser fetch is only available on desktop.");
    return;
  }
  const [head, ...rest] = urls;
  if (head === void 0) return;
  new BrowserFetchModal(plugin, path, head, () => {
    if (rest.length > 0) openBrowserFetchQueue(plugin, path, rest);
  }).open();
}

// src/ui/components/dishPhotos.ts
var import_obsidian8 = require("obsidian");
var IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|avif)$/i;
function sanitize(name) {
  return name.replace(/[\\/:*?"<>|#^[\]]/g, " ").replace(/\s+/g, " ").trim();
}
function resolveDishFile(plugin, ref, sourcePath) {
  const raw = embedRefPath(ref);
  if (!raw || /^https?:\/\//i.test(raw)) return null;
  const direct = plugin.app.metadataCache.getFirstLinkpathDest(raw, sourcePath);
  if (direct) return direct;
  const byPath = plugin.app.vault.getAbstractFileByPath((0, import_obsidian8.normalizePath)(raw));
  return byPath instanceof import_obsidian8.TFile ? byPath : null;
}
async function importDishPhotos(plugin, spot, date, files) {
  const dir = (0, import_obsidian8.normalizePath)(`${plugin.settings.mediaFolder}/dishes`);
  await ensureFolder(plugin.app, dir);
  const saved = [];
  let index = 1;
  for (const file of files) {
    if (!IMAGE_EXT.test(file.name) && !file.type.startsWith("image/")) {
      new import_obsidian8.Notice(`Skipped "${file.name}" \u2014 not an image.`);
      continue;
    }
    const ext = (IMAGE_EXT.exec(file.name)?.[0] ?? ".jpg").toLowerCase();
    const base = `${sanitize(spot.name)} ${date}`;
    let candidate = `${dir}/${base} ${index}${ext}`;
    while (plugin.app.vault.getAbstractFileByPath(candidate) !== null) {
      index++;
      candidate = `${dir}/${base} ${index}${ext}`;
    }
    try {
      await plugin.app.vault.createBinary(candidate, await file.arrayBuffer());
      saved.push(candidate);
      index++;
    } catch (e) {
      new import_obsidian8.Notice(`Couldn't save "${file.name}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return saved;
}
function pickImageFiles() {
  return new Promise((resolve) => {
    const input = createEl("input", {
      type: "file",
      attr: { accept: "image/*", multiple: "true", style: "display: none" }
    });
    document.body.appendChild(input);
    let settled = false;
    const finish = (files) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(files);
    };
    input.addEventListener("change", () => finish(Array.from(input.files ?? [])));
    window.addEventListener("focus", () => window.setTimeout(() => finish([]), 400), {
      once: true
    });
    input.click();
  });
}
function renderDishThumbs(parent, plugin, photos, sourcePath, onRemove) {
  if (photos.length === 0) return;
  const strip = parent.createDiv({ cls: "fs-dish-strip" });
  for (const ref of photos) {
    const cell = strip.createDiv({ cls: "fs-dish-thumb" });
    const file = resolveDishFile(plugin, ref, sourcePath);
    if (file) {
      const img = cell.createEl("img", { cls: "fs-dish-img" });
      img.src = plugin.app.vault.getResourcePath(file);
      img.alt = file.basename;
      cell.title = file.name;
      cell.addEventListener("click", () => {
        void plugin.app.workspace.openLinkText(file.path, sourcePath);
      });
    } else {
      cell.addClass("fs-dish-missing");
      cell.setText("?");
      cell.title = `Missing: ${ref}`;
    }
    if (onRemove) {
      const rm = cell.createEl("button", {
        cls: "fs-dish-remove",
        attr: { "aria-label": "Remove photo" }
      });
      rm.type = "button";
      rm.setText("\xD7");
      rm.addEventListener("click", (e) => {
        e.stopPropagation();
        onRemove(ref);
      });
    }
  }
}

// src/ui/modals/gallery.ts
var import_obsidian9 = require("obsidian");
function openGalleryModal(plugin, path) {
  new GalleryModal(plugin, path).open();
}
function collect(spots) {
  const entries = [];
  for (const spot of spots) {
    for (const visit of spot.visits) {
      for (const ref of visit.photos ?? []) {
        entries.push({ ref, sourcePath: spot.path, spotName: spot.name, date: visit.date });
      }
    }
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
function formatDate(iso, fmt) {
  const parts = iso.split("T")[0]?.split("-");
  if (!parts || parts.length !== 3) return iso;
  const [y, m, d] = parts;
  switch (fmt) {
    case "european":
      return `${d}-${m}-${y}`;
    case "american":
      return `${m}/${d}/${y}`;
    default:
      return `${y}-${m}-${d}`;
  }
}
var GalleryModal = class extends import_obsidian9.Modal {
  constructor(plugin, path) {
    super(plugin.app);
    this.plugin = plugin;
    this.path = path;
    this.observer = null;
    /** Tile -> "load me now", consumed once the tile scrolls into view. */
    this.loaders = /* @__PURE__ */ new WeakMap();
  }
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-gallery-modal");
    const spot = this.path === void 0 ? void 0 : this.plugin.store.getByPath(this.path);
    this.titleEl.setText(spot ? `Dish photos \u2014 ${spot.name}` : "Dish photos");
    const entries = collect(spot ? [spot] : this.plugin.store.getSpots());
    const body = this.contentEl;
    if (entries.length === 0) {
      body.createDiv({
        cls: "fs-empty-state",
        text: "No dish photos yet \u2014 add them when you log a visit."
      });
      return;
    }
    body.createDiv({
      cls: "fs-gallery-count",
      text: `${entries.length} photo${entries.length === 1 ? "" : "s"}`
    });
    const grid = body.createDiv({ cls: "fs-gallery-grid" });
    this.observer = new IntersectionObserver(
      (observed) => {
        for (const entry of observed) {
          if (!entry.isIntersecting) continue;
          this.observer?.unobserve(entry.target);
          const load = this.loaders.get(entry.target);
          this.loaders.delete(entry.target);
          load?.();
        }
      },
      { root: grid, rootMargin: "200px" }
    );
    for (const entry of entries) this.renderTile(grid, entry, spot === void 0);
  }
  renderTile(grid, entry, showSpotName) {
    const tile = grid.createDiv({ cls: "fs-gallery-tile" });
    const frame = tile.createDiv({ cls: "fs-gallery-frame" });
    const date = formatDate(entry.date, this.plugin.settings.dateFormat);
    tile.createDiv({
      cls: "fs-gallery-caption",
      text: showSpotName ? `${entry.spotName} \xB7 ${date}` : date
    });
    const file = resolveDishFile(this.plugin, entry.ref, entry.sourcePath);
    if (!file) {
      frame.addClass("fs-gallery-missing");
      frame.setText("?");
      frame.title = `Missing: ${entry.ref}`;
      return;
    }
    tile.title = showSpotName ? `${entry.spotName} \u2014 ${file.name}` : file.name;
    this.loaders.set(frame, () => {
      const img = frame.createEl("img", { cls: "fs-gallery-img" });
      img.src = this.plugin.app.vault.getResourcePath(file);
      img.alt = file.basename;
      img.loading = "lazy";
    });
    this.observer?.observe(frame);
    tile.addEventListener("click", () => {
      if (showSpotName) openDetailModal(this.plugin, entry.sourcePath);
      else void this.openImage(file, entry.sourcePath);
    });
  }
  async openImage(file, sourcePath) {
    this.close();
    await this.plugin.app.workspace.openLinkText(file.path, sourcePath);
  }
  onClose() {
    this.observer?.disconnect();
    this.observer = null;
    this.contentEl.empty();
  }
};

// src/ui/modals/detail.ts
function openDetailModal(plugin, path) {
  new DetailModal(plugin, path).open();
}
var STATUS_LABELS2 = {
  "want-to-try": "Want to try",
  visited: "Visited"
};
var DetailModal = class extends import_obsidian10.Modal {
  constructor(plugin, path) {
    super(plugin.app);
    this.plugin = plugin;
    this.path = path;
    this.unsubscribe = null;
    this.pendingRefresh = false;
    this.pendingNotes = null;
    this.editingVisitIndex = null;
    this.addingVisit = false;
    this.refreshingRatings = false;
    this.closed = false;
  }
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-detail-modal");
    this.unsubscribe = this.plugin.store.onChange(() => this.onStoreChange());
    this.contentEl.addEventListener("focusout", () => {
      window.clearTimeout(this.focusTimer);
      this.focusTimer = window.setTimeout(() => {
        if (this.closed) return;
        if (this.pendingRefresh && !this.typingInside()) {
          this.pendingRefresh = false;
          this.render();
        }
      }, 120);
    });
    this.render();
  }
  typingInside() {
    const ae = document.activeElement;
    return ae instanceof HTMLElement && this.contentEl.contains(ae) && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA");
  }
  onStoreChange() {
    if (this.typingInside() || this.editingVisitIndex !== null || this.addingVisit) {
      this.pendingRefresh = true;
      return;
    }
    this.render();
  }
  spot() {
    return this.plugin.store.getByPath(this.path);
  }
  // -------------------------------------------------------------- render
  render() {
    if (this.closed) return;
    const spot = this.spot();
    if (!spot) {
      this.close();
      return;
    }
    this.contentEl.empty();
    this.titleEl.setText("");
    this.renderHeader(this.contentEl, spot);
    this.renderControls(this.contentEl, spot);
    this.renderChips(this.contentEl, spot);
    this.renderInfo(this.contentEl, spot);
    this.renderExternal(this.contentEl, spot);
    this.renderVisits(this.contentEl, spot);
    this.renderNotes(this.contentEl, spot);
    this.renderFooter(this.contentEl, spot);
  }
  renderHeader(parent, spot) {
    const header = parent.createDiv({ cls: "fs-detail-header" });
    const photo = header.createDiv({ cls: "fs-detail-photo" });
    const placeholder = () => {
      photo.empty();
      photo.addClass("fs-photo-placeholder");
      const tierPalette = this.plugin.settings.ratingTiers;
      const key = spot.cuisines[0] ?? spot.name;
      const tier = tierPalette[hashStr(key) % Math.max(1, tierPalette.length)];
      photo.style.background = tier ? `color-mix(in srgb, ${tier.color} 45%, var(--background-secondary))` : "var(--background-secondary)";
      photo.createSpan({
        cls: "fs-photo-letter",
        text: (spot.name.trim().charAt(0) || "?").toUpperCase()
      });
    };
    const src = this.resolvePhoto(spot);
    if (src) {
      const img = photo.createEl("img", { cls: "fs-detail-img" });
      img.alt = spot.name;
      img.addEventListener("error", placeholder);
      img.src = src;
    } else {
      placeholder();
    }
    const nameRow = header.createDiv({ cls: "fs-detail-name-row" });
    const h2 = nameRow.createEl("h2", { cls: "fs-detail-name", text: spot.name });
    h2.title = "Click to rename";
    h2.addEventListener("click", () => this.editName(nameRow, h2, spot));
  }
  editName(row, h2, spot) {
    h2.hide();
    const input = row.createEl("input", { type: "text", cls: "fs-detail-name-input" });
    input.value = spot.name;
    let done = false;
    const finish = (commit) => {
      if (done) return;
      done = true;
      const value = input.value.trim();
      input.remove();
      h2.show();
      if (commit && value !== "" && value !== spot.name) {
        void this.plugin.store.updateSpot(this.path, { name: value }).catch((e) => new import_obsidian10.Notice(`Couldn't rename \u2014 ${errorMessage3(e)}`));
      }
    };
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") finish(true);
      else if (ev.key === "Escape") {
        ev.preventDefault();
        ev.stopPropagation();
        finish(false);
      }
    });
    input.addEventListener("blur", () => finish(true));
    input.focus();
    input.select();
  }
  renderControls(parent, spot) {
    const row = parent.createDiv({ cls: "fs-detail-controls" });
    const seg = row.createDiv({ cls: "fs-segmented" });
    for (const st of SPOT_STATUSES) {
      const btn = seg.createEl("button", { cls: "fs-seg-btn", text: STATUS_LABELS2[st] });
      btn.type = "button";
      if (st === spot.status) {
        btn.addClass("fs-active");
        const color = st === "visited" ? this.plugin.settings.statusColors.visited : this.plugin.settings.statusColors.wantToTry;
        btn.style.setProperty("--fs-seg-active-color", color);
      }
      btn.addEventListener("click", () => {
        if (st === spot.status) return;
        void this.update({ status: st });
      });
    }
    const fav = row.createEl("button", { cls: "fs-fav-toggle" });
    fav.type = "button";
    fav.title = spot.favorite ? "Remove from favorites" : "Mark as favorite";
    (0, import_obsidian10.setIcon)(fav, "heart");
    if (spot.favorite) {
      fav.addClass("fs-active");
      fav.style.color = this.plugin.settings.statusColors.favorite;
    }
    fav.addEventListener("click", () => void this.update({ favorite: !spot.favorite }));
    const ratingWrap = row.createDiv({ cls: "fs-detail-rating" });
    starRating(ratingWrap, {
      value: spot.rating,
      halfSteps: this.plugin.settings.halfStarRatings,
      tiers: this.plugin.settings.ratingTiers,
      showLabel: true,
      onChange: (v) => {
        if (v > 0) {
          void this.update({ rating: v, ratingLocked: true });
        } else {
          void this.update({ ratingLocked: false });
        }
      }
    });
    if (spot.ratingLocked) {
      const auto = ratingWrap.createEl("a", { cls: "fs-rating-auto", text: "auto" });
      auto.title = "Unlock and derive the rating from visit ratings again";
      auto.addEventListener("click", (ev) => {
        ev.preventDefault();
        void this.update({ ratingLocked: false });
      });
    }
    const priceSeg = row.createDiv({ cls: "fs-segmented fs-price-seg" });
    for (let n = 1; n <= 4; n++) {
      const btn = priceSeg.createEl("button", {
        cls: "fs-seg-btn",
        text: this.plugin.settings.currencySymbol.repeat(n)
      });
      btn.type = "button";
      if (spot.price !== void 0 && n <= spot.price) btn.addClass("fs-active");
      btn.addEventListener("click", () => {
        void this.update({ price: spot.price === n ? void 0 : n });
      });
    }
  }
  renderChips(parent, spot) {
    const row = parent.createDiv({ cls: "fs-detail-chips" });
    for (const c of spot.cuisines) {
      const chip = row.createSpan({ cls: "fs-chip fs-chip-cuisine" });
      chip.createSpan({ cls: "fs-chip-text", text: c });
      chip.title = `Show all ${c} spots`;
      chip.addEventListener("click", () => this.jumpToQuery(`cuisine:"${c}"`));
      const rm = chip.createEl("button", {
        cls: "fs-chip-x",
        attr: { "aria-label": `Remove ${c}` }
      });
      rm.type = "button";
      rm.setText("\xD7");
      rm.addEventListener("click", (e) => {
        e.stopPropagation();
        void this.update({ cuisines: spot.cuisines.filter((x) => x !== c) });
      });
    }
    this.cuisineAdder(row, spot);
    for (const t of spot.tags) {
      const chip = row.createSpan({ cls: "fs-chip fs-chip-tag", text: `#${t}` });
      chip.title = `Show all #${t} spots`;
      chip.addEventListener("click", () => this.jumpToQuery(`tag:"${t}"`));
    }
  }
  /** "+ Cuisine" → dropdown of every cuisine in the library, plus free text. */
  cuisineAdder(row, spot) {
    const addBtn = row.createEl("button", { cls: "fs-chip fs-chip-add" });
    addBtn.type = "button";
    addBtn.setText(spot.cuisines.length > 0 ? "+ Cuisine" : "+ Add cuisine");
    addBtn.title = "Add a cuisine to this spot";
    const commit = (value) => {
      const clean = value.trim();
      if (clean === "") return;
      const exists = spot.cuisines.some((c) => c.toLowerCase() === clean.toLowerCase());
      if (!exists) void this.update({ cuisines: [...spot.cuisines, clean] });
      else this.render();
    };
    addBtn.addEventListener("click", () => {
      addBtn.hide();
      const known = this.plugin.store.distinct("cuisines").filter((c) => !spot.cuisines.some((x) => x.toLowerCase() === c.toLowerCase()));
      const select = row.createEl("select", { cls: "dropdown fs-cuisine-select" });
      select.createEl("option", { text: "Choose a cuisine\u2026", value: "" });
      for (const c of known) select.createEl("option", { text: c, value: c });
      select.createEl("option", { text: "Something else\u2026", value: "__custom__" });
      select.focus();
      select.addEventListener("change", () => {
        if (select.value === "__custom__") {
          select.remove();
          const input = row.createEl("input", {
            type: "text",
            cls: "fs-cuisine-input",
            attr: { placeholder: "New cuisine" }
          });
          input.focus();
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") commit(input.value);
            else if (e.key === "Escape") this.render();
          });
          input.addEventListener("blur", () => commit(input.value));
          return;
        }
        if (select.value !== "") commit(select.value);
        else this.render();
      });
      select.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this.render();
      });
    });
  }
  jumpToQuery(query) {
    this.plugin.pendingQuery = query;
    this.close();
    void this.plugin.activateView("spots");
  }
  renderInfo(parent, spot) {
    const block = parent.createDiv({ cls: "fs-detail-info" });
    const addrLower = (spot.address ?? "").toLowerCase();
    const locationText = [
      spot.address,
      ...[spot.district, spot.city, spot.country].filter(
        (part) => !!part && !addrLower.includes(part.toLowerCase())
      )
    ].filter(Boolean).join(", ");
    if (locationText) {
      const row = block.createDiv({ cls: "fs-info-row" });
      const icon = row.createSpan({ cls: "fs-info-icon" });
      (0, import_obsidian10.setIcon)(icon, "map-pin");
      row.createSpan({ cls: "fs-info-text", text: locationText });
      this.iconButton(row, "map", "Open in Google Maps", () => {
        window.open(this.mapsUrl(spot));
      });
      this.iconButton(row, "copy", "Copy address", () => {
        void navigator.clipboard.writeText(spot.address ?? locationText).then(() => new import_obsidian10.Notice("Address copied."));
      });
    } else {
      const row = block.createDiv({ cls: "fs-info-row fs-info-empty" });
      const icon = row.createSpan({ cls: "fs-info-icon" });
      (0, import_obsidian10.setIcon)(icon, "map-pin");
      row.createSpan({ cls: "fs-info-text", text: "No address yet \u2014 edit the spot to add one." });
    }
    if (spot.url) {
      const row = block.createDiv({ cls: "fs-info-row" });
      const icon = row.createSpan({ cls: "fs-info-icon" });
      (0, import_obsidian10.setIcon)(icon, "globe");
      const link = row.createEl("a", { cls: "fs-info-text", text: prettyUrl(spot.url) });
      link.href = spot.url;
      link.addEventListener("click", (ev) => {
        ev.preventDefault();
        window.open(spot.url);
      });
      this.iconButton(row, "copy", "Copy link", () => {
        void navigator.clipboard.writeText(spot.url ?? "").then(() => new import_obsidian10.Notice("Link copied."));
      });
    }
    if (spot.phone) {
      const row = block.createDiv({ cls: "fs-info-row" });
      const icon = row.createSpan({ cls: "fs-info-icon" });
      (0, import_obsidian10.setIcon)(icon, "phone");
      row.createSpan({ cls: "fs-info-text", text: spot.phone });
      this.iconButton(row, "copy", "Copy phone number", () => {
        void navigator.clipboard.writeText(spot.phone ?? "").then(() => new import_obsidian10.Notice("Phone number copied."));
      });
    }
    this.renderHours(block, spot);
    this.renderMenuRow(block, spot);
    if (spot.sourceUrl && spot.sourceUrl !== spot.url) {
      const row = block.createDiv({ cls: "fs-info-row" });
      const icon = row.createSpan({ cls: "fs-info-icon" });
      (0, import_obsidian10.setIcon)(icon, "external-link");
      const link = row.createEl("a", { cls: "fs-info-text", text: `Source: ${prettyUrl(spot.sourceUrl)}` });
      link.href = spot.sourceUrl;
      link.addEventListener("click", (ev) => {
        ev.preventDefault();
        window.open(spot.sourceUrl);
      });
    }
  }
  /**
   * Open-now line plus the week, collapsed. The state line is skipped when
   * the hours don't parse — a wrong "Closed" is worse than no indicator —
   * but the raw lines are still listed so the user can fix them.
   */
  renderHours(block, spot) {
    if (!spot.hours || spot.hours.length === 0) return;
    const state2 = localClockApplies(spot.country, this.plugin.settings.defaultCountry) ? openState(spot.hours, /* @__PURE__ */ new Date()) : null;
    const row = block.createDiv({ cls: "fs-info-row" });
    const icon = row.createSpan({ cls: "fs-info-icon" });
    (0, import_obsidian10.setIcon)(icon, "clock");
    if (state2) {
      const text = row.createSpan({
        cls: `fs-info-text fs-hours-state ${state2.open ? "is-open" : "is-closed"}`,
        text: state2.label
      });
      if (state2.open) {
        text.style.setProperty("--fs-open", this.plugin.settings.statusColors.visited);
      }
    } else {
      row.addClass("fs-info-empty");
      row.createSpan({ cls: "fs-info-text", text: "Opening hours (unreadable format)" });
    }
    const details = block.createEl("details", { cls: "fs-hours-details" });
    details.createEl("summary", { cls: "fs-hours-summary", text: "Opening hours" });
    const list = details.createDiv({ cls: "fs-hours-list" });
    const todayIndex = ((/* @__PURE__ */ new Date()).getDay() + 6) % 7;
    formatHoursForDisplay(spot.hours).forEach((line, i) => {
      list.createDiv({
        cls: i === todayIndex ? "fs-hours-line fs-hours-today" : "fs-hours-line",
        text: line
      });
    });
  }
  /** SPEC-v1.1 §4: external URL → link; vault path → preview / open-in-Obsidian. */
  renderMenuRow(block, spot) {
    if (!spot.menu) return;
    const menu = spot.menu;
    const row = block.createDiv({ cls: "fs-info-row" });
    const icon = row.createSpan({ cls: "fs-info-icon" });
    (0, import_obsidian10.setIcon)(icon, "book-open");
    if (/^https?:\/\//i.test(menu)) {
      const link2 = row.createEl("a", { cls: "fs-info-text", text: `Menu \u2014 ${prettyUrl(menu)}` });
      link2.href = menu;
      link2.title = "Open menu";
      link2.addEventListener("click", (ev) => {
        ev.preventDefault();
        window.open(menu);
      });
      this.iconButton(row, "copy", "Copy menu link", () => {
        void navigator.clipboard.writeText(menu).then(() => new import_obsidian10.Notice("Menu link copied."));
      });
      return;
    }
    const app = this.plugin.app;
    const file = app.metadataCache.getFirstLinkpathDest(menu, spot.path) ?? app.vault.getAbstractFileByPath(menu);
    if (!(file instanceof import_obsidian10.TFile)) {
      row.addClass("fs-info-empty");
      row.createSpan({ cls: "fs-info-text", text: `Menu file not found \u2014 ${menu}` });
      return;
    }
    const openInObsidian = () => {
      this.close();
      void app.workspace.openLinkText(file.path, spot.path);
    };
    if (/^(png|jpe?g|webp|gif|avif)$/i.test(file.extension)) {
      row.createSpan({ cls: "fs-info-text", text: "Menu" });
      const preview = block.createDiv({ cls: "fs-menu-preview" });
      preview.title = "Open in Obsidian";
      const img = preview.createEl("img", { cls: "fs-menu-preview-img" });
      img.alt = `${spot.name} menu`;
      img.src = app.vault.getResourcePath(file);
      preview.addEventListener("click", openInObsidian);
      return;
    }
    const link = row.createEl("a", { cls: "fs-info-text", text: `Menu \u2014 ${file.name}` });
    link.title = "Open in Obsidian";
    link.addEventListener("click", (ev) => {
      ev.preventDefault();
      openInObsidian();
    });
  }
  mapsUrl(spot) {
    if (spot.coordinates) {
      return `https://www.google.com/maps/search/?api=1&query=${spot.coordinates.lat},${spot.coordinates.lng}`;
    }
    const q = [spot.name, spot.address ?? "", spot.city ?? "", spot.country].filter(Boolean).join(" ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }
  renderExternal(parent, spot) {
    const ext = spot.external;
    const row = parent.createDiv({ cls: "fs-detail-external" });
    const sources = [
      { label: "G", cls: "fs-ext-google", rating: ext.googleRating, count: ext.googleRatingCount },
      { label: "TA", cls: "fs-ext-ta", rating: ext.tripadvisorRating, count: ext.tripadvisorRatingCount },
      { label: "Yelp", cls: "fs-ext-yelp", rating: ext.yelpRating, count: ext.yelpRatingCount },
      {
        label: "TheFork",
        cls: "fs-ext-thefork",
        rating: ext.theforkRating,
        count: ext.theforkRatingCount,
        scale10: true
      },
      { label: "FB", cls: "fs-ext-facebook", rating: ext.facebookRating, count: ext.facebookRatingCount },
      {
        label: "OpenTable",
        cls: "fs-ext-opentable",
        rating: ext.opentableRating,
        count: ext.opentableRatingCount
      },
      {
        label: "Eet.nu",
        cls: "fs-ext-eetnu",
        rating: ext.eetnuRating,
        count: ext.eetnuRatingCount,
        scale10: true
      }
    ];
    const hasAny = sources.some((s) => s.rating !== void 0);
    for (const s of sources) {
      if (s.rating === void 0) continue;
      const badge = row.createSpan({ cls: `fs-ext-badge ${s.cls}` });
      badge.createSpan({ cls: "fs-ext-source", text: s.label });
      badge.createSpan({
        text: ` ${s.rating.toFixed(1)}${s.scale10 ? "/10" : ""}${s.count !== void 0 ? ` (${shortCount(s.count)})` : ""}`
      });
    }
    if (!hasAny) {
      row.createSpan({ cls: "fs-ext-none", text: "No public ratings yet \u2014 add a source:" });
    }
    const ATTACHABLE = [
      { label: "TA", key: "tripadvisorUrl", domain: "tripadvisor.com" },
      { label: "Yelp", key: "yelpUrl", domain: "yelp.com" },
      { label: "TheFork", key: "theforkUrl", domain: "thefork.com" },
      { label: "FB", key: "facebookUrl", domain: "facebook.com" },
      { label: "OpenTable", key: "opentableUrl", domain: "opentable.com" },
      { label: "Eet.nu", key: "eetnuUrl", domain: "eet.nu" }
    ];
    const ratingBySourceLabel = new Map(sources.map((s) => [s.label, s.rating]));
    const anyMissing = ATTACHABLE.some((a) => ratingBySourceLabel.get(a.label) === void 0);
    if (anyMissing) {
      const findBtn = row.createEl("button", { cls: "fs-btn fs-small-btn fs-ext-find" });
      findBtn.type = "button";
      findBtn.title = "Auto-attach verifiable sources (Eet.nu rating + Facebook link via the Eet.nu API). TripAdvisor/Yelp/TheFork/OpenTable bot-wall automated lookups \u2014 paste those via their + chips.";
      const findIcon = findBtn.createSpan({ cls: "fs-btn-icon" });
      (0, import_obsidian10.setIcon)(findIcon, "wand-sparkles");
      const findLabel = findBtn.createSpan({ text: " Find sources" });
      findBtn.addEventListener("click", () => {
        findBtn.disabled = true;
        findBtn.addClass("fs-loading");
        (0, import_obsidian10.setIcon)(findIcon, "loader-2");
        void (async () => {
          try {
            const res = await this.plugin.importer.discoverSources(
              spot,
              (label) => findLabel.setText(` Searching ${label}\u2026`)
            );
            if (Object.keys(res.patch).length > 0) {
              await this.plugin.store.updateSpot(this.path, {
                external: { ...spot.external, ...res.patch }
              });
            }
            if (res.attached.length > 0) {
              new import_obsidian10.Notice(`Attached: ${res.attached.join(", ")}.`);
            } else {
              new import_obsidian10.Notice(
                "Nothing auto-attachable found. TripAdvisor, Yelp, TheFork and OpenTable block automated lookups \u2014 use their + chips to paste the page link.",
                8e3
              );
            }
            this.render();
          } catch (e) {
            new import_obsidian10.Notice(`Source discovery failed: ${errorMessage3(e)}`);
            findBtn.disabled = false;
            findBtn.removeClass("fs-loading");
            (0, import_obsidian10.setIcon)(findIcon, "wand-sparkles");
            findLabel.setText(" Find sources");
          }
        })();
      });
    }
    for (const a of ATTACHABLE) {
      if (ratingBySourceLabel.get(a.label) !== void 0) continue;
      const chipBtn = row.createEl("button", { cls: "fs-ext-add" });
      chipBtn.type = "button";
      const attachedUrl = ext[a.key];
      chipBtn.title = attachedUrl ? `${a.label} link attached \u2014 fetch the rating through the embedded browser` : `Add a ${a.label} rating source`;
      chipBtn.setText(attachedUrl ? `\u27F3 ${a.label}` : `+ ${a.label}`);
      chipBtn.addEventListener("click", () => {
        if (attachedUrl !== void 0 && canBrowserFetch()) {
          openBrowserFetchQueue(this.plugin, this.path, [attachedUrl]);
        } else {
          new AttachSourceModal(this.plugin, spot, a, () => this.render()).open();
        }
      });
    }
    if (hasAny && isStaleRatings(this.plugin, ext)) {
      const stale = row.createSpan({ cls: "fs-stale-badge" });
      stale.setText(
        ext.ratingsUpdated ? `stale \u2014 fetched ${this.formatDate(ext.ratingsUpdated)}` : "stale"
      );
      stale.title = `Older than ${this.plugin.settings.staleRatingThresholdDays} days`;
    }
    const refresh = row.createEl("button", { cls: "fs-ext-refresh" });
    refresh.type = "button";
    refresh.title = "Refresh public ratings from every linked source";
    (0, import_obsidian10.setIcon)(refresh, "refresh-cw");
    refresh.createSpan({ text: " Refresh" });
    refresh.addEventListener("click", () => void this.refreshRatings(refresh, spot));
  }
  async refreshRatings(btn, spot) {
    if (this.refreshingRatings) return;
    this.refreshingRatings = true;
    btn.disabled = true;
    btn.addClass("fs-loading");
    try {
      const updated = await this.plugin.importer.refreshRatings(
        spot,
        (msg) => new import_obsidian10.Notice(msg, 8e3)
      );
      if (updated) {
        await this.plugin.store.updateSpot(this.path, {
          external: { ...spot.external, ...updated }
        });
        new import_obsidian10.Notice("Public ratings refreshed.");
      } else {
        new import_obsidian10.Notice("No fresh ratings found for this spot.");
      }
      const fresh = this.plugin.store.getByPath(this.path);
      if (fresh && canBrowserFetch()) {
        const ext = fresh.external;
        const pending = [
          ext.tripadvisorRating === void 0 ? ext.tripadvisorUrl : void 0,
          ext.yelpRating === void 0 ? ext.yelpUrl : void 0,
          ext.theforkRating === void 0 ? ext.theforkUrl : void 0,
          ext.facebookRating === void 0 ? ext.facebookUrl : void 0,
          ext.opentableRating === void 0 ? ext.opentableUrl : void 0
        ].filter((u) => u !== void 0);
        if (pending.length > 0) openBrowserFetchQueue(this.plugin, this.path, pending);
      }
    } catch (e) {
      new import_obsidian10.Notice(`Couldn't refresh ratings \u2014 ${errorMessage3(e)}`);
    } finally {
      this.refreshingRatings = false;
      if (btn.isConnected) {
        btn.disabled = false;
        btn.removeClass("fs-loading");
      }
    }
  }
  // -------------------------------------------------------------- visits
  renderVisits(parent, spot) {
    const section = parent.createDiv({ cls: "fs-detail-section fs-detail-visits" });
    const head = section.createDiv({ cls: "fs-detail-section-head" });
    head.createEl("h3", {
      text: `Visits${spot.visits.length > 0 ? ` (${spot.visits.length})` : ""}`
    });
    const dishCount = spot.visits.reduce((n, v) => n + (v.photos?.length ?? 0), 0);
    if (dishCount > 0) {
      const gallery = head.createEl("button", { cls: "fs-small-btn" });
      gallery.type = "button";
      gallery.title = `Browse the ${dishCount} dish photo${dishCount === 1 ? "" : "s"} of this spot`;
      (0, import_obsidian10.setIcon)(gallery.createSpan({ cls: "fs-btn-icon" }), "images");
      gallery.createSpan({ text: ` Photos (${dishCount})` });
      gallery.addEventListener("click", () => openGalleryModal(this.plugin, this.path));
    }
    const addBtn = head.createEl("button", { cls: "fs-small-btn" });
    addBtn.type = "button";
    (0, import_obsidian10.setIcon)(addBtn.createSpan(), "plus");
    addBtn.createSpan({ text: "Log visit" });
    const formHost = section.createDiv();
    addBtn.addEventListener("click", () => {
      if (this.addingVisit) return;
      this.addingVisit = true;
      formHost.empty();
      this.visitForm(formHost, void 0, async (visit) => {
        const before = this.spot();
        await this.plugin.store.addVisit(this.path, visit);
        if (before?.status === "want-to-try") {
          await this.plugin.store.updateSpot(this.path, { status: "visited" });
          new import_obsidian10.Notice(`Visit logged \u2014 \u201C${before.name}\u201D marked as visited.`);
        }
        this.addingVisit = false;
        this.render();
      }, () => {
        this.addingVisit = false;
        formHost.empty();
        this.maybeDeferredRender();
      });
    });
    const list = section.createDiv({ cls: "fs-visit-list" });
    if (spot.visits.length === 0) {
      list.createDiv({
        cls: "fs-empty-state",
        text: "No visits yet \u2014 log the first one to start rating this spot."
      });
      return;
    }
    const indexed = spot.visits.map((v, i) => ({ v, i }));
    indexed.sort((a, b) => b.v.date.localeCompare(a.v.date) || b.i - a.i);
    for (const { v, i } of indexed) {
      this.visitRow(list, v, i);
    }
  }
  visitRow(parent, visit, index) {
    const row = parent.createDiv({ cls: "fs-visit-row" });
    if (this.editingVisitIndex === index) {
      this.visitForm(row, visit, async (updated) => {
        const idx = this.resolveVisitIndex(visit, index);
        if (idx === -1) {
          this.editingVisitIndex = null;
          new import_obsidian10.Notice("That visit changed while you were editing \u2014 your change was not applied.");
          this.render();
          return;
        }
        await this.plugin.store.updateVisit(this.path, idx, updated);
        this.editingVisitIndex = null;
        this.render();
      }, () => {
        this.editingVisitIndex = null;
        this.render();
      });
      return;
    }
    row.createSpan({ cls: "fs-visit-date", text: this.formatDate(visit.date) });
    const stars2 = row.createSpan({ cls: "fs-visit-stars" });
    if (visit.rating !== void 0) {
      starRating(stars2, {
        value: visit.rating,
        halfSteps: this.plugin.settings.halfStarRatings,
        tiers: this.plugin.settings.ratingTiers,
        readOnly: true
      });
    }
    if (visit.spent !== void 0) {
      row.createSpan({
        cls: "fs-visit-spent",
        text: `${this.plugin.settings.currencySymbol}${visit.spent}`
      });
    }
    if (visit.note) row.createSpan({ cls: "fs-visit-note", text: visit.note });
    const actions = row.createDiv({ cls: "fs-visit-actions" });
    this.iconButton(actions, "pencil", "Edit visit", () => {
      this.editingVisitIndex = index;
      this.render();
    });
    renderDishThumbs(row, this.plugin, visit.photos ?? [], this.path);
    this.iconButton(actions, "trash-2", "Delete visit", () => {
      void confirmModal(this.app, {
        title: "Delete visit",
        body: `Remove the visit on ${this.formatDate(visit.date)}? The bullet line is deleted from the note and derived ratings are recomputed.`,
        cta: "Delete visit",
        danger: true
      }).then(async (yes) => {
        if (!yes) return;
        try {
          const idx = this.resolveVisitIndex(visit, index);
          if (idx === -1) {
            new import_obsidian10.Notice("That visit changed while the dialog was open \u2014 nothing was deleted.");
            this.render();
            return;
          }
          await this.plugin.store.deleteVisit(this.path, idx);
        } catch (e) {
          new import_obsidian10.Notice(`Couldn't delete the visit \u2014 ${errorMessage3(e)}`);
        }
      });
    });
  }
  visitForm(parent, initial, onSave, onCancel) {
    const form = parent.createDiv({ cls: "fs-visit-form" });
    const dateInput = form.createEl("input", { type: "date" });
    dateInput.value = initial?.date ?? todayIso();
    let rating = initial?.rating ?? 0;
    const starsWrap = form.createSpan({ cls: "fs-visit-form-stars" });
    starRating(starsWrap, {
      value: rating,
      halfSteps: this.plugin.settings.halfStarRatings,
      tiers: this.plugin.settings.ratingTiers,
      onChange: (v) => {
        rating = v;
      }
    });
    const spentInput = form.createEl("input", { type: "number", cls: "fs-visit-spent-input" });
    spentInput.placeholder = this.plugin.settings.currencySymbol;
    spentInput.min = "0";
    spentInput.step = "0.01";
    if (initial?.spent !== void 0) spentInput.value = String(initial.spent);
    const noteInput = form.createEl("input", { type: "text", cls: "fs-visit-note-input" });
    noteInput.placeholder = "What did you eat?";
    noteInput.value = initial?.note ?? "";
    let photos = [...initial?.photos ?? []];
    const photoRow = form.createDiv({ cls: "fs-visit-photos" });
    const renderPhotos = () => {
      photoRow.empty();
      const addBtn = photoRow.createEl("button", { cls: "fs-btn fs-small-btn" });
      addBtn.type = "button";
      (0, import_obsidian10.setIcon)(addBtn.createSpan({ cls: "fs-btn-icon" }), "image-plus");
      addBtn.createSpan({ text: photos.length ? " Add more" : " Add dish photos" });
      addBtn.addEventListener("click", () => {
        void (async () => {
          const spot = this.spot();
          if (!spot) return;
          const files = await pickImageFiles();
          if (files.length === 0) return;
          const saved = await importDishPhotos(
            this.plugin,
            spot,
            dateInput.value || todayIso(),
            files
          );
          photos = [...photos, ...saved];
          renderPhotos();
        })();
      });
      renderDishThumbs(photoRow, this.plugin, photos, this.path, (ref) => {
        photos = photos.filter((p) => p !== ref);
        renderPhotos();
      });
    };
    renderPhotos();
    form.addEventListener("dragover", (e) => {
      e.preventDefault();
      form.addClass("fs-drop-active");
    });
    form.addEventListener("dragleave", () => form.removeClass("fs-drop-active"));
    form.addEventListener("drop", (e) => {
      e.preventDefault();
      form.removeClass("fs-drop-active");
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length === 0) return;
      void (async () => {
        const spot = this.spot();
        if (!spot) return;
        const saved = await importDishPhotos(
          this.plugin,
          spot,
          dateInput.value || todayIso(),
          files
        );
        photos = [...photos, ...saved];
        renderPhotos();
      })();
    });
    const actions = form.createDiv({ cls: "fs-visit-form-actions" });
    const save = actions.createEl("button", { text: "Save", cls: "mod-cta fs-small-btn" });
    save.type = "button";
    const cancel = actions.createEl("button", { text: "Cancel", cls: "fs-small-btn" });
    cancel.type = "button";
    const doSave = () => {
      dateInput.removeClass("fs-input-invalid");
      spentInput.removeClass("fs-input-invalid");
      if (!dateInput.value) {
        dateInput.addClass("fs-input-invalid");
        return;
      }
      const spentRaw = spentInput.value.trim();
      let spent;
      if (spentRaw !== "") {
        const parsed = Number(spentRaw);
        if (!Number.isFinite(parsed) || parsed < 0) {
          spentInput.addClass("fs-input-invalid");
          spentInput.focus();
          return;
        }
        spent = parsed;
      }
      save.disabled = true;
      void onSave({
        date: dateInput.value,
        rating: rating > 0 ? rating : void 0,
        spent,
        note: noteInput.value.trim(),
        photos: photos.length > 0 ? photos : void 0
      }).catch((e) => {
        save.disabled = false;
        new import_obsidian10.Notice(`Couldn't save the visit \u2014 ${errorMessage3(e)}`);
      });
    };
    save.addEventListener("click", doSave);
    noteInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") doSave();
    });
    cancel.addEventListener("click", onCancel);
    dateInput.focus();
  }
  /**
   * Find `target` in the CURRENT store snapshot: prefer the render-time
   * ordinal when it still matches, otherwise a unique content match
   * (date + note + rating + spent). -1 = gone or ambiguous — abort.
   */
  resolveVisitIndex(target, hint) {
    const visits = this.spot()?.visits ?? [];
    const same = (v) => v.date === target.date && v.note === target.note && v.rating === target.rating && v.spent === target.spent;
    if (hint >= 0 && hint < visits.length && same(visits[hint])) return hint;
    const matches = [];
    visits.forEach((v, i) => {
      if (same(v)) matches.push(i);
    });
    return matches.length === 1 ? matches[0] : -1;
  }
  maybeDeferredRender() {
    if (this.pendingRefresh) {
      this.pendingRefresh = false;
      this.render();
    }
  }
  // --------------------------------------------------------------- notes
  renderNotes(parent, spot) {
    const section = parent.createDiv({ cls: "fs-detail-section fs-detail-notes" });
    section.createEl("h3", { text: "Notes" });
    const area = section.createEl("textarea", { cls: "fs-notes-input" });
    area.rows = 4;
    area.placeholder = "Anything worth remembering \u2014 dishes, seating, who to bring\u2026";
    area.value = this.pendingNotes ?? spot.notes;
    area.addEventListener("input", () => {
      this.pendingNotes = area.value;
      window.clearTimeout(this.notesTimer);
      this.notesTimer = window.setTimeout(() => void this.flushNotes(), 600);
    });
    area.addEventListener("blur", () => void this.flushNotes());
  }
  async flushNotes() {
    window.clearTimeout(this.notesTimer);
    this.notesTimer = void 0;
    if (this.pendingNotes === null) return;
    const notes = this.pendingNotes;
    this.pendingNotes = null;
    try {
      await this.plugin.store.setNotes(this.path, notes);
    } catch (e) {
      if (this.pendingNotes === null) this.pendingNotes = notes;
      new import_obsidian10.Notice(`Couldn't save notes \u2014 ${errorMessage3(e)}`);
    }
  }
  // -------------------------------------------------------------- footer
  renderFooter(parent, spot) {
    const footer = parent.createDiv({ cls: "fs-detail-footer" });
    const openNote = footer.createEl("button", { cls: "fs-small-btn" });
    openNote.type = "button";
    (0, import_obsidian10.setIcon)(openNote.createSpan(), "file-text");
    openNote.createSpan({ text: "Open note" });
    openNote.addEventListener("click", () => {
      this.close();
      void this.plugin.store.openNote(this.path);
    });
    const edit = footer.createEl("button", { cls: "fs-small-btn" });
    edit.type = "button";
    (0, import_obsidian10.setIcon)(edit.createSpan(), "pencil");
    edit.createSpan({ text: "Edit" });
    edit.addEventListener("click", () => {
      this.close();
      openEditModal(this.plugin, this.path);
    });
    footer.createSpan({
      cls: "fs-detail-meta",
      text: `Added ${this.formatDate(spot.created)}${spot.lastVisit ? ` \xB7 last visit ${this.formatDate(spot.lastVisit)}` : ""}`
    });
  }
  // -------------------------------------------------------------- helpers
  iconButton(parent, icon, title, onClick) {
    const btn = parent.createEl("button", { cls: "fs-icon-btn" });
    btn.type = "button";
    btn.title = title;
    (0, import_obsidian10.setIcon)(btn, icon);
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onClick();
    });
    return btn;
  }
  resolvePhoto(spot) {
    if (!spot.photo) return null;
    if (/^https?:\/\//i.test(spot.photo)) return spot.photo;
    const app = this.plugin.app;
    const file = app.metadataCache.getFirstLinkpathDest(spot.photo, spot.path) ?? app.vault.getAbstractFileByPath(spot.photo);
    return file instanceof import_obsidian10.TFile ? app.vault.getResourcePath(file) : null;
  }
  formatDate(iso) {
    return formatDate2(iso, this.plugin.settings.dateFormat);
  }
  async update(input) {
    try {
      await this.plugin.store.updateSpot(this.path, input);
    } catch (e) {
      new import_obsidian10.Notice(`Couldn't save the change \u2014 ${errorMessage3(e)}`);
    }
  }
  onClose() {
    this.closed = true;
    window.clearTimeout(this.focusTimer);
    this.focusTimer = void 0;
    this.unsubscribe?.();
    this.unsubscribe = null;
    void this.flushNotes();
    this.contentEl.empty();
  }
};
function formatDate2(iso, fmt) {
  const parts = iso.split("T")[0]?.split("-");
  if (!parts || parts.length !== 3) return iso;
  const [y, m, d] = parts;
  switch (fmt) {
    case "european":
      return `${d}-${m}-${y}`;
    case "american":
      return `${m}/${d}/${y}`;
    default:
      return `${y}-${m}-${d}`;
  }
}
function prettyUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}
function shortCount(n) {
  return n >= 1e3 ? `${(Math.round(n / 100) / 10).toFixed(1)}k` : String(n);
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
  return Math.abs(h);
}
function errorMessage3(e) {
  return e instanceof Error ? e.message : String(e);
}
var AttachSourceModal = class extends import_obsidian10.Modal {
  constructor(plugin, spot, source, onDone) {
    super(plugin.app);
    this.plugin = plugin;
    this.spot = spot;
    this.source = source;
    this.onDone = onDone;
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    this.modalEl.addClass("fs-modal");
    titleEl.setText(`Add ${this.source.label} rating source`);
    const hint = contentEl.createDiv({ cls: "fs-import-hint" });
    hint.setText(
      `Paste the ${this.source.domain} page of "${this.spot.name}". Ratings are fetched from the page's public data.`
    );
    const input = contentEl.createEl("input", {
      type: "text",
      cls: "fs-preset-name-input",
      attr: { placeholder: `https://www.${this.source.domain}/\u2026` }
    });
    input.value = this.spot.external[this.source.key] ?? "";
    const searchBtn = contentEl.createEl("button", {
      cls: "fs-btn fs-small-btn",
      text: `Find on ${this.source.label} (opens browser)`
    });
    searchBtn.type = "button";
    searchBtn.style.marginTop = "8px";
    searchBtn.addEventListener("click", () => {
      const q = encodeURIComponent(
        `site:${this.source.domain} ${this.spot.name} ${this.spot.city ?? ""}`.trim()
      );
      window.open(`https://www.google.com/search?q=${q}`);
    });
    const buttons = contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const save = buttons.createEl("button", { cls: "mod-cta", text: "Save & fetch" });
    save.type = "button";
    const doSave = async () => {
      const url = input.value.trim();
      if (!/^https?:\/\//i.test(url)) {
        new import_obsidian10.Notice("Paste a full http(s) link.");
        return;
      }
      save.disabled = true;
      try {
        const updated = await this.plugin.store.updateSpot(this.spot.path, {
          external: { ...this.spot.external, [this.source.key]: url }
        });
        this.close();
        const fresh = await this.plugin.importer.refreshRatings(updated);
        if (fresh) {
          await this.plugin.store.updateSpot(this.spot.path, {
            external: { ...updated.external, ...fresh }
          });
          new import_obsidian10.Notice(`${this.source.label} rating attached.`);
        } else {
          new import_obsidian10.Notice(
            `${this.source.label} link saved, but no public rating was found on that page.`
          );
        }
        this.onDone();
      } catch (e) {
        save.disabled = false;
        new import_obsidian10.Notice(`Attach failed: ${errorMessage3(e)}`);
      }
    };
    save.addEventListener("click", () => void doSave());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void doSave();
    });
    window.setTimeout(() => input.focus(), 0);
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/ui/modals/logVisit.ts
var import_obsidian11 = require("obsidian");
function openLogVisitPicker(plugin, path) {
  if (path) {
    new VisitModal(plugin, path).open();
    return;
  }
  const spots = plugin.store.getSpots();
  if (spots.length === 0) {
    new import_obsidian11.Notice("No food spots yet \u2014 add one before logging a visit.");
    return;
  }
  new SpotPickerModal(plugin, spots).open();
}
var SpotPickerModal = class extends import_obsidian11.FuzzySuggestModal {
  constructor(plugin, spots) {
    super(plugin.app);
    this.plugin = plugin;
    this.spots = spots;
    this.setPlaceholder("Which spot did you visit?");
  }
  getItems() {
    return this.spots;
  }
  getItemText(spot) {
    return spot.city ? `${spot.name} \u2014 ${spot.city}` : spot.name;
  }
  onChooseItem(spot) {
    new VisitModal(this.plugin, spot.path).open();
  }
};
var VisitModal = class extends import_obsidian11.Modal {
  constructor(plugin, path) {
    super(plugin.app);
    this.plugin = plugin;
    this.path = path;
    this.rating = 0;
    this.saving = false;
  }
  onOpen() {
    const spot = this.plugin.store.getByPath(this.path);
    if (!spot) {
      new import_obsidian11.Notice("That spot no longer exists.");
      this.close();
      return;
    }
    this.modalEl.addClass("fs-modal", "fs-visit-modal");
    this.titleEl.setText(`Log a visit \u2014 ${spot.name}`);
    const form = this.contentEl.createDiv({ cls: "fs-visit-form" });
    const dateField = form.createDiv({ cls: "fs-field" });
    dateField.createEl("label", { cls: "fs-field-label", text: "Date" });
    this.dateInput = dateField.createEl("input", { type: "date" });
    this.dateInput.value = todayIso();
    dateField.createDiv({ cls: "fs-field-msg" });
    this.dateInput.addEventListener("input", () => this.clearFieldError(this.dateInput));
    const ratingField = form.createDiv({ cls: "fs-field" });
    ratingField.createEl("label", { cls: "fs-field-label", text: "Rating" });
    starRating(ratingField, {
      halfSteps: this.plugin.settings.halfStarRatings,
      tiers: this.plugin.settings.ratingTiers,
      showLabel: true,
      onChange: (v) => {
        this.rating = v;
      }
    });
    const spentField = form.createDiv({ cls: "fs-field" });
    spentField.createEl("label", {
      cls: "fs-field-label",
      text: `Spent (${this.plugin.settings.currencySymbol})`
    });
    this.spentInput = spentField.createEl("input", {
      type: "number",
      placeholder: "45"
    });
    this.spentInput.min = "0";
    this.spentInput.step = "0.01";
    spentField.createDiv({ cls: "fs-field-msg" });
    this.spentInput.addEventListener("input", () => this.clearFieldError(this.spentInput));
    const noteField = form.createDiv({ cls: "fs-field" });
    noteField.createEl("label", { cls: "fs-field-label", text: "Note" });
    this.noteInput = noteField.createEl("input", {
      type: "text",
      placeholder: "What did you eat? How was it?"
    });
    this.noteInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") void this.save();
    });
    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const save = buttons.createEl("button", { text: "Log visit", cls: "mod-cta" });
    save.type = "button";
    save.addEventListener("click", () => void this.save());
  }
  /** Inline, per-field feedback — this form never throws a Notice wall. */
  setFieldError(input, msg) {
    const wrap = input.parentElement;
    wrap?.addClass("fs-field-error");
    wrap?.querySelector(".fs-field-msg")?.setText(msg);
    input.focus();
  }
  clearFieldError(input) {
    const wrap = input.parentElement;
    wrap?.removeClass("fs-field-error");
    wrap?.querySelector(".fs-field-msg")?.setText("");
  }
  async save() {
    if (this.saving) return;
    this.clearFieldError(this.dateInput);
    this.clearFieldError(this.spentInput);
    const date = this.dateInput.value;
    if (!date) {
      this.setFieldError(this.dateInput, "Pick a date for the visit.");
      return;
    }
    const spentRaw = this.spentInput.value.trim();
    let spent;
    if (spentRaw !== "") {
      const parsed = Number(spentRaw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        this.setFieldError(this.spentInput, "Enter an amount of 0 or more, or leave it empty.");
        return;
      }
      spent = parsed;
    }
    const visit = {
      date,
      rating: this.rating > 0 ? this.rating : void 0,
      spent,
      note: this.noteInput.value.trim()
    };
    this.saving = true;
    try {
      const before = this.plugin.store.getByPath(this.path);
      const wasWantToTry = before?.status === "want-to-try";
      await this.plugin.store.addVisit(this.path, visit);
      if (wasWantToTry) {
        await this.plugin.store.updateSpot(this.path, { status: "visited" });
        new import_obsidian11.Notice(`Visit logged \u2014 \u201C${before?.name ?? "spot"}\u201D marked as visited.`);
      } else {
        new import_obsidian11.Notice("Visit logged.");
      }
      this.close();
    } catch (e) {
      this.saving = false;
      new import_obsidian11.Notice(`Food Spot: couldn't log the visit \u2014 ${errorMessage4(e)}`);
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
function errorMessage4(e) {
  return e instanceof Error ? e.message : String(e);
}

// src/ui/components/card.ts
function relTime(iso) {
  const days = daysSinceCalendar(iso);
  if (Number.isNaN(days)) return "";
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} d ago`;
  if (days < 31) return `${Math.max(1, Math.round(days / 7))} w ago`;
  if (days < 365) return `${Math.max(1, Math.round(days / 30.44))} mo ago`;
  return `${Math.max(1, Math.round(days / 365.25))} y ago`;
}
function fmtRating(v) {
  return (Math.round(v * 10) / 10).toFixed(1);
}
function fmtCount(n) {
  return n >= 1e3 ? `${(Math.round(n / 100) / 10).toFixed(1)}k` : String(n);
}
function tierFor(rating, tiers) {
  if (tiers.length === 0) return void 0;
  const idx = Math.min(tiers.length - 1, Math.max(0, Math.ceil(rating) - 1));
  return tiers[idx];
}
function cuisineTint(spot) {
  const seed = spot.cuisines[0] ?? spot.name;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = h * 31 + seed.charCodeAt(i) | 0;
  const strength = 6 + (h % 4 + 4) % 4 * 3;
  return `color-mix(in srgb, var(--interactive-accent) ${strength}%, var(--background-secondary))`;
}
function isStaleRatings(plugin, ext) {
  if (!ext.ratingsUpdated) return true;
  const days = daysSinceCalendar(ext.ratingsUpdated);
  if (Number.isNaN(days)) return true;
  return days > plugin.settings.staleRatingThresholdDays;
}
function bestOtherSource(ext) {
  const candidates = [
    { label: "TA", rating: ext.tripadvisorRating, count: ext.tripadvisorRatingCount ?? 0, scale10: false },
    { label: "Yelp", rating: ext.yelpRating, count: ext.yelpRatingCount ?? 0, scale10: false },
    { label: "TheFork", rating: ext.theforkRating, count: ext.theforkRatingCount ?? 0, scale10: true }
  ].filter(
    (c) => c.rating !== void 0
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.count - a.count);
  return candidates[0] ?? null;
}
function mapsUrl(spot) {
  const q = spot.coordinates ? `${spot.coordinates.lat},${spot.coordinates.lng}` : [spot.name, spot.city, spot.country].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
var NONE = "none";
var photoCache = /* @__PURE__ */ new Map();
var pendingLoaders = /* @__PURE__ */ new WeakMap();
var sharedObserver = null;
function observer() {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          sharedObserver?.unobserve(entry.target);
          const load = pendingLoaders.get(entry.target);
          pendingLoaders.delete(entry.target);
          load?.();
        }
      },
      { rootMargin: "200px" }
    );
  }
  return sharedObserver;
}
function cacheKey(spot) {
  return `${spot.path}|${spot.photo ?? ""}`;
}
function resolveSrc(plugin, spot) {
  const key = cacheKey(spot);
  const cached = photoCache.get(key);
  if (cached !== void 0) return cached;
  const raw = spot.photo?.trim();
  let src = NONE;
  if (raw) {
    if (/^https?:\/\//i.test(raw)) {
      src = raw;
    } else {
      try {
        const file = plugin.app.metadataCache.getFirstLinkpathDest(raw, spot.path) ?? plugin.app.vault.getAbstractFileByPath(raw);
        src = file instanceof import_obsidian12.TFile ? plugin.app.vault.getResourcePath(file) : NONE;
      } catch {
        src = NONE;
      }
    }
  }
  photoCache.set(key, src);
  return src;
}
function releaseLazyPhotos(root) {
  if (!sharedObserver) return;
  const targets = root.querySelectorAll("[data-needs-photo]");
  for (const t of Array.from(targets)) {
    sharedObserver.unobserve(t);
    pendingLoaders.delete(t);
  }
  if (root.dataset.needsPhoto) {
    sharedObserver.unobserve(root);
    pendingLoaders.delete(root);
  }
}
function disposePhotoObserver() {
  sharedObserver?.disconnect();
  sharedObserver = null;
  photoCache.clear();
}
function attachLazyPhoto(photoEl, plugin, spot, hostEl) {
  if (!spot.photo) return;
  if (photoCache.get(cacheKey(spot)) === NONE) return;
  photoEl.dataset.needsPhoto = "true";
  pendingLoaders.set(photoEl, () => {
    const src = resolveSrc(plugin, spot);
    if (src === NONE) {
      delete photoEl.dataset.needsPhoto;
      return;
    }
    const img = photoEl.createEl("img", { cls: "fs-card-img" });
    img.setAttribute("width", "400");
    img.setAttribute("height", "300");
    img.setAttribute("alt", "");
    img.decoding = "async";
    img.onload = () => {
      delete photoEl.dataset.needsPhoto;
      img.addClass("is-loaded");
      hostEl.addClass("has-photo");
    };
    img.onerror = () => {
      delete photoEl.dataset.needsPhoto;
      photoCache.set(cacheKey(spot), NONE);
      img.remove();
      hostEl.removeClass("has-photo");
    };
    img.src = src;
  });
  observer().observe(photoEl);
}
async function refreshSpotRatings(plugin, spot) {
  try {
    const updated = await plugin.importer.refreshRatings(spot, (msg) => new import_obsidian12.Notice(msg, 8e3));
    if (updated) {
      await plugin.store.updateSpot(spot.path, {
        external: { ...spot.external, ...updated }
      });
      new import_obsidian12.Notice(`Ratings refreshed for "${spot.name}".`);
    } else {
      new import_obsidian12.Notice(`No fresh ratings found for "${spot.name}".`);
    }
  } catch (e) {
    new import_obsidian12.Notice(`Rating refresh failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
function isUnderfilled(spot) {
  return !spot.photo || spot.external.googleRating === void 0 || !spot.coordinates || !spot.address;
}
async function pullSpotInfo(plugin, spot) {
  if (!plugin.importer.hasGoogleKey()) {
    new import_obsidian12.Notice("Add a Google Places API key in Settings \u2192 Food Spot \u2192 API first.");
    return;
  }
  try {
    const patch = await plugin.importer.enrichSpot(spot, {
      photo: true,
      ratings: true,
      coords: true,
      address: true,
      menu: true
    });
    if (patch && Object.keys(patch).length > 0) {
      await plugin.store.updateSpot(spot.path, patch);
      new import_obsidian12.Notice(`Pulled Google info for "${spot.name}".`);
    } else {
      new import_obsidian12.Notice(`Nothing new found for "${spot.name}".`);
    }
  } catch (e) {
    if (e instanceof EnrichStepError && e.partial && Object.keys(e.partial).length > 0) {
      try {
        await plugin.store.updateSpot(spot.path, e.partial);
        new import_obsidian12.Notice(`Pull partly failed for "${spot.name}": ${e.message} The rest was saved.`, 1e4);
        return;
      } catch (writeError) {
        new import_obsidian12.Notice(
          `Pull failed for "${spot.name}": ${e.message} Saving what was found also failed \u2014 ${writeError instanceof Error ? writeError.message : String(writeError)}`,
          1e4
        );
        return;
      }
    }
    new import_obsidian12.Notice(`Pull failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
function spotMediaFiles(plugin, spot) {
  const out = [];
  for (const ref of [spot.photo, spot.menu]) {
    if (!ref || /^https?:\/\//i.test(ref)) continue;
    const f = plugin.app.vault.getFileByPath((0, import_obsidian12.normalizePath)(ref));
    if (f && !out.includes(f)) out.push(f);
  }
  return out;
}
async function deleteWithConfirm(plugin, spot) {
  const visits = spot.visitCount > 0 ? ` Its ${spot.visitCount} logged visit${spot.visitCount === 1 ? "" : "s"} and notes go with it.` : "";
  const media = spotMediaFiles(plugin, spot);
  const { confirmed, checked } = await confirmModalWithOption(plugin.app, {
    title: `Delete "${spot.name}"?`,
    body: `The note "${spot.path}" is moved to the trash and can be restored from there.${visits}`,
    cta: "Delete",
    danger: true,
    checkbox: media.length > 0 ? {
      label: `Also trash its ${media.length === 1 ? "cover photo" : "photo and menu files"} (${media.map((f) => f.name).join(", ")})`,
      default: false
    } : void 0
  });
  if (!confirmed) return;
  await plugin.store.deleteSpot(spot.path);
  let trashed = 0;
  if (checked) {
    for (const f of media) {
      try {
        await plugin.app.fileManager.trashFile(f);
        trashed++;
      } catch {
      }
    }
  }
  new import_obsidian12.Notice(
    `Deleted "${spot.name}"${trashed > 0 ? ` and ${trashed} media file${trashed === 1 ? "" : "s"}` : ""} \u2014 recoverable from the trash.`
  );
}
function spotMenu(plugin, spot) {
  const menu = new import_obsidian12.Menu();
  menu.addItem(
    (i) => i.setTitle("Open note").setIcon("file-text").onClick(() => void plugin.store.openNote(spot.path))
  );
  menu.addItem(
    (i) => i.setTitle("Edit").setIcon("pencil").onClick(() => openEditModal(plugin, spot.path))
  );
  menu.addItem(
    (i) => i.setTitle("Log visit").setIcon("calendar-plus").onClick(() => openLogVisitPicker(plugin, spot.path))
  );
  menu.addItem(
    (i) => i.setTitle(spot.favorite ? "Remove favorite" : "Mark favorite").setIcon(spot.favorite ? "star-off" : "star").onClick(() => void plugin.store.updateSpot(spot.path, { favorite: !spot.favorite }))
  );
  menu.addSeparator();
  if (spot.url) {
    const url = spot.url;
    menu.addItem(
      (i) => i.setTitle("Open website").setIcon("globe").onClick(() => window.open(url, "_blank"))
    );
  }
  if (spot.menu) {
    const target = spot.menu;
    menu.addItem(
      (i) => i.setTitle("Open menu").setIcon("book-open").onClick(() => {
        if (/^https?:\/\//i.test(target)) window.open(target, "_blank");
        else void plugin.app.workspace.openLinkText(target, spot.path);
      })
    );
  }
  menu.addItem(
    (i) => i.setTitle("Open in Google Maps").setIcon("map-pin").onClick(() => window.open(mapsUrl(spot), "_blank"))
  );
  const dishCount = spot.visits.reduce((n, v) => n + (v.photos?.length ?? 0), 0);
  if (dishCount > 0) {
    menu.addItem(
      (i) => i.setTitle(`Dish photos (${dishCount})`).setIcon("images").onClick(() => openGalleryModal(plugin, spot.path))
    );
  }
  menu.addItem(
    (i) => i.setTitle("Pull info from Google").setIcon("cloud-download").onClick(() => void pullSpotInfo(plugin, spot))
  );
  menu.addItem(
    (i) => i.setTitle("Refresh ratings").setIcon("refresh-cw").onClick(() => void refreshSpotRatings(plugin, spot))
  );
  menu.addSeparator();
  menu.addItem(
    (i) => i.setTitle("Delete").setIcon("trash-2").setWarning(true).onClick(() => void deleteWithConfirm(plugin, spot))
  );
  return menu;
}
function buildMiniCard(parent, spot, plugin) {
  const card2 = parent.createDiv({ cls: "fs-mini-card" });
  card2.dataset.path = spot.path;
  card2.setAttribute("role", "button");
  card2.tabIndex = 0;
  card2.setAttribute("aria-label", spot.name);
  const photo = card2.createDiv({ cls: "fs-mini-photo" });
  photo.style.setProperty("--fs-cuisine-tint", cuisineTint(spot));
  photo.createSpan({ cls: "fs-card-letter", text: (spot.name[0] ?? "?").toUpperCase() });
  attachLazyPhoto(photo, plugin, spot, card2);
  const dot = photo.createSpan({
    cls: "fs-mini-dot",
    attr: { title: spot.status === "visited" ? "Visited" : "Want to try" }
  });
  dot.style.setProperty(
    "--fs-status",
    spot.status === "visited" ? plugin.settings.statusColors.visited : plugin.settings.statusColors.wantToTry
  );
  if (spot.rating !== void 0) {
    const badge = photo.createSpan({ cls: "fs-mini-rating" });
    const star = badge.createSpan({ cls: "fs-star-icon" });
    (0, import_obsidian12.setIcon)(star, "star");
    badge.createSpan({ text: fmtRating(spot.rating) });
    const tier = tierFor(spot.rating, plugin.settings.ratingTiers);
    if (tier) badge.style.setProperty("--fs-tier", tier.color);
  }
  const menuBtn = card2.createEl("button", {
    cls: "fs-card-menu fs-mini-menu",
    attr: { "aria-label": "More actions" }
  });
  (0, import_obsidian12.setIcon)(menuBtn, "more-vertical");
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    spotMenu(plugin, spot).showAtMouseEvent(e);
  });
  const body = card2.createDiv({ cls: "fs-mini-body" });
  body.createDiv({ cls: "fs-mini-name", text: spot.name });
  const sub = [spot.city, spot.cuisines[0]].filter(Boolean).join(" \xB7 ");
  if (sub) body.createDiv({ cls: "fs-mini-sub", text: sub });
  card2.addEventListener("click", () => openDetailModal(plugin, spot.path));
  card2.addEventListener("keydown", (e) => {
    if (e.key === "Enter") openDetailModal(plugin, spot.path);
  });
  return card2;
}
function buildSpotCard(parent, spot, ctx) {
  const plugin = ctx.plugin;
  if (ctx.mini) return buildMiniCard(parent, spot, plugin);
  return ctx.compact ? buildCompactRow(parent, spot, plugin) : buildFullCard(parent, spot, plugin);
}
function buildFullCard(parent, spot, plugin) {
  const card2 = parent.createDiv({ cls: "fs-card" });
  if (plugin.settings.cardTextPlacement === "under") card2.addClass("fs-card-text-under");
  card2.dataset.path = spot.path;
  card2.setAttribute("role", "button");
  card2.tabIndex = 0;
  card2.setAttribute("aria-label", spot.name);
  if (!spot.photo) card2.addClass("fs-card-nophoto");
  const photo = card2.createDiv({ cls: "fs-card-photo" });
  photo.style.setProperty("--fs-cuisine-tint", cuisineTint(spot));
  photo.createDiv({ cls: "fs-card-letter", text: (spot.name[0] ?? "?").toUpperCase() });
  attachLazyPhoto(photo, plugin, spot, card2);
  if (isUnderfilled(spot)) {
    const pull = card2.createEl("button", {
      cls: "fs-card-pull",
      attr: { "aria-label": "Pull photo & info from Google", title: "Pull photo & info from Google" }
    });
    const pullIcon = pull.createSpan({ cls: "fs-btn-icon" });
    (0, import_obsidian12.setIcon)(pullIcon, "cloud-download");
    pull.createSpan({ cls: "fs-card-pull-label", text: "Pull info" });
    pull.addEventListener("click", (e) => {
      e.stopPropagation();
      pull.addClass("fs-loading");
      pull.disabled = true;
      (0, import_obsidian12.setIcon)(pullIcon, "loader-2");
      void pullSpotInfo(plugin, spot).finally(() => {
        pull.removeClass("fs-loading");
        pull.disabled = false;
        (0, import_obsidian12.setIcon)(pullIcon, "cloud-download");
      });
    });
  }
  const badge = card2.createDiv({ cls: "fs-card-status" });
  badge.createSpan({ cls: "fs-card-status-dot" });
  badge.createSpan({
    cls: "fs-card-status-label",
    text: spot.status === "visited" ? "Visited" : "Want to try"
  });
  badge.style.setProperty(
    "--fs-status",
    spot.status === "visited" ? plugin.settings.statusColors.visited : plugin.settings.statusColors.wantToTry
  );
  if (spot.price && spot.price > 0) {
    card2.createDiv({
      cls: "fs-card-price",
      text: plugin.settings.currencySymbol.repeat(Math.min(4, spot.price))
    });
  }
  const fav = card2.createEl("button", {
    cls: "fs-card-fav",
    attr: { "aria-label": spot.favorite ? "Remove from favorites" : "Add to favorites" }
  });
  (0, import_obsidian12.setIcon)(fav, "star");
  fav.toggleClass("is-active", spot.favorite);
  fav.style.setProperty("--fs-fav", plugin.settings.statusColors.favorite);
  fav.addEventListener("click", (e) => {
    e.stopPropagation();
    void plugin.store.updateSpot(spot.path, { favorite: !spot.favorite });
  });
  const menuBtn = card2.createEl("button", {
    cls: "fs-card-menu",
    attr: { "aria-label": "More actions" }
  });
  (0, import_obsidian12.setIcon)(menuBtn, "more-vertical");
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    spotMenu(plugin, spot).showAtMouseEvent(e);
  });
  card2.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    spotMenu(plugin, spot).showAtMouseEvent(e);
  });
  const scrim = card2.createDiv({ cls: "fs-card-scrim" });
  scrim.createDiv({ cls: "fs-card-name", text: spot.name });
  if (spot.cuisines.length > 0) {
    const chips = scrim.createDiv({ cls: "fs-card-chips" });
    for (const c of spot.cuisines.slice(0, 3)) chips.createSpan({ cls: "fs-chip", text: c });
    if (spot.cuisines.length > 3) {
      chips.createSpan({ cls: "fs-chip fs-chip-more", text: `+${spot.cuisines.length - 3}` });
    }
  }
  const meta = scrim.createDiv({ cls: "fs-card-meta" });
  if (spot.rating !== void 0) {
    const mine = meta.createSpan({ cls: "fs-meta-stars" });
    const star = mine.createSpan({ cls: "fs-star-icon" });
    (0, import_obsidian12.setIcon)(star, "star");
    mine.createSpan({ text: fmtRating(spot.rating) });
    const tier = tierFor(spot.rating, plugin.settings.ratingTiers);
    if (tier) mine.style.setProperty("--fs-tier", tier.color);
  }
  if (spot.external.googleRating !== void 0) {
    const g = meta.createSpan({ cls: "fs-meta-google" });
    g.createSpan({ cls: "fs-meta-g", text: "G" });
    const count = spot.external.googleRatingCount;
    g.createSpan({
      text: ` ${fmtRating(spot.external.googleRating)}${count ? ` (${fmtCount(count)})` : ""}`
    });
    if (isStaleRatings(plugin, spot.external)) {
      g.createSpan({
        cls: "fs-stale-dot",
        attr: { "aria-label": "Ratings may be outdated", title: "Ratings may be outdated" }
      });
    }
  }
  const other = bestOtherSource(spot.external);
  if (other) {
    const o = meta.createSpan({ cls: "fs-meta-google" });
    o.createSpan({ cls: "fs-meta-g", text: other.label });
    o.createSpan({ text: ` ${fmtRating(other.rating)}${other.scale10 ? "/10" : ""}` });
  }
  const hours = localClockApplies(spot.country, plugin.settings.defaultCountry) ? openState(spot.hours, /* @__PURE__ */ new Date()) : null;
  if (hours) {
    const chip = meta.createSpan({
      cls: `fs-open-chip ${hours.open ? "is-open" : "is-closed"}`,
      attr: { title: hours.label, "aria-label": hours.label }
    });
    if (hours.open) chip.style.setProperty("--fs-open", plugin.settings.statusColors.visited);
    chip.createSpan({ text: hours.open ? "Open" : "Closed" });
  }
  const when = spot.lastVisit ? relTime(spot.lastVisit) : spot.created ? `added ${relTime(spot.created)}` : "";
  if (when) meta.createSpan({ cls: "fs-meta-time", text: when });
  card2.addEventListener("click", () => openDetailModal(plugin, spot.path));
  card2.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetailModal(plugin, spot.path);
    }
  });
  return card2;
}
function buildCompactRow(parent, spot, plugin) {
  const row = parent.createDiv({ cls: "fs-card-row" });
  row.dataset.path = spot.path;
  row.setAttribute("role", "button");
  row.tabIndex = 0;
  row.setAttribute("aria-label", spot.name);
  const thumb = row.createDiv({ cls: "fs-card-row-thumb" });
  thumb.style.setProperty("--fs-cuisine-tint", cuisineTint(spot));
  thumb.createSpan({ cls: "fs-card-letter", text: (spot.name[0] ?? "?").toUpperCase() });
  attachLazyPhoto(thumb, plugin, spot, row);
  const body = row.createDiv({ cls: "fs-card-row-body" });
  body.createDiv({ cls: "fs-card-row-name", text: spot.name });
  const sub = [spot.city, spot.cuisines[0]].filter(Boolean).join(" \xB7 ");
  if (sub) body.createDiv({ cls: "fs-card-row-sub", text: sub });
  const right = row.createDiv({ cls: "fs-card-row-meta" });
  if (spot.rating !== void 0) {
    const mine = right.createSpan({ cls: "fs-meta-stars" });
    const star = mine.createSpan({ cls: "fs-star-icon" });
    (0, import_obsidian12.setIcon)(star, "star");
    mine.createSpan({ text: fmtRating(spot.rating) });
    const tier = tierFor(spot.rating, plugin.settings.ratingTiers);
    if (tier) mine.style.setProperty("--fs-tier", tier.color);
  } else {
    const dot = right.createSpan({
      cls: "fs-status-dot",
      attr: { title: spot.status === "visited" ? "Visited" : "Want to try" }
    });
    dot.style.setProperty(
      "--fs-status",
      spot.status === "visited" ? plugin.settings.statusColors.visited : plugin.settings.statusColors.wantToTry
    );
  }
  const menuBtn = row.createEl("button", {
    cls: "fs-card-menu fs-card-row-menu",
    attr: { "aria-label": "More actions" }
  });
  (0, import_obsidian12.setIcon)(menuBtn, "more-vertical");
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    spotMenu(plugin, spot).showAtMouseEvent(e);
  });
  row.addEventListener("click", () => openDetailModal(plugin, spot.path));
  row.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetailModal(plugin, spot.path);
    }
  });
  return row;
}

// src/ui/components/toolbar.ts
var import_obsidian13 = require("obsidian");
function debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  };
}
function buildSearchBox(parent, opts) {
  const wrap = parent.createDiv({ cls: "fs-search" });
  const icon = wrap.createSpan({ cls: "fs-search-icon" });
  (0, import_obsidian13.setIcon)(icon, "search");
  const input = wrap.createEl("input", {
    cls: "fs-search-input",
    attr: {
      type: "search",
      placeholder: opts.placeholder,
      spellcheck: "false",
      "aria-label": opts.placeholder,
      enterkeyhint: "search"
    }
  });
  const clear = wrap.createEl("button", {
    cls: "fs-search-clear",
    attr: { "aria-label": "Clear search", tabindex: "-1" }
  });
  (0, import_obsidian13.setIcon)(clear, "x");
  const emit = debounce((q) => opts.onQuery(q), opts.debounceMs ?? 250);
  const syncClear = () => clear.toggleClass("is-visible", input.value.length > 0);
  input.addEventListener("input", () => {
    syncClear();
    emit(input.value);
  });
  clear.addEventListener("click", (e) => {
    e.preventDefault();
    input.value = "";
    syncClear();
    input.focus();
    opts.onQuery("");
  });
  syncClear();
  return {
    wrapEl: wrap,
    inputEl: input,
    setValue(v) {
      input.value = v;
      syncClear();
    }
  };
}
function iconButton(parent, opts) {
  const btn = parent.createEl("button", {
    cls: ["fs-btn", opts.cls ?? ""].join(" ").trim(),
    attr: { "aria-label": opts.label, title: opts.label }
  });
  const ic = btn.createSpan({ cls: "fs-btn-icon" });
  (0, import_obsidian13.setIcon)(ic, opts.icon);
  if (opts.text) btn.createSpan({ cls: "fs-btn-label", text: opts.text });
  btn.addEventListener("click", (e) => opts.onClick(e));
  return btn;
}
function setButtonIcon(btn, icon) {
  const ic = btn.querySelector(".fs-btn-icon");
  if (ic) (0, import_obsidian13.setIcon)(ic, icon);
}

// src/ui/components/filtersDropdown.ts
var import_obsidian14 = require("obsidian");
var EMPTY_LABEL = "(empty)";
function cloneFilters(f) {
  return {
    excludedStatuses: [...f.excludedStatuses],
    excludedCuisines: [...f.excludedCuisines],
    excludedCountries: [...f.excludedCountries],
    excludedCities: [...f.excludedCities],
    excludedPrices: [...f.excludedPrices],
    minRating: f.minRating,
    favoritesOnly: f.favoritesOnly
  };
}
function isFilterActive(f) {
  return f.favoritesOnly || f.minRating > 0 || f.excludedStatuses.length > 0 || f.excludedCuisines.length > 0 || f.excludedCountries.length > 0 || f.excludedCities.length > 0 || f.excludedPrices.length > 0;
}
var PresetNameModal = class extends import_obsidian14.Modal {
  constructor(app, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
  }
  onOpen() {
    this.titleEl.setText("Save filter preset");
    const c = this.contentEl;
    c.createEl("p", {
      cls: "fs-preset-hint",
      text: "Saves the current search, filters and sort as your preset."
    });
    const input = c.createEl("input", {
      cls: "fs-preset-name-input",
      attr: { type: "text", placeholder: "Preset name" }
    });
    const actions = c.createDiv({ cls: "fs-empty-actions" });
    const save = actions.createEl("button", { cls: "fs-btn fs-btn-accent", text: "Save" });
    const submit = () => {
      const name = input.value.trim();
      if (!name) {
        input.addClass("fs-input-invalid");
        input.focus();
        return;
      }
      this.close();
      this.onSubmit(name);
    };
    save.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
    window.setTimeout(() => input.focus(), 0);
  }
  onClose() {
    this.contentEl.empty();
  }
};
function buildFiltersControl(parent, plugin, opts) {
  const wrap = parent.createDiv({ cls: "fs-filters-wrap" });
  const filterBtn = wrap.createEl("button", {
    cls: "fs-btn fs-filters-btn",
    attr: { "aria-label": "Filters", title: "Filters" }
  });
  const fbIcon = filterBtn.createSpan({ cls: "fs-btn-icon" });
  (0, import_obsidian14.setIcon)(fbIcon, "filter");
  filterBtn.createSpan({ cls: "fs-btn-label", text: "Filters" });
  filterBtn.createSpan({ cls: "fs-filter-dot" });
  const clearBtn = wrap.createEl("button", {
    cls: "fs-btn fs-filter-clear",
    attr: { "aria-label": "Reset filters \u2014 show all spots", title: "Reset filters \u2014 show all spots" }
  });
  (0, import_obsidian14.setIcon)(clearBtn, "x");
  const presetBtn = iconButton(wrap, {
    icon: "bookmark",
    label: "Filter preset",
    onClick: (e) => openPresetMenu(e)
  });
  let panelEl = null;
  const sync = () => {
    const active = isFilterActive(opts.getState());
    filterBtn.toggleClass("has-active", active);
    clearBtn.toggleClass("is-visible", active);
    presetBtn.toggleClass("is-active", !!plugin.settings.savedPreset);
  };
  const commit = (next) => {
    opts.setState(next);
    sync();
  };
  clearBtn.addEventListener("click", () => {
    commit(cloneFilters(EMPTY_FILTER_STATE));
    if (panelEl) rebuildPanel();
  });
  const onDocPointerDown = (e) => {
    const t = e.target;
    if (panelEl && !wrap.contains(t) && !panelEl.contains(t)) closePanel();
  };
  const onKeyDown = (e) => {
    if (e.key === "Escape") closePanel();
  };
  function closePanel() {
    if (!panelEl) return;
    panelEl.remove();
    panelEl = null;
    document.removeEventListener("pointerdown", onDocPointerDown, true);
    document.removeEventListener("keydown", onKeyDown, true);
  }
  function openPanel() {
    if (panelEl) {
      closePanel();
      return;
    }
    buildPanel();
    document.addEventListener("pointerdown", onDocPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
  }
  function rebuildPanel() {
    if (!panelEl) return;
    panelEl.remove();
    panelEl = null;
    buildPanel();
  }
  filterBtn.addEventListener("click", () => openPanel());
  function buildPanel() {
    const host = opts.panelHost ?? wrap;
    panelEl = host.createDiv({
      cls: opts.panelHost ? "fs-filter-panel fs-filter-drawer" : "fs-filter-panel"
    });
    const panel = panelEl;
    const topbar = panel.createDiv({ cls: "fs-filter-topbar" });
    topbar.createSpan({ cls: "fs-filter-topbar-hint", text: "Start from:" });
    const showAllBtn = topbar.createEl("button", { cls: "fs-btn fs-small-btn", text: "Show all" });
    const hideAllBtn = topbar.createEl("button", { cls: "fs-btn fs-small-btn", text: "Hide all" });
    showAllBtn.addEventListener("click", () => {
      const next = cloneFilters(opts.getState());
      next.excludedStatuses = [];
      next.excludedCuisines = [];
      next.excludedCountries = [];
      next.excludedCities = [];
      next.excludedPrices = [];
      commit(next);
      rebuildPanel();
    });
    hideAllBtn.addEventListener("click", () => {
      const next = cloneFilters(opts.getState());
      next.excludedStatuses = ["want-to-try", "visited"];
      next.excludedCuisines = [...plugin.store.distinct("cuisines"), ""];
      next.excludedCountries = [...plugin.store.distinct("country"), ""];
      next.excludedCities = [...plugin.store.distinct("city"), ""];
      next.excludedPrices = [1, 2, 3, 4, 0];
      commit(next);
      rebuildPanel();
    });
    const makeChip = (parentEl, label) => {
      const chip = parentEl.createEl("button", { cls: "fs-filter-chip" });
      const check = chip.createSpan({ cls: "fs-chip-check" });
      (0, import_obsidian14.setIcon)(check, "check");
      chip.createSpan({ text: label });
      return chip;
    };
    const favRow = panel.createDiv({ cls: "fs-filter-favrow" });
    const favChip = favRow.createEl("button", { cls: "fs-filter-chip fs-filter-fav" });
    const favIcon = favChip.createSpan({ cls: "fs-btn-icon" });
    (0, import_obsidian14.setIcon)(favIcon, "star");
    favChip.createSpan({ text: "Favorites only" });
    favChip.toggleClass("is-on", opts.getState().favoritesOnly);
    favChip.addEventListener("click", () => {
      const next = cloneFilters(opts.getState());
      next.favoritesOnly = !next.favoritesOnly;
      commit(next);
      favChip.toggleClass("is-on", next.favoritesOnly);
    });
    const ratingSec = panel.createDiv({ cls: "fs-filter-section" });
    const rHead = ratingSec.createDiv({ cls: "fs-filter-section-head" });
    rHead.createSpan({ text: "Minimum rating" });
    const rChips = ratingSec.createDiv({ cls: "fs-filter-chips" });
    const ratingOptions = plugin.settings.halfStarRatings ? [0, 1, 2, 3, 3.5, 4, 4.5, 5] : [0, 1, 2, 3, 4, 5];
    const ratingChipEls = [];
    for (const r of ratingOptions) {
      const chip = makeChip(rChips, r === 0 ? "Any" : `${r}+`);
      chip.toggleClass("is-on", opts.getState().minRating === r);
      chip.addEventListener("click", () => {
        const next = cloneFilters(opts.getState());
        next.minRating = r;
        commit(next);
        for (const el of ratingChipEls) el.removeClass("is-on");
        chip.addClass("is-on");
      });
      ratingChipEls.push(chip);
    }
    ratingSec.createDiv({
      cls: "fs-filter-note",
      text: "Unrated spots are always shown."
    });
    const facetSection = (title, options, isExcluded, toggle, includeAll, excludeAll) => {
      if (options.length === 0) return;
      const sec = panel.createDiv({ cls: "fs-filter-section" });
      const head = sec.createDiv({ cls: "fs-filter-section-head" });
      head.createSpan({ text: title });
      const headBtns = head.createDiv({ cls: "fs-filter-head-btns" });
      const allBtn = headBtns.createEl("button", { cls: "fs-filter-all", text: "Select all" });
      const noneBtn = headBtns.createEl("button", { cls: "fs-filter-all", text: "Deselect all" });
      const chipsEl = sec.createDiv({ cls: "fs-filter-chips" });
      const chipByValue = /* @__PURE__ */ new Map();
      for (const o of options) {
        const chip = makeChip(chipsEl, o.label);
        chip.toggleClass("is-on", !isExcluded(o.value));
        chip.addEventListener("click", () => {
          commit(toggle(o.value));
          chip.toggleClass("is-on", !isExcluded(o.value));
        });
        chipByValue.set(o.value, chip);
      }
      allBtn.addEventListener("click", () => {
        commit(includeAll());
        for (const chip of chipByValue.values()) chip.addClass("is-on");
      });
      noneBtn.addEventListener("click", () => {
        commit(excludeAll());
        for (const chip of chipByValue.values()) chip.removeClass("is-on");
      });
    };
    const toggleStr = (arr, v) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    const toggleNum = (arr, v) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    facetSection(
      "Status",
      [
        { value: "want-to-try", label: "Want to try" },
        { value: "visited", label: "Visited" }
      ],
      (v) => opts.getState().excludedStatuses.includes(String(v)),
      (v) => {
        const next = cloneFilters(opts.getState());
        next.excludedStatuses = toggleStr(next.excludedStatuses, String(v));
        return next;
      },
      () => {
        const next = cloneFilters(opts.getState());
        next.excludedStatuses = [];
        return next;
      },
      () => {
        const next = cloneFilters(opts.getState());
        next.excludedStatuses = ["want-to-try", "visited"];
        return next;
      }
    );
    const strFacet = (title, values, get2, set) => {
      const options = values.map((v) => ({ value: v, label: v }));
      options.push({ value: "", label: EMPTY_LABEL });
      facetSection(
        title,
        options,
        (v) => get2(opts.getState()).includes(String(v)),
        (v) => {
          const next = cloneFilters(opts.getState());
          set(next, toggleStr(get2(next), String(v)));
          return next;
        },
        () => {
          const next = cloneFilters(opts.getState());
          set(next, []);
          return next;
        },
        () => {
          const next = cloneFilters(opts.getState());
          set(next, [...values, ""]);
          return next;
        }
      );
    };
    strFacet(
      "Cuisine",
      plugin.store.distinct("cuisines"),
      (f) => f.excludedCuisines,
      (f, arr) => {
        f.excludedCuisines = arr;
      }
    );
    strFacet(
      "Country",
      plugin.store.distinct("country"),
      (f) => f.excludedCountries,
      (f, arr) => {
        f.excludedCountries = arr;
      }
    );
    strFacet(
      "City",
      plugin.store.distinct("city"),
      (f) => f.excludedCities,
      (f, arr) => {
        f.excludedCities = arr;
      }
    );
    const symbol = plugin.settings.currencySymbol || "\u20AC";
    facetSection(
      "Price",
      [
        { value: 1, label: symbol },
        { value: 2, label: symbol.repeat(2) },
        { value: 3, label: symbol.repeat(3) },
        { value: 4, label: symbol.repeat(4) },
        { value: 0, label: "No price" }
      ],
      (v) => opts.getState().excludedPrices.includes(Number(v)),
      (v) => {
        const next = cloneFilters(opts.getState());
        next.excludedPrices = toggleNum(next.excludedPrices, Number(v));
        return next;
      },
      () => {
        const next = cloneFilters(opts.getState());
        next.excludedPrices = [];
        return next;
      },
      () => {
        const next = cloneFilters(opts.getState());
        next.excludedPrices = [1, 2, 3, 4, 0];
        return next;
      }
    );
    const footer = panel.createDiv({ cls: "fs-filter-footer" });
    const clearAll = footer.createEl("button", { cls: "fs-btn", text: "Reset \u2014 show all" });
    clearAll.addEventListener("click", () => {
      commit(cloneFilters(EMPTY_FILTER_STATE));
      rebuildPanel();
    });
  }
  async function savePreset(name) {
    const ctx = opts.presetContext();
    plugin.settings.savedPreset = {
      name,
      query: ctx.query,
      filters: cloneFilters(opts.getState()),
      sort: { ...ctx.sort },
      secondarySort: ctx.secondarySort ? { ...ctx.secondarySort } : void 0
    };
    await plugin.saveSettings();
    sync();
    new import_obsidian14.Notice(`Preset "${name}" saved.`);
  }
  function openPresetMenu(e) {
    const menu = new import_obsidian14.Menu();
    const preset = plugin.settings.savedPreset;
    if (preset) {
      menu.addItem(
        (i) => i.setTitle(`Apply "${preset.name}"`).setIcon("bookmark-check").onClick(() => opts.applyPreset(preset))
      );
      menu.addItem(
        (i) => i.setTitle("Overwrite with current view").setIcon("save").onClick(() => void savePreset(preset.name))
      );
      menu.addItem(
        (i) => i.setTitle("Remove preset").setIcon("bookmark-x").onClick(async () => {
          plugin.settings.savedPreset = void 0;
          await plugin.saveSettings();
          sync();
          new import_obsidian14.Notice("Preset removed.");
        })
      );
    } else {
      menu.addItem(
        (i) => i.setTitle("Save current view as preset\u2026").setIcon("bookmark-plus").onClick(() => new PresetNameModal(plugin.app, (name) => void savePreset(name)).open())
      );
    }
    menu.showAtMouseEvent(e);
  }
  sync();
  return {
    el: wrap,
    sync,
    destroy: () => closePanel()
  };
}

// src/ui/components/sortMenu.ts
var import_obsidian15 = require("obsidian");
var SORT_KEYS = [
  "name",
  "rating",
  "external-rating",
  "price",
  "date-added",
  "last-visit",
  "visit-count"
];
var SORT_LABELS = {
  name: "Name",
  rating: "My rating",
  "external-rating": "Public rating",
  price: "Price",
  "date-added": "Date added",
  "last-visit": "Last visit",
  "visit-count": "Visit count"
};
var SORT_DEFAULT_DIR = {
  name: "asc",
  rating: "desc",
  "external-rating": "desc",
  price: "asc",
  "date-added": "desc",
  "last-visit": "desc",
  "visit-count": "desc"
};
function buildSortButton(parent, opts) {
  const btn = parent.createEl("button", {
    cls: "fs-btn fs-sort-btn",
    attr: { "aria-label": "Sort", title: "Sort" }
  });
  const iconEl = btn.createSpan({ cls: "fs-btn-icon" });
  const labelEl = btn.createSpan({ cls: "fs-btn-label" });
  const sync = () => {
    const { primary } = opts.get();
    (0, import_obsidian15.setIcon)(iconEl, primary.direction === "asc" ? "arrow-up-narrow-wide" : "arrow-down-wide-narrow");
    labelEl.setText(SORT_LABELS[primary.key] ?? "Sort");
  };
  const arrow = (spec, key) => {
    if (!spec || spec.key !== key) return "";
    return spec.direction === "asc" ? "  \u2191" : "  \u2193";
  };
  btn.addEventListener("click", (e) => {
    const { primary, secondary } = opts.get();
    const menu = new import_obsidian15.Menu();
    menu.addItem((i) => i.setTitle("Sort by").setDisabled(true));
    for (const key of SORT_KEYS) {
      menu.addItem((i) => {
        const isCurrent = primary.key === key;
        i.setTitle(`${SORT_LABELS[key]}${arrow(primary, key)}`).setChecked(isCurrent).onClick(() => {
          const next = isCurrent ? { key, direction: primary.direction === "asc" ? "desc" : "asc" } : { key, direction: SORT_DEFAULT_DIR[key] };
          opts.set(next, secondary?.key === key ? void 0 : secondary);
          sync();
        });
      });
    }
    menu.addSeparator();
    menu.addItem((i) => i.setTitle("Then by").setDisabled(true));
    menu.addItem(
      (i) => i.setTitle("None").setChecked(!secondary).onClick(() => {
        opts.set(primary, void 0);
        sync();
      })
    );
    for (const key of SORT_KEYS) {
      if (key === primary.key) continue;
      menu.addItem((i) => {
        const isCurrent = secondary?.key === key;
        i.setTitle(`${SORT_LABELS[key]}${arrow(secondary, key)}`).setChecked(!!isCurrent).onClick(() => {
          const next = isCurrent && secondary ? { key, direction: secondary.direction === "asc" ? "desc" : "asc" } : { key, direction: SORT_DEFAULT_DIR[key] };
          opts.set(primary, next);
          sync();
        });
      });
    }
    menu.showAtMouseEvent(e);
  });
  sync();
  return { el: btn, sync };
}

// src/ui/components/virtualGrid.ts
var import_obsidian16 = require("obsidian");
var CARD_SIZE_STEPS = [100, 120, 140, 160, 185, 215, 250];
function cardMinWidth(settings) {
  const step = import_obsidian16.Platform.isMobile ? settings.cardSizeMobile : settings.cardSizeDesktop;
  const idx = Math.max(0, Math.min(CARD_SIZE_STEPS.length - 1, step + 3));
  return CARD_SIZE_STEPS[idx];
}
function createVirtualGrid(parent, opts) {
  const gap = opts.gap ?? 12;
  const overscan = opts.overscanRows ?? 2;
  const scroller = parent.createDiv({ cls: "fs-vscroll fs-vgrid" });
  const sizer = scroller.createDiv({ cls: "fs-vsizer" });
  let items = [];
  let cols = 1;
  let colWidth = 0;
  let itemH = 0;
  let rowStride = 0;
  const mounted = /* @__PURE__ */ new Map();
  let raf = 0;
  let destroyed = false;
  const layout = () => {
    const width = sizer.clientWidth || scroller.clientWidth;
    if (width <= 0) return;
    const minW = Math.max(60, opts.minItemWidth());
    cols = Math.max(1, Math.floor((width + gap) / (minW + gap)));
    colWidth = Math.floor((width - gap * (cols - 1)) / cols);
    itemH = Math.max(1, Math.round(opts.itemHeight(colWidth)));
    rowStride = itemH + gap;
    const rows = Math.ceil(items.length / cols);
    sizer.style.height = `${rows > 0 ? rows * rowStride - gap : 0}px`;
  };
  const unmount = (el) => {
    opts.onUnmount?.(el);
    el.remove();
  };
  const clearMounted = () => {
    for (const el of mounted.values()) unmount(el);
    mounted.clear();
  };
  const update = () => {
    raf = 0;
    if (destroyed) return;
    if (items.length === 0 || rowStride <= 0) {
      clearMounted();
      return;
    }
    const top = scroller.scrollTop;
    const height = scroller.clientHeight || 600;
    const totalRows = Math.ceil(items.length / cols);
    const firstRow = Math.max(0, Math.floor(top / rowStride) - overscan);
    const lastRow = Math.min(totalRows - 1, Math.floor((top + height) / rowStride) + overscan);
    const first = firstRow * cols;
    const last = Math.min(items.length - 1, (lastRow + 1) * cols - 1);
    for (const [i, el] of mounted) {
      if (i < first || i > last) {
        unmount(el);
        mounted.delete(i);
      }
    }
    for (let i = first; i <= last; i++) {
      if (mounted.has(i)) continue;
      const cell = sizer.createDiv({ cls: "fs-vcell" });
      cell.style.width = `${colWidth}px`;
      cell.style.height = `${itemH}px`;
      cell.style.transform = `translate(${i % cols * (colWidth + gap)}px, ${Math.floor(i / cols) * rowStride}px)`;
      opts.render(items[i], cell, i);
      mounted.set(i, cell);
    }
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  scroller.addEventListener("scroll", schedule, { passive: true });
  const ro = new ResizeObserver(() => {
    if (destroyed) return;
    const prevCols = cols;
    const prevW = colWidth;
    layout();
    if (cols !== prevCols || colWidth !== prevW) clearMounted();
    schedule();
  });
  ro.observe(scroller);
  layout();
  schedule();
  return {
    el: scroller,
    setItems(next) {
      items = next;
      layout();
      clearMounted();
      schedule();
    },
    refresh() {
      layout();
      clearMounted();
      schedule();
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      scroller.removeEventListener("scroll", schedule);
      clearMounted();
      scroller.remove();
    }
  };
}
function createVirtualList(parent, opts) {
  const overscan = opts.overscanPx ?? 300;
  const scroller = parent.createDiv({ cls: "fs-vscroll fs-vlist" });
  const sizer = scroller.createDiv({ cls: "fs-vsizer" });
  let items = [];
  let offsets = [0];
  const mounted = /* @__PURE__ */ new Map();
  let raf = 0;
  let destroyed = false;
  const layout = () => {
    offsets = new Array(items.length + 1);
    offsets[0] = 0;
    for (let i = 0; i < items.length; i++) {
      offsets[i + 1] = offsets[i] + Math.max(1, opts.itemHeight(items[i], i));
    }
    sizer.style.height = `${offsets[items.length]}px`;
  };
  const unmount = (el) => {
    opts.onUnmount?.(el);
    el.remove();
  };
  const clearMounted = () => {
    for (const el of mounted.values()) unmount(el);
    mounted.clear();
  };
  const indexAt = (y) => {
    let lo = 0;
    let hi = items.length - 1;
    let ans = 0;
    while (lo <= hi) {
      const mid = lo + hi >> 1;
      if (offsets[mid] <= y) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  };
  const update = () => {
    raf = 0;
    if (destroyed) return;
    if (items.length === 0) {
      clearMounted();
      return;
    }
    const top = Math.max(0, scroller.scrollTop - overscan);
    const bottom = scroller.scrollTop + (scroller.clientHeight || 600) + overscan;
    const first = indexAt(top);
    const last = indexAt(bottom);
    for (const [i, el] of mounted) {
      if (i < first || i > last) {
        unmount(el);
        mounted.delete(i);
      }
    }
    for (let i = first; i <= last; i++) {
      if (mounted.has(i)) continue;
      const row = sizer.createDiv({ cls: "fs-vrow" });
      row.style.top = `${offsets[i]}px`;
      row.style.height = `${offsets[i + 1] - offsets[i]}px`;
      opts.render(items[i], row, i);
      mounted.set(i, row);
    }
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  scroller.addEventListener("scroll", schedule, { passive: true });
  const ro = new ResizeObserver(() => {
    if (!destroyed) schedule();
  });
  ro.observe(scroller);
  layout();
  schedule();
  return {
    el: scroller,
    setItems(next) {
      items = next;
      layout();
      clearMounted();
      schedule();
    },
    refresh() {
      layout();
      clearMounted();
      schedule();
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      scroller.removeEventListener("scroll", schedule);
      clearMounted();
      scroller.remove();
    }
  };
}

// src/ui/tabs/list.ts
var import_obsidian17 = require("obsidian");
var CUSTOM = "__custom__";
function mapsUrl2(spot) {
  const q = spot.coordinates ? `${spot.coordinates.lat},${spot.coordinates.lng}` : [spot.name, spot.city, spot.country].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
function createEditableTable(container, plugin, opts) {
  const root = container.createDiv({ cls: "fs-list-tab" });
  let items = [];
  let sortKey = null;
  let sortAsc = true;
  let pendingRefresh = false;
  const scroller = root.createDiv({ cls: "fs-list-scroll" });
  const table = scroller.createEl("table", { cls: "fs-list-table" });
  const thead = table.createEl("thead");
  const headRow = thead.createEl("tr");
  const COLS = [
    { key: "name", label: "Name" },
    { key: "cuisine", label: "Cuisine" },
    { key: "city", label: "City" },
    { key: "price", label: "Price" },
    { key: "rating", label: "My rating" },
    { key: "google", label: "Google" },
    { label: "\u2605", cls: "fs-col-fav" },
    { label: "", cls: "fs-col-actions" }
  ];
  for (const col of COLS) {
    const th = headRow.createEl("th", { cls: col.cls });
    if (!col.key) {
      th.setText(col.label);
      continue;
    }
    const btn = th.createEl("button", { cls: "fs-list-sort", text: col.label });
    btn.type = "button";
    const arrow = btn.createSpan({ cls: "fs-list-arrow" });
    const paint = () => {
      arrow.setText(sortKey === col.key ? sortAsc ? " \u2191" : " \u2193" : "");
    };
    paint();
    btn.addEventListener("click", () => {
      if (sortKey === col.key) sortAsc = !sortAsc;
      else {
        sortKey = col.key;
        sortAsc = col.key === "name" || col.key === "city" || col.key === "cuisine";
      }
      renderRows();
    });
  }
  const tbody = table.createEl("tbody");
  function visible() {
    if (sortKey === null) return items;
    const dir = sortAsc ? 1 : -1;
    const cmp = {
      name: (a, b) => a.name.localeCompare(b.name),
      city: (a, b) => (a.city ?? "").localeCompare(b.city ?? "") || a.name.localeCompare(b.name),
      cuisine: (a, b) => (a.cuisines[0] ?? "").localeCompare(b.cuisines[0] ?? "") || a.name.localeCompare(b.name),
      price: (a, b) => (a.price ?? 0) - (b.price ?? 0) || a.name.localeCompare(b.name),
      rating: (a, b) => (a.rating ?? 0) - (b.rating ?? 0) || a.name.localeCompare(b.name),
      google: (a, b) => (a.external.googleRating ?? 0) - (b.external.googleRating ?? 0) || a.name.localeCompare(b.name)
    };
    return [...items].sort((a, b) => cmp[sortKey](a, b) * dir);
  }
  function renderRows() {
    for (const th of Array.from(headRow.querySelectorAll(".fs-list-arrow"))) {
      th.setText("");
    }
    const headerButtons = Array.from(headRow.querySelectorAll(".fs-list-sort"));
    COLS.filter((c) => c.key).forEach((col, i) => {
      const arrow = headerButtons[i]?.querySelector(".fs-list-arrow");
      if (arrow) arrow.setText(sortKey === col.key ? sortAsc ? " \u2191" : " \u2193" : "");
    });
    const rows = visible();
    tbody.empty();
    for (const spot of rows) renderRow(spot);
  }
  function renderRow(spot) {
    const tr = tbody.createEl("tr", { cls: "fs-list-row" });
    tr.dataset.path = spot.path;
    if (opts.selectMode() && opts.isSelected(spot.path)) tr.addClass("is-selected");
    const nameTd = tr.createEl("td", { cls: "fs-list-name" });
    const nameBtn = nameTd.createEl("button", { cls: "fs-list-link", text: spot.name });
    nameBtn.type = "button";
    nameBtn.addEventListener("click", () => openDetailModal(plugin, spot.path));
    if (spot.status === "visited") {
      const dot = nameTd.createSpan({ cls: "fs-status-dot" });
      dot.style.setProperty("--fs-status", plugin.settings.statusColors.visited);
      dot.title = "Visited";
    }
    const cuisineTd = tr.createEl("td", { cls: "fs-list-cuisines" });
    const chips = cuisineTd.createDiv({ cls: "fs-list-chiprow" });
    for (const c of spot.cuisines) {
      const chip = chips.createSpan({ cls: "fs-list-chip" });
      chip.createSpan({ cls: "fs-chip-text", text: c });
      const rm = chip.createEl("button", {
        cls: "fs-chip-x",
        attr: { "aria-label": `Remove ${c}` }
      });
      rm.type = "button";
      rm.setText("\xD7");
      rm.addEventListener("click", () => {
        void save(spot, { cuisines: spot.cuisines.filter((x) => x !== c) });
      });
    }
    const addSel = chips.createEl("select", { cls: "dropdown fs-list-cuisine-add" });
    addSel.setAttribute("aria-label", `Add a cuisine to ${spot.name}`);
    addSel.createEl("option", { text: spot.cuisines.length > 0 ? "+" : "+ cuisine", value: "" });
    for (const c of plugin.store.distinct("cuisines").filter((c2) => !spot.cuisines.some((x) => x.toLowerCase() === c2.toLowerCase()))) {
      addSel.createEl("option", { text: c, value: c });
    }
    addSel.createEl("option", { text: "Something else\u2026", value: CUSTOM });
    addSel.addEventListener("change", () => {
      let value = addSel.value;
      if (value === "") return;
      if (value === CUSTOM) {
        const typed = window.prompt(`New cuisine for ${spot.name}`, "");
        addSel.value = "";
        if (typed === null || typed.trim() === "") return;
        value = typed.trim();
      }
      if (spot.cuisines.some((x) => x.toLowerCase() === value.toLowerCase())) return;
      void save(spot, { cuisines: [...spot.cuisines, value] });
    });
    tr.createEl("td", { cls: "fs-list-city", text: spot.city ?? "" });
    const priceTd = tr.createEl("td");
    const pSel = priceTd.createEl("select", { cls: "dropdown fs-list-cell-select fs-list-price" });
    const symbol = plugin.settings.currencySymbol || "\u20AC";
    pSel.createEl("option", { text: "\u2014", value: "" });
    for (let t = 1; t <= 4; t++) pSel.createEl("option", { text: symbol.repeat(t), value: String(t) });
    pSel.value = spot.price ? String(spot.price) : "";
    pSel.addEventListener("change", () => {
      void save(spot, { price: pSel.value === "" ? void 0 : Number(pSel.value) });
    });
    const ratingTd = tr.createEl("td", { cls: "fs-list-rating" });
    starRating(ratingTd, {
      value: spot.rating,
      halfSteps: plugin.settings.halfStarRatings,
      tiers: plugin.settings.ratingTiers,
      onChange: (v) => {
        void save(spot, v > 0 ? { rating: v, ratingLocked: true } : { rating: void 0 });
      }
    });
    const g = spot.external.googleRating;
    tr.createEl("td", {
      cls: "fs-list-google",
      text: g !== void 0 ? fmtRating(g) : ""
    });
    const favTd = tr.createEl("td", { cls: "fs-col-fav" });
    const fav = favTd.createEl("button", {
      cls: "fs-list-fav",
      attr: { "aria-label": spot.favorite ? "Remove favorite" : "Mark favorite" }
    });
    fav.type = "button";
    (0, import_obsidian17.setIcon)(fav, "star");
    fav.toggleClass("is-active", spot.favorite);
    fav.style.setProperty("--fs-fav", plugin.settings.statusColors.favorite);
    fav.addEventListener("click", () => void save(spot, { favorite: !spot.favorite }));
    const actTd = tr.createEl("td", { cls: "fs-col-actions" });
    const action = (icon, label, fn) => {
      const b = actTd.createEl("button", { cls: "fs-list-action", attr: { "aria-label": label } });
      b.type = "button";
      b.title = label;
      (0, import_obsidian17.setIcon)(b, icon);
      b.addEventListener("click", fn);
    };
    action("file-text", "Open note", () => void plugin.store.openNote(spot.path));
    action("map-pin", "Open in Google Maps", () => window.open(mapsUrl2(spot), "_blank"));
    const moreBtn = actTd.createEl("button", {
      cls: "fs-list-action",
      attr: { "aria-label": "More" }
    });
    moreBtn.type = "button";
    moreBtn.title = "More";
    (0, import_obsidian17.setIcon)(moreBtn, "more-vertical");
    moreBtn.addEventListener("click", (ev) => {
      const menu = new import_obsidian17.Menu();
      menu.addItem(
        (i) => i.setTitle(spot.status === "visited" ? "Mark want to try" : "Mark visited").setIcon("check").onClick(
          () => void save(spot, { status: spot.status === "visited" ? "want-to-try" : "visited" })
        )
      );
      if (spot.url) {
        const url = spot.url;
        menu.addItem(
          (i) => i.setTitle("Open website").setIcon("globe").onClick(() => window.open(url, "_blank"))
        );
      }
      menu.showAtMouseEvent(ev);
    });
  }
  async function save(spot, patch) {
    try {
      await plugin.store.updateSpot(spot.path, patch);
    } catch (e) {
      new import_obsidian17.Notice(`Couldn't save \u2014 ${e instanceof Error ? e.message : String(e)}`);
      renderRows();
    }
  }
  function busy() {
    const ae = document.activeElement;
    return ae instanceof HTMLElement && root.contains(ae) && (ae.tagName === "SELECT" || ae.tagName === "INPUT");
  }
  const onFocusOut = () => {
    window.setTimeout(() => {
      if (pendingRefresh && !busy()) {
        pendingRefresh = false;
        renderRows();
      }
    }, 120);
  };
  root.addEventListener("focusout", onFocusOut);
  renderRows();
  return {
    el: root,
    setItems: (next) => {
      items = next;
      if (busy()) {
        pendingRefresh = true;
        return;
      }
      renderRows();
    },
    refresh: () => {
      if (busy()) {
        pendingRefresh = true;
        return;
      }
      renderRows();
    },
    destroy: () => {
      root.removeEventListener("focusout", onFocusOut);
      root.remove();
    }
  };
}

// src/ui/modals/addChooser.ts
var import_obsidian20 = require("obsidian");

// src/ui/modals/importFlow.ts
var import_obsidian18 = require("obsidian");
function importFromClipboard(plugin) {
  navigator.clipboard.readText().then((text) => {
    const url = (text ?? "").trim();
    if (/^https?:\/\/\S+$/i.test(url)) {
      openImportModal(plugin, url);
    } else {
      new import_obsidian18.Notice("Clipboard doesn't contain a web link \u2014 paste one into the import box.");
      openImportModal(plugin);
    }
  }).catch(() => {
    new import_obsidian18.Notice("Couldn't read the clipboard \u2014 paste the link manually.");
    openImportModal(plugin);
  });
}
function openImportModal(plugin, url) {
  new ImportModal(plugin, url).open();
}
var ImportModal = class extends import_obsidian18.Modal {
  constructor(plugin, initialUrl) {
    super(plugin.app);
    this.plugin = plugin;
    this.initialUrl = initialUrl;
    this.running = false;
  }
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-import-modal");
    this.titleEl.setText("Import from a link");
    this.contentEl.createEl("p", {
      cls: "fs-import-hint",
      text: "Google Maps links (short links too), TripAdvisor pages, and most restaurant websites work."
    });
    const wrap = this.contentEl.createDiv({ cls: "fs-field fs-field-wide" });
    wrap.createEl("label", { cls: "fs-field-label", text: "Link" });
    this.urlInput = wrap.createEl("input", {
      type: "text",
      placeholder: "https://maps.app.goo.gl/\u2026"
    });
    this.urlInput.value = this.initialUrl ?? "";
    this.msgEl = wrap.createDiv({ cls: "fs-field-msg" });
    this.urlInput.addEventListener("input", () => {
      wrap.removeClass("fs-field-error");
      this.msgEl.setText("");
    });
    this.urlInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") void this.run();
    });
    this.statusEl = this.contentEl.createDiv({ cls: "fs-import-status" });
    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    this.importBtn = buttons.createEl("button", { text: "Import", cls: "mod-cta" });
    this.importBtn.type = "button";
    this.importBtn.addEventListener("click", () => void this.run());
    window.setTimeout(() => this.urlInput.focus(), 0);
  }
  setStatus(text, spinning) {
    this.statusEl.empty();
    if (text === "") return;
    if (spinning) {
      const icon = this.statusEl.createSpan({ cls: "fs-spin" });
      (0, import_obsidian18.setIcon)(icon, "loader-2");
    }
    this.statusEl.createSpan({ text });
  }
  async run() {
    if (this.running) return;
    const url = this.urlInput.value.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      this.urlInput.parentElement?.addClass("fs-field-error");
      this.msgEl.setText("Enter a full link starting with http:// or https://.");
      this.urlInput.focus();
      return;
    }
    this.running = true;
    this.importBtn.disabled = true;
    this.urlInput.disabled = true;
    this.setStatus("Fetching and parsing the page\u2026", true);
    let draft;
    try {
      draft = await this.plugin.importer.importFromUrl(url);
    } catch (e) {
      this.running = false;
      this.importBtn.disabled = false;
      this.urlInput.disabled = false;
      this.setStatus("", false);
      this.urlInput.parentElement?.addClass("fs-field-error");
      this.msgEl.setText(`Import failed \u2014 ${errorMessage5(e)}`);
      return;
    }
    const attach = this.findRatingAttachTarget(url, draft);
    if (attach) {
      this.setStatus("", false);
      this.showAttachChoice(attach.spot, attach.source, draft);
      return;
    }
    await this.finishImport(draft);
  }
  /** Review form or direct save — the pre-v1.1 tail of `run`. */
  async finishImport(draft) {
    if (this.plugin.settings.reviewBeforeSave) {
      this.close();
      openAddModal(this.plugin, draft);
      return;
    }
    const input = draftToInput(this.plugin, draft);
    if (!input) {
      this.close();
      new import_obsidian18.Notice("Couldn't read a name from that link \u2014 review the details before saving.");
      openAddModal(this.plugin, draft);
      return;
    }
    try {
      const created = await this.plugin.store.createSpot(input);
      this.close();
      showUndoNotice(this.plugin, created);
      for (const w of draft.warnings) new import_obsidian18.Notice(`Import warning \u2014 ${w}`, 1e4);
    } catch (e) {
      this.running = false;
      this.importBtn.disabled = false;
      this.urlInput.disabled = false;
      this.setStatus("", false);
      this.urlInput.parentElement?.addClass("fs-field-error");
      this.msgEl.setText(`Couldn't save the spot \u2014 ${errorMessage5(e)}`);
    }
  }
  // -------------------------------------------------- attach rating source
  /**
   * A TripAdvisor/Yelp/TheFork import whose draft matches an existing spot
   * (distance-aware duplicate scan) — the attach candidate, or null.
   */
  findRatingAttachTarget(url, draft) {
    if (!this.plugin.settings.duplicateDetectionEnabled) return null;
    const source = detectSource(draft.sourceUrl) ?? detectSource(url);
    if (source !== "tripadvisor" && source !== "yelp" && source !== "thefork") return null;
    let dups = [];
    try {
      dups = this.plugin.importer.findDuplicates(draft.fields, this.plugin.store.getSpots());
    } catch {
      return null;
    }
    const spot = dups[0];
    return spot ? { spot, source } : null;
  }
  showAttachChoice(target, source, draft) {
    const banner = this.contentEl.createDiv({ cls: "fs-dup-banner fs-attach-banner" });
    const icon = banner.createSpan({ cls: "fs-dup-icon" });
    (0, import_obsidian18.setIcon)(icon, "star");
    const text = banner.createDiv({ cls: "fs-dup-text" });
    text.createDiv({
      text: `This ${SOURCE_LABELS[source]} page looks like \u201C${target.name}\u201D${target.city ? ` in ${target.city}` : ""}, which is already in your library.`
    });
    const actions = text.createDiv({ cls: "fs-dup-actions" });
    const attach = actions.createEl("button", {
      text: `Attach as rating source to \u201C${target.name}\u201D`,
      cls: "mod-cta"
    });
    attach.type = "button";
    attach.addEventListener("click", () => {
      attach.disabled = true;
      void this.attachRatingSource(target, source, draft.sourceUrl).catch((e) => {
        attach.disabled = false;
        new import_obsidian18.Notice(`Couldn't attach the rating source \u2014 ${errorMessage5(e)}`);
      });
    });
    const merge = actions.createEl("button", { text: "Merge into existing" });
    merge.type = "button";
    merge.addEventListener("click", () => {
      this.close();
      openMergeModal(this.plugin, target.path, draft.fields);
    });
    const keep = actions.createEl("button", { text: "Keep as new" });
    keep.type = "button";
    keep.addEventListener("click", () => {
      banner.remove();
      void this.finishImport(draft);
    });
  }
  /** Set the source URL on the existing spot, then refresh its ratings. */
  async attachRatingSource(target, source, url) {
    const key = SOURCE_URL_KEYS[source];
    const updated = await this.plugin.store.updateSpot(target.path, {
      external: { ...target.external, [key]: url }
    });
    this.close();
    new import_obsidian18.Notice(`Attached ${SOURCE_LABELS[source]} as a rating source for \u201C${target.name}\u201D.`);
    void refreshSpotRatings(this.plugin, updated);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var SOURCE_LABELS = {
  tripadvisor: "TripAdvisor",
  yelp: "Yelp",
  thefork: "TheFork",
  facebook: "Facebook",
  opentable: "OpenTable",
  eetnu: "Eet.nu"
};
var SOURCE_URL_KEYS = {
  tripadvisor: "tripadvisorUrl",
  yelp: "yelpUrl",
  thefork: "theforkUrl",
  facebook: "facebookUrl",
  opentable: "opentableUrl",
  eetnu: "eetnuUrl"
};
var detectSource = detectRatingSource ?? fallbackDetectSource;
function fallbackDetectSource(url) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host.includes("tripadvisor.")) return "tripadvisor";
  if (host === "yelp.com" || host.endsWith(".yelp.com")) return "yelp";
  if (host.includes("thefork.") || host.includes("lafourchette.") || host.includes("eltenedor."))
    return "thefork";
  return null;
}
function draftToInput(plugin, draft) {
  const f = draft.fields;
  const name = f.name?.trim();
  if (!name) return null;
  return {
    name,
    cuisines: f.cuisines ?? [],
    country: f.country ?? plugin.settings.defaultCountry ?? "",
    city: f.city,
    district: f.district,
    address: f.address,
    coordinates: f.coordinates,
    status: f.status ?? "want-to-try",
    favorite: f.favorite ?? false,
    rating: f.rating,
    ratingLocked: f.ratingLocked ?? false,
    price: f.price,
    url: f.url,
    phone: f.phone,
    source: f.source ?? kindToSource2(draft.importerKind),
    sourceUrl: f.sourceUrl ?? draft.sourceUrl,
    // v0.1 defect #3: external ratings survive the save.
    external: { ...f.external ?? {} },
    photo: f.photo,
    menu: f.menu,
    // Google returns opening hours and the pipeline puts them on the draft;
    // omitting them here meant an imported note never carried the hours the
    // import dialog had just shown.
    hours: f.hours,
    tags: f.tags ?? [],
    visits: f.visits ?? [],
    notes: f.notes ?? "",
    // Store-owned: a brand new note gets its own identity and timestamps.
    legacyId: void 0,
    ctime: void 0,
    created: void 0
  };
}
function kindToSource2(kind) {
  switch (kind) {
    case "google-maps":
      return "google-maps";
    case "tripadvisor":
      return "tripadvisor";
    default:
      return "url";
  }
}
function showUndoNotice(plugin, spot) {
  const frag = document.createDocumentFragment();
  frag.createSpan({ text: `Added \u201C${spot.name}\u201D. ` });
  const btn = frag.createEl("button", { text: "Undo", cls: "fs-notice-undo" });
  btn.type = "button";
  const notice = new import_obsidian18.Notice(frag, 1e4);
  btn.addEventListener("click", () => {
    notice.hide();
    plugin.store.deleteSpot(spot.path).then(
      () => new import_obsidian18.Notice("Import undone \u2014 the note went to the trash."),
      (e) => new import_obsidian18.Notice(`Couldn't undo the import \u2014 ${errorMessage5(e)}`)
    );
  });
}
function errorMessage5(e) {
  return e instanceof Error ? e.message : String(e);
}

// src/ui/modals/listImport.ts
var import_obsidian19 = require("obsidian");

// src/import/listParse.ts
var MAX_NAMES = 100;
var MAX_NAME_LENGTH = 80;
var EMOJI_RE = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{20E3}\u{200D}]/gu;
var INVISIBLE_RE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
var BULLET_RE = /^[\s>*•·‣▪◦+\-–—]+/;
var NUMBERING_RE = /^(?:\d{1,3}[.):\]]\s*|\d{1,3}\s+[-–—]\s+)/;
var LEADING_PUNCT_RE = /^[\s,;:.!?*•·"'“”‘’]+/;
var TRAILING_PUNCT_RE = /[\s,;:.!*•·\-–—"'“”‘’]+$/;
var URL_TLDS = /* @__PURE__ */ new Set([
  "com",
  "net",
  "org",
  "info",
  "biz",
  "io",
  "co",
  "app",
  "site",
  "menu",
  "restaurant",
  "nl",
  "be",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "uk",
  "eu",
  "us"
]);
function looksLikeUrl(s) {
  if (/https?:\/\//i.test(s) || /\bwww\./i.test(s)) return true;
  if (/\s/.test(s)) return false;
  const parts = s.toLowerCase().split(".");
  if (parts.length < 2 || parts.some((p) => p === "")) return false;
  return URL_TLDS.has(parts[parts.length - 1]);
}
function cleanLine(line) {
  let s = line.replace(INVISIBLE_RE, "").replace(EMOJI_RE, " ");
  for (let i = 0; i < 5; i++) {
    const before = s;
    s = s.replace(BULLET_RE, "").replace(NUMBERING_RE, "");
    if (s === before) break;
  }
  return s.replace(LEADING_PUNCT_RE, "").replace(TRAILING_PUNCT_RE, "").replace(/\s+/g, " ").trim();
}
function isName(s) {
  if (s === "" || s.length > MAX_NAME_LENGTH) return false;
  if (!/\p{L}/u.test(s)) return false;
  return !looksLikeUrl(s);
}
function parseNameListVerbose(text) {
  const seen = /* @__PURE__ */ new Set();
  const names = [];
  let dropped = 0;
  for (const raw of text.split(/\r\n|\r|\n/)) {
    const name = cleanLine(raw);
    if (!isName(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (names.length >= MAX_NAMES) {
      dropped++;
      continue;
    }
    names.push(name);
  }
  return { names, dropped };
}

// src/ui/modals/listImport.ts
var NO_KEY_HINT = "Add a Google Places API key in Settings \u2192 Food Spot \u2192 API";
var LOOKUP_THROTTLE_MS = 320;
var MAX_CANDIDATES = 3;
var PLACEHOLDER = [
  "Rotterdam tips \u{1F35C}",
  "1. Little V",
  "2. Momiji",
  "- Fitzgerald",
  "\u2022 Bokaal"
].join("\n");
function openListImportModal(plugin) {
  new ListImportModal(plugin).open();
}
function errorMessage6(e) {
  return e instanceof Error ? e.message : String(e);
}
function sleep3(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function fmtCount2(n) {
  return n >= 1e3 ? `${(Math.round(n / 100) / 10).toFixed(1)}k` : String(n);
}
function lookupQuery(name, near) {
  const suffix = near.trim();
  return `${name} restaurant${suffix === "" ? "" : ` ${suffix}`}`;
}
function savedSets(spots) {
  const nameCities = /* @__PURE__ */ new Map();
  const ids = /* @__PURE__ */ new Set();
  for (const s of spots) {
    const key = normalizeName(s.name);
    let cities = nameCities.get(key);
    if (!cities) nameCities.set(key, cities = /* @__PURE__ */ new Set());
    cities.add((s.city ?? "").trim().toLowerCase());
    const id = s.external.googlePlaceId;
    if (id !== void 0 && id !== "") ids.add(id);
  }
  return { ids, nameCities };
}
function rememberSaved(sets, spot) {
  const key = normalizeName(spot.name);
  let cities = sets.nameCities.get(key);
  if (!cities) sets.nameCities.set(key, cities = /* @__PURE__ */ new Set());
  cities.add((spot.city ?? "").trim().toLowerCase());
  const id = spot.external.googlePlaceId;
  if (id !== void 0 && id !== "") sets.ids.add(id);
}
function isSaved(c, sets) {
  if (sets.ids.has(c.placeId)) return true;
  const cities = sets.nameCities.get(normalizeName(c.name));
  if (!cities) return false;
  const addr = (c.address ?? "").toLowerCase();
  for (const city of cities) {
    if (city === "" || addr !== "" && addr.includes(city)) return true;
  }
  return false;
}
function nameTaken(name, sets) {
  return sets.nameCities.has(normalizeName(name));
}
function isConfident(pasted, c) {
  const a = normalizeName(pasted);
  const b = normalizeName(c.name);
  if (a === "" || b === "") return false;
  return a === b || a.includes(b) || b.includes(a);
}
var ListImportModal = class extends import_obsidian19.Modal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
    this.text = "";
    this.rows = [];
    /** Bumped by close/Back/new run — every await checks it before touching DOM. */
    this.gen = 0;
    this.adding = false;
    this.unsubscribe = null;
    this.footerCountEl = null;
    this.addBtn = null;
    this.progress = null;
    this.near = plugin.settings.defaultCountry;
  }
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-list-import-modal");
    this.titleEl.setText("Import a list of restaurant names");
    this.unsubscribe = this.plugin.store.onChange(() => this.refreshSaved());
    this.renderPaste();
  }
  onClose() {
    this.gen++;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.rows = [];
    this.progress = null;
    this.footerCountEl = null;
    this.addBtn = null;
    this.contentEl.empty();
  }
  // -- phase 1: paste ------------------------------------------------------
  renderPaste() {
    this.gen++;
    this.adding = false;
    this.rows = [];
    this.progress = null;
    this.footerCountEl = null;
    this.addBtn = null;
    const body = this.contentEl;
    body.empty();
    body.createEl("p", {
      cls: "fs-import-hint",
      text: "Paste the whole message \u2014 bullets, numbering and emoji are stripped for you. One restaurant per line."
    });
    const textarea = body.createEl("textarea", {
      cls: "fs-li-textarea",
      attr: { rows: "9", placeholder: PLACEHOLDER, spellcheck: "false" }
    });
    textarea.value = this.text;
    const nearField = body.createDiv({ cls: "fs-field fs-li-near" });
    nearField.createEl("label", { cls: "fs-field-label", text: "Search near" });
    const nearInput = nearField.createEl("input", {
      cls: "fs-li-near-input",
      attr: {
        type: "text",
        placeholder: "City, area or country \u2014 biases the Google lookup",
        spellcheck: "false"
      }
    });
    nearInput.value = this.near;
    nearInput.addEventListener("input", () => {
      this.near = nearInput.value;
    });
    const countEl = body.createDiv({ cls: "fs-li-count" });
    const buttons = body.createDiv({ cls: "fs-modal-buttons" });
    const bareBtn = buttons.createEl("button", { text: "Add without lookup" });
    bareBtn.type = "button";
    const lookupBtn = buttons.createEl("button", { cls: "mod-cta" });
    lookupBtn.type = "button";
    const lookupIcon = lookupBtn.createSpan({ cls: "fs-btn-icon" });
    (0, import_obsidian19.setIcon)(lookupIcon, "search");
    lookupBtn.createSpan({ text: "Look up on Google" });
    const hasKey = this.plugin.importer.hasGoogleKey();
    if (!hasKey) lookupBtn.title = NO_KEY_HINT;
    const sync = () => {
      this.text = textarea.value;
      const { names, dropped } = parseNameListVerbose(this.text);
      const n = names.length;
      const parts = [`${n} name${n === 1 ? "" : "s"} recognized`];
      if (dropped > 0) parts.push(`${dropped} over the ${MAX_NAMES} limit ignored`);
      countEl.setText(parts.join(" \xB7 "));
      countEl.toggleClass("fs-li-count-empty", n === 0);
      lookupBtn.disabled = n === 0 || !hasKey;
      bareBtn.disabled = n === 0;
    };
    textarea.addEventListener("input", sync);
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !lookupBtn.disabled) {
        e.preventDefault();
        sync();
        void this.runLookup(parseNameListVerbose(this.text).names);
      }
    });
    sync();
    bareBtn.addEventListener("click", () => {
      void this.addWithoutLookup(parseNameListVerbose(this.text).names);
    });
    lookupBtn.addEventListener("click", () => {
      if (!hasKey) {
        new import_obsidian19.Notice(NO_KEY_HINT);
        return;
      }
      void this.runLookup(parseNameListVerbose(this.text).names);
    });
    textarea.focus();
  }
  /** No Google at all: bare want-to-try spots straight from the pasted names. */
  async addWithoutLookup(names) {
    if (names.length === 0) return;
    const myGen = ++this.gen;
    const signal = { cancelled: false };
    this.adding = true;
    this.renderProgress("Adding spots\u2026", names.length, signal);
    const sets = savedSets(this.plugin.store.getSpots());
    let added = 0;
    let skipped = 0;
    let failed = 0;
    for (let i = 0; i < names.length; i++) {
      if (myGen !== this.gen) return;
      if (signal.cancelled) break;
      const name = names[i];
      this.setProgress(i, names.length, name);
      if (nameTaken(name, sets)) {
        skipped++;
        continue;
      }
      try {
        const spot = await this.plugin.store.createSpot(this.bareInput(name));
        if (myGen !== this.gen) return;
        rememberSaved(sets, spot);
        added++;
      } catch {
        failed++;
      }
    }
    if (myGen !== this.gen) return;
    this.adding = false;
    this.finish(signal.cancelled, added, 0, skipped, failed);
  }
  // -- phase 2: lookup + review -------------------------------------------
  async runLookup(names) {
    if (names.length === 0) return;
    const myGen = ++this.gen;
    const signal = { cancelled: false };
    this.renderProgress("Looking up on Google\u2026", names.length, signal);
    const near = this.near;
    const results = [];
    for (let i = 0; i < names.length; i++) {
      if (myGen !== this.gen) return;
      if (signal.cancelled) break;
      const name = names[i];
      this.setProgress(i, names.length, name);
      const result = { name, candidates: [] };
      try {
        const found = await this.plugin.importer.searchPlaces(lookupQuery(name, near));
        result.candidates = found.slice(0, MAX_CANDIDATES);
      } catch (e) {
        result.error = errorMessage6(e);
      }
      if (myGen !== this.gen) return;
      results.push(result);
      if (i < names.length - 1 && !signal.cancelled) await sleep3(LOOKUP_THROTTLE_MS);
    }
    if (myGen !== this.gen) return;
    this.setProgress(results.length, names.length, "");
    this.renderReview(results, names.length);
  }
  renderReview(results, requested) {
    const body = this.contentEl;
    body.empty();
    this.progress = null;
    this.rows = [];
    const head = body.createDiv({ cls: "fs-li-review-head" });
    head.setText(
      results.length < requested ? `${results.length} of ${requested} names looked up \u2014 the rest was cancelled.` : `${results.length} name${results.length === 1 ? "" : "s"} looked up. Tick the ones to add.`
    );
    const list = body.createDiv({ cls: "fs-li-list" });
    const sets = savedSets(this.plugin.store.getSpots());
    for (const result of results) this.buildRow(list, result, sets);
    const footer = body.createDiv({ cls: "fs-li-footer" });
    this.footerCountEl = footer.createSpan({ cls: "fs-li-footer-count" });
    const buttons = footer.createDiv({ cls: "fs-li-footer-buttons" });
    const back = buttons.createEl("button", { text: "Back" });
    back.type = "button";
    back.addEventListener("click", () => this.renderPaste());
    this.addBtn = buttons.createEl("button", { cls: "mod-cta", text: "Add selected" });
    this.addBtn.type = "button";
    this.addBtn.addEventListener("click", () => void this.addSelected());
    this.syncFooter();
  }
  buildRow(list, result, sets) {
    const rowEl = list.createDiv({ cls: "fs-li-row" });
    const checkbox = rowEl.createEl("input", { cls: "fs-li-check", type: "checkbox" });
    const main = rowEl.createDiv({ cls: "fs-li-main" });
    const head = main.createDiv({ cls: "fs-li-head" });
    head.createSpan({ cls: "fs-li-name", text: result.name });
    const statusEl = head.createSpan({ cls: "fs-li-status" });
    const candEl = main.createDiv({ cls: "fs-li-cand" });
    const top = result.candidates[0];
    const saved = top !== void 0 && isSaved(top, sets);
    const row = {
      ...result,
      selected: result.candidates.length > 0 ? 0 : -1,
      // Only a confident, not-yet-saved match is ticked for you.
      checked: top !== void 0 && !saved && isConfident(result.name, top),
      saved,
      rowEl,
      checkbox,
      statusEl,
      candEl
    };
    checkbox.checked = row.checked;
    checkbox.setAttribute("aria-label", `Add ${result.name}`);
    checkbox.addEventListener("change", () => {
      row.checked = checkbox.checked;
      this.syncFooter();
    });
    this.rows.push(row);
    this.renderCandidate(row);
  }
  /** Rebuilds the candidate block + status badge for one row. */
  renderCandidate(row) {
    row.candEl.empty();
    row.statusEl.empty();
    row.rowEl.toggleClass("fs-li-saved", row.saved);
    const c = row.selected >= 0 ? row.candidates[row.selected] : void 0;
    if (c === void 0) {
      row.statusEl.createSpan({
        cls: "fs-li-badge fs-li-badge-warn",
        text: row.error !== void 0 ? "Lookup failed" : "Not found"
      });
      row.candEl.createDiv({
        cls: "fs-li-none",
        text: row.error ?? "Google found nothing \u2014 tick it to add the name as a plain spot."
      });
      return;
    }
    if (row.saved) {
      row.statusEl.createSpan({ cls: "fs-badge-saved", text: "\u2713 Already saved" });
    } else if (!isConfident(row.name, c)) {
      row.statusEl.createSpan({ cls: "fs-li-badge", text: "Check match" });
    }
    row.candEl.createDiv({ cls: "fs-li-cand-name", text: c.name });
    if (c.address !== "") row.candEl.createDiv({ cls: "fs-li-cand-addr", text: c.address });
    const meta = row.candEl.createDiv({ cls: "fs-li-meta" });
    if (c.rating !== void 0) {
      const g = meta.createSpan({ cls: "fs-li-rating" });
      g.createSpan({ cls: "fs-meta-g", text: "G" });
      g.createSpan({
        text: ` ${c.rating.toFixed(1)}${c.ratingCount ? ` (${fmtCount2(c.ratingCount)})` : ""}`
      });
    }
    if (c.priceLevel !== void 0 && c.priceLevel > 0) {
      meta.createSpan({
        cls: "fs-li-price",
        text: this.plugin.settings.currencySymbol.repeat(Math.min(4, c.priceLevel))
      });
    }
    if (row.candidates.length > 1) {
      const select = row.candEl.createEl("select", { cls: "dropdown fs-li-picker" });
      select.setAttribute("aria-label", `Choose the match for ${row.name}`);
      row.candidates.forEach((cand, i) => {
        const opt = select.createEl("option", {
          text: cand.address === "" ? cand.name : `${cand.name} \u2014 ${cand.address}`
        });
        opt.value = String(i);
        if (i === row.selected) opt.selected = true;
      });
      select.addEventListener("change", () => {
        row.selected = Number(select.value);
        const picked = row.candidates[row.selected];
        row.saved = picked !== void 0 && isSaved(picked, savedSets(this.plugin.store.getSpots()));
        if (row.saved) {
          row.checked = false;
          row.checkbox.checked = false;
        }
        this.renderCandidate(row);
        this.syncFooter();
      });
    }
  }
  syncFooter() {
    const n = this.rows.filter((r) => r.checked).length;
    this.footerCountEl?.setText(`${n} selected \xB7 adds as want to try`);
    if (this.addBtn) this.addBtn.disabled = n === 0;
  }
  /** Re-check saved badges against the library without re-querying Google. */
  refreshSaved() {
    if (this.adding || this.rows.length === 0) return;
    const sets = savedSets(this.plugin.store.getSpots());
    for (const row of this.rows) {
      const c = row.selected >= 0 ? row.candidates[row.selected] : void 0;
      const saved = c !== void 0 && isSaved(c, sets);
      if (saved === row.saved) continue;
      row.saved = saved;
      if (saved) {
        row.checked = false;
        row.checkbox.checked = false;
      }
      this.renderCandidate(row);
    }
    this.syncFooter();
  }
  // -- add -----------------------------------------------------------------
  bareInput(name) {
    return {
      name,
      cuisines: [],
      country: this.plugin.settings.defaultCountry.trim(),
      status: "want-to-try",
      favorite: false,
      ratingLocked: false,
      source: "manual",
      external: {},
      tags: [],
      visits: [],
      notes: ""
    };
  }
  /** Same mapping the Discover tab uses for its one-click Add. */
  draftToInput(fields, sourceUrl, c) {
    return {
      name: (fields.name ?? c.name).trim(),
      cuisines: fields.cuisines ?? [],
      country: (fields.country ?? this.plugin.settings.defaultCountry).trim(),
      city: fields.city,
      district: fields.district,
      address: fields.address ?? (c.address === "" ? void 0 : c.address),
      coordinates: fields.coordinates ?? c.location,
      status: "want-to-try",
      favorite: false,
      ratingLocked: false,
      price: fields.price ?? c.priceLevel,
      url: fields.url,
      phone: fields.phone,
      source: "google-maps",
      sourceUrl: fields.sourceUrl ?? sourceUrl,
      // Google ratings + place_id come from the details call and must survive.
      external: fields.external ?? {},
      tags: [],
      visits: [],
      notes: ""
    };
  }
  async addSelected() {
    const chosen = this.rows.filter((r) => r.checked);
    if (chosen.length === 0) return;
    const myGen = ++this.gen;
    const signal = { cancelled: false };
    this.adding = true;
    this.renderProgress("Adding spots\u2026", chosen.length, signal);
    const sets = savedSets(this.plugin.store.getSpots());
    let added = 0;
    let bare = 0;
    let skipped = 0;
    let failed = 0;
    for (let i = 0; i < chosen.length; i++) {
      if (myGen !== this.gen) return;
      if (signal.cancelled) break;
      const row = chosen[i];
      this.setProgress(i, chosen.length, row.name);
      const c = row.selected >= 0 ? row.candidates[row.selected] : void 0;
      try {
        if (c === void 0) {
          if (nameTaken(row.name, sets)) {
            skipped++;
            continue;
          }
          const spot2 = await this.plugin.store.createSpot(this.bareInput(row.name));
          if (myGen !== this.gen) return;
          rememberSaved(sets, spot2);
          added++;
          bare++;
          continue;
        }
        if (isSaved(c, sets)) {
          skipped++;
          continue;
        }
        const draft = await this.plugin.importer.placeDetails(c.placeId);
        if (myGen !== this.gen) return;
        const spot = await this.plugin.store.createSpot(
          this.draftToInput(draft.fields, draft.sourceUrl, c)
        );
        if (myGen !== this.gen) return;
        rememberSaved(sets, spot);
        added++;
      } catch {
        failed++;
      }
      if (i < chosen.length - 1 && !signal.cancelled) await sleep3(LOOKUP_THROTTLE_MS);
    }
    if (myGen !== this.gen) return;
    this.adding = false;
    this.finish(signal.cancelled, added, bare, skipped, failed);
  }
  finish(cancelled, added, bare, skipped, failed) {
    const parts = [`added ${added}`];
    if (bare > 0) parts.push(`${bare} without a Google match`);
    if (skipped > 0) parts.push(`${skipped} skipped (already saved)`);
    if (failed > 0) parts.push(`${failed} failed`);
    this.close();
    new import_obsidian19.Notice(
      `${cancelled ? "List import cancelled" : "List import done"} \u2014 ${parts.join(" \xB7 ")}.`,
      1e4
    );
  }
  // -- progress ------------------------------------------------------------
  renderProgress(title, total, signal) {
    const body = this.contentEl;
    body.empty();
    this.footerCountEl = null;
    this.addBtn = null;
    this.rows = [];
    body.createDiv({ cls: "fs-li-progress-title", text: title });
    const track = body.createDiv({ cls: "fs-progress-track" });
    const fill = track.createDiv({ cls: "fs-progress-fill" });
    const meta = body.createDiv({ cls: "fs-enrich-progress-meta" });
    const count = meta.createSpan({ cls: "fs-enrich-count", text: `0 / ${total}` });
    const current = meta.createSpan({ cls: "fs-enrich-current" });
    this.progress = { fill, count, current };
    const buttons = body.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => {
      signal.cancelled = true;
      cancel.disabled = true;
      cancel.setText("Cancelling\u2026");
    });
  }
  setProgress(done, total, current) {
    if (!this.progress) return;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    this.progress.fill.style.width = `${pct}%`;
    this.progress.count.setText(`${done} / ${total}`);
    this.progress.current.setText(current);
  }
};

// src/ui/modals/addChooser.ts
function openAddChooser(plugin) {
  new AddChooserModal(plugin).open();
}
var AddChooserModal = class extends import_obsidian20.Modal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
  }
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-chooser-modal");
    this.titleEl.setText("Add a food spot");
    const list = this.contentEl.createDiv({ cls: "fs-chooser-list" });
    const hasKey = this.plugin.importer.hasGoogleKey();
    this.option(list, {
      icon: "search",
      title: "Search online",
      desc: hasKey ? "Find the restaurant on Google Places and prefill everything." : "Add a Google Places API key in settings to enable online search.",
      disabled: !hasKey,
      onPick: () => openAddModal(this.plugin, void 0, { focusSearch: true })
    });
    this.option(list, {
      icon: "compass",
      title: "Discover restaurants",
      desc: hasKey ? "Browse restaurants near a city or area that aren't in your library yet." : "Add a Google Places API key in settings to enable discovery.",
      disabled: !hasKey,
      onPick: () => void this.plugin.activateView("discover")
    });
    this.option(list, {
      icon: "clipboard-list",
      title: "Paste a list",
      desc: hasKey ? "Paste restaurant names from a chat and look them all up at once." : "Paste restaurant names from a chat and add them as want-to-try spots.",
      onPick: () => openListImportModal(this.plugin)
    });
    this.option(list, {
      icon: "link",
      title: "From URL",
      desc: "Paste a Google Maps, TripAdvisor, or restaurant website link.",
      onPick: () => openImportModal(this.plugin)
    });
    this.option(list, {
      icon: "pencil",
      title: "Manual",
      desc: "Type the details yourself.",
      onPick: () => openAddModal(this.plugin)
    });
  }
  option(parent, opts) {
    const btn = parent.createEl("button", { cls: "fs-chooser-option" });
    btn.type = "button";
    if (opts.disabled) {
      btn.addClass("fs-disabled");
      btn.disabled = true;
    }
    const icon = btn.createSpan({ cls: "fs-chooser-icon" });
    (0, import_obsidian20.setIcon)(icon, opts.icon);
    const text = btn.createDiv({ cls: "fs-chooser-text" });
    text.createDiv({ cls: "fs-chooser-title", text: opts.title });
    text.createDiv({ cls: "fs-chooser-desc", text: opts.desc });
    if (!opts.disabled) {
      btn.addEventListener("click", () => {
        this.close();
        opts.onPick();
      });
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/ui/tabs/spots.ts
var activeController = null;
function applySpotsLocation(_plugin, loc) {
  activeController?.applyLocation(loc);
}
function applySpotsQuery(_plugin, query) {
  activeController?.setQuery(query);
}
function mountSpotsTab(container, plugin) {
  const root = container.createDiv({ cls: "fs-spots" });
  let query = "";
  let viewMode = plugin.settings.spotViewMode;
  let selectMode = false;
  const selected = /* @__PURE__ */ new Set();
  let renderer = null;
  let currentResults = [];
  let emptyEl = null;
  const persist = debounce(() => void plugin.saveSettings(), 600);
  const toolbar = root.createDiv({ cls: "fs-toolbar" });
  const search2 = buildSearchBox(toolbar, {
    placeholder: "Search spots\u2026",
    debounceMs: 250,
    onQuery: (q) => {
      query = q;
      renderResults();
    }
  });
  const tipsBtn = search2.wrapEl.createEl("button", { cls: "fs-search-tips" });
  attachSearchTips(plugin, tipsBtn);
  const filterDrawerHost = root.createDiv({ cls: "fs-filter-drawer-host" });
  const filtersCtl = buildFiltersControl(toolbar, plugin, {
    panelHost: filterDrawerHost,
    getState: () => plugin.settings.filterState,
    setState: (next) => {
      plugin.settings.filterState = next;
      persist();
      renderResults();
    },
    presetContext: () => ({
      query,
      sort: plugin.settings.sort,
      secondarySort: plugin.settings.secondarySort
    }),
    applyPreset: (p) => {
      plugin.settings.filterState = cloneFilters(p.filters);
      plugin.settings.sort = { ...p.sort };
      plugin.settings.secondarySort = p.secondarySort ? { ...p.secondarySort } : void 0;
      query = p.query;
      search2.setValue(p.query);
      sortCtl.sync();
      filtersCtl.sync();
      persist();
      renderResults();
    }
  });
  const sortCtl = buildSortButton(toolbar, {
    get: () => ({ primary: plugin.settings.sort, secondary: plugin.settings.secondarySort }),
    set: (primary, secondary) => {
      plugin.settings.sort = primary;
      plugin.settings.secondarySort = secondary;
      persist();
      renderResults();
    }
  });
  const viewBtn = iconButton(toolbar, {
    icon: viewMode === "cards" ? "table-2" : "layout-grid",
    label: "Toggle cards / table view",
    onClick: () => {
      viewMode = viewMode === "cards" ? "table" : "cards";
      plugin.settings.spotViewMode = viewMode;
      persist();
      setButtonIcon(viewBtn, viewMode === "cards" ? "table-2" : "layout-grid");
      renderer?.destroy();
      renderer = null;
      renderResults();
    }
  });
  const selectBtn = iconButton(toolbar, {
    icon: "copy-check",
    label: "Select spots",
    onClick: () => toggleSelectMode()
  });
  toolbar.createDiv({ cls: "fs-toolbar-spacer" });
  iconButton(toolbar, {
    icon: "link",
    label: "Import from URL",
    text: "Import",
    onClick: () => openImportModal(plugin)
  });
  iconButton(toolbar, {
    icon: "plus",
    label: "Add spot",
    text: "Add",
    cls: "fs-btn-accent",
    onClick: () => openAddChooser(plugin)
  });
  const enrichBar = root.createDiv({ cls: "fs-enrich-bar is-hidden" });
  const bulkBar = root.createDiv({ cls: "fs-bulk-bar is-hidden" });
  const bulkCount = bulkBar.createSpan({ cls: "fs-bulk-count", text: "0 selected" });
  iconButton(bulkBar, {
    icon: "check-check",
    label: "Select all results",
    text: "All",
    onClick: () => {
      for (const s of currentResults) selected.add(s.path);
      syncSelection();
    }
  });
  iconButton(bulkBar, {
    icon: "flag",
    label: "Set status",
    text: "Status",
    onClick: (e) => {
      if (selected.size === 0) return;
      const menu = new import_obsidian21.Menu();
      const statuses = [
        { st: "want-to-try", label: "Want to try" },
        { st: "visited", label: "Visited" }
      ];
      for (const { st, label } of statuses) {
        menu.addItem((i) => i.setTitle(label).onClick(() => void bulkStatus(st)));
      }
      menu.showAtMouseEvent(e);
    }
  });
  iconButton(bulkBar, {
    icon: "tag",
    label: "Add tag",
    text: "Tag",
    onClick: () => {
      if (selected.size === 0) return;
      tagInput.addClass("is-visible");
      tagInput.focus();
    }
  });
  const tagInput = bulkBar.createEl("input", {
    cls: "fs-bulk-tag-input",
    attr: { type: "text", placeholder: "Tag name, Enter to apply" }
  });
  tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const tag = tagInput.value.trim();
      tagInput.value = "";
      tagInput.removeClass("is-visible");
      if (tag) void bulkTag(tag);
    } else if (e.key === "Escape") {
      tagInput.value = "";
      tagInput.removeClass("is-visible");
    }
  });
  iconButton(bulkBar, {
    icon: "trash-2",
    label: "Delete selected",
    text: "Delete",
    cls: "fs-bulk-danger",
    onClick: () => void bulkDelete()
  });
  iconButton(bulkBar, {
    icon: "x",
    label: "Exit select mode",
    text: "Done",
    onClick: () => toggleSelectMode()
  });
  const resultsInfo = root.createDiv({ cls: "fs-results-info" });
  const bodyEl = root.createDiv({ cls: "fs-spots-body" });
  const onBodyClickCapture = (e) => {
    if (!selectMode) return;
    const target = e.target;
    const cell = target.closest(".fs-vcell, .fs-vtable-row");
    if (!cell?.dataset.path) return;
    e.preventDefault();
    e.stopPropagation();
    const path = cell.dataset.path;
    if (selected.has(path)) selected.delete(path);
    else selected.add(path);
    cell.toggleClass("is-selected", selected.has(path));
    syncSelection();
  };
  bodyEl.addEventListener("click", onBodyClickCapture, { capture: true });
  function buildRenderer() {
    if (viewMode === "table") {
      return createEditableTable(bodyEl, plugin, {
        isSelected: (path) => selected.has(path),
        selectMode: () => selectMode
      });
    }
    const grid = createVirtualGrid(bodyEl, {
      minItemWidth: () => cardMinWidth(plugin.settings),
      itemHeight: (colWidth) => Math.round(colWidth * 0.75) + (plugin.settings.cardTextPlacement === "under" ? 64 : 0),
      render: (spot, cell) => {
        cell.dataset.path = spot.path;
        if (selected.has(spot.path)) cell.addClass("is-selected");
        buildSpotCard(cell, spot, { plugin });
      },
      // Cells scrolled out before their photo loaded must leave the shared
      // IntersectionObserver, or the whole card subtree leaks.
      onUnmount: (cell) => releaseLazyPhotos(cell)
    });
    grid.el.style.setProperty("--fs-card-min-width", `${cardMinWidth(plugin.settings)}px`);
    return grid;
  }
  function showEmpty(kind) {
    if (emptyEl) {
      emptyEl.remove();
      emptyEl = null;
    }
    renderer?.el.toggleClass("is-hidden", kind !== null);
    if (!kind) return;
    emptyEl = bodyEl.createDiv({ cls: "fs-empty" });
    const ic = emptyEl.createDiv({ cls: "fs-empty-icon" });
    (0, import_obsidian21.setIcon)(ic, kind === "first-run" ? "utensils" : "search-x");
    if (kind === "first-run") {
      emptyEl.createDiv({ cls: "fs-empty-title", text: "No food spots yet" });
      emptyEl.createDiv({
        cls: "fs-empty-text",
        text: "Save restaurants you want to try and log your visits \u2014 every spot is a note in your vault."
      });
      const actions = emptyEl.createDiv({ cls: "fs-empty-actions" });
      iconButton(actions, {
        icon: "plus",
        label: "Add your first spot",
        text: "Add your first spot",
        cls: "fs-btn-accent",
        onClick: () => openAddChooser(plugin)
      });
      iconButton(actions, {
        icon: "link",
        label: "Import from a URL",
        text: "Import from a URL",
        onClick: () => openImportModal(plugin)
      });
    } else {
      emptyEl.createDiv({ cls: "fs-empty-title", text: "No spots match" });
      emptyEl.createDiv({
        cls: "fs-empty-text",
        text: "Your search or filters exclude every spot in the library."
      });
      const actions = emptyEl.createDiv({ cls: "fs-empty-actions" });
      iconButton(actions, {
        icon: "x",
        label: "Clear search and filters",
        text: "Clear search & filters",
        onClick: () => {
          query = "";
          search2.setValue("");
          plugin.settings.filterState = cloneFilters(EMPTY_FILTER_STATE);
          filtersCtl.sync();
          persist();
          renderResults();
        }
      });
    }
  }
  function renderResults() {
    const all = plugin.store.getSpots();
    currentResults = sortSpots(
      filterSpots(all, query, plugin.settings.filterState),
      plugin.settings.sort,
      plugin.settings.secondarySort
    );
    filtersCtl.sync();
    if (all.length === 0) {
      resultsInfo.setText("");
      renderer?.setItems([]);
      showEmpty("first-run");
      return;
    }
    if (currentResults.length === 0) {
      resultsInfo.setText(`0 of ${all.length} spots`);
      renderer?.setItems([]);
      showEmpty("no-match");
      return;
    }
    showEmpty(null);
    if (!renderer) renderer = buildRenderer();
    renderer.el.removeClass("is-hidden");
    renderer.setItems(currentResults);
    resultsInfo.setText(
      currentResults.length === all.length ? `${all.length} spot${all.length === 1 ? "" : "s"}` : `${currentResults.length} of ${all.length} spots`
    );
  }
  function syncSelection() {
    bulkCount.setText(`${selected.size} selected`);
    bodyEl.querySelectorAll("[data-path]").forEach((el) => {
      const path = el.dataset.path;
      if (path !== void 0) el.toggleClass("is-selected", selectMode && selected.has(path));
    });
  }
  function toggleSelectMode() {
    selectMode = !selectMode;
    selected.clear();
    selectBtn.toggleClass("is-active", selectMode);
    bulkBar.toggleClass("is-hidden", !selectMode);
    root.toggleClass("fs-select-mode", selectMode);
    if (!selectMode) {
      tagInput.value = "";
      tagInput.removeClass("is-visible");
    }
    syncSelection();
  }
  async function bulkStatus(status) {
    const paths = [...selected];
    let n = 0;
    for (const path of paths) {
      try {
        await plugin.store.updateSpot(path, { status });
        n++;
      } catch {
      }
    }
    new import_obsidian21.Notice(`Status set on ${n} spot${n === 1 ? "" : "s"}.`);
  }
  async function bulkTag(tag) {
    let n = 0;
    for (const path of [...selected]) {
      const spot = plugin.store.getByPath(path);
      if (!spot || spot.tags.includes(tag)) continue;
      try {
        await plugin.store.updateSpot(path, { tags: [...spot.tags, tag] });
        n++;
      } catch {
      }
    }
    new import_obsidian21.Notice(`Tag "${tag}" added to ${n} spot${n === 1 ? "" : "s"}.`);
  }
  async function bulkDelete() {
    const n = selected.size;
    if (n === 0) return;
    const ok = await confirmModal(plugin.app, {
      title: `Delete ${n} spot${n === 1 ? "" : "s"}?`,
      body: `${n} note${n === 1 ? " is" : "s are"} moved to the trash and can be restored from there. Logged visits and notes go with them.`,
      cta: "Delete",
      danger: true
    });
    if (!ok) return;
    let deleted = 0;
    for (const path of [...selected]) {
      try {
        await plugin.store.deleteSpot(path);
        deleted++;
      } catch {
      }
    }
    selected.clear();
    syncSelection();
    new import_obsidian21.Notice(`Deleted ${deleted} spot${deleted === 1 ? "" : "s"} \u2014 recoverable from the trash.`);
  }
  const controller = {
    applyLocation(loc) {
      const next = cloneFilters(EMPTY_FILTER_STATE);
      next.excludedCountries = loc.country ? plugin.store.distinct("country").filter((c) => c !== loc.country) : [];
      next.excludedCities = loc.city ? ["", ...plugin.store.distinct("city").filter((c) => c !== loc.city)] : [];
      plugin.settings.filterState = next;
      query = loc.district ? `district:"${loc.district}"` : "";
      search2.setValue(query);
      filtersCtl.sync();
      persist();
      renderResults();
    },
    setQuery(q) {
      plugin.settings.filterState = cloneFilters(EMPTY_FILTER_STATE);
      query = q;
      search2.setValue(q);
      filtersCtl.sync();
      persist();
      renderResults();
    }
  };
  activeController = controller;
  const pathsCarrier = plugin;
  const getFilteredPaths = () => currentResults.map((s) => s.path);
  pathsCarrier.getCurrentFilteredPaths = getFilteredPaths;
  let activeEnrichSignal = null;
  const enrichCarrier = plugin;
  const mountEnrichProgress = (signal) => {
    if (activeEnrichSignal !== null) return null;
    activeEnrichSignal = signal;
    enrichBar.empty();
    enrichBar.removeClass("is-hidden");
    const track = enrichBar.createDiv({ cls: "fs-progress-track" });
    const fill = track.createDiv({ cls: "fs-progress-fill" });
    const meta = enrichBar.createDiv({ cls: "fs-enrich-progress-meta" });
    const count = meta.createSpan({ cls: "fs-enrich-count" });
    const name = meta.createSpan({ cls: "fs-enrich-current" });
    const cancel = enrichBar.createEl("button", { cls: "fs-btn", text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => {
      signal.cancelled = true;
      cancel.disabled = true;
      cancel.setText("Cancelling\u2026");
    });
    return {
      update(done, total, current) {
        const pct = total > 0 ? Math.round(done / total * 100) : 0;
        fill.style.width = `${pct}%`;
        count.setText(`Enriching ${done} / ${total}`);
        name.setText(current);
      },
      finish() {
        if (activeEnrichSignal === signal) activeEnrichSignal = null;
        enrichBar.addClass("is-hidden");
        enrichBar.empty();
      }
    };
  };
  enrichCarrier.mountEnrichProgress = mountEnrichProgress;
  renderResults();
  return {
    refresh: () => renderResults(),
    destroy: () => {
      if (activeController === controller) activeController = null;
      if (pathsCarrier.getCurrentFilteredPaths === getFilteredPaths) {
        delete pathsCarrier.getCurrentFilteredPaths;
      }
      if (enrichCarrier.mountEnrichProgress === mountEnrichProgress) {
        delete enrichCarrier.mountEnrichProgress;
      }
      if (activeEnrichSignal !== null) {
        activeEnrichSignal.cancelled = true;
        activeEnrichSignal = null;
      }
      filtersCtl.destroy();
      renderer?.destroy();
      renderer = null;
      bodyEl.removeEventListener("click", onBodyClickCapture, { capture: true });
      void plugin.saveSettings();
      root.remove();
    }
  };
}

// src/ui/tabs/discover.ts
var import_obsidian23 = require("obsidian");

// src/ui/modals/quickAdd.ts
var import_obsidian22 = require("obsidian");
var QuickAddModal = class extends import_obsidian22.Modal {
  constructor(plugin, spotName, suggestedPrice, resolve) {
    super(plugin.app);
    this.plugin = plugin;
    this.spotName = spotName;
    this.suggestedPrice = suggestedPrice;
    this.resolve = resolve;
    this.status = "want-to-try";
    this.rating = 0;
    this.resolved = false;
    this.price = suggestedPrice;
  }
  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("fs-modal", "fs-quickadd-modal");
    this.titleEl.setText(`Add ${this.spotName}`);
    const statusRow = contentEl.createDiv({ cls: "fs-quickadd-row" });
    statusRow.createSpan({ cls: "fs-field-label", text: "Status" });
    const seg = statusRow.createDiv({ cls: "fs-segmented" });
    const buttons = {};
    const setStatus = (s) => {
      this.status = s;
      for (const [key, btn] of Object.entries(buttons)) {
        btn?.toggleClass("fs-active", key === s);
        if (key === s) {
          btn?.style.setProperty(
            "--fs-seg-active-color",
            s === "visited" ? this.plugin.settings.statusColors.visited : this.plugin.settings.statusColors.wantToTry
          );
        }
      }
      visitBox.toggleClass("is-hidden", s !== "visited");
    };
    for (const [value, label] of [
      ["want-to-try", "Want to try"],
      ["visited", "Been there"]
    ]) {
      const b = seg.createEl("button", { cls: "fs-seg-btn", text: label });
      b.type = "button";
      buttons[value] = b;
      b.addEventListener("click", () => setStatus(value));
    }
    const ratingRow = contentEl.createDiv({ cls: "fs-quickadd-row" });
    ratingRow.createSpan({ cls: "fs-field-label", text: "Your rating" });
    starRating(ratingRow, {
      value: 0,
      halfSteps: this.plugin.settings.halfStarRatings,
      tiers: this.plugin.settings.ratingTiers,
      showLabel: true,
      onChange: (v) => {
        this.rating = v;
        if (v > 0 && this.status !== "visited") setStatus("visited");
      }
    });
    const priceRow = contentEl.createDiv({ cls: "fs-quickadd-row" });
    priceRow.createSpan({ cls: "fs-field-label", text: "Price" });
    const priceSeg = priceRow.createDiv({ cls: "fs-segmented fs-price-seg" });
    const symbol = this.plugin.settings.currencySymbol || "\u20AC";
    const priceBtns = [];
    const paintPrice = () => {
      priceBtns.forEach((b, i) => b.toggleClass("fs-active", this.price === i + 1));
    };
    for (let tier = 1; tier <= 4; tier++) {
      const b = priceSeg.createEl("button", { cls: "fs-seg-btn", text: symbol.repeat(tier) });
      b.type = "button";
      priceBtns.push(b);
      b.addEventListener("click", () => {
        this.price = this.price === tier ? void 0 : tier;
        paintPrice();
      });
    }
    paintPrice();
    if (this.suggestedPrice !== void 0) {
      priceRow.createSpan({ cls: "fs-field-hint", text: " from Google" });
    }
    const visitBox = contentEl.createDiv({ cls: "fs-quickadd-visit is-hidden" });
    const logLabel = visitBox.createEl("label", { cls: "fs-checkbox-label" });
    const logCb = logLabel.createEl("input", { type: "checkbox" });
    logLabel.createSpan({ text: " Log a visit with a date" });
    const visitFields = visitBox.createDiv({ cls: "fs-quickadd-visit-fields is-hidden" });
    logCb.addEventListener("change", () => {
      visitFields.toggleClass("is-hidden", !logCb.checked);
    });
    const visitRow = visitFields.createDiv({ cls: "fs-quickadd-row" });
    const dateInput = visitRow.createEl("input", { type: "date" });
    dateInput.value = todayIso();
    const spentInput = visitRow.createEl("input", {
      type: "number",
      cls: "fs-visit-spent-input",
      attr: { min: "0", step: "0.01", placeholder: symbol }
    });
    const noteInput = visitFields.createEl("input", {
      type: "text",
      cls: "fs-visit-note-input",
      attr: { placeholder: "What did you eat?" }
    });
    const buttonsRow = contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttonsRow.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const save = buttonsRow.createEl("button", { cls: "mod-cta" });
    save.type = "button";
    (0, import_obsidian22.setIcon)(save.createSpan({ cls: "fs-btn-icon" }), "plus");
    save.createSpan({ text: " Add spot" });
    save.addEventListener("click", () => {
      const spentRaw = spentInput.value.trim();
      const spent = spentRaw === "" ? void 0 : Number(spentRaw);
      const result = { status: this.status };
      if (this.rating > 0) result.rating = this.rating;
      if (this.price !== void 0) result.price = this.price;
      if (this.status === "visited" && logCb.checked && dateInput.value) {
        result.visit = {
          date: dateInput.value,
          spent: spent !== void 0 && !Number.isNaN(spent) ? spent : void 0,
          note: noteInput.value.trim()
        };
      }
      this.resolved = true;
      this.resolve(result);
      this.close();
    });
    setStatus("want-to-try");
  }
  onClose() {
    this.contentEl.empty();
    if (!this.resolved) {
      this.resolved = true;
      this.resolve(null);
    }
  }
};
function openQuickAdd(plugin, spotName, suggestedPrice) {
  return new Promise((resolve) => {
    new QuickAddModal(plugin, spotName, suggestedPrice, resolve).open();
  });
}
async function createWithQuickAdd(plugin, input, choice) {
  const enriched = { ...input, status: choice.status };
  if (choice.price !== void 0) enriched.price = choice.price;
  if (choice.rating !== void 0 && choice.visit === void 0) {
    enriched.rating = choice.rating;
    enriched.ratingLocked = true;
  }
  const spot = await plugin.store.createSpot(enriched);
  if (choice.visit) {
    await plugin.store.addVisit(spot.path, {
      date: choice.visit.date,
      rating: choice.rating,
      spent: choice.visit.spent,
      note: choice.visit.note
    });
  }
  new import_obsidian22.Notice(
    `Added ${spot.name} \u2014 ${choice.status === "visited" ? "visited" : "want to try"}${choice.rating ? ` \xB7 ${choice.rating}\u2605` : ""}`
  );
  return spot.path;
}

// src/ui/tabs/discover.ts
var NO_KEY_HINT2 = "Add a Google Places API key in Settings \u2192 Food Spot \u2192 API";
var MAX_KEYWORD_HINT = "thai, vegetarian, sushi\u2026";
function errorMessage7(e) {
  return e instanceof Error ? e.message : String(e);
}
function fmtCount3(n) {
  return n >= 1e3 ? `${(Math.round(n / 100) / 10).toFixed(1)}k` : String(n);
}
function discoverQuery(location, keyword) {
  const kw = keyword.trim();
  return `${kw === "" ? "" : `${kw} `}restaurants in ${location.trim()}`;
}
var state = {
  location: "",
  keyword: "",
  query: "",
  results: [],
  searched: false
};
function resetState() {
  state = { location: "", keyword: "", query: "", results: [], searched: false };
}
var NONE2 = "none";
var photoCache2 = /* @__PURE__ */ new Map();
var inFlight = /* @__PURE__ */ new Set();
var pendingLoaders2 = /* @__PURE__ */ new WeakMap();
var sharedObserver2 = null;
var thumbGen = 0;
function observer2() {
  if (!sharedObserver2) {
    sharedObserver2 = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          sharedObserver2?.unobserve(entry.target);
          const load = pendingLoaders2.get(entry.target);
          pendingLoaders2.delete(entry.target);
          load?.();
        }
      },
      { rootMargin: "200px" }
    );
  }
  return sharedObserver2;
}
function releaseThumbs(root) {
  if (!sharedObserver2) return;
  for (const t of Array.from(root.querySelectorAll("[data-needs-photo]"))) {
    sharedObserver2.unobserve(t);
    pendingLoaders2.delete(t);
  }
}
function disposeThumbs() {
  thumbGen++;
  sharedObserver2?.disconnect();
  sharedObserver2 = null;
  for (const url of photoCache2.values()) {
    if (url !== NONE2) URL.revokeObjectURL(url);
  }
  photoCache2.clear();
  inFlight.clear();
}
function mimeFor(ext) {
  return `image/${ext === "jpg" ? "jpeg" : ext}`;
}
function attachLazyThumb(thumbEl, places, photoRef) {
  const cached = photoCache2.get(photoRef);
  if (cached === NONE2) return;
  if (cached !== void 0) {
    renderThumb(thumbEl, cached);
    return;
  }
  thumbEl.dataset.needsPhoto = "true";
  pendingLoaders2.set(thumbEl, () => {
    void (async () => {
      const gen = thumbGen;
      const known = photoCache2.get(photoRef);
      if (known !== void 0) {
        delete thumbEl.dataset.needsPhoto;
        if (known !== NONE2) renderThumb(thumbEl, known);
        return;
      }
      if (inFlight.has(photoRef)) {
        delete thumbEl.dataset.needsPhoto;
        return;
      }
      inFlight.add(photoRef);
      try {
        const { data, ext } = await places.fetchPlacePhoto(photoRef, 320);
        const url = URL.createObjectURL(new Blob([data], { type: mimeFor(ext) }));
        if (gen !== thumbGen) {
          URL.revokeObjectURL(url);
          return;
        }
        photoCache2.set(photoRef, url);
        renderThumb(thumbEl, url);
      } catch {
        if (gen === thumbGen) photoCache2.set(photoRef, NONE2);
      } finally {
        inFlight.delete(photoRef);
        delete thumbEl.dataset.needsPhoto;
      }
    })();
  });
  observer2().observe(thumbEl);
}
function renderThumb(thumbEl, src) {
  if (thumbEl.querySelector("img")) return;
  const img = thumbEl.createEl("img", { cls: "fs-discover-img" });
  img.setAttribute("alt", "");
  img.setAttribute("width", "96");
  img.setAttribute("height", "96");
  img.decoding = "async";
  img.onload = () => img.addClass("is-loaded");
  img.onerror = () => img.remove();
  img.src = src;
}
function mountDiscoverTab(container, plugin) {
  const root = container.createDiv({ cls: "fs-discover" });
  const places = new PlacesClient(plugin);
  let searchGen = 0;
  let busyGen = null;
  let tileSync = [];
  let loadMoreTimer = null;
  const controls = root.createDiv({ cls: "fs-toolbar fs-discover-controls" });
  const locWrap = controls.createDiv({ cls: "fs-discover-field fs-discover-location-field" });
  const locationInput = locWrap.createEl("input", {
    cls: "fs-discover-input fs-discover-location",
    attr: {
      type: "text",
      placeholder: "City, country or area \u2014 e.g. Rotterdam",
      "aria-label": "Location to search",
      spellcheck: "false",
      enterkeyhint: "search"
    }
  });
  locationInput.value = state.location;
  const kwWrap = controls.createDiv({ cls: "fs-discover-field fs-discover-keyword-field" });
  const keywordInput = kwWrap.createEl("input", {
    cls: "fs-discover-input fs-discover-keyword",
    attr: {
      type: "text",
      placeholder: MAX_KEYWORD_HINT,
      "aria-label": "Keyword or cuisine",
      spellcheck: "false",
      enterkeyhint: "search"
    }
  });
  keywordInput.value = state.keyword;
  const clearButton = (wrap, input, onCleared) => {
    const btn = wrap.createEl("button", {
      cls: "fs-discover-clear",
      attr: { "aria-label": "Clear", tabindex: "-1", title: "Clear" }
    });
    btn.type = "button";
    (0, import_obsidian23.setIcon)(btn, "x");
    const sync = () => btn.toggleClass("is-visible", input.value.length > 0);
    sync();
    input.addEventListener("input", sync);
    btn.addEventListener("click", () => {
      input.value = "";
      sync();
      input.focus();
      onCleared();
    });
    return btn;
  };
  const invalidate = () => {
    searchGen++;
    setStatus("");
  };
  const busy = () => busyGen !== null && busyGen === searchGen;
  const dropResults = () => {
    invalidate();
    state.location = "";
    state.keyword = keywordInput.value.trim();
    state.query = "";
    state.results = [];
    delete state.nextPageToken;
    delete state.error;
    state.searched = false;
    render();
  };
  clearButton(locWrap, locationInput, dropResults);
  locationInput.addEventListener("input", () => {
    if (locationInput.value.trim() === "") dropResults();
    else invalidate();
  });
  clearButton(kwWrap, keywordInput, () => {
    invalidate();
    state.keyword = "";
  });
  keywordInput.addEventListener("input", invalidate);
  const searchBtn = controls.createEl("button", {
    cls: "fs-btn fs-btn-accent",
    attr: { "aria-label": "Search restaurants", title: "Search restaurants" }
  });
  const searchIcon = searchBtn.createSpan({ cls: "fs-btn-icon" });
  (0, import_obsidian23.setIcon)(searchIcon, "search");
  searchBtn.createSpan({ cls: "fs-btn-label", text: "Search" });
  searchBtn.addEventListener("click", () => void runSearch());
  const onEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void runSearch();
    }
  };
  locationInput.addEventListener("keydown", onEnter);
  keywordInput.addEventListener("keydown", onEnter);
  const statusEl = root.createDiv({ cls: "fs-discover-status is-hidden" });
  const bodyEl = root.createDiv({ cls: "fs-discover-body fs-vscroll" });
  function savedSets2() {
    const spots = plugin.store.getSpots();
    const nameCities = /* @__PURE__ */ new Map();
    for (const s of spots) {
      const key = normalizeName(s.name);
      let cities = nameCities.get(key);
      if (!cities) nameCities.set(key, cities = /* @__PURE__ */ new Set());
      cities.add((s.city ?? "").trim().toLowerCase());
    }
    return {
      ids: new Set(
        spots.map((s) => s.external.googlePlaceId).filter((id) => id !== void 0 && id !== "")
      ),
      nameCities
    };
  }
  function isSaved2(c, sets) {
    if (sets.ids.has(c.placeId)) return true;
    const cities = sets.nameCities.get(normalizeName(c.name));
    if (!cities) return false;
    const addr = (c.address ?? "").toLowerCase();
    for (const city of cities) {
      if (city === "" || addr !== "" && addr.includes(city)) return true;
    }
    return false;
  }
  function setStatus(text, isError = false) {
    statusEl.empty();
    statusEl.toggleClass("is-hidden", text === "");
    statusEl.toggleClass("fs-discover-error", isError);
    if (text !== "") statusEl.setText(text);
  }
  async function runSearch() {
    if (busy()) return;
    if (!places.hasKey()) {
      new import_obsidian23.Notice(NO_KEY_HINT2);
      render();
      return;
    }
    const location = locationInput.value.trim();
    if (location === "") {
      new import_obsidian23.Notice("Enter a location to search \u2014 a city, country or area.");
      locationInput.focus();
      return;
    }
    const keyword = keywordInput.value.trim();
    const query = discoverQuery(location, keyword);
    const gen = ++searchGen;
    state.location = location;
    state.keyword = keyword;
    state.query = query;
    busyGen = gen;
    setStatus(`Searching Google for \u201C${query}\u201D\u2026`);
    try {
      const page = await places.textSearchPaged(query);
      if (gen !== searchGen) return;
      state.results = page.candidates;
      state.nextPageToken = page.nextPageToken;
      delete state.error;
      state.searched = true;
    } catch (e) {
      if (gen !== searchGen) return;
      state.results = [];
      delete state.nextPageToken;
      state.error = errorMessage7(e);
      state.searched = true;
    } finally {
      if (busyGen === gen) busyGen = null;
      if (gen === searchGen) setStatus("");
    }
    render();
  }
  async function loadMore(token, btn) {
    if (busy()) return;
    const gen = searchGen;
    busyGen = gen;
    btn.disabled = true;
    btn.setText("Loading\u2026");
    try {
      const page = await places.textSearchNextPage(token);
      if (gen !== searchGen) return;
      const seen = new Set(state.results.map((c) => c.placeId));
      state.results = [
        ...state.results,
        ...page.candidates.filter((c) => !seen.has(c.placeId))
      ];
      state.nextPageToken = page.nextPageToken;
      delete state.error;
    } catch (e) {
      if (gen !== searchGen) return;
      state.error = errorMessage7(e);
      delete state.nextPageToken;
    } finally {
      if (busyGen === gen) busyGen = null;
    }
    render();
  }
  function draftToInput2(fields, sourceUrl, c) {
    return {
      name: (fields.name ?? c.name).trim(),
      cuisines: fields.cuisines ?? [],
      country: (fields.country ?? plugin.settings.defaultCountry).trim(),
      city: fields.city,
      district: fields.district,
      address: fields.address ?? (c.address === "" ? void 0 : c.address),
      coordinates: fields.coordinates ?? c.location,
      status: "want-to-try",
      favorite: false,
      ratingLocked: false,
      price: fields.price ?? c.priceLevel,
      url: fields.url,
      phone: fields.phone,
      source: "google-maps",
      sourceUrl: fields.sourceUrl ?? sourceUrl,
      // Google ratings + place_id come from the details call and must survive.
      external: fields.external ?? {},
      tags: [],
      visits: [],
      notes: ""
    };
  }
  async function addCandidate(c, btn, markSaved, withOptions = false) {
    let choice = null;
    if (withOptions) {
      choice = await openQuickAdd(plugin, c.name, c.priceLevel || void 0);
      if (!choice) return;
    }
    btn.disabled = true;
    const label = btn.getText();
    btn.setText("Adding\u2026");
    try {
      const draft = await plugin.importer.placeDetails(c.placeId);
      const input = draftToInput2(draft.fields, draft.sourceUrl, c);
      if (choice) {
        await createWithQuickAdd(plugin, input, choice);
      } else {
        const spot = await plugin.store.createSpot(input);
        new import_obsidian23.Notice(`Added ${spot.name} \u2014 want to try`);
      }
      markSaved();
    } catch (e) {
      btn.disabled = false;
      btn.setText(label);
      new import_obsidian23.Notice(`Couldn't add ${c.name} \u2014 ${errorMessage7(e)}`);
    }
  }
  function emptyState(icon, title, text, action) {
    const empty = bodyEl.createDiv({ cls: "fs-empty" });
    const ic = empty.createDiv({ cls: "fs-empty-icon" });
    (0, import_obsidian23.setIcon)(ic, icon);
    empty.createDiv({ cls: "fs-empty-title", text: title });
    empty.createDiv({ cls: "fs-empty-text", text });
    if (action) {
      const actions = empty.createDiv({ cls: "fs-empty-actions" });
      const btn = actions.createEl("button", { cls: "fs-btn", text: action.label });
      btn.type = "button";
      btn.addEventListener("click", action.onClick);
    }
  }
  function buildTile(c, saved) {
    const tile = bodyEl.createDiv({ cls: "fs-result-tile fs-discover-tile" });
    const thumb = tile.createDiv({ cls: "fs-discover-thumb" });
    thumb.createSpan({
      cls: "fs-discover-letter",
      text: (c.name[0] ?? "?").toUpperCase()
    });
    if (c.photoRef !== void 0) attachLazyThumb(thumb, places, c.photoRef);
    const main = tile.createDiv({ cls: "fs-result-main" });
    const nameRow = main.createDiv({ cls: "fs-result-name" });
    nameRow.createSpan({ text: c.name });
    if (c.address !== "") main.createDiv({ cls: "fs-result-address", text: c.address });
    const meta = main.createDiv({ cls: "fs-result-meta fs-discover-meta" });
    if (c.rating !== void 0) {
      const g = meta.createSpan({ cls: "fs-discover-rating" });
      g.createSpan({ cls: "fs-meta-g", text: "G" });
      g.createSpan({
        text: ` ${c.rating.toFixed(1)}${c.ratingCount ? ` (${fmtCount3(c.ratingCount)})` : ""}`
      });
    }
    if (c.priceLevel !== void 0 && c.priceLevel > 0) {
      meta.createSpan({
        cls: "fs-discover-price",
        text: plugin.settings.currencySymbol.repeat(Math.min(4, c.priceLevel))
      });
    }
    const actions = tile.createDiv({ cls: "fs-discover-actions" });
    const sync = (isSavedNow) => {
      actions.empty();
      tile.toggleClass("fs-in-library", isSavedNow);
      if (isSavedNow) {
        actions.createSpan({ cls: "fs-badge-saved", text: "\u2713 Saved" });
        return;
      }
      const add = actions.createEl("button", {
        cls: "fs-btn fs-btn-accent fs-discover-add",
        attr: { "aria-label": `Add ${c.name} to want to try` }
      });
      add.type = "button";
      const ic = add.createSpan({ cls: "fs-btn-icon" });
      (0, import_obsidian23.setIcon)(ic, "plus");
      add.createSpan({ cls: "fs-btn-label", text: "Add" });
      add.addEventListener("click", () => void addCandidate(c, add, () => sync(true)));
      const opts = actions.createEl("button", {
        cls: "fs-btn fs-discover-add-opts",
        attr: {
          "aria-label": `Add ${c.name} with rating and price`,
          title: "Add with status, rating and price"
        }
      });
      opts.type = "button";
      (0, import_obsidian23.setIcon)(opts.createSpan({ cls: "fs-btn-icon" }), "sliders-horizontal");
      opts.addEventListener("click", () => void addCandidate(c, opts, () => sync(true), true));
    };
    sync(saved);
    tileSync.push({ placeId: c.placeId, name: c.name, address: c.address, sync });
  }
  function buildLoadMore(token) {
    const wrap = bodyEl.createDiv({ cls: "fs-discover-more" });
    const btn = wrap.createEl("button", { cls: "fs-btn", text: "Load more\u2026" });
    btn.type = "button";
    btn.disabled = true;
    if (loadMoreTimer !== null) window.clearTimeout(loadMoreTimer);
    loadMoreTimer = window.setTimeout(() => {
      loadMoreTimer = null;
      btn.disabled = false;
      btn.setText("Load more");
    }, NEXT_PAGE_DELAY_MS);
    btn.addEventListener("click", () => void loadMore(token, btn));
  }
  function render() {
    releaseThumbs(bodyEl);
    bodyEl.empty();
    tileSync = [];
    if (!places.hasKey()) {
      emptyState(
        "key-round",
        "Google Places key required",
        "Discover searches Google for restaurants you haven't saved yet. It needs an API key.",
        { label: "How do I add a key?", onClick: () => new import_obsidian23.Notice(NO_KEY_HINT2) }
      );
      return;
    }
    if (state.error !== void 0) {
      emptyState("alert-triangle", "Search failed", state.error, {
        label: "Try again",
        onClick: () => void runSearch()
      });
      return;
    }
    if (!state.searched) {
      emptyState(
        "compass",
        "Search restaurants anywhere",
        "Try \u201Cthai in Rotterdam\u201D \u2014 put the city in the first box and the cuisine in the second."
      );
      return;
    }
    if (state.results.length === 0) {
      emptyState(
        "search-x",
        "No restaurants found",
        `Google returned nothing for \u201C${state.query}\u201D. Try a broader area or drop the keyword.`
      );
      return;
    }
    const sets = savedSets2();
    for (const c of state.results) buildTile(c, isSaved2(c, sets));
    if (state.nextPageToken !== void 0) buildLoadMore(state.nextPageToken);
  }
  render();
  return {
    /** Re-check Saved badges against the library without re-querying Google. */
    refresh: () => {
      if (bodyEl.querySelector(".fs-discover-tile") === null) {
        render();
        return;
      }
      const sets = savedSets2();
      for (const t of tileSync) t.sync(isSaved2(t, sets));
    },
    destroy: () => {
      searchGen++;
      busyGen = null;
      if (loadMoreTimer !== null) window.clearTimeout(loadMoreTimer);
      loadMoreTimer = null;
      releaseThumbs(bodyEl);
      tileSync = [];
      disposeThumbs();
      resetState();
      root.remove();
    }
  };
}

// src/ui/tabs/places.ts
var import_obsidian27 = require("obsidian");

// src/ui/modals/cityGuide.ts
var import_obsidian26 = require("obsidian");

// src/tools/cityGuide.ts
var OTHER_GROUP = "Other";
var NOTE_MAX = 160;
function sameCity(spot, city) {
  return (spot.city ?? "").trim().toLowerCase() === city.trim().toLowerCase();
}
function starsFor(rating) {
  const full = Math.floor(rating);
  return "\u2605".repeat(full) + (rating - full >= 0.5 ? "\xBD" : "");
}
function firstNoteLine(notes) {
  const line = notes.split("\n").map((l) => l.trim()).find((l) => l !== "");
  if (line === void 0) return "";
  const flat = line.replace(/\s+/g, " ");
  return flat.length > NOTE_MAX ? `${flat.slice(0, NOTE_MAX - 1).trimEnd()}\u2026` : flat;
}
function escapeLinkText(name) {
  return name.replace(/([[\]])/g, "\\$1");
}
function groupOf(spot) {
  const first = spot.cuisines.find((c) => c.trim() !== "");
  return first === void 0 ? OTHER_GROUP : first.trim();
}
function compareSpots(a, b) {
  const visited = Number(b.status === "visited") - Number(a.status === "visited");
  if (visited !== 0) return visited;
  const ra = a.rating ?? -1;
  const rb = b.rating ?? -1;
  if (ra !== rb) return rb - ra;
  return a.name.localeCompare(b.name);
}
function summaryLine(spots) {
  const visited = spots.filter((s) => s.status === "visited").length;
  const counts = /* @__PURE__ */ new Map();
  for (const spot of spots) {
    for (const cuisine of spot.cuisines) {
      const key = cuisine.trim();
      if (key === "") continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3).map(([name]) => name);
  const parts = [
    `${spots.length} spot${spots.length === 1 ? "" : "s"}`,
    `${visited} visited`
  ];
  if (top.length > 0) parts.push(`mostly ${top.join(", ")}`);
  return parts.join(" \xB7 ");
}
function entryLine(spot, opts) {
  const name = escapeLinkText(spot.name);
  const head = spot.url !== void 0 && spot.url !== "" ? `**[${name}](${spot.url})**` : `**${name}**`;
  const bits = [];
  if (spot.price !== void 0 && spot.price > 0) {
    bits.push(opts.currency.repeat(Math.min(4, spot.price)));
  }
  if (spot.rating !== void 0) bits.push(starsFor(spot.rating));
  const google = spot.external.googleRating;
  if (google !== void 0) bits.push(`Google ${google.toFixed(1)}`);
  if (spot.district !== void 0 && spot.district.trim() !== "") {
    bits.push(spot.district.trim());
  }
  const note = firstNoteLine(spot.notes);
  const meta = bits.length > 0 ? ` \u2014 ${bits.join(" \xB7 ")}` : "";
  return `- ${head}${meta}${note === "" ? "" : ` \u2014 ${note}`}`;
}
function buildCityGuide(spots, city, opts) {
  const title = city.trim() === "" ? "Eating out" : `Eating in ${city.trim()}`;
  const selected = spots.filter(
    (s) => sameCity(s, city) && (opts.includeWantToTry || s.status === "visited")
  );
  const footer = `Generated by Food Spot on ${todayIso()}`;
  if (selected.length === 0) {
    const what = opts.includeWantToTry ? "spots" : "visited spots";
    return [`# ${title}`, "", `No ${what} here yet.`, "", footer, ""].join("\n");
  }
  const groups = /* @__PURE__ */ new Map();
  for (const spot of selected) {
    const key = groupOf(spot);
    const bucket = groups.get(key);
    if (bucket) bucket.push(spot);
    else groups.set(key, [spot]);
  }
  const ordered = [...groups.entries()].sort((a, b) => {
    if (a[0] === OTHER_GROUP !== (b[0] === OTHER_GROUP)) {
      return a[0] === OTHER_GROUP ? 1 : -1;
    }
    return b[1].length - a[1].length || a[0].localeCompare(b[0]);
  });
  const lines = [`# ${title}`, "", summaryLine(selected), ""];
  for (const [cuisine, members] of ordered) {
    lines.push(`## ${cuisine}`, "");
    for (const spot of [...members].sort(compareSpots)) {
      lines.push(entryLine(spot, opts));
    }
    lines.push("");
  }
  lines.push(footer, "");
  return lines.join("\n");
}

// src/tools/guideHtml.ts
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function stars(rating) {
  if (rating === void 0) return "";
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.75;
  const extra = rating - full >= 0.75 ? 1 : 0;
  const filled = "\u2605".repeat(Math.min(5, full + extra));
  const halfChar = half ? "\u2BE8" : "";
  const empty = "\u2606".repeat(Math.max(0, 5 - full - extra - (half ? 1 : 0)));
  return `${filled}${halfChar}${empty}`;
}
var SAFE_SCHEME = /^(?:https?|mailto|tel):/i;
function safeHref(url) {
  const trimmed2 = url.trim();
  return SAFE_SCHEME.test(trimmed2) ? trimmed2 : null;
}
function hostOf2(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}
function card(spot, o) {
  const img = spot.photo ? o.images.get(spot.photo) : void 0;
  const cover = img ? `<img class="cover" src="${img}" alt="">` : `<div class="cover cover-placeholder">${esc((spot.name.trim()[0] ?? "?").toUpperCase())}</div>`;
  const rows = [];
  const rating = spot.rating !== void 0 ? `<span class="stars">${stars(spot.rating)}</span><span class="ratingnum">${spot.rating.toFixed(1)}</span>` : "";
  const google = spot.external.googleRating !== void 0 ? `<span class="google">G ${spot.external.googleRating.toFixed(1)}</span>` : "";
  if (rating || google) rows.push(`<div class="ratings">${rating}${google}</div>`);
  if (spot.price !== void 0 && spot.price > 0) {
    rows.push(`<div class="price">${esc(o.currency.repeat(Math.min(4, spot.price)))}</div>`);
  }
  if (spot.address) rows.push(`<div class="line addr">${esc(spot.address)}</div>`);
  const addrLower = (spot.address ?? "").toLowerCase();
  const place = [spot.city, spot.country].filter((part) => !!part && !addrLower.includes(part.toLowerCase())).join(", ");
  if (place) rows.push(`<div class="line place">${esc(place)}</div>`);
  if (spot.phone) rows.push(`<div class="line phone">${esc(spot.phone)}</div>`);
  if (spot.url) {
    const href = safeHref(spot.url);
    rows.push(
      href !== null ? `<div class="line web"><a href="${esc(href)}">${esc(hostOf2(href))}</a></div>` : `<div class="line web">${esc(spot.url.trim())}</div>`
    );
  }
  const visited = spot.status === "visited" ? ' <span class="badge">visited</span>' : "";
  return `<article class="card">
  ${cover}
  <div class="body">
    <h2>${esc(spot.name)}${visited}</h2>
    ${rows.join("\n    ")}
  </div>
</article>`;
}
var CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 12mm 11mm 14mm;
    width: 210mm;
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1d1f24; background: #fff;
  }
  header { border-bottom: 2px solid #1d1f24; padding-bottom: 10px; margin-bottom: 18px; }
  h1 { margin: 0; font-size: 27px; letter-spacing: -0.4px; }
  .sub { margin-top: 5px; color: #6b7080; font-size: 12.5px; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .card {
    display: flex; gap: 10px; align-items: stretch; min-width: 0;
    border: 1px solid #dfe2e8; border-radius: 10px; padding: 10px;
    break-inside: avoid; page-break-inside: avoid;
  }
  .cover {
    width: 92px; height: 92px; flex: none;
    object-fit: cover; border-radius: 7px; background: #eef0f4;
  }
  .cover-placeholder {
    display: flex; align-items: center; justify-content: center;
    font-size: 34px; font-weight: 700; color: #b6bcc8;
  }
  .body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  h2 { margin: 0 0 2px; font-size: 15px; line-height: 1.2; }
  .badge {
    font-size: 9px; text-transform: uppercase; letter-spacing: .5px;
    vertical-align: middle; padding: 1px 5px; border-radius: 8px;
    background: #e8f3ec; color: #2f7d4f; font-weight: 600;
  }
  .ratings { display: flex; align-items: baseline; gap: 7px; margin: 1px 0 2px; }
  .stars { color: #e2a33c; font-size: 13px; letter-spacing: 1px; }
  .ratingnum { font-weight: 700; font-size: 12px; }
  .google { color: #6b7080; font-size: 11.5px; }
  .price { font-weight: 700; font-size: 12px; color: #2f7d4f; }
  .line { font-size: 11.5px; color: #4a4f5a; line-height: 1.35; overflow-wrap: anywhere; }
  .line.phone, .line.web { color: #2b5fa8; }
  a { color: inherit; text-decoration: none; }
  footer { margin-top: 20px; color: #8a90a0; font-size: 10.5px; text-align: center; }
  /* printToPDF renders with zero hardware margins; the page padding above is
     the margin, so the layout width matches A4 exactly and nothing overflows. */
  @page { size: A4; margin: 0; }
  @media print {
    .card { border-color: #c9ccd6; }
  }
`;
function buildGuideHtml(spots, city, o) {
  const inCity = spots.filter((s) => (s.city ?? "").trim().toLowerCase() === city.trim().toLowerCase()).filter((s) => o.includeWantToTry || s.status === "visited").sort(
    (a, b) => Number(b.status === "visited") - Number(a.status === "visited") || (b.rating ?? 0) - (a.rating ?? 0) || (b.external.googleRating ?? 0) - (a.external.googleRating ?? 0) || a.name.localeCompare(b.name)
  );
  const visited = inCity.filter((s) => s.status === "visited").length;
  const summary = `${inCity.length} ${inCity.length === 1 ? "place" : "places"}${visited > 0 ? ` \xB7 ${visited} visited` : ""}`;
  const body = inCity.length > 0 ? `<div class="grid">
${inCity.map((s) => card(s, o)).join("\n")}
</div>` : `<p class="sub">No restaurants for this city yet.</p>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Eating in ${esc(city)}</title>
<style>${CSS}</style>
</head><body>
<header>
  <h1>Eating in ${esc(city)}</h1>
  <div class="sub">${esc(summary)}</div>
</header>
${body}
<footer>Food Spot \xB7 ${esc(o.generatedOn)}</footer>
</body></html>`;
}
function guidePhotoPaths(spots, city, includeWantToTry) {
  return spots.filter((s) => (s.city ?? "").trim().toLowerCase() === city.trim().toLowerCase()).filter((s) => includeWantToTry || s.status === "visited").map((s) => s.photo).filter((p) => !!p && !/^https?:\/\//i.test(p));
}

// src/store/backup.ts
var import_obsidian24 = require("obsidian");
var BACKUP_VERSION = 2;
function base64FromBuffer(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 32768;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}
function bufferFromBase64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
function errMsg2(e) {
  return e instanceof Error ? e.message : String(e);
}
function isVaultPath(ref) {
  return ref !== void 0 && ref !== "" && !/^https?:\/\//i.test(ref);
}
function mediaRefsOf(spot) {
  const refs = [
    spot.photo,
    spot.menu,
    // Strip the `|alias` suffix an embed may carry: an unstripped ref resolves
    // to nothing and the dish photo would be left out of a "full" backup.
    ...(spot.visits ?? []).flatMap((v) => (v.photos ?? []).map(embedRefPath))
  ];
  return refs.filter(isVaultPath).map((r) => r.trim()).filter((r) => r !== "");
}
function resolveRef(app, ref, sourcePath) {
  const linked = app.metadataCache.getFirstLinkpathDest(ref, sourcePath);
  if (linked) return linked;
  const direct = app.vault.getAbstractFileByPath((0, import_obsidian24.normalizePath)(ref));
  return direct instanceof import_obsidian24.TFile ? direct : null;
}
async function buildBackupJson(plugin) {
  const spots = plugin.store.getSpots();
  const media = {};
  const notes = [];
  const warnings = [];
  for (const spot of spots) {
    const refs = {};
    for (const ref of mediaRefsOf(spot)) {
      if (refs[ref] !== void 0) continue;
      const file2 = resolveRef(plugin.app, ref, spot.path);
      if (!file2) {
        warnings.push(`${spot.name}: "${ref}" is not in the vault \u2014 not embedded.`);
        continue;
      }
      refs[ref] = file2.path;
      if (media[file2.path] !== void 0) continue;
      try {
        media[file2.path] = base64FromBuffer(await plugin.app.vault.readBinary(file2));
      } catch (e) {
        warnings.push(`${spot.name}: "${file2.path}" could not be read (${errMsg2(e)}).`);
      }
    }
    let markdown = "";
    const file = plugin.store.fileFor(spot.path);
    if (!file) {
      warnings.push(`${spot.name}: note "${spot.path}" is gone \u2014 only its indexed record was saved.`);
    } else {
      try {
        markdown = await plugin.app.vault.read(file);
      } catch (e) {
        warnings.push(
          `${spot.name}: note text could not be read (${errMsg2(e)}) \u2014 only its indexed record was saved.`
        );
      }
    }
    notes.push({ path: spot.path, markdown, refs });
  }
  const payload = {
    format: "foodspot-backup",
    version: BACKUP_VERSION,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    spots,
    notes,
    media,
    warnings
  };
  const name = `Food Spot backup ${todayIso()}.json`;
  if (warnings.length > 0) {
    const head = warnings.slice(0, 3).join(" ");
    new import_obsidian24.Notice(
      `Backup is INCOMPLETE \u2014 ${warnings.length} item${warnings.length === 1 ? "" : "s"} could not be included. ${head}${warnings.length > 3 ? " \u2026" : ""}`,
      15e3
    );
  }
  return { json: JSON.stringify(payload), suggestedName: name, warnings };
}
function freeVaultPath(app, folder, fileName) {
  const dot = fileName.lastIndexOf(".");
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot > 0 ? fileName.slice(dot) : "";
  const prefix = folder ? `${(0, import_obsidian24.normalizePath)(folder)}/` : "";
  let candidate = `${prefix}${base}${ext}`;
  let n = 2;
  while (app.vault.getAbstractFileByPath(candidate)) {
    candidate = `${prefix}${base} ${n}${ext}`;
    n += 1;
  }
  return candidate;
}
async function saveIntoVault(target, defaultName, content) {
  try {
    const folder = (0, import_obsidian24.normalizePath)(target.folder);
    await ensureFolder(target.app, folder);
    const path = freeVaultPath(target.app, folder, defaultName);
    await target.app.vault.create(path, content);
    new import_obsidian24.Notice(`Saved to ${path} \u2014 open it from Files to share or move it.`, 1e4);
    return true;
  } catch (e) {
    new import_obsidian24.Notice(`Couldn't save inside the vault: ${errMsg2(e)}`);
    return false;
  }
}
async function saveToDisk(defaultName, content, target) {
  const dialog = window.electron?.remote?.dialog;
  const nodeRequire = globalThis.require;
  if (!dialog || !nodeRequire) {
    if (target) return saveIntoVault(target, defaultName, content);
    new import_obsidian24.Notice("Saving outside the vault is only available on desktop.");
    return false;
  }
  const res = await dialog.showSaveDialog({ defaultPath: defaultName });
  if (res.canceled || res.filePath === void 0) return false;
  nodeRequire("fs").writeFileSync(res.filePath, content, "utf8");
  new import_obsidian24.Notice(`Saved to ${res.filePath}`);
  return true;
}
function vaultSegments(raw) {
  const segments = raw.replace(/\\/g, "/").split("/").map((s) => s.trim()).filter((s) => s !== "" && s !== ".");
  if (segments.some((s) => s === "..")) return null;
  return segments.length > 0 ? segments : null;
}
function mediaTarget(mediaFolder, key) {
  const segments = vaultSegments(key);
  if (segments === null) return null;
  const folder = vaultSegments(mediaFolder) ?? [];
  const inside = folder.length > 0 && segments.length > folder.length && folder.every((seg, i) => segments[i] === seg);
  const relative = inside ? segments.slice(folder.length) : [segments[segments.length - 1]];
  return (0, import_obsidian24.normalizePath)([...folder, ...relative].join("/"));
}
function sameBytes(a, b) {
  if (a.byteLength !== b.byteLength) return false;
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
  return true;
}
function availableBinaryPath(app, target) {
  const slash = target.lastIndexOf("/");
  const dot = target.lastIndexOf(".");
  const hasExt = dot > slash + 1;
  const base = hasExt ? target.slice(0, dot) : target;
  const ext = hasExt ? target.slice(dot) : "";
  let n = 2;
  let candidate = `${base} ${n}${ext}`;
  while (app.vault.getAbstractFileByPath(candidate)) {
    n += 1;
    candidate = `${base} ${n}${ext}`;
  }
  return candidate;
}
async function ensureParentFolder(app, target) {
  const dir = target.split("/").slice(0, -1).join("/");
  if (dir && app.vault.getFolderByPath(dir) === null) await ensureFolder(app, dir);
}
async function writeMedia(app, target, data) {
  const existing = app.vault.getFileByPath(target);
  if (existing) {
    if (sameBytes(await app.vault.readBinary(existing), data)) {
      return { path: existing.path, created: false };
    }
    const alt = availableBinaryPath(app, target);
    await ensureParentFolder(app, alt);
    await app.vault.createBinary(alt, data);
    return { path: alt, created: true };
  }
  await ensureParentFolder(app, target);
  await app.vault.createBinary(target, data);
  return { path: target, created: true };
}
var FM_BLOCK = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;
function remapReferences(markdown, remap) {
  if (remap.size === 0) return markdown;
  const linked = markdown.replace(
    /(!?\[\[)([^\]\n|#^]+)/g,
    (whole, open, target) => {
      const next = remap.get(target.trim());
      return next === void 0 ? whole : `${open}${next}`;
    }
  );
  const fm = FM_BLOCK.exec(linked);
  if (!fm) return linked;
  const rewritten = fm[0].replace(
    /^(photo|menu):[ \t]*(.+)$/gm,
    (whole, key, value) => {
      const raw = value.trim().replace(/^["']|["']$/g, "").trim();
      const next = remap.get(raw);
      return next === void 0 ? whole : `${key}: ${next}`;
    }
  );
  return rewritten + linked.slice(fm[0].length);
}
function remapVisits(visits, remap) {
  if (remap.size === 0) return visits;
  return visits.map((v) => {
    if (!v.photos || v.photos.length === 0) return v;
    return { ...v, photos: v.photos.map((p) => remap.get(p.trim()) ?? p) };
  });
}
async function importBackup(plugin, json, onProgress, signal) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Not valid JSON.");
  }
  if (parsed.format !== "foodspot-backup" || !Array.isArray(parsed.spots)) {
    throw new Error("Not a Food Spot backup file.");
  }
  const summary = { created: 0, skipped: 0, mediaWritten: 0, errors: [] };
  for (const w of Array.isArray(parsed.warnings) ? parsed.warnings : []) {
    summary.errors.push(`backup was already incomplete \u2014 ${w}`);
  }
  const noteEntries = Array.isArray(parsed.notes) ? parsed.notes : [];
  const notesByPath = /* @__PURE__ */ new Map();
  for (const entry of noteEntries) {
    if (entry && typeof entry.path === "string") notesByPath.set(entry.path, entry);
  }
  const referenced = /* @__PURE__ */ new Set();
  for (const spot of parsed.spots) {
    for (const ref of mediaRefsOf(spot)) referenced.add((0, import_obsidian24.normalizePath)(ref));
  }
  for (const entry of noteEntries) {
    for (const [ref, path] of Object.entries(entry?.refs ?? {})) {
      referenced.add((0, import_obsidian24.normalizePath)(ref));
      if (typeof path === "string") referenced.add((0, import_obsidian24.normalizePath)(path));
    }
  }
  const mediaEntries = Object.entries(parsed.media ?? {});
  const total = mediaEntries.length + parsed.spots.length;
  let done = 0;
  const written = /* @__PURE__ */ new Map();
  for (const [key, b64] of mediaEntries) {
    if (signal?.cancelled) return summary;
    onProgress?.(done++, total, key.split("/").pop() ?? key);
    if (!referenced.has((0, import_obsidian24.normalizePath)(key))) {
      summary.errors.push(`media ${key}: no spot in this backup references it \u2014 not restored.`);
      continue;
    }
    const target = mediaTarget(plugin.settings.mediaFolder, key);
    if (target === null) {
      summary.errors.push(`media ${key}: not a usable vault path \u2014 not restored.`);
      continue;
    }
    try {
      const result = await writeMedia(plugin.app, target, bufferFromBase64(b64));
      written.set(key, result.path);
      if (result.created) summary.mediaWritten++;
    } catch (e) {
      summary.errors.push(`media ${key}: ${errMsg2(e)}`);
    }
  }
  const existingKeys = new Set(
    plugin.store.getSpots().map((s) => `${normalizeName(s.name)}|${(s.city ?? "").toLowerCase()}`)
  );
  for (const spot of parsed.spots) {
    if (signal?.cancelled) return summary;
    onProgress?.(done++, total, spot.name ?? "\u2026");
    const key = `${normalizeName(spot.name ?? "")}|${(spot.city ?? "").toLowerCase()}`;
    if (spot.name === void 0 || existingKeys.has(key)) {
      summary.skipped++;
      continue;
    }
    try {
      const entry = notesByPath.get(spot.path);
      const remap = /* @__PURE__ */ new Map();
      if (entry) {
        for (const [ref, original] of Object.entries(entry.refs ?? {})) {
          const actual = written.get(original);
          if (actual !== void 0 && actual !== (0, import_obsidian24.normalizePath)(original)) remap.set(ref, actual);
        }
      } else {
        for (const ref of mediaRefsOf(spot)) {
          const actual = written.get(ref);
          if (actual !== void 0 && actual !== (0, import_obsidian24.normalizePath)(ref)) remap.set(ref, actual);
        }
      }
      if (entry && entry.markdown.trim() !== "") {
        const folder = spotFolder(plugin.settings, spot.country ?? "");
        await ensureFolder(plugin.app, folder);
        const path = availablePath(plugin.app, folder, spotFileName(spot.name, spot.city));
        await plugin.app.vault.create(path, remapReferences(entry.markdown, remap));
      } else {
        const input = {
          name: spot.name,
          cuisines: spot.cuisines ?? [],
          country: spot.country ?? "",
          city: spot.city,
          district: spot.district,
          address: spot.address,
          coordinates: spot.coordinates,
          status: spot.status === "visited" ? "visited" : "want-to-try",
          favorite: spot.favorite === true,
          rating: spot.rating,
          ratingLocked: spot.ratingLocked === true,
          price: spot.price,
          url: spot.url,
          phone: spot.phone,
          source: spot.source ?? "manual",
          sourceUrl: spot.sourceUrl,
          external: spot.external ?? {},
          photo: spot.photo === void 0 ? void 0 : remap.get(spot.photo.trim()) ?? spot.photo,
          menu: spot.menu === void 0 ? void 0 : remap.get(spot.menu.trim()) ?? spot.menu,
          hours: spot.hours,
          tags: spot.tags ?? [],
          visits: remapVisits(spot.visits ?? [], remap),
          legacyId: spot.legacyId,
          notes: spot.notes ?? "",
          created: spot.created
        };
        await plugin.store.createSpot(input);
      }
      existingKeys.add(key);
      summary.created++;
    } catch (e) {
      summary.errors.push(`${spot.name}: ${errMsg2(e)}`);
    }
  }
  new import_obsidian24.Notice(
    `Restore: ${summary.created} spots created, ${summary.skipped} already existed, ${summary.mediaWritten} media files written${summary.errors.length ? `, ${summary.errors.length} problems (see below)` : ""}.`
  );
  if (summary.errors.length > 0) {
    new import_obsidian24.Notice(
      `Restore problems: ${summary.errors.slice(0, 3).join(" ")}${summary.errors.length > 3 ? " \u2026" : ""}`,
      15e3
    );
  }
  return summary;
}

// src/tools/pdfExport.ts
var import_obsidian25 = require("obsidian");
function errorText(e) {
  return e instanceof Error ? e.message : String(e);
}
function electron() {
  const req = globalThis.require;
  if (typeof req !== "function") return null;
  try {
    const el = req("electron");
    const fs = req("fs");
    const os = req("os");
    const path = req("path");
    const dialog = el.remote?.dialog;
    if (!dialog || !fs || !os) return null;
    return {
      showSaveDialog: (o) => dialog.showSaveDialog(o),
      writeFile: (p, d) => fs.writeFileSync(p, d),
      tmpFile: (name, content) => {
        const p = path.join(os.tmpdir(), name);
        fs.writeFileSync(p, content);
        return p;
      },
      removeFile: (p) => fs.unlinkSync(p),
      openPath: el.remote?.shell ? (p) => el.remote?.shell?.openPath(p) : void 0
    };
  } catch {
    return null;
  }
}
async function exportHtmlToPdf(html, suggestedName) {
  const bits = electron();
  if (!bits) {
    new import_obsidian25.Notice("Direct PDF export needs the desktop app \u2014 opening the print dialog instead.");
    return "failed";
  }
  let res;
  try {
    res = await bits.showSaveDialog({
      defaultPath: suggestedName,
      filters: [{ name: "PDF", extensions: ["pdf"] }]
    });
  } catch (e) {
    new import_obsidian25.Notice(`Couldn't open the save dialog \u2014 ${errorText(e)}`);
    return "failed";
  }
  if (res.canceled || !res.filePath) return "cancelled";
  const target = res.filePath;
  let tmpPath;
  try {
    tmpPath = bits.tmpFile(`foodspot-guide-${Date.now()}.html`, html);
  } catch (e) {
    new import_obsidian25.Notice(`Couldn't prepare the guide for printing \u2014 ${errorText(e)}`);
    return "failed";
  }
  const view = document.createElement("webview");
  view.setAttribute("nodeintegration", "false");
  view.style.cssText = // 794x1123 = A4 at 96dpi, so CSS layout == printed page.
  "position:fixed;left:-10000px;top:0;width:794px;height:1123px;opacity:0;pointer-events:none;";
  view.src = `file://${tmpPath}`;
  return new Promise((resolve) => {
    let settled = false;
    let timeoutId = 0;
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      view.remove();
      try {
        bits.removeFile(tmpPath);
      } catch (e) {
        new import_obsidian25.Notice(
          `Couldn't remove the temporary guide file \u2014 delete ${tmpPath} yourself (${errorText(e)}).`,
          1e4
        );
      }
    };
    const fail = (msg) => {
      if (settled) return;
      settled = true;
      cleanup();
      new import_obsidian25.Notice(msg);
      resolve("failed");
    };
    const onReady = () => {
      window.setTimeout(() => {
        void (async () => {
          try {
            const data = await view.printToPDF({
              pageSize: "A4",
              printBackground: true,
              // Margins live in the document's own page padding.
              margins: { marginType: "none" }
            });
            bits.writeFile(target, data);
            settled = true;
            cleanup();
            new import_obsidian25.Notice(`PDF saved to ${target}`);
            bits.openPath?.(target);
            resolve("saved");
          } catch (e) {
            fail(`Couldn't write the PDF \u2014 ${errorText(e)}`);
          }
        })();
      }, 350);
    };
    view.addEventListener("did-finish-load", onReady, { once: true });
    view.addEventListener(
      "did-fail-load",
      () => fail("The guide couldn't be rendered for PDF export."),
      { once: true }
    );
    timeoutId = window.setTimeout(() => fail("PDF export timed out."), 2e4);
    document.body.appendChild(view);
  });
}

// src/ui/modals/cityGuide.ts
function openCityGuideModal(plugin, city) {
  new CityGuideModal(plugin, city).open();
}
function errorMessage8(e) {
  return e instanceof Error ? e.message : String(e);
}
function cityOptions(spots) {
  const counts = /* @__PURE__ */ new Map();
  for (const spot of spots) {
    const city = (spot.city ?? "").trim();
    if (city === "") continue;
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }
  return [...counts.entries()].map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
}
var MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif"
};
function sanitizeFileName3(name) {
  return name.replace(/[\\/:*?"<>|#^[\]]/g, " ").replace(/\s+/g, " ").trim();
}
var CityGuideModal = class extends import_obsidian26.Modal {
  constructor(plugin, preselect) {
    super(plugin.app);
    this.plugin = plugin;
    this.preselect = preselect;
    this.city = "";
    this.includeWantToTry = true;
    this.html = "";
    this.images = /* @__PURE__ */ new Map();
    this.cities = [];
  }
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-city-guide-modal");
    this.titleEl.setText("Create a city guide");
    const body = this.contentEl;
    this.cities = cityOptions(this.plugin.store.getSpots());
    if (this.cities.length === 0) {
      body.createDiv({
        cls: "fs-empty-state",
        text: "No spots with a city yet \u2014 add a city to a spot and the guide can be built from it."
      });
      const buttons2 = body.createDiv({ cls: "fs-modal-buttons" });
      const close = buttons2.createEl("button", { text: "Close" });
      close.type = "button";
      close.addEventListener("click", () => this.close());
      return;
    }
    this.city = this.preselect && this.cities.some((c) => c.city === this.preselect) ? this.preselect : this.cities[0].city;
    const controls = body.createDiv({ cls: "fs-guide-controls" });
    const cityField = controls.createDiv({ cls: "fs-field" });
    cityField.createEl("label", { cls: "fs-field-label", text: "City" });
    const select = cityField.createEl("select", { cls: "dropdown fs-guide-city" });
    select.setAttribute("aria-label", "City to write a guide for");
    for (const { city, count } of this.cities) {
      const opt = select.createEl("option", { text: `${city} (${count})` });
      opt.value = city;
      if (city === this.city) opt.selected = true;
    }
    select.addEventListener("change", () => {
      this.city = select.value;
      this.renderPreview();
    });
    const wantLabel = controls.createEl("label", { cls: "fs-guide-check" });
    const wantBox = wantLabel.createEl("input", { type: "checkbox" });
    wantBox.checked = this.includeWantToTry;
    wantLabel.createSpan({ text: "Include want-to-try spots" });
    wantBox.addEventListener("change", () => {
      this.includeWantToTry = wantBox.checked;
      this.renderPreview();
    });
    this.previewEl = body.createEl("iframe", { cls: "fs-guide-preview" });
    this.previewEl.setAttribute("sandbox", "allow-same-origin allow-modals");
    const buttons = body.createDiv({ cls: "fs-modal-buttons fs-guide-buttons" });
    const pdf = buttons.createEl("button", { cls: "mod-cta", text: "Save as PDF\u2026" });
    pdf.type = "button";
    pdf.addEventListener("click", () => {
      pdf.disabled = true;
      pdf.setText("Saving\u2026");
      void exportHtmlToPdf(this.html, `${sanitizeFileName3(this.noteTitle())}.pdf`).then((outcome) => {
        if (outcome === "failed") this.print();
      }).catch((e) => {
        new import_obsidian26.Notice(`PDF export failed \u2014 ${errorMessage8(e)}. Use "Save HTML\u2026" instead.`);
      }).finally(() => {
        pdf.disabled = false;
        pdf.setText("Save as PDF\u2026");
      });
    });
    const htmlBtn = buttons.createEl("button", { text: "Save HTML\u2026" });
    htmlBtn.type = "button";
    htmlBtn.addEventListener("click", () => {
      void saveToDisk(`${sanitizeFileName3(this.noteTitle())}.html`, this.html);
    });
    const copy = buttons.createEl("button", { text: "Copy markdown" });
    copy.type = "button";
    copy.addEventListener("click", () => {
      void navigator.clipboard.writeText(this.markdown()).then(() => new import_obsidian26.Notice(`Guide for ${this.city} copied.`)).catch((e) => new import_obsidian26.Notice(`Couldn't copy \u2014 ${errorMessage8(e)}`));
    });
    const save = buttons.createEl("button", { text: "Save as note" });
    save.type = "button";
    save.addEventListener("click", () => void this.saveAsNote());
    this.renderPreview();
  }
  noteTitle() {
    return `Eating in ${this.city}`;
  }
  markdown() {
    return buildCityGuide(this.plugin.store.getSpots(), this.city, {
      includeWantToTry: this.includeWantToTry,
      currency: this.plugin.settings.currencySymbol
    });
  }
  /** Vault images -> data URIs so the exported document is standalone. */
  async loadImages(paths) {
    for (const p of paths) {
      if (this.images.has(p)) continue;
      const file = this.plugin.app.metadataCache.getFirstLinkpathDest(p, "") ?? this.plugin.app.vault.getAbstractFileByPath(p);
      if (!(file instanceof import_obsidian26.TFile)) continue;
      try {
        const bytes = new Uint8Array(await this.plugin.app.vault.readBinary(file));
        let bin = "";
        const CHUNK = 32768;
        for (let i = 0; i < bytes.length; i += CHUNK) {
          bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
        }
        const mime = MIME[file.extension.toLowerCase()] ?? "image/jpeg";
        this.images.set(p, `data:${mime};base64,${btoa(bin)}`);
      } catch {
      }
    }
  }
  renderPreview() {
    void (async () => {
      const spots = this.plugin.store.getSpots();
      await this.loadImages(guidePhotoPaths(spots, this.city, this.includeWantToTry));
      this.html = buildGuideHtml(spots, this.city, {
        includeWantToTry: this.includeWantToTry,
        currency: this.plugin.settings.currencySymbol || "\u20AC",
        images: this.images,
        generatedOn: (/* @__PURE__ */ new Date()).toLocaleDateString()
      });
      this.previewEl.srcdoc = this.html;
    })();
  }
  /** Print the preview: the OS dialog offers "Save as PDF". */
  print() {
    const win = this.previewEl.contentWindow;
    if (!win) {
      new import_obsidian26.Notice("Preview isn't ready yet \u2014 try again in a second.");
      return;
    }
    try {
      win.focus();
      win.print();
    } catch (e) {
      new import_obsidian26.Notice(`Couldn't open the print dialog \u2014 ${errorMessage8(e)}. Use "Save HTML\u2026" instead.`);
    }
  }
  async saveAsNote() {
    const folder = `${this.plugin.settings.spotsFolder}/Guides`;
    const markdown = this.markdown();
    try {
      await ensureFolder(this.plugin.app, folder);
      const path = availablePath(
        this.plugin.app,
        folder,
        `${sanitizeFileName3(this.noteTitle())}.md`
      );
      const file = await this.plugin.app.vault.create(path, markdown);
      this.close();
      new import_obsidian26.Notice(`Guide saved to ${path}`);
      if (file instanceof import_obsidian26.TFile) {
        await this.plugin.app.workspace.getLeaf("tab").openFile(file);
      }
    } catch (e) {
      new import_obsidian26.Notice(`Couldn't save the guide \u2014 ${errorMessage8(e)}`);
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/ui/tabs/places.ts
function mountPlacesTab(container, plugin) {
  const root = container.createDiv({ cls: "fs-places" });
  const expanded = /* @__PURE__ */ new Set();
  let expansionSeeded = false;
  const bump = (node, spot) => {
    node.total++;
    if (spot.status === "visited") node.visited++;
  };
  const child = (parent, key, label, loc) => {
    let node = parent.get(key);
    if (!node) {
      node = { key, label, loc, total: 0, visited: 0, children: /* @__PURE__ */ new Map() };
      parent.set(key, node);
    }
    return node;
  };
  function buildTree() {
    const countries = /* @__PURE__ */ new Map();
    for (const spot of plugin.store.getSpots()) {
      const country = spot.country?.trim() || "Unknown";
      const city = spot.city?.trim() || "";
      const district = spot.district?.trim() || "";
      const cNode = child(countries, `c:${country}`, country, { country });
      bump(cNode, spot);
      let parent = cNode;
      if (city) {
        const cityNode = child(cNode.children, `c:${country}|t:${city}`, city, {
          country,
          city
        });
        bump(cityNode, spot);
        parent = cityNode;
      }
      if (district) {
        const dNode = child(
          parent.children,
          `${parent.key}|d:${district}`,
          district,
          { country, city: city || void 0, district }
        );
        bump(dNode, spot);
      }
    }
    return sortNodes([...countries.values()]);
  }
  function sortNodes(nodes) {
    return nodes.sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }
  function openInSpots(loc) {
    const leaf = plugin.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    const view = leaf?.view;
    view?.applyLocationFilter?.(loc);
  }
  function renderNode(parent, node, depth) {
    const row = parent.createDiv({ cls: "fs-place-row" });
    row.style.setProperty("--fs-depth", String(depth));
    const hasChildren = node.children.size > 0;
    if (hasChildren && expanded.has(node.key)) row.addClass("is-expanded");
    const chevron = row.createEl("button", {
      cls: "fs-place-chevron",
      attr: { "aria-label": expanded.has(node.key) ? "Collapse" : "Expand" }
    });
    if (hasChildren) {
      (0, import_obsidian27.setIcon)(chevron, "chevron-right");
      chevron.addEventListener("click", (e) => {
        e.stopPropagation();
        if (expanded.has(node.key)) expanded.delete(node.key);
        else expanded.add(node.key);
        render();
      });
    } else {
      chevron.addClass("is-leaf");
      chevron.tabIndex = -1;
    }
    const label = row.createEl("button", {
      cls: "fs-place-label",
      attr: { "aria-label": `Show spots in ${node.label}` }
    });
    label.createSpan({ cls: "fs-place-name", text: node.label });
    label.createSpan({ cls: "fs-place-count", text: String(node.total) });
    const coverage = label.createDiv({
      cls: "fs-coverage",
      attr: { title: `${node.visited}/${node.total} visited` }
    });
    const pct = node.total > 0 ? Math.round(node.visited / node.total * 100) : 0;
    coverage.createDiv({ cls: "fs-coverage-fill" }).style.width = `${pct}%`;
    label.addEventListener("click", () => openInSpots(node.loc));
    if (node.loc.city !== void 0 && node.loc.district === void 0) {
      const guide = row.createEl("button", {
        cls: "fs-place-guide",
        attr: {
          "aria-label": `Create a guide for ${node.label}`,
          title: `Create a shareable guide for ${node.label}`
        }
      });
      (0, import_obsidian27.setIcon)(guide, "notebook-text");
      guide.addEventListener("click", (e) => {
        e.stopPropagation();
        openCityGuideModal(plugin, node.loc.city);
      });
    }
    if (hasChildren && expanded.has(node.key)) {
      for (const c of sortNodes([...node.children.values()])) {
        renderNode(parent, c, depth + 1);
      }
    }
  }
  function render() {
    root.empty();
    const tree = buildTree();
    if (tree.length === 0) {
      const empty = root.createDiv({ cls: "fs-empty" });
      const ic = empty.createDiv({ cls: "fs-empty-icon" });
      (0, import_obsidian27.setIcon)(ic, "map-pin");
      empty.createDiv({ cls: "fs-empty-title", text: "No places yet" });
      empty.createDiv({
        cls: "fs-empty-text",
        text: "Spots you add appear here, grouped by country, city and district."
      });
      return;
    }
    if (!expansionSeeded) {
      expansionSeeded = true;
      if (tree.length <= 8) for (const n of tree) expanded.add(n.key);
    }
    const list = root.createDiv({ cls: "fs-place-tree" });
    for (const node of tree) renderNode(list, node, 0);
  }
  render();
  return {
    refresh: () => render(),
    destroy: () => root.remove()
  };
}

// src/ui/tabs/map.ts
var import_leaflet = __toESM(require_leaflet_src());
var import_obsidian28 = require("obsidian");
var OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
var OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
function safeColor(c) {
  return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : "var(--interactive-accent)";
}
function fmtCount4(n) {
  return n >= 1e3 ? `${(Math.round(n / 100) / 10).toFixed(1)}k` : String(n);
}
function mountMapTab(container, plugin) {
  const root = container.createDiv({ cls: "fs-map" });
  let scopeCountry = "";
  let scopeCity = "";
  const hiddenStatuses = /* @__PURE__ */ new Set();
  let favoritesOnly = false;
  let didInitialFit = false;
  let countryOptionsKey = "";
  let cityOptionsKey = "";
  const mappedSpots = () => plugin.store.getSpots().filter((s) => !!s.coordinates);
  const inScope = (spot) => (!scopeCountry || spot.country.trim() === scopeCountry) && (!scopeCity || (spot.city ?? "").trim() === scopeCity);
  const passesFilters2 = (spot) => {
    if (hiddenStatuses.has(spot.status)) return false;
    if (favoritesOnly && !spot.favorite) return false;
    return true;
  };
  const openEnrich = () => {
    const carrier = plugin;
    if (carrier.openEnrichModal) {
      carrier.openEnrichModal({ scope: "missing-coords" });
    } else {
      new import_obsidian28.Notice(
        'Run the "Enrich all spots from Google" command to fill in missing coordinates.'
      );
    }
  };
  const toolbar = root.createDiv({ cls: "fs-toolbar fs-map-toolbar" });
  const countrySel = toolbar.createEl("select", {
    cls: "dropdown fs-map-scope",
    attr: { "aria-label": "Map scope: country" }
  });
  const citySel = toolbar.createEl("select", {
    cls: "dropdown fs-map-scope",
    attr: { "aria-label": "Map scope: city" }
  });
  countrySel.addEventListener("change", () => {
    scopeCountry = countrySel.value;
    scopeCity = "";
    syncScopeOptions();
    fitScope();
  });
  citySel.addEventListener("change", () => {
    scopeCity = citySel.value;
    fitScope();
  });
  const chips = toolbar.createDiv({ cls: "fs-map-chips" });
  const chipDots = [];
  const chip = (label, color, initialOn, toggle) => {
    const btn = chips.createEl("button", {
      cls: "fs-filter-chip fs-map-chip" + (initialOn ? " is-on" : ""),
      attr: {
        "aria-label": `Toggle ${label}`,
        "aria-pressed": String(initialOn)
      }
    });
    const dot = btn.createSpan({ cls: "fs-map-chip-dot" });
    chipDots.push({ el: dot, color });
    btn.createSpan({ text: label });
    btn.addEventListener("click", () => {
      const nowOn = !btn.hasClass("is-on");
      btn.toggleClass("is-on", nowOn);
      btn.setAttribute("aria-pressed", String(nowOn));
      toggle(nowOn);
      syncMarkers();
    });
  };
  chip("Want to try", () => plugin.settings.statusColors.wantToTry, true, (on) => {
    if (on) hiddenStatuses.delete("want-to-try");
    else hiddenStatuses.add("want-to-try");
  });
  chip("Visited", () => plugin.settings.statusColors.visited, true, (on) => {
    if (on) hiddenStatuses.delete("visited");
    else hiddenStatuses.add("visited");
  });
  chip("Favorites", () => plugin.settings.statusColors.favorite, false, (on) => {
    favoritesOnly = on;
  });
  toolbar.createDiv({ cls: "fs-toolbar-spacer" });
  const unmapped = toolbar.createDiv({ cls: "fs-map-unmapped is-hidden" });
  const body = root.createDiv({ cls: "fs-map-body" });
  const canvas = body.createDiv({ cls: "fs-map-canvas" });
  const emptyEl = body.createDiv({ cls: "fs-map-empty is-hidden" });
  const map = import_leaflet.default.map(canvas, { worldCopyJump: true });
  import_leaflet.default.tileLayer(OSM_URL, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
  map.setView([24, 8], 2);
  const markers = /* @__PURE__ */ new Map();
  function pinIcon(spot) {
    const sc = plugin.settings.statusColors;
    const color = safeColor(spot.status === "visited" ? sc.visited : sc.wantToTry);
    const ring = safeColor(sc.favorite);
    const cls = spot.favorite ? "fs-map-pin is-fav" : "fs-map-pin";
    return import_leaflet.default.divIcon({
      className: "fs-map-pin-wrap",
      html: `<div class="${cls}" style="--fs-status: ${color}; --fs-fav: ${ring};"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      popupAnchor: [0, -10]
    });
  }
  function buildPopup(path) {
    const el = createDiv({ cls: "fs-map-popup" });
    const spot = plugin.store.getByPath(path);
    if (!spot) return el;
    el.createDiv({ cls: "fs-map-popup-name", text: spot.name });
    const place = [spot.city, spot.country].filter(Boolean).join(", ");
    if (place) el.createDiv({ cls: "fs-map-popup-place", text: place });
    const parts = [];
    if (spot.rating !== void 0) parts.push(`\u2605 ${fmtRating(spot.rating)}`);
    const g = spot.external.googleRating;
    if (g !== void 0) {
      const count = spot.external.googleRatingCount;
      parts.push(`G ${fmtRating(g)}${count ? ` (${fmtCount4(count)})` : ""}`);
    }
    if (parts.length > 0) {
      el.createDiv({ cls: "fs-map-popup-rating", text: parts.join(" \xB7 ") });
    }
    const open = el.createEl("button", { cls: "fs-btn fs-map-popup-open", text: "Open" });
    open.addEventListener("click", () => {
      map.closePopup();
      openDetailModal(plugin, path);
    });
    return el;
  }
  function positions(spots) {
    const buckets = /* @__PURE__ */ new Map();
    for (const s of spots) {
      const key = `${s.coordinates.lat.toFixed(5)},${s.coordinates.lng.toFixed(5)}`;
      const group = buckets.get(key);
      if (group) group.push(s);
      else buckets.set(key, [s]);
    }
    const out = /* @__PURE__ */ new Map();
    for (const group of buckets.values()) {
      group.sort((a, b) => a.path.localeCompare(b.path));
      group.forEach((s, i) => {
        if (i === 0) {
          out.set(s.path, [s.coordinates.lat, s.coordinates.lng]);
          return;
        }
        const angle = 2 * Math.PI * i / group.length;
        const r = 18e-5;
        out.set(s.path, [
          s.coordinates.lat + r * Math.cos(angle),
          s.coordinates.lng + r * Math.sin(angle)
        ]);
      });
    }
    return out;
  }
  function syncMarkers() {
    const mapped = mappedSpots();
    const visible = mapped.filter(passesFilters2);
    const pos = positions(visible);
    const sc = plugin.settings.statusColors;
    const seen = /* @__PURE__ */ new Set();
    for (const spot of visible) {
      const at = pos.get(spot.path);
      if (!at) continue;
      seen.add(spot.path);
      const sig = [
        at[0],
        at[1],
        spot.status,
        spot.favorite ? 1 : 0,
        sc.wantToTry,
        sc.visited,
        sc.favorite,
        spot.name
      ].join("|");
      const existing = markers.get(spot.path);
      if (existing && existing.sig === sig) continue;
      existing?.marker.remove();
      const marker = import_leaflet.default.marker(at, { icon: pinIcon(spot), title: spot.name });
      marker.bindPopup(() => buildPopup(spot.path));
      marker.addTo(map);
      markers.set(spot.path, { marker, sig });
    }
    for (const [path, entry] of markers) {
      if (!seen.has(path)) {
        entry.marker.remove();
        markers.delete(path);
      }
    }
    syncEmptyState(mapped.length, visible.length);
  }
  function syncEmptyState(mappedCount, visibleCount) {
    const show = visibleCount === 0;
    emptyEl.toggleClass("is-hidden", !show);
    if (!show) return;
    emptyEl.empty();
    const total = plugin.store.getSpots().length;
    const box = emptyEl.createDiv({ cls: "fs-empty" });
    const ic = box.createDiv({ cls: "fs-empty-icon" });
    (0, import_obsidian28.setIcon)(ic, "map");
    if (mappedCount > 0) {
      box.createDiv({ cls: "fs-empty-title", text: "All spots filtered out" });
      box.createDiv({
        cls: "fs-empty-text",
        text: `Your filters hide all ${mappedCount} mapped spot${mappedCount === 1 ? "" : "s"}. Turn a status chip back on${favoritesOnly ? " or switch Favorites off" : ""} to see them.`
      });
      return;
    }
    if (total === 0) {
      box.createDiv({ cls: "fs-empty-title", text: "No spots yet" });
      box.createDiv({
        cls: "fs-empty-text",
        text: "Add a spot and it will show up on the map once it has coordinates."
      });
    } else {
      box.createDiv({ cls: "fs-empty-title", text: "No coordinates yet" });
      box.createDiv({
        cls: "fs-empty-text",
        text: total === 1 ? "Your spot has no coordinates. Enrich from Google to place it on the map." : `None of your ${total} spots have coordinates. Enrich from Google to place them on the map.`
      });
      const actions = box.createDiv({ cls: "fs-empty-actions" });
      const btn = actions.createEl("button", {
        cls: "fs-btn fs-btn-accent",
        text: "Enrich from Google"
      });
      btn.addEventListener("click", openEnrich);
    }
  }
  function syncScopeOptions() {
    const spots = plugin.store.getSpots();
    const countries = [...new Set(spots.map((s) => s.country.trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b)
    );
    if (scopeCountry && !countries.includes(scopeCountry)) {
      scopeCountry = "";
      scopeCity = "";
    }
    const cities = [
      ...new Set(
        spots.filter((s) => !scopeCountry || s.country.trim() === scopeCountry).map((s) => (s.city ?? "").trim()).filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b));
    if (scopeCity && !cities.includes(scopeCity)) scopeCity = "";
    const cKey = countries.join("\0");
    if (cKey !== countryOptionsKey) {
      countryOptionsKey = cKey;
      countrySel.empty();
      countrySel.createEl("option", { text: "World", value: "" });
      for (const c of countries) countrySel.createEl("option", { text: c, value: c });
    }
    countrySel.value = scopeCountry;
    const tKey = `${scopeCountry}\0${cities.join("\0")}`;
    if (tKey !== cityOptionsKey) {
      cityOptionsKey = tKey;
      citySel.empty();
      citySel.createEl("option", { text: "All cities", value: "" });
      for (const c of cities) citySel.createEl("option", { text: c, value: c });
    }
    citySel.value = scopeCity;
  }
  function fitScope() {
    const match = mappedSpots().filter(inScope);
    if (match.length === 0) {
      if (scopeCountry || scopeCity) {
        const label = scopeCity || scopeCountry;
        new import_obsidian28.Notice(`No spots in ${label} have coordinates yet.`);
      }
      return;
    }
    const bounds = import_leaflet.default.latLngBounds(
      match.map((s) => [s.coordinates.lat, s.coordinates.lng])
    );
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }
  function syncUnmapped() {
    const count = plugin.store.getSpots().filter((s) => !s.coordinates).length;
    unmapped.empty();
    unmapped.toggleClass("is-hidden", count === 0);
    if (count === 0) return;
    unmapped.createSpan({
      cls: "fs-map-unmapped-text",
      text: `${count} ${count === 1 ? "spot has" : "spots have"} no coordinates`
    });
    iconButton(unmapped, {
      icon: "sparkles",
      label: "Enrich spots missing coordinates from Google",
      text: "Enrich from Google",
      onClick: openEnrich
    });
  }
  function refresh() {
    for (const { el, color } of chipDots) {
      el.style.setProperty("--fs-status", safeColor(color()));
    }
    syncScopeOptions();
    syncUnmapped();
    syncMarkers();
    map.invalidateSize();
    if (!didInitialFit && markers.size > 0) {
      didInitialFit = true;
      fitScope();
    }
  }
  const resizeObserver = new ResizeObserver(() => map.invalidateSize());
  resizeObserver.observe(body);
  refresh();
  window.requestAnimationFrame(() => map.invalidateSize());
  return {
    refresh,
    destroy: () => {
      resizeObserver.disconnect();
      map.remove();
      markers.clear();
      root.remove();
    }
  };
}

// src/ui/tabs/visits.ts
var import_obsidian29 = require("obsidian");
var DAY_ROW_HEIGHT = 44;
var VISIT_ROW_HEIGHT = 76;
function fmtDate(iso, format2) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  switch (format2) {
    case "american":
      return `${m}/${d}/${y}`;
    case "iso":
      return iso;
    default:
      return `${d}-${m}-${y}`;
  }
}
function mountVisitsTab(container, plugin) {
  const root = container.createDiv({ cls: "fs-visits" });
  const header = root.createDiv({ cls: "fs-visits-header" });
  header.createDiv({ cls: "fs-visits-title", text: "Visit timeline" });
  const countEl = header.createSpan({ cls: "fs-visits-count" });
  iconButton(header, {
    icon: "images",
    label: "Browse dish photos",
    cls: "fs-visits-gallery",
    onClick: () => openGalleryModal(plugin)
  });
  iconButton(header, {
    icon: "calendar-plus",
    label: "Log visit",
    text: "Log visit",
    cls: "fs-btn-accent fs-visits-log",
    onClick: () => openLogVisitPicker(plugin)
  });
  let emptyEl = null;
  const list = createVirtualList(root, {
    itemHeight: (item) => item.kind === "day" ? DAY_ROW_HEIGHT : VISIT_ROW_HEIGHT,
    render: (item, rowEl) => {
      if (item.kind === "day") {
        rowEl.addClass("fs-tl-day");
        rowEl.createSpan({
          cls: "fs-tl-day-date",
          text: fmtDate(item.date, plugin.settings.dateFormat)
        });
        rowEl.createSpan({ cls: "fs-tl-day-ago", text: relTime(item.date) });
        if (item.count > 1) {
          rowEl.createSpan({
            cls: "fs-tl-day-count",
            text: `${item.count} visits`
          });
        }
        return;
      }
      const { spot, visit } = item;
      rowEl.addClass("fs-tl-row");
      const rail = rowEl.createDiv({ cls: "fs-tl-rail" });
      const dot = rail.createDiv({ cls: "fs-tl-dot" });
      if (visit.rating !== void 0) {
        const tier = tierFor(visit.rating, plugin.settings.ratingTiers);
        if (tier) dot.style.setProperty("--fs-tier", tier.color);
        dot.addClass("has-rating");
      }
      const body = rowEl.createDiv({ cls: "fs-tl-body" });
      const top = body.createDiv({ cls: "fs-tl-top" });
      const name = top.createEl("button", {
        cls: "fs-tl-name",
        text: spot.name,
        attr: { "aria-label": `Open ${spot.name}` }
      });
      name.addEventListener("click", (e) => {
        e.stopPropagation();
        openDetailModal(plugin, spot.path);
      });
      if (visit.rating !== void 0) {
        const stars2 = top.createSpan({ cls: "fs-tl-stars" });
        const star = stars2.createSpan({ cls: "fs-star-icon" });
        (0, import_obsidian29.setIcon)(star, "star");
        stars2.createSpan({ text: fmtRating(visit.rating) });
        const tier = tierFor(visit.rating, plugin.settings.ratingTiers);
        if (tier) stars2.style.setProperty("--fs-tier", tier.color);
      }
      if (visit.spent !== void 0) {
        top.createSpan({
          cls: "fs-tl-spent",
          text: `${plugin.settings.currencySymbol}${visit.spent}`
        });
      }
      if (visit.note) {
        body.createDiv({ cls: "fs-tl-note", text: visit.note });
      }
      renderDishThumbs(body, plugin, visit.photos ?? [], spot.path);
    }
  });
  function collect2() {
    const entries = [];
    for (const spot of plugin.store.getSpots()) {
      for (const visit of spot.visits) {
        if (visit.date) entries.push({ spot, visit });
      }
    }
    entries.sort(
      (a, b) => b.visit.date.localeCompare(a.visit.date) || a.spot.name.localeCompare(b.spot.name)
    );
    const items = [];
    let day = null;
    for (const e of entries) {
      if (!day || day.date !== e.visit.date) {
        day = { kind: "day", date: e.visit.date, count: 0 };
        items.push(day);
      }
      day.count++;
      items.push({ kind: "visit", spot: e.spot, visit: e.visit });
    }
    return { items, total: entries.length };
  }
  function render() {
    const { items, total } = collect2();
    countEl.setText(total > 0 ? `${total} visit${total === 1 ? "" : "s"}` : "");
    if (emptyEl) {
      emptyEl.remove();
      emptyEl = null;
    }
    list.el.toggleClass("is-hidden", total === 0);
    if (total === 0) {
      list.setItems([]);
      emptyEl = root.createDiv({ cls: "fs-empty" });
      const ic = emptyEl.createDiv({ cls: "fs-empty-icon" });
      (0, import_obsidian29.setIcon)(ic, "history");
      emptyEl.createDiv({ cls: "fs-empty-title", text: "No visits logged yet" });
      emptyEl.createDiv({
        cls: "fs-empty-text",
        text: "Log a visit and it lands on this timeline \u2014 with your rating, what you spent and what you ate."
      });
      const actions = emptyEl.createDiv({ cls: "fs-empty-actions" });
      iconButton(actions, {
        icon: "calendar-plus",
        label: "Log your first visit",
        text: "Log your first visit",
        cls: "fs-btn-accent",
        onClick: () => openLogVisitPicker(plugin)
      });
      return;
    }
    list.setItems(items);
  }
  render();
  return {
    refresh: () => render(),
    destroy: () => {
      list.destroy();
      root.remove();
    }
  };
}

// src/ui/tabs/dashboard.ts
var import_obsidian30 = require("obsidian");
var RING_R = 45;
var RING_C = 2 * Math.PI * RING_R;
function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}
function daysSince(iso) {
  if (!iso) return Infinity;
  const d = daysSinceCalendar(iso);
  return Number.isNaN(d) ? Infinity : d;
}
function agoText(iso) {
  const d = daysSince(iso);
  if (!Number.isFinite(d)) return "never";
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  if (d < 365) return `${Math.floor(d / 30)} mo ago`;
  const y = Math.floor(d / 365);
  return `${y} ${y === 1 ? "year" : "years"} ago`;
}
function coverageBy(spots, keys) {
  const m = /* @__PURE__ */ new Map();
  for (const s of spots) {
    for (const k of keys(s)) {
      const key = (k ?? "").trim();
      if (!key) continue;
      const cur = m.get(key) ?? { visited: 0, total: 0 };
      cur.total++;
      if (s.status === "visited") cur.visited++;
      m.set(key, cur);
    }
  }
  return [...m.entries()].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}
function spentOf(v) {
  const n = v.spent;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return void 0;
  return n;
}
function mountDashboardTab(container, plugin) {
  const root = container.createDiv({ cls: "fs-dashboard" });
  let statsOpen = false;
  let suggestionCity = "";
  let suggestionPath;
  let gradSeq = 0;
  const ringCard = (parent, o) => {
    const card2 = parent.createDiv({ cls: "fs-stat-card" });
    const wrap = card2.createDiv({ cls: "fs-ring-wrap" });
    const svg = wrap.createSvg("svg", {
      cls: "fs-ring",
      attr: { viewBox: "0 0 120 120", width: 120, height: 120 }
    });
    const gradId = `fs-ring-grad-${Date.now() % 1e5}-${gradSeq++}`;
    const mixes = {
      accent: ["var(--interactive-accent)", "var(--interactive-accent-hover, var(--interactive-accent))"],
      muted: [
        "color-mix(in srgb, var(--interactive-accent) 70%, var(--background-primary))",
        "color-mix(in srgb, var(--interactive-accent) 40%, var(--background-primary))"
      ],
      faint: [
        "color-mix(in srgb, var(--interactive-accent) 45%, var(--background-primary))",
        "color-mix(in srgb, var(--interactive-accent) 20%, var(--background-primary))"
      ]
    };
    const defs = svg.createSvg("defs");
    const grad = defs.createSvg("linearGradient", {
      attr: { id: gradId, x1: "0", y1: "0", x2: "1", y2: "1" }
    });
    const [from, to] = mixes[o.tone];
    const s1 = grad.createSvg("stop", { attr: { offset: "0%" } });
    s1.style.setProperty("stop-color", from);
    const s2 = grad.createSvg("stop", { attr: { offset: "100%" } });
    s2.style.setProperty("stop-color", to);
    svg.createSvg("circle", {
      cls: "fs-ring-track",
      attr: { cx: 60, cy: 60, r: RING_R }
    });
    const prog = svg.createSvg("circle", {
      // Array form: createSvg's classList.add rejects space-separated strings.
      cls: ["fs-ring-progress", `fs-tone-${o.tone}`],
      attr: {
        cx: 60,
        cy: 60,
        r: RING_R,
        transform: "rotate(-90 60 60)",
        stroke: `url(#${gradId})`,
        "stroke-dasharray": RING_C.toFixed(2),
        "stroke-dashoffset": RING_C.toFixed(2)
      }
    });
    const center = wrap.createDiv({ cls: "fs-ring-center" });
    center.createDiv({ cls: "fs-ring-value", text: o.value });
    center.createDiv({ cls: "fs-ring-label", text: o.label });
    card2.createDiv({ cls: "fs-stat-sub", text: o.sub });
    const target = (RING_C * (1 - clamp01(o.frac))).toFixed(2);
    window.requestAnimationFrame(
      () => window.requestAnimationFrame(() => prog.setAttribute("stroke-dashoffset", target))
    );
  };
  const progressRing = (parent, o) => {
    const card2 = parent.createDiv({ cls: "fs-stat-card" });
    const wrap = card2.createDiv({ cls: "fs-ring-wrap" });
    const svg = wrap.createSvg("svg", {
      cls: "fs-ring",
      attr: { viewBox: "0 0 120 120", width: 120, height: 120 }
    });
    const gradId = `fs-ring-grad-${Date.now() % 1e5}-${gradSeq++}`;
    const defs = svg.createSvg("defs");
    const grad = defs.createSvg("linearGradient", {
      attr: { id: gradId, x1: "0", y1: "0", x2: "1", y2: "1" }
    });
    const g1 = grad.createSvg("stop", { attr: { offset: "0%" } });
    g1.style.setProperty("stop-color", "var(--interactive-accent)");
    const g2 = grad.createSvg("stop", { attr: { offset: "100%" } });
    g2.style.setProperty(
      "stop-color",
      "var(--interactive-accent-hover, var(--interactive-accent))"
    );
    const rest = svg.createSvg("circle", {
      // Array form: createSvg's classList.add rejects space-separated strings.
      cls: ["fs-ring-track", "fs-ring-rest"],
      attr: { cx: 60, cy: 60, r: RING_R }
    });
    rest.style.setProperty(
      "stroke",
      "color-mix(in srgb, var(--interactive-accent) 26%, var(--background-modifier-border))"
    );
    const frac = clamp01(o.visited / Math.max(1, o.total));
    const prog = svg.createSvg("circle", {
      cls: ["fs-ring-progress", "fs-tone-accent"],
      attr: {
        cx: 60,
        cy: 60,
        r: RING_R,
        transform: "rotate(-90 60 60)",
        stroke: `url(#${gradId})`,
        "stroke-dasharray": RING_C.toFixed(2),
        "stroke-dashoffset": RING_C.toFixed(2)
      }
    });
    const center = wrap.createDiv({ cls: "fs-ring-center" });
    center.createDiv({
      cls: "fs-ring-value",
      text: `${o.visited} / ${o.total}`
    });
    center.createDiv({ cls: "fs-ring-label", text: "Visited" });
    const sub = card2.createDiv({ cls: "fs-stat-sub fs-progress-legend" });
    const leg = (cls, text) => {
      const item = sub.createSpan({ cls: "fs-legend-item" });
      item.createSpan({ cls: `fs-legend-dot ${cls}` });
      item.createSpan({ text });
    };
    leg("fs-legend-visited", `${o.visited} visited`);
    leg("fs-legend-rest", `${o.wantToTry} want to try`);
    const target = (RING_C * (1 - frac)).toFixed(2);
    window.requestAnimationFrame(
      () => window.requestAnimationFrame(() => prog.setAttribute("stroke-dashoffset", target))
    );
  };
  const rectCard = (parent, o) => {
    const card2 = parent.createDiv({ cls: "fs-stat-card fs-stat-rect" });
    card2.createDiv({ cls: `fs-rect-value fs-tone-${o.tone}`, text: o.value });
    card2.createDiv({ cls: "fs-ring-label", text: o.label });
    card2.createDiv({ cls: "fs-stat-sub", text: o.sub });
  };
  const emptyLine = (parent, text) => {
    parent.createDiv({ cls: "fs-empty", text });
  };
  const cardSlot = (parent, spot) => {
    buildSpotCard(parent, spot, { plugin, compact: true });
  };
  const barRow = (parent, label, valueText, frac, onClick) => {
    const row = parent.createDiv({ cls: "fs-stat-row" + (onClick ? " is-clickable" : "") });
    row.createSpan({ cls: "fs-stat-row-label", text: label });
    row.createSpan({ cls: "fs-stat-row-value", text: valueText });
    if (onClick) row.onclick = onClick;
    const bar = parent.createDiv({ cls: "fs-cov-bar" });
    const fill = bar.createDiv({ cls: "fs-cov-fill" });
    fill.style.width = `${Math.round(clamp01(frac) * 100)}%`;
  };
  const money = (n) => {
    const symbol = plugin.settings.currencySymbol || "\u20AC";
    const decimals = Number.isInteger(n) ? 0 : 2;
    return `${symbol}${n.toLocaleString(void 0, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  };
  const listRow = (parent, label, valueText, onClick) => {
    const row = parent.createDiv({ cls: "fs-stat-row" + (onClick ? " is-clickable" : "") });
    row.createSpan({ cls: "fs-stat-row-label", text: label });
    row.createSpan({ cls: "fs-stat-row-value", text: valueText });
    if (onClick) row.onclick = onClick;
  };
  const renderHero = () => {
    const hero = root.createDiv({ cls: "fs-hero" });
    const icon = hero.createDiv({ cls: "fs-hero-icon" });
    (0, import_obsidian30.setIcon)(icon, "utensils");
    hero.createEl("h2", { text: "No food spots yet" });
    hero.createEl("p", {
      text: "Track restaurants you want to try, log visits with ratings, and never wonder where to eat again."
    });
    const btns = hero.createDiv({ cls: "fs-hero-buttons" });
    const add = btns.createEl("button", { cls: "mod-cta", text: "Add your first spot" });
    add.onclick = () => openAddChooser(plugin);
    const imp = btns.createEl("button", { text: "Import from a URL" });
    imp.onclick = () => openImportModal(plugin);
  };
  const renderStatCards = (spots) => {
    const total = spots.length;
    const visited = spots.filter((s) => s.status === "visited").length;
    const wantToTry = total - visited;
    const favorites = spots.filter((s) => s.favorite).length;
    const pct = (n) => `${Math.round(n / Math.max(1, total) * 100)}%`;
    const cards = root.createDiv({ cls: "fs-stat-cards" });
    if (plugin.settings.dashboardCardStyle === "rings") {
      progressRing(cards, { visited, wantToTry, total });
      ringCard(cards, {
        frac: favorites / total,
        value: String(favorites),
        label: "Favorites",
        sub: favorites ? `${pct(favorites)} of your list` : "None marked yet",
        tone: "faint"
      });
    } else {
      rectCard(cards, {
        value: `${visited} / ${total}`,
        label: "Visited",
        sub: `${wantToTry} still on the list`,
        tone: "accent"
      });
      rectCard(cards, {
        value: String(favorites),
        label: "Favorites",
        sub: favorites ? `${pct(favorites)} of your list` : "None marked yet",
        tone: "faint"
      });
    }
    const countries = new Set(spots.map((s) => s.country.trim()).filter(Boolean)).size;
    const cities = new Set(spots.map((s) => (s.city ?? "").trim()).filter(Boolean)).size;
    const cuisines = new Set(
      spots.flatMap((s) => s.cuisines.map((c) => c.trim())).filter(Boolean)
    ).size;
    const visitsLogged = spots.reduce((n, s) => n + s.visitCount, 0);
    const chips = root.createDiv({ cls: "fs-chipstats" });
    const chip = (icon, value, label) => {
      const el = chips.createDiv({ cls: "fs-chipstat" });
      const box = el.createDiv({ cls: "fs-chipstat-icon" });
      (0, import_obsidian30.setIcon)(box, icon);
      const txt = el.createDiv({ cls: "fs-chipstat-text" });
      txt.createDiv({ cls: "fs-chipstat-value", text: String(value) });
      txt.createDiv({ cls: "fs-chipstat-label", text: label });
    };
    chip("utensils", total, "spots");
    chip("globe", countries, countries === 1 ? "country" : "countries");
    chip("building-2", cities, cities === 1 ? "city" : "cities");
    chip("chef-hat", cuisines, cuisines === 1 ? "cuisine" : "cuisines");
    chip("calendar-check", visitsLogged, "visits logged");
  };
  const buildStats = (el, spots) => {
    const grid = el.createDiv({ cls: "fs-stats-grid" });
    const panel = (title) => {
      const p = grid.createDiv({ cls: "fs-stats-panel" });
      p.createDiv({ cls: "fs-stats-panel-title", text: title });
      return p;
    };
    const coveragePanel = (title, entries2, empty) => {
      const p = panel(title);
      if (!entries2.length) {
        emptyLine(p, empty);
        return;
      }
      for (const e of entries2.slice(0, 10)) {
        barRow(p, e.label, `${e.visited}/${e.total}`, e.total ? e.visited / e.total : 0);
      }
    };
    coveragePanel(
      "By country",
      coverageBy(spots, (s) => [s.country]),
      "No countries yet \u2014 spots without a country don't show here."
    );
    coveragePanel(
      "By city",
      coverageBy(spots, (s) => [s.city]),
      "No cities recorded yet \u2014 add a city to your spots to see this."
    );
    coveragePanel(
      "By cuisine",
      coverageBy(spots, (s) => s.cuisines),
      "No cuisines recorded yet \u2014 tag your spots with a cuisine to see this."
    );
    {
      const p = panel("By price");
      const rows = [];
      const symbol = plugin.settings.currencySymbol || "\u20AC";
      for (let t = 1; t <= 4; t++) {
        rows.push({
          label: symbol.repeat(t),
          count: spots.filter((s) => s.price === t).length
        });
      }
      rows.push({
        label: "No price",
        count: spots.filter((s) => s.price === void 0).length
      });
      const max = Math.max(1, ...rows.map((r) => r.count));
      if (rows.every((r) => r.count === 0 || r.label === "No price")) {
        emptyLine(p, "No price tiers set yet \u2014 set a \u20AC tier on a spot to see this.");
      } else {
        for (const r of rows) barRow(p, r.label, String(r.count), r.count / max);
      }
    }
    {
      const p = panel("My ratings");
      const rated = spots.filter((s) => s.rating !== void 0);
      if (!rated.length) {
        emptyLine(p, "No personal ratings yet \u2014 rate a spot or log a rated visit.");
      } else {
        const counts = /* @__PURE__ */ new Map();
        for (const s of rated) {
          const bucket = Math.max(0.5, Math.min(5, Math.round((s.rating ?? 0) * 2) / 2));
          counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
        }
        const max = Math.max(1, ...counts.values());
        const dist = p.createDiv({ cls: "fs-dist" });
        for (let i = 1; i <= 10; i++) {
          const v = i / 2;
          const count = counts.get(v) ?? 0;
          const col = dist.createDiv({ cls: "fs-dist-col" });
          col.setAttr("aria-label", `${v}\u2605 \u2014 ${count} ${count === 1 ? "spot" : "spots"}`);
          const bar = col.createDiv({ cls: "fs-dist-bar" });
          bar.style.height = `${Math.max(2, Math.round(count / max * 100))}%`;
          if (!count) bar.style.opacity = "0.25";
          col.createDiv({ cls: "fs-dist-label", text: Number.isInteger(v) ? String(v) : "" });
        }
      }
    }
    {
      const p = panel("Visits per month");
      const totalVisits = spots.reduce((n, s) => n + s.visitCount, 0);
      if (!totalVisits) {
        emptyLine(p, "No visits logged yet \u2014 log a visit to build this timeline.");
      } else {
        const now = /* @__PURE__ */ new Date();
        const rows = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          rows.push({
            key,
            label: d.toLocaleDateString(void 0, { month: "short", year: "2-digit" }),
            count: 0
          });
        }
        for (const s of spots) {
          for (const v of s.visits) {
            const row = rows.find((r) => v.date.startsWith(r.key));
            if (row) row.count++;
          }
        }
        const max = Math.max(1, ...rows.map((r) => r.count));
        for (const r of rows) barRow(p, r.label, String(r.count), r.count / max);
      }
    }
    {
      const p = panel("Visits per year");
      const byYear = /* @__PURE__ */ new Map();
      for (const s of spots) {
        for (const v of s.visits) {
          const y = v.date.slice(0, 4);
          if (/^\d{4}$/.test(y)) byYear.set(y, (byYear.get(y) ?? 0) + 1);
        }
      }
      if (!byYear.size) {
        emptyLine(p, "No visits logged yet.");
      } else {
        const years = [...byYear.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        const max = Math.max(1, ...years.map(([, n]) => n));
        for (const [y, n] of years) barRow(p, y, String(n), n / max);
      }
    }
    {
      const p = panel("Top rated");
      const rated = spots.filter((s) => s.rating !== void 0 && s.visitCount >= 1).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.visitCount - a.visitCount).slice(0, 5);
      if (!rated.length) {
        emptyLine(p, "No rated spots with a logged visit yet.");
      } else {
        for (const s of rated) {
          listRow(p, s.name, `\u2605 ${s.rating}`, () => openDetailModal(plugin, s.path));
        }
      }
    }
    {
      const p = panel("Most visited");
      const top = spots.filter((s) => s.visitCount > 0).sort((a, b) => b.visitCount - a.visitCount).slice(0, 5);
      if (!top.length) {
        emptyLine(p, "No visits logged yet \u2014 your regulars will show up here.");
      } else {
        for (const s of top) {
          listRow(
            p,
            s.name,
            `${s.visitCount} ${s.visitCount === 1 ? "visit" : "visits"}`,
            () => openDetailModal(plugin, s.path)
          );
        }
      }
    }
    const entries = [];
    let visitsTotal = 0;
    for (const s of spots) {
      for (const v of s.visits) {
        visitsTotal++;
        const amount = spentOf(v);
        if (amount !== void 0) entries.push({ spot: s, visit: v, amount });
      }
    }
    if (!entries.length) {
      emptyLine(el, "No spend logged yet \u2014 add an amount when you log a visit.");
      return;
    }
    {
      const p = panel("Spending");
      const total = entries.reduce((n, e) => n + e.amount, 0);
      const priciest = entries.reduce((best, e) => e.amount > best.amount ? e : best);
      listRow(p, "Total spent", money(total));
      listRow(p, "Average per visit", money(total / entries.length));
      listRow(p, "Visits with an amount", `${entries.length} / ${visitsTotal}`);
      p.createDiv({ cls: "fs-stats-panel-note", text: "Most expensive visit" });
      listRow(
        p,
        priciest.spot.name,
        money(priciest.amount),
        () => openDetailModal(plugin, priciest.spot.path)
      );
    }
    {
      const p = panel("Spend by month");
      const byMonth = /* @__PURE__ */ new Map();
      for (const e of entries) {
        const key = e.visit.date.slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(key)) continue;
        byMonth.set(key, (byMonth.get(key) ?? 0) + e.amount);
      }
      const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
      if (!months.length) {
        emptyLine(p, "No dated visits with an amount yet.");
      } else {
        const max = Math.max(...months.map(([, n]) => n));
        for (const [key, n] of months) {
          const d = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1);
          const label = d.toLocaleDateString(void 0, { month: "short", year: "2-digit" });
          barRow(p, label, money(n), max ? n / max : 0);
        }
      }
    }
    {
      const p = panel("Spend by city");
      const byCity = /* @__PURE__ */ new Map();
      for (const e of entries) {
        const city = (e.spot.city ?? "").trim();
        if (!city) continue;
        byCity.set(city, (byCity.get(city) ?? 0) + e.amount);
      }
      const cities = [...byCity.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
      if (!cities.length) {
        emptyLine(p, "No spend recorded against a city yet \u2014 add a city to your spots.");
      } else {
        const max = Math.max(...cities.map(([, n]) => n));
        for (const [city, n] of cities) barRow(p, city, money(n), max ? n / max : 0);
      }
    }
    {
      const p = panel("Priciest spots");
      const bySpot = /* @__PURE__ */ new Map();
      for (const e of entries) {
        const cur = bySpot.get(e.spot.path) ?? { spot: e.spot, total: 0, count: 0 };
        cur.total += e.amount;
        cur.count++;
        bySpot.set(e.spot.path, cur);
      }
      const top = [...bySpot.values()].sort((a, b) => b.total - a.total || a.spot.name.localeCompare(b.spot.name)).slice(0, 5);
      for (const t of top) {
        listRow(
          p,
          t.spot.name,
          `${money(t.total)} \xB7 ${t.count} ${t.count === 1 ? "visit" : "visits"}`,
          () => openDetailModal(plugin, t.spot.path)
        );
      }
    }
  };
  const renderMoreStats = (spots) => {
    const acc = root.createDiv({ cls: "fs-stats-acc" });
    const header = acc.createDiv({ cls: "fs-stats-toggle" });
    const chev = header.createDiv({ cls: "fs-stats-chevron" });
    (0, import_obsidian30.setIcon)(chev, "chevron-right");
    header.createSpan({ text: "More statistics" });
    const content = acc.createDiv({ cls: "fs-stats-content" });
    const paint = () => {
      acc.toggleClass("is-open", statsOpen);
      content.empty();
      if (statsOpen) buildStats(content, spots);
    };
    header.onclick = () => {
      statsOpen = !statsOpen;
      paint();
    };
    paint();
  };
  const renderSuggestions = (spots) => {
    root.createDiv({ cls: "fs-dash-section-title", text: "Suggestions" });
    const sug = root.createDiv({ cls: "fs-suggestions" });
    {
      const card2 = sug.createDiv({ cls: "fs-sug-card" });
      const head = card2.createDiv({ cls: "fs-sug-head" });
      head.createSpan({ cls: "fs-sug-title", text: "Where do we eat tonight?" });
      const controls = head.createDiv({ cls: "fs-sug-controls" });
      const cities = [
        ...new Set(spots.map((s) => (s.city ?? "").trim()).filter(Boolean))
      ].sort((a, b) => a.localeCompare(b));
      if (suggestionCity && !cities.includes(suggestionCity)) suggestionCity = "";
      const citySel = controls.createEl("select", { cls: "dropdown fs-sug-city" });
      citySel.createEl("option", { text: "All cities", value: "" });
      for (const c of cities) {
        const opt = citySel.createEl("option", { text: c, value: c });
        if (c === suggestionCity) opt.selected = true;
      }
      const shuffleBtn = controls.createEl("button", {
        cls: "fs-sug-shuffle",
        attr: { "aria-label": "Shuffle suggestion" }
      });
      (0, import_obsidian30.setIcon)(shuffleBtn, "shuffle");
      const slot = card2.createDiv({ cls: "fs-sug-slot" });
      const note = card2.createDiv({ cls: "fs-sug-sub" });
      const inCity = (s) => !suggestionCity || (s.city ?? "").trim() === suggestionCity;
      const pool = () => {
        const wtt = spots.filter((s) => s.status === "want-to-try" && inCity(s));
        if (wtt.length > 0) return { list: wtt, revisit: false };
        const visited = spots.filter((s) => s.status === "visited" && inCity(s)).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        return { list: visited, revisit: true };
      };
      const roll = (forceNew) => {
        slot.empty();
        const { list: p, revisit } = pool();
        note.setText("");
        if (!p.length) {
          suggestionPath = void 0;
          emptyLine(
            slot,
            suggestionCity ? `No spots in ${suggestionCity} yet \u2014 add one to get a suggestion.` : "Your list is empty \u2014 add a spot to get a suggestion."
          );
          return;
        }
        let pick = forceNew ? void 0 : p.find((s) => s.path === suggestionPath);
        if (!pick) {
          pick = p[Math.floor(Math.random() * p.length)];
          if (forceNew && p.length > 1 && pick.path === suggestionPath) {
            pick = p[(p.indexOf(pick) + 1) % p.length];
          }
        }
        suggestionPath = pick.path;
        cardSlot(slot, pick);
        if (revisit) {
          note.setText(
            suggestionCity ? `You've been everywhere on your list in ${suggestionCity} \u2014 worth a return?` : "Everything on your list is visited \u2014 worth a return?"
          );
        }
      };
      citySel.onchange = () => {
        suggestionCity = citySel.value;
        roll(false);
      };
      shuffleBtn.onclick = () => roll(true);
      roll(false);
    }
    {
      const card2 = sug.createDiv({ cls: "fs-sug-card" });
      const head = card2.createDiv({ cls: "fs-sug-head" });
      head.createSpan({ cls: "fs-sug-title", text: "Longest on the list" });
      const slot = card2.createDiv({ cls: "fs-sug-slot" });
      const oldest = spots.filter((s) => s.status === "want-to-try").sort((a, b) => a.created.localeCompare(b.created))[0];
      if (!oldest) {
        emptyLine(slot, "Nothing is waiting on your want-to-try list right now.");
      } else {
        card2.createDiv({ cls: "fs-sug-sub", text: `On the list since ${agoText(oldest.created)}` });
        cardSlot(slot, oldest);
      }
    }
    {
      const card2 = sug.createDiv({ cls: "fs-sug-card" });
      const head = card2.createDiv({ cls: "fs-sug-head" });
      head.createSpan({ cls: "fs-sug-title", text: "Back for more?" });
      const slot = card2.createDiv({ cls: "fs-sug-slot" });
      const candidate = spots.filter(
        (s) => s.status === "visited" && (s.rating ?? 0) >= 4 && daysSince(s.lastVisit) > 90
      ).sort((a, b) => daysSince(b.lastVisit) - daysSince(a.lastVisit))[0];
      if (!candidate) {
        emptyLine(
          slot,
          "No 4\u2605+ spots you haven't been back to in over 90 days \u2014 you're keeping up."
        );
      } else {
        card2.createDiv({
          cls: "fs-sug-sub",
          text: `Last visit ${agoText(candidate.lastVisit)}`
        });
        cardSlot(slot, candidate);
      }
    }
  };
  const renderRecentRow = (title, list, empty) => {
    const sec = root.createDiv({ cls: "fs-dash-section" });
    sec.createDiv({ cls: "fs-dash-section-title", text: title });
    if (!list.length) {
      emptyLine(sec, empty);
      return;
    }
    const row = sec.createDiv({ cls: "fs-recent-row" });
    for (const s of list) {
      const cell = row.createDiv({ cls: "fs-row-card" });
      buildSpotCard(cell, s, { plugin, mini: true });
    }
  };
  const addedAt = (s) => s.ctime ?? (s.created ? parseCalendarDate(s.created)?.getTime() ?? 0 : 0);
  const section = (label, fn) => {
    try {
      fn();
    } catch (e) {
      const panel = root.createDiv({ cls: "fs-error-panel" });
      panel.createDiv({ cls: "fs-error-panel-title", text: `${label} failed to render` });
      panel.createDiv({
        cls: "fs-error-panel-msg",
        text: e instanceof Error ? `${e.message}` : String(e)
      });
      console.error(`Food Spot: dashboard section "${label}" failed`, e);
    }
  };
  const render = () => {
    releaseLazyPhotos(root);
    root.empty();
    const spots = plugin.store.getSpots();
    if (!spots.length) {
      renderHero();
      return;
    }
    section("Stats", () => renderStatCards(spots));
    section("More statistics", () => renderMoreStats(spots));
    section("Suggestions", () => renderSuggestions(spots));
    section(
      "Recently visited",
      () => renderRecentRow(
        "Recently visited",
        spots.filter((s) => s.lastVisit).sort((a, b) => (b.lastVisit ?? "").localeCompare(a.lastVisit ?? "")).slice(0, 8),
        "No visits logged yet \u2014 open a spot and log your first visit."
      )
    );
    section(
      "Recently added",
      () => renderRecentRow(
        "Recently added",
        [...spots].sort((a, b) => addedAt(b) - addedAt(a)).slice(0, 8),
        "Nothing added yet \u2014 your newest finds will show up here."
      )
    );
  };
  render();
  return {
    refresh: render,
    destroy: () => root.remove()
  };
}

// src/ui/view.ts
var TABS = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard", mount: mountDashboardTab },
  { id: "spots", label: "Spots", icon: "utensils", mount: mountSpotsTab },
  { id: "discover", label: "Discover", icon: "compass", mount: mountDiscoverTab },
  { id: "places", label: "Locations", icon: "list-tree", mount: mountPlacesTab },
  { id: "map", label: "Map", icon: "map", mount: mountMapTab },
  { id: "visits", label: "Visits", icon: "history", mount: mountVisitsTab }
];
var FoodSpotView = class extends import_obsidian31.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.handles = /* @__PURE__ */ new Map();
    this.panes = /* @__PURE__ */ new Map();
    this.tabButtons = /* @__PURE__ */ new Map();
    this.badgeEl = null;
    this.unsubscribe = null;
    this.activeTab = null;
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "Food Spot";
  }
  getIcon() {
    return PLUGIN_ICON;
  }
  async onOpen() {
    const root = this.contentEl;
    root.empty();
    root.addClass("fs-view");
    if (import_obsidian31.Platform.isMobile) root.addClass("fs-mobile");
    const bar = root.createDiv({ cls: "fs-tab-bar" });
    const content = root.createDiv({ cls: "fs-tab-content" });
    for (const def of TABS) {
      const btn = bar.createEl("button", {
        cls: "fs-tab",
        attr: { "aria-label": def.label, "data-tab": def.id }
      });
      const ic = btn.createSpan({ cls: "fs-tab-icon" });
      (0, import_obsidian31.setIcon)(ic, def.icon);
      if (!import_obsidian31.Platform.isMobile) btn.createSpan({ cls: "fs-tab-label", text: def.label });
      if (def.id === "visits") {
        this.badgeEl = btn.createSpan({
          cls: import_obsidian31.Platform.isMobile ? "fs-tab-dot" : "fs-tab-badge"
        });
      }
      btn.addEventListener("click", () => this.setActiveTab(def.id));
      this.tabButtons.set(def.id, btn);
      const pane = content.createDiv({ cls: "fs-tab-pane is-hidden" });
      this.panes.set(def.id, pane);
    }
    const onEvent = () => this.onDataChanged();
    document.addEventListener(DATA_CHANGED_EVENT, onEvent);
    this.unsubscribe = () => document.removeEventListener(DATA_CHANGED_EVENT, onEvent);
    this.updateBadge();
    const saved = this.plugin.settings.activeTab;
    const initial = TABS.some((t) => t.id === saved) ? saved : "dashboard";
    this.setActiveTab(initial, true);
  }
  async onClose() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    for (const handle of this.handles.values()) handle.destroy();
    this.handles.clear();
    this.panes.clear();
    this.tabButtons.clear();
    this.badgeEl = null;
    this.contentEl.empty();
  }
  setActiveTab(tab, skipPersist = false) {
    const def = TABS.find((t) => t.id === tab);
    if (!def) return;
    this.activeTab = tab;
    for (const [id, btn] of this.tabButtons) btn.toggleClass("is-active", id === tab);
    for (const [id, pane2] of this.panes) pane2.toggleClass("is-hidden", id !== tab);
    const pane = this.panes.get(tab);
    if (!pane) return;
    let handle = this.handles.get(tab);
    if (!handle) {
      handle = def.mount(pane, this.plugin);
      this.handles.set(tab, handle);
    } else {
      handle.refresh();
    }
    if (!skipPersist && this.plugin.settings.activeTab !== tab) {
      this.plugin.settings.activeTab = tab;
      void this.plugin.saveSettings();
    }
    if (tab === "spots") {
      const carrier = this.plugin;
      if (carrier.pendingQuery) {
        const q = carrier.pendingQuery;
        delete carrier.pendingQuery;
        applySpotsQuery(this.plugin, q);
      }
    }
  }
  /** Switch to Spots and narrow it to a location (used by the Locations tab). */
  applyLocationFilter(loc) {
    this.setActiveTab("spots");
    applySpotsLocation(this.plugin, loc);
  }
  onDataChanged() {
    this.updateBadge();
    if (this.activeTab) this.handles.get(this.activeTab)?.refresh();
  }
  visitsThisMonth() {
    const now = /* @__PURE__ */ new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let count = 0;
    for (const spot of this.plugin.store.getSpots()) {
      for (const visit of spot.visits) {
        if (visit.date.startsWith(prefix)) count++;
      }
    }
    return count;
  }
  updateBadge() {
    if (!this.badgeEl) return;
    const count = this.visitsThisMonth();
    const btn = this.tabButtons.get("visits");
    if (import_obsidian31.Platform.isMobile) {
      this.badgeEl.toggleClass("is-visible", count > 0);
      btn?.setAttribute("aria-label", count > 0 ? `Visits (${count} this month)` : "Visits");
    } else {
      this.badgeEl.setText(count > 0 ? String(count) : "");
      this.badgeEl.toggleClass("is-visible", count > 0);
      btn?.setAttribute("title", count > 0 ? `${count} visits this month` : "Visits");
    }
  }
};

// src/settings/settingsTab.ts
var import_obsidian34 = require("obsidian");

// src/ui/modals/duplicates.ts
var import_obsidian32 = require("obsidian");

// src/tools/duplicates.ts
var PROXIMITY_METERS = 60;
var MIN_CONTAINED_NAME = 4;
var MIN_SHARED_TOKEN = 4;
function trimmed(v) {
  return (v ?? "").trim();
}
function sameCity2(a, b) {
  return trimmed(a.city).toLowerCase() === trimmed(b.city).toLowerCase();
}
function namesOverlap(na, nb) {
  if (na === "" || nb === "") return false;
  if (na === nb) return true;
  if (na.length >= MIN_CONTAINED_NAME && nb.includes(na)) return true;
  if (nb.length >= MIN_CONTAINED_NAME && na.includes(nb)) return true;
  return false;
}
function significantTokens(name) {
  const out = /* @__PURE__ */ new Set();
  for (const token of normalizeName(name).split(" ")) {
    if (token.length >= MIN_SHARED_TOKEN) out.add(token);
  }
  return out;
}
function shareToken(a, b) {
  const tokens = significantTokens(a.name);
  if (tokens.size === 0) return false;
  for (const token of significantTokens(b.name)) {
    if (tokens.has(token)) return true;
  }
  return false;
}
function pairDistance(a, b) {
  if (!a.coordinates || !b.coordinates) return void 0;
  return haversineMeters(a.coordinates, b.coordinates);
}
function pairKey(a, b) {
  return a.path < b.path ? `${a.path}\0${b.path}` : `${b.path}\0${a.path}`;
}
function matchPair(a, b) {
  const placeA = trimmed(a.external.googlePlaceId);
  const placeB = trimmed(b.external.googlePlaceId);
  if (placeA !== "" && placeA === placeB) return { reason: "place-id", confidence: 1 };
  if (namesOverlap(normalizeName(a.name), normalizeName(b.name)) && sameCity2(a, b)) {
    return { reason: "name-city", confidence: 0.8 };
  }
  const dist = pairDistance(a, b);
  if (dist !== void 0 && dist <= PROXIMITY_METERS && shareToken(a, b)) {
    return { reason: "proximity", confidence: 0.6 };
  }
  return null;
}
function findDuplicates(spots) {
  const pairs = /* @__PURE__ */ new Map();
  for (let i = 0; i < spots.length; i += 1) {
    for (let j = i + 1; j < spots.length; j += 1) {
      const a = spots[i];
      const b = spots[j];
      if (a.path === b.path) continue;
      const match = matchPair(a, b);
      if (match === null) continue;
      const key = pairKey(a, b);
      const prev = pairs.get(key);
      if (prev === void 0 || match.confidence > prev.confidence) {
        pairs.set(key, { a, b, reason: match.reason, confidence: match.confidence });
      }
    }
  }
  return [...pairs.values()].sort(
    (x, y) => y.confidence - x.confidence || x.a.name.localeCompare(y.a.name) || x.b.name.localeCompare(y.b.name)
  );
}
function firstNonEmpty(keep, drop) {
  const k = trimmed(keep);
  if (k !== "") return keep;
  const d = trimmed(drop);
  return d !== "" ? drop : void 0;
}
function unionList(keep, drop) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const value of [...keep, ...drop]) {
    const norm3 = value.trim().toLowerCase();
    if (norm3 === "" || seen.has(norm3)) continue;
    seen.add(norm3);
    out.push(value);
  }
  return out;
}
function visitKey(v) {
  return [
    v.date,
    v.rating === void 0 ? "" : String(v.rating),
    v.spent === void 0 ? "" : String(v.spent),
    v.note.trim().toLowerCase()
  ].join("|");
}
function mergeVisit(keep, drop) {
  const photos = unionList(keep.photos ?? [], drop.photos ?? []);
  const merged = {
    date: keep.date,
    note: keep.note.trim() !== "" ? keep.note : drop.note
  };
  const rating = keep.rating ?? drop.rating;
  if (rating !== void 0) merged.rating = rating;
  const spent = keep.spent ?? drop.spent;
  if (spent !== void 0) merged.spent = spent;
  if (photos.length > 0) merged.photos = photos;
  return merged;
}
function mergeVisits(keep, drop) {
  const byKey = /* @__PURE__ */ new Map();
  const order = [];
  for (const visit of [...keep, ...drop]) {
    const key = visitKey(visit);
    const prev = byKey.get(key);
    if (prev === void 0) {
      byKey.set(key, visit);
      order.push(key);
    } else {
      byKey.set(key, mergeVisit(prev, visit));
    }
  }
  return order.map((key) => byKey.get(key)).sort((x, y) => x.date.localeCompare(y.date));
}
function mergeExternal2(keep, drop) {
  const out = { ...keep };
  const from = drop;
  for (const source of RATING_SOURCES) {
    const ratingKey = `${source}Rating`;
    const countKey = `${source}RatingCount`;
    const urlKey = `${source}Url`;
    const keepRating = out[ratingKey];
    const dropRating = from[ratingKey];
    if (keepRating === void 0 && dropRating !== void 0) {
      out[ratingKey] = dropRating;
      out[countKey] = from[countKey];
    } else if (keepRating !== void 0 && keepRating === dropRating && out[countKey] === void 0) {
      out[countKey] = from[countKey];
    }
    if (trimmed(out[urlKey]) === "") {
      const url = from[urlKey];
      if (typeof url === "string" && url.trim() !== "") out[urlKey] = url;
    }
  }
  const placeId = firstNonEmpty(keep.googlePlaceId, drop.googlePlaceId);
  if (placeId !== void 0) out.googlePlaceId = placeId;
  const updated = [trimmed(keep.ratingsUpdated), trimmed(drop.ratingsUpdated)].filter((d) => d !== "").sort();
  if (updated.length > 0) out.ratingsUpdated = updated[updated.length - 1];
  return out;
}
function planMerge(keep, drop) {
  const patch = {
    status: keep.status === "visited" || drop.status === "visited" ? "visited" : "want-to-try",
    favorite: keep.favorite || drop.favorite,
    cuisines: unionList(keep.cuisines, drop.cuisines),
    tags: unionList(keep.tags, drop.tags),
    visits: mergeVisits(keep.visits, drop.visits),
    external: mergeExternal2(keep.external, drop.external)
  };
  const country = firstNonEmpty(keep.country, drop.country);
  if (country !== void 0) patch.country = country;
  const city = firstNonEmpty(keep.city, drop.city);
  if (city !== void 0) patch.city = city;
  const district = firstNonEmpty(keep.district, drop.district);
  if (district !== void 0) patch.district = district;
  const address = firstNonEmpty(keep.address, drop.address);
  if (address !== void 0) patch.address = address;
  const url = firstNonEmpty(keep.url, drop.url);
  if (url !== void 0) patch.url = url;
  const phone = firstNonEmpty(keep.phone, drop.phone);
  if (phone !== void 0) patch.phone = phone;
  const photo = firstNonEmpty(keep.photo, drop.photo);
  if (photo !== void 0) patch.photo = photo;
  const menu = firstNonEmpty(keep.menu, drop.menu);
  if (menu !== void 0) patch.menu = menu;
  const sourceUrl = firstNonEmpty(keep.sourceUrl, drop.sourceUrl);
  if (sourceUrl !== void 0) patch.sourceUrl = sourceUrl;
  const coordinates = keep.coordinates ?? drop.coordinates;
  if (coordinates !== void 0) patch.coordinates = coordinates;
  const price = keep.price ?? drop.price;
  if (price !== void 0) patch.price = price;
  const hours = (keep.hours ?? []).length > 0 ? keep.hours : drop.hours;
  if (hours !== void 0 && hours.length > 0) patch.hours = hours;
  if (keep.ratingLocked) {
    patch.ratingLocked = true;
    if (keep.rating !== void 0) patch.rating = keep.rating;
  } else if (drop.ratingLocked && drop.rating !== void 0) {
    patch.ratingLocked = true;
    patch.rating = drop.rating;
  } else if (keep.rating === void 0 && drop.rating !== void 0) {
    patch.rating = drop.rating;
  }
  const keepNotes = keep.notes.trim();
  const dropNotes = drop.notes.trim();
  if (keepNotes === "") {
    if (dropNotes !== "") patch.notes = drop.notes;
  } else if (dropNotes !== "" && dropNotes !== keepNotes) {
    patch.notes = `${keep.notes.trimEnd()}

${drop.notes.trimStart()}`;
  }
  return patch;
}
var MANAGED_SECTIONS = ["## Notes", "## Visits"];
var CACHE_ONLY_KEYS = /* @__PURE__ */ new Set(["position"]);
var FENCE_RE2 = /^ {0,3}(`{3,}|~{3,})/;
var H1_H2_RE = /^#{1,2}[ \t]/;
function bodyOf(content) {
  const m = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(content);
  return m ? content.slice(m[0].length) : content;
}
function unmergedContent(content) {
  const out = [];
  const consumed = /* @__PURE__ */ new Set();
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;
  let skipping = null;
  for (const raw of bodyOf(content).split(/\r?\n/)) {
    const line = raw.replace(/\r$/, "");
    const fence2 = FENCE_RE2.exec(line);
    if (inFence) {
      if (fence2 !== null && fence2[1][0] === fenceChar && fence2[1].length >= fenceLen && line.slice(fence2[0].length).trim() === "") {
        inFence = false;
      }
      if (skipping !== "## Notes") out.push(line);
      continue;
    }
    if (fence2 !== null) {
      inFence = true;
      fenceChar = fence2[1][0];
      fenceLen = fence2[1].length;
      if (skipping !== "## Notes") out.push(line);
      continue;
    }
    if (skipping !== null) {
      if (!H1_H2_RE.test(line)) {
        if (skipping === "## Visits" && line.trim() !== "" && parseVisitLine(line) === null) {
          out.push(line);
        }
        continue;
      }
      skipping = null;
    }
    const heading = line.replace(/[ \t]+$/, "");
    if (MANAGED_SECTIONS.includes(heading) && !consumed.has(heading)) {
      consumed.add(heading);
      skipping = heading;
      continue;
    }
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
function hasUnmanagedFrontmatter(dropFm, managedKeys) {
  return Object.keys(dropFm).some((k) => !managedKeys.has(k) && !CACHE_ONLY_KEYS.has(k));
}
function planFrontmatterCarry(dropFm, keepFm, managedKeys) {
  const carry = { add: {}, conflicts: [] };
  for (const [key, value] of Object.entries(dropFm)) {
    if (managedKeys.has(key) || CACHE_ONLY_KEYS.has(key)) continue;
    if (!(key in keepFm)) {
      carry.add[key] = value;
    } else if (JSON.stringify(keepFm[key]) !== JSON.stringify(value)) {
      carry.conflicts.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  return carry;
}
function carryOverBlock(dropName, leftover, conflicts) {
  if (leftover === "" && conflicts.length === 0) return "";
  const parts = [`## Merged from "${dropName}"`];
  if (conflicts.length > 0) {
    parts.push(
      "Properties from the merged note that this note already defines differently:",
      conflicts.map((c) => `- ${c}`).join("\n")
    );
  }
  if (leftover !== "") parts.push(leftover);
  return `${parts.join("\n\n")}
`;
}

// src/ui/modals/duplicates.ts
function openDuplicatesModal(plugin) {
  new DuplicatesModal(plugin).open();
}
function errMsg3(e) {
  return e instanceof Error ? e.message : String(e);
}
var REASON_ICON = {
  "place-id": "map-pin",
  "name-city": "type",
  proximity: "move-horizontal"
};
function reasonLabel(pair) {
  switch (pair.reason) {
    case "place-id":
      return "same Google place";
    case "name-city":
      return "same name & city";
    case "proximity": {
      const dist = pairDistance(pair.a, pair.b);
      return dist === void 0 ? "nearly the same spot" : `${Math.round(dist)} m apart`;
    }
  }
}
function summaryOf(spot) {
  const parts = [];
  parts.push(spot.rating !== void 0 ? `${spot.rating}\u2605` : "no rating");
  parts.push(`${spot.visitCount} visit${spot.visitCount === 1 ? "" : "s"}`);
  if (spot.photo) parts.push("photo");
  if (spot.external.googleRating !== void 0)
    parts.push(`Google ${spot.external.googleRating}`);
  return parts.join(" \xB7 ");
}
function locationOf(spot) {
  return [spot.city, spot.country].filter((v) => (v ?? "").trim() !== "").join(", ");
}
function managedFrontmatterKeys(spot) {
  return new Set(
    Object.keys(
      frontmatterFromInput(
        spot,
        { visitCount: spot.visitCount, lastVisit: spot.lastVisit, rating: spot.rating },
        { created: spot.created, updated: spot.updated }
      )
    )
  );
}
var DuplicatesModal = class extends import_obsidian32.Modal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
    this.pairs = [];
    /** Pairs the user called a false positive — this session only. */
    this.dismissed = /* @__PURE__ */ new Set();
    /** Notes already trashed by a merge, before the index catches up. */
    this.gone = /* @__PURE__ */ new Set();
    this.busy = false;
  }
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-duplicates-modal");
    this.titleEl.setText("Duplicate spots");
    this.countEl = this.contentEl.createDiv({ cls: "fs-dupfind-count" });
    this.listEl = this.contentEl.createDiv({ cls: "fs-dupfind-list" });
    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const close = buttons.createEl("button", { text: "Close" });
    close.type = "button";
    close.addEventListener("click", () => this.close());
    this.rescan();
  }
  onClose() {
    this.contentEl.empty();
  }
  /** Re-run detection against the live index and repaint the list. */
  rescan() {
    let all;
    try {
      all = findDuplicates(this.plugin.store.getSpots());
    } catch (e) {
      all = [];
      new import_obsidian32.Notice(`Duplicate scan failed: ${errMsg3(e)}`);
    }
    this.pairs = all.filter(
      (p) => !this.dismissed.has(pairKey(p.a, p.b)) && !this.gone.has(p.a.path) && !this.gone.has(p.b.path)
    );
    this.render();
  }
  render() {
    this.listEl.empty();
    if (this.pairs.length === 0) {
      this.countEl.setText("");
      this.listEl.createDiv({
        cls: "fs-empty-state",
        text: "No duplicates found \u2014 your library is clean."
      });
      return;
    }
    this.countEl.setText(
      `${this.pairs.length} possible duplicate${this.pairs.length === 1 ? "" : "s"}. Merging keeps one note and combines everything from the other.`
    );
    for (const pair of this.pairs) this.renderRow(pair);
  }
  renderRow(pair) {
    const row = this.listEl.createDiv({ cls: "fs-dupfind-row" });
    const badge = row.createDiv({ cls: `fs-dupfind-badge fs-dupfind-${pair.reason}` });
    const icon = badge.createSpan({ cls: "fs-dupfind-badge-icon" });
    (0, import_obsidian32.setIcon)(icon, REASON_ICON[pair.reason]);
    badge.createSpan({ text: reasonLabel(pair) });
    const sides = row.createDiv({ cls: "fs-dupfind-sides" });
    for (const spot of [pair.a, pair.b]) {
      const side = sides.createDiv({ cls: "fs-dupfind-side" });
      side.createDiv({ cls: "fs-dupfind-name", text: spot.name });
      const where = locationOf(spot);
      if (where !== "") side.createDiv({ cls: "fs-dupfind-where", text: where });
      side.createDiv({ cls: "fs-dupfind-meta", text: summaryOf(spot) });
    }
    const actions = row.createDiv({ cls: "fs-dupfind-actions" });
    const buttons = [];
    const mergeBtn = (keep, drop) => {
      const btn = actions.createEl("button", {
        cls: "fs-small-btn",
        text: `Merge \u2192 keep ${keep.name}`
      });
      btn.type = "button";
      btn.addEventListener("click", () => void this.merge(pair, keep, drop, buttons));
      buttons.push(btn);
    };
    mergeBtn(pair.a, pair.b);
    mergeBtn(pair.b, pair.a);
    const notDup = actions.createEl("button", { cls: "fs-small-btn", text: "Not a duplicate" });
    notDup.type = "button";
    notDup.addEventListener("click", () => {
      if (this.busy) return;
      this.dismissed.add(pairKey(pair.a, pair.b));
      this.pairs = this.pairs.filter((p) => p !== pair);
      this.render();
    });
    buttons.push(notDup);
  }
  async merge(pair, keep, drop, buttons) {
    if (this.busy) return;
    const ok = await confirmModal(this.app, {
      title: `Merge "${drop.name}" into "${keep.name}"?`,
      body: `"${drop.name}" is merged into "${keep.name}" and its note moves to the trash. Visits, ratings and photos are combined; anything else on the note \u2014 custom properties, extra sections, your own lines under Visits \u2014 is appended to "${keep.name}" first.`,
      cta: `Merge into ${keep.name}`,
      danger: true
    });
    if (!ok) return;
    this.busy = true;
    for (const b of buttons) b.disabled = true;
    try {
      const keepFile = this.plugin.store.fileFor(keep.path);
      const dropFile = this.plugin.store.fileFor(drop.path);
      if (!keepFile || !dropFile) {
        new import_obsidian32.Notice(
          `Merge cancelled \u2014 the note for "${keepFile ? drop.name : keep.name}" is no longer in the vault. Nothing was changed.`,
          1e4
        );
        for (const b of buttons) b.disabled = false;
        return;
      }
      let dropContent;
      try {
        dropContent = await this.app.vault.read(dropFile);
      } catch (e) {
        new import_obsidian32.Notice(
          `Merge cancelled \u2014 "${drop.name}" could not be read (${errMsg3(e)}). Nothing was changed.`,
          1e4
        );
        for (const b of buttons) b.disabled = false;
        return;
      }
      try {
        await this.plugin.store.updateSpot(keep.path, planMerge(keep, drop));
      } catch (e) {
        new import_obsidian32.Notice(
          `Merge failed \u2014 "${keep.name}" was not changed and "${drop.name}" is still there: ${errMsg3(e)}`,
          1e4
        );
        for (const b of buttons) b.disabled = false;
        return;
      }
      try {
        await this.carryOver(keepFile, dropFile, drop, dropContent);
      } catch (e) {
        new import_obsidian32.Notice(
          `"${keep.name}" now holds the combined data, but the extra sections and properties of "${drop.name}" could not be copied across (${errMsg3(e)}) \u2014 that note was left in place, so nothing is lost. Move the rest by hand, then delete it.`,
          15e3
        );
        this.rescan();
        return;
      }
      try {
        await this.plugin.store.deleteSpot(drop.path);
      } catch (e) {
        new import_obsidian32.Notice(
          `"${keep.name}" now holds the combined data, but "${drop.name}" could not be trashed (${errMsg3(e)}) \u2014 delete that note by hand.`,
          1e4
        );
        this.rescan();
        return;
      }
      this.gone.add(drop.path);
      this.dismissed.add(pairKey(pair.a, pair.b));
      new import_obsidian32.Notice(
        `Merged "${drop.name}" into "${keep.name}" \u2014 its note is in the trash.`,
        8e3
      );
      this.rescan();
    } finally {
      this.busy = false;
    }
  }
  /**
   * Copy everything `planMerge` cannot express onto the kept note: unknown
   * frontmatter keys it does not have yet, and the dropped note's body outside
   * the managed sections. Throws if either write fails — the caller then leaves
   * the dropped note alone.
   */
  async carryOver(keepFile, dropFile, drop, dropContent) {
    const dropFm = this.app.metadataCache.getFileCache(dropFile)?.frontmatter ?? {};
    const managed = managedFrontmatterKeys(drop);
    let conflicts = [];
    if (hasUnmanagedFrontmatter(dropFm, managed)) {
      await this.app.fileManager.processFrontMatter(keepFile, (fm) => {
        const carry = planFrontmatterCarry(dropFm, fm, managed);
        conflicts = carry.conflicts;
        for (const [key, value] of Object.entries(carry.add)) fm[key] = value;
      });
    }
    const block = carryOverBlock(drop.name, unmergedContent(dropContent), conflicts);
    if (block === "") return;
    await this.app.vault.process(keepFile, (content) => {
      const base = content.replace(/\s+$/, "");
      return base === "" ? block : `${base}

${block}`;
    });
  }
};

// src/ui/modals/progress.ts
var import_obsidian33 = require("obsidian");
var ProgressModal = class extends import_obsidian33.Modal {
  constructor(app, title, signal) {
    super(app);
    this.title = title;
    this.signal = signal;
    this.finished = false;
  }
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-enrich-progress-modal");
    this.titleEl.setText(this.title);
    const track = this.contentEl.createDiv({ cls: "fs-progress-track" });
    this.fillEl = track.createDiv({ cls: "fs-progress-fill" });
    const meta = this.contentEl.createDiv({ cls: "fs-enrich-progress-meta" });
    this.countEl = meta.createSpan({ cls: "fs-enrich-count", text: "0 / 0" });
    this.nameEl = meta.createSpan({ cls: "fs-enrich-current" });
    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    this.cancelBtn = buttons.createEl("button", { text: "Cancel" });
    this.cancelBtn.type = "button";
    this.cancelBtn.addEventListener("click", () => {
      this.signal.cancelled = true;
      this.cancelBtn.disabled = true;
      this.cancelBtn.setText("Cancelling\u2026");
    });
  }
  update(done, total, current) {
    if (!this.fillEl) return;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    this.fillEl.style.width = `${pct}%`;
    this.countEl.setText(`${done} / ${total}`);
    this.nameEl.setText(current);
  }
  /** Close without treating it as a user cancel. */
  finish() {
    this.finished = true;
    this.close();
  }
  onClose() {
    if (!this.finished) this.signal.cancelled = true;
    this.contentEl.empty();
  }
};

// src/settings/settingsTab.ts
var NAV_SECTIONS = [
  { id: "general", label: "General", icon: "settings" },
  { id: "data", label: "Data", icon: "database" },
  { id: "api", label: "API", icon: "key-round" },
  { id: "customize", label: "Customize", icon: "palette" },
  { id: "import", label: "Import", icon: "download" },
  { id: "widgets", label: "Widgets", icon: "code" },
  { id: "info", label: "Quick info", icon: "info" }
];
var CARD_WIDTHS = [100, 120, 140, 160, 185, 215, 250];
var GOOGLE_KEY_URL = "https://developers.google.com/maps/documentation/places/web-service/get-api-key";
function errMsg4(e) {
  return e instanceof Error ? e.message : String(e);
}
function csvCell(v) {
  if (v === void 0) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function spotsToCsv(spots) {
  const header = [
    "name",
    "status",
    "favorite",
    "country",
    "city",
    "district",
    "address",
    "cuisines",
    "tags",
    "price",
    "rating",
    "google_rating",
    "google_rating_count",
    "tripadvisor_rating",
    "visit_count",
    "last_visit",
    "url",
    "phone",
    "created",
    "updated",
    "path"
  ];
  const lines = [header.join(",")];
  for (const s of spots) {
    lines.push(
      [
        csvCell(s.name),
        csvCell(s.status),
        csvCell(s.favorite),
        csvCell(s.country),
        csvCell(s.city),
        csvCell(s.district),
        csvCell(s.address),
        csvCell(s.cuisines.join("; ")),
        csvCell(s.tags.join("; ")),
        csvCell(s.price),
        csvCell(s.rating),
        csvCell(s.external.googleRating),
        csvCell(s.external.googleRatingCount),
        csvCell(s.external.tripadvisorRating),
        csvCell(s.visitCount),
        csvCell(s.lastVisit),
        csvCell(s.url),
        csvCell(s.phone),
        csvCell(s.created),
        csvCell(s.updated),
        csvCell(s.path)
      ].join(",")
    );
  }
  return lines.join("\n") + "\n";
}
var DISH_FILE_SUFFIX = /\s\d{4}-\d{2}-\d{2}(\s\d+)?$/;
function classifyMediaFolder(app, settings, spots) {
  const folderPath = (0, import_obsidian34.normalizePath)(settings.mediaFolder);
  const folder = app.vault.getFolderByPath(folderPath);
  if (!folder) return null;
  const spotsRoot = (0, import_obsidian34.normalizePath)(settings.spotsFolder);
  const dedicated = folderPath !== spotsRoot && folderPath.startsWith(`${spotsRoot}/`);
  const spotPaths = new Set(spots.map((s) => s.path));
  const referenced = /* @__PURE__ */ new Set();
  for (const spot of spots) {
    const refs = [
      spot.photo,
      spot.menu,
      // Dish photos are embed targets and may carry a `|300` display alias —
      // an unstripped ref resolves to nothing, and the file behind it would
      // then be classed as unreferenced and trashed by the sweep below.
      ...spot.visits.flatMap((v) => (v.photos ?? []).map(embedRefPath))
    ];
    for (const ref of refs) {
      if (!ref || /^https?:\/\//i.test(ref)) continue;
      const f = app.metadataCache.getFirstLinkpathDest(ref, spot.path) ?? app.vault.getAbstractFileByPath((0, import_obsidian34.normalizePath)(ref));
      referenced.add(f instanceof import_obsidian34.TFile ? f.path : (0, import_obsidian34.normalizePath)(ref));
    }
  }
  const linkedElsewhere = /* @__PURE__ */ new Set();
  for (const [source, targets] of Object.entries(app.metadataCache.resolvedLinks)) {
    if (spotPaths.has(source)) continue;
    for (const target of Object.keys(targets)) linkedElsewhere.add(target);
  }
  const dishDir = `${folderPath}/dishes`;
  const spotBases = /* @__PURE__ */ new Set();
  for (const spot of spots) {
    const name = spot.name.trim().toLowerCase();
    if (name) spotBases.add(name);
    const sanitized = sanitizeFileName2(spot.name).trim().toLowerCase();
    if (sanitized) spotBases.add(sanitized);
  }
  const pluginNamed = (file) => {
    if (file.parent?.path === dishDir) return DISH_FILE_SUFFIX.test(file.basename);
    const base = file.basename.trim().toLowerCase();
    return spotBases.has(base) || spotBases.has(base.replace(/\s+\d+$/, "").trim());
  };
  const owned = [];
  const leftAlone = [];
  const walk = (dir) => {
    for (const child of dir.children) {
      if (child instanceof import_obsidian34.TFolder) {
        walk(child);
        continue;
      }
      if (!(child instanceof import_obsidian34.TFile)) continue;
      if (linkedElsewhere.has(child.path)) {
        leftAlone.push({ file: child, reason: "linked from another note" });
      } else if (referenced.has(child.path) || dedicated || pluginNamed(child)) {
        owned.push(child);
      } else {
        leftAlone.push({ file: child, reason: "not created by Food Spot" });
      }
    }
  };
  walk(folder);
  return { owned, leftAlone, referenced, dedicated, folderPath };
}
function plural(n, noun) {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}
var FoodSpotSettingTab = class extends import_obsidian34.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.active = "general";
    this.dispatchTimer = null;
    this.plugin = plugin;
  }
  // -------------------------------------------------------------------------
  // helpers
  // -------------------------------------------------------------------------
  async save() {
    await this.plugin.saveSettings();
  }
  /** Debounced "something visual changed — repaint views/widgets". */
  touch() {
    if (this.dispatchTimer !== null) window.clearTimeout(this.dispatchTimer);
    this.dispatchTimer = window.setTimeout(() => {
      this.dispatchTimer = null;
      document.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
    }, 250);
  }
  /** WatchLog settingsGroup(): titled panel with icon, subtitle, status chip. */
  group(parent, o) {
    const box = parent.createDiv({ cls: "fs-sgroup" });
    const head = box.createDiv({ cls: "fs-sgroup-head" });
    const icon = head.createDiv({ cls: "fs-sgroup-icon" });
    (0, import_obsidian34.setIcon)(icon, o.icon);
    const titles = head.createDiv({ cls: "fs-sgroup-titles" });
    titles.createDiv({ cls: "fs-sgroup-title", text: o.title });
    titles.createDiv({ cls: "fs-sgroup-sub", text: o.subtitle });
    const chip = head.createSpan({ cls: "fs-chip" });
    chip.hide();
    const setChip = (text, tone) => {
      chip.show();
      chip.setText(text);
      chip.removeClass("fs-chip-ok", "fs-chip-warn", "fs-chip-pending");
      chip.addClass(`fs-chip-${tone}`);
    };
    if (o.chip) setChip(o.chip.text, o.chip.tone);
    return { content: box.createDiv({ cls: "fs-sgroup-body" }), setChip };
  }
  /** `?` inline-help toggle on a Setting row. */
  addHelp(setting, text) {
    let helpEl = null;
    setting.addExtraButton(
      (b) => b.setIcon("help-circle").setTooltip("What does this do?").onClick(() => {
        if (helpEl) {
          helpEl.remove();
          helpEl = null;
          return;
        }
        helpEl = createDiv({ cls: "fs-setting-help", text });
        setting.settingEl.insertAdjacentElement("afterend", helpEl);
      })
    );
  }
  /**
   * Fallback location for exports and backups on mobile, where there is no
   * system save dialog: a folder next to the spot notes. Ignored on desktop —
   * saveToDisk only reaches for it when the dialog is missing.
   */
  exportTarget() {
    return {
      app: this.app,
      folder: `${this.plugin.settings.spotsFolder}/_exports`
    };
  }
  spots() {
    try {
      return this.plugin.store.getSpots();
    } catch {
      return [];
    }
  }
  // -------------------------------------------------------------------------
  // shell
  // -------------------------------------------------------------------------
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("fs-settings");
    containerEl.toggleClass("fs-settings-mobile", import_obsidian34.Platform.isMobile);
    this.navEl = containerEl.createDiv({ cls: "fs-settings-nav" });
    this.bodyEl = containerEl.createDiv({ cls: "fs-settings-body" });
    for (const sec of NAV_SECTIONS) {
      const btn = this.navEl.createEl("button", { cls: "fs-settings-nav-item" });
      const icon = btn.createSpan({ cls: "fs-settings-nav-icon" });
      (0, import_obsidian34.setIcon)(icon, sec.icon);
      btn.createSpan({ text: sec.label });
      btn.toggleClass("is-active", sec.id === this.active);
      btn.onclick = () => {
        this.active = sec.id;
        this.navEl.findAll(".fs-settings-nav-item").forEach((el) => el.removeClass("is-active"));
        btn.addClass("is-active");
        this.renderBody();
        if (import_obsidian34.Platform.isMobile) {
          this.bodyEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
    }
    this.renderBody();
  }
  hide() {
    this.containerEl.removeClass("fs-settings", "fs-settings-mobile");
    super.hide();
  }
  renderBody() {
    const body = this.bodyEl;
    body.empty();
    switch (this.active) {
      case "general":
        this.renderGeneral(body);
        break;
      case "data":
        this.renderData(body);
        break;
      case "api":
        this.renderApi(body);
        break;
      case "customize":
        this.renderCustomize(body);
        break;
      case "import":
        this.renderImport(body);
        break;
      case "widgets":
        this.renderWidgets(body);
        break;
      case "info":
        this.renderInfo(body);
        break;
      default:
        this.renderGeneral(body);
    }
  }
  // -------------------------------------------------------------------------
  // General
  // -------------------------------------------------------------------------
  renderGeneral(body) {
    const s = this.plugin.settings;
    const g = this.group(body, {
      icon: "settings",
      title: "General",
      subtitle: "Storage location, formats and rating behavior",
      chip: { text: `Media \u2192 ${s.mediaFolder}`, tone: "ok" }
    });
    const c = g.content;
    const folder = new import_obsidian34.Setting(c).setName("Spots folder").setDesc("Vault folder where spot notes are created. Type to search existing folders.").addText((t) => {
      t.setPlaceholder("Food Spot").setValue(s.spotsFolder).onChange(async (v) => {
        s.spotsFolder = v.trim() || "Food Spot";
        await this.save();
      });
      new FolderSuggest(this.app, t.inputEl);
    });
    this.addHelp(
      folder,
      "New spot notes are written here. Existing notes can live anywhere \u2014 the index follows the 'type: foodspot' frontmatter, not the folder."
    );
    const org = new import_obsidian34.Setting(c).setName("Organize by country").setDesc("Create a per-country subfolder, e.g. Food Spots/Netherlands/.").addToggle(
      (t) => t.setValue(s.organizeByCountry).onChange(async (v) => {
        s.organizeByCountry = v;
        await this.save();
      })
    );
    this.addHelp(org, "Only affects newly created notes. Moving a note never breaks it.");
    const relocate = new import_obsidian34.Setting(c).setName("Apply folder layout to existing notes").setDesc(
      "Moves every spot note into the folder configured above (with per-country subfolders when enabled). Wiki-links keep working; subfolders of the spots folder that end up empty are cleaned up."
    );
    relocate.addButton(
      (b) => b.setButtonText("Relocate notes").onClick(async () => {
        b.setDisabled(true);
        try {
          const res = await this.relocateNotes();
          new import_obsidian34.Notice(
            `Relocated ${res.moved} notes; ${res.kept} were already in place${res.failed > 0 ? `; ${res.failed} failed` : ""}.`,
            8e3
          );
        } catch (e) {
          new import_obsidian34.Notice(`Relocation failed: ${errMsg4(e)}`);
        } finally {
          b.setDisabled(false);
        }
      })
    );
    this.addHelp(
      relocate,
      "Use this after changing the spots folder or the per-country toggle. Notes are moved with Obsidian's rename (links and backlinks update automatically); nothing is copied or deleted. Folders outside the spots folder are never trashed, even when they end up empty."
    );
    const media = new import_obsidian34.Setting(c).setName("Media folder").setDesc("Vault folder where photos fetched by Google enrichment are saved. Type to search existing folders.").addText((t) => {
      t.setPlaceholder("Food Spot/_media").setValue(s.mediaFolder).onChange(async (v) => {
        s.mediaFolder = v.trim() || "Food Spot/_media";
        g.setChip(`Media \u2192 ${s.mediaFolder}`, "ok");
        await this.save();
      });
      new FolderSuggest(this.app, t.inputEl);
    });
    this.addHelp(
      media,
      "Enrichment downloads a spot's top Google photo as a .jpg into this folder and links it as the card image. The folder is created on first download; changing it later never moves already-saved files."
    );
    new import_obsidian34.Setting(c).setName("Default country").setDesc("Pre-filled in the add form for new spots.").addDropdown((d) => {
      d.addOption("", "\u2014 none \u2014");
      const inLibrary = this.plugin.store.distinct("country");
      const seen = /* @__PURE__ */ new Set();
      for (const cty of [...inLibrary, ...COUNTRIES]) {
        if (!cty || seen.has(cty)) continue;
        seen.add(cty);
        d.addOption(cty, cty);
      }
      if (s.defaultCountry && !seen.has(s.defaultCountry))
        d.addOption(s.defaultCountry, s.defaultCountry);
      d.setValue(s.defaultCountry).onChange(async (v) => {
        s.defaultCountry = v;
        await this.save();
      });
    });
    new import_obsidian34.Setting(c).setName("Currency").setDesc("Symbol shown for price tiers and amounts spent on visits.").addDropdown((d) => {
      for (const [sym, label] of CURRENCIES) d.addOption(sym, label);
      if (!CURRENCIES.some(([sym]) => sym === s.currencySymbol))
        d.addOption(s.currencySymbol, s.currencySymbol);
      d.setValue(s.currencySymbol).onChange(async (v) => {
        s.currencySymbol = v || "\u20AC";
        await this.save();
        this.touch();
      });
    });
    new import_obsidian34.Setting(c).setName("Date format").setDesc("How dates are displayed across the plugin.").addDropdown(
      (d) => d.addOption("european", "European (31-12-2026)").addOption("american", "American (12/31/2026)").addOption("iso", "ISO (2026-12-31)").setValue(s.dateFormat).onChange(async (v) => {
        s.dateFormat = v;
        await this.save();
        this.touch();
      })
    );
    const half = new import_obsidian34.Setting(c).setName("Half-star ratings").setDesc("Allow 0.5 steps when rating spots and visits.").addToggle(
      (t) => t.setValue(s.halfStarRatings).onChange(async (v) => {
        s.halfStarRatings = v;
        await this.save();
        this.touch();
      })
    );
    this.addHelp(half, "Existing half-star values are kept either way \u2014 this only changes the rating input.");
    const stale = new import_obsidian34.Setting(c).setName("Stale rating threshold").setDesc(`External ratings older than ${s.staleRatingThresholdDays} days get a stale badge.`).addSlider(
      (sl) => sl.setLimits(30, 720, 30).setValue(s.staleRatingThresholdDays).setDynamicTooltip().onChange(async (v) => {
        s.staleRatingThresholdDays = v;
        stale.setDesc(`External ratings older than ${v} days get a stale badge.`);
        await this.save();
        this.touch();
      })
    );
    this.addHelp(
      stale,
      "Google/TripAdvisor ratings are only refreshed when you ask (per spot or via the bulk command). The badge reminds you when a number is old."
    );
  }
  // -------------------------------------------------------------------------
  // Data
  // -------------------------------------------------------------------------
  renderData(body) {
    const spots = this.spots();
    const g = this.group(body, {
      icon: "database",
      title: "Data",
      subtitle: "Maintenance and exports",
      chip: { text: `${spots.length} spots indexed`, tone: spots.length ? "ok" : "pending" }
    });
    const c = g.content;
    const enrich = new import_obsidian34.Setting(c).setName("Enrich all spots from Google").setDesc("Fetch missing photos, ratings, coordinates and addresses for your spots in one run. An options dialog lets you pick what to fill and which spots to include.").addButton(
      (b) => b.setButtonText("Enrich from Google").onClick(() => {
        const open = this.plugin.openEnrichModal;
        if (typeof open === "function") open.call(this.plugin);
        else new import_obsidian34.Notice("Food Spot: bulk enrichment is not available yet.");
      })
    );
    this.addHelp(
      enrich,
      "Uses the Google Places key from the API section at roughly 3 API calls per spot (lookup, details, photo download). Large libraries can eat into your Google quota \u2014 scope the run to missing-data-only in the options dialog to keep it cheap. By default only empty fields are filled; nothing you typed is overwritten."
    );
    const exp = new import_obsidian34.Setting(c).setName("Export spots").setDesc(
      import_obsidian34.Platform.isMobile ? "Writes all spots into a file inside your vault, ready to share from Files." : "Opens the system save dialog and writes all spots wherever you choose."
    );
    exp.settingEl.addClass("fs-setting-stack");
    exp.addButton(
      (b) => b.setButtonText("Export CSV\u2026").onClick(async () => {
        const date = todayIso();
        await saveToDisk(
          `Food Spot export ${date}.csv`,
          spotsToCsv(this.spots()),
          this.exportTarget()
        );
      })
    );
    exp.addButton(
      (b) => b.setButtonText("Export JSON\u2026").onClick(async () => {
        const date = todayIso();
        await saveToDisk(
          `Food Spot export ${date}.json`,
          JSON.stringify(this.spots(), null, 2),
          this.exportTarget()
        );
      })
    );
    this.addHelp(
      exp,
      `The export always contains every spot, regardless of any filters active in the Spots tab. On desktop it uses the system save dialog; on mobile there is none, so the file is written to ${this.plugin.settings.spotsFolder}/_exports inside your vault.`
    );
    const bak = new import_obsidian34.Setting(c).setName("Backup & restore").setDesc(
      "Full backup: every field, visits, notes AND the actual photo/menu files, embedded in one JSON. Restore recreates notes and images; existing spots are never overwritten."
    );
    bak.settingEl.addClass("fs-setting-stack");
    bak.addButton(
      (b) => b.setButtonText("Export backup\u2026").onClick(async () => {
        b.setDisabled(true);
        try {
          const { json, suggestedName } = await buildBackupJson(this.plugin);
          await saveToDisk(suggestedName, json, this.exportTarget());
        } catch (e) {
          new import_obsidian34.Notice(`Backup failed: ${errMsg4(e)}`);
        } finally {
          b.setDisabled(false);
        }
      })
    );
    bak.addButton((b) => {
      const input = createEl("input", {
        type: "file",
        attr: { accept: ".json,application/json", style: "display: none" }
      });
      bak.settingEl.appendChild(input);
      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        input.value = "";
        if (!file) return;
        b.setDisabled(true);
        const signal = { cancelled: false };
        const progress = new ProgressModal(this.app, "Restoring backup\u2026", signal);
        progress.open();
        try {
          await importBackup(
            this.plugin,
            await file.text(),
            (done, total, label) => progress.update(done, total, label),
            signal
          );
        } catch (e) {
          new import_obsidian34.Notice(`Restore failed: ${errMsg4(e)}`);
        } finally {
          progress.finish();
          b.setDisabled(false);
        }
      });
      b.setButtonText("Import backup\u2026").onClick(() => input.click());
    });
    this.addHelp(
      bak,
      `Export opens the system save dialog on desktop \u2014 put the file anywhere (it can get large: photos are embedded). On mobile it lands in ${this.plugin.settings.spotsFolder}/_exports inside your vault instead. To restore on another vault: install Food Spot there, then Import backup and pick the file. Media files are recreated at their original vault paths.`
    );
    const dupes = new import_obsidian34.Setting(c).setName("Find duplicate spots").setDesc(
      "Finds spots that are the same restaurant \u2014 the same Google place, the same name within one city, or nearly identical coordinates \u2014 and lets you merge a pair into one note."
    );
    dupes.addButton(
      (b) => b.setButtonText("Scan for duplicates").onClick(() => {
        try {
          openDuplicatesModal(this.plugin);
        } catch (e) {
          new import_obsidian34.Notice(`Duplicate scan failed: ${errMsg4(e)}`);
        }
      })
    );
    this.addHelp(
      dupes,
      "Nothing is merged without asking. Each pair shows why it matched and what is on both notes; you pick which note survives, and the other one's visits, ratings, photos, cuisines and tags are folded into it before it goes to the trash. 'Not a duplicate' hides a pair until the next scan."
    );
    const sweep = new import_obsidian34.Setting(c).setName("Clean up unused media").setDesc(
      "Trashes files anywhere in the media folder (including dish photos) that no spot references any more \u2014 e.g. leftovers from deleted restaurants."
    );
    sweep.addButton(
      (b) => b.setButtonText("Find unused files").onClick(async () => {
        b.setDisabled(true);
        try {
          const plan = classifyMediaFolder(this.app, this.plugin.settings, this.spots());
          if (!plan) {
            new import_obsidian34.Notice("No media folder yet \u2014 nothing to clean up.");
            return;
          }
          const spared = plan.leftAlone.length;
          const sparedNote = spared > 0 ? ` ${plural(spared, "other file")} in ${plan.folderPath} ${spared === 1 ? "is" : "are"} linked from other notes or not created by Food Spot \u2014 left alone.` : "";
          const orphans = plan.owned.filter((f) => !plan.referenced.has(f.path));
          if (orphans.length === 0) {
            new import_obsidian34.Notice(
              spared > 0 ? `No unused Food Spot media.${sparedNote}` : "No unused media files \u2014 the folder is tidy.",
              spared > 0 ? 8e3 : void 0
            );
            return;
          }
          const names = orphans.slice(0, 8).map((f) => f.name).join(", ");
          const ok = await confirmModal(this.app, {
            title: `Trash ${plural(orphans.length, "unused file")}?`,
            body: `${names}${orphans.length > 8 ? `, and ${orphans.length - 8} more` : ""}. No spot references ${orphans.length === 1 ? "it" : "them"} any more. Files go to the trash and can be restored.${sparedNote}`,
            cta: "Trash them",
            danger: true
          });
          if (!ok) return;
          let n = 0;
          const failed = [];
          for (const f of orphans) {
            try {
              await this.app.fileManager.trashFile(f);
              n++;
            } catch {
              failed.push(f.name);
            }
          }
          const problem = failed.length > 0 ? ` ${plural(failed.length, "file")} couldn't be trashed (${failed.slice(0, 5).join(", ")}) \u2014 they may be open elsewhere or read-only.` : "";
          new import_obsidian34.Notice(
            `Trashed ${plural(n, "unused media file")}.${problem}${sparedNote}`,
            failed.length > 0 || spared > 0 ? 1e4 : void 0
          );
        } catch (e) {
          new import_obsidian34.Notice(`Cleanup failed: ${errMsg4(e)}`);
        } finally {
          b.setDisabled(false);
        }
      })
    );
    this.addHelp(
      sweep,
      "Cover photos, menu files and every dish photo embedded on a visit count as referenced \u2014 only genuinely orphaned files are listed. A file any other note in your vault links to, or that Food Spot cannot show it created, is never trashed \u2014 so pointing the media folder at a shared attachments folder is safe. Deleting a restaurant leaves its photo in place on purpose, so a mis-click never costs you an image; this sweeps the leftovers when you want the space back."
    );
    const danger = new import_obsidian34.Setting(c).setName("Delete all restaurant data").setDesc(
      "Trashes every spot note (recoverable from the trash). Consider exporting a full backup first."
    );
    danger.settingEl.addClass("fs-danger-setting");
    danger.addButton((b) => {
      b.setButtonText("Delete all\u2026").setWarning();
      b.onClick(() => new DeleteAllModal(this.app, this.plugin).open());
    });
  }
  /** Move every spot note to the settings-configured folder layout. */
  async relocateNotes() {
    const s = this.plugin.settings;
    const res = { moved: 0, kept: 0, failed: 0 };
    const sourceParents = /* @__PURE__ */ new Set();
    await this.relocateMedia();
    for (const spot of this.spots()) {
      const file = this.plugin.store.fileFor(spot.path);
      if (!file) {
        res.failed++;
        continue;
      }
      const countrySeg = s.organizeByCountry && spot.country.trim() !== "" ? `/${sanitizeFileName2(spot.country)}` : "";
      const dir = (0, import_obsidian34.normalizePath)(`${s.spotsFolder}${countrySeg}`);
      const target = (0, import_obsidian34.normalizePath)(`${dir}/${file.name}`);
      if (file.path === target) {
        res.kept++;
        continue;
      }
      try {
        if (this.app.vault.getFolderByPath(dir) === null) {
          await this.app.vault.createFolder(dir).catch(() => void 0);
        }
        if (this.app.vault.getAbstractFileByPath(target) !== null) {
          res.failed++;
          continue;
        }
        if (file.parent) sourceParents.add(file.parent.path);
        await this.app.fileManager.renameFile(file, target);
        res.moved++;
      } catch {
        res.failed++;
      }
    }
    await this.sweepEmptyFolders(sourceParents);
    return res;
  }
  /**
   * If the media folder lives OUTSIDE the spots folder (typical after the
   * spots folder was changed), bring it along: move every file (including
   * `dishes/` and any other subfolder), rewrite the photo/menu references of
   * the files that actually moved, and update the setting — one folder, not
   * two. A file whose destination is taken stays put AND keeps its reference:
   * repointing a note at a same-named stranger is worse than not moving.
   */
  async relocateMedia() {
    const s = this.plugin.settings;
    const media = (0, import_obsidian34.normalizePath)(s.mediaFolder);
    const spotsRoot = (0, import_obsidian34.normalizePath)(s.spotsFolder);
    if (media === spotsRoot || media.startsWith(`${spotsRoot}/`)) return;
    const oldFolder = this.app.vault.getFolderByPath(media);
    const newMedia = (0, import_obsidian34.normalizePath)(`${spotsRoot}/_media`);
    if (oldFolder) {
      const before = this.spots().map((spot) => ({
        path: spot.path,
        photo: spot.photo,
        menu: spot.menu
      }));
      const moved = /* @__PURE__ */ new Map();
      const blocked = [];
      const moveInto = async (dir, relative) => {
        const targetDir = (0, import_obsidian34.normalizePath)(relative ? `${newMedia}/${relative}` : newMedia);
        if (this.app.vault.getFolderByPath(targetDir) === null) {
          await this.app.vault.createFolder(targetDir).catch(() => void 0);
        }
        for (const child of [...dir.children]) {
          if (child instanceof import_obsidian34.TFolder) {
            await moveInto(child, relative ? `${relative}/${child.name}` : child.name);
            continue;
          }
          if (!(child instanceof import_obsidian34.TFile)) continue;
          const from = child.path;
          const target = (0, import_obsidian34.normalizePath)(`${targetDir}/${child.name}`);
          if (this.app.vault.getAbstractFileByPath(target) !== null) {
            blocked.push(child.name);
            continue;
          }
          try {
            await this.app.fileManager.renameFile(child, target);
            moved.set(from, target);
          } catch {
            blocked.push(child.name);
          }
        }
      };
      await moveInto(oldFolder, "");
      const rewriteFailures = [];
      for (const rec of before) {
        const patch = {};
        const photoTarget = rec.photo ? moved.get((0, import_obsidian34.normalizePath)(rec.photo)) : void 0;
        const menuTarget = rec.menu ? moved.get((0, import_obsidian34.normalizePath)(rec.menu)) : void 0;
        if (photoTarget) patch.photo = photoTarget;
        if (menuTarget) patch.menu = menuTarget;
        if (Object.keys(patch).length === 0) continue;
        try {
          await this.plugin.store.updateSpot(rec.path, patch);
        } catch {
          rewriteFailures.push(rec.path);
        }
      }
      if (blocked.length > 0) {
        new import_obsidian34.Notice(
          `${plural(blocked.length, "media file")} stayed in ${media} \u2014 a file with the same name already exists in ${newMedia} (${blocked.slice(0, 5).join(", ")}). Their notes still point at the old folder.`,
          1e4
        );
      }
      if (rewriteFailures.length > 0) {
        new import_obsidian34.Notice(
          `${plural(rewriteFailures.length, "note")} kept a photo/menu path in ${media}: ${rewriteFailures.slice(0, 5).join(", ")}. Fix the path in the note or run the relocation again.`,
          1e4
        );
      }
    }
    s.mediaFolder = newMedia;
    await this.save();
    new import_obsidian34.Notice(`Media folder moved to ${newMedia}.`);
  }
  /**
   * Trash folders that relocation emptied — bounded to the configured spots
   * and media subtrees. Walking up unconditionally could reach folders Food
   * Spot never created (an indexed note may live anywhere in the vault), and
   * the configured roots themselves are never candidates.
   */
  async sweepEmptyFolders(candidates) {
    const s = this.plugin.settings;
    const roots = [(0, import_obsidian34.normalizePath)(s.spotsFolder), (0, import_obsidian34.normalizePath)(s.mediaFolder)];
    const inside = (path) => roots.some((root) => path !== root && path.startsWith(`${root}/`));
    for (const parentPath of candidates) {
      if (!inside(parentPath)) continue;
      let folder = this.app.vault.getFolderByPath(parentPath);
      while (folder && inside(folder.path) && folder.children.length === 0) {
        const above = folder.parent;
        await this.app.fileManager.trashFile(folder).catch(() => void 0);
        folder = above ? this.app.vault.getFolderByPath(above.path) : null;
      }
    }
  }
  // -------------------------------------------------------------------------
  // API
  // -------------------------------------------------------------------------
  renderApi(body) {
    const s = this.plugin.settings;
    const hasKey = () => !!(s.apiKeys.googlePlaces ?? "").trim();
    const g = this.group(body, {
      icon: "key-round",
      title: "API",
      subtitle: "External data providers",
      chip: {
        text: hasKey() ? "Google Places \u2014 key set" : "Google Places \u2014 no key",
        tone: hasKey() ? "ok" : "warn"
      }
    });
    const c = g.content;
    const card2 = c.createDiv({ cls: "fs-provider-card" });
    const head = card2.createDiv({ cls: "fs-provider-head" });
    head.createDiv({ cls: "fs-provider-avatar", text: "G" });
    const titles = head.createDiv({ cls: "fs-provider-titles" });
    titles.createDiv({ cls: "fs-provider-name", text: "Google Places API" });
    titles.createDiv({
      cls: "fs-provider-desc",
      text: "Powers online search, Google Maps URL enrichment and rating refresh."
    });
    const badge = head.createDiv({ cls: "fs-provider-badge" });
    const paintBadge = () => {
      badge.setText(hasKey() ? "Active" : "Inactive");
      badge.toggleClass("is-active", hasKey());
      g.setChip(
        hasKey() ? "Google Places \u2014 key set" : "Google Places \u2014 no key",
        hasKey() ? "ok" : "warn"
      );
    };
    paintBadge();
    const row = card2.createDiv({ cls: "fs-provider-keyrow" });
    const input = row.createEl("input", {
      cls: "fs-provider-key",
      type: "password",
      attr: { placeholder: "API key", spellcheck: "false", autocomplete: "off" }
    });
    input.value = s.apiKeys.googlePlaces ?? "";
    let keySaveTimer = null;
    input.addEventListener("input", () => {
      const v = input.value.trim();
      s.apiKeys.googlePlaces = v || void 0;
      paintBadge();
      if (keySaveTimer !== null) window.clearTimeout(keySaveTimer);
      keySaveTimer = window.setTimeout(() => {
        keySaveTimer = null;
        void this.save();
      }, 500);
    });
    input.addEventListener("blur", () => {
      if (keySaveTimer !== null) {
        window.clearTimeout(keySaveTimer);
        keySaveTimer = null;
        void this.save();
      }
    });
    const eye = row.createEl("button", {
      cls: "fs-provider-eye",
      attr: { "aria-label": "Show or hide key" }
    });
    (0, import_obsidian34.setIcon)(eye, "eye");
    eye.onclick = () => {
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      (0, import_obsidian34.setIcon)(eye, hidden ? "eye-off" : "eye");
    };
    const testBtn = row.createEl("button", { text: "Test" });
    testBtn.onclick = async () => {
      if (!hasKey()) {
        g.setChip("Google Places \u2014 no key to test", "warn");
        return;
      }
      testBtn.disabled = true;
      g.setChip("Testing\u2026", "pending");
      try {
        const results = await this.plugin.importer.searchPlaces("pizza amsterdam");
        const first = results[0];
        if (first) g.setChip(`Test passed \u2014 "${first.name}"`, "ok");
        else g.setChip("Test failed \u2014 no results returned", "warn");
      } catch (e) {
        g.setChip(`Test failed \u2014 ${errMsg4(e)}`, "warn");
      } finally {
        testBtn.disabled = false;
      }
    };
    const links = card2.createDiv({ cls: "fs-provider-links" });
    links.createEl("a", { text: "Get a key", href: GOOGLE_KEY_URL });
    const warn = card2.createDiv({ cls: "fs-provider-warning" });
    const warnIcon = warn.createSpan();
    (0, import_obsidian34.setIcon)(warnIcon, "alert-triangle");
    warn.createSpan({
      text: "The key is stored in plain text in this vault's plugin data.json. Anyone (or anything) with access to your vault files can read it."
    });
  }
  // -------------------------------------------------------------------------
  // Customize
  // -------------------------------------------------------------------------
  renderCustomize(body) {
    const s = this.plugin.settings;
    const cards = this.group(body, {
      icon: "layout-grid",
      title: "Cards",
      subtitle: "Card size and text placement"
    });
    const cc = cards.content;
    let desktopSwatch;
    let mobileSwatch;
    const paintSwatches = () => {
      const dw = CARD_WIDTHS[s.cardSizeDesktop + 3] ?? 160;
      const mw = CARD_WIDTHS[s.cardSizeMobile + 3] ?? 140;
      desktopSwatch.style.width = `${dw}px`;
      desktopSwatch.setText(`${dw}px`);
      mobileSwatch.style.width = `${mw}px`;
      mobileSwatch.setText(`${mw}px`);
    };
    new import_obsidian34.Setting(cc).setName("Card size \u2014 desktop").setDesc("Minimum card width in the grid (7 steps).").addSlider(
      (sl) => sl.setLimits(-3, 3, 1).setValue(s.cardSizeDesktop).setDynamicTooltip().onChange(async (v) => {
        s.cardSizeDesktop = v;
        await this.save();
        paintSwatches();
        this.touch();
      })
    );
    new import_obsidian34.Setting(cc).setName("Card size \u2014 mobile").setDesc("Separate size used on phones and tablets.").addSlider(
      (sl) => sl.setLimits(-3, 3, 1).setValue(s.cardSizeMobile).setDynamicTooltip().onChange(async (v) => {
        s.cardSizeMobile = v;
        await this.save();
        paintSwatches();
        this.touch();
      })
    );
    const preview = cc.createDiv({ cls: "fs-size-preview" });
    const dItem = preview.createDiv({ cls: "fs-size-preview-item" });
    dItem.createSpan({ text: "Desktop" });
    desktopSwatch = dItem.createDiv({ cls: "fs-size-swatch" });
    const mItem = preview.createDiv({ cls: "fs-size-preview-item" });
    mItem.createSpan({ text: "Mobile" });
    mobileSwatch = mItem.createDiv({ cls: "fs-size-swatch" });
    paintSwatches();
    new import_obsidian34.Setting(cc).setName("Card text placement").setDesc("Name and meta inside the photo (gradient scrim) or underneath it.").addDropdown(
      (d) => d.addOption("inside", "Inside the photo").addOption("under", "Under the photo").setValue(s.cardTextPlacement).onChange(async (v) => {
        s.cardTextPlacement = v;
        await this.save();
        this.touch();
      })
    );
    new import_obsidian34.Setting(cc).setName("Dashboard stat cards").setDesc("Animated rings or plain rectangles on the Dashboard tab.").addDropdown(
      (d) => d.addOption("rings", "Rings").addOption("rectangles", "Rectangles").setValue(s.dashboardCardStyle).onChange(async (v) => {
        s.dashboardCardStyle = v;
        await this.save();
        this.touch();
      })
    );
    const colors = this.group(body, {
      icon: "palette",
      title: "Colors",
      subtitle: "Status colors and rating tiers"
    });
    const col = colors.content;
    new import_obsidian34.Setting(col).setName("Want-to-try color").setDesc("Status badges and dots on cards and suggestions.").addColorPicker(
      (cp) => cp.setValue(s.statusColors.wantToTry).onChange(async (v) => {
        s.statusColors.wantToTry = v;
        await this.save();
        this.touch();
      })
    );
    new import_obsidian34.Setting(col).setName("Visited color").setDesc("Status badges and dots on cards and suggestions.").addColorPicker(
      (cp) => cp.setValue(s.statusColors.visited).onChange(async (v) => {
        s.statusColors.visited = v;
        await this.save();
        this.touch();
      })
    );
    new import_obsidian34.Setting(col).setName("Favorite color").setDesc("The \u2605 favorite marker.").addColorPicker(
      (cp) => cp.setValue(s.statusColors.favorite).onChange(async (v) => {
        s.statusColors.favorite = v;
        await this.save();
        this.touch();
      })
    );
    const tiersSetting = new import_obsidian34.Setting(col).setName("Rating tiers").setDesc("Label and color for each star level, with a live preview.");
    this.addHelp(
      tiersSetting,
      "Tier 1 colors ratings up to 1\u2605, tier 2 up to 2\u2605, and so on. Labels show next to the stars wherever ratings are displayed."
    );
    const editor = col.createDiv({ cls: "fs-tier-editor" });
    s.ratingTiers.forEach((tier, i) => {
      const rowEl = editor.createDiv({ cls: "fs-tier-row" });
      const colorInput = rowEl.createEl("input", { cls: "fs-tier-color", type: "color" });
      colorInput.value = tier.color;
      const labelInput = rowEl.createEl("input", {
        cls: "fs-tier-label",
        type: "text",
        attr: { placeholder: `Tier ${i + 1}` }
      });
      labelInput.value = tier.label;
      const previewEl = rowEl.createDiv({ cls: "fs-tier-preview" });
      const paintPreview = () => {
        previewEl.empty();
        starRating(previewEl, {
          value: i + 1,
          halfSteps: false,
          tiers: s.ratingTiers,
          readOnly: true,
          showLabel: true
        });
      };
      colorInput.addEventListener("input", async () => {
        tier.color = colorInput.value;
        await this.save();
        paintPreview();
        this.touch();
      });
      labelInput.addEventListener("input", async () => {
        tier.label = labelInput.value;
        await this.save();
        paintPreview();
        this.touch();
      });
      paintPreview();
    });
  }
  // -------------------------------------------------------------------------
  // Import
  // -------------------------------------------------------------------------
  renderImport(body) {
    const s = this.plugin.settings;
    const g = this.group(body, {
      icon: "download",
      title: "Import",
      subtitle: "Duplicate detection and review behavior",
      chip: {
        text: s.reviewBeforeSave ? "Review before save \u2014 on" : "Direct save",
        tone: "ok"
      }
    });
    const c = g.content;
    const dup = new import_obsidian34.Setting(c).setName("Duplicate detection").setDesc("Warn when an imported spot looks like one already in your library.").addToggle(
      (t) => t.setValue(s.duplicateDetectionEnabled).onChange(async (v) => {
        s.duplicateDetectionEnabled = v;
        await this.save();
      })
    );
    this.addHelp(
      dup,
      "Matching is name-similarity AND distance aware: two branches of the same chain in different cities are not flagged as duplicates."
    );
    const radius = new import_obsidian34.Setting(c).setName("Duplicate radius").setDesc(`Spots within ${s.duplicateDetectionRadiusMeters} m of each other can be duplicates.`).addSlider(
      (sl) => sl.setLimits(10, 500, 5).setValue(s.duplicateDetectionRadiusMeters).setDynamicTooltip().onChange(async (v) => {
        s.duplicateDetectionRadiusMeters = v;
        radius.setDesc(`Spots within ${v} m of each other can be duplicates.`);
        await this.save();
      })
    );
    const review = new import_obsidian34.Setting(c).setName("Review before save").setDesc("Show an editable review form for every import before the note is created.").addToggle(
      (t) => t.setValue(s.reviewBeforeSave).onChange(async (v) => {
        s.reviewBeforeSave = v;
        await this.save();
        g.setChip(v ? "Review before save \u2014 on" : "Direct save", "ok");
      })
    );
    this.addHelp(
      review,
      "When off, imports save immediately and show a Notice with an Undo button instead."
    );
  }
  // -------------------------------------------------------------------------
  // Widgets (syntax reference)
  // -------------------------------------------------------------------------
  renderWidgets(body) {
    const g = this.group(body, {
      icon: "code",
      title: "Widget syntax",
      subtitle: "Embed live Food Spot blocks in any note"
    });
    const c = g.content;
    c.addClass("fs-widget-doc");
    c.createEl("p", {
      text: 'Add a code block with language "foodspot". One "key: value" per line; blank lines and lines starting with # are ignored. Copy an example below straight into any note, or use the "Insert widget" command.'
    });
    const topCity = (() => {
      const counts = /* @__PURE__ */ new Map();
      for (const s of this.spots()) {
        const city = (s.city ?? "").trim();
        if (city) counts.set(city, (counts.get(city) ?? 0) + 1);
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Amsterdam";
    })();
    const topCuisine = (() => {
      const counts = /* @__PURE__ */ new Map();
      for (const s of this.spots())
        for (const cu of s.cuisines) counts.set(cu, (counts.get(cu) ?? 0) + 1);
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Italian";
    })();
    const example = (title, block) => {
      const card2 = c.createDiv({ cls: "fs-example-card" });
      const head = card2.createDiv({ cls: "fs-example-head" });
      head.createSpan({ cls: "fs-example-title", text: title });
      const copy = head.createEl("button", { cls: "fs-btn fs-small-btn" });
      const ic = copy.createSpan({ cls: "fs-btn-icon" });
      (0, import_obsidian34.setIcon)(ic, "copy");
      copy.createSpan({ text: " Copy" });
      copy.addEventListener("click", () => {
        void navigator.clipboard.writeText(block + "\n").then(() => {
          new import_obsidian34.Notice(`Copied "${title}" \u2014 paste it into any note.`);
        });
      });
      card2.createEl("pre", { text: block });
    };
    example(
      "Wishlist cards for a city",
      "```foodspot\nview: cards\nstatus: want-to-try\ncity: " + topCity + "\nsort: date-added\ndirection: desc\nlimit: 12\n```"
    );
    example(
      "Where do we eat tonight?",
      "```foodspot\nview: random\nstatus: want-to-try\ncity: " + topCity + "\n```"
    );
    example(
      "Top rated table",
      "```foodspot\nview: table\nsort: rating\ndirection: desc\nlimit: 10\n```"
    );
    example(
      "City checklist",
      "```foodspot\nview: shortlist\ncity: " + topCity + "\nlimit: 15\n```"
    );
    example(
      "One cuisine, everywhere",
      "```foodspot\nview: list\ncuisine: " + topCuisine + "\nsort: rating\ndirection: desc\n```"
    );
    example(
      "Visited ratio stat",
      "```foodspot\nview: stat\nstat: visited-ratio\n```"
    );
    const views = c.createDiv({ cls: "fs-doc-list" });
    const docRow = (parent, term, desc) => {
      const row = parent.createDiv({ cls: "fs-doc-row" });
      row.createEl("code", { text: term });
      row.createSpan({ text: desc });
    };
    c.createEl("h4", { text: "Views" });
    docRow(views, "view: cards", "Photo card grid.");
    docRow(views, "view: list", "Compact clickable name list.");
    docRow(views, "view: table", "Name / cuisine / city / rating / visits table.");
    docRow(views, "view: stat", "One stat card \u2014 see stat values below.");
    docRow(views, "view: random", "One random pick with an in-place shuffle button.");
    docRow(views, "view: shortlist", "Compact want-to-try checklist (great per city).");
    c.createEl("h4", { text: "Filters" });
    const filters = c.createDiv({ cls: "fs-doc-list" });
    docRow(filters, "country / city / district / cuisine / tag", "Match a single value (case-insensitive).");
    docRow(filters, "status", "want-to-try or visited.");
    docRow(filters, "price", "Tier 1\u20134.");
    docRow(filters, "minRating", "Minimum personal rating, 0\u20135 (half steps allowed). Unrated spots are always shown.");
    docRow(filters, "favorite", "true or false.");
    docRow(filters, "limit", "Maximum number of results.");
    docRow(filters, "sort", "name, rating, external-rating, price, date-added, last-visit, visit-count.");
    docRow(filters, "direction", "asc or desc.");
    c.createEl("h4", { text: "Stat values" });
    const stats = c.createDiv({ cls: "fs-doc-list" });
    docRow(stats, "stat: visited-ratio", "Ring with visited percentage.");
    docRow(stats, "stat: counts", "Spots \xB7 countries \xB7 cities \xB7 cuisines \xB7 visits strip.");
    docRow(stats, "stat: top-cuisines", "Your five most common cuisines.");
    c.createEl("p", {
      cls: "fs-doc-note",
      text: "Widgets re-render live whenever your spots change. Invalid keys or values show an inline error listing the valid options."
    });
  }
  // -------------------------------------------------------------------------
  // Quick info
  // -------------------------------------------------------------------------
  renderInfo(body) {
    const g = this.group(body, {
      icon: "info",
      title: "Quick info",
      subtitle: "How Food Spot works under the hood"
    });
    const c = g.content;
    const collapsible = (title, paragraphs) => {
      const box = c.createDiv({ cls: "fs-qi" });
      const head = box.createDiv({ cls: "fs-qi-head" });
      const chev = head.createDiv({ cls: "fs-qi-chev" });
      (0, import_obsidian34.setIcon)(chev, "chevron-right");
      head.createSpan({ text: title });
      const bodyEl = box.createDiv({ cls: "fs-qi-body" });
      for (const p of paragraphs) bodyEl.createEl("p", { text: p });
      head.onclick = () => box.toggleClass("is-open", !box.hasClass("is-open"));
    };
    collapsible("How spots are stored", [
      "Every spot is a normal markdown note with 'type: foodspot' in its frontmatter. The plugin's data.json only stores settings.",
      "You can rename, move, edit or sync the notes freely \u2014 the index follows the frontmatter type, not the file path, and picks up external edits live."
    ]);
    collapsible("How ratings are derived", [
      "Your personal rating is the average of your visit ratings, rounded to half stars.",
      "If you set a rating manually, it is locked (ratingLocked: true) and no longer recomputed from visits.",
      "External ratings (Google, TripAdvisor, Yelp, TheFork) are snapshots \u2014 refresh them per spot from the \u22EE menu or in bulk via the command palette. A stale badge appears after the threshold set in General."
    ]);
    collapsible("Where external ratings come from", [
      "Google: fetched from the Places API and needs the key set in the API section. Enrichment and rating refresh both use it.",
      "TripAdvisor, Yelp and TheFork: no API needed \u2014 paste the spot's public page URL into the matching field in the edit modal (Ratings & price section). Refresh then reads the rating from the page's structured data (JSON-LD).",
      'Shortcut: pasting a TripAdvisor/Yelp/TheFork URL into the importer for a spot you already have offers "Attach as rating source" instead of creating a duplicate \u2014 it stores the URL and fetches the rating in one step.',
      "TheFork rates on a 10-point scale. Values are stored raw and always shown as /10 \u2014 never silently converted to a 5-star number.",
      "Some sites occasionally answer with a bot check. That source is skipped with a warning for the run and picked up again on the next refresh."
    ]);
    collapsible("How visits are parsed", [
      "Visits are bullet lines under the '## Visits' heading, using Dataview-style inline fields:",
      "- [date:: 2026-07-12] [rating:: 4.5] [spent:: 45] Great omakase, sat at the bar",
      "date is required (ISO); rating and spent are optional; the rest of the line is the visit note. You can add or edit these by hand \u2014 they stay Dataview-queryable."
    ]);
  }
};
var FolderSuggest = class extends import_obsidian34.AbstractInputSuggest {
  constructor(app, inputEl) {
    super(app, inputEl);
    this.inputEl = inputEl;
  }
  getSuggestions(query) {
    const q = query.toLowerCase();
    const folders = [];
    const walk = (f) => {
      for (const child of f.children) {
        if (child instanceof import_obsidian34.TFolder) {
          if (child.path.toLowerCase().includes(q)) folders.push(child);
          walk(child);
        }
      }
    };
    walk(this.app.vault.getRoot());
    return folders.slice(0, 60);
  }
  renderSuggestion(folder, el) {
    el.setText(folder.path);
  }
  selectSuggestion(folder) {
    this.inputEl.value = folder.path;
    this.inputEl.trigger("input");
    this.close();
  }
};
var COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cura\xE7ao",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Macau",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "San Marino",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Somalia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];
var CURRENCIES = [
  ["\u20AC", "\u20AC Euro"],
  ["$", "$ US Dollar"],
  ["\xA3", "\xA3 British Pound"],
  ["\xA5", "\xA5 Yen / Yuan"],
  ["\u20B9", "\u20B9 Indian Rupee"],
  ["CHF", "CHF Swiss Franc"],
  ["kr", "kr Krona/Krone"],
  ["z\u0142", "z\u0142 Polish Z\u0142oty"],
  ["K\u010D", "K\u010D Czech Koruna"],
  ["\u0E3F", "\u0E3F Thai Baht"],
  ["\u20AB", "\u20AB Vietnamese Dong"],
  ["\u20A9", "\u20A9 Korean Won"],
  ["Rp", "Rp Indonesian Rupiah"],
  ["RM", "RM Malaysian Ringgit"],
  ["S$", "S$ Singapore Dollar"],
  ["HK$", "HK$ Hong Kong Dollar"],
  ["A$", "A$ Australian Dollar"],
  ["C$", "C$ Canadian Dollar"],
  ["R$", "R$ Brazilian Real"],
  ["\u20BA", "\u20BA Turkish Lira"],
  ["\u062F.\u0625", "\u062F.\u0625 UAE Dirham"]
];
var DeleteAllModal = class extends import_obsidian34.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.alsoMedia = false;
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    this.modalEl.addClass("fs-modal");
    const spots = this.plugin.store.getSpots();
    titleEl.setText(`Delete all ${spots.length} spots?`);
    contentEl.createEl("p", {
      cls: "fs-confirm-body",
      text: `Every spot note (${spots.length}) is moved to the trash and can be restored from there. Visits and notes go with them.`
    });
    const mediaLabel = contentEl.createEl("label", { cls: "fs-checkbox-label" });
    const mediaCb = mediaLabel.createEl("input", { type: "checkbox" });
    mediaLabel.createSpan({
      text: ` Also trash downloaded photos/menus in ${this.plugin.settings.mediaFolder}`
    });
    const mediaNote = contentEl.createDiv({ cls: "fs-provider-warning" });
    mediaNote.hide();
    mediaCb.addEventListener("change", () => {
      this.alsoMedia = mediaCb.checked;
      if (!this.alsoMedia) {
        mediaNote.hide();
        return;
      }
      const plan = classifyMediaFolder(this.app, this.plugin.settings, spots);
      mediaNote.empty();
      const icon = mediaNote.createSpan();
      (0, import_obsidian34.setIcon)(icon, "alert-triangle");
      let text;
      if (!plan) {
        text = `No ${this.plugin.settings.mediaFolder} folder yet \u2014 there is nothing to trash.`;
      } else {
        const spared = plan.leftAlone.length > 0 ? ` ${plural(plan.leftAlone.length, "other file")} there ${plan.leftAlone.length === 1 ? "is" : "are"} linked from another note or not created by Food Spot \u2014 left alone.` : "";
        const shared = plan.dedicated ? "" : ` ${plan.folderPath} is not a Food Spot-only folder, so only files this plugin can prove it owns are touched.`;
        text = `${plural(plan.owned.length, "file")} in ${plan.folderPath} (including subfolders) will be trashed.${spared}${shared}`;
      }
      mediaNote.createSpan({ text });
      mediaNote.show();
    });
    contentEl.createEl("p", {
      cls: "fs-preset-hint",
      text: "Type DELETE to enable the button."
    });
    const input = contentEl.createEl("input", {
      type: "text",
      cls: "fs-preset-name-input",
      attr: { placeholder: "DELETE" }
    });
    const buttons = contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const go = buttons.createEl("button", { cls: "mod-warning", text: "Delete everything" });
    go.type = "button";
    go.disabled = true;
    input.addEventListener("input", () => {
      go.disabled = input.value.trim() !== "DELETE";
    });
    go.addEventListener("click", () => {
      go.disabled = true;
      cancel.disabled = true;
      const signal = { cancelled: false };
      const progress = new ProgressModal(this.app, "Deleting all spots\u2026", signal);
      const all = this.plugin.store.getSpots();
      const plan = this.alsoMedia ? classifyMediaFolder(this.app, this.plugin.settings, all) : null;
      this.close();
      progress.open();
      void (async () => {
        const media = plan?.owned ?? [];
        const totalWork = all.length + media.length;
        let trashed = 0;
        let mediaTrashed = 0;
        const failedNotes = [];
        const failedMedia = [];
        let cancelled = false;
        for (const spot of all) {
          if (signal.cancelled) {
            cancelled = true;
            break;
          }
          progress.update(trashed, totalWork, spot.name);
          try {
            await this.plugin.store.deleteSpot(spot.path);
            trashed++;
          } catch {
            failedNotes.push(spot.name);
          }
        }
        if (cancelled) {
          progress.finish();
          new import_obsidian34.Notice(
            `Cancelled after ${trashed} of ${all.length} spot notes \u2014 nothing else was touched.`,
            1e4
          );
          return;
        }
        for (const file of media) {
          if (signal.cancelled) {
            cancelled = true;
            break;
          }
          progress.update(trashed + mediaTrashed, totalWork, file.name);
          try {
            await this.app.fileManager.trashFile(file);
            mediaTrashed++;
          } catch {
            failedMedia.push(file.name);
          }
        }
        if (cancelled) {
          progress.finish();
          new import_obsidian34.Notice(
            `Cancelled after ${trashed} spot notes and ${mediaTrashed} of ${media.length} media files \u2014 the folder cleanup was skipped.`,
            1e4
          );
          return;
        }
        const root = this.app.vault.getFolderByPath(
          (0, import_obsidian34.normalizePath)(this.plugin.settings.spotsFolder)
        );
        if (root) {
          const sweep = async (folder) => {
            for (const child of [...folder.children]) {
              if (child instanceof import_obsidian34.TFolder) await sweep(child);
            }
            if (folder !== root && folder.children.length === 0) {
              await this.app.fileManager.trashFile(folder).catch(() => void 0);
            }
          };
          await sweep(root);
        }
        progress.finish();
        let message = `Deleted ${plural(trashed, "spot note")}${this.alsoMedia ? ` and ${plural(mediaTrashed, "media file")}` : ""} \u2014 all recoverable from the trash.`;
        if (failedNotes.length > 0) {
          message += ` ${plural(failedNotes.length, "note")} couldn't be trashed: ${failedNotes.slice(0, 5).join(", ")}.`;
        }
        if (failedMedia.length > 0) {
          message += ` ${plural(failedMedia.length, "media file")} couldn't be trashed: ${failedMedia.slice(0, 5).join(", ")}.`;
        }
        if (plan && plan.leftAlone.length > 0) {
          message += ` ${plural(plan.leftAlone.length, "file")} in ${plan.folderPath} ${plan.leftAlone.length === 1 ? "was" : "were"} left alone \u2014 linked from another note or not created by Food Spot.`;
        }
        new import_obsidian34.Notice(message, 1e4);
      })();
    });
    window.setTimeout(() => input.focus(), 0);
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/widgets/widgets.ts
var import_obsidian35 = require("obsidian");
var VIEWS = ["cards", "list", "table", "stat", "random", "shortlist"];
var STATS = ["visited-ratio", "counts", "top-cuisines"];
var SORT_KEYS2 = [
  "name",
  "rating",
  "external-rating",
  "price",
  "date-added",
  "last-visit",
  "visit-count"
];
var VALID_KEYS = [
  "view",
  "country",
  "city",
  "district",
  "cuisine",
  "status",
  "tag",
  "price",
  "minRating",
  "favorite",
  "limit",
  "sort",
  "direction",
  "stat"
];
function parseSource(source) {
  const params = { view: "cards" };
  const errors = [];
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) {
      errors.push(`"${line}" is not a "key: value" pair.`);
      continue;
    }
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    switch (key) {
      case "view":
        if (VIEWS.includes(value)) params.view = value;
        else errors.push(`view: "${value}" \u2014 valid views: ${VIEWS.join(", ")}.`);
        break;
      case "country":
      case "city":
      case "district":
      case "cuisine":
      case "tag":
        if (value) params[key] = value;
        else errors.push(`${key}: needs a value.`);
        break;
      case "status":
        if (value === "want-to-try" || value === "visited") params.status = value;
        else errors.push(`status: "${value}" \u2014 valid: want-to-try, visited.`);
        break;
      case "price": {
        const n = Number(value);
        if (Number.isInteger(n) && n >= 1 && n <= 4) params.price = n;
        else errors.push(`price: "${value}" \u2014 must be a whole number 1\u20134.`);
        break;
      }
      case "minRating": {
        const n = Number(value);
        if (!Number.isNaN(n) && n >= 0 && n <= 5) params.minRating = n;
        else errors.push(`minRating: "${value}" \u2014 must be a number 0\u20135.`);
        break;
      }
      case "favorite":
        if (value === "true" || value === "false") params.favorite = value === "true";
        else errors.push(`favorite: "${value}" \u2014 must be true or false.`);
        break;
      case "limit": {
        const n = Number(value);
        if (Number.isInteger(n) && n > 0) params.limit = n;
        else errors.push(`limit: "${value}" \u2014 must be a positive whole number.`);
        break;
      }
      case "sort":
        if (SORT_KEYS2.includes(value)) params.sort = value;
        else errors.push(`sort: "${value}" \u2014 valid: ${SORT_KEYS2.join(", ")}.`);
        break;
      case "direction":
        if (value === "asc" || value === "desc") params.direction = value;
        else errors.push(`direction: "${value}" \u2014 must be asc or desc.`);
        break;
      case "stat":
        if (STATS.includes(value)) params.stat = value;
        else errors.push(`stat: "${value}" \u2014 valid: ${STATS.join(", ")}.`);
        break;
      default:
        errors.push(`Unknown key "${key}".`);
    }
  }
  return { params, errors };
}
function eq(a, b) {
  return (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();
}
function applyFilters(spots, p) {
  return spots.filter((s) => {
    if (p.country && !eq(s.country, p.country)) return false;
    if (p.city && !eq(s.city, p.city)) return false;
    if (p.district && !eq(s.district, p.district)) return false;
    if (p.cuisine && !s.cuisines.some((c) => eq(c, p.cuisine))) return false;
    if (p.tag && !s.tags.some((t) => eq(t, p.tag))) return false;
    if (p.status && s.status !== p.status) return false;
    if (p.price !== void 0 && s.price !== p.price) return false;
    if (p.minRating !== void 0 && p.minRating > 0 && s.rating !== void 0 && s.rating < p.minRating)
      return false;
    if (p.favorite !== void 0 && s.favorite !== p.favorite) return false;
    return true;
  });
}
function defaultSortKey(view) {
  return view === "list" || view === "shortlist" || view === "table" ? "name" : "date-added";
}
function renderError(el, errors) {
  const box = el.createDiv({ cls: "fs-widget-error" });
  const head = box.createDiv({ cls: "fs-widget-error-title" });
  const icon = head.createSpan();
  (0, import_obsidian35.setIcon)(icon, "alert-triangle");
  head.createSpan({ text: "Food Spot widget \u2014 invalid block" });
  const ul = box.createEl("ul");
  for (const e of errors) ul.createEl("li", { text: e });
  box.createDiv({
    cls: "fs-widget-error-help",
    text: `Valid keys: ${VALID_KEYS.join(", ")}. Views: ${VIEWS.join(", ")}. Stats: ${STATS.join(", ")}. Sort keys: ${SORT_KEYS2.join(", ")}.`
  });
}
function widgetEmpty(el, text) {
  el.createDiv({ cls: "fs-widget-empty", text });
}
function metaText(s) {
  const meta = [];
  if (s.city) meta.push(s.city);
  if (s.rating !== void 0) meta.push(`\u2605 ${s.rating}`);
  else if (s.external.googleRating !== void 0) meta.push(`G ${s.external.googleRating}`);
  return meta.join(" \xB7 ");
}
function renderCards(plugin, el, items) {
  if (!items.length) {
    widgetEmpty(el, "No spots match this widget's filters.");
    return;
  }
  const grid = el.createDiv({ cls: "fs-widget-cards" });
  for (const s of items) buildSpotCard(grid, s, { plugin });
}
function renderList(plugin, el, items) {
  if (!items.length) {
    widgetEmpty(el, "No spots match this widget's filters.");
    return;
  }
  const list = el.createDiv({ cls: "fs-widget-list" });
  for (const s of items) {
    const row = list.createDiv({ cls: "fs-widget-list-row" });
    row.createSpan({ cls: "fs-widget-name", text: s.name });
    row.createSpan({ cls: "fs-widget-meta", text: metaText(s) });
    row.onclick = () => openDetailModal(plugin, s.path);
  }
}
function renderTable(plugin, el, items) {
  if (!items.length) {
    widgetEmpty(el, "No spots match this widget's filters.");
    return;
  }
  const wrap = el.createDiv({ cls: "fs-widget-tablewrap" });
  const table = wrap.createEl("table", { cls: "fs-widget-table" });
  const thr = table.createEl("thead").createEl("tr");
  for (const h of ["Name", "Cuisine", "City", "My \u2605", "Visits"]) thr.createEl("th", { text: h });
  const tbody = table.createEl("tbody");
  for (const s of items) {
    const tr = tbody.createEl("tr");
    tr.createEl("td", { text: s.name, cls: "fs-widget-name" });
    tr.createEl("td", { text: s.cuisines.join(", ") });
    tr.createEl("td", { text: s.city ?? "" });
    tr.createEl("td", { text: s.rating !== void 0 ? String(s.rating) : "\u2014" });
    tr.createEl("td", { text: String(s.visitCount) });
    tr.onclick = () => openDetailModal(plugin, s.path);
  }
}
function renderShortlist(plugin, el, items) {
  if (!items.length) {
    widgetEmpty(el, "Nothing on this shortlist yet \u2014 add matching want-to-try spots.");
    return;
  }
  const box = el.createDiv({ cls: "fs-widget-shortlist" });
  for (const s of items) {
    const row = box.createDiv({ cls: "fs-widget-shortlist-row" });
    const icon = row.createSpan();
    (0, import_obsidian35.setIcon)(icon, s.status === "visited" ? "check-circle-2" : "circle");
    row.createSpan({ cls: "fs-widget-name", text: s.name });
    if (s.city) row.createSpan({ cls: "fs-widget-shortlist-city", text: s.city });
    row.onclick = () => openDetailModal(plugin, s.path);
  }
}
function renderRandom(plugin, el, pool, entry) {
  const wrap = el.createDiv({ cls: "fs-widget-random" });
  const btn = wrap.createEl("button", { cls: "fs-widget-shuffle" });
  const btnIcon = btn.createSpan();
  (0, import_obsidian35.setIcon)(btnIcon, "shuffle");
  btn.createSpan({ text: "Shuffle" });
  const slot = wrap.createDiv({ cls: "fs-widget-random-slot" });
  if (!pool.length) {
    widgetEmpty(slot, "No spots match this widget's filters \u2014 nothing to pick from.");
    btn.disabled = true;
    return;
  }
  const show = (s) => {
    entry.state.randomPath = s.path;
    slot.empty();
    buildSpotCard(slot, s, { plugin, compact: true });
  };
  const current = pool.find((s) => s.path === entry.state.randomPath);
  show(current ?? pool[Math.floor(Math.random() * pool.length)]);
  btn.onclick = () => {
    if (pool.length <= 1) return;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick.path === entry.state.randomPath) {
      pick = pool[(pool.indexOf(pick) + 1) % pool.length];
    }
    show(pick);
  };
}
var MINI_RING_R = 38;
var MINI_RING_C = 2 * Math.PI * MINI_RING_R;
function renderStat(el, stat, items) {
  const box = el.createDiv({ cls: "fs-widget-stat" });
  if (!items.length) {
    widgetEmpty(box, "No spots match this widget's filters yet.");
    return;
  }
  if (stat === "visited-ratio") {
    const total = items.length;
    const visited = items.filter((s) => s.status === "visited").length;
    const pct = Math.round(visited / total * 100);
    const wrap = box.createDiv({ cls: "fs-widget-ring-wrap" });
    const svg = wrap.createSvg("svg", {
      attr: { viewBox: "0 0 100 100", width: 100, height: 100 }
    });
    svg.createSvg("circle", {
      cls: "fs-widget-ring-track",
      attr: { cx: 50, cy: 50, r: MINI_RING_R }
    });
    const prog = svg.createSvg("circle", {
      cls: "fs-widget-ring-progress",
      attr: {
        cx: 50,
        cy: 50,
        r: MINI_RING_R,
        transform: "rotate(-90 50 50)",
        "stroke-dasharray": MINI_RING_C.toFixed(2),
        "stroke-dashoffset": MINI_RING_C.toFixed(2)
      }
    });
    const center = wrap.createDiv({ cls: "fs-widget-ring-center" });
    center.createDiv({ cls: "fs-widget-ring-value", text: `${pct}%` });
    const target = (MINI_RING_C * (1 - visited / total)).toFixed(2);
    window.requestAnimationFrame(
      () => window.requestAnimationFrame(() => prog.setAttribute("stroke-dashoffset", target))
    );
    box.createDiv({
      cls: "fs-widget-ring-caption",
      text: `${visited} of ${total} visited`
    });
    return;
  }
  if (stat === "counts") {
    const strip = box.createDiv({ cls: "fs-widget-strip" });
    const seg = (value, label) => {
      const s = strip.createDiv({ cls: "fs-widget-strip-seg" });
      s.createDiv({ cls: "fs-widget-strip-value", text: String(value) });
      s.createDiv({ cls: "fs-widget-strip-label", text: label });
    };
    seg(items.length, "spots");
    seg(new Set(items.map((s) => s.country.trim()).filter(Boolean)).size, "countries");
    seg(new Set(items.map((s) => (s.city ?? "").trim()).filter(Boolean)).size, "cities");
    seg(
      new Set(items.flatMap((s) => s.cuisines.map((c) => c.trim())).filter(Boolean)).size,
      "cuisines"
    );
    seg(items.reduce((n, s) => n + s.visitCount, 0), "visits");
    return;
  }
  const counts = /* @__PURE__ */ new Map();
  for (const s of items) {
    for (const c of s.cuisines) {
      const key = c.trim();
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  if (!counts.size) {
    widgetEmpty(box, "No cuisines recorded on the matching spots yet.");
    return;
  }
  box.createDiv({ cls: "fs-widget-stat-title", text: "Top cuisines" });
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);
  const max = Math.max(1, ...top.map(([, n]) => n));
  for (const [label, n] of top) {
    const row = box.createDiv({ cls: "fs-widget-bar-row" });
    row.createSpan({ text: label });
    row.createSpan({ cls: "fs-widget-meta", text: String(n) });
    const track = box.createDiv({ cls: "fs-widget-bar-track" });
    const fill = track.createDiv({ cls: "fs-widget-bar-fill" });
    fill.style.width = `${Math.round(n / max * 100)}%`;
  }
}
function renderWidget(plugin, el, entry) {
  releaseLazyPhotos(el);
  el.empty();
  if (entry.errors.length) {
    renderError(el, entry.errors);
    return;
  }
  const p = { ...entry.params };
  if (p.view === "shortlist" && p.status === void 0) p.status = "want-to-try";
  const all = plugin.store.getSpots();
  let items = applyFilters(all, p);
  const key = p.sort ?? defaultSortKey(p.view);
  const direction = p.direction ?? (key === "name" ? "asc" : "desc");
  items = sortSpots(items, { key, direction });
  const cap = p.limit ?? (p.view === "cards" ? 24 : 50);
  const limited = p.view === "stat" || p.view === "random" ? items : items.slice(0, cap);
  switch (p.view) {
    case "cards":
      renderCards(plugin, el, limited);
      break;
    case "list":
      renderList(plugin, el, limited);
      break;
    case "table":
      renderTable(plugin, el, limited);
      break;
    case "shortlist":
      renderShortlist(plugin, el, limited);
      break;
    case "random":
      renderRandom(plugin, el, items, entry);
      break;
    case "stat":
      renderStat(el, p.stat ?? "visited-ratio", items);
      break;
    default:
      renderCards(plugin, el, limited);
  }
}
function registerWidgets(plugin) {
  const registry = /* @__PURE__ */ new Map();
  plugin.registerMarkdownCodeBlockProcessor(CODE_BLOCK_LANG, (source, el, ctx) => {
    el.addClass("fs-widget");
    const { params, errors } = parseSource(source);
    const entry = { params, errors, state: {} };
    registry.set(el, entry);
    const child = new import_obsidian35.MarkdownRenderChild(el);
    child.onunload = () => {
      registry.delete(el);
      releaseLazyPhotos(el);
    };
    ctx.addChild(child);
    renderWidget(plugin, el, entry);
  });
  plugin.registerDomEvent(
    document,
    DATA_CHANGED_EVENT,
    () => {
      for (const [el, entry] of registry) {
        if (!el.isConnected) {
          registry.delete(el);
          releaseLazyPhotos(el);
          continue;
        }
        renderWidget(plugin, el, entry);
      }
    }
  );
}

// src/widgets/insertPalette.ts
var import_obsidian36 = require("obsidian");
function mostCommon(values, fallback) {
  const counts = /* @__PURE__ */ new Map();
  for (const v of values) {
    const k = v.trim();
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let best = fallback;
  let bestN = 0;
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}
function fence(lines) {
  return "```foodspot\n" + lines.join("\n") + "\n```\n";
}
var VARIANTS = [
  {
    label: "Cards \u2014 want-to-try in a city",
    make: (c) => fence([
      "view: cards",
      "status: want-to-try",
      `city: ${c.city}`,
      "sort: date-added",
      "direction: desc",
      "limit: 12"
    ])
  },
  {
    label: "Random \u2014 where do we eat tonight?",
    make: () => fence(["view: random", "status: want-to-try"])
  },
  {
    label: "Stat \u2014 visited ratio",
    make: () => fence(["view: stat", "stat: visited-ratio"])
  },
  {
    label: "Table \u2014 top rated",
    make: () => fence([
      "view: table",
      "status: visited",
      "minRating: 4",
      "sort: rating",
      "direction: desc",
      "limit: 10"
    ])
  },
  {
    label: "Shortlist \u2014 city wishlist",
    make: (c) => fence(["view: shortlist", `city: ${c.city}`, "limit: 15"])
  },
  {
    label: "List \u2014 by cuisine",
    make: (c) => fence(["view: list", `cuisine: ${c.cuisine}`, "sort: name", "direction: asc"])
  }
];
var WidgetPaletteModal = class extends import_obsidian36.FuzzySuggestModal {
  constructor(plugin, editor) {
    super(plugin.app);
    this.plugin = plugin;
    this.editor = editor;
    this.setPlaceholder("Insert a Food Spot widget\u2026");
  }
  getItems() {
    return VARIANTS;
  }
  getItemText(item) {
    return item.label;
  }
  onChooseItem(item) {
    let spots = [];
    try {
      spots = this.plugin.store.getSpots();
    } catch {
    }
    const ctx = {
      city: mostCommon(spots.map((s) => s.city ?? ""), "Amsterdam"),
      cuisine: mostCommon(spots.flatMap((s) => s.cuisines), "Italian")
    };
    this.editor.replaceSelection(item.make(ctx));
  }
};
function openWidgetPalette(plugin, editor) {
  new WidgetPaletteModal(plugin, editor).open();
}

// src/ui/modals/enrich.ts
var import_obsidian37 = require("obsidian");
function openEnrichModal(plugin, preset) {
  new EnrichOptionsModal(plugin, preset).open();
}
function registerEnrichEntry(plugin) {
  plugin.openEnrichModal = (p) => openEnrichModal(plugin, p);
}
var FIELD_LABELS = {
  photo: "Photo (first Google photo, saved into the media folder)",
  ratings: "Public ratings (Google + linked rating sources)",
  coords: "Coordinates",
  address: "Address",
  menu: "Menu link (discovered on the spot's website)",
  discoverSources: "Discover rating sources (Eet.nu rating + Facebook link via the Eet.nu API \u2014 no key needed)"
};
var SCOPE_LABELS = {
  all: "All spots",
  missing: "Only spots missing a selected field",
  filter: "Current Spots-tab filter",
  "missing-coords": "Only spots without coordinates"
};
var SCOPE_ORDER = ["all", "missing", "filter", "missing-coords"];
var EnrichOptionsModal = class extends import_obsidian37.Modal {
  constructor(plugin, preset) {
    super(plugin.app);
    this.plugin = plugin;
    this.overwrite = false;
    this.hasKey = plugin.importer.hasGoogleKey();
    this.fields = {
      photo: this.hasKey,
      ratings: this.hasKey,
      coords: this.hasKey,
      address: this.hasKey,
      menu: true,
      // Off by default: 6 web searches per spot is a deliberate opt-in.
      discoverSources: false
    };
    this.hasFilterHook = typeof this.plugin.getCurrentFilteredPaths === "function";
    const preferred = preset?.scope ?? "all";
    this.spotScope = preferred === "filter" && !this.hasFilterHook ? "all" : preferred;
  }
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-enrich-modal");
    this.titleEl.setText("Enrich from Google");
    if (!this.hasKey) {
      const banner = this.contentEl.createDiv({ cls: "fs-import-warnings" });
      const icon = banner.createSpan({ cls: "fs-dup-icon" });
      (0, import_obsidian37.setIcon)(icon, "key-round");
      banner.createDiv({
        cls: "fs-import-warning",
        text: "The Google-backed fields need a Places API key \u2014 add one under Settings \u2192 Food Spot \u2192 Import. Menu-link discovery reads each spot's own website and works without a key."
      });
    } else {
      this.contentEl.createEl("p", {
        cls: "fs-import-hint",
        text: "Fetches the selected fields from Google Places for every spot in scope. Existing values are kept unless you enable overwrite."
      });
    }
    const fieldsWrap = this.contentEl.createDiv({ cls: "fs-enrich-fields" });
    for (const key of Object.keys(FIELD_LABELS)) {
      const label = fieldsWrap.createEl("label", { cls: "fs-checkbox-label" });
      const cb = label.createEl("input", { type: "checkbox" });
      cb.checked = this.fields[key] === true;
      cb.disabled = !this.hasKey && key !== "menu" && key !== "discoverSources";
      label.createSpan({ text: FIELD_LABELS[key] });
      cb.addEventListener("change", () => {
        this.fields[key] = cb.checked;
        this.updateStart();
      });
    }
    const owLabel = this.contentEl.createEl("label", {
      cls: "fs-checkbox-label fs-enrich-overwrite"
    });
    const owCb = owLabel.createEl("input", { type: "checkbox" });
    owCb.checked = this.overwrite;
    owLabel.createSpan({ text: "Overwrite existing values (default: fill gaps only)" });
    owCb.addEventListener("change", () => {
      this.overwrite = owCb.checked;
    });
    const scopeWrap = this.contentEl.createDiv({ cls: "fs-field fs-enrich-scope" });
    scopeWrap.createEl("label", { cls: "fs-field-label", text: "Which spots" });
    const select = scopeWrap.createEl("select", { cls: "dropdown" });
    for (const scope of SCOPE_ORDER) {
      const filterUnavailable = scope === "filter" && !this.hasFilterHook;
      const opt = select.createEl("option", {
        text: filterUnavailable ? `${SCOPE_LABELS[scope]} (open the Spots tab first)` : SCOPE_LABELS[scope]
      });
      opt.value = scope;
      opt.disabled = filterUnavailable;
      if (scope === this.spotScope) opt.selected = true;
    }
    select.addEventListener("change", () => {
      this.spotScope = select.value;
      this.updateStart();
    });
    if (this.hasKey) {
      const quota = this.contentEl.createDiv({ cls: "fs-enrich-quota" });
      const qIcon = quota.createSpan({ cls: "fs-info-icon" });
      (0, import_obsidian37.setIcon)(qIcon, "info");
      quota.createSpan({
        text: "Uses your Google API quota \u2014 roughly 3 Google API calls per spot."
      });
    }
    this.msgEl = this.contentEl.createDiv({ cls: "fs-field-msg" });
    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    this.startBtn = buttons.createEl("button", { cls: "mod-cta" });
    this.startBtn.type = "button";
    this.startBtn.addEventListener("click", () => this.start());
    this.updateStart();
  }
  /** Spots in the selected scope, given the currently selected fields. */
  resolveSpots() {
    const all = this.plugin.store.getSpots();
    switch (this.spotScope) {
      case "all":
        return all;
      case "missing-coords":
        return all.filter((s) => !s.coordinates);
      case "missing":
        return all.filter((s) => this.missingAny(s));
      case "filter": {
        const paths = this.plugin.getCurrentFilteredPaths?.();
        if (!paths) return all;
        const wanted = new Set(paths);
        return all.filter((s) => wanted.has(s.path));
      }
    }
  }
  /** True when the spot lacks at least one of the REQUESTED fields. */
  missingAny(s) {
    const f = this.fields;
    return f.photo === true && !s.photo || f.ratings === true && s.external.googleRating === void 0 || f.coords === true && !s.coordinates || f.address === true && !s.address || f.menu === true && !s.menu || f.discoverSources === true && (s.external.tripadvisorRating === void 0 || s.external.theforkRating === void 0);
  }
  updateStart() {
    const anyField = Object.values(this.fields).some(Boolean);
    const f = this.fields;
    const keyBlocked = !this.hasKey && (f.photo || f.ratings || f.coords || f.address);
    const n = anyField ? this.resolveSpots().length : 0;
    this.startBtn.setText(`Enrich ${n} spot${n === 1 ? "" : "s"}`);
    this.startBtn.disabled = keyBlocked || !anyField || n === 0;
    if (keyBlocked) {
      this.startBtn.title = "Add a Google Places API key first.";
      this.msgEl.setText("");
    } else if (!anyField) {
      this.msgEl.setText("Pick at least one field to fetch.");
    } else if (n === 0) {
      this.msgEl.setText("No spots match this scope \u2014 nothing to enrich.");
    } else {
      this.startBtn.title = "";
      this.msgEl.setText("");
    }
  }
  start() {
    const spots = this.resolveSpots();
    if (spots.length === 0 || !Object.values(this.fields).some(Boolean)) return;
    const opts = { ...this.fields, overwrite: this.overwrite };
    this.close();
    void runBulkEnrich(this.plugin, spots, opts);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var EnrichProgressModal = class extends import_obsidian37.Modal {
  constructor(plugin, total, signal) {
    super(plugin.app);
    this.total = total;
    this.signal = signal;
  }
  onOpen() {
    this.modalEl.addClass("fs-modal", "fs-enrich-progress-modal");
    this.titleEl.setText("Enriching from Google\u2026");
    const track = this.contentEl.createDiv({ cls: "fs-progress-track" });
    this.fillEl = track.createDiv({ cls: "fs-progress-fill" });
    const meta = this.contentEl.createDiv({ cls: "fs-enrich-progress-meta" });
    this.countEl = meta.createSpan({ cls: "fs-enrich-count", text: `0 / ${this.total}` });
    this.nameEl = meta.createSpan({ cls: "fs-enrich-current" });
    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    this.cancelBtn = buttons.createEl("button", { text: "Cancel" });
    this.cancelBtn.type = "button";
    this.cancelBtn.addEventListener("click", () => {
      this.signal.cancelled = true;
      this.cancelBtn.disabled = true;
      this.cancelBtn.setText("Cancelling\u2026");
    });
  }
  update(done, total, current) {
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    this.fillEl.style.width = `${pct}%`;
    this.countEl.setText(`${done} / ${total}`);
    this.nameEl.setText(current);
  }
  onClose() {
    this.signal.cancelled = true;
    this.contentEl.empty();
  }
};
async function runBulkEnrich(plugin, spots, opts) {
  const signal = { cancelled: false };
  const mount = plugin.mountEnrichProgress;
  const inline = mount?.(signal) ?? null;
  let modal = null;
  if (inline === null) {
    modal = new EnrichProgressModal(plugin, spots.length, signal);
    modal.open();
  }
  const onProgress = (done, total, current) => {
    inline?.update(done, total, current);
    modal?.update(done, total, current);
  };
  let result;
  try {
    result = await plugin.importer.bulkEnrich(spots, opts, onProgress, signal);
  } catch (e) {
    inline?.finish();
    modal?.close();
    new import_obsidian37.Notice(`Enrichment failed \u2014 ${errorMessage9(e)}`);
    return;
  }
  const cancelled = signal.cancelled;
  inline?.finish();
  modal?.close();
  const parts = [`${result.updated} updated`, `${result.skipped} skipped`];
  if (result.failed.length > 0) {
    const names = result.failed.slice(0, 5).join(", ");
    parts.push(`${result.failed.length} failed (${names}${result.failed.length > 5 ? ", \u2026" : ""})`);
  }
  new import_obsidian37.Notice(
    `${cancelled ? "Enrichment cancelled" : "Enrichment done"} \u2014 ${parts.join(" \xB7 ")}.`,
    1e4
  );
}
function errorMessage9(e) {
  return e instanceof Error ? e.message : String(e);
}

// src/diagnostics.ts
var import_obsidian38 = require("obsidian");
async function dumpDashboardDiagnostics(plugin) {
  const lines = [];
  const push = (s) => lines.push(s);
  push(`# Food Spot dashboard diagnostics`);
  push(`- generated: ${(/* @__PURE__ */ new Date()).toISOString()}`);
  push(`- obsidian: ${plugin.app.apiVersion ?? "unknown"} \xB7 plugin: ${plugin.manifest.version}`);
  push(`- platform DPR: ${window.devicePixelRatio}`);
  const dashes = Array.from(document.querySelectorAll(".fs-dashboard"));
  const views = Array.from(document.querySelectorAll(".fs-view"));
  push(`- .fs-view count: ${views.length} \xB7 .fs-dashboard count: ${dashes.length}`);
  const sheetHits = Array.from(document.styleSheets).filter((ss) => {
    try {
      return Array.from(ss.cssRules).some(
        (r) => r.cssText.includes(".fs-stat-cards") || r.cssText.includes(".fs-ring-wrap")
      );
    } catch {
      return false;
    }
  });
  push(`- stylesheets containing .fs-stat-cards/.fs-ring-wrap rules: ${sheetHits.length}`);
  for (const ss of sheetHits) {
    const owner = ss.ownerNode instanceof HTMLElement ? ss.ownerNode : null;
    let ruleText = "";
    try {
      ruleText = Array.from(ss.cssRules).filter((r) => r.cssText.startsWith(".fs-stat-cards") || r.cssText.startsWith(".fs-ring-wrap")).map((r) => r.cssText).join(" | ") || "(rules present but not top-level)";
    } catch {
      ruleText = "(unreadable)";
    }
    push(`  - sheet owner: <${owner?.tagName.toLowerCase() ?? "?"}${owner?.id ? "#" + owner.id : ""}> rules: ${ruleText.slice(0, 400)}`);
  }
  const probe = (sel, props) => {
    const el = document.querySelector(sel);
    if (!el) {
      push(`- ${sel}: NOT IN DOM`);
      return;
    }
    const cs = getComputedStyle(el);
    const vals = props.map((p) => `${p}=${cs.getPropertyValue(p)}`).join(" \xB7 ");
    const rect = el.getBoundingClientRect();
    push(`- ${sel}: ${vals} \xB7 rect=${Math.round(rect.width)}x${Math.round(rect.height)}`);
  };
  probe(".fs-dashboard", ["display", "overflow-y", "flex"]);
  probe(".fs-stat-cards", ["display", "grid-template-columns", "gap"]);
  probe(".fs-stat-card", ["display", "flex-direction", "align-items", "height"]);
  probe(".fs-ring-wrap", ["position", "width", "height"]);
  probe(".fs-ring", ["display", "width", "height"]);
  probe(".fs-ring-center", ["position", "inset", "display"]);
  probe(".fs-error-panel", ["display"]);
  const errPanels = Array.from(document.querySelectorAll(".fs-error-panel"));
  push(`- error panels visible: ${errPanels.length}`);
  for (const p of errPanels) push(`  - ${p.textContent?.slice(0, 200)}`);
  const dash = dashes[0] ?? views[0];
  push(``);
  push(`## DOM dump (${dashes[0] ? ".fs-dashboard" : "fallback: whole .fs-view"}, truncated 30k)`);
  push("```html");
  push(dash ? dash.outerHTML.slice(0, 3e4) : "(no .fs-view in DOM)");
  push("```");
  const folder = (0, import_obsidian38.normalizePath)(plugin.settings.spotsFolder || "Food Spot");
  await ensureFolder(plugin.app, folder);
  const path = (0, import_obsidian38.normalizePath)(`${folder}/foodspot-diagnostics.md`);
  const existing = plugin.app.vault.getFileByPath(path);
  if (existing) await plugin.app.vault.modify(existing, lines.join("\n"));
  else await plugin.app.vault.create(path, lines.join("\n"));
  new import_obsidian38.Notice(`Food Spot: diagnostics written to ${path}`);
}

// src/main.ts
var FoodSpotPlugin = class extends import_obsidian39.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
    /**
     * Serialized: each save's loadData→saveData read-modify-write runs after
     * the previous one finished. Interleaved cycles could resurrect stale
     * data.json content (e.g. the legacy `spots` blob migration just removed).
     */
    this.saveChain = Promise.resolve();
    this.discoveringAll = false;
  }
  async onload() {
    await this.loadSettings();
    this.store = new SpotStore(this);
    this.importer = new ImportPipeline(this);
    this.registerView(VIEW_TYPE, (leaf) => new FoodSpotView(leaf, this));
    this.addRibbonIcon(PLUGIN_ICON, "Open Food Spot", () => this.activateView());
    this.addSettingTab(new FoodSpotSettingTab(this.app, this));
    registerWidgets(this);
    registerEnrichEntry(this);
    this.addCommand({
      id: "open-view",
      name: "Open Food Spot",
      callback: () => this.activateView()
    });
    this.addCommand({
      id: "add-spot",
      name: "Add spot",
      callback: () => openAddChooser(this)
    });
    this.addCommand({
      id: "log-visit",
      name: "Log a visit",
      callback: () => openLogVisitPicker(this)
    });
    this.addCommand({
      id: "import-from-clipboard-url",
      name: "Import spot from clipboard URL",
      callback: () => importFromClipboard(this)
    });
    this.addCommand({
      id: "import-list",
      name: "Import a list of restaurant names",
      callback: () => openListImportModal(this)
    });
    this.addCommand({
      id: "city-guide",
      name: "Create a city guide",
      callback: () => openCityGuideModal(this)
    });
    this.addCommand({
      id: "dish-gallery",
      name: "Browse dish photos",
      callback: () => openGalleryModal(this)
    });
    this.addCommand({
      id: "insert-widget",
      name: "Insert widget",
      editorCallback: (editor) => openWidgetPalette(this, editor)
    });
    this.addCommand({
      id: "enrich-all",
      name: "Enrich all spots from Google",
      callback: () => this.openEnrichModal?.()
    });
    this.addCommand({
      id: "discover-sources-all",
      name: "Discover rating sources for all spots",
      callback: () => void this.discoverSourcesForAll()
    });
    this.addCommand({
      id: "dump-dashboard-diagnostics",
      name: "Dump dashboard diagnostics",
      callback: () => void dumpDashboardDiagnostics(this)
    });
    this.app.workspace.onLayoutReady(async () => {
      await this.store.initialize();
    });
  }
  async onunload() {
    this.store?.dispose();
    disposePhotoObserver();
  }
  async loadSettings() {
    const raw = await this.loadData() ?? {};
    const stored = raw.settings ?? raw;
    const OLD_STATUS_DEFAULTS = {
      wantToTry: "#e0a83c",
      visited: "#4caf7d",
      favorite: "#e5484d"
    };
    const storedColors = { ...stored.statusColors ?? {} };
    for (const [k, oldHex] of Object.entries(OLD_STATUS_DEFAULTS)) {
      if ((storedColors[k] ?? "").toLowerCase() === oldHex) delete storedColors[k];
    }
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...stored,
      apiKeys: { ...DEFAULT_SETTINGS.apiKeys, ...stored.apiKeys ?? {} },
      statusColors: { ...DEFAULT_SETTINGS.statusColors, ...storedColors },
      filterState: { ...DEFAULT_SETTINGS.filterState, ...stored.filterState ?? {} },
      ratingTiers: Array.isArray(stored.ratingTiers) && stored.ratingTiers.length === 5 ? stored.ratingTiers : DEFAULT_SETTINGS.ratingTiers
    };
  }
  async saveSettings() {
    this.saveChain = this.saveChain.catch(() => void 0).then(async () => {
      const raw = await this.loadData() ?? {};
      raw.settings = this.settings;
      await this.saveData(raw);
    });
    return this.saveChain;
  }
  /** Sequential source discovery over the whole library, with progress Notices. */
  async discoverSourcesForAll() {
    if (this.discoveringAll) {
      new import_obsidian39.Notice("Source discovery is already running.");
      return;
    }
    this.discoveringAll = true;
    const log = [`# Food Spot \u2014 source discovery run ${(/* @__PURE__ */ new Date()).toISOString()}`];
    try {
      let waited = 0;
      while (this.store.getSpots().length === 0 && waited < 2e4) {
        await new Promise((r) => setTimeout(r, 500));
        waited += 500;
      }
      const spots = this.store.getSpots();
      if (spots.length === 0) {
        new import_obsidian39.Notice("No spots indexed yet \u2014 open the Food Spot view first, then retry.");
        log.push("Aborted: index was empty after 20s.");
        return;
      }
      let attachedCount = 0;
      let done = 0;
      new import_obsidian39.Notice(`Discovering rating sources for ${spots.length} spots\u2026`);
      for (const spot of spots) {
        try {
          const res = await this.importer.discoverSources(spot);
          if (Object.keys(res.patch).length > 0) {
            await this.store.updateSpot(spot.path, {
              external: { ...spot.external, ...res.patch }
            });
            attachedCount++;
          }
          const skips = res.skipped.filter((s) => s.label === "Eet.nu").map((s) => `${s.label}: ${s.reason}`).join("; ");
          log.push(
            `- ${spot.name}: ${res.attached.length > 0 ? `attached ${res.attached.join(", ")}` : skips || "nothing to do"}`
          );
        } catch (e) {
          log.push(`- ${spot.name}: ERROR ${e instanceof Error ? e.message : String(e)}`);
        }
        done++;
        if (done % 20 === 0)
          new import_obsidian39.Notice(`Source discovery: ${done}/${spots.length} (${attachedCount} updated)\u2026`);
        await new Promise((r) => setTimeout(r, 700));
      }
      log.splice(1, 0, `${attachedCount} of ${spots.length} spots updated.`);
      new import_obsidian39.Notice(
        `Source discovery finished: ${attachedCount} of ${spots.length} spots got new sources.`,
        1e4
      );
    } finally {
      this.discoveringAll = false;
      const folder = this.settings.spotsFolder || "Food Spot";
      await ensureFolder(this.app, folder);
      const path = `${folder}/foodspot-discovery-log.md`;
      const existing = this.app.vault.getFileByPath(path);
      const content = log.join("\n");
      if (existing) await this.app.vault.modify(existing, content);
      else await this.app.vault.create(path, content).catch(() => void 0);
    }
  }
  async activateView(tab) {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
    if (tab) {
      const view = leaf.view;
      if (view instanceof FoodSpotView) view.setActiveTab(tab);
    }
  }
};
/*! Bundled license information:

leaflet/dist/leaflet-src.js:
  (* @preserve
   * Leaflet 1.9.4, a JS library for interactive maps. https://leafletjs.com
   * (c) 2010-2023 Vladimir Agafonkin, (c) 2010-2011 CloudMade
   *)
*/
