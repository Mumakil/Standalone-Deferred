(function() {
  var Promise,
    __slice = Array.prototype.slice;

  if (!Array.prototype.forEach) throw "Deferred requires Array.forEach";

  Promise = (function() {

    Promise.prototype._deferred = null;

    function Promise(deferred) {
      this._deferred = deferred;
    }

    Promise.prototype.always = function(fn) {
      this._deferred.always(fn);
      return this;
    };

    Promise.prototype.done = function(fn) {
      this._deferred.done(fn);
      return this;
    };

    Promise.prototype.fail = function(fn) {
      this._deferred.fail(fn);
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

    Deferred.prototype.always = function(fn) {
      if (typeof fn !== 'function') return;
      if (this._state !== 'pending') {
        fn.apply(this._context, this._withArguments);
      } else {
        this._alwaysCallbacks || (this._alwaysCallbacks = []);
        this._alwaysCallbacks.push(fn);
      }
      return this;
    };

    Deferred.prototype.done = function(fn) {
      if (typeof fn !== 'function') return;
      if (this._state === 'resolved') {
        fn.apply(this._context, this._withArguments);
      } else if (this._state === 'pending') {
        this._doneCallbacks || (this._doneCallbacks = []);
        this._doneCallbacks.push(fn);
      }
      return this;
    };

    Deferred.prototype.fail = function(fn) {
      if (typeof fn !== 'function') return;
      if (this._state === 'rejected') {
        fn.apply(this._context, this._withArguments);
      } else if (this._state === 'pending') {
        this._failCallbacks || (this._failCallbacks = []);
        this._failCallbacks.push(fn);
      }
      return this;
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

    Deferred.prototype.then = function(doneFn, failFn, context) {
      if (context == null) context = window;
      this.done(doneFn, context);
      this.fail(failFn, context);
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
