import React, { useState } from 'react'
import { Toaster } from 'sonner'
import CollateralManager from './components/CollateralManager'
import LoginPage from './components/LoginPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import NeedsPage from './components/NeedsPage'

type Page = 'collateral' | 'needs'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activePage, setActivePage] = useState<Page>('collateral')

  const handleLogin = () => {
    setIsLoggedIn(true)
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

  return (
    <div className="min-h-screen bg-gray-200">
      {isLoggedIn ? (
        <div className="flex h-screen">
          <Sidebar 
            isOpen={isSidebarOpen} 
            setIsOpen={setIsSidebarOpen} 
            activePage={activePage}
            setActivePage={setActivePage}
          />
          <div className="flex-1 flex flex-col h-screen overflow-y-hidden">
            <Header />
            <main className="flex-grow p-4 overflow-y-auto">
              {renderActivePage()}
            </main>
            <Toaster 
              position="top-right"
              expand={true}
              richColors={true}
              closeButton={true}
            />
          </div>
        </div>
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App 