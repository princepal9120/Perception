"use client";

import React from 'react';
import { MessageCircle, Sparkles, Settings, Menu } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <div className="relative border-b border-gray-200/50 bg-white/70 backdrop-blur-sm">
      {/* Header content */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Logo and title */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              AI Assistant
            </h1>
            <p className="text-xs text-gray-500 font-medium">Powered by Advanced AI</p>
          </div>
        </div>

        {/* Center - Status indicator */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-emerald-700">Online</span>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group">
            <Settings className="w-5 h-5 text-gray-600 group-hover:text-gray-800 group-hover:rotate-90 transition-all duration-200" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 md:hidden">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Subtle gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
    </div>
  );
};

export default Header;
