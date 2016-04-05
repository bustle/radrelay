import perform    from './query'
import * as store from './store'

const objCache   = {}

const callbacks  = {}
const failures   = {}
const idPrefix   = 'ID_'

let lastId = 0

let requests = {}
let job = Promise.resolve()
let nextJob = null

function dispatch() {
  // copy and swap request queue
  const reqs = requests
  requests = {}
  // create query string
  var query = ''
  for (var id in reqs)
    query = `${query} ${id}: ${reqs[id]}`
  query = `{ ${query} }`
  // nothing to dispatch
  if (query === '{  }')
    return
  // dispatch current request
  nextJob = null
  return perform(query)
    .then(r => {
      for (var id in reqs) {
        const data = r.data && r.data[id]
        // for now we just assume everything fails because of a 401
        // really we should be checking the error response
        if (!data) {
          failures[id]("401")
          continue;
        }
        store.track(id, callbacks[id], data)
      }
    })
}

export function register(callback, failure) {
  // generate token
  const id = idPrefix + lastId++
  // register callback
  callbacks[id] = callback
  failures[id]  = failure
  // delete id
  return id
}

export function unregister(id) {
  delete callbacks[id]
  delete failures[id]
  // handle condition that an endpoint was unregistered before finished
  delete requests[id]
  store.untrack(id)
}

export function request(id, query) {
  // ideally do some diffing here
  const req = query
  requests[id] = req
  // dispatch queue on next tick
  if (!nextJob)
    nextJob = job.then(dispatch)
}

export function mutate(query, types, variables) {
  let params = ''
  if (types) {
    let t = ''
    for (let k in types)
      t += `$${k}: ${types[k]}, `
    params = `(${t})`
  }
  return perform(`mutation${params} { ${query} }`, variables)
    .then(r => {
      let data = null
      for (let k in r.data) {
        data = r.data[k]
        break
      }
      return data
        ? Promise.resolve(data)
        : Promise.reject(r.errors)
    })
}
