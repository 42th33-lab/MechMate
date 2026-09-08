import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  AlertTriangle,
  X,
  Sparkles,
} from "lucide-react";
import {
  AssemblyProject,
  AssemblyStep,
  BomItem,
  ActiveScreen,
  SidebarTab,
  SavedProjectRecord,
} from "./types";
import {
  INITIAL_BATTLE_ROBOT_PROJECT,
  INITIAL_SAVED_PROJECTS,
} from "./data/initialData";
import { TopNavBar } from "./components/TopNavBar";
import { SideNavBar } from "./components/SideNavBar";
import { StepList } from "./components/StepList";
import { BlueprintViewer } from "./components/BlueprintViewer";
import { InitialPromptScreen } from "./components/InitialPromptScreen";
import { HomeScreen } from "./components/HomeScreen";
import { GraphViewModal } from "./components/GraphViewModal";
import { BomModal } from "./components/BomModal";
import { CompatibilityModal } from "./components/CompatibilityModal";
import { ToolkitModal } from "./components/ToolkitModal";
import { AddPartModal } from "./components/AddPartModal";
import { EditStepModal } from "./components/EditStepModal";
import { ExportModal } from "./components/ExportModal";
import { SettingsModal } from "./components/SettingsModal";
import { EngineerProfileModal } from "./components/EngineerProfileModal";

