describe "Deferred object", ->
  it("Should initialize to state 'pending'", ->
    ready = new Deferred()
    expect(ready.state()).toEqual('pending')
  )
  it("Should move to 'resolved' state when resolved", ->
    ready = new Deferred()
    ready.resolve()
    expect(ready.state()).toEqual('resolved')
  )
  it("Should move to 'rejected' state when rejected", -> 
    ready = new Deferred()
    ready.reject()
    expect(ready.state()).toEqual('rejected')
  )
  it("Should not change state after resolving or rejecting", ->
    ready = new Deferred()
    ready.resolve()
    ready.reject()
    expect(ready.state()).toEqual('resolved')
    
    ready = new Deferred()
    ready.reject()
    ready.resolve()
    expect(ready.state()).toEqual('rejected')
  )
  it("Should execute done and always callback after resolving and not execute fail callback", ->
    doneFired = 0
    failFired = 0
    alwaysFired = 0
    ready = new Deferred()
    ready.done(->
      doneFired += 1
    ).fail(->
      failFired += 1
    ).always(->
      alwaysFired += 1
    )
    ready.resolve()
    expect(doneFired).toEqual(1)
    expect(failFired).toEqual(0)
    expect(alwaysFired).toEqual(1)
  )
  it("Should execute fail and always callback after rejecting and not execute done callback", ->
    doneFired = 0
    failFired = 0
    alwaysFired = 0
    ready = new Deferred()
    ready.done(->
      doneFired += 1
    ).fail(->
      failFired += 1
    ).always(->
      alwaysFired += 1
    )
    ready.reject()
    expect(doneFired).toEqual(0)
    expect(failFired).toEqual(1)
    expect(alwaysFired).toEqual(1)
  )
  it("Should execute callbacks added with then", ->
    doneFired = 0
    failFired = 0
    ready = new Deferred()
    ready.then(
      ->
        doneFired += 1
      ,
      -> 
        failFired += 1
    )
    ready.resolve()
    expect(doneFired).toEqual(1)
    expect(failFired).toEqual(0)
  )
  it("Should execute done after resolve immediately and not execute fail at all", ->
    doneFired = 0
    failFired = 0
    alwaysFired = 0
    ready = new Deferred()
    ready.resolve()
    ready.done(->
      doneFired += 1
    ).fail(->
      failFired += 1
    ).always(->
      alwaysFired += 1
    )
    expect(doneFired).toEqual(1)
    expect(failFired).toEqual(0)
    expect(alwaysFired).toEqual(1)
  )
  it("Should resolve and reject with context", ->
    context = new Array()
    ready = new Deferred()
    ready.done(->
      expect(@).toEqual(context)
    )
    ready.resolveWith(context)
    
    ready = new Deferred()
    ready.reject(->
      expect(@).toEqual(context)
    )
    ready.rejectWith(context)
  )
  it("Should resolve with arguments", ->
    ready = new Deferred()
    ready.done((firstArg, secondArg) ->
      expect(firstArg).toEqual(123)
      expect(secondArg).toEqual('foo')
      expect(@).toEqual(window)
    )
    ready.resolve(123, 'foo')
  )
  it("Should reject with arguments", ->
    context = new Array()
    ready = new Deferred()
    ready.fail((firstArg, secondArg) ->
      expect(firstArg).toEqual(123)
      expect(secondArg).toEqual('foo')
      expect(@).toEqual(context)
    )
    ready.rejectWith(context, 123, 'foo')
  )
  it("Should fire done with context and arguments after resolving", ->
    context = new Array()
    ready = new Deferred()
    ready.resolveWith(context, 12345)
    ready.done((arg)->
      expect(arg).toEqual(12345)
      expect(@).toEqual(context)
    )    
  )
  it("Should execute fn passed to constructor", ->
    executed = 0
    passedParam = null
    ready = new Deferred((param)->
      passedParam = param
      @done(->
        executed += 1
      )
    )
    ready.resolve()
    expect(executed).toEqual(1)
    expect(passedParam).toEqual(ready)
  )
  
describe "Promise object", ->
  it("Should be given from deferred", ->
    ready = new Deferred()
    promise = ready.promise()
    expect(promise.constructor.name).toEqual('Promise')
  )
  it("Should execute done and always when deferred is resolved", ->
    doneFired = 0
    failFired = 0
    alwaysFired = 0
    ready = new Deferred()
    promise = ready.promise()
    promise.done(->
      doneFired += 1
    ).fail(->
      failFired += 1
    ).always(->
      alwaysFired += 1
    )
    ready.resolve()
    expect(doneFired).toEqual(1)
    expect(failFired).toEqual(0)
    expect(alwaysFired).toEqual(1)
  )
  it("Should reject with correct context", ->
    failFired = 0
    context = new Array()
    ready = new Deferred()
    promise = ready.promise()
    ready.rejectWith(context, 1234, 'foo')
    promise.fail((firstArg, secondArg) ->
      expect(@).toEqual(context)
      expect(firstArg).toEqual(1234)
      expect(secondArg).toEqual('foo')
      failFired += 1
    )
    expect(failFired).toEqual(1)
  )

