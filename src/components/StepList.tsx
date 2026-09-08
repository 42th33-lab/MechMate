import React from "react";
import {
  GitFork,
  Check,
  RefreshCw,
  Edit2,
  Trash2,
  Plus,
  Clock,
  Gauge,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AssemblyStep } from "../types";

interface StepListProps {
  steps: AssemblyStep[];
  onToggleStep: (stepId: string) => void;
  onEditStep: (step: AssemblyStep) => void;
  onDeleteStep: (stepId: string) => void;
  onOpenGraphForStep: (stepId: string) => void;
  onAddNewStep: () => void;
  isCompactMode: boolean;
  activeStepId?: string;
  onSelectActiveStep: (step: AssemblyStep) => void;
}

export const StepList: React.FC<StepListProps> = ({
  steps,
  onToggleStep,
  onEditStep,
  onDeleteStep,
  onOpenGraphForStep,
  onAddNewStep,
  isCompactMode,
  activeStepId,
  onSelectActiveStep,
}) => {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {steps.map((step, index) => {
        const isCompleted = step.completed;
        const isActive = !isCompleted && (index === 0 || steps[index - 1]?.completed);
        const isSelected = activeStepId === step.id;

        return (
          <div
            key={step.id}
            onClick={() => onSelectActiveStep(step)}
            className={`bg-white rounded-lg transition-all duration-200 cursor-pointer ${
              isCompleted
                ? "p-4 md:p-5 shadow-xs border border-[#c2c6d6]/40 opacity-80 hover:opacity-100"
                : isActive
                ? "p-5 md:p-6 shadow-md border-l-4 border-l-[#0058be] border-[#c2c6d6]/50 ring-1 ring-[#0058be]/20"
                : "p-4 md:p-5 shadow-xs border border-[#c2c6d6]/40 hover:border-[#0058be]/40"
            } ${isSelected ? "ring-2 ring-[#0058be]" : ""}`}
          >
            <div className="flex items-start gap-3 md:gap-4">
              {/* Step Checkbox */}
              <div className="mt-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <input
                  id={`checkbox-${step.id}`}
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => onToggleStep(step.id)}
                  className="w-5 h-5 rounded-[4px] border-[#c2c6d6] text-[#0058be] focus:ring-[#0058be] cursor-pointer accent-[#0058be]"
                />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <label
                    htmlFor={`checkbox-${step.id}`}
                    className="cursor-pointer select-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3
                      className={`text-base md:text-lg font-bold font-['Inter'] transition-colors ${
                        isCompleted
                          ? "text-[#505f76] line-through decoration-2"
                          : "text-[#191b23] hover:text-[#0058be]"
                      }`}
                    >
                      {step.title}
                    </h3>
                  </label>

                  {/* Step Action Buttons */}
                  <div
                    className="flex items-center gap-1 opacity-80 hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onEditStep(step)}
                      className="p-1 rounded text-[#505f76] hover:text-[#0058be] hover:bg-[#e6e7f2] transition-colors"
                      title="단계 수정"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {steps.length > 1 && (
                      <button
                        onClick={() => onDeleteStep(step.id)}
                        className="p-1 rounded text-[#505f76] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/60 transition-colors"
                        title="단계 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs md:text-sm text-[#424754] mt-1.5 mb-3 leading-relaxed">
                  {step.description}
                </p>

                {/* Required Parts Container */}
                {step.requiredParts && step.requiredParts.length > 0 && (
                  <div
                    className={`bg-[#f2f3fd] rounded-lg p-3 mb-3 border border-[#c2c6d6]/30 ${
                      isCompactMode ? "py-2" : "py-3"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-mono text-[11px] font-bold text-[#505f76] uppercase tracking-wider">
                        필요 부품
                      </h4>
                      {step.torqueSpec && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#0058be] bg-white px-2 py-0.5 rounded border border-[#c2c6d6]/40">
                          <Gauge className="w-3 h-3" />
                          {step.torqueSpec}
                        </span>
                      )}
                    </div>

                    <ul className="text-xs font-mono text-[#424754] list-disc list-inside space-y-1">
                      {step.requiredParts.map((part, pIdx) => (
                        <li key={pIdx} className="leading-snug">
                          {part}
                        </li>
                      ))}
                    </ul>

                    {step.notes && (
                      <p className="text-[11px] font-mono text-[#924700] mt-2 pt-1.5 border-t border-[#c2c6d6]/20">
                        ⚡ {step.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Bottom Action and Status Pill */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenGraphForStep(step.id);
                      }}
                      className={`whitespace-nowrap p-2 rounded flex items-center gap-1.5 transition-colors text-xs font-mono font-medium cursor-pointer ${
                        isActive
                          ? "bg-[#0058be] hover:bg-[#004395] text-white shadow-xs"
                          : "text-[#0058be] hover:bg-[#ecedf7]"
                      }`}
                    >
                      <GitFork className="w-4 h-4" />
                      <span className="whitespace-nowrap">의존성 그래프 보기</span>
                    </button>

                    {step.dependsOn && step.dependsOn.length > 0 && (
                      <span className="whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold">
                        선행 {step.dependsOn.length}개 공정
                      </span>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div>
                    {isCompleted ? (
                      <span className="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d0e1fb]/60 text-[#505f76] font-mono text-[11px] font-semibold uppercase">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="whitespace-nowrap">조립 완료</span>
                      </span>
                    ) : isActive ? (
                      <span className="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d8e2ff] text-[#0058be] font-mono text-[11px] font-bold uppercase ring-1 ring-[#0058be]/20 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span className="whitespace-nowrap">진행 중</span>
                      </span>
                    ) : (
                      <span className="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ecedf7] text-[#505f76] font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        <span className="whitespace-nowrap">대기 중</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add New Step Button */}
      <button
        onClick={onAddNewStep}
        className="whitespace-nowrap w-full border-2 border-dashed border-[#c2c6d6] hover:border-[#0058be] bg-white/60 hover:bg-[#f2f3fd] rounded-lg p-3 text-xs md:text-sm font-mono font-medium text-[#0058be] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
      >
        <Plus className="w-4 h-4" />
        <span className="whitespace-nowrap">새 조립 단계 추가</span>
      </button>
    </div>
  );
};
