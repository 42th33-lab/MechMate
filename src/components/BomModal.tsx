import React, { useState } from "react";
import {
  X,
  Package,
  Search,
  Plus,
  FileDown,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { BomItem } from "../types";

interface BomModalProps {
  isOpen: boolean;
  onClose: () => void;
  bom: BomItem[];
  onAddPart: () => void;
  onDeleteBomItem: (id: string) => void;
}

export const BomModal: React.FC<BomModalProps> = ({
  isOpen,
  onClose,
  bom,
  onAddPart,
  onDeleteBomItem,
}) => {
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  if (!isOpen) return null;

  const categories = ["ALL", ...Array.from(new Set(bom.map((b) => b.category || "일반")))];

  const filteredBom = bom.filter((item) => {
    const matchesSearch =
      item.partName.toLowerCase().includes(search.toLowerCase()) ||
      item.partCode.toLowerCase().includes(search.toLowerCase()) ||
      item.specs.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const exportToCsv = () => {
    const headers = ["부품명,부품코드,카테고리,수량,단위,규격/사양,상태,단가\n"];
    const rows = bom.map(
      (b) =>
        `"${b.partName}","${b.partCode}","${b.category || "기타"}",${b.quantity},"${b.unit}","${b.specs}","${b.status}",${b.unitPrice || 0}\n`
    );
    const blob = new Blob(["\uFEFF" + headers.concat(rows).join("")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BOM_부품목록_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const getStatusBadge = (status: BomItem["status"]) => {
    switch (status) {
      case "재고확보":
      case "검수완료":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "준비필요":
      case "발주중":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "규격검토":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#c2c6d6] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#c2c6d6]/40 flex items-center justify-between bg-[#f2f3fd]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0058be] text-white">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#191b23] font-['Inter']">
                BOM (Bill of Materials) 부품 총괄 관리
              </h3>
              <p className="text-xs font-mono text-[#505f76]">
                총 {bom.length}개 품목 등록됨 (필요 수량 및 재고 사양 검증)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCsv}
              className="whitespace-nowrap px-3 py-1.5 rounded-lg border border-[#c2c6d6] bg-white text-xs font-mono text-[#505f76] hover:bg-[#e6e7f2] flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">CSV 내보내기</span>
            </button>
            <button
              onClick={onAddPart}
              className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-[#0058be] text-white text-xs font-mono font-medium hover:bg-[#004395] flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">새 부품 등록</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#505f76] hover:bg-[#e6e7f2] hover:text-[#191b23] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-3.5 bg-[#f9f9ff] border-b border-[#c2c6d6]/30 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-[#505f76] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="부품명, 부품코드, 규격 검색..."
              className="w-full text-xs font-mono pl-8 pr-3 py-1.5 bg-white border border-[#c2c6d6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0058be]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-[#0058be] text-white font-bold"
                    : "bg-white text-[#505f76] border border-[#c2c6d6]/40 hover:bg-[#e6e7f2]"
                }`}
              >
                {cat === "ALL" ? "전체 카테고리" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#f9f9ff]">
          <div className="overflow-x-auto rounded-lg border border-[#c2c6d6]/40 bg-white">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#f2f3fd] text-[#505f76] uppercase tracking-wider border-b border-[#c2c6d6]/40">
                <tr>
                  <th className="py-2.5 px-3">부품명</th>
                  <th className="py-2.5 px-3">부품 코드</th>
                  <th className="py-2.5 px-3">카테고리</th>
                  <th className="py-2.5 px-3 text-right">수량</th>
                  <th className="py-2.5 px-3">규격 및 사양</th>
                  <th className="py-2.5 px-3">상태</th>
                  <th className="py-2.5 px-3 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c2c6d6]/20">
                {filteredBom.length > 0 ? (
                  filteredBom.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f2f3fd]/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#191b23] font-['Inter']">
                        {item.partName}
                      </td>
                      <td className="py-2.5 px-3 text-[#0058be] font-bold">
                        {item.partCode}
                      </td>
                      <td className="py-2.5 px-3 text-[#505f76]">
                        {item.category || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#191b23]">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-[#424754]">
                        {item.specs}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onDeleteBomItem(item.id)}
                          className="p-1 rounded text-[#505f76] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#505f76]">
                      일치하는 BOM 부품이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#c2c6d6]/40 bg-[#f2f3fd] flex justify-between items-center text-xs font-mono text-[#505f76]">
          <span className="whitespace-nowrap">총 부품 개수 합계: {bom.reduce((acc, curr) => acc + (curr.quantity || 1), 0)} EA</span>
          <button
            onClick={onClose}
            className="whitespace-nowrap px-4 py-1.5 bg-[#0058be] text-white rounded-lg hover:bg-[#004395] transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
