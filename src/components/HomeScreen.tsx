import React, { useState } from "react";
import {
  Wrench,
  Sparkles,
  Plus,
  Play,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Bot,
  Plane,
  Truck,
  Cpu,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  FileCode,
  ShieldCheck,
  GitFork,
  ExternalLink,
} from "lucide-react";
import { AssemblyProject, SavedProjectRecord } from "../types";
import { PRESET_PROJECTS } from "../data/initialData";

interface HomeScreenProps {
  currentProject: AssemblyProject;
  savedProjects: SavedProjectRecord[];
  onOpenProject: (project: AssemblyProject) => void;
  onNewProject: () => void;
  onDuplicateProject: (projectRecord: SavedProjectRecord) => void;
  onDeleteProject: (projectId: string) => void;
  onResumeCurrent: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentProject,
  savedProjects,
  onOpenProject,
  onNewProject,
  onDuplicateProject,
  onDeleteProject,
  onResumeCurrent,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");

  const categories = ["전체", "전투 로보틱스", "무인 항공기", "산업용 매니퓰레이터", "자율주행 물류"];

  const filteredProjects = savedProjects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "전체" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const currentProgress =
    currentProject.steps.length > 0
      ? Math.round(
          (currentProject.steps.filter((s) => s.completed).length /
            currentProject.steps.length) *
            100
        )
      : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f9f9ff] text-[#191b23] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#0058be] to-[#003c82] rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
            <Cpu className="w-80 h-80 -mr-16" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-mono font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">MechMate 정밀 엔지니어링 스튜디오</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight font-['Inter']">
              기계 설계 및 조립 공정 관리 대시보드
            </h1>

            <p className="text-sm md:text-base text-blue-100 leading-relaxed">
              CAD 도면 핫링크, BOM 부품 관리, AI 기반 선행 공정 위상정렬(Topological Sort)을 통해 최적의 기계 조립 가이드를 구축하세요.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onNewProject}
                className="whitespace-nowrap px-5 py-2.5 rounded-xl bg-white text-[#0058be] font-bold text-xs md:text-sm hover:bg-blue-50 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="whitespace-nowrap">새 조립 프로젝트 생성</span>
              </button>

              <button
                onClick={onResumeCurrent}
                className="whitespace-nowrap px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs md:text-sm backdrop-blur-xs active:scale-95 transition-all border border-white/30 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span className="whitespace-nowrap">최근 작업 이어하기: {currentProject.title}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Status Metrics Ribbon */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#c2c6d6]/60 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-mono text-[#505f76] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0058be]" />
              <span className="whitespace-nowrap">등록 프로젝트</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-[#191b23] mt-2">
              {savedProjects.length}개
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#c2c6d6]/60 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-mono text-[#505f76] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="whitespace-nowrap">현재 프로젝트 공정률</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-emerald-600 mt-2">
              {currentProgress}%
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#c2c6d6]/60 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-mono text-[#505f76] flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-[#0058be]" />
              <span className="whitespace-nowrap">위상정렬 엔진</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-[#0058be] mt-2">
              Kahn DAG 지원
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#c2c6d6]/60 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-mono text-[#505f76] flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span className="whitespace-nowrap">보유 툴킷 점검</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-[#191b23] mt-2">
              {currentProject.toolkit.filter((t) => t.checked).length} / {currentProject.toolkit.length}개 확보
            </div>
          </div>
        </section>

        {/* My Projects Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#191b23] tracking-tight font-['Inter']">
                내가 제작 중인 기계 프로젝트
              </h2>
              <p className="text-xs md:text-sm font-mono text-[#505f76]">
                저장된 조립 공정 매뉴얼 및 부품 명세서 목록입니다
              </p>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#505f76]" />
                <input
                  type="text"
                  placeholder="프로젝트 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs font-mono border border-[#c2c6d6] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#0058be] w-48 sm:w-60"
                />
              </div>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-mono transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#0058be] text-white font-semibold shadow-xs"
                    : "bg-white text-[#505f76] border border-[#c2c6d6]/60 hover:bg-[#f2f3fd]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((item) => {
              const progress =
                item.stepCount > 0
                  ? Math.round((item.completedCount / item.stepCount) * 100)
                  : 0;
              const isCurrent = item.title === currentProject.title;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                    isCurrent
                      ? "border-[#0058be] ring-2 ring-[#0058be]/20"
                      : "border-[#c2c6d6]/60 hover:border-[#0058be]/40"
                  }`}
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="whitespace-nowrap text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#d0e1fb] text-[#0058be] font-bold">
                            {item.version}
                          </span>
                          <span className="whitespace-nowrap text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#ecedf7] text-[#505f76]">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-[#191b23] line-clamp-1 font-['Inter']">
                          {item.title}
                        </h3>
                      </div>

                      {item.hasWarning && (
                        <div
                          className="p-1 rounded bg-[#ffdad6] text-[#ba1a1a]"
                          title="호환성 경고 발생"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-[#505f76] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-mono text-[#505f76]">
                        <span className="whitespace-nowrap">조립 공정률</span>
                        <span className="font-bold whitespace-nowrap">
                          {item.completedCount}/{item.stepCount} 단계 ({progress}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#ecedf7] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0058be] rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#505f76] pt-1 border-t border-[#c2c6d6]/30">
                      <span className="whitespace-nowrap">BOM 부품: {item.bomCount}종</span>
                      <span className="whitespace-nowrap">{item.updatedAt}</span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-5 py-3 bg-[#f2f3fd]/50 border-t border-[#c2c6d6]/40 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenProject(item.project)}
                      className="whitespace-nowrap flex-1 py-1.5 px-3 rounded-lg bg-[#0058be] text-white text-xs font-mono font-medium hover:bg-[#004395] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span className="whitespace-nowrap">조립 계속하기</span>
                    </button>

                    <button
                      onClick={() => onDuplicateProject(item)}
                      className="whitespace-nowrap p-1.5 rounded-lg border border-[#c2c6d6] text-[#505f76] hover:text-[#0058be] hover:bg-white transition-colors"
                      title="프로젝트 복제"
                      aria-label="Duplicate project"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {savedProjects.length > 1 && (
                      <button
                        onClick={() => onDeleteProject(item.id)}
                        className="whitespace-nowrap p-1.5 rounded-lg border border-[#c2c6d6] text-[#505f76] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors"
                        title="프로젝트 삭제"
                        aria-label="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recommended Mechanical Templates */}
        <section className="space-y-4 pt-2">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#191b23] tracking-tight font-['Inter']">
              추천 기계 설계 및 로보틱스 템플릿
            </h2>
            <p className="text-xs md:text-sm font-mono text-[#505f76]">
              검증된 정밀 메카니컬 공정 템플릿으로 빠르게 프로젝트를 시작하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRESET_PROJECTS.map((preset) => (
              <div
                key={preset.id}
                className="bg-white rounded-xl p-4 border border-[#c2c6d6]/60 hover:border-[#0058be] transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d0e1fb] text-[#0058be] font-bold">
                      {preset.badge}
                    </span>
                    <span className="whitespace-nowrap text-[10px] font-mono text-[#505f76]">
                      {preset.project.steps.length}단계 공정
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[#191b23] font-['Inter']">
                    {preset.name}
                  </h4>

                  <p className="text-xs text-[#505f76] line-clamp-3 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-[#c2c6d6]/30">
                  <button
                    onClick={() => onOpenProject(preset.project)}
                    className="whitespace-nowrap w-full py-1.5 px-3 rounded-lg border border-[#0058be] text-[#0058be] hover:bg-[#0058be] hover:text-white transition-all text-xs font-mono font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="whitespace-nowrap">템플릿으로 시작</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
