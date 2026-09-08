import React, { useState } from "react";
import { X, Plus, Package } from "lucide-react";
import { BomItem } from "../types";

interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPart: (part: BomItem) => void;
}

export const AddPartModal: React.FC<AddPartModalProps> = ({
  isOpen,
  onClose,
  onAddPart,
}) => {
  const [partName, setPartName] = useState("");
  const [partCode, setPartCode] = useState("");
  const [category, setCategory] = useState("프레임/구조");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("EA");
  const [specs, setSpecs] = useState("");
  const [status, setStatus] = useState<BomItem["status"]>("재고확보");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) return;

    onAddPart({
      id: `bom-${Date.now()}`,
      partName: partName.trim(),
      partCode: partCode.trim() || `PART-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      quantity: Number(quantity) || 1,
      unit,
      specs: specs.trim() || "표준 규격",
      status,
      unitPrice: 1000,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#c2c6d6] w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#c2c6d6]/40 flex items-center justify-between bg-[#f2f3fd]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#0058be] text-white">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-[#191b23] font-['Inter']">
              신규 BOM 부품 추가
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
            <label className="block text-[#191b23] font-bold mb-1">부품명 *</label>
            <input
              type="text"
              required
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="예: 24V 고토크 서보 모터"
              className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#505f76] mb-1">부품 코드</label>
              <input
                type="text"
                value={partCode}
                onChange={(e) => setPartCode(e.target.value)}
                placeholder="예: MOT-24V-01"
                className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
              />
            </div>
            <div>
              <label className="block text-[#505f76] mb-1">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
              >
                <option value="프레임/구조">프레임/구조</option>
                <option value="구동모터">구동모터</option>
                <option value="동력전달">동력전달</option>
                <option value="체결부품">체결부품</option>
                <option value="전장/제어">전장/제어</option>
                <option value="센서">센서</option>
                <option value="외장/보호">외장/보호</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#505f76] mb-1">수량</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
              />
            </div>
            <div>
              <label className="block text-[#505f76] mb-1">단위</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="EA / SET"
                className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
              />
            </div>
            <div>
              <label className="block text-[#505f76] mb-1">재고 상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BomItem["status"])}
                className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
              >
                <option value="재고확보">재고확보</option>
                <option value="준비필요">준비필요</option>
                <option value="규격검토">규격검토</option>
                <option value="발주중">발주중</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#505f76] mb-1">규격 및 엔지니어링 사양</label>
            <input
              type="text"
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              placeholder="예: 24V 350W, 12Nm 토크, 축 직경 8mm"
              className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
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
              부품 등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
