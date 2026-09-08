import React, { useState } from "react";
import { X, Settings, Link as LinkIcon, RotateCcw, Check } from "lucide-react";
import { DEFAULT_BLUEPRINT_URL } from "../data/initialData";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  version: string;
  blueprintUrl: string;
  onUpdateSettings: (settings: {
    title: string;
    version: string;
    blueprintUrl: string;
  }) => void;
  onResetBlueprint: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  title,
  version,
  blueprintUrl,
  onUpdateSettings,
  onResetBlueprint,
}) => {
  const [currTitle, setCurrTitle] = useState(title);
  const [currVersion, setCurrVersion] = useState(version);
  const [currUrl, setCurrUrl] = useState(blueprintUrl);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      title: currTitle.trim() || title,
      version: currVersion.trim() || version,
      blueprintUrl: currUrl.trim() || blueprintUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#c2c6d6] w-full max-w-md flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[#c2c6d6]/40 flex items-center justify-between bg-[#f2f3fd]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#0058be] text-white">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-[#191b23] font-['Inter']">
              MechMate 프로젝트 및 도면 설정
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#505f76] hover:bg-[#e6e7f2]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs font-mono bg-[#f9f9ff]">
          <div>
            <label className="block text-[#191b23] font-bold mb-1">프로젝트 명칭</label>
            <input
              type="text"
              value={currTitle}
              onChange={(e) => setCurrTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
            />
          </div>

          <div>
            <label className="block text-[#505f76] mb-1">공정 버전 (Version)</label>
            <input
              type="text"
              value={currVersion}
              onChange={(e) => setCurrVersion(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#505f76] flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-[#0058be]" />
                <span>도면 이미지 핫링크 URL</span>
              </label>
              <button
                type="button"
                onClick={() => setCurrUrl(DEFAULT_BLUEPRINT_URL)}
                className="whitespace-nowrap text-[10px] text-[#0058be] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span className="whitespace-nowrap">기본 도면 복원</span>
              </button>
            </div>
            <input
              type="text"
              value={currUrl}
              onChange={(e) => setCurrUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="whitespace-nowrap px-4 py-2 border border-[#c2c6d6] bg-white rounded hover:bg-[#e6e7f2] text-[#505f76] cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="whitespace-nowrap px-4 py-2 bg-[#0058be] text-white font-bold rounded hover:bg-[#004395] cursor-pointer shadow-2xs"
            >
              설정 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
