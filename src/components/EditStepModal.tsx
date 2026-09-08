import React, { useState } from "react";
import { X, Edit2, Plus, Trash2 } from "lucide-react";
import { AssemblyStep } from "../types";

interface EditStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: AssemblyStep | null;
  onSaveStep: (updatedStep: AssemblyStep) => void;
}

export const EditStepModal: React.FC<EditStepModalProps> = ({
  isOpen,
  onClose,
  step,
  onSaveStep,
}) => {
  if (!isOpen || !step) return null;

  const [title, setTitle] = useState(step.title);
  const [description, setDescription] = useState(step.description);
  const [torqueSpec, setTorqueSpec] = useState(step.torqueSpec || "");
  const [notes, setNotes] = useState(step.notes || "");
  const [parts, setParts] = useState<string[]>(step.requiredParts || []);
  const [newPartInput, setNewPartInput] = useState("");

  const handleAddPart = () => {
    if (!newPartInput.trim()) return;
    setParts([...parts, newPartInput.trim()]);
    setNewPartInput("");
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveStep({
      ...step,
      title: title.trim(),
      description: description.trim(),
      torqueSpec: torqueSpec.trim() || undefined,
      notes: notes.trim() || undefined,
      requiredParts: parts,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#c2c6d6] w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#c2c6d6]/40 flex items-center justify-between bg-[#f2f3fd]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#0058be] text-white">
              <Edit2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-[#191b23] font-['Inter']">
              조립 공정 단계 수정
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#505f76] hover:bg-[#e6e7f2]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs font-mono">
          <div>
            <label className="block text-[#191b23] font-bold mb-1">단계 제목 *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2단계: 모터 장착"
              className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
            />
          </div>

          <div>
            <label className="block text-[#505f76] mb-1">작업 지침 및 세부 설명</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상세한 조립 절차 및 주의사항을 입력하세요."
              className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#505f76] mb-1">토크 규격 (Torque)</label>
              <input
                type="text"
                value={torqueSpec}
                onChange={(e) => setTorqueSpec(e.target.value)}
                placeholder="예: 4.2 N·m"
                className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
              />
            </div>
            <div>
              <label className="block text-[#505f76] mb-1">특이사항/주의점</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="예: 축 중심선 0.05mm 정렬"
                className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
              />
            </div>
          </div>

          {/* Required Parts Editor */}
          <div>
            <label className="block text-[#505f76] mb-1">필요 부품 목록</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPartInput}
                onChange={(e) => setNewPartInput(e.target.value)}
                placeholder="예: 2x 브러시리스 DC 모터 (HT-9000)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPart();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-[#f9f9ff] border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
              />
              <button
                type="button"
                onClick={handleAddPart}
                className="whitespace-nowrap px-3 py-1.5 bg-[#d0e1fb] text-[#0058be] font-bold rounded hover:bg-[#adc6ff] cursor-pointer"
              >
                + 추가
              </button>
            </div>

            <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-[#f2f3fd]/60 rounded border border-[#c2c6d6]/30">
              {parts.length === 0 ? (
                <div className="text-[#505f76] text-center py-2 whitespace-nowrap">등록된 필요 부품이 없습니다.</div>
              ) : (
                parts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-white px-2.5 py-1 rounded border border-[#c2c6d6]/30">
                    <span className="text-[#191b23]">{p}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(i)}
                      className="text-[#ba1a1a] hover:bg-[#ffdad6]/60 p-0.5 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="whitespace-nowrap px-4 py-2 border border-[#c2c6d6] rounded hover:bg-[#e6e7f2] text-[#505f76] cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="whitespace-nowrap px-4 py-2 bg-[#0058be] text-white font-bold rounded hover:bg-[#004395] cursor-pointer shadow-2xs"
            >
              수정 사항 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
