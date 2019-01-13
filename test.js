const Stack = require('.')
const test = require('tape')
const Value = require('mutant/value')
const watch = require('mutant/watch')

test('sync renderKV', t => {
  const _kv = {}, _ctx = {}, el = {}

  t.plan(3)

  const stack = Stack().use( (kv, ctx) => {
    t.equals(kv, _kv, 'is original kv')
    t.notOk(ctx.readyObs, 'called without readyObs')
    return el
  })

  t.equal(stack.renderKV(_kv, _ctx), el)
})

test('sync renderer, renderKV called with cb', t => {
  const _kv = {}, _ctx = {}, el = {}

  t.plan(5)

  const stack = Stack().use( (kv, ctx) => {
    t.equals(kv, _kv, 'is original kv')
    t.ok(ctx.readyObs, 'called with readyObs')
    return el
  })

  t.equal(stack.renderKV(_kv, _ctx, (err, _el) => {
    t.error(err)
    t.equals(_el, el)
  }), el)
})

test('sync renderer, renderKV called with readyObs', t => {
  const _kv = {}, _ctx = {
    readyObs: Value(true)
  }, el = {}

  t.plan(3)

  const release = watch(_ctx.readyObs, ready => {
    if (!ready) t.fail('readyObs should not change')
  })

  const stack = Stack().use( (kv, ctx) => {
    t.equals(kv, _kv, 'is original kv')
    t.ok(ctx.readyObs, 'called with readyObs')
    return el
  })

  t.equal(stack.renderKV(_kv, _ctx), el)
  release()
})

test('async renderer, renderKV called with readyObs', t => {
  const _kv = {}, _ctx = {
    readyObs: Value(true)
  }, el = {}

  const stack = Stack().use( (kv, ctx) => {
    t.equals(kv, _kv, 'is original kv')
    t.ok(ctx.readyObs, 'called with readyObs')
    ctx.readyObs.set(false)
    setTimeout( ()=> {
      el.done = true
      ctx.readyObs.set(true)
    }, 20)
    return el
  })

  let release
  release = watch(_ctx.readyObs, ready => {
    if (!release || !ready) return 
    t.ok(el.done)
    release()
    t.end()
  })

  t.equal(stack.renderKV(_kv, _ctx), el)
})

test.skip('renderSingle (key, sync renderer, cb)', t => {
  const _kv = {
    key: "%eMe2hfQ+gI4NKQJzoycSQmefvSLKkwmdXBGj6JRQHwM=.sha256",
    value: 'bar'
  }, _ctx = {}, _el = {}
  
  t.plan(7)

  const ssb = {
    revisions: {
      get: (key, cb) => {
        t.equal(key, _kv.key)
        setTimeout( ()=>{
          cb(null, _kv.value)
        }, 20)
      }
    }
  }
  
  const stack = Stack(ssb).use( (kv, ctx) => {
    t.deepEqual(kv, _kv)
    t.ok(ctx.readyObs, 'ctx has readyObs')
    return _el
  })

  const el = stack.renderSingle(_kv.key, (err, el) => {
    t.error(err, 'no error')
    t.equal(el, _el, 'callback called with non-observable')
  })
  t.ok(typeof el == 'function', 'el is observable')
  t.deepEqual(el(), [], 'that resolves to []')
})
