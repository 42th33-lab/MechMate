import React from "react";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { CompatibilityWarning } from "../types";

interface CompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  warning?: CompatibilityWarning;
  onDismissWarning: () => void;
  onJumpToStep: (stepNumber: number) => void;
}

export const CompatibilityModal: React.FC<CompatibilityModalProps> = ({
  isOpen,
  onClose,
  warning,
  onDismissWarning,
  onJumpToStep,
}) => {
  if (!isOpen) return null;

  const checks = [
    {
      title: "프레임 토크 및 구조 강도",
      status: "PASS",
      detail: "Ti-6Al-4V 티타늄 스트럿과 90도 브래킷 체결 강도 4.2 N·m 사양 충족",
    },
    {
      title: "구동 모터 전원 및 전압 규격",
      status: "PASS",
      detail: "24V 350W BLDC 모터와 스마트 PDB-v3 전원 공급 분배 규격 일치",
    },
    {
      title: "액추에이터 축 직경 및 공차",
      status: warning && !warning.dismissed ? "WARN" : "PASS",
      detail:
        warning && !warning.dismissed
          ? "4단계에서 서보 출력축 직경(8mm vs 10mm) 불일치 감지. 피벗 힌지 규격 확인 요망."
          : "모든 액추에이터 커플링 축 직경 공차 정합 완료 (H7/h6 공차계열).",
    },
    {
      title: "CAN 통신 버스 및 신호 대역폭",
      status: "PASS",
      detail: "1Mbps CAN-FD 통신 라인 종단 저항(120Ω) 정합 정상",
    },
    {
      title: "LiPo 배터리 방전율(C-Rate) 마진",
      status: "PASS",
      detail: "연속 최대 방전 100A 대비 6S 5000mAh 45C (225A 지원) 충분한 안전 마진 확보",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#c2c6d6] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#c2c6d6]/40 flex items-center justify-between bg-[#f2f3fd]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0058be] text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#191b23] font-['Inter']">
                공정 규격 및 부품 호환성 진단
              </h3>
              <p className="text-xs font-mono text-[#505f76]">
                기계/전장 인터페이스 정합성 및 안전성 검사 리포트
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
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-[#f9f9ff]">
          {/* Active Warning Banner if present */}
          {warning && !warning.dismissed && (
            <div className="bg-[#ffdad6]/40 border border-[#ffdad6] rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
              <div className="flex-1 text-xs font-mono">
                <h4 className="font-bold text-sm text-[#ba1a1a] mb-1">
                  {warning.title}
                </h4>
                <p className="text-[#424754] leading-relaxed mb-3">
                  {warning.message}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {warning.stepIndex && (
                    <button
                      onClick={() => {
                        onJumpToStep(warning.stepIndex!);
                        onClose();
                      }}
                      className="whitespace-nowrap px-2.5 py-1 rounded bg-[#ba1a1a] text-white font-bold hover:bg-[#93000a] flex items-center gap-1 cursor-pointer"
                    >
                      <span className="whitespace-nowrap">{warning.stepIndex}단계로 바로가기</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={onDismissWarning}
                    className="whitespace-nowrap px-2.5 py-1 rounded border border-[#ba1a1a]/40 text-[#ba1a1a] hover:bg-[#ffdad6]/60 cursor-pointer"
                  >
                    <span className="whitespace-nowrap">경고 확인 및 해결 처리</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Checklist of Compatibility */}
          <div className="bg-white rounded-lg border border-[#c2c6d6]/40 divide-y divide-[#c2c6d6]/20">
            {checks.map((item, i) => (
              <div key={i} className="p-3.5 flex items-start justify-between gap-3 text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#191b23] flex items-center gap-2">
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[#505f76] text-[11px] leading-relaxed">{item.detail}</p>
                </div>
                <span
                  className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    item.status === "PASS"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800 animate-pulse"
                  }`}
                >
                  {item.status === "PASS" ? "✓ 적합" : "⚠ 주의"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#c2c6d6]/40 bg-[#f2f3fd] flex justify-end">
          <button
            onClick={onClose}
            className="whitespace-nowrap px-4 py-1.5 bg-[#0058be] text-white rounded-lg text-xs font-mono font-medium hover:bg-[#004395] cursor-pointer shadow-2xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
