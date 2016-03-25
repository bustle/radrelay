import React, { Component, PropTypes } from 'react'

import Auth from './auth'
import { register, unregister, request } from './dispatcher'

function DefaultLoading({ children }) {
  return (
    <div>
      loading...
      <div>{ children }</div>
    </div>
  )
}

const Relay = function(C) {

  const Loading = C.loading || DefaultLoading

  return class extends Component {

    static contextTypes = {
      router: PropTypes.object.isRequired
    }

    state =
      { isLoading: true
      , query: ''
      , data: {}
      }

    _onChange = data => this.setState({ data, isLoading: false })
    _onFail = err => {
      Auth.logout()
      this.context.router.replace('/login')
    }

    _fetch = query => {
      this.setState
      ( { isLoading: true
        , query
        , data: {}
        } )
      request(this.dispatcherToken, query)
    }

    componentDidMount() {
      this.dispatcherToken = register(this._onChange, this._onFail)
      this._fetch(C.query(this.props.params))
    }

    componentWillReceiveProps(props) {
      const query = C.query(props.params)
      if (query !== this.state.query)
        this._fetch(query)
    }

    componentWillUnmount() {
      unregister(this.dispatcherToken)
    }

    render() {
      return this.state.isLoading
        ? <Loading {...this.props.params}>{ this.props.children }</Loading>
        : <C {...this.props} dispatcherToken={this.dispatcherToken} relay={this.state.data}/>
    }

  }

}

export default Relay

