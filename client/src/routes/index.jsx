import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary, ProtectedRoute } from '../components';
import MainLayout from '../layouts/MainLayout';
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  GroupsListPage,
  GroupDetailPage,
  CreateGroupPage,
  CreateExpensePage,
  BalancesPage,
  ImportPage,
} from '../pages';

// Public routes wrapper
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected routes with layout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/groups" element={<GroupsListPage />} />
            <Route path="/groups/new" element={<CreateGroupPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/groups/:id/expenses/new" element={<CreateExpensePage />} />
            <Route path="/groups/:id/import" element={<ImportPage />} />
            <Route path="/groups/:id/balances" element={<BalancesPage />} />
            <Route path="/expenses" element={<Navigate to="/groups" replace />} />
            <Route path="/balances" element={<Navigate to="/groups" replace />} />
            <Route path="/import" element={<Navigate to="/groups" replace />} />
            <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
          </Route>

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default AppRoutes;
