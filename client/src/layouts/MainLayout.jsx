import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Users,
  Receipt,
  TrendingUp,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import { useAuthStore } from '../store';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Groups', path: '/groups' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: TrendingUp, label: 'Balances', path: '/balances' },
  { icon: Upload, label: 'Import', path: '/import' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-white font-semibold text-lg">Spreetail</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:block text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft
            size={20}
            className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-accent-500/20 text-accent-400 border-l-4 border-accent-500'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
            >
              <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.name}</p>
                <p className="text-gray-400 text-sm truncate">{user?.email}</p>
              </div>
            </motion.div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          )}
        </AnimatePresence>
        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={20} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-sidebar p-2 rounded-lg text-white"
      >
        <Menu size={24} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed left-0 top-0 h-full w-72 bg-sidebar z-50 lg:hidden flex flex-col"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-6 right-4 text-white"
            >
              <X size={24} />
            </button>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:fixed left-0 top-0 h-full bg-sidebar transition-all duration-300 lg:flex flex-col ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
