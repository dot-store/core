import dot from "@invrs/dot-prop-immutable"

export default function composeStore(events) {
  events
    .setName("store")
    .setOps("delete", "merge", "set", "time", "toggle")
    .setOpsSync("get")

  events.onAny([
    ["get", get],
    ["delete", del],
    ["merge", merge],
    ["set", set],
    ["time", time],
    ["toggle", toggle],
  ])

  return events
}

function get({ event, store }) {
  const { props } = event
  const { state } = store

  if (props) {
    event.signal.returnValue = dot.get(state, props)
  } else {
    event.signal.returnValue = state
  }
}

function del({ event, store }) {
  const { props } = event
  const { state } = store
  store.setState(dot.delete(state, props))
}

function merge({ event, store }) {
  const { extras, props } = event
  const { state } = store
  store.setState(dot.merge(state, props, extras[0]))
}

function set({ event, store }) {
  const { extras, props } = event
  const { state } = store
  const value = extras[0]
  store.setState(dot.set(state, props, value))
}

function time({ event, store }) {
  const { props } = event
  const { state } = store
  store.setState(
    dot.set(state, props, new Date().getTime())
  )
}

function toggle({ event, store }) {
  const { props } = event
  const { state } = store
  store.setState(dot.toggle(state, props))
}