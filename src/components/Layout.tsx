import { ReactNode, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    HomeIcon,
    DocumentTextIcon,
    CloudArrowUpIcon,
    Bars3Icon,
    XMarkIcon,
    CubeIcon,
    CheckCircleIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ListBulletIcon,
    PlusIcon,
    ArrowLeftOnRectangleIcon,
    UserCircleIcon,
    CurrencyDollarIcon,
    BeakerIcon
} from '@heroicons/react/24/outline'
import authService from '../services/authService'

interface LayoutProps {
    children: ReactNode
    title?: string
}

export default function Layout({ children, title }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(false)
    const location = useLocation()
    const user = authService.getCurrentUser()

    useEffect(() => {
        // Check dark mode preference
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setDarkMode(true)
            document.documentElement.classList.add('dark')
        } else {
            setDarkMode(false)
            document.documentElement.classList.remove('dark')
        }
    }, [])

    const toggleDarkMode = () => {
        if (darkMode) {
            document.documentElement.classList.remove('dark')
            localStorage.theme = 'light'
            setDarkMode(false)
        } else {
            document.documentElement.classList.add('dark')
            localStorage.theme = 'dark'
            setDarkMode(true)
        }
    }

    const handleLogout = () => {
        authService.logout()
        window.location.href = '/login'
    }

    const navigation = [
        { name: 'Dashboard', href: '/', icon: HomeIcon, current: location.pathname === '/' },
        {
            name: 'Verificaciones',
            href: '/verificacion',
            icon: CheckCircleIcon,
            current: location.pathname.startsWith('/verificacion')
        },
        // Menú simplificado para la versión aislada
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 z-50 flex w-72 flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400">
                            <CubeIcon className="h-8 w-8" />
                            <span>GeoFal CRM</span>
                        </div>
                        <button
                            type="button"
                            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="sr-only">Close sidebar</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>

                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <Link
                                                to={item.href}
                                                className={`
                            group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                            ${item.current
                                                        ? 'bg-gray-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                                                        : 'text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'}
                          `}
                                            >
                                                <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>

                            <li className="mt-auto">
                                <div className="flex items-center gap-x-4 py-3 text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md p-2 cursor-pointer" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                                        <UserCircleIcon className="h-6 w-6" />
                                    </div>
                                    <span className="sr-only">Your profile</span>
                                    <span aria-hidden="true">{user?.full_name || user?.username || 'Usuario'}</span>
                                </div>

                                {userMenuOpen && (
                                    <div className="mt-2 space-y-1 px-2">
                                        <button
                                            onClick={toggleDarkMode}
                                            className="w-full text-left group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <ArrowLeftOnRectangleIcon className="h-6 w-6 shrink-0" />
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col lg:pl-0">
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
                    <button type="button" className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden" onClick={() => setSidebarOpen(true)}>
                        <span className="sr-only">Open sidebar</span>
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>

                    <div className="font-semibold text-gray-900 dark:text-white">
                        GeoFal CRM
                    </div>
                </div>

                <main className="py-10">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
