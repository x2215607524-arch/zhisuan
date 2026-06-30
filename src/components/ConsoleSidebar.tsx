import React, { useState } from 'react';
import {
  LayoutDashboard,
  HardDrive,
  Cpu,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Users,
  Settings,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Database,
  Network,
  Maximize,
  Coins
} from 'lucide-react';

interface ConsoleSidebarProps {
  currentModule: string;
  setCurrentModule: (mod: string) => void;
}

export default function ConsoleSidebar({
  currentModule,
  setCurrentModule,
}: ConsoleSidebarProps) {
  // Manage expandable sidebar sections
  const [expandAccess, setExpandAccess] = useState(false);
  const [expandBaseRes, setExpandBaseRes] = useState(true);

  return (
    <aside className="w-56 bg-white border-r border-slate-200 text-slate-700 flex flex-col font-sans select-none text-xs" id="ideal-cloud-sidebar">
      {/* Platform Navigator Quick-Jump */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2 text-slate-700 font-bold">
          <span className="text-sm">🔍</span>
          <span className="tracking-wide text-xs">快捷跳转</span>
        </div>
        <Maximize className="h-3 w-3 text-slate-400 cursor-pointer hover:text-slate-600" />
      </div>

      <nav className="flex-1 overflow-y-auto py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
        {/* Module: Dashboard */}
        <button
          onClick={() => setCurrentModule('dashboard')}
          className={`w-full flex items-center justify-between px-5 py-2.5 transition-all cursor-pointer ${
            currentModule === 'dashboard' ? 'text-[#fa541c] font-bold bg-[#fa541c]/5' : 'hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {currentModule === 'dashboard' ? <div className="h-1.5 w-1.5 rounded-full bg-[#fa541c]"></div> : <LayoutDashboard className="h-4 w-4 text-slate-400" />}
            <span className="text-xs">概览</span>
          </div>
        </button>

        {/* Section: 算力接入 */}
        <div>
          <button
            onClick={() => setExpandAccess(!expandAccess)}
            className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 text-slate-800 font-bold cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <Cpu className="h-4 w-4 text-slate-500" />
              <span>算力接入</span>
            </div>
            {expandAccess ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
          </button>
          {expandAccess && (
            <div className="bg-slate-50/50 py-1 transition-all space-y-0.5">
              <button className="w-full text-left pl-11 pr-4 py-2 hover:text-slate-900 text-slate-500 hover:bg-slate-50">算力服务商</button>
              <button className="w-full text-left pl-11 pr-4 py-2 hover:text-slate-900 text-slate-500 hover:bg-slate-50">云平台信息</button>
              <button className="w-full text-left pl-11 pr-4 py-2 hover:text-slate-900 text-slate-500 hover:bg-slate-50">资源池管理</button>
              <button className="w-full text-left pl-11 pr-4 py-2 hover:text-slate-900 text-slate-500 hover:bg-slate-50">插件管理</button>
            </div>
          )}
        </div>

        {/* Section: 基础资源 */}
        <div>
          <button
            onClick={() => setExpandBaseRes(!expandBaseRes)}
            className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 text-slate-800 font-bold cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <HardDrive className="h-4 w-4 text-slate-500" />
              <span>基础资源</span>
            </div>
            {expandBaseRes ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
          </button>
          
          {expandBaseRes && (
            <div className="bg-slate-50/30 py-1 space-y-0.5 border-l border-slate-100 ml-5">
              <button className="w-full text-left pl-7 pr-4 py-1.5 text-slate-500 hover:text-slate-950 hover:bg-slate-50">宿主机</button>
              <button className="w-full text-left pl-7 pr-4 py-1.5 text-slate-500 hover:text-slate-950 hover:bg-slate-50">物理机</button>
              <button className="w-full text-left pl-7 pr-4 py-1.5 text-slate-500 hover:text-slate-950 hover:bg-slate-50">资源承载网络</button>
              <button className="w-full text-left pl-7 pr-4 py-1.5 text-slate-500 hover:text-slate-950 hover:bg-slate-50">透传设备</button>

              {/* 对象存储 - Active Link */}
              <button
                onClick={() => setCurrentModule('object-storage')}
                className={`w-full text-left pl-7 pr-4 py-1.5 flex items-center justify-between cursor-pointer ${
                  currentModule === 'object-storage' ? 'text-[#fa541c] font-bold bg-[#fa541c]/5' : 'text-slate-500 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${currentModule === 'object-storage' ? 'bg-[#fa541c]' : 'bg-transparent'}`}></div>
                  <span>对象存储 ZOS</span>
                </div>
                <span className="text-[9px] bg-amber-500/10 text-[#fa541c] scale-90 px-1 py-0.5 rounded border border-amber-500/20 font-mono font-bold tracking-tight">ZOS</span>
              </button>

              <button className="w-full text-left pl-7 pr-4 py-1.5 text-slate-500 hover:text-slate-950 hover:bg-slate-50">块存储</button>
              <button className="w-full text-left pl-7 pr-4 py-1.5 text-slate-500 hover:text-slate-950 hover:bg-slate-50">专网</button>
              <button className="w-full text-left pl-7 pr-4 py-1.5 text-slate-500 hover:text-slate-950 hover:bg-slate-50">公网</button>
              <button className="w-full text-left pl-7 pr-4 py-1.5 text-slate-500 hover:text-slate-950 hover:bg-slate-50">交换机</button>
            </div>
          )}
        </div>

        {/* Section: 监控管理 */}
        <button className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 text-slate-700 font-bold">
          <div className="flex items-center space-x-2.5">
            <TrendingUp className="h-4 w-4 text-slate-500" />
            <span>监控管理</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* Section: 告警管理 */}
        <button className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 text-slate-700 font-bold">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="h-4 w-4 text-slate-500" />
            <span>告警管理</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* Section: 商品管理 */}
        <button className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 text-slate-700 font-bold">
          <div className="flex items-center space-x-2.5">
            <Coins className="h-4 w-4 text-slate-500" />
            <span>商品管理</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* Section: 订单管理 */}
        <button className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 text-slate-700 font-bold">
          <div className="flex items-center space-x-2.5">
            <Receipt className="h-4 w-4 text-slate-500" />
            <span>订单管理</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* Section: 客户管理 */}
        <button className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 text-slate-700 font-bold">
          <div className="flex items-center space-x-2.5">
            <Users className="h-4 w-4 text-slate-500" />
            <span>客户管理</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* Section: 账单管理 */}
        <button className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 text-slate-700 font-bold">
          <div className="flex items-center space-x-2.5">
            <Receipt className="h-4 w-4 text-slate-500" />
            <span>账单管理</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* Section: 信控管理 */}
        <button className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 text-slate-700 font-bold">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            <span>信控管理</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* Section: 用户管理 */}
        <button className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 text-slate-700 font-bold">
          <div className="flex items-center space-x-2.5">
            <Users className="h-4 w-4 text-slate-500" />
            <span>用户管理</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </nav>

      {/* Access Authentication Info (AK/SK Shortcut) */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-slate-500 font-mono text-[10px] space-y-1">
        <div className="flex items-center space-x-1 text-slate-600 font-sans">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-bold text-slate-700">密钥凭证 (AK/SK)</span>
        </div>
        <div className="truncate text-slate-500">AK: y8UbdXnvDxa8L...</div>
        <div className="text-[9px] text-slate-400 font-sans">静态落盘自动加密：SSE-KMS</div>
      </div>
    </aside>
  );
}
