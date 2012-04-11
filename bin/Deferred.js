
/* 
Standalone Deferred
Copyright 2012 Otto Vehviläinen 
Released under MIT license
*/

(function() {
  var Promise, flatten, isObservable,
    __slice = Array.prototype.slice;

  if (!Array.prototype.forEach) throw "Deferred requires Array.forEach";

  isObservable = function(obj) {
    return typeof result === 'object' && (result.constructor.name === 'Deferred' || result.constructor.name === 'Promise');
  };

  flatten = function(args) {
    var flatted;
    if (!args) return [];
    flatted = [];
    args.forEach(function(item) {
      if (item) {
        if (typeof item === 'function') {
          return flatted.push(item);
        } else {
          return args.forEach(function(fn) {
            if (fn) return flatted.push(fn);
          });
        }
      }
    });
    return flatted;
  };

  Promise = (function() {

    Promise.prototype._deferred = null;

    function Promise(deferred) {
      this._deferred = deferred;
    }

    Promise.prototype.always = function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      (_ref = this._deferred).always.apply(_ref, args);
      return this;
    };

    Promise.prototype.done = function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      (_ref = this._deferred).done.apply(_ref, args);
      return this;
    };

    Promise.prototype.fail = function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      (_ref = this._deferred).fail.apply(_ref, args);
      return this;
    };

    Promise.prototype.state = function() {
      return this._deferred.state();
    };

    Promise.prototype.then = function(done, fail) {
      this._deferred.then(done, fail);
      return this;
    };

    return Promise;

  })();

  window.Deferred = (function() {

    function Deferred(fn) {
      this._state = 'pending';
      if (typeof fn === 'function') fn.call(this, this);
    }

    Deferred.prototype.always = function() {
      var args, functions, _ref,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 0) return;
      functions = flatten(args);
      if (this._state !== 'pending') {
        functions.forEach(function(fn) {
          return fn.apply(_this._context, _this._withArguments);
        });
      } else {
        this._alwaysCallbacks || (this._alwaysCallbacks = []);
        (_ref = this._alwaysCallbacks).push.apply(_ref, functions);
      }
      return this;
    };

    Deferred.prototype.done = function() {
      var args, functions, _ref,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 0) return;
      functions = flatten(args);
      if (this._state === 'resolved') {
        functions.forEach(function(fn) {
          return fn.apply(_this._context, _this._withArguments);
        });
      } else if (this._state === 'pending') {
        this._doneCallbacks || (this._doneCallbacks = []);
        (_ref = this._doneCallbacks).push.apply(_ref, functions);
      }
      return this;
    };

    Deferred.prototype.fail = function() {
      var args, functions, _ref,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 0) return;
      functions = flatten(args);
      if (this._state === 'rejected') {
        functions.forEach(function(fn) {
          return fn.apply(_this._context, _this._withArguments);
        });
      } else if (this._state === 'pending') {
        this._failCallbacks || (this._failCallbacks = []);
        (_ref = this._failCallbacks).push.apply(_ref, functions);
      }
      return this;
    };

    Deferred.prototype.pipe = function(doneFilter, failFilter) {
      var def;
      def = new Deferred();
      this.done(function() {
        var args, result, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (typeof doneFilter === 'undefined' || doneFilter === null) {
          return (_ref = def.resolveWith).call.apply(_ref, [def, this].concat(__slice.call(args)));
        } else {
          result = doneFilter.apply(this, args);
          if (isObservable(result)) {
            return result.done(function() {
              var doneArgs, _ref2;
              doneArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return (_ref2 = def.resolveWith).call.apply(_ref2, [def, this].concat(__slice.call(doneArgs)));
            }).fail(function() {
              var failArgs, _ref2;
              failArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return (_ref2 = def.rejectWith).call.apply(_ref2, [def, this].concat(__slice.call(failArgs)));
            });
          } else {
            return def.resolveWith.call(def, this, result);
          }
        }
      });
      this.fail(function() {
        var args, result, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (typeof failFilter === 'undefined' || failFilter === null) {
          return (_ref = def.rejectWith).call.apply(_ref, [def, this].concat(__slice.call(args)));
        } else {
          result = failFilter.apply(this, args);
          if (isObservable(result)) {
            return result.done(function() {
              var doneArgs, _ref2;
              doneArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return (_ref2 = def.resolveWith).call.apply(_ref2, [def, this].concat(__slice.call(doneArgs)));
            }).fail(function() {
              var failArgs, _ref2;
              failArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return (_ref2 = def.rejectWith).call.apply(_ref2, [def, this].concat(__slice.call(failArgs)));
            });
          } else {
            return def.rejectWith.call(def, this, result);
          }
        }
      });
      return def.promise();
    };

    Deferred.prototype.promise = function() {
      if (!this._promise) this._promise = new Promise(this);
      return this._promise;
    };

    Deferred.prototype.reject = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this.rejectWith.apply(this, [window].concat(__slice.call(args)));
      return this;
    };

    Deferred.prototype.rejectWith = function() {
      var args, context, _ref, _ref2,
        _this = this;
      context = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (this._state !== 'pending') return;
      this._state = 'rejected';
      this._withArguments = args;
      this._context = context;
      if ((_ref = this._failCallbacks) != null) {
        _ref.forEach(function(fn) {
          return fn.apply(_this._context, args);
        });
      }
      if ((_ref2 = this._alwaysCallbacks) != null) {
        _ref2.forEach(function(fn) {
          return fn.apply(_this._context, args);
        });
      }
      return this;
    };

    Deferred.prototype.resolve = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this.resolveWith.apply(this, [window].concat(__slice.call(args)));
      return this;
    };

    Deferred.prototype.resolveWith = function() {
      var args, context, _ref, _ref2,
        _this = this;
      context = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (this._state !== 'pending') return;
      this._state = 'resolved';
      this._context = context;
      this._withArguments = args;
      if ((_ref = this._doneCallbacks) != null) {
        _ref.forEach(function(fn) {
          return fn.apply(_this._context, args);
        });
      }
      if ((_ref2 = this._alwaysCallbacks) != null) {
        _ref2.forEach(function(fn) {
          return fn.apply(_this._context, args);
        });
      }
      return this;
    };

    Deferred.prototype.state = function() {
      return this._state;
    };

    Deferred.prototype.then = function(doneCallbacks, failCallbacks) {
      this.done(doneCallbacks);
      this.fail(failCallbacks);
      return this;
    };

    return Deferred;

  })();

  window.Deferred.when = function() {
    var allDoneArgs, allReady, args, readyCount;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (args.length === 0) return new Deferred().resolve().promise();
    if (args.length === 1) return args[0].promise();
    allReady = new Deferred();
    readyCount = 0;
    allDoneArgs = [];
    args.forEach(function(dfr, index) {
      return dfr.done(function() {
        var doneArgs;
        doneArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        readyCount += 1;
        allDoneArgs[index] = doneArgs;
        if (readyCount === args.length) {
          return allReady.resolve.apply(allReady, allDoneArgs);
        }
      }).fail(function() {
        var failArgs;
        failArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return allReady.rejectWith.apply(allReady, [this].concat(__slice.call(failArgs)));
      });
    });
    return allReady.promise();
  };

}).call(this);
