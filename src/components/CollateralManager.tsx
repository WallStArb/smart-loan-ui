import React, { useState } from 'react';
import { Search, Download, RefreshCw } from 'lucide-react';

const CollateralManager = () => {
  const subNavItems = ['Collateral Manager', 'Pledge/Recall Status', 'Collateral Exclusions', 'File Upload', 'Recall Priority'];
  const activeSubNavItem = 'Collateral Manager';

  const data = [
    { id: '0690', accountName: 'sample@@', hypothetical: 'No', loanBalance: '$99,999,999.00', creditLine: '$1,000.00', newBalance: '', collateralValue: '$0', marketValue: '$0', availToRecall: '-99,999,999', maxAvailToPledge: '0', balanceUpdated: '05/08/2025 01:26:43 AM', updatedBy: 'ujwala' },
    { id: '0712', accountName: 'Firm GP', hypothetical: 'No', loanBalance: '$999,999,999.00', creditLine: '$9,999,990.00', newBalance: '', collateralValue: '$0', marketValue: '$0', availToRecall: '-999,999,999', maxAvailToPledge: '3,370', balanceUpdated: '05/29/2025 05:02:08 AM', updatedBy: 'Gitesh5' },
    { id: '0801', accountName: 'Non-Customer A', hypothetical: 'No', loanBalance: '$100,000,000.00', creditLine: '$200,000,000.00', newBalance: '', collateralValue: '$0', marketValue: '$0', availToRecall: '-101,000,000', maxAvailToPledge: '0', balanceUpdated: '04/29/2025 10:26:14 AM', updatedBy: 'BGoyette' },
    { id: '0901', accountName: 'Triparty', hypothetical: 'No', loanBalance: '$100,000,000.00', creditLine: '$2,000,000.00', newBalance: '', collateralValue: '$0', marketValue: '$0', availToRecall: '-101,000,000', maxAvailToPledge: '0', balanceUpdated: '05/08/2025 01:14:24 AM', updatedBy: 'ujwala' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Sub Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-6">
          {subNavItems.map(item => (
            <a
              key={item}
              href="#"
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                item === activeSubNavItem
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {/* Account/Security Tabs */}
        <div className="flex border-b">
          <button className="py-2 px-4 text-sm font-medium text-blue-600 bg-blue-50 border-b-2 border-blue-600">By Account</button>
          <button className="py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">By Security</button>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center space-x-2 text-sm">
          <label htmlFor="account" className="font-medium">Account</label>
          <input type="text" id="account" className="border rounded px-2 py-1 w-48"/>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-1 rounded flex items-center space-x-1"><Search size={16}/><span>Search</span></button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-1 rounded">Clear</button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-1 rounded">Manage Accounts</button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-1 rounded">Update</button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-1 rounded">Collateralize</button>
          <div className="flex-grow"/>
          <button className="text-blue-600 hover:underline flex items-center space-x-1"><Download size={16}/><span>Export</span></button>
          <button className="text-blue-600 hover:underline flex items-center space-x-1"><RefreshCw size={16}/><span>Refresh</span></button>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-xs uppercase">
              <tr>
                <th className="p-2"></th>
                <th className="p-2">Account</th>
                <th className="p-2">Hypothetical</th>
                <th className="p-2">Account Name</th>
                <th className="p-2 text-right">Loan Balance</th>
                <th className="p-2 text-right">Credit Line Amt</th>
                <th className="p-2">New Balance</th>
                <th className="p-2 text-right">Collateral Value</th>
                <th className="p-2 text-right">Market Value</th>
                <th className="p-2 text-right">Avail to Recall</th>
                <th className="p-2 text-right">Max Avail to Pledge</th>
                <th className="p-2">Balance Updated</th>
                <th className="p-2">Updated By</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2 space-x-1">
                    <button className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">Attributes</button>
                    <button className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">Details</button>
                  </td>
                  <td className="p-2 text-blue-600 font-medium">{row.id}</td>
                  <td className="p-2">{row.hypothetical}</td>
                  <td className="p-2">{row.accountName}</td>
                  <td className="p-2 text-right">{row.loanBalance}</td>
                  <td className="p-2 text-right">{row.creditLine}</td>
                  <td className="p-2"><input type="text" className="border rounded w-24 text-right" /></td>
                  <td className="p-2 text-right">{row.collateralValue}</td>
                  <td className="p-2 text-right">{row.marketValue}</td>
                  <td className="p-2 text-right text-red-600">{row.availToRecall}</td>
                  <td className="p-2 text-right">{row.maxAvailToPledge}</td>
                  <td className="p-2">{row.balanceUpdated}</td>
                  <td className="p-2">{row.updatedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollateralManager;

