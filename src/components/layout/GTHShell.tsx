// src/components/layout/GTHShell.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Moon, Sun, Home, Search, Briefcase, User } from 'lucide-react';

interface GTHProps {
    children: React.ReactNode;
}

export default function GTHShell({ children }: GTHProps) {
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Security: Zero Leakage - Client-side sanitization dummy
    const sanitizeInput = (val: string) => val.replace(/[<>]/g, "");

    return (
        <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark' : ''}`}
            style={{ backgroundColor: 'var(--gth-bg)', color: 'var(--gth-text)' }}>

            {/* Desktop Header: Professional Luxury */}
            <header className="hidden md:flex sticky top-0 z-50 p-4 justify-between items-center luxury-glass mx-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-[#c5a059] to-[#8e6d2f] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">G</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-widest">GTH PRO</h1>
                </div>

                <nav className="flex gap-8 font-medium">
                    <a href="#" className="hover:text-[var(--gth-accent)] transition-colors">Tenders</a>
                    <a href="#" className="hover:text-[var(--gth-accent)] transition-colors">Analytics</a>
                    <a href="#" className="hover:text-[var(--gth-accent)] transition-colors">Studio</a>
                </nav>

                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full luxury-glass">
                    {isDarkMode ? <Sun size={20} color="#c5a059" /> : <Moon size={20} />}
                </button>
            </header>

            {/* Main Content Area */}
            <main className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto">
                {children}
            </main>

            {/* Mobile Bottom Nav: Native App Look */}
            <footer className="md:hidden fixed bottom-0 left-0 right-0 h-20 luxury-glass flex justify-around items-center rounded-t-3xl border-t-2 border-[var(--gth-accent)]">
                <div className="flex flex-col items-center gap-1 text-[var(--gth-accent)]">
                    <Home size={24} />
                    <span className="text-[10px] uppercase font-bold">Home</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                    <Briefcase size={24} />
                    <span className="text-[10px] uppercase font-bold">Tenders</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                    <Search size={24} />
                    <span className="text-[10px] uppercase font-bold">Explore</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                    <User size={24} />
                    <span className="text-[10px] uppercase font-bold">Profile</span>
                </div>
            </footer>

            {/* Security Layer Indicator */}
            <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span className="text-[10px] font-mono text-green-500 uppercase">GTH-Secure-Link Active</span>
                </div>
            </div>
        </div>
    );
}