import { useState } from 'react'
import './App.css'
import { Toaster } from 'sonner'
import CollateralManager from './components/CollateralManager'
import LoginPage from './components/LoginPage'
import Header from './components/Header'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // This would typically be handled by a context or state management library
  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <CollateralManager />
        </main>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  )
}

export default App 