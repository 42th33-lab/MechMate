import React from "react";
import {
  X,
  User,
  Shield,
  Clock,
  HardDrive,
  Cpu,
  Layers,
  CheckCircle2,
  FileDown,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface EngineerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCount: number;
  totalStepsCount: number;
  completedStepsCount: number;
  onResetAllData: () => void;
}

export const EngineerProfileModal: React.FC<EngineerProfileModalProps> = ({
  isOpen,
  onClose,
  projectCount,
  totalStepsCount,
  completedStepsCount,
  onResetAllData,
}) => {
  if (!isOpen) return null;

  const handleExportWorkLog = () => {
    const logData = {
      engineer: "엔지니어 (42th33@djshs.djsch.kr)",
      timestamp: new Date().toISOString(),
      platform: "MechMate Mechanical Assembly Studio",
      projectCount,
      totalStepsCount,
      completedStepsCount,
      systemStatus: "CAD Link Active, Kahn DAG Topological Engine Ready",
    };
    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mechmate_engineer_log_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#c2c6d6] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#c2c6d6]/40 flex items-center justify-between bg-[#f2f3fd]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0058be] text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#191b23] font-['Inter']">
                엔지니어 워크스테이션 프로필
              </h3>
              <p className="text-xs font-mono text-[#505f76]">
                메카트로닉스 시스템 및 라이선스 정보
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#505f76] hover:bg-[#e6e7f2] hover:text-[#191b23] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 bg-[#f9f9ff]">
          {/* User Card */}
          <div className="bg-white p-4 rounded-xl border border-[#c2c6d6]/60 shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#d0e1fb] text-[#0058be] flex items-center justify-center font-bold text-base font-mono">
              ENG
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-[#191b23]">수석 기계 조립 엔지니어</h4>
                <span className="whitespace-nowrap text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  인증됨
                </span>
              </div>
              <p className="text-xs font-mono text-[#505f76] truncate">
                42th33@djshs.djsch.kr
              </p>
              <p className="text-[11px] font-mono text-[#505f76]">
                소속: 정밀 메카트로닉스 공학실
              </p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="bg-white p-3 rounded-lg border border-[#c2c6d6]/50">
              <div className="text-[#505f76] whitespace-nowrap">관리 중인 프로젝트</div>
              <div className="text-lg font-bold text-[#0058be] mt-1">{projectCount}개</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[#c2c6d6]/50">
              <div className="text-[#505f76] whitespace-nowrap">완료된 조립 공정</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">
                {completedStepsCount}/{totalStepsCount} 단계
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[#c2c6d6]/50">
              <div className="text-[#505f76] whitespace-nowrap">위상정렬 (DAG)</div>
              <div className="text-xs font-bold text-[#191b23] mt-1">Kahn 알고리즘 탑재</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[#c2c6d6]/50">
              <div className="text-[#505f76] whitespace-nowrap">CAD 도면 링크</div>
              <div className="text-xs font-bold text-emerald-700 mt-1">실시간 활성화</div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleExportWorkLog}
              className="whitespace-nowrap w-full py-2 px-3 rounded-lg bg-white border border-[#c2c6d6] hover:border-[#0058be] text-[#0058be] text-xs font-mono font-medium hover:bg-[#f2f3fd] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <FileDown className="w-4 h-4" />
              <span className="whitespace-nowrap">작업 로그 및 세션 데이터 내보내기 (JSON)</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm("모든 로컬 프로젝트 캐시를 초기화하고 기본 샘플로 복원하시겠습니까?")) {
                  onResetAllData();
                  onClose();
                }
              }}
              className="whitespace-nowrap w-full py-2 px-3 rounded-lg bg-white border border-[#c2c6d6] text-[#505f76] hover:text-[#ba1a1a] hover:border-[#ba1a1a]/50 text-xs font-mono font-medium hover:bg-[#ffdad6]/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">로컬 저장소 초기화 및 기본값 복원</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#c2c6d6]/40 bg-[#f2f3fd] flex justify-end">
          <button
            onClick={onClose}
            className="whitespace-nowrap px-4 py-1.5 bg-[#0058be] text-white rounded-lg text-xs font-mono font-medium hover:bg-[#004395] transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
