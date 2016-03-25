import { mutate } from './dispatcher'

export default function Mutation({ query, types, params, then }) {
  // execute mutation
  return (...args) =>
    mutate(query, types, params(...args))
      .then(r => Promise.resolve(then ? then(r) : r))
}
