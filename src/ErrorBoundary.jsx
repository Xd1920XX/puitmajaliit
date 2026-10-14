import { Component } from 'react'

// Catches render + lifecycle errors from the 3D viewer so a bad GLB
// doesn't take the whole app down. Keeps the sidebar usable while
// surfacing a retry button.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Dev visibility; stripped by minifier otherwise.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught:', error, info)
    }
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="viewer-error" role="alert">
          <h3>Vaate kuvamisel tekkis viga</h3>
          <p>Palun proovi uuesti või lae leht uuesti.</p>
          <button type="button" className="btn btn-primary" onClick={this.reset}>
            Proovi uuesti
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
