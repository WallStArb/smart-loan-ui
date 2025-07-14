import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ShortSaleDashboard from './components/ShortSaleDashboard'
import AvailabilityDashboard from './components/AvailabilityDashboard'
import BorrowLoanActivityDashboard from './components/BorrowLoanActivityDashboard'
import AutomationsDashboard from './components/AutomationsDashboard'
import CollateralManager from './components/CollateralManager'
import NeedsPage from './components/NeedsPage'
import ParametersPage from './components/ParametersPage'
import AutoLoanDecisionEngine from './components/AutoLoanParameterSystem'
import BusinessLogicEngine from './components/BusinessLogicEngine'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('business-logic-engine')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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
      case 'short-sales':
        return (
          <ShortSaleDashboard 
            onNavigateToParameters={() => setActivePage('parameters')}
          />
        )
      case 'availability':
        return (
          <AvailabilityDashboard 
            onNavigateToParameters={() => setActivePage('parameters')}
          />
        )
      case 'borrow-loan-activity':
        return (
          <BorrowLoanActivityDashboard 
            onNavigateToParameters={() => setActivePage('parameters')}
          />
        )
      case 'automations':
        return (
          <AutomationsDashboard 
            onNavigateToParameters={() => setActivePage('parameters')}
          />
        )
      case 'auto-loan-parameters':
        return (
          <AutoLoanDecisionEngine />
        )
      case 'business-logic-engine':
        return (
          <BusinessLogicEngine />
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
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          activePage={activePage}
          setActivePage={setActivePage}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {renderActivePage()}
          </main>
        </div>
      </div>
    )
}

export default App 