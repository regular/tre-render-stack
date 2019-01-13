
# tre-render-strack

async renders any message

Renderers can accpet a `readyObs` in ctx.
If they choose to support it, they set it to false until
they are done (meaning: won't cause flicker after this point)

RenderStack accepts a list of kvs or keys and renders all of them in parallel. An optional
callback can be provided, ctx.readyObs semantics are also implemented, so RenderStacks can be used recursively.


