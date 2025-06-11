import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { Toaster } from 'sonner'
import LoginPage from './components/LoginPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import CollateralManager from './components/CollateralManager'
import Configuration from './components/Configuration'

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
      case 'config':
        return <Configuration />
      default:
        return <CollateralManager />
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen}
          activePage={activePage}
          setActivePage={setActivePage}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            {renderActivePage()}
          </main>
          <Toaster richColors position="top-right" />
        </div>
      </div>
    </Router>
  )
}

export default App 