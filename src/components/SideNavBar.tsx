import React from "react";
import {
  Plus,
  GitFork,
  ListOrdered,
  Package,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  X,
  Layers,
} from "lucide-react";
import { SidebarTab } from "../types";

interface SideNavBarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onOpenAddPart: () => void;
  version: string;
  hasWarning?: boolean;
  totalBomCount: number;
  completedStepsCount: number;
  totalStepsCount: number;
  onCloseMobile?: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddPart,
  version,
  hasWarning,
  totalBomCount,
  completedStepsCount,
  totalStepsCount,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: "graph" as SidebarTab,
      label: "그래프 뷰",
      icon: GitFork,
      badge: "DAG",
    },
    {
      id: "steps" as SidebarTab,
      label: "조립 순서 및 진행 상황",
      icon: ListOrdered,
      badge: `${completedStepsCount}/${totalStepsCount}`,
    },
    {
      id: "bom" as SidebarTab,
      label: "BOM",
      icon: Package,
      badge: `${totalBomCount}종`,
    },
    {
      id: "compatibility" as SidebarTab,
      label: "호환성",
      icon: hasWarning ? AlertTriangle : CheckCircle2,
      badge: hasWarning ? "경고 1" : "정상",
      badgeColor: hasWarning ? "bg-[#ffdad6] text-[#ba1a1a]" : "bg-[#d8e2ff] text-[#0058be]",
    },
    {
      id: "toolkit" as SidebarTab,
      label: "툴킷",
      icon: Wrench,
      badge: "공구 7종",
    },
  ];

  return (
    <aside className="flex flex-col p-4 gap-2 w-64 bg-[#f2f3fd] border-r border-[#c2c6d6]/60 h-full overflow-y-auto select-none">
      {/* Sidebar Header */}
      <div className="flex justify-between items-start mb-4 px-2">
        <div>
          <h2 className="text-xl font-bold text-[#0058be] tracking-tight font-['Inter']">
            부품 관리자
          </h2>
          <p className="text-xs font-mono text-[#424754] mt-0.5">{version || "조립 v1.0"}</p>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-[#424754] hover:bg-[#e6e7f2] rounded"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Add Part Primary Action Button */}
      <button
        onClick={onOpenAddPart}
        className="whitespace-nowrap w-full bg-[#0058be] text-white rounded-lg py-2.5 px-4 mb-3 text-xs font-mono font-medium hover:bg-[#004395] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span className="whitespace-nowrap">부품 추가</span>
      </button>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-150 text-left cursor-pointer ${
                isActive
                  ? "bg-[#d0e1fb] text-[#0058be] font-bold shadow-xs border border-[#adc6ff]/50"
                  : "text-[#424754] hover:bg-[#e6e7f2] hover:text-[#191b23]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#0058be]" : "text-[#505f76]"}`} />
                <span className="font-mono tracking-tight whitespace-nowrap">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`whitespace-nowrap text-[10px] font-mono px-1.5 py-0.5 rounded-full shrink-0 ${
                    item.badgeColor || (isActive ? "bg-[#0058be] text-white" : "bg-[#e1e2ec] text-[#424754]")
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Spec Card at bottom of sidebar */}
      <div className="mt-auto pt-3 border-t border-[#c2c6d6]/40 text-[11px] font-mono text-[#505f76] space-y-1">
        <div className="flex items-center justify-between text-gray-500">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" /> CAD 링크 상태
          </span>
          <span className="text-emerald-700 font-semibold">정상 연결</span>
        </div>
        <div className="flex items-center justify-between text-gray-500">
          <span>최종 동기화</span>
          <span>실시간</span>
        </div>
      </div>
    </aside>
  );
};
