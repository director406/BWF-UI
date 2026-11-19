import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Camera, Shield } from "lucide-react";
import { Button } from "../common";
import { NAV_LINKS, APP_INFO, ROUTES } from "../../utils/constants";
import { logoutUser } from "../../services/authService";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = () => {
      const user = localStorage.getItem("iiwc_currentUser");
      if (user) {
        try {
          setCurrentUser(JSON.parse(user));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };

    checkUser();

    // Listen for storage changes (login/logout)
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  // Handle click outside & escape key to close the user dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserMenuOpen(false);
    setOpen(false);
    navigate(ROUTES.HOME);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur">
      <div className="container-max flex h-20 items-center justify-between">
        {/* Brand Logo & Title */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
          <img
            src="/images/logo.jpeg"
            alt={APP_INFO.name}
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover shadow-sm"
          />
          <div>
            <p className="text-sm sm:text-base font-bold text-primary leading-tight">{APP_INFO.name}</p>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">{APP_INFO.tagline}</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-3 xl:gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `text-xs xl:text-sm font-semibold transition ${
                  isActive ? "text-primary font-bold" : "text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-white"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

          {/* User Profile Section (Just Icon Button, Dropdown on Click) */}
          {currentUser ? (
            <div className="relative ml-2" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                  userMenuOpen
                    ? "border-primary bg-primary text-white scale-105"
                    : "border-green-200 bg-green-50 text-primary hover:bg-green-100 hover:scale-105 dark:border-green-800 dark:bg-green-950/60 dark:text-green-300"
                }`}
                title={`Logged in as ${currentUser.name || "User"} (${currentUser.email || ""})`}
                aria-label="User account menu"
                aria-expanded={userMenuOpen}
              >
                <User size={18} />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50 dark:border-slate-700 dark:bg-slate-800">
                  {/* User Profile Info */}
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-3 px-1">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300 font-bold">
                      {currentUser.name ? (
                        currentUser.name.charAt(0).toUpperCase()
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.name || "Volunteer"}
                      </p>
                      <p
                        className="text-xs text-slate-500 dark:text-slate-400 truncate"
                        title={currentUser.email || ""}
                      >
                        {currentUser.email || "No email available"}
                      </p>
                      <span className="mt-1 inline-block rounded-md bg-green-50 dark:bg-green-900/50 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-300">
                        {currentUser.role || "Volunteer"}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Links inside Dropdown */}
                  <div className="py-2 space-y-1">
                    <Link
                      to={ROUTES.CHECKIN}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                    >
                      <Camera size={15} className="text-green-600" />
                      Field Check-In Page
                    </Link>
                    {currentUser.role === "admin" && (
                      <Link
                        to={ROUTES.ADMIN}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                      >
                        <Shield size={15} className="text-purple-600" />
                        Admin Dashboard
                      </Link>
                    )}
                  </div>

                  {/* Logout Button */}
                  <div className="border-t border-slate-100 dark:border-slate-700/80 pt-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to={ROUTES.LOGIN}>
              <Button variant="outline" className="px-4 py-2 text-xs font-semibold">
                Login
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          className="rounded-lg p-2 text-primary lg:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {open && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 lg:hidden">
          <div className="container-max flex flex-col gap-2 py-4">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-green-50 text-primary dark:bg-green-950/40 dark:text-accent"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            {currentUser ? (
              <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300 font-bold">
                    <User size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email || "No email"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-md">
                    {currentUser.role || "Volunteer"}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-lg text-xs font-bold text-red-600 hover:text-red-700 transition"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to={ROUTES.LOGIN} onClick={() => setOpen(false)} className="mt-2">
                <Button variant="outline" className="w-full">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
