
import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { useAuthStore } from "../store";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Groups", path: "/groups" },
  { icon: Receipt, label: "Expenses", path: "/expenses" },
  { icon: TrendingUp, label: "Balances", path: "/balances" },
  { icon: Upload, label: "Import", path: "/import" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between p-5 border-b border-white/10">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <motion.div
                whileHover={{
                  rotate: 360,
                  scale: 1.1,
                }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
              >
                <span className="font-bold text-white">S</span>
              </motion.div>

              <div>
                <h1 className="font-bold text-white text-lg">
                  Shared Expenses
                </h1>
                <p className="text-xs text-gray-400">
                  Expense Management
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex text-gray-400 hover:text-white"
        >
          <ChevronLeft
            size={20}
            className={`transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <motion.div
            key={item.path}
            whileHover={{
              x: 6,
            }}
            whileTap={{
              scale: 0.97,
            }}
          >
            <NavLink to={item.path}>
              {({ isActive }) => (
                <div
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-sidebar"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 rounded-xl"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}

                  <item.icon
                    size={20}
                    className="relative z-10"
                  />

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{
                          opacity: 0,
                          width: 0,
                        }}
                        animate={{
                          opacity: 1,
                          width: "auto",
                        }}
                        exit={{
                          opacity: 0,
                          width: 0,
                        }}
                        className="relative z-10 whitespace-nowrap font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        <motion.div
          whileHover={{
            scale: 1.02,
          }}
          className="bg-white/5 border border-white/10 rounded-xl p-3"
        >
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{
                rotate: 10,
                scale: 1.1,
              }}
              className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold"
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </motion.div>

            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <h3 className="text-white font-medium truncate">
                  {user?.name}
                </h3>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.button
          whileHover={{
            scale: 1.03,
          }}
          whileTap={{
            scale: 0.97,
          }}
          onClick={handleLogout}
          className="w-full mt-3 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </motion.button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-900 text-white p-2 rounded-xl shadow-lg"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{
                type: "spring",
                damping: 25,
              }}
              className="fixed left-0 top-0 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-4 text-white"
              >
                <X size={24} />
              </button>

              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{
          width: collapsed ? 88 : 290,
        }}
        transition={{
          duration: 0.3,
        }}
        className="hidden lg:flex fixed left-0 top-0 h-screen bg-slate-900/90 backdrop-blur-xl border-r border-white/10 flex-col"
      >
        <SidebarContent />
      </motion.aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "lg:ml-[88px]" : "lg:ml-[290px]"
        }`}
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
          }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default MainLayout;

