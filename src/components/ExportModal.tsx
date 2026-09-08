import React from "react";
import { X, FileDown, CheckCircle2, Copy, FileText, Code } from "lucide-react";
import { AssemblyProject } from "../types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: AssemblyProject;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(project, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, "_")}_조립가이드_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
  };

  const handleDownloadMarkdown = () => {
    let md = `# ${project.title}\n**${project.subtitle}** (${project.version})\n\n`;
    md += `> ${project.description}\n\n`;
    if (project.warning && !project.warning.dismissed) {
      md += `### ⚠️ ${project.warning.title}\n${project.warning.message}\n\n`;
    }
    md += `## 📋 조립 공정 순서\n\n`;
    project.steps.forEach((s) => {
      md += `### ${s.title} ${s.completed ? "✅ (완료)" : "⏳"}\n`;
      md += `${s.description}\n\n`;
      if (s.requiredParts?.length) {
        md += `**필요 부품:**\n`;
        s.requiredParts.forEach((p) => (md += `- ${p}\n`));
        md += `\n`;
      }
      if (s.torqueSpec) md += `*토크 규격:* \`${s.torqueSpec}\`\n\n`;
    });

    md += `## 📦 BOM 부품 목록\n\n`;
    md += `| 부품명 | 부품코드 | 카테고리 | 수량 | 규격/사양 | 상태 |\n`;
    md += `|---|---|---|---|---|---|\n`;
    project.bom.forEach((b) => {
      md += `| ${b.partName} | ${b.partCode} | ${b.category || "-"} | ${b.quantity} ${b.unit} | ${b.specs} | ${b.status} |\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, "_")}_조립가이드.md`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#c2c6d6] w-full max-w-lg flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[#c2c6d6]/40 flex items-center justify-between bg-[#f2f3fd]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#0058be] text-white">
              <FileDown className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-[#191b23] font-['Inter']">
              조립 프로젝트 지침서 내보내기
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#505f76] hover:bg-[#e6e7f2]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs font-mono bg-[#f9f9ff]">
          <div className="p-3 bg-white rounded-lg border border-[#c2c6d6]/50 space-y-1">
            <div className="font-bold text-[#191b23]">{project.title}</div>
            <div className="text-[#505f76]">{project.description}</div>
            <div className="text-[11px] text-[#0058be] pt-1">
              단계 수: {project.steps.length}개 / BOM 부품: {project.bom.length}개
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleDownloadMarkdown}
              className="p-3 bg-white hover:bg-[#f2f3fd] border border-[#c2c6d6]/60 rounded-lg text-left transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <FileText className="w-5 h-5 text-[#0058be]" />
              <div>
                <div className="font-bold text-[#191b23]">Markdown (.md)</div>
                <div className="text-[10px] text-[#505f76]">엔지니어링 문서 양식</div>
              </div>
            </button>

            <button
              onClick={handleDownloadJson}
              className="p-3 bg-white hover:bg-[#f2f3fd] border border-[#c2c6d6]/60 rounded-lg text-left transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <Code className="w-5 h-5 text-[#0058be]" />
              <div>
                <div className="font-bold text-[#191b23]">JSON 데이터 (.json)</div>
                <div className="text-[10px] text-[#505f76]">시스템 연동 규격</div>
              </div>
            </button>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={handleCopyJson}
              className="whitespace-nowrap px-3 py-1.5 border border-[#c2c6d6] bg-white rounded hover:bg-[#e6e7f2] flex items-center gap-1 text-[#505f76] cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="whitespace-nowrap">{copied ? "클립보드 복사됨!" : "JSON 복사"}</span>
            </button>

            <button
              onClick={onClose}
              className="whitespace-nowrap px-4 py-1.5 bg-[#0058be] text-white font-bold rounded hover:bg-[#004395] cursor-pointer shadow-2xs"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
