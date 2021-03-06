import dotEvent from "dot-event"
import dot from "@dot-store/dot-prop-immutable"

export default function dotStore(options = {}) {
  const { events = dotEvent(), state = {} } = options

  if (events.ops.has("store")) {
    return options
  }

  events.setOp("store")

  const store = { queue: Promise.resolve(), state }
  const bind = { store }

  events.onAny({
    delete: del.bind(bind),
    merge: merge.bind(bind),
    set: set.bind(bind),
    time: time.bind(bind),
  })

  events.get = get.bind(bind)
  events.setState = setState.bind(bind)

  return { events, state }
}

function get(props) {
  const { state, store } = this

  if (props) {
    return dot.get(state || store.state, props)
  } else {
    return state || store.state
  }
}

async function del({ event, events, props }) {
  const { store } = this
  const value = event.args ? event.args[0] : undefined

  if (
    await enqueue({ events, fn: del, props, store, value })
  ) {
    return
  }

  const { state } = store

  if (value !== false) {
    events.setState(dot.delete(state, props))
  }
}

async function merge({ event, events, props }) {
  if (!event.args) {
    return
  }

  const { store } = this
  const value = event.args[0]

  if (
    await enqueue({
      events,
      fn: merge,
      props,
      store,
      value,
    })
  ) {
    return
  }

  const { state } = store

  events.setState(dot.merge(state, props, value))
}

async function set({ event, events, props }) {
  if (!event.args) {
    return
  }

  const { store } = this
  const value = event.args[0]

  if (
    await enqueue({ events, fn: set, props, store, value })
  ) {
    return
  }

  const { state } = store

  events.setState(dot.set(state, props, value))
}

function setState(state) {
  const { store } = this
  store.state = state
}

async function time({ events, props }) {
  await events.set(props, new Date().getTime())
}

async function enqueue({
  events,
  fn,
  props,
  store,
  value,
}) {
  if (typeof value !== "function") {
    return
  }

  store.queue = store.queue.then(async () => {
    await fn.call(
      { events, store },
      {
        event: { args: [await value(events)] },
        events,
        props,
      }
    )
  })

  await store.queue
  return true
}
