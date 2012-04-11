### 
Standalone Deferred
Copyright 2012 Otto Vehviläinen 
Released under MIT license
###

if !Array.prototype.forEach
  throw "Deferred requires Array.forEach"

isObservable = (obj) ->
  typeof result == 'object' && (result.constructor.name == 'Deferred' || result.constructor.name == 'Promise')

flatten = (args) ->
  return [] if !args
  flatted = []
  args.forEach((item) -> 
    if item
      if typeof item == 'function'
        flatted.push(item)
      else
        args.forEach((fn) -> 
          if fn
            flatted.push(fn)
        )
  )
  flatted

class Promise
  _deferred: null

  constructor: (deferred) ->
    @_deferred = deferred

  always: (args...) ->
    @_deferred.always(args...)
    @

  done: (args...) ->
    @_deferred.done(args...)
    @

  fail: (args...) ->
    @_deferred.fail(args...)
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
  
  always: (args...) ->
    return if args.length == 0
    functions = flatten(args)
    if @_state != 'pending'
      functions.forEach((fn) =>
        fn.apply(@_context, @_withArguments)
      )
    else 
      @_alwaysCallbacks ||= []
      @_alwaysCallbacks.push(functions...)
    @
    
  done: (args...) ->
    return if args.length == 0
    functions = flatten(args)
    if @_state == 'resolved'
      functions.forEach((fn) =>
        fn.apply(@_context, @_withArguments)
      )
    else if @_state == 'pending'
      @_doneCallbacks ||= []
      @_doneCallbacks.push(functions...)
    @
    
  fail: (args...) ->
    return if args.length == 0
    functions = flatten(args)
    if @_state == 'rejected'
      functions.forEach((fn) =>
        fn.apply(@_context, @_withArguments)
      )
    else if @_state == 'pending'
      @_failCallbacks ||= []
      @_failCallbacks.push(functions...)
    @
  
  pipe: (doneFilter, failFilter) ->
    def = new Deferred()
    @done((args...) ->
      if typeof doneFilter == 'undefined' || doneFilter == null
        def.resolveWith.call(def, @, args...)
      else
        result = doneFilter.apply(@, args)
        if isObservable(result)
          result.done((doneArgs...)->
            def.resolveWith.call(def, @, doneArgs...)
          ).fail((failArgs...) ->
            def.rejectWith.call(def, @, failArgs...)
          )
        else
          def.resolveWith.call(def, @, result)
    )
    @fail((args...) ->
      if typeof failFilter == 'undefined' || failFilter == null
        def.rejectWith.call(def, @, args...) 
      else
        result = failFilter.apply(@, args)
        if isObservable(result)
          result.done((doneArgs...)->
            def.resolveWith.call(def, @, doneArgs...)
          ).fail((failArgs...) ->
            def.rejectWith.call(def, @, failArgs...)
          )
        else
          def.rejectWith.call(def, @, result)
    )
    def.promise()
  
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
  
  then: (doneCallbacks, failCallbacks) -> 
    @done(doneCallbacks)
    @fail(failCallbacks)
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