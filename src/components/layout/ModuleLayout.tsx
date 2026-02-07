import React, { useState, useRef, useEffect } from 'react'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface ModuleLayoutProps {
    title: string
    description?: string
    searchValue: string
    onSearchChange: (value: string) => void
    searchPlaceholder?: string
    onNewClick: () => void
    newButtonText?: string
    children: React.ReactNode
    filters?: React.ReactNode
    actions?: React.ReactNode
}

export default function ModuleLayout({
    title,
    description,
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Buscar...',
    onNewClick,
    newButtonText = 'Nuevo',
    children,
    filters,
    actions
}: ModuleLayoutProps) {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {actions}
                    <button
                        onClick={onNewClick}
                        className="btn-primary flex items-center gap-2"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>{newButtonText}</span>
                    </button>
                </div>
            </div>

            {/* Filters & Search Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="pl-10 input-field w-full"
                        />
                    </div>

                    {filters && (
                        <div className="flex items-center gap-4">
                            {filters}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div>
                {children}
            </div>
        </div>
    )
}
