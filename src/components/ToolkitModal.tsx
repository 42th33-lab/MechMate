import React, { useState } from "react";
import { X, Wrench, Plus, Check, Trash2, CheckCircle2, CheckSquare, Square } from "lucide-react";
import { ToolItem } from "../types";

interface ToolkitModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolkit: ToolItem[];
  onToggleTool: (toolId: string) => void;
  onAddTool: (tool: ToolItem) => void;
  onDeleteTool: (toolId: string) => void;
  onBulkSetChecked?: (checked: boolean) => void;
}

export const ToolkitModal: React.FC<ToolkitModalProps> = ({
  isOpen,
  onClose,
  toolkit,
  onToggleTool,
  onAddTool,
  onDeleteTool,
  onBulkSetChecked,
}) => {
  const [newToolName, setNewToolName] = useState("");
  const [newToolSpec, setNewToolSpec] = useState("");

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName.trim()) return;
    onAddTool({
      id: `tool-${Date.now()}`,
      toolName: newToolName.trim(),
      spec: newToolSpec.trim() || "표준 규격",
      checked: false,
    });
    setNewToolName("");
    setNewToolSpec("");
  };

  const checkedCount = toolkit.filter((t) => t.checked).length;
  const isAllChecked = toolkit.length > 0 && checkedCount === toolkit.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#c2c6d6] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#c2c6d6]/40 flex items-center justify-between bg-[#f2f3fd]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0058be] text-white">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#191b23] font-['Inter'] whitespace-nowrap">
                필수 조립 공구 및 계측 툴킷
              </h3>
              <p className="text-xs font-mono text-[#505f76] whitespace-nowrap">
                준비 현황: {checkedCount}/{toolkit.length} 개 확보 완료
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#505f76] hover:bg-[#e6e7f2] hover:text-[#191b23] transition-colors"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar (Quick Bulk Select) */}
        <div className="px-5 py-2.5 bg-white border-b border-[#c2c6d6]/30 flex items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                toolkit.forEach((t) => {
                  if (!t.checked) onToggleTool(t.id);
                });
              }}
              className="whitespace-nowrap px-2.5 py-1 rounded-md bg-[#f2f3fd] hover:bg-[#d0e1fb] text-[#0058be] font-semibold transition-colors cursor-pointer border border-[#adc6ff]/40"
            >
              전체 확보 (모두 체크)
            </button>
            <button
              onClick={() => {
                toolkit.forEach((t) => {
                  if (t.checked) onToggleTool(t.id);
                });
              }}
              className="whitespace-nowrap px-2.5 py-1 rounded-md bg-[#ecedf7] hover:bg-[#e1e2ec] text-[#505f76] font-medium transition-colors cursor-pointer"
            >
              전체 해제
            </button>
          </div>
          <span className="text-[11px] text-[#505f76] hidden sm:inline whitespace-nowrap">
            클릭하여 확보 상태를 즉시 토글합니다
          </span>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 bg-[#f9f9ff]">
          {/* Add form */}
          <form onSubmit={handleAdd} className="flex gap-2 p-2.5 bg-white rounded-lg border border-[#c2c6d6]/50 shadow-2xs">
            <input
              type="text"
              placeholder="공구명 (예: 와이어 커터)"
              value={newToolName}
              onChange={(e) => setNewToolName(e.target.value)}
              className="flex-1 text-xs font-mono px-2.5 py-1.5 border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
            />
            <input
              type="text"
              placeholder="규격/사양 (선택)"
              value={newToolSpec}
              onChange={(e) => setNewToolSpec(e.target.value)}
              className="w-1/3 text-xs font-mono px-2.5 py-1.5 border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
            />
            <button
              type="submit"
              className="whitespace-nowrap px-3.5 py-1.5 bg-[#0058be] text-white rounded text-xs font-mono font-medium hover:bg-[#004395] active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              공구 추가
            </button>
          </form>

          {/* List */}
          <div className="space-y-2">
            {toolkit.map((item) => {
              const isChecked = item.checked;
              return (
                <div
                  key={item.id}
                  onClick={() => onToggleTool(item.id)}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-all select-none ${
                    isChecked
                      ? "bg-white border-[#0058be]/30 shadow-2xs ring-1 ring-[#0058be]/10"
                      : "bg-[#f2f3fd]/50 border-[#c2c6d6]/50 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Custom Styled Checkbox Button */}
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0 ${
                        isChecked
                          ? "bg-[#0058be] text-white"
                          : "border-2 border-[#505f76]/40 bg-white hover:border-[#0058be]"
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold font-mono transition-colors truncate ${
                          isChecked ? "text-[#191b23] line-through opacity-70" : "text-[#191b23]"
                        }`}
                      >
                        {item.toolName}
                      </div>
                      <div className="text-[11px] font-mono text-[#505f76] truncate">
                        {item.spec}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        isChecked
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-[#ecedf7] text-[#505f76]"
                      }`}
                    >
                      {isChecked ? "준비완료" : "미확보"}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTool(item.id);
                      }}
                      className="whitespace-nowrap p-1.5 text-[#505f76] hover:text-[#ba1a1a] rounded hover:bg-[#ffdad6]/40 transition-colors"
                      title="공구 삭제"
                      aria-label="Delete tool"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#c2c6d6]/40 bg-[#f2f3fd] flex justify-between items-center text-xs font-mono">
          <span className="text-[#505f76] whitespace-nowrap">
            {checkedCount === toolkit.length
              ? "모든 조립 공구가 준비되었습니다"
              : `${toolkit.length - checkedCount}개의 공구 확인이 필요합니다`}
          </span>
          <button
            onClick={onClose}
            className="whitespace-nowrap px-4 py-1.5 bg-[#0058be] text-white rounded-lg font-medium hover:bg-[#004395] transition-colors cursor-pointer shadow-2xs"
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
};
