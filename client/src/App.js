// client/src/App.js
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios
      .get('/api')          // <-- relative, hits Express via CRA proxy
      .then(res => setData(res.data))
      .catch(err => setError(err))
  }, [])

  if (error)   return <div>Error: {error.message}</div>
  if (!data)   return <p>Loading…</p>

  return (
    <div className="App">
      <h1>Got from the API:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export default App
