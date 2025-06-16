import { useState } from 'react'
import './App.css'
import { Toaster } from 'sonner'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import CollateralManager from './components/CollateralManager'
import NeedsPage from './components/NeedsPage'
import ParametersPage from './components/ParametersPage'
import { DensityDemo } from './components/ui/density-demo'
import { DateTimeDisplay } from './components/ui/date-time-display'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activePage, setActivePage] = useState('collateral')

  const renderActivePage = () => {
    switch (activePage) {
      case 'collateral':
        return (
          <CollateralManager />
        )
      case 'needs':
        return (
          <NeedsPage 
            onNavigateToParameters={() => setActivePage('parameters')}
          />
        )
      case 'parameters':
        return (
          <ParametersPage />
        )
      default:
        return (
          <div className="h-full w-full p-8">
            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
              <h1 style={{ color: '#4BCD3E' }}>FIS Smart Loan Application</h1>
              <p>Page: {activePage}</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
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
        <DensityDemo />
      </div>
    </div>
  )
}

export default App 