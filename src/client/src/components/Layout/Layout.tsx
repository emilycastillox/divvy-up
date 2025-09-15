import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useApp } from '../../contexts/AppContext';
import NotificationContainer from '../UI/NotificationContainer';
import ErrorBoundary from '../UI/ErrorBoundary';

const Layout: React.FC = () => {
  const { sidebarOpen } = useApp();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <Header />
        
        <div className="flex">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content */}
          <main className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          }`}>
            <div className="p-6">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
        
        {/* Notifications */}
        <NotificationContainer />
      </div>
    </ErrorBoundary>
  );
};

export default Layout;