describe "Deferred.when", ->
  it("Should give back a resolved promise object when called without arguments", ->
    promise = Deferred.when()
    expect(promise.constructor.name).toEqual('Promise')
    expect(promise.state()).toEqual('resolved')
  )
  it("Should return single deferred's promise", ->
    ready = new Deferred()
    promise = Deferred.when(ready)
    expect(promise).toEqual(ready.promise())
  )
  it("Should resolve when all deferreds resolve", ->
    deferreds = [new Deferred(), new Deferred(), new Deferred()]
    doneFired = 0
    promise = Deferred.when(deferreds[0], deferreds[1], deferreds[2])
    promise.done((args...)->
      expect(args).toEqual([[1, 2], [3, 4], [5, 6]])
      doneFired += 1
    )
    deferreds[1].resolve(3, 4)
    expect(promise.state()).toEqual('pending')
    deferreds[0].resolve(1, 2)
    expect(promise.state()).toEqual('pending')
    deferreds[2].resolve(5, 6)
    expect(promise.state()).toEqual('resolved')
    expect(doneFired).toEqual(1)
  )
  it("Should reject when first deferred rejects", ->
    deferreds = [new Deferred(), new Deferred(), new Deferred()]
    failFired = 0
    promise = Deferred.when(deferreds[0], deferreds[1], deferreds[2])
    promise.fail((firstArg, secondArg) ->
      expect(firstArg).toEqual('foo')
      expect(secondArg).toEqual(1234)
      failFired += 1
    )
    deferreds[0].resolve()
    expect(promise.state()).toEqual('pending')
    deferreds[1].reject('foo', 1234)
    expect(promise.state()).toEqual('rejected')
    expect(failFired).toEqual(1)
  )
  
describe 'Deferred.pipe()', ->
  it("Should fire normally without parameters", ->
    doneFired = 0
    failFired = 0
    param = 'foo'
    context = new Array()
    deferred = new Deferred()
    deferred.pipe().done((value)->
      expect(value).toEqual(param)
      expect(@).toEqual(context)
      doneFired += 1
    ).fail((value)->
      failFired += 1
    )
    deferred.resolveWith(context, param)
    expect(doneFired).toEqual(1)
    expect(failFired).toEqual(0)
    
    deferred = new Deferred()
    deferred.pipe().done((value)->
      doneFired += 1
    ).fail((value) ->
      expect(value).toEqual(param)
      expect(@).toEqual(context)
      failFired += 1
    )
    deferred.rejectWith(context, param)
    expect(doneFired).toEqual(1)
    expect(failFired).toEqual(1)
  )
  
  it("Should filter with function", ->
    doneFired = 0
    failFired = 0
    param1 = 'foo'
    param2 = 'bar'
    context = new Array()
    deferred = new Deferred()
    deferred.pipe(
      (string1, string2)->
        expect(string1).toEqual(param1)
        expect(string2).toEqual(param2)
        string1 + string2
    ).done((value)->
      expect(value).toEqual(param1 + param2)
      expect(@).toEqual(context)
      doneFired += 1
    ).fail((value)->
      failFired += 1
    )
    deferred.resolveWith(context, param1, param2)
    expect(doneFired).toEqual(1)
    expect(failFired).toEqual(0)

    deferred = new Deferred()
    deferred.pipe(
      null,
      (string1, string2) ->
        expect(string1).toEqual(param1)
        expect(string2).toEqual(param2)
        string1 + string2
    ).done((value)->
      doneFired += 1
    ).fail((value) ->
      expect(value).toEqual(param1 + param2)
      expect(@).toEqual(context)
      failFired += 1
    )
    deferred.rejectWith(context, param1, param2)
    expect(doneFired).toEqual(1)
    expect(failFired).toEqual(1)
  )
  it('Should filter with another observable', ->
    doneFired = 0
    failFired = 0
    param1 = 'foo'
    param2 = 'bar'
    context = new Array()
    deferred = new Deferred()
    pipeDeferred = new Deferred()
    deferred.pipe(
      (string1, string2)->
        expect(string1).toEqual(param1)
        expect(string2).toEqual(param2)
        pipeDeferred.reject(string1, string2).promise()
    ).fail((passed1, passed2)->
      expect(passed1).toEqual(param1)
      expect(passed2).toEqual(param2)
      expect(@).toEqual(context)
      failFired += 1
    ).done((value)->
      doneFired += 1
    )
    deferred.resolveWith(context, param1, param2)
    expect(doneFired).toEqual(1)
    expect(failFired).toEqual(0)

    deferred = new Deferred()
    pipeDeferred = new Deferred()
    deferred.pipe(
      null,
      (string1, string2) ->
        expect(string1).toEqual(param1)
        expect(string2).toEqual(param2)
        pipeDeferred.resolveWith(context, param1, param2)
    ).fail((value)->
      failFired += 1
    ).done((passed1, passed2) ->
      expect(passed1).toEqual(param1)
      expect(passed2).toEqual(param2)
      expect(@).toEqual(context)
      doneFired += 1
    )
    deferred.reject(param1, param2)
    expect(doneFired).toEqual(1)
    expect(failFired).toEqual(1)
  )