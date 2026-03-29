import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, Calendar, Clock } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#00965e]">
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-4 text-sm font-medium text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#00965e]" />
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00965e]" />
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#00965e] focus:border-[#00965e] sm:text-sm transition duration-150 ease-in-out"
            placeholder="Search..."
            type="search"
          />
        </div>
        
        <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00965e] relative">
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" />
          <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
