const h = require('mutant/html-element')
const Value = require('mutant/value')
const watch = require('mutant/watch')
const {isMsg} = require('ssb-ref')

module.exports = function(ssb, opts) {
  opts = opts || {}
  const renderers = []
  const {drafts} = opts

  const defaultRender = opts.defaultRender || function (kv, ctx) {
    return h('div', 'No renderer for\n' + JSON.stringify(kv, null, 2) + '\n in context\n' + JSON.stringify(ctx, null, 2))
  }

  /*
  function renderSingle(kv_or_key, ctx, cb) { // cb is optional
    if (typeof kv_or_key == 'object') return renderKV(kv_or_key, ctx, cb)
    const key = kv_or_key
    if (!isMsg(key)) {
      if (cb) cb(new Error('invalid key' + key))
      return
    }

    // we are definitely async
    const el = Value([])

    if (ctx.readyObs) ctx.readyObs.set(false)
    ssb.revisions.get(key, (err, value) => {
      if (err) {
        if (ctx.readyObs) ctx.readyObs.set(true)
        if (cb) cb(err)
        el.set(h('div', `RenderStack: error getting message ${key}: ${err.message}`)) 
        return
      }
      console.log('calling renderKV')
      el.set(renderKV({key, value}, ctx, (err, el) => {
        if (cb) cb(err, el) // existence of cb forces renderkV to set ctx.readyObs, if present
      }))
    })
    return el
  }
  */

  function renderKV(kv, ctx, cb) { // cb is optional
    ctx = ctx || {}
    const dict = drafts ? drafts.get(kv.key) : null;
    const newCtx = Object.assign({
      dict
    }, opts, ctx, {
      readyObs: (ctx.readyObs || cb) ? Value(true) : null
    })
    let el
    renderers.find( r => el = r(kv, newCtx))
    if (!el) el = defaultRender(kv, newCtx)
    
    // we have an element, but it might flicker
    // clients might chose to wait until it settled

    if (!cb && !ctx.readyObs) return el // client does not care

    if (newCtx.readyObs()) { 
      // element has settled
      if (cb) cb(null, el)
      return el
    } 

    // tell our client that we are not done
    if (ctx.readyObs) ctx.readyObs.set(false)
    const release = watch(newCtx.readyObs, ready => {
      if (!ready) return
      if (ctx.readyObs) ctx.readyObs.set(true)
      release()
      if (cb) cb(null, el)
    })
    
    return el
  }

  const self = {
    //renderSingle,
    render: renderKV,
    renderKV,
    use: renderer => {
      renderers.push(renderer)
      return self
    }
  }
  return self
}
