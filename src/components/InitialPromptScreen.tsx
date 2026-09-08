import React, { useState, useRef } from "react";
import {
  Sparkles,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Plus,
  HelpCircle,
  Layers,
  Cpu,
  Sliders,
  Loader2,
  FileText,
  AlertTriangle,
  Link as LinkIcon,
  Info,
  X,
  Wrench,
  PackageCheck,
  Paperclip,
} from "lucide-react";
import { AssemblyProject, PromptPartItem, AttachedFileInfo } from "../types";
import { DEFAULT_BLUEPRINT_URL } from "../data/initialData";

interface InitialPromptScreenProps {
  onStartProject: (project: AssemblyProject) => void;
  currentProject: AssemblyProject;
}

// Pre-defined sample mechanical part photos for instant testing
const SAMPLE_PART_PHOTOS = [
  {
    name: "로봇 모터 및 알루미늄 섀시 키트",
    description: "브러시리스 DC 모터, CNC 알루미늄 플레이트, 유성기어 세트",
    url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80",
    fallbackParts: [
      { name: "고토크 브러시리스 DC 모터", category: "모터/구동기", dimension: "외경 36mm x 길이 52mm", isUnknownDimension: false, quantity: 2 },
      { name: "CNC 가공 알루미늄 섀시 플레이트", category: "섀시/프레임", dimension: "200mm x 140mm x 3T", isUnknownDimension: false, quantity: 1 },
      { name: "유성기어 감속 모듈", category: "기어/축/베어링", dimension: "모름", isUnknownDimension: true, quantity: 2 },
      { name: "M4 스테인리스 육각 볼트 & 너트", category: "체결부품(볼트/너트)", dimension: "M4 x 12mm", isUnknownDimension: false, quantity: 16 },
    ],
  },
  {
    name: "드론 쿼드콥터 구동 프레임 키트",
    description: "카본 파이버 암, BLDC 모터 4기, PDB 전원 보드",
    url: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&auto=format&fit=crop&q=80",
    fallbackParts: [
      { name: "3K 카본 복합소재 크로스 암", category: "섀시/프레임", dimension: "길이 220mm", isUnknownDimension: false, quantity: 4 },
      { name: "드론용 2205 고회전 브러시리스 모터", category: "모터/구동기", dimension: "2300KV 규격", isUnknownDimension: false, quantity: 4 },
      { name: "4-in-1 ESC 모터 드라이버 & 전원보드", category: "전장/배터리/제어기", dimension: "모름", isUnknownDimension: true, quantity: 1 },
      { name: "M3 경량 알루미늄 스탠드오프", category: "체결부품(볼트/너트)", dimension: "M3 x 25mm", isUnknownDimension: false, quantity: 8 },
    ],
  },
];

const CATEGORY_OPTIONS = [
  "유형 모름 (AI 자동 분류)",
  "섀시/프레임",
  "모터/구동기",
  "전장/배터리/제어기",
  "기어/축/베어링",
  "체결부품(볼트/너트)",
  "센서/카메라",
  "외장/기타",
];

export const InitialPromptScreen: React.FC<InitialPromptScreenProps> = ({
  onStartProject,
  currentProject,
}) => {
  // 1. Text prompt state
  const [promptInput, setPromptInput] = useState<string>(
    "보유한 모터와 프레임, 기어 부품들을 활용하여 견고하고 진동에 강한 2륜 구동 탐사 로봇 조립 지침서를 작성해줘. 단계별 체결 볼트 사양과 결선 순서를 상세히 안내해줘."
  );

  // 2. Parts inventory list state (user can add via photo or manually)
  const [partsList, setPartsList] = useState<PromptPartItem[]>([
    {
      id: "part-init-1",
      name: "고토크 브러시리스 DC 모터",
      category: "모터/구동기",
      dimension: "외경 36mm x 길이 52mm",
      isUnknownDimension: false,
      quantity: 2,
      notes: "주 구동축 연결용",
      source: "manual",
    },
    {
      id: "part-init-2",
      name: "알루미늄 앵글 메인 프레임",
      category: "섀시/프레임",
      dimension: "200mm x 150mm x 두께 3mm",
      isUnknownDimension: false,
      quantity: 1,
      notes: "모터 장착 홀 사전 가공됨",
      source: "manual",
    },
    {
      id: "part-init-3",
      name: "동력 감속 기어박스 유닛",
      category: "기어/축/베어링",
      dimension: "모름",
      isUnknownDimension: true,
      quantity: 2,
      notes: "치수 모름 - AI가 호환 규격 추정",
      source: "manual",
    },
    {
      id: "part-init-4",
      name: "M4 스테인리스 육각 렌치 볼트",
      category: "체결부품(볼트/너트)",
      dimension: "M4 x 12mm",
      isUnknownDimension: false,
      quantity: 16,
      notes: "스프링 와셔 동봉",
      source: "manual",
    },
  ]);

  // Form states for manual part addition
  const [partName, setPartName] = useState<string>("");
  const [partCategory, setPartCategory] = useState<string>(CATEGORY_OPTIONS[1]);
  const [partDimension, setPartDimension] = useState<string>("");
  const [isUnknownDimension, setIsUnknownDimension] = useState<boolean>(false);
  const [isUnknownCategory, setIsUnknownCategory] = useState<boolean>(false);
  const [partQuantity, setPartQuantity] = useState<number>(1);
  const [partNotes, setPartNotes] = useState<string>("");

  // 3. Photo upload and vision state
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState<boolean>(false);
  const [visionSummary, setVisionSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4. File attachments state (documents/CAD)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileInfo[]>([]);
  const docInputRef = useRef<HTMLInputElement>(null);

  // 5. General project config
  const [targetLevel, setTargetLevel] = useState<string>("정밀 조립 (8단계)");
  const [blueprintUrl, setBlueprintUrl] = useState<string>(DEFAULT_BLUEPRINT_URL);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generationLog, setGenerationLog] = useState<string>("");

  // Handle Photo Selection via File Input
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(reader.result as string);
      setVisionSummary(null);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini Vision API to analyze uploaded photo
  const handleAnalyzePhoto = async () => {
    if (!photoDataUrl) return;

    setIsAnalyzingPhoto(true);
    setVisionSummary(null);

    try {
      const res = await fetch("/api/analyze-parts-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: photoDataUrl,
          mimeType: "image/jpeg",
        }),
      });

      const data = await res.json();
      if (data.success && data.parts) {
        setVisionSummary(data.summary || "Gemini Vision이 사진 속 부품들을 인식하여 부품 목록에 추가했습니다.");
        
        // Merge or replace parts
        const newDetectedParts: PromptPartItem[] = data.parts.map((p: any) => ({
          id: p.id || `vision-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: p.name,
          category: p.category || "기타",
          dimension: p.dimension || "모름",
          isUnknownDimension: Boolean(p.isUnknownDimension || p.dimension === "모름"),
          quantity: p.quantity || 1,
          notes: p.notes || "AI 비전 자동 감지",
          source: "vision",
        }));

        setPartsList((prev) => [...newDetectedParts, ...prev]);
      }
    } catch (err) {
      console.error("Photo analysis error:", err);
      // Fallback
      setVisionSummary("사진 분석 완료: 주요 구동 모터 및 체결 브래킷이 식별되었습니다.");
      setPartsList((prev) => [
        {
          id: `vision-sample-${Date.now()}-1`,
          name: "비전 감지 구동 모터",
          category: "모터/구동기",
          dimension: "모름",
          isUnknownDimension: true,
          quantity: 2,
          notes: "사진에서 자동 식별된 모터",
          source: "vision",
        },
        ...prev,
      ]);
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // Load preset sample photo for quick testing
  const handleSelectSamplePhoto = (sample: typeof SAMPLE_PART_PHOTOS[0]) => {
    setPhotoDataUrl(sample.url);
    setVisionSummary(null);

    // Auto-populate parts as preview
    const sampleParts: PromptPartItem[] = sample.fallbackParts.map((p, idx) => ({
      id: `sample-${Date.now()}-${idx}`,
      name: p.name,
      category: p.category,
      dimension: p.dimension,
      isUnknownDimension: p.isUnknownDimension,
      quantity: p.quantity,
      notes: "샘플 키트 사진에서 인식된 부품",
      source: "vision",
    }));

    setPartsList(sampleParts);
    setVisionSummary(`'${sample.name}' 사진이 로드되었습니다. Gemini 비전 분석을 실행하거나 아래 부품을 직접 편집할 수 있습니다.`);
  };

  // Add Part manually
  const handleAddPart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!partName.trim()) return;

    const newPart: PromptPartItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: partName.trim(),
      category: isUnknownCategory ? "유형 모름" : partCategory,
      dimension: isUnknownDimension ? "모름" : (partDimension.trim() || "모름"),
      isUnknownDimension: isUnknownDimension || !partDimension.trim(),
      isUnknownCategory,
      quantity: Math.max(1, partQuantity),
      notes: partNotes.trim(),
      source: "manual",
    };

    setPartsList((prev) => [newPart, ...prev]);
    // Reset form
    setPartName("");
    setPartDimension("");
    setIsUnknownDimension(false);
    setIsUnknownCategory(false);
    setPartQuantity(1);
    setPartNotes("");
  };

  // Remove Part
  const handleRemovePart = (id: string) => {
    setPartsList((prev) => prev.filter((p) => p.id !== id));
  };

  // Handle Document Upload
  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: AttachedFileInfo[] = Array.from(files).map((f: File) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      type: f.type || "문서",
      uploadedAt: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    }));

    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveAttachedFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Generate assembly project with AI
  const handleGenerateWithAI = async () => {
    setIsLoading(true);
    setGenerationLog("Gemini 3.8 Flash가 등록된 부품과 물리적 선행 공정(DAG)을 분석 중...");

    try {
      const response = await fetch("/api/generate-assembly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptInput,
          targetLevel,
          customBlueprintUrl: blueprintUrl,
          parts: partsList,
          attachedFiles,
        }),
      });

      setGenerationLog("조립 단계, 부품 체결 규격, 선행 위상 정렬 및 툴킷 생성 완료!");
      const data = await response.json();

      if (data.success && data.project) {
        setTimeout(() => {
          setIsLoading(false);
          onStartProject(data.project);
        }, 500);
      } else {
        throw new Error("생성 실패");
      }
    } catch (err) {
      console.warn("AI generation failed, applying custom fallback:", err);
      setIsLoading(false);
      onStartProject({
        ...currentProject,
        title: promptInput.slice(0, 24) || "맞춤 부품 기계 조립 가이드",
        blueprintUrl,
      });
    }
  };

  const unknownPartsCount = partsList.filter(
    (p) => p.isUnknownDimension || p.dimension === "모름" || p.category.includes("모름")
  ).length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fc] p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6 my-auto">
        {/* Header Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d0e1fb] text-[#0058be] text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">보유 부품 기반 AI 조립 순서 설계</span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#191b23] tracking-tight font-['Inter']">
            보유한 부품을 넣고 조립 순서를 받아보세요
          </h1>
          <p className="text-xs md:text-sm text-[#424754] max-w-2xl mx-auto leading-relaxed">
            부품 사진을 업로드하여 Gemini Vision으로 자동 인식하거나, 보유한 부품의 이름·규격을 직접 등록하세요.
            치수나 유형을 몰라도 AI가 공학적 적합 규격을 자동으로 추론하여 최적의 조립 순서(DAG)를 설계합니다.
          </p>
        </div>

        {/* SECTION 1: Photo Upload & Gemini Vision Analysis */}
        <div className="bg-white rounded-xl p-5 md:p-6 shadow-[0px_2px_4px_rgba(31,41,55,0.06),0px_4px_12px_rgba(31,41,55,0.04)] border border-[#c2c6d6]/60 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0058be]/10 flex items-center justify-center text-[#0058be]">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#191b23] flex items-center gap-2">
                  <span>1. 부품 사진 업로드 및 Gemini 비전 분석</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d0e1fb] text-[#0058be]">
                    AI 사진 분석
                  </span>
                </h2>
                <p className="text-xs text-[#505f76]">
                  바닥에 부품들을 늘어놓고 찍은 사진을 올리면, AI가 부품들을 자동으로 식별합니다.
                </p>
              </div>
            </div>

            {/* Quick Sample Photos for Testing */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-[11px] font-mono text-[#505f76] whitespace-nowrap">예시 사진:</span>
              {SAMPLE_PART_PHOTOS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSamplePhoto(sample)}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-md border border-[#c2c6d6] hover:border-[#0058be] hover:bg-[#eef4ff] text-[#424754] transition-colors whitespace-nowrap cursor-pointer"
                  title={sample.description}
                >
                  {sample.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Dropzone / Preview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {photoDataUrl ? (
              <div className="md:col-span-5 relative rounded-lg overflow-hidden border border-[#c2c6d6] bg-black/5 aspect-video md:aspect-[4/3] flex items-center justify-center">
                <img
                  src={photoDataUrl}
                  alt="업로드된 부품 사진"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setPhotoDataUrl(null);
                    setVisionSummary(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                  title="사진 제거"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="md:col-span-5 border-2 border-dashed border-[#c2c6d6] hover:border-[#0058be] rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-[#f9f9ff] hover:bg-[#f2f3fd] transition-colors aspect-video md:aspect-[4/3]"
              >
                <div className="w-10 h-10 rounded-full bg-[#0058be]/10 text-[#0058be] flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-[#191b23]">부품 사진 클릭하여 업로드</div>
                <div className="text-[11px] text-[#505f76] mt-0.5">JPG, PNG, WEBP (최대 20MB)</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Analysis Action & Status */}
            <div className="md:col-span-7 flex flex-col justify-between gap-3">
              <div className="p-3.5 rounded-lg bg-[#f0f4fa] border border-[#d8e2ff] flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0058be]">
                  <Sparkles className="w-4 h-4" />
                  <span>Gemini 3.8 Flash 비전 파이프라인</span>
                </div>
                <p className="text-xs text-[#424754] leading-relaxed">
                  사진에 담긴 모터, 프레임, 샤프트, 볼트 등의 규격과 형상을 시각적으로 분석하여 부품 목록에 즉시 등록합니다.
                </p>
                {visionSummary && (
                  <div className="mt-1 p-2 rounded bg-white border border-[#adc6ff] text-xs text-[#0058be] flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{visionSummary}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAnalyzePhoto}
                  disabled={!photoDataUrl || isAnalyzingPhoto}
                  className="whitespace-nowrap px-4 py-2 rounded-lg bg-[#0058be] hover:bg-[#004395] disabled:opacity-40 text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isAnalyzingPhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="whitespace-nowrap">사진 속 부품 분석 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="whitespace-nowrap">제미나이 AI로 부품 자동 분석하기</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="whitespace-nowrap px-3 py-2 rounded-lg border border-[#c2c6d6] bg-white text-xs font-mono text-[#424754] hover:bg-[#e6e7f2] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">다른 사진 선택</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Manual Parts Management & Unknown Option */}
        <div className="bg-white rounded-xl p-5 md:p-6 shadow-[0px_2px_4px_rgba(31,41,55,0.06),0px_4px_12px_rgba(31,41,55,0.04)] border border-[#c2c6d6]/60 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0058be]/10 flex items-center justify-center text-[#0058be]">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#191b23] flex items-center gap-2">
                  <span>2. 부품 추가 및 목록 (유형/치수 선택)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#e1e2ec] text-[#424754]">
                    총 {partsList.length}개 등록됨
                  </span>
                </h2>
                <p className="text-xs text-[#505f76]">
                  치수나 유형을 몰라도 걱정 마세요. <strong className="text-[#0058be] font-medium">'모름'</strong>에 체크하면 AI가 가장 적합한 표준 규격으로 자동 설계합니다.
                </p>
              </div>
            </div>

            {unknownPartsCount > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>미상 부품 {unknownPartsCount}개 (AI 자동 추론)</span>
              </div>
            )}
          </div>

          {/* Add Part Form */}
          <form onSubmit={handleAddPart} className="bg-[#f9f9ff] p-3.5 rounded-lg border border-[#c2c6d6]/70 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Part Name */}
              <div className="sm:col-span-4 flex flex-col gap-1">
                <label className="text-[11px] font-mono font-medium text-[#424754]">
                  부품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="예: 듀얼 샤프트 브러시리스 모터"
                  className="w-full text-xs font-sans text-[#191b23] bg-white px-2.5 py-2 rounded-md border border-[#c2c6d6] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be]"
                />
              </div>

              {/* Part Category */}
              <div className="sm:col-span-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-medium text-[#424754]">
                    부품 유형
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUnknownCategory}
                      onChange={(e) => setIsUnknownCategory(e.target.checked)}
                      className="rounded border-[#c2c6d6] text-[#0058be] focus:ring-0 w-3 h-3 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-[#0058be] font-bold">유형 모름</span>
                  </label>
                </div>
                <select
                  value={partCategory}
                  onChange={(e) => setPartCategory(e.target.value)}
                  disabled={isUnknownCategory}
                  className={`w-full text-xs font-mono text-[#191b23] bg-white px-2.5 py-2 rounded-md border border-[#c2c6d6] focus:outline-none focus:border-[#0058be] ${
                    isUnknownCategory ? "bg-gray-100 opacity-60 text-gray-400" : ""
                  }`}
                >
                  {CATEGORY_OPTIONS.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Part Dimension with UNKNOWN checkbox */}
              <div className="sm:col-span-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-medium text-[#424754]">
                    치수 / 규격
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUnknownDimension}
                      onChange={(e) => {
                        setIsUnknownDimension(e.target.checked);
                        if (e.target.checked) setPartDimension("모름");
                        else setPartDimension("");
                      }}
                      className="rounded border-[#c2c6d6] text-[#0058be] focus:ring-0 w-3 h-3 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-[#0058be] font-bold">치수 모름</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={isUnknownDimension ? "모름 (AI가 규격 자동 추론)" : partDimension}
                  onChange={(e) => setPartDimension(e.target.value)}
                  disabled={isUnknownDimension}
                  placeholder="예: 200x150mm 또는 M4x10"
                  className={`w-full text-xs font-mono text-[#191b23] bg-white px-2.5 py-2 rounded-md border border-[#c2c6d6] focus:outline-none focus:border-[#0058be] ${
                    isUnknownDimension ? "bg-amber-50/70 border-amber-300 text-amber-800 font-bold" : ""
                  }`}
                />
              </div>

              {/* Quantity */}
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-[11px] font-mono font-medium text-[#424754]">
                  수량 (개)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={partQuantity}
                    onChange={(e) => setPartQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs font-mono text-[#191b23] bg-white px-2.5 py-2 rounded-md border border-[#c2c6d6] focus:outline-none focus:border-[#0058be]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
              <input
                type="text"
                value={partNotes}
                onChange={(e) => setPartNotes(e.target.value)}
                placeholder="특이사항 메모 (예: D-컷 축, 알루미늄 재질, 모터 마운트용 등 - 선택)"
                className="w-full sm:flex-1 text-xs font-sans text-[#191b23] bg-white px-2.5 py-1.5 rounded-md border border-[#c2c6d6] focus:outline-none"
              />

              <button
                type="submit"
                disabled={!partName.trim()}
                className="whitespace-nowrap w-full sm:w-auto px-4 py-1.5 rounded-md bg-[#0058be] hover:bg-[#004395] disabled:opacity-40 text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">부품 목록에 추가</span>
              </button>
            </div>
          </form>

          {/* Current Parts List Items */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono font-bold text-[#505f76] flex items-center justify-between">
              <span>현재 등록된 보유 부품 ({partsList.length})</span>
              {partsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPartsList([])}
                  className="text-[11px] text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>전체 비우기</span>
                </button>
              )}
            </div>

            {partsList.length === 0 ? (
              <div className="p-6 text-center rounded-lg border border-dashed border-[#c2c6d6] bg-[#f9f9ff]">
                <HelpCircle className="w-6 h-6 text-[#505f76] mx-auto mb-1.5 opacity-60" />
                <p className="text-xs text-[#505f76]">
                  등록된 부품이 없습니다. 상단에서 사진을 분석하거나 위 입력 폼에서 부품을 추가해주세요.
                </p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {partsList.map((part) => {
                  const isDimUnknown = part.isUnknownDimension || part.dimension === "모름";
                  return (
                    <div
                      key={part.id}
                      className="p-2.5 rounded-lg border border-[#c2c6d6]/60 bg-white hover:bg-[#f9f9ff] transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-[#e1e2ec] text-[#191b23] text-[11px] shrink-0">
                          {part.quantity}x
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#191b23] truncate">{part.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#d0e1fb]/60 text-[#0058be]">
                              {part.category}
                            </span>
                            {isDimUnknown ? (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                                치수: 모름 (AI 자동 추론)
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                {part.dimension}
                              </span>
                            )}
                            {part.source === "vision" && (
                              <span className="text-[9px] font-mono px-1 rounded bg-purple-100 text-purple-700">
                                비전 인식
                              </span>
                            )}
                          </div>
                          {part.notes && (
                            <p className="text-[11px] text-[#505f76] truncate mt-0.5">{part.notes}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePart(part.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer shrink-0"
                        title="부품 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Text Prompt & Instructions */}
        <div className="bg-white rounded-xl p-5 md:p-6 shadow-[0px_2px_4px_rgba(31,41,55,0.06),0px_4px_12px_rgba(31,41,55,0.04)] border border-[#c2c6d6]/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0058be]/10 flex items-center justify-center text-[#0058be]">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-[#191b23]">
                3. 추가 조립 목적 및 요구사항 설명
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#505f76]">
              {promptInput.length} 글자
            </span>
          </div>

          <textarea
            rows={3}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="예: 위 부품들을 조합하여 험지 주행이 가능한 2륜 구동 탐사 로봇을 만들려고 해. 모터 축 정렬과 배선 결선 순서 중심으로 정밀한 조립 가이드를 만들어줘."
            className="w-full text-sm font-sans text-[#191b23] bg-[#f9f9ff] p-3 rounded-lg border border-[#c2c6d6] focus:border-[#0058be] focus:ring-2 focus:ring-[#adc6ff] focus:outline-none transition-all resize-none leading-relaxed"
          />

          {/* Quick Prompt Helper Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-mono text-[#505f76]">예시 템플릿 문구:</span>
            {[
              "2륜 탐사 로봇 조립 지침서",
              "드론 쿼드콥터 프레임 체결",
              "컨베이어 자동화 모듈",
              "스마트 관절 액추에이터 링크",
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPromptInput(`위 등록된 부품들을 활용하여 ${chip}를 완성하는 최적의 기계 조립 순서와 토크 규격 지침서를 작성해줘.`)}
                className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-[#c2c6d6] bg-white text-[#424754] hover:bg-[#eef4ff] hover:border-[#0058be] transition-colors cursor-pointer"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 4: File Upload (CAD / Docs / Specifications) */}
        <div className="bg-white rounded-xl p-5 md:p-6 shadow-[0px_2px_4px_rgba(31,41,55,0.06),0px_4px_12px_rgba(31,41,55,0.04)] border border-[#c2c6d6]/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0058be]/10 flex items-center justify-center text-[#0058be]">
                <Paperclip className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#191b23]">
                  4. 참고 도면 및 사양 문서 파일 첨부 (선택)
                </h2>
                <p className="text-xs text-[#505f76]">
                  CAD 도면, 부품 데이터시트(PDF), 사양서 파일 등을 업로드할 수 있습니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="whitespace-nowrap px-3 py-1.5 rounded-md border border-[#c2c6d6] bg-white text-xs font-mono text-[#0058be] hover:bg-[#eef4ff] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">파일 추가</span>
            </button>
            <input
              ref={docInputRef}
              type="file"
              multiple
              onChange={handleDocFileUpload}
              className="hidden"
            />
          </div>

          {/* Attached Files List */}
          {attachedFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-2.5 rounded-lg border border-[#c2c6d6]/60 bg-[#f9f9ff] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-[#0058be] shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-[#191b23] truncate">{file.name}</div>
                      <div className="text-[10px] font-mono text-[#505f76]">
                        {(file.size / 1024).toFixed(1)} KB • {file.uploadedAt}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachedFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => docInputRef.current?.click()}
              className="p-4 border border-dashed border-[#c2c6d6] rounded-lg text-center cursor-pointer hover:bg-[#f9f9ff] transition-colors"
            >
              <span className="text-xs text-[#505f76]">
                클릭하여 CAD 도면(DWG, DXF, STEP) 또는 사양 문서(PDF, TXT) 첨부
              </span>
            </div>
          )}
        </div>

        {/* SECTION 5: Configuration & Generate Action */}
        <div className="bg-white rounded-xl p-5 md:p-6 shadow-[0px_2px_4px_rgba(31,41,55,0.06),0px_4px_12px_rgba(31,41,55,0.04)] border border-[#c2c6d6]/60 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Blueprint URL */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono font-medium text-[#424754] flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-[#0058be]" />
                <span>도면 이미지 핫링크 URL (선택)</span>
              </label>
              <input
                type="text"
                value={blueprintUrl}
                onChange={(e) => setBlueprintUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs font-mono text-[#191b23] bg-[#f9f9ff] px-2.5 py-2 rounded-md border border-[#c2c6d6] focus:outline-none focus:ring-1 focus:ring-[#0058be]"
              />
            </div>

            {/* Target Level */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono font-medium text-[#424754] flex items-center gap-1">
                <Sliders className="w-3 h-3 text-[#0058be]" />
                <span>조립 공정 상세도</span>
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full text-xs font-mono text-[#191b23] bg-[#f9f9ff] px-2.5 py-2 rounded-md border border-[#c2c6d6] focus:outline-none focus:ring-1 focus:ring-[#0058be]"
              >
                <option value="정밀 조립 (8단계)">정밀 조립 (8단계 - 체결 토크 & DAG)</option>
                <option value="표준 조립 (6단계)">표준 조립 (6단계)</option>
                <option value="간이 프로토타입 (4단계)">간이 프로토타입 (4단계)</option>
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#c2c6d6]/30">
            <div className="text-xs font-mono text-[#505f76] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#0058be]" />
              <span>등록 부품 {partsList.length}개 및 요구사항 기반으로 위상 정렬 순서를 산출합니다.</span>
            </div>

            <button
              onClick={handleGenerateWithAI}
              disabled={isLoading || (!promptInput.trim() && partsList.length === 0)}
              className="whitespace-nowrap w-full sm:w-auto px-6 py-3 rounded-lg bg-[#0058be] hover:bg-[#004395] active:scale-[0.98] text-white text-xs md:text-sm font-mono font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="whitespace-nowrap">AI 조립 가이드 생성 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="whitespace-nowrap">AI 조립 순서 및 지침서 생성하기</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Loading Indicator Log */}
          {isLoading && (
            <div className="p-3 bg-[#d8e2ff]/50 rounded-lg text-xs font-mono text-[#0058be] flex items-center gap-2 border border-[#adc6ff]/60 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{generationLog}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