export default function App() {
  // Navigation & Screen State: Defaults to "home" so user sees their projects first!
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("home");
  const [activeTab, setActiveTab] = useState<SidebarTab>("steps");
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Saved Projects List State
  const [savedProjects, setSavedProjects] = useState<SavedProjectRecord[]>(() => {
    const saved = localStorage.getItem("mechmate_saved_projects_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse saved projects:", e);
      }
    }
    return INITIAL_SAVED_PROJECTS;
  });

  // Current Working Project Data State
  const [project, setProject] = useState<AssemblyProject>(() => {
    const saved = localStorage.getItem("mechmate_project_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to load current project:", e);
      }
    }
    return INITIAL_BATTLE_ROBOT_PROJECT;
  });

  const [activeStepId, setActiveStepId] = useState<string>("step-2");

  // Modals
  const [isGraphModalOpen, setIsGraphModalOpen] = useState<boolean>(false);
  const [highlightGraphStepId, setHighlightGraphStepId] = useState<string | undefined>();
  const [isBomModalOpen, setIsBomModalOpen] = useState<boolean>(false);
  const [isCompatibilityModalOpen, setIsCompatibilityModalOpen] = useState<boolean>(false);
  const [isToolkitModalOpen, setIsToolkitModalOpen] = useState<boolean>(false);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [editingStep, setEditingStep] = useState<AssemblyStep | null>(null);

  // Save current project and saved projects to local storage on change
  useEffect(() => {
    localStorage.setItem("mechmate_project_v1", JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    localStorage.setItem("mechmate_saved_projects_v2", JSON.stringify(savedProjects));
  }, [savedProjects]);

  // Keep saved projects updated with current active project's progress
  useEffect(() => {
    setSavedProjects((prev) =>
      prev.map((rec) => {
        if (rec.title === project.title) {
          return {
            ...rec,
            stepCount: project.steps.length,
            completedCount: project.steps.filter((s) => s.completed).length,
            bomCount: project.bom.length,
            hasWarning: Boolean(project.warning && !project.warning.dismissed),
            updatedAt: "방금 전 동기화",
            project,
          };
        }
        return rec;
      })
    );
  }, [project]);

  // Calculations
  const completedStepsCount = project.steps.filter((s) => s.completed).length;
  const totalStepsCount = project.steps.length;
  const progressPercent = totalStepsCount > 0 ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0;

  // Step Completion Handler
  const handleToggleStep = (stepId: string) => {
    setProject((prev) => {
      const updatedSteps = prev.steps.map((s) =>
        s.id === stepId ? { ...s, completed: !s.completed } : s
      );

      const newlyCompleted = updatedSteps.filter((s) => s.completed).length;
      if (newlyCompleted === updatedSteps.length && updatedSteps.length > 0) {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      return {
        ...prev,
        steps: updatedSteps,
      };
    });
  };

  // Add New Step
  const handleAddNewStep = () => {
    const nextNum = project.steps.length + 1;
    const lastStep = project.steps[project.steps.length - 1];
    const newStep: AssemblyStep = {
      id: `step-${Date.now()}`,
      stepNumber: nextNum,
      title: `${nextNum}단계: 신규 서브시스템 조립`,
      description: "새로운 부품 결합 및 배선 연결 작업을 수행합니다.",
      completed: false,
      requiredParts: ["1x 모듈 어셈블리", "4x M4 고정 볼트"],
      notes: "사양에 맞는 체결 토크 준수",
      diagramHotlink: project.blueprintUrl,
      dependsOn: lastStep ? [lastStep.id] : [],
    };

    setProject((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
    setActiveStepId(newStep.id);
  };

  // Delete Step
  const handleDeleteStep = (stepId: string) => {
    setProject((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((s) => s.id !== stepId)
        .map((s, idx) => ({ ...s, stepNumber: idx + 1 })),
    }));
  };

  // Save Step Edit
  const handleSaveStep = (updatedStep: AssemblyStep) => {
    setProject((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === updatedStep.id ? updatedStep : s)),
    }));
  };

  // Add BOM Part
  const handleAddBomPart = (newPart: BomItem) => {
    setProject((prev) => ({
      ...prev,
      bom: [...prev.bom, newPart],
    }));
  };

  // Delete BOM Item
  const handleDeleteBomItem = (bomId: string) => {
    setProject((prev) => ({
      ...prev,
      bom: prev.bom.filter((b) => b.id !== bomId),
    }));
  };

  // Dismiss Compatibility Warning
  const handleDismissWarning = () => {
    setProject((prev) => ({
      ...prev,
      warning: prev.warning ? { ...prev.warning, dismissed: true } : undefined,
    }));
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm("기본 레퍼런스 프로젝트(전투 로봇 v2)로 복원하시겠습니까?")) {
      setProject(INITIAL_BATTLE_ROBOT_PROJECT);
      setActiveStepId("step-2");
    }
  };

  // Open Graph for specific step
  const handleOpenGraphForStep = (stepId: string) => {
    setHighlightGraphStepId(stepId);
    setIsGraphModalOpen(true);
  };

  // Handle Sidebar Tab Click
  const handleTabChange = (tab: SidebarTab) => {
    setActiveTab(tab);
    if (tab === "graph") {
      setIsGraphModalOpen(true);
    } else if (tab === "bom") {
      setIsBomModalOpen(true);
    } else if (tab === "compatibility") {
      setIsCompatibilityModalOpen(true);
    } else if (tab === "toolkit") {
      setIsToolkitModalOpen(true);
    }
  };

  // Home Screen Project Operations
  const handleOpenProjectFromHome = (selectedProject: AssemblyProject) => {
    setProject(selectedProject);
    setActiveStepId(selectedProject.steps[0]?.id || "step-1");
    setActiveScreen("assembly_manager");
  };

  const handleDuplicateProject = (record: SavedProjectRecord) => {
    const newId = `proj-dup-${Date.now()}`;
    const duplicatedProj: AssemblyProject = {
      ...record.project,
      id: newId,
      title: `${record.title} (복사본)`,
    };

    const newRecord: SavedProjectRecord = {
      ...record,
      id: newId,
      title: duplicatedProj.title,
      updatedAt: "방금 복제됨",
      project: duplicatedProj,
    };

    setSavedProjects((prev) => [newRecord, ...prev]);
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm("선택한 프로젝트를 목록에서 삭제하시겠습니까?")) {
      setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  };

  const handleResetAllUserData = () => {
    setProject(INITIAL_BATTLE_ROBOT_PROJECT);
    setSavedProjects(INITIAL_SAVED_PROJECTS);
    localStorage.removeItem("mechmate_project_v1");
    localStorage.removeItem("mechmate_saved_projects_v2");
    setIsProfileModalOpen(false);
  };

  const activeStepObj = project.steps.find((s) => s.id === activeStepId) || project.steps[0];

  return (
    <div className="h-screen max-h-screen flex flex-col bg-[#f9f9ff] text-[#191b23] font-['Inter'] overflow-hidden select-text">
      {/* Top Navigation Bar */}
      <TopNavBar
        activeScreen={activeScreen}
        onScreenChange={setActiveScreen}
        isCompactMode={isCompactMode}
        onToggleCompact={() => setIsCompactMode(!isCompactMode)}
        onSave={() => {
          localStorage.setItem("mechmate_project_v1", JSON.stringify(project));
          localStorage.setItem("mechmate_saved_projects_v2", JSON.stringify(savedProjects));
          alert("현재 공정 및 프로젝트 데이터가 안전하게 저장되었습니다.");
        }}
        onExport={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onResetToDefault={handleResetToDefault}
      />

      {/* Screen 1: Home Dashboard Screen */}
      {activeScreen === "home" && (
        <HomeScreen
          currentProject={project}
          savedProjects={savedProjects}
          onOpenProject={handleOpenProjectFromHome}
          onNewProject={() => setActiveScreen("prompt_setup")}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onResumeCurrent={() => setActiveScreen("assembly_manager")}
        />
      )}

      {/* Screen 2: Initial Prompt & Configuration Screen */}
      {activeScreen === "prompt_setup" && (
        <InitialPromptScreen
          currentProject={project}
          onStartProject={(newProject) => {
            setProject(newProject);
            // Also append or update to saved projects
            setSavedProjects((prev) => {
              const existingIdx = prev.findIndex((p) => p.title === newProject.title);
              const newRec: SavedProjectRecord = {
                id: newProject.id || `proj-${Date.now()}`,
                title: newProject.title,
                subtitle: newProject.subtitle || "AI 공정 지침서",
                version: newProject.version,
                description: newProject.description,
                category: newProject.category || "엔지니어링",
                stepCount: newProject.steps.length,
                completedCount: newProject.steps.filter((s) => s.completed).length,
                bomCount: newProject.bom.length,
                hasWarning: Boolean(newProject.warning && !newProject.warning.dismissed),
                updatedAt: "방금 생성됨",
                blueprintUrl: newProject.blueprintUrl,
                project: newProject,
              };

              if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = newRec;
                return updated;
              }
              return [newRec, ...prev];
            });

            setActiveScreen("assembly_manager");
            setActiveStepId(newProject.steps[0]?.id || "step-1");
          }}
        />
      )}

      {/* Screen 3: Assembly Management & Realtime Editor */}
      {activeScreen === "assembly_manager" && (
        <div className="flex flex-1 overflow-hidden relative">
          {/* Desktop Sidebar */}
          <div className="hidden md:block h-full">
            <SideNavBar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onOpenAddPart={() => setIsAddPartModalOpen(true)}
              version={project.version}
              hasWarning={Boolean(project.warning && !project.warning.dismissed)}
              totalBomCount={project.bom.length}
              completedStepsCount={completedStepsCount}
              totalStepsCount={totalStepsCount}
            />
          </div>

          {/* Mobile Drawer Sidebar */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden bg-black/50 flex">
              <div className="w-72 h-full bg-[#f2f3fd] shadow-2xl">
                <SideNavBar
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  onOpenAddPart={() => {
                    setIsMobileMenuOpen(false);
                    setIsAddPartModalOpen(true);
                  }}
                  version={project.version}
                  hasWarning={Boolean(project.warning && !project.warning.dismissed)}
                  totalBomCount={project.bom.length}
                  completedStepsCount={completedStepsCount}
                  totalStepsCount={totalStepsCount}
                  onCloseMobile={() => setIsMobileMenuOpen(false)}
                />
              </div>
              <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
            </div>
          )}

          {/* Main Content Canvas (Fit-to-Screen / Responsive viewport) */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#f9f9ff] flex flex-col">
            <div className="max-w-[1240px] w-full mx-auto flex flex-col gap-4 md:gap-5 flex-1">
              {/* Page Header & Progress */}
              <header className="flex flex-col gap-3 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#191b23] tracking-tight font-['Inter']">
                      {project.title}
                    </h1>
                    <p className="text-xs md:text-sm font-mono text-[#424754] mt-0.5">
                      {project.subtitle} • {project.description}
                    </p>
                  </div>

                  {/* Prompt Refine Quick Button */}
                  <button
                    onClick={() => setActiveScreen("prompt_setup")}
                    className="whitespace-nowrap px-3 py-1.5 rounded-lg border border-[#c2c6d6] hover:border-[#0058be] bg-white text-xs font-mono text-[#0058be] hover:bg-[#f2f3fd] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="초기 프롬프트 수정 화면으로 이동"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">프롬프트 수정 / 재설정</span>
                  </button>
                </div>

                {/* Progress Bar Card */}
                <div className="bg-white rounded-lg p-3.5 md:p-4 shadow-[0px_2px_4px_rgba(31,41,55,0.06),0px_4px_12px_rgba(31,41,55,0.04)] border border-[#c2c6d6]/40 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-bold uppercase text-[#0058be] flex items-center gap-1.5 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-[#0058be] animate-ping inline-block shrink-0" />
                      전체 진행 상황
                    </span>
                    <span className="text-[#424754] font-semibold whitespace-nowrap">
                      {completedStepsCount}/{totalStepsCount} 단계 완료 ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#ecedf7] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0058be] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </header>

              {/* Compatibility Banner */}
              {project.warning && !project.warning.dismissed && (
                <div className="bg-[#ffdad6]/35 border border-[#ffdad6] text-[#191b23] rounded-lg p-3.5 md:p-4 flex items-start gap-3 shrink-0 shadow-2xs">
                  <AlertTriangle
                    className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5"
                    style={{ fill: "#ba1a1a", color: "#ffffff" }}
                  />
                  <div className="flex-1 text-xs md:text-sm">
                    <h3 className="font-bold text-[#ba1a1a] mb-0.5 font-['Inter']">
                      {project.warning.title}
                    </h3>
                    <p className="text-[#424754] leading-relaxed">
                      {project.warning.message}
                    </p>
                  </div>
                  <button
                    onClick={handleDismissWarning}
                    className="text-[#ba1a1a] hover:bg-[#ffdad6]/60 p-1 rounded transition-colors cursor-pointer"
                    title="경고 닫기"
                    aria-label="Dismiss warning"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Checklist & Diagram Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0">
                {/* Steps Container (8 cols) */}
                <div className="lg:col-span-8 flex flex-col overflow-y-visible">
                  <StepList
                    steps={project.steps}
                    onToggleStep={handleToggleStep}
                    onEditStep={(step) => setEditingStep(step)}
                    onDeleteStep={handleDeleteStep}
                    onOpenGraphForStep={handleOpenGraphForStep}
                    onAddNewStep={handleAddNewStep}
                    isCompactMode={isCompactMode}
                    activeStepId={activeStepId}
                    onSelectActiveStep={(step) => setActiveStepId(step.id)}
                  />
                </div>

                {/* Right Sidebar Blueprint Viewport (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-4 sticky top-0 self-start">
                  <BlueprintViewer
                    blueprintUrl={project.blueprintUrl}
                    onUpdateBlueprintUrl={(url) =>
                      setProject((prev) => ({ ...prev, blueprintUrl: url }))
                    }
                    activeStep={activeStepObj}
                    isCompactMode={isCompactMode}
                  />

                  {/* Quick Action Cards below blueprint */}
                  <div className="bg-white rounded-lg p-3.5 border border-[#c2c6d6]/40 shadow-2xs space-y-2.5 text-xs font-mono">
                    <div className="font-bold text-[#505f76] uppercase tracking-wider text-[11px] whitespace-nowrap">
                      공정 빠른 제어
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setIsBomModalOpen(true)}
                        className="whitespace-nowrap p-2 rounded bg-[#f2f3fd] hover:bg-[#d0e1fb] text-[#0058be] font-bold text-center transition-colors border border-[#adc6ff]/40 cursor-pointer"
                      >
                        <span className="whitespace-nowrap">BOM 목록 ({project.bom.length})</span>
                      </button>
                      <button
                        onClick={() => setIsToolkitModalOpen(true)}
                        className="whitespace-nowrap p-2 rounded bg-[#f2f3fd] hover:bg-[#d0e1fb] text-[#0058be] font-bold text-center transition-colors border border-[#adc6ff]/40 cursor-pointer"
                      >
                        <span className="whitespace-nowrap">툴킷 점검 ({project.toolkit.length})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Embedded Footer */}
              <footer className="w-full py-4 mt-auto border-t border-[#c2c6d6]/40 flex flex-wrap justify-between items-center text-xs font-mono text-[#505f76] gap-2 shrink-0">
                <span className="whitespace-nowrap">© 2024 MechMate Engineering Systems</span>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="whitespace-nowrap hover:text-[#0058be] transition-colors cursor-pointer"
                  >
                    기술 사양
                  </button>
                  <button
                    onClick={() => setIsCompatibilityModalOpen(true)}
                    className="whitespace-nowrap hover:text-[#0058be] transition-colors cursor-pointer"
                  >
                    호환성 리포트
                  </button>
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="whitespace-nowrap hover:text-[#0058be] transition-colors cursor-pointer"
                  >
                    내보내기
                  </button>
                </div>
              </footer>
            </div>
          </main>
        </div>
      )}

      {/* Global Modals */}
      <GraphViewModal
        isOpen={isGraphModalOpen}
        onClose={() => setIsGraphModalOpen(false)}
        steps={project.steps}
        bom={project.bom}
        projectTitle={project.title}
        highlightStepId={highlightGraphStepId}
        onSelectStep={(stepId) => setActiveStepId(stepId)}
        onUpdateSteps={(newSteps) => setProject((prev) => ({ ...prev, steps: newSteps }))}
      />

      <BomModal
        isOpen={isBomModalOpen}
        onClose={() => setIsBomModalOpen(false)}
        bom={project.bom}
        onAddPart={() => {
          setIsBomModalOpen(false);
          setIsAddPartModalOpen(true);
        }}
        onDeleteBomItem={handleDeleteBomItem}
      />

      <CompatibilityModal
        isOpen={isCompatibilityModalOpen}
        onClose={() => setIsCompatibilityModalOpen(false)}
        warning={project.warning}
        onDismissWarning={handleDismissWarning}
        onJumpToStep={(stepNum) => {
          const target = project.steps.find((s) => s.stepNumber === stepNum);
          if (target) setActiveStepId(target.id);
        }}
      />

      <ToolkitModal
        isOpen={isToolkitModalOpen}
        onClose={() => setIsToolkitModalOpen(false)}
        toolkit={project.toolkit}
        onToggleTool={(toolId) =>
          setProject((prev) => ({
            ...prev,
            toolkit: prev.toolkit.map((t) =>
              t.id === toolId ? { ...t, checked: !t.checked } : t
            ),
          }))
        }
        onAddTool={(tool) =>
          setProject((prev) => ({
            ...prev,
            toolkit: [...prev.toolkit, tool],
          }))
        }
        onDeleteTool={(toolId) =>
          setProject((prev) => ({
            ...prev,
            toolkit: prev.toolkit.filter((t) => t.id !== toolId),
          }))
        }
      />

      <AddPartModal
        isOpen={isAddPartModalOpen}
        onClose={() => setIsAddPartModalOpen(false)}
        onAddPart={handleAddBomPart}
      />

      <EditStepModal
        isOpen={Boolean(editingStep)}
        onClose={() => setEditingStep(null)}
        step={editingStep}
        onSaveStep={handleSaveStep}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title={project.title}
        version={project.version}
        blueprintUrl={project.blueprintUrl}
        onUpdateSettings={({ title, version, blueprintUrl }) =>
          setProject((prev) => ({ ...prev, title, version, blueprintUrl }))
        }
        onResetBlueprint={() =>
          setProject((prev) => ({ ...prev, blueprintUrl: INITIAL_BATTLE_ROBOT_PROJECT.blueprintUrl }))
        }
      />

      <EngineerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        projectCount={savedProjects.length}
        totalStepsCount={savedProjects.reduce((acc, p) => acc + p.stepCount, 0)}
        completedStepsCount={savedProjects.reduce((acc, p) => acc + p.completedCount, 0)}
        onResetAllData={handleResetAllUserData}
      />
    </div>
  );
}
