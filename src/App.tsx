import { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import './App.css'
import { Toaster } from 'sonner'
import LoginPage from './components/LoginPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import CollateralManager from './components/CollateralManager'
import NeedsPage from './components/NeedsPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activePage, setActivePage] = useState('collateral')

  // This would typically be handled by a context or state management library
  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'collateral':
        return <CollateralManager />
      case 'needs':
        return <NeedsPage />
      default:
        return <CollateralManager />
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <Router>
      <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen}
          activePage={activePage}
          setActivePage={setActivePage}
        />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="h-full w-full">
              {renderActivePage()}
            </div>
          </main>
          <Toaster richColors position="top-right" />
        </div>
      </div>
    </Router>
  )
}

export default App 