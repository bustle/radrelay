// store of all objects by unique global key
const store = {}

const tracked = {}

// isArray polyfill
if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]'
  }
}

export function track(id, cb, data) {
  tracked[id] =
    { cb
    , data
    , deps: cache([], '', data)
    }
  // TODO: Fix this
  cb && cb(data)
}

export function untrack(id) {
  delete tracked[id]
}

// places objects in cache
// returns dependency representation
export function cache(acc, parent, obj) {

  const key = obj._key

  // if object does not exist in store,
  // create it
  if (key && !store[key])
    store[key] = {}

  // iterate over fields
  for (let k in obj) {
    const f = obj[k]
    if (Array.isArray(f)) {             // cache range
      if (key)
        acc.push([ key, k, parent ])
      f.forEach
        ( (v, i) => v && v._key && // only track subobjects with keys
            cache(acc, `${parent}.${k}.[]${v._key}`, v)
        )
    } else if (f && typeof f === 'object') { // cache subobject
      cache(acc, `${parent}.${k}`, f)
    } else if (key) {                   // cache leaf
      acc.push([ key, k, parent ])
      store[key][k] = f
    }
  }

  return acc

}

function parent(cache, dep, data) {
  if (cache[dep[2]])
    return cache[dep[2]]
  const path = dep[2].split('.').slice(1)
  let p = data
  path.forEach
    ( k => {
        if (k.slice(0, 2) === '[]') {
          const key = k.slice(2)
          for (let i = 0; i < p.length; i++) {
            // WE ASSUME UNIQUENESS IN RANGES
            if (p[i]._key === key) {
              p = p[i]
              break
            }
          }
        } else {
          p = p[k]
        }
      }
    )
  return cache[dep[2]] = p
}

// applies a set of mutations to an object in the store
export function set(obj) {
  const key = obj._key
  const dif = []
  if (!store[key]) { store[key] = {} }
  // iterate over keys
  for (let k in obj) {
    const attr = obj[k]
    if (store[key][k] !== attr) {
      store[key][k] = attr
      dif.push(k)
    }
  }
  // notify trackers
  const mutated = []
  for (let id in tracked) {
    const { data, deps } = tracked[id]
    let cache = {}
    deps.forEach
    ( dep => {
        if (dep[0] === key && ~dif.indexOf(dep[1])) {
          // look up parent reference
          const p = parent(cache, dep, data)
          // assign value
          p[dep[1]] = store[key][dep[1]]
          if (!~mutated.indexOf(id))
            mutated.push(id)
        }
      }
    )
  }
  mutated.forEach
    ( id => tracked[id] && tracked[id].cb(tracked[id].data) )
}

// mutates a range in the store
// to include a new object
export function add(p, range, o, offset = 0, replace = false) {
  // TODO: restrict fields based on original query
  const pKey = p._key
  const oKey = o._key
  const mutated = []
  for (let id in tracked) {
    const { data, deps } = tracked[id]
    deps.forEach
    ( dep => {
        if (dep[0] === pKey && dep[1] === range) {
          // get range
          const r = parent({}, dep, data)[range]
          // push object to range
          r.splice((offset < 0) ? (r.length + offset + 1) : offset, replace ? 1 : 0, o)
          // add deps
          const nDeps = cache([], `${dep[2]}.${range}.[]${oKey}`, o)
          nDeps.forEach(d => deps.push(d))
          // queue tracked query for mutation
          if (!~mutated.indexOf(id))
            mutated.push(id)
        }
      }
    )
  }
  mutated.forEach
    ( id => tracked[id] && tracked[id].cb(tracked[id].data) )
}

// mutates a range in the store
// to remove an object
export function remove(p, range, o) {
  const pKey = p._key
  const oKey = o._key
  const mutated = []
  for (let id in tracked) {
    const { data, deps } = tracked[id]
    deps.forEach
    ( dep => {
        if (dep[0] === pKey && dep[1] === range) {
          const r = parent({}, dep, data)[range]
          // WE ASSUME UNIQUENESS IN RANGES
          for (let i = 0; i < r.length; i++) {
            if (r[i]._key === oKey) {
              r.splice(i, 1)
              if (!~mutated.indexOf(id))
                mutated.push(id)
              break
            }
          }
        }
        // TODO: gut dead dependencies for efficiency
      }
    )
  }
  mutated.forEach
    ( id => tracked[id] && tracked[id].cb(tracked[id].data) )
}
