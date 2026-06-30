import React from 'react';
import { Cloud, Info, Bell, User, Cpu } from 'lucide-react';

interface ConsoleHeaderProps {
  userName?: string;
  notificationCount?: number;
}

export default function ConsoleHeader({
  userName = '李媛媛',
  notificationCount = 3,
}: ConsoleHeaderProps) {
  return (
    <header className="h-14 bg-[#0a1833] text-white flex items-center justify-between px-5 select-none font-sans" id="ideal-cloud-header">
      {/* Platform Branding */}
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Cloud className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5 leading-none">
            <span className="font-bold tracking-tight text-[#f97316] text-sm">理想</span>
            <span className="font-semibold text-sm tracking-wide">智算云平台</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-widest block scale-90 -translate-x-[5%]">idealcloud.cn</span>
        </div>
      </div>



      {/* User Area */}
      <div className="flex items-center space-x-6">
        {/* Model Services Link */}
        <a
          href="#model-services"
          className="text-slate-300 hover:text-white text-xs font-medium transition-colors"
        >
          模型服务
        </a>

        {/* Info Trigger */}
        <button className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer" title="使用指南">
          <Info className="h-4 w-4" />
        </button>

        {/* Alerts / Bell */}
        <button className="relative text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer" title="消息中心">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 h-4 min-w-[16px] px-1 text-[9px] bg-red-500 text-white rounded-full flex items-center justify-center font-bold border border-[#0a1833] transform translate-x-1/3 -translate-y-1/3">
              {notificationCount}
            </span>
          )}
        </button>

        <div className="h-4 w-[1px] bg-slate-700" />

        {/* User Dropdown */}
        <div className="flex items-center space-x-2 cursor-pointer group">
          <div className="h-7 w-7 bg-slate-600 rounded-full flex items-center justify-center border border-slate-500 overflow-hidden">
            <User className="h-4 w-4 text-slate-200" />
          </div>
          <span className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">{userName}</span>
          <span className="text-[10px] text-slate-400 font-mono scale-75 group-hover:text-slate-300 transition-colors">▼</span>
        </div>
      </div>
    </header>
  );
}
