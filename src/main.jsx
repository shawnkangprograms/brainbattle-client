import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// StrictMode removed — it double-invokes effects which causes duplicate
// socket.on() listeners, breaking Sudden Death and other real-time events.
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
