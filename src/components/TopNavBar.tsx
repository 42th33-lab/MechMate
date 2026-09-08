import React from "react";
import {
  Wrench,
  Save,
  Settings,
  User,
  Sparkles,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Menu,
  FileDown,
  RotateCcw,
  Home,
} from "lucide-react";
import { ActiveScreen } from "../types";

interface TopNavBarProps {
  activeScreen: ActiveScreen;
  onScreenChange: (screen: ActiveScreen) => void;
  isCompactMode: boolean;
  onToggleCompact: () => void;
  onSave: () => void;
  onExport: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onToggleMobileMenu: () => void;
  onResetToDefault: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeScreen,
  onScreenChange,
  isCompactMode,
  onToggleCompact,
  onSave,
  onExport,
  onOpenSettings,
  onOpenProfile,
  onToggleMobileMenu,
  onResetToDefault,
}) => {
  return (
    <nav className="sticky top-0 z-40 flex justify-between items-center px-3 md:px-6 h-16 w-full bg-[#f9f9ff] border-b border-[#c2c6d6]/60 shadow-xs select-none">
      {/* Brand & Mobile Menu */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-[#0058be] hover:bg-[#e6e7f2] transition-colors cursor-pointer"
          title="메뉴 열기"
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onScreenChange("home")}
          title="홈 대시보드로 이동"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0058be] flex items-center justify-center text-white shadow-xs">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="text-lg md:text-2xl font-bold tracking-tight text-[#0058be] font-['Inter'] whitespace-nowrap">
            MechMate
          </span>
          <span className="hidden lg:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#d0e1fb] text-[#0058be] font-semibold whitespace-nowrap">
            조립 관리 시스템
          </span>
        </div>
      </div>

      {/* Screen Switcher Pills */}
      <div className="flex items-center bg-[#ecedf7] p-1 rounded-xl border border-[#c2c6d6]/40 overflow-x-auto max-w-full">
        <button
          onClick={() => onScreenChange("home")}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeScreen === "home"
              ? "bg-[#0058be] text-white shadow-xs"
              : "text-[#424754] hover:text-[#191b23] hover:bg-white/60"
          }`}
        >
          <Home className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">시작 화면</span>
        </button>

        <button
          onClick={() => onScreenChange("prompt_setup")}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeScreen === "prompt_setup"
              ? "bg-[#0058be] text-white shadow-xs"
              : "text-[#424754] hover:text-[#191b23] hover:bg-white/60"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">초기 프롬프트 설정</span>
        </button>

        <button
          onClick={() => onScreenChange("assembly_manager")}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeScreen === "assembly_manager"
              ? "bg-[#0058be] text-white shadow-xs"
              : "text-[#424754] hover:text-[#191b23] hover:bg-white/60"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">공정 수정 및 관리</span>
        </button>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Screen Fit / Compact Toggle */}
        <button
          onClick={onToggleCompact}
          className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors border whitespace-nowrap cursor-pointer ${
            isCompactMode
              ? "bg-[#d8e2ff] text-[#0058be] border-[#adc6ff]"
              : "bg-white text-[#424754] border-[#c2c6d6]/60 hover:bg-[#e6e7f2]"
          }`}
          title={isCompactMode ? "표준 뷰로 전환" : "한눈에 보기 (화면 맞춤 뷰)"}
        >
          {isCompactMode ? <Minimize2 className="w-3.5 h-3.5 shrink-0" /> : <Maximize2 className="w-3.5 h-3.5 shrink-0" />}
          <span className="whitespace-nowrap">{isCompactMode ? "화면맞춤 ON" : "한눈에보기"}</span>
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          className="text-[#0058be] hover:bg-[#e6e7f2] transition-colors active:scale-95 p-2 rounded-lg flex items-center justify-center cursor-pointer"
          title="진행 상황 저장"
          aria-label="Save project"
        >
          <Save className="w-4.5 h-4.5" />
        </button>

        {/* Export JSON / CSV */}
        <button
          onClick={onExport}
          className="text-[#0058be] hover:bg-[#e6e7f2] transition-colors active:scale-95 p-2 rounded-lg flex items-center justify-center cursor-pointer"
          title="BOM 및 지침서 내보내기"
          aria-label="Export project"
        >
          <FileDown className="w-4.5 h-4.5" />
        </button>

        {/* Reset */}
        <button
          onClick={onResetToDefault}
          className="text-[#505f76] hover:text-[#0058be] hover:bg-[#e6e7f2] transition-colors active:scale-95 p-2 rounded-lg flex items-center justify-center cursor-pointer"
          title="레퍼런스 기본값으로 초기화"
          aria-label="Reset to default"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="text-[#0058be] hover:bg-[#e6e7f2] transition-colors active:scale-95 p-2 rounded-lg flex items-center justify-center cursor-pointer"
          title="도면 핫링크 및 환경 설정"
          aria-label="Settings"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>

        {/* User Profile */}
        <button
          onClick={onOpenProfile}
          className="text-[#0058be] hover:bg-[#e6e7f2] transition-colors active:scale-95 p-2 rounded-lg flex items-center justify-center cursor-pointer"
          title="엔지니어 계정 및 워크스테이션 프로필"
          aria-label="User profile"
        >
          <User className="w-4.5 h-4.5" />
        </button>
      </div>
    </nav>
  );
};
