### 
Standalone Deferred
Copyright 2012 Otto Vehviläinen 
Released under MIT license

This is a standalone implementation of the wonderful jQuery.Deferred API. 
The documentation here is only for quick reference, for complete api please
see the great work of the original project:

 http://api.jquery.com/category/deferred-object/
###

if !Array.prototype.forEach
  throw "Deferred requires Array.forEach"

###
Tells if an object is observable
###
isObservable = (obj) ->
  typeof result == 'object' && (result.constructor.name == 'Deferred' || result.constructor.name == 'Promise')

###
Flatten a two dimensional array into one dimension.
Removes elements that are not functions
###
flatten = (args) ->
  return [] if !args
  flatted = []
  args.forEach((item) -> 
    if item
      if typeof item == 'function'
        flatted.push(item)
      else
        args.forEach((fn) -> 
          if typeof fn == 'function'
            flatted.push(fn)
        )
  )
  flatted


###
Promise object functions as a proxy for a Deferred, except 
it does not let you modify the state of the Deferred
###
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

  pipe: (doneFilter, failFilter) ->
    @_deferred.pipe(doneFilter, failFilter)

  state: ->
    @_deferred.state()

  then: (done, fail) ->
    @_deferred.then(done, fail)
    @

class window.Deferred
  
  ###
  Initializes a new Deferred. You can pass a function as a parameter 
  to be executed immediately after init. The function receives 
  the new deferred object as a parameter and this is also set to the
  same object.
  ### 
  constructor: (fn) ->
    @_state = 'pending'
    fn.call(@, @) if typeof fn == 'function'
  
  ###
  Pass in functions or arrays of functions to be executed when the 
  Deferred object changes state from pending. If the state is already
  rejected or resolved, the functions are executed immediately. They
  receive the arguments that are passed to reject or resolve and this
  is set to the object defined by rejectWith or resolveWith if those
  variants are used.
  ###
  always: (args...) ->
    return @ if args.length == 0
    functions = flatten(args)
    if @_state != 'pending'
      functions.forEach((fn) =>
        fn.apply(@_context, @_withArguments)
      )
    else 
      @_alwaysCallbacks ||= []
      @_alwaysCallbacks.push(functions...)
    @
  
  ###
  Pass in functions or arrays of functions to be executed when the 
  Deferred object is resolved. If the object has already been resolved, 
  the functions are executed immediately. If the object has been rejected,
  nothing happens. The functions receive the arguments that are passed 
  to resolve and this is set to the object defined by resolveWith if that
  variant is used.
  ###
  done: (args...) ->
    return @ if args.length == 0
    functions = flatten(args)
    if @_state == 'resolved'
      functions.forEach((fn) =>
        fn.apply(@_context, @_withArguments)
      )
    else if @_state == 'pending'
      @_doneCallbacks ||= []
      @_doneCallbacks.push(functions...)
    @
  
  ###
  Pass in functions or arrays of functions to be executed when the 
  Deferred object is rejected. If the object has already been rejected, 
  the functions are executed immediately. If the object has been resolved,
  nothing happens. The functions receive the arguments that are passed 
  to reject and this is set to the object defined by rejectWith if that
  variant is used.
  ###
  fail: (args...) ->
    return @ if args.length == 0
    functions = flatten(args)
    if @_state == 'rejected'
      functions.forEach((fn) =>
        fn.apply(@_context, @_withArguments)
      )
    else if @_state == 'pending'
      @_failCallbacks ||= []
      @_failCallbacks.push(functions...)
    @
  
  ###
  Returns a new Promise object that's tied to the current Deferred. The doneFilter
  and failFilter can be used to modify the final values that are passed to the 
  callbacks of the new promise. If the parameters passed are falsy, the promise
  object resolves or rejects normally. If the filter functions return a value,
  that one is passed to the respective callbacks. The filters can also return a
  new Promise or Deferred object, which rejected / resolved will control how the
  callbacks fire.
  ###
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

  ###
  progress: (args...) ->
    return @ if args.length == 0 || @_state != 'pending'
    functions = flatten(args)
    if @_state == 'pending'
      @_failCallbacks ||= []
      @_failCallbacks.push(functions...)
    @
  ###
  
  ###
  Returns the promise object of this Deferred
  ###
  promise: ->
    unless @_promise
      @_promise = new Promise(@)
    @_promise
  
  ###
  Reject this Deferred. If the object has already been rejected or resolved,
  nothing happens. Parameters passed to reject will be handed to all current
  and future fail and always callbacks.
  ###
  reject: (args...) ->
    @rejectWith(window, args...)
    @
    
  ###
  Reject this Deferred with additional context. Works the same way as reject, except
  the first parameter is used as this when calling the fail and always callbacks.
  ###
  rejectWith: (context, args...)->
    return @ if @_state != 'pending'
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
    
  ###
  Resolves this Deferred object. If the object has already been rejected or resolved,
  nothing happens. Parameters passed to resolve will be handed to all current and
  future done and always callbacks. 
  ###
  resolve: (args...) ->
    @resolveWith(window, args...)
    @
    
  ###
  Resolve this Deferred with additional context. Works the same way as resolve, except
  the first parameter is used as this when calling the done and always callbacks.
  ###
  resolveWith: (context, args...) ->
    return @ if @_state != 'pending'
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
    
  ###
  Returns the state of this Deferred. Can be 'pending', 'rejected' or 'resolved'.
  ###
  state: ->
    @_state
  
  ###
  Convenience function to specify both done and fail callbacks at the same time.
  ###
  then: (doneCallbacks, failCallbacks) -> 
    @done(doneCallbacks)
    @fail(failCallbacks)
    @

###
Returns a new promise object which will resolve when all of the deferreds or promises
passed to the function resolve. The callbacks receive all the parameters that the 
individual resolves yielded as an array. If any of the deferreds or promises are 
rejected, the promise will be rejected immediately.
###
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