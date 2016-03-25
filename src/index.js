import Auth       from './auth'
import * as Store from './store'
import Mutation   from './mutation'
import Relay      from './Relay'

import { init as initQuery } from './query'

// polyfills
require('es6-promise').polyfill()
require('whatwg-fetch')

// initialization process
export default function(config) {
  Auth.init(config.auth)
  initQuery(config.graphql)
}

export { Auth, Store, Mutation, Relay }
