import Auth from './auth'

let host = null

const headers = new Headers
  ( { "Content-Type": "application/json; charset=utf-8"
    , "Accept"      : "application/json"
    }
  )

export default function(query, variables) {
  return fetch
    ( host
    , { method: 'POST'
      , headers: headers
      , body: JSON.stringify({ query, variables })
      }
    )
    .then(checkResponse)

}

export function init(config) {
  host = config.host
  if (config.onAuth)
    Auth.register(s => config.onAuth(s, headers))
}

function checkResponse(response) {
  // TODO: check status and handle 401
  return response.json()
}
