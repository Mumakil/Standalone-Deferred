
/*
Standalone Deferred
Copyright 2012 Otto Vehviläinen
Released under MIT license

This is a standalone implementation of the wonderful jQuery.Deferred API.
The documentation here is only for quick reference, for complete api please
see the great work of the original project:

http://api.jquery.com/category/deferred-object/
*/

(function() {
  var Promise, flatten, isObservable, root,
    __slice = Array.prototype.slice,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (!Array.prototype.forEach) throw new Error("Deferred requires Array.forEach");

  /*
  Store a reference to the global context
  */

  root = this;

  /*
  Tells if an object is observable
  */

  isObservable = function(obj) {
    return (obj instanceof Deferred) || (obj instanceof Promise);
  };

  /*
  Flatten a two dimensional array into one dimension.
  Removes elements that are not functions
  */

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
            if (typeof fn === 'function') return flatted.push(fn);
          });
        }
      }
    });
    return flatted;
  };

  /*
  Promise object functions as a proxy for a Deferred, except
  it does not let you modify the state of the Deferred
  */

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

    Promise.prototype.pipe = function(doneFilter, failFilter) {
      return this._deferred.pipe(doneFilter, failFilter);
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

  root.Deferred = (function() {
    /*
      Initializes a new Deferred. You can pass a function as a parameter
      to be executed immediately after init. The function receives
      the new deferred object as a parameter and this is also set to the
      same object.
    */
    function Deferred(fn) {
      this.then = __bind(this.then, this);
      this.resolveWith = __bind(this.resolveWith, this);
      this.resolve = __bind(this.resolve, this);
      this.rejectWith = __bind(this.rejectWith, this);
      this.reject = __bind(this.reject, this);
      this.promise = __bind(this.promise, this);
      this.progress = __bind(this.progress, this);
      this.pipe = __bind(this.pipe, this);
      this.notifyWith = __bind(this.notifyWith, this);
      this.notify = __bind(this.notify, this);
      this.fail = __bind(this.fail, this);
      this.done = __bind(this.done, this);
      this.always = __bind(this.always, this);      this._state = 'pending';
      if (typeof fn === 'function') fn.call(this, this);
    }

    /*
      Pass in functions or arrays of functions to be executed when the
      Deferred object changes state from pending. If the state is already
      rejected or resolved, the functions are executed immediately. They
      receive the arguments that are passed to reject or resolve and this
      is set to the object defined by rejectWith or resolveWith if those
      variants are used.
    */

    Deferred.prototype.always = function() {
      var args, functions, _ref,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 0) return this;
      functions = flatten(args);
      if (this._state === 'pending') {
        this._alwaysCallbacks || (this._alwaysCallbacks = []);
        (_ref = this._alwaysCallbacks).push.apply(_ref, functions);
      } else {
        functions.forEach(function(fn) {
          return fn.apply(_this._context, _this._withArguments);
        });
      }
      return this;
    };

    /*
      Pass in functions or arrays of functions to be executed when the
      Deferred object is resolved. If the object has already been resolved,
      the functions are executed immediately. If the object has been rejected,
      nothing happens. The functions receive the arguments that are passed
      to resolve and this is set to the object defined by resolveWith if that
      variant is used.
    */

    Deferred.prototype.done = function() {
      var args, functions, _ref,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 0) return this;
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

    /*
      Pass in functions or arrays of functions to be executed when the
      Deferred object is rejected. If the object has already been rejected,
      the functions are executed immediately. If the object has been resolved,
      nothing happens. The functions receive the arguments that are passed
      to reject and this is set to the object defined by rejectWith if that
      variant is used.
    */

    Deferred.prototype.fail = function() {
      var args, functions, _ref,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 0) return this;
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

    /*
      Notify progress callbacks. The callbacks get passed the arguments given to notify.
      If the object has resolved or rejected, nothing will happen
    */

    Deferred.prototype.notify = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this.notifyWith.apply(this, [root].concat(__slice.call(args)));
      return this;
    };

    /*
      Notify progress callbacks with additional context. Works the same way as notify(),
      except this is set to context when calling the functions.
    */

    Deferred.prototype.notifyWith = function() {
      var args, context, _ref;
      context = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (this._state !== 'pending') return this;
      if ((_ref = this._progressCallbacks) != null) {
        _ref.forEach(function(fn) {
          return fn.apply(context, args);
        });
      }
      return this;
    };

    /*
      Returns a new Promise object that's tied to the current Deferred. The doneFilter
      and failFilter can be used to modify the final values that are passed to the
      callbacks of the new promise. If the parameters passed are falsy, the promise
      object resolves or rejects normally. If the filter functions return a value,
      that one is passed to the respective callbacks. The filters can also return a
      new Promise or Deferred object, of which rejected / resolved will control how the
      callbacks fire.
    */

    Deferred.prototype.pipe = function(doneFilter, failFilter) {
      var def;
      def = new Deferred();
      this.done(function() {
        var args, result, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (doneFilter != null) {
          result = doneFilter.apply(this, args);
          if (isObservable(result)) {
            return result.done(function() {
              var doneArgs, _ref;
              doneArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return (_ref = def.resolveWith).call.apply(_ref, [def, this].concat(__slice.call(doneArgs)));
            }).fail(function() {
              var failArgs, _ref;
              failArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return (_ref = def.rejectWith).call.apply(_ref, [def, this].concat(__slice.call(failArgs)));
            });
          } else {
            return def.resolveWith.call(def, this, result);
          }
        } else {
          return (_ref = def.resolveWith).call.apply(_ref, [def, this].concat(__slice.call(args)));
        }
      });
      this.fail(function() {
        var args, result, _ref, _ref2;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (failFilter != null) {
          result = failFilter.apply(this, args);
          if (isObservable(result)) {
            result.done(function() {
              var doneArgs, _ref;
              doneArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return (_ref = def.resolveWith).call.apply(_ref, [def, this].concat(__slice.call(doneArgs)));
            }).fail(function() {
              var failArgs, _ref;
              failArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return (_ref = def.rejectWith).call.apply(_ref, [def, this].concat(__slice.call(failArgs)));
            });
          } else {
            def.rejectWith.call(def, this, result);
          }
          return (_ref = def.rejectWith).call.apply(_ref, [def, this].concat(__slice.call(args)));
        } else {
          return (_ref2 = def.rejectWith).call.apply(_ref2, [def, this].concat(__slice.call(args)));
        }
      });
      return def.promise();
    };

    /*
      Add progress callbacks to be fired when using notify()
    */

    Deferred.prototype.progress = function() {
      var args, functions, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 0 || this._state !== 'pending') return this;
      functions = flatten(args);
      this._progressCallbacks || (this._progressCallbacks = []);
      (_ref = this._progressCallbacks).push.apply(_ref, functions);
      return this;
    };

    /*
      Returns the promise object of this Deferred.
    */

    Deferred.prototype.promise = function() {
      return this._promise || (this._promise = new Promise(this));
    };

    /*
      Reject this Deferred. If the object has already been rejected or resolved,
      nothing happens. Parameters passed to reject will be handed to all current
      and future fail and always callbacks.
    */

    Deferred.prototype.reject = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this.rejectWith.apply(this, [root].concat(__slice.call(args)));
      return this;
    };

    /*
      Reject this Deferred with additional context. Works the same way as reject, except
      the first parameter is used as this when calling the fail and always callbacks.
    */

    Deferred.prototype.rejectWith = function() {
      var args, context, _ref, _ref2,
        _this = this;
      context = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (this._state !== 'pending') return this;
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

    /*
      Resolves this Deferred object. If the object has already been rejected or resolved,
      nothing happens. Parameters passed to resolve will be handed to all current and
      future done and always callbacks.
    */

    Deferred.prototype.resolve = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this.resolveWith.apply(this, [root].concat(__slice.call(args)));
      return this;
    };

    /*
      Resolve this Deferred with additional context. Works the same way as resolve, except
      the first parameter is used as this when calling the done and always callbacks.
    */

    Deferred.prototype.resolveWith = function() {
      var args, context, _ref, _ref2,
        _this = this;
      context = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (this._state !== 'pending') return this;
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

    /*
      Returns the state of this Deferred. Can be 'pending', 'rejected' or 'resolved'.
    */

    Deferred.prototype.state = function() {
      return this._state;
    };

    /*
      Convenience function to specify each done, fail and progress callbacks at the same time.
    */

    Deferred.prototype.then = function(doneCallbacks, failCallbacks, progressCallbacks) {
      this.done(doneCallbacks);
      this.fail(failCallbacks);
      this.progress(progressCallbacks);
      return this;
    };

    return Deferred;

  })();

  /*
  Returns a new promise object which will resolve when all of the deferreds or promises
  passed to the function resolve. The callbacks receive all the parameters that the
  individual resolves yielded as an array. If any of the deferreds or promises are
  rejected, the promise will be rejected immediately.
  */

  root.Deferred.when = function() {
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

  (function() {
    var destination, origAjax;
    destination = window.Zepto;
    if (!destination || destination.Deferred) return;
    destination.Deferred = function() {
      return new Deferred();
    };
    origAjax = destination.ajax;
    return destination.ajax = function(options) {
      var createWrapper, deferred;
      deferred = new Deferred();
      createWrapper = function(wrapped, finisher) {
        return function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          if (typeof wrapped === "function") wrapped.apply(null, args);
          return finisher.apply(null, args);
        };
      };
      options.success = createWrapper(options.success, deferred.resolve);
      options.error = createWrapper(options.error, deferred.reject);
      origAjax(options);
      return deferred.promise();
    };
  })();

}).call(this);
