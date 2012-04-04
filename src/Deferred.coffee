if !Array.prototype.forEach
  throw "Deferred requires Array.forEach"

class Promise
  _deferred: null

  constructor: (deferred) ->
    @_deferred = deferred

  always: (fn) ->
    @_deferred.always(fn)
    @

  done: (fn) ->
    @_deferred.done(fn)
    @

  fail: (fn) ->
    @_deferred.fail(fn)
    @

  state: ->
    @_deferred.state()

  then: (done, fail) ->
    @_deferred.then(done, fail)
    @

class window.Deferred
  
  constructor: (fn) ->
    @_state = 'pending'
    fn.call(@, @) if typeof fn == 'function'
    
  
  always: (fn) ->
    return if typeof fn != 'function'
    if @_state != 'pending'
      fn.apply(@_context, @_withArguments)
    else 
      @_alwaysCallbacks ||= []
      @_alwaysCallbacks.push(fn)
    @
    
  done: (fn) ->
    return if typeof fn != 'function'
    if @_state == 'resolved'
      fn.apply(@_context, @_withArguments)
    else if @_state == 'pending'
      @_doneCallbacks ||= []
      @_doneCallbacks.push(fn)
    @
    
  fail: (fn) ->
    return if typeof fn != 'function'
    if @_state == 'rejected'
      fn.apply(@_context, @_withArguments)
    else if @_state == 'pending'
      @_failCallbacks ||= []
      @_failCallbacks.push(fn)
    @
  
  #pipe: (doneFilter, failFilter) ->
  
  promise: ->
    unless @_promise
      @_promise = new Promise(@)
    @_promise
  
  reject: (args...) ->
    @rejectWith(window, args...)
    @
    
  rejectWith: (context, args...)->
    return if @_state != 'pending'
    @_state = 'rejected'
    @_withArguments = args
    @_context = context
    @_failCallbacks?.forEach((fn) =>
      fn.apply(@_context, args)
    )
    @_alwaysCallbacks?.forEach((fn) =>
      fn.apply(@_context, args)
    )
    @
    
  resolve: (args...) ->
    @resolveWith(window, args...)
    @
    
  resolveWith: (context, args...) ->
    return if @_state != 'pending'
    @_state = 'resolved'
    @_context = context
    @_withArguments = args
    @_doneCallbacks?.forEach((fn) =>
      fn.apply(@_context, args)
    )
    @_alwaysCallbacks?.forEach((fn) =>
      fn.apply(@_context, args)
    )
    @
    
  state: ->
    @_state
  
  then: (doneFn, failFn, context = window) -> 
    @done(doneFn, context)
    @fail(failFn, context)
    @

window.Deferred.when = (args...) ->
  return new Deferred().resolve().promise() if args.length == 0
  return args[0].promise() if args.length == 1
  allReady = new Deferred()
  readyCount = 0
  allDoneArgs = []
  
  args.forEach((dfr, index) ->
    dfr.done((doneArgs...) ->
      readyCount += 1 
      allDoneArgs[index] = doneArgs
      if readyCount == args.length
        allReady.resolve(allDoneArgs...)
    ).fail((failArgs...) ->
      allReady.rejectWith(@, failArgs...)
    )
  )
  allReady.promise()