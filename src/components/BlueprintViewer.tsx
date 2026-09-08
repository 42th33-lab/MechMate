import React, { useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Link as LinkIcon,
  Info,
  CheckCircle2,
  Crosshair,
  ExternalLink,
} from "lucide-react";
import { AssemblyStep } from "../types";

interface BlueprintViewerProps {
  blueprintUrl: string;
  onUpdateBlueprintUrl: (url: string) => void;
  activeStep?: AssemblyStep;
  isCompactMode?: boolean;
}

export const BlueprintViewer: React.FC<BlueprintViewerProps> = ({
  blueprintUrl,
  onUpdateBlueprintUrl,
  activeStep,
  isCompactMode,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>(blueprintUrl);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.6));
  const handleResetZoom = () => setZoom(1);

  const handleSaveUrl = () => {
    if (tempUrl.trim()) {
      onUpdateBlueprintUrl(tempUrl.trim());
    }
    setIsEditingUrl(false);
  };

  const hotspots = [
    { id: 1, x: 26, y: 35, title: "MOTOR UNIT A-76", desc: "고토크 브러시리스 모터 결합부" },
    { id: 2, x: 62, y: 28, title: "FLANGE ALIGNMENT", desc: "샤시 플랜지 및 0.05mm 편차 정렬 기준점" },
    { id: 3, x: 44, y: 68, title: "TORQUE BOLT M3", desc: "2.8 N·m 조임 토크 체결 포인트" },
    { id: 4, x: 78, y: 72, title: "CHASSIS PLATE", desc: "CNC 가공 티타늄/알루미늄 장착 플레이트" },
  ];

  return (
    <div
      className={`bg-white rounded-lg p-3 md:p-4 shadow-[0px_2px_4px_rgba(31,41,55,0.06),0px_4px_12px_rgba(31,41,55,0.04)] border border-[#c2c6d6]/40 flex flex-col ${
        isFullscreen
          ? "fixed inset-4 z-50 shadow-2xl"
          : isCompactMode
          ? "h-full min-h-[280px]"
          : "h-[380px] lg:h-[430px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#c2c6d6]/30 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-[#0058be]" />
          <h3 className="font-mono text-xs font-bold text-[#505f76] uppercase tracking-wider">
            실시간 도면 미리보기
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditingUrl(!isEditingUrl)}
            className="p-1 rounded text-[#505f76] hover:text-[#0058be] hover:bg-[#e6e7f2] transition-colors"
            title="도면 이미지 핫링크 URL 변경"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1 rounded text-[#505f76] hover:text-[#0058be] hover:bg-[#e6e7f2] transition-colors"
            title="축소"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-[#505f76] px-1">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded text-[#505f76] hover:text-[#0058be] hover:bg-[#e6e7f2] transition-colors"
            title="확대"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 rounded text-[#505f76] hover:text-[#0058be] hover:bg-[#e6e7f2] transition-colors"
            title="초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded text-[#505f76] hover:text-[#0058be] hover:bg-[#e6e7f2] transition-colors"
            title={isFullscreen ? "축소 보기" : "전체화면"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* URL Edit Bar */}
      {isEditingUrl && (
        <div className="mb-2 p-2 bg-[#f2f3fd] rounded-md border border-[#adc6ff] flex items-center gap-2">
          <input
            type="text"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            placeholder="도면 이미지 URL (핫링크 가능)"
            className="flex-1 text-xs font-mono bg-white px-2 py-1 border border-[#c2c6d6] rounded focus:outline-none focus:ring-1 focus:ring-[#0058be]"
          />
          <button
            onClick={handleSaveUrl}
            className="whitespace-nowrap px-2.5 py-1 bg-[#0058be] text-white rounded text-xs font-mono font-medium hover:bg-[#004395] cursor-pointer"
          >
            <span className="whitespace-nowrap">적용</span>
          </button>
        </div>
      )}

      {/* Blueprint Canvas Container */}
      <div className="flex-1 bg-white rounded border border-[#c2c6d6]/30 relative overflow-hidden flex items-center justify-center select-none group">
        {/* Transform wrapper */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          <img
            src={blueprintUrl}
            alt="Mechanical Blueprint Diagram"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain opacity-85 mix-blend-multiply"
          />

          {/* Hotspot Markers */}
          {hotspots.map((spot) => (
            <button
              key={spot.id}
              onClick={() => setActiveHotspot(activeHotspot === spot.id ? null : spot.id)}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all duration-200 cursor-pointer shadow-md ${
                activeHotspot === spot.id
                  ? "bg-[#0058be] text-white ring-4 ring-[#adc6ff] scale-125 z-20"
                  : "bg-white/90 text-[#0058be] border border-[#0058be] hover:scale-110 hover:bg-[#0058be] hover:text-white"
              }`}
              title={`${spot.title}: ${spot.desc}`}
            >
              {spot.id}
            </button>
          ))}
        </div>

        {/* Subtle engineering gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f9f9ff]/30 via-transparent to-transparent pointer-events-none" />

        {/* Active Hotspot Info Overlay Card */}
        {activeHotspot !== null && (
          <div className="absolute bottom-2 left-2 right-2 p-2.5 bg-white/95 backdrop-blur-xs rounded-lg border border-[#0058be]/30 shadow-md text-xs z-30 flex items-start justify-between">
            <div>
              <div className="font-mono font-bold text-[#0058be] flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#0058be] text-white text-[10px] flex items-center justify-center">
                  {activeHotspot}
                </span>
                {hotspots.find((h) => h.id === activeHotspot)?.title}
              </div>
              <p className="text-[#424754] text-[11px] mt-0.5">
                {hotspots.find((h) => h.id === activeHotspot)?.desc}
              </p>
            </div>
            <button
              onClick={() => setActiveHotspot(null)}
              className="text-[#505f76] hover:text-[#191b23] text-xs font-mono px-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Footer info in blueprint */}
      <div className="mt-2 pt-1.5 border-t border-[#c2c6d6]/20 flex items-center justify-between text-[11px] font-mono text-[#505f76]">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-[#0058be]" />
          {activeStep ? activeStep.title : "전투 로봇 메카니컬 CAD 레이어"}
        </span>
        <a
          href={blueprintUrl}
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap hover:text-[#0058be] flex items-center gap-0.5 text-[#505f76] cursor-pointer"
          title="원본 도면 열기"
        >
          <span className="whitespace-nowrap">원문 도면</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};
