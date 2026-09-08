import React, { useState, useMemo } from "react";
import {
  X,
  GitFork,
  Check,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  RotateCw,
  Plus,
  Trash2,
  ListOrdered,
  Network,
  Info,
  Layers,
  ArrowDown,
  CheckCircle2,
} from "lucide-react";
import { AssemblyStep, BomItem } from "../types";
import { performTopologicalSort, willCreateCycle } from "../utils/topologicalSort";

interface GraphViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: AssemblyStep[];
  bom?: BomItem[];
  projectTitle?: string;
  onSelectStep: (stepId: string) => void;
  onUpdateSteps: (newSteps: AssemblyStep[]) => void;
  highlightStepId?: string;
}

export const GraphViewModal: React.FC<GraphViewModalProps> = ({
  isOpen,
  onClose,
  steps,
  bom,
  projectTitle,
  onSelectStep,
  onUpdateSteps,
  highlightStepId,
}) => {
  const [activeTab, setActiveTab] = useState<"graph" | "editor">("graph");
  const [selectedStepId, setSelectedStepId] = useState<string>(
    highlightStepId || steps[0]?.id || ""
  );
  const [isInferring, setIsInferring] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Compute Topological Sort
  const topoResult = useMemo(() => {
    return performTopologicalSort(steps);
  }, [steps]);

  if (!isOpen) return null;

  const currentSelectedStep = steps.find((s) => s.id === selectedStepId) || steps[0];

  // Handler: Add prerequisite dependency
  const handleAddDependency = (stepId: string, dependsOnId: string) => {
    if (!stepId || !dependsOnId || stepId === dependsOnId) return;

    if (willCreateCycle(steps, stepId, dependsOnId)) {
      alert("경고: 이 선행 조건을 추가하면 공정 간 순환 참조(Cycle)가 발생하여 위상정렬이 불가능해집니다.");
      return;
    }

    const updated = steps.map((s) => {
      if (s.id === stepId) {
        const existing = s.dependsOn || [];
        if (!existing.includes(dependsOnId)) {
          return { ...s, dependsOn: [...existing, dependsOnId] };
        }
      }
      return s;
    });

    onUpdateSteps(updated);
  };

  // Handler: Remove prerequisite dependency
  const handleRemoveDependency = (stepId: string, depIdToRemove: string) => {
    const updated = steps.map((s) => {
      if (s.id === stepId) {
        return {
          ...s,
          dependsOn: (s.dependsOn || []).filter((id) => id !== depIdToRemove),
        };
      }
      return s;
    });
    onUpdateSteps(updated);
  };

  // Handler: Apply Topological Sort order to the project
  const handleApplyTopologicalOrder = () => {
    if (topoResult.hasCycle) {
      alert("공정 간 순환 의존성이 존재하여 순서를 재배열할 수 없습니다. 순환을 먼저 해제해주세요.");
      return;
    }

    const reordered = topoResult.sortedSteps.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1,
      title: `${idx + 1}단계: ${step.title.replace(/^[0-9]+단계:\s*/, "")}`,
    }));

    onUpdateSteps(reordered);
    setAiMessage("위상정렬(DAG Kahn 알고리즘) 결과에 따라 공정 번호가 재배치되었습니다.");
    setTimeout(() => setAiMessage(null), 4000);
  };

  // Handler: AI-powered dependency inference using Gemini API
  const handleInferDependenciesWithAI = async () => {
    setIsInferring(true);
    setAiMessage(null);
    try {
      const response = await fetch("/api/infer-dependencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steps,
          bom,
          projectTitle,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.dependencies)) {
        // Map dependencies to steps
        const depMap = new Map<string, string[]>();
        data.dependencies.forEach((d: { stepId: string; dependsOn: string[] }) => {
          depMap.set(d.stepId, d.dependsOn || []);
        });

        const updated = steps.map((s) => ({
          ...s,
          dependsOn: depMap.get(s.id) ?? s.dependsOn ?? [],
        }));

        // Compute new topological sort with inferred deps
        const newTopo = performTopologicalSort(updated);

        if (!newTopo.hasCycle) {
          const reordered = newTopo.sortedSteps.map((step, idx) => ({
            ...step,
            stepNumber: idx + 1,
            title: `${idx + 1}단계: ${step.title.replace(/^[0-9]+단계:\s*/, "")}`,
          }));
          onUpdateSteps(reordered);
          setAiMessage(
            `제미나이 AI가 물리적/기계적 조립 선행 조건을 추론하여 위상정렬 공정 순서를 재편성했습니다 (${data.source === "gemini" ? "Gemini 3.8 Flash" : "지능형 메카니컬 룰"}).`
          );
        } else {
          onUpdateSteps(updated);
          setAiMessage("AI 선행 조건이 적용되었습니다.");
        }
      } else {
        alert("선행 공정 추론에 실패했습니다. 수동으로 의존성을 지정할 수 있습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("선행 공정 추론 통신 중 오류가 발생했습니다.");
    } finally {
      setIsInferring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#c2c6d6] w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#c2c6d6]/40 flex items-center justify-between bg-[#f2f3fd]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0058be] text-white">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#191b23] font-['Inter'] whitespace-nowrap">
                  기계 조립 공정 의존성 위상정렬 (Topological DAG Engine)
                </h3>
                <span className="whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d0e1fb] text-[#0058be] font-bold">
                  Kahn 알고리즘
                </span>
              </div>
              <p className="text-xs font-mono text-[#505f76] whitespace-nowrap">
                부품별 물리적 선행 공정 조건을 입력받고 방향성 비순환 그래프(DAG)로 최적 조립 순서를 도출합니다
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

        {/* Tab & Global Action Bar */}
        <div className="px-5 py-2.5 bg-white border-b border-[#c2c6d6]/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("graph")}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === "graph"
                  ? "bg-[#0058be] text-white font-bold"
                  : "bg-[#f2f3fd] text-[#505f76] hover:bg-[#e6e7f2]"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">위상정렬 레벨 및 DAG 뷰</span>
            </button>
            <button
              onClick={() => setActiveTab("editor")}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === "editor"
                  ? "bg-[#0058be] text-white font-bold"
                  : "bg-[#f2f3fd] text-[#505f76] hover:bg-[#e6e7f2]"
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">선행 조건(의존성) 편집기</span>
            </button>
          </div>

          {/* AI & Re-order Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleInferDependenciesWithAI}
              disabled={isInferring}
              className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0058be] to-[#004395] text-white font-semibold hover:shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isInferring ? "animate-spin" : ""}`} />
              <span className="whitespace-nowrap">
                {isInferring ? "제미나이 AI 선행 공정 분석 중..." : "제미나이 AI 선행 순서 자동 추론"}
              </span>
            </button>

            <button
              onClick={handleApplyTopologicalOrder}
              disabled={topoResult.hasCycle}
              className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-white border border-[#0058be] text-[#0058be] hover:bg-[#f2f3fd] font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">위상정렬 순서대로 단계 재배열</span>
            </button>
          </div>
        </div>

        {/* Status / Alert Banner */}
        {topoResult.hasCycle && (
          <div className="px-5 py-2.5 bg-[#ffdad6] border-b border-[#ba1a1a]/30 text-[#ba1a1a] text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap font-bold">
              [경고: 순환 의존성 감지] 일부 조립 단계 사이에 순환 관계가 있어 위상정렬이 불완전합니다.
            </span>
            <span className="text-[11px] opacity-80 truncate">
              (순환 의심 단계 ID: {topoResult.cycleNodes.join(", ")})
            </span>
          </div>
        )}

        {aiMessage && (
          <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">{aiMessage}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#f9f9ff]">
          {activeTab === "graph" ? (
            /* TAB 1: DAG Level-by-Level Visualization */
            <div className="space-y-6">
              {/* Info banner */}
              <div className="bg-white p-4 rounded-xl border border-[#c2c6d6]/60 shadow-2xs flex items-start gap-3 text-xs font-mono">
                <Info className="w-4 h-4 text-[#0058be] shrink-0 mt-0.5" />
                <div className="space-y-1 text-[#505f76]">
                  <p className="font-bold text-[#191b23]">
                    위상정렬 단계 계층 (Topological DAG Execution Levels)
                  </p>
                  <p>
                    같은 레벨의 공정들은 서로 독립적이므로 동시 병렬 조립이 가능하며, 상위 레벨의 공정이 완료되어야 하위 레벨 공정에 착수할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* Levels Container */}
              <div className="space-y-6">
                {topoResult.levels.map((levelSteps, levelIdx) => (
                  <div
                    key={`level-${levelIdx}`}
                    className="bg-white rounded-xl border border-[#c2c6d6]/60 p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#c2c6d6]/30 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-[#d0e1fb] text-[#0058be]">
                          공정 레벨 {levelIdx} {levelIdx === 0 ? "(초기 착수 가능)" : `(레벨 ${levelIdx - 1} 완료 후 착수)`}
                        </span>
                        <span className="text-xs font-mono text-[#505f76]">
                          병렬 진행 가능: {levelSteps.length}개 공정
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#505f76]">
                        진행률: {levelSteps.filter((s) => s.completed).length}/{levelSteps.length} 완료
                      </span>
                    </div>

                    {/* Steps in this level */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {levelSteps.map((step) => {
                        const isCompleted = step.completed;
                        const deps = (step.dependsOn || []).map((depId) =>
                          steps.find((s) => s.id === depId)
                        );

                        return (
                          <div
                            key={step.id}
                            onClick={() => {
                              onSelectStep(step.id);
                              onClose();
                            }}
                            className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                              isCompleted
                                ? "bg-white border-emerald-300"
                                : "bg-[#f2f3fd]/60 border-[#c2c6d6]/60 hover:bg-white hover:border-[#0058be]"
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                                      isCompleted
                                        ? "bg-emerald-600 text-white"
                                        : "bg-[#0058be] text-white"
                                    }`}
                                  >
                                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.stepNumber}
                                  </div>
                                  <h4 className="font-bold text-xs text-[#191b23] truncate">
                                    {step.title}
                                  </h4>
                                </div>

                                <span
                                  className={`whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                                    isCompleted
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-[#ecedf7] text-[#505f76]"
                                  }`}
                                >
                                  {isCompleted ? "완료됨" : "대기/진행"}
                                </span>
                              </div>

                              <p className="text-[11px] text-[#505f76] line-clamp-2 leading-relaxed">
                                {step.description}
                              </p>
                            </div>

                            {/* Dependencies tags */}
                            <div className="pt-2.5 mt-2 border-t border-[#c2c6d6]/30 text-[10px] font-mono space-y-1">
                              <div className="text-[#505f76] flex items-center gap-1">
                                <span className="font-bold whitespace-nowrap">선행 필수 공정:</span>
                                {deps.length === 0 ? (
                                  <span className="text-emerald-700 font-semibold whitespace-nowrap">
                                    없음 (즉시 착수)
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {deps.map((dep, dIdx) => (
                                      <span
                                        key={dIdx}
                                        className="whitespace-nowrap px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold"
                                      >
                                        {dep?.stepNumber}단계 ({dep?.title.split(":")[1]?.trim() || dep?.title})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Flow Down Indicator */}
                    {levelIdx < topoResult.levels.length - 1 && (
                      <div className="flex justify-center pt-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-[#0058be] font-bold">
                          <ArrowDown className="w-4 h-4 animate-bounce" />
                          <span className="whitespace-nowrap">하위 공정 레벨로 전이 (의존 조건 충족 시)</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* TAB 2: Dependency Editor */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step Selection List */}
              <div className="md:col-span-1 bg-white rounded-xl border border-[#c2c6d6]/60 p-3 space-y-2 shadow-2xs">
                <h4 className="font-bold text-xs font-mono text-[#191b23] px-2 py-1">
                  조립 단계 선택 ({steps.length}개)
                </h4>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {steps.map((s) => {
                    const isSelected = s.id === selectedStepId;
                    const depCount = (s.dependsOn || []).length;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStepId(s.id)}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-[#d0e1fb] border-[#0058be] font-bold text-[#0058be]"
                            : "bg-white border-[#c2c6d6]/40 hover:bg-[#f2f3fd] text-[#191b23]"
                        }`}
                      >
                        <span className="truncate whitespace-nowrap">
                          {s.stepNumber}단계: {s.title.replace(/^[0-9]+단계:\s*/, "")}
                        </span>
                        <span
                          className={`whitespace-nowrap text-[10px] px-1.5 py-0.5 rounded-full ${
                            depCount > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          선행 {depCount}개
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dependency Configuration for Selected Step */}
              <div className="md:col-span-2 bg-white rounded-xl border border-[#c2c6d6]/60 p-5 space-y-4 shadow-2xs">
                {currentSelectedStep ? (
                  <>
                    <div className="border-b border-[#c2c6d6]/40 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap text-xs font-mono px-2 py-0.5 rounded bg-[#0058be] text-white font-bold">
                          {currentSelectedStep.stepNumber}단계 공정
                        </span>
                        <h3 className="font-bold text-base text-[#191b23]">
                          {currentSelectedStep.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[#505f76] mt-1">
                        {currentSelectedStep.description}
                      </p>
                    </div>

                    {/* Existing Dependencies */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs font-mono text-[#191b23]">
                        현재 설정된 선행 필수 공정 (Predecessors)
                      </h4>

                      {(currentSelectedStep.dependsOn || []).length === 0 ? (
                        <div className="p-3 bg-[#f2f3fd] rounded-lg border border-[#c2c6d6]/40 text-xs font-mono text-[#505f76]">
                          선행 조건이 없습니다. 이 단계는 언제든지 착수할 수 있는 독립 공정입니다.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {(currentSelectedStep.dependsOn || []).map((depId) => {
                            const depStep = steps.find((s) => s.id === depId);
                            return (
                              <div
                                key={depId}
                                className="p-2.5 rounded-lg border border-[#c2c6d6]/60 bg-[#f9f9ff] flex items-center justify-between gap-3 text-xs font-mono"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="whitespace-nowrap px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">
                                    선행 #{depStep?.stepNumber || "?"}
                                  </span>
                                  <span className="truncate font-semibold text-[#191b23]">
                                    {depStep ? depStep.title : depId}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    handleRemoveDependency(currentSelectedStep.id, depId)
                                  }
                                  className="whitespace-nowrap p-1 text-[#505f76] hover:text-[#ba1a1a] rounded hover:bg-[#ffdad6]/40"
                                  title="선행 조건 제거"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Add Dependency Selector */}
                    <div className="space-y-2 pt-2 border-t border-[#c2c6d6]/40">
                      <h4 className="font-bold text-xs font-mono text-[#191b23]">
                        새 선행 공정 연결 추가
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {steps
                          .filter((s) => s.id !== currentSelectedStep.id)
                          .map((candidate) => {
                            const isAlreadyDep = (
                              currentSelectedStep.dependsOn || []
                            ).includes(candidate.id);
                            const createsCycle = willCreateCycle(
                              steps,
                              currentSelectedStep.id,
                              candidate.id
                            );

                            return (
                              <button
                                key={candidate.id}
                                disabled={isAlreadyDep || createsCycle}
                                onClick={() =>
                                  handleAddDependency(
                                    currentSelectedStep.id,
                                    candidate.id
                                  )
                                }
                                className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
                                  isAlreadyDep
                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                    : createsCycle
                                    ? "bg-[#ffdad6]/40 text-[#ba1a1a] border-[#ffdad6] cursor-not-allowed opacity-50"
                                    : "bg-white border-[#0058be]/40 text-[#0058be] hover:bg-[#0058be] hover:text-white"
                                }`}
                                title={
                                  createsCycle
                                    ? "순환 참조가 발생하므로 추가할 수 없습니다"
                                    : undefined
                                }
                              >
                                <Plus className="w-3 h-3" />
                                <span className="whitespace-nowrap">
                                  {candidate.stepNumber}단계 ({candidate.title.split(":")[1]?.trim() || candidate.title})
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs font-mono text-[#505f76] py-10 text-center">
                    단계를 선택해주세요.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#c2c6d6]/40 bg-[#f2f3fd] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="text-[#505f76]">
            전체 {steps.length}개 공정 중 {topoResult.levels.length}개 조립 계층으로 위상정렬됨
          </div>
          <button
            onClick={onClose}
            className="whitespace-nowrap px-4 py-1.5 bg-[#0058be] text-white rounded-lg font-medium hover:bg-[#004395] transition-colors cursor-pointer shadow-2xs"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
