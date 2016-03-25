const store = window.localStorage

const listeners = []

let keys     = null
let strategy = null
let session  = {}

const auth =

  { session

  , init(config) {
      keys     = config.keys
      strategy = config.strategy
      keys.forEach(k => {
        session[k] = store.getItem(`auth::${k}`)
      })
      listeners.forEach(l => l(session))
    }

  , register(listener) {
      // listener is not already in queue
      if (! listeners.reduce((acc, l) => acc || (l === listener), false))
      listeners.push(listener)
      listener(session)
    }

  , login(params, remember) {
      return Promise.resolve(strategy(params, remember))
        .then(s => s ? Promise.resolve(s) : Promise.reject("Login failed!"))
        .then(s => {
          keys.forEach(k => {
            if (remember)
              store.setItem(`auth::${k}`, s[k])
            session[k] = s[k]
          })
          listeners.forEach(l => l(session))
          return Promise.resolve(session)
        })
        .catch(e => {
          auth.logout()
          return Promise.reject(e)
        })
    }

  , logout() {
      keys.forEach(k => {
        session[k] = null
        store.removeItem(`auth::${k}`)
      })
      listeners.forEach(l => l(session))
    }

  }

export default auth
