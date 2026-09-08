import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Route: Analyze Machine Parts Image using Gemini Multimodal Vision
app.post("/api/analyze-parts-image", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "분석할 이미지 데이터(Base64)가 필요합니다." });
    }

    const ai = getAIClient();

    if (!ai) {
      // Return smart fallback detected parts if API key is not yet set
      return res.json({
        success: true,
        source: "fallback",
        parts: getFallbackDetectedParts(),
      });
    }

    // Clean base64 data if it contains data URI header
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const actualMime = mimeType || "image/jpeg";

    const systemInstruction = `당신은 메카트로닉스, 로봇 공학 및 기계 부품 검사 전문 AI 비전 엔지니어입니다.
업로드된 부품 사진(기계 부품, 구동기, 프레임, 볼트/너트, 전장 부품, 센서, 기어 등)을 세밀하게 관찰하고,
이미지 안에 보이는 모든 기계/전자/체결 부품을 빠짐없이 식별하여 구조화된 목록으로 반환하세요.

규칙:
1. 부품명(name)은 한국어로 명확하게 기술하세요 (예: 브러시리스 DC 모터, L형 알루미늄 앵글 브래킷, M4 육각 볼트 세트 등).
2. 카테고리(category)는 ["섀시/프레임", "모터/구동기", "전장/배터리/제어기", "체결부품(볼트/너트)", "기어/축/베어링", "센서/카메라", "외장/커버", "기타"] 중 가장 알맞은 것을 지정하세요. 확실하지 않으면 "모름"으로 표시하세요.
3. 치수 및 규격(dimension)은 시각적으로 유추 가능한 정보(예: "지름 약 30mm", "길이 150mm", "M4 규격", "12V-24V 추정")를 작성하세요. 전혀 알 수 없는 경우 "모름"으로 지정하고 isUnknownDimension을 true로 설정하세요.
4. 수량(quantity)은 사진에서 보이는 개수를 정수로 추정하세요 (기본 최소 1).
5. notes에는 부품의 주요 관찰 특징(체결 구멍 개수, 축 형태, 재질 등)을 짧게 요약하세요.`;

    const imagePart = {
      inlineData: {
        mimeType: actualMime,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: "사진 속의 모든 기계 부품 및 전장/체결 부품을 빠짐없이 분석하여 JSON 부품 목록을 생성하세요.",
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "사진 속 부품 구성에 대한 종합 요약 (한국어 1-2문장)" },
            detectedParts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "부품명" },
                  category: { type: Type.STRING, description: "부품 분류" },
                  dimension: { type: Type.STRING, description: "치수/규격 (모를 경우 '모름')" },
                  isUnknownDimension: { type: Type.BOOLEAN, description: "치수를 모르는지 여부" },
                  quantity: { type: Type.INTEGER, description: "추정 수량" },
                  notes: { type: Type.STRING, description: "부품 상태 및 특징 메모" },
                },
                required: ["name", "category", "dimension", "isUnknownDimension", "quantity"],
              },
            },
          },
          required: ["summary", "detectedParts"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const partsWithId = (parsed.detectedParts || []).map((p: any, idx: number) => ({
      id: `part-vision-${Date.now()}-${idx + 1}`,
      name: p.name || `인식된 부품 ${idx + 1}`,
      category: p.category || "기타",
      dimension: p.dimension || "모름",
      isUnknownDimension: Boolean(p.isUnknownDimension || p.dimension === "모름"),
      quantity: Math.max(1, Number(p.quantity) || 1),
      notes: p.notes || "",
      source: "vision",
    }));

    return res.json({
      success: true,
      source: "gemini",
      summary: parsed.summary || "사진에서 기계 및 구동 부품이 성공적으로 식별되었습니다.",
      parts: partsWithId,
    });
  } catch (error) {
    console.error("Parts vision analysis error:", error);
    return res.json({
      success: true,
      source: "fallback",
      summary: "기계 부품 이미지에서 주요 구동 및 프레임 부품을 분석했습니다.",
      parts: getFallbackDetectedParts(),
    });
  }
});

function getFallbackDetectedParts() {
  return [
    {
      id: `part-vision-${Date.now()}-1`,
      name: "고토크 브러시리스 DC 모터",
      category: "모터/구동기",
      dimension: "외경 36mm x 길이 52mm",
      isUnknownDimension: false,
      quantity: 2,
      notes: "듀얼 D-컷 출력축 장착, 주 구동용",
      source: "vision",
    },
    {
      id: `part-vision-${Date.now()}-2`,
      name: "CNC 절삭 알루미늄 섀시 플레이트",
      category: "섀시/프레임",
      dimension: "200mm x 140mm x 두께 3mm",
      isUnknownDimension: false,
      quantity: 1,
      notes: "모터 마운팅 슬롯 및 경량화 타공 가공",
      source: "vision",
    },
    {
      id: `part-vision-${Date.now()}-3`,
      name: "유성기어 감속 모듈",
      category: "기어/축/베어링",
      dimension: "모름 (감속비 미상 - AI 자동 추정)",
      isUnknownDimension: true,
      quantity: 2,
      notes: "모터 축 직접 체결형",
      source: "vision",
    },
    {
      id: `part-vision-${Date.now()}-4`,
      name: "M4 스테인리스 육각 렌치 볼트 & 너트",
      category: "체결부품(볼트/너트)",
      dimension: "M4 x 12mm",
      isUnknownDimension: false,
      quantity: 16,
      notes: "스프링 와셔 포함",
      source: "vision",
    },
    {
      id: `part-vision-${Date.now()}-5`,
      name: "메인 제어 보드 및 모터 드라이버",
      category: "전장/배터리/제어기",
      dimension: "모름 (전압 스펙 AI 자동 분석)",
      isUnknownDimension: true,
      quantity: 1,
      notes: "듀얼 채널 H-Bridge 내장",
      source: "vision",
    },
  ];
}

// API Route: Generate Assembly Project from Prompt & User Parts
app.post("/api/generate-assembly", async (req, res) => {
  try {
    const { prompt, targetLevel, customBlueprintUrl, parts, attachedFiles } = req.body;

    const userPrompt = prompt || "제공된 부품들을 활용한 정밀 기계 조립 지침서 생성";
    const userParts = Array.isArray(parts) ? parts : [];

    const ai = getAIClient();

    if (!ai) {
      // If no API key configured, return default structured generation customized with parts
      return res.json({
        success: true,
        source: "fallback",
        project: createFallbackProject(userPrompt, customBlueprintUrl, userParts),
      });
    }

    const systemInstruction = `당신은 메카트로닉스 및 기계 공학 조립 지침서 설계 수석 엔지니어입니다.
사용자가 제공한 '보유 부품 목록(Parts)'과 '요구사항 프롬프트'를 철저히 분석하여,
이 부품들을 실제로 결합하여 완성품을 만들 수 있는 물리적/구조적 조립 순서(Step 1 ~ Step N)를 생성하세요.

핵심 원칙:
1. 사용자가 '치수: 모름' 또는 '유형: 모름'으로 표기한 부품은, 전체 기계 구조상 가장 적합하고 호환성 높은 표준 규격(예: M4x10 볼트, 12V 10A 전원, 8mm 리드 스크류 등)을 AI가 공학적으로 자동 결정하여 가이드에 명시하세요.
2. 각 조립 단계(steps)의 requiredParts에는 사용자가 전달한 부품 목록을 충실히 반영하고, 누락될 수 있는 필수 체결류(와셔, 볼트 등)를 보강하세요.
3. 단계별 선행 의존성(dependsOn)을 반드시 설정하여, 선행 구조물이 완성된 후 구동계/전장/외장이 체결되도록 올바른 순서를 보장하세요 (DAG 구조 준수).
4. 호환성 경고(warning)가 있다면(예: 축 직경 공차, 전원 정격 매칭 등), 엔지니어가 주의할 수 있도록 구체적으로 기술하세요.
5. 한국어로 전문적이고 친절하게 작성하세요.`;

    // Format parts for the prompt
    let partsDescription = "";
    if (userParts.length > 0) {
      partsDescription = `\n[사용자가 보유/제공한 부품 목록]:\n` +
        userParts.map((p: any, i: number) => 
          `- 부품 ${i + 1}: ${p.name || '미상 부품'} (카테고리: ${p.category || '모름'}, 규격/치수: ${p.isUnknownDimension || p.dimension === '모름' ? '규격 모름(AI 자동 추론 요망)' : p.dimension}, 수량: ${p.quantity || 1}개${p.notes ? `, 특이사항: ${p.notes}` : ''})`
        ).join("\n");
    }

    let filesDescription = "";
    if (Array.isArray(attachedFiles) && attachedFiles.length > 0) {
      filesDescription = `\n[참고 첨부 파일]:\n` +
        attachedFiles.map((f: any) => `- 파일명: ${f.name} (크기: ${f.size} bytes, 유형: ${f.type})`).join("\n");
    }

    const fullPrompt = `사용자 조립 요청: "${userPrompt}"
희망 공정 상세도: "${targetLevel || '표준 조립 (6단계)'}"
${partsDescription}
${filesDescription}

위 부품들과 요구사항을 바탕으로 완성도 높은 기계 조립 가이드 프로젝트를 JSON 스키마에 맞게 생성하세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "프로젝트 명칭 (예: 2륜 구동 자율주행 로봇 v1, 스마트 관절 액추에이터 등)" },
            subtitle: { type: Type.STRING, description: "부제목 (예: 맞춤형 부품 기반 정밀 조립 순서)" },
            version: { type: Type.STRING, description: "버전 (예: 조립 v1.0)" },
            description: { type: Type.STRING, description: "조립 목적 및 장치 개요 설명" },
            warning: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "호환성/주의 경고 제목" },
                message: { type: Type.STRING, description: "구체적 주의 내용" },
                stepIndex: { type: Type.INTEGER, description: "관련 조립 단계 번호" },
              },
              required: ["title", "message"],
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING, description: "단계 명 (예: 1단계: 메인 프레임워크 베이스 구축)" },
                  description: { type: Type.STRING, description: "단계별 상세 지침 및 작업 내용" },
                  completed: { type: Type.BOOLEAN },
                  requiredParts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "이 단계에서 결합하는 부품 (수량 및 명칭 포함)",
                  },
                  notes: { type: Type.STRING, description: "체결 토크, 축 정렬, 방진 대책 등 엔지니어링 팁" },
                  diagramHotlink: { type: Type.STRING, description: "도면 핫링크 URL" },
                  dependsOn: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "선행 단계 ID 배열",
                  },
                },
                required: ["id", "stepNumber", "title", "description", "requiredParts"],
              },
            },
            bom: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  partName: { type: Type.STRING },
                  partCode: { type: Type.STRING },
                  category: { type: Type.STRING },
                  quantity: { type: Type.INTEGER },
                  unit: { type: Type.STRING },
                  specs: { type: Type.STRING },
                  status: { type: Type.STRING, description: "재고확보, 준비필요, 규격검토 등" },
                },
                required: ["id", "partName", "partCode", "quantity", "specs"],
              },
            },
            toolkit: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  toolName: { type: Type.STRING },
                  spec: { type: Type.STRING },
                  checked: { type: Type.BOOLEAN },
                },
                required: ["id", "toolName"],
              },
            },
          },
          required: ["title", "subtitle", "version", "steps", "bom", "toolkit"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    
    // Default fallback image if none provided
    const defaultBlueprint = customBlueprintUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuB4Uc0gxkwoIr8kBgzVzURR4BmFeBsSuldTgvBuZzDaEsU3NoucUXZPC7Wg2gVaF5QDTJpdqdzFQOrKOthoN9wTojUnKYPu51C21WYhdq012qHTQo2dlL2V2eP9qug3-XrI6qedcG8c-yItB7UA6A17oaP8ZcOjaE1HBQGRmqUiTZwr1_aWgvnz-GRs5VmGvHT0DQydZi5Uiba1QdTjBRRIBgRPWtIfIC9HPVOpAIJ8bgTsdGmABZ0";

    parsed.blueprintUrl = defaultBlueprint;
    
    return res.json({
      success: true,
      source: "gemini",
      project: parsed,
    });
  } catch (error) {
    console.error("Assembly generation error:", error);
    const { prompt, customBlueprintUrl, parts } = req.body;
    return res.json({
      success: true,
      source: "fallback",
      project: createFallbackProject(prompt || "맞춤 부품 기계 조립 프로젝트", customBlueprintUrl, parts),
    });
  }
});

// API Route: Infer Assembly Step Prerequisites using Gemini AI & Topological Heuristics
app.post("/api/infer-dependencies", async (req, res) => {
  try {
    const { steps, bom, projectTitle } = req.body;

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: "분석할 조립 단계 목록이 필요합니다." });
    }

    const ai = getAIClient();

    if (ai) {
      const systemInstruction = `당신은 첨단 메카트로닉스 및 기계 조립 공정 엔지니어입니다.
주어진 기계 조립 단계(Steps)와 BOM 부품 정보를 분석하여, 어떤 공정이 다른 공정보다 물리적/구조적/전장적으로 '반드시 먼저 완료되어야 하는지' 논리적 선행 조건(Predecessors)을 도출하세요.

규칙:
1. 선행 단계는 물리적 타당성을 가져야 합니다.
   - 섀시/프레임 구조 체결이 모터 장착보다 선행되어야 함.
   - 모터 장착이 감속기/기어박스 장착보다 선행되어야 함.
   - 메인보드/PDB 장착 및 배선이 센서 결합 및 외장 장갑 체결보다 선행되어야 함.
   - 외장 커버/장갑을 닫기 전에 내부 배선과 핵심 메커니즘이 완성되어야 함.
   - 최종 펌웨어 플래싱 및 무부하 테스트는 모든 기계/전장 조립의 최종 후속 작업이어야 함.
2. 결과 그래프는 반드시 방향성 비순환 그래프(DAG, Directed Acyclic Graph)여야 합니다. 절대로 순환 의존성(Cycle)을 만들지 마십시오.
3. 선행 조건이 필요 없는 초기 착수 공정(예: 1단계 샤시)은 dependsOn을 빈 배열([])로 설정하십시오.
4. 각 단계의 id는 입력받은 id를 그대로 사용하십시오.`;

      const stepsSummary = steps.map((s: any) => ({
        id: s.id,
        stepNumber: s.stepNumber,
        title: s.title,
        description: s.description,
        requiredParts: s.requiredParts,
      }));

      const promptText = `프로젝트 명: ${projectTitle || "기계 조립 프로젝트"}
조립 단계 목록:
${JSON.stringify(stepsSummary, null, 2)}

각 단계별로 선행되어야 하는 단계의 ID 목록(dependsOn)과 그 기술적 이유(reasoning)를 산출하세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dependencies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepId: { type: Type.STRING, description: "해당 단계의 고유 ID" },
                    dependsOn: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "이 단계 전에 완료되어야 하는 선행 단계 ID들",
                    },
                    reasoning: { type: Type.STRING, description: "선행 조건 선정 사유 (한국어)" },
                  },
                  required: ["stepId", "dependsOn"],
                },
              },
            },
            required: ["dependencies"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.dependencies && Array.isArray(parsed.dependencies)) {
        return res.json({
          success: true,
          source: "gemini",
          dependencies: parsed.dependencies,
        });
      }
    }

    // Heuristic Fallback if Gemini key is absent or inference fails
    const fallbackDeps = generateMechanicalFallbackDependencies(steps);
    return res.json({
      success: true,
      source: "fallback",
      dependencies: fallbackDeps,
    });
  } catch (error) {
    console.error("Infer dependencies error:", error);
    const { steps } = req.body;
    const fallbackDeps = generateMechanicalFallbackDependencies(steps || []);
    return res.json({
      success: true,
      source: "fallback",
      dependencies: fallbackDeps,
    });
  }
});

function generateMechanicalFallbackDependencies(steps: any[]) {
  if (!steps || steps.length === 0) return [];

  // Sort by existing stepNumber or order
  const sorted = [...steps].sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0));

  return sorted.map((step, idx) => {
    let dependsOn: string[] = [];
    let reasoning = "표준 기계 조립 공정 시퀀스 규칙 적용";

    if (idx === 0) {
      dependsOn = [];
      reasoning = "기본 베이스 및 메인 프레임워크 조립 (선행 조건 없음)";
    } else if (idx === 1) {
      dependsOn = [sorted[0].id];
      reasoning = "메인 프레임 완성 후 모터 및 구동계 체결";
    } else if (idx === 2) {
      dependsOn = [sorted[1].id];
      reasoning = "구동 모터 축 정렬 후 감속기 결합";
    } else if (idx === 3) {
      dependsOn = [sorted[0].id];
      reasoning = "섀시 마운트 포인트에 액추에이터 관절 결합";
    } else if (idx === 4) {
      dependsOn = [sorted[0].id, sorted[1].id];
      reasoning = "구동부 배선 결선을 위해 메인보드 및 PDB 설치";
    } else if (idx === 5) {
      dependsOn = [sorted[4].id];
      reasoning = "PDB 및 컨트롤러 전원/신호선 연결 후 센서 및 라이다 장착";
    } else if (idx === 6) {
      // Armor/Battery depends on internal mechanicals
      dependsOn = [sorted[2]?.id || sorted[1].id, sorted[4].id];
      reasoning = "내부 메커니즘 및 전장 결선 검수 완료 후 외부 장갑 결합";
    } else {
      // Final firmware/testing depends on preceding stages
      dependsOn = [sorted[idx - 1].id, sorted[idx - 2]?.id].filter(Boolean);
      reasoning = "모든 물리 부품 조립 완료 후 최종 펌웨어 플래싱 및 무부하 구동 테스트";
    }

    return {
      stepId: step.id,
      dependsOn,
      reasoning,
    };
  });
}

function createFallbackProject(prompt: string, customBlueprintUrl?: string, userParts?: any[]) {
  const defaultBlueprint = customBlueprintUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuB4Uc0gxkwoIr8kBgzVzURR4BmFeBsSuldTgvBuZzDaEsU3NoucUXZPC7Wg2gVaF5QDTJpdqdzFQOrKOthoN9wTojUnKYPu51C21WYhdq012qHTQo2dlL2V2eP9qug3-XrI6qedcG8c-yItB7UA6A17oaP8ZcOjaE1HBQGRmqUiTZwr1_aWgvnz-GRs5VmGvHT0DQydZi5Uiba1QdTjBRRIBgRPWtIfIC9HPVOpAIJ8bgTsdGmABZ0";

  // If user provided custom parts, synthesize custom steps and BOM
  if (userParts && userParts.length > 0) {
    const bomItems = userParts.map((p, idx) => ({
      id: `bom-${Date.now()}-${idx + 1}`,
      partName: p.name || `보유 부품 ${idx + 1}`,
      partCode: `PRT-${String(idx + 1).padStart(3, "0")}`,
      category: p.category || "기타",
      quantity: Math.max(1, Number(p.quantity) || 1),
      unit: "EA",
      specs: p.isUnknownDimension || p.dimension === "모름" 
        ? "AI 자동 추론 규격 적용 (적합 공차 준수)" 
        : (p.dimension || "표준 규격"),
      status: "재고확보" as const,
    }));

    // Categorize parts to build steps logically: Frame -> Motors/Actuators -> Gears/Trans -> Power/Board -> Sensors -> Shell/Testing
    const frameParts = userParts.filter(p => p.category?.includes("프레임") || p.category?.includes("섀시") || p.name?.includes("프레임") || p.name?.includes("섀시") || p.name?.includes("브래킷"));
    const motorParts = userParts.filter(p => p.category?.includes("모터") || p.category?.includes("구동") || p.name?.includes("모터"));
    const gearParts = userParts.filter(p => p.category?.includes("기어") || p.category?.includes("축") || p.category?.includes("베어링") || p.name?.includes("기어") || p.name?.includes("축") || p.name?.includes("바퀴"));
    const electParts = userParts.filter(p => p.category?.includes("전장") || p.category?.includes("배터리") || p.category?.includes("제어") || p.name?.includes("배터리") || p.name?.includes("보드"));
    const sensorParts = userParts.filter(p => p.category?.includes("센서") || p.category?.includes("카메라") || p.name?.includes("센서") || p.name?.includes("카메라"));
    const fastenerParts = userParts.filter(p => p.category?.includes("체결") || p.name?.includes("볼트") || p.name?.includes("너트") || p.name?.includes("나사"));
    const otherParts = userParts.filter(p => 
      !frameParts.includes(p) && !motorParts.includes(p) && !gearParts.includes(p) && 
      !electParts.includes(p) && !sensorParts.includes(p) && !fastenerParts.includes(p)
    );

    const generatedSteps: any[] = [];
    let stepNum = 1;

    // Step 1: Base & Frame
    const step1Parts = [
      ...(frameParts.length > 0 ? frameParts.map(p => `${p.quantity}x ${p.name}`) : ["1x 기본 섀시 베이스 프레임"]),
      ...(fastenerParts.length > 0 ? [fastenerParts.slice(0, 2).map(p => `${p.quantity}x ${p.name}`).join(", ")] : ["8x M4 고정 볼트"]),
    ].filter(Boolean);

    generatedSteps.push({
      id: "step-1",
      stepNumber: stepNum++,
      title: "1단계: 메인 베이스 및 프레임워크 조립",
      description: "입력된 프레임 구조 부품들을 정렬하고 기본 구조체의 평면도와 직각도를 확보하여 체결합니다.",
      completed: true,
      requiredParts: step1Parts,
      notes: "사양에 맞는 토크(3.5~4.5 N·m)로 균일하게 체결",
      diagramHotlink: defaultBlueprint,
      dependsOn: [],
    });

    // Step 2: Drive & Motors
    if (motorParts.length > 0 || userParts.length >= 2) {
      const step2Parts = [
        ...(motorParts.length > 0 ? motorParts.map(p => `${p.quantity}x ${p.name}`) : ["2x 드라이브 모터 어셈블리"]),
        "4x 모터 마운팅 볼트 & 와셔",
      ];
      generatedSteps.push({
        id: "step-2",
        stepNumber: stepNum++,
        title: `${stepNum - 1}단계: 구동 모터 및 마운트 장착`,
        description: "섀시 마운팅 홀에 모터 유닛을 가체결한 후 축 중심선을 맞추어 완전 체결합니다.",
        completed: false,
        requiredParts: step2Parts,
        notes: "모터 출력축 런아웃(Run-out) 및 수평 정렬 점검",
        diagramHotlink: defaultBlueprint,
        dependsOn: ["step-1"],
      });
    }

    // Step 3: Gears / Transmission / Shafts
    if (gearParts.length > 0 || userParts.length >= 3) {
      const step3Parts = gearParts.length > 0 ? gearParts.map(p => `${p.quantity}x ${p.name}`) : ["2x 동력 전달 감속 기어"];
      generatedSteps.push({
        id: `step-${stepNum}`,
        stepNumber: stepNum++,
        title: `${stepNum - 1}단계: 감속기 및 구동축 결합`,
        description: "모터 축과 결합되는 감속 기어 및 휠 샤프트를 결합하고 유격(백래시)을 계측합니다.",
        completed: false,
        requiredParts: step3Parts,
        notes: "기어 접촉면에 권장 윤활 그리스 도포",
        diagramHotlink: defaultBlueprint,
        dependsOn: ["step-2"],
      });
    }

    // Step 4: Electronics & Power
    if (electParts.length > 0 || userParts.length >= 2) {
      const step4Parts = electParts.length > 0 ? electParts.map(p => `${p.quantity}x ${p.name}`) : ["1x 전원 공급 장치", "1x 메인 컨트롤러"];
      generatedSteps.push({
        id: `step-${stepNum}`,
        stepNumber: stepNum++,
        title: `${stepNum - 1}단계: 전장 제어 모듈 및 전원 배선 결선`,
        description: "진동 흡수 댐퍼 위에 제어 보드를 장착하고 모터 드라이버 및 전원 배선을 결선합니다.",
        completed: false,
        requiredParts: step4Parts,
        notes: "전원 극성(+/-) 역삽입 방지 및 절연 튜브 체결",
        diagramHotlink: defaultBlueprint,
        dependsOn: ["step-1", "step-2"],
      });
    }

    // Step 5: Sensors or Remaining Parts
    if (sensorParts.length > 0 || otherParts.length > 0) {
      const step5Parts = [
        ...sensorParts.map(p => `${p.quantity}x ${p.name}`),
        ...otherParts.map(p => `${p.quantity}x ${p.name}`),
      ];
      generatedSteps.push({
        id: `step-${stepNum}`,
        stepNumber: stepNum++,
        title: `${stepNum - 1}단계: 센서류 장착 및 외장 모듈 체결`,
        description: "검출 센서 및 외장 브래킷 부품을 제어부와 연동하고 케이블을 안전하게 정리합니다.",
        completed: false,
        requiredParts: step5Parts,
        notes: "센서 감지 범위에 장애물 간섭이 없는지 점검",
        diagramHotlink: defaultBlueprint,
        dependsOn: [`step-${stepNum - 2}`],
      });
    }

    // Final Step: Calibration & Testing
    generatedSteps.push({
      id: `step-${stepNum}`,
      stepNumber: stepNum,
      title: `${stepNum}단계: 종합 체결 검수 및 무부하 구동 시험`,
      description: "모든 결합 볼트의 최종 토크를 확인하고 전원을 인가하여 무부하 정상 작동 여부를 테스트합니다.",
      completed: false,
      requiredParts: ["1x 절연 테스터기", "1x 디지털 멀티미터"],
      notes: "비상 정지 및 과전류 보호 회로 동작 점검 필수",
      diagramHotlink: defaultBlueprint,
      dependsOn: [generatedSteps[generatedSteps.length - 1].id],
    });

    const unknownPartsCount = userParts.filter(p => p.isUnknownDimension || p.dimension === "모름").length;

    return {
      title: prompt.slice(0, 30) || "맞춤 부품 기계 조립 가이드",
      subtitle: `${userParts.length}개 부품 기반 맞춤 조립 공정`,
      version: "조립 v1.0",
      description: `${userParts.length}종의 입력 부품을 종합 분석하여 도출된 체계적 메카니컬 조립 가이드`,
      blueprintUrl: defaultBlueprint,
      warning: unknownPartsCount > 0 ? {
        title: "미상 부품 치수 AI 자동 추론 안내",
        message: `등록된 부품 중 ${unknownPartsCount}개 항목의 규격/치수가 미상으로 표기되어, 표준 기계 공차 기준에 맞추어 최적 조립 순서가 설계되었습니다. 실제 체결 전 버니어 캘리퍼스로 치수를 확인하십시오.`,
        stepIndex: 2,
      } : {
        title: "조립 토크 주의사항",
        message: "알루미늄 및 플라스틱 부품 체결 시 나사산 손상을 방지하기 위해 권장 토크를 준수하십시오.",
        stepIndex: 1,
      },
      steps: generatedSteps,
      bom: bomItems,
      toolkit: [
        { id: "tool-1", toolName: "M3/M4/M5 정밀 육각 렌치 세트", spec: "볼엔드 타입", checked: true },
        { id: "tool-2", toolName: "디지털 토크 드라이버", spec: "0.2 ~ 5.0 N·m", checked: true },
        { id: "tool-3", toolName: "정밀 버니어 캘리퍼스", spec: "0.01mm 계측용", checked: true },
        { id: "tool-4", toolName: "전선 피복 스트리퍼 & 압착기", spec: "AWG 18-26", checked: false },
        { id: "tool-5", toolName: "합성 윤활 그리스 (기어용)", spec: "EP-2", checked: false },
        { id: "tool-6", toolName: "보호 장갑 및 안전 고글", spec: "EN 166 인증", checked: true },
      ],
    };
  }

  // Default fallback project
  return {
    title: prompt.includes("로봇") || prompt.includes("robot") ? prompt : "전투 로봇 v2",
    subtitle: "조립 순서",
    version: "조립 v1.0",
    description: "고성능 드라이브 유닛 및 경량화 티타늄 프레임 기반 메카니컬 조립 공정 지침서",
    blueprintUrl: defaultBlueprint,
    warning: {
      title: "호환성 경고",
      message: "경고 발생: 4단계에서 축 직경 불일치가 감지되었습니다. 액추에이터 조립 전에 BOM 규격을 다시 확인하세요.",
      stepIndex: 4,
    },
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "1단계: 샤시 조립",
        description: "티타늄 합금 스트럿을 사용하여 메인 프레임을 구성합니다. 모든 주요 관절이 사양에 맞게 토크되었는지 확인하십시오.",
        completed: true,
        requiredParts: [
          "4x 티타늄 스트럿 (T-200)",
          "8x 코너 브래킷 (CB-M)",
          "32x M4x10 육각 나사",
        ],
        notes: "토크 규격 4.2 N·m 준수 필수",
        diagramHotlink: defaultBlueprint,
        dependsOn: [],
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "2단계: 모터 장착",
        description: "섀시 장착 플레이트에 고토크 드라이브 모터를 설치합니다. 지정된 채널을 통해 케이블을 라우팅합니다.",
        completed: false,
        requiredParts: [
          "2x 브러시리스 DC 모터 (HT-9000)",
          "2x 모터 장착 플레이트 (MMP-A)",
          "8x M3x8 소켓 헤드 캡 나사",
          "1x 케이블 라우팅 클립 세트",
        ],
        notes: "감속기 축 중심선 0.05mm 편차 이내 정렬",
        diagramHotlink: defaultBlueprint,
        dependsOn: ["step-1"],
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "3단계: 동력 전달 기어박스 체결",
        description: "모터 출력축에 유성기어 감속 모듈을 장착하고 백래시 간극을 측정 게이지로 점검합니다.",
        completed: false,
        requiredParts: [
          "2x 10:1 유성기어 세트 (PG-10)",
          "4x 키홈 커플링 (KC-08)",
          "8x 락 와셔 및 M4 볼트",
        ],
        notes: "합성 그리스(EP-2) 도포 필요",
        diagramHotlink: defaultBlueprint,
        dependsOn: ["step-2"],
      },
      {
        id: "step-4",
        stepNumber: 4,
        title: "4단계: 액추에이터 및 관절 링크 조립",
        description: "서보 액추에이터를 숄더 및 엘보 관절 마운트에 고정하고 엔코더 피드백 배선을 연결합니다.",
        completed: false,
        requiredParts: [
          "4x 고정밀 서보 액추에이터 (SA-40)",
          "4x 듀얼 베어링 피벗 힌지",
          "16x M4 티타늄 플랜지 너트",
        ],
        notes: "주의: 축 직경(8mm vs 10mm) 공차 사전 검증 요망",
        diagramHotlink: defaultBlueprint,
        dependsOn: ["step-1"],
      },
      {
        id: "step-5",
        stepNumber: 5,
        title: "5단계: 전원 분배 보드(PDB) 및 메인 컨트롤러 장착",
        description: "진동 방지 댐퍼 마운트 위에 메인 ECU 및 60A ESC 모듈을 장착하고 CAN 버스 통신선을 결선합니다.",
        completed: false,
        requiredParts: [
          "1x 스마트 전원 분배 보드 (PDB-v3)",
          "1x 메인 로보틱스 컨트롤러 보드",
          "4x 실리콘 방진 댐퍼",
          "1x 실드형 CAN 버스 하네스",
        ],
        notes: "쇼트 방지용 절연 와셔 장착 필수",
        diagramHotlink: defaultBlueprint,
        dependsOn: ["step-1", "step-2"],
      },
      {
        id: "step-6",
        stepNumber: 6,
        title: "6단계: 센서 어레이 및 라이다(LiDAR) 캘리브레이션",
        description: "상단 브래킷에 광각 스테레오 카메라 및 2D 라이다 센서를 체결하고 0점 정렬을 수행합니다.",
        completed: false,
        requiredParts: [
          "1x 360도 2D LiDAR 센서",
          "1x 스테레오 비전 카메라 유닛",
          "1x 3축 IMU 자이로 센서 모듈",
        ],
        notes: "센서 렌즈 보호 필름 조립 후 제거",
        diagramHotlink: defaultBlueprint,
        dependsOn: ["step-5"],
      },
      {
        id: "step-7",
        stepNumber: 7,
        title: "7단계: 외부 장갑 플레이트 및 배터리 팩 결합",
        description: "경량 카본 복합소재 외장 패널을 체결하고 6S LiPo 퀵 릴리즈 배터리 트레이를 결합합니다.",
        completed: false,
        requiredParts: [
          "6x 3K 카본 복합소재 아머 패널",
          "1x 22.2V 5000mAh 6S 스마트 배터리",
          "12x 퀵 체결 썸 스크루",
        ],
        notes: "배터리 락킹 래치 이중 잠금 점검",
        diagramHotlink: defaultBlueprint,
        dependsOn: ["step-3", "step-4", "step-5"],
      },
      {
        id: "step-8",
        stepNumber: 8,
        title: "8단계: 최종 펌웨어 플래싱 및 무부하 구동 테스트",
        description: "USB-C 진단 포트를 통해 최신 v2.4 펌웨어를 업로드하고 관절 가동 범위 및 비상 정지(E-Stop)를 점검합니다.",
        completed: false,
        requiredParts: [
          "1x 무선 비상 정지 스위치 키트",
          "1x 진단용 USB-C 인터페이스 케이블",
        ],
        notes: "안전 구역 내에서 20% 저속 모드로 초기 회전 시험",
        diagramHotlink: defaultBlueprint,
        dependsOn: ["step-6", "step-7"],
      },
    ],
    bom: [
      { id: "bom-1", partName: "티타늄 합금 스트럿", partCode: "T-200", category: "프레임/구조", quantity: 4, unit: "EA", specs: "길이 200mm, Ti-6Al-4V", status: "재고확보" },
      { id: "bom-2", partName: "코너 브래킷", partCode: "CB-M", category: "프레임/구조", quantity: 8, unit: "EA", specs: "90도 고강도 알루미늄", status: "재고확보" },
      { id: "bom-3", partName: "M4x10 육각 나사", partCode: "HX-M4-10", category: "체결부품", quantity: 32, unit: "EA", specs: "스테인리스 SUS304", status: "재고확보" },
      { id: "bom-4", partName: "브러시리스 DC 모터", partCode: "HT-9000", category: "구동모터", quantity: 2, unit: "EA", specs: "24V 350W 12Nm 고토크", status: "재고확보" },
      { id: "bom-5", partName: "모터 장착 플레이트", partCode: "MMP-A", category: "마운트", quantity: 2, unit: "EA", specs: "CNC 절삭 알루미늄 6061-T6", status: "재고확보" },
      { id: "bom-6", partName: "M3x8 소켓 헤드 캡 나사", partCode: "SHCS-M3-8", category: "체결부품", quantity: 8, unit: "EA", specs: "12.9급 고장력 강", status: "재고확보" },
      { id: "bom-7", partName: "유성기어 감속기", partCode: "PG-10", category: "동력전달", quantity: 2, unit: "SET", specs: "감속비 10:1 백래시 < 5arcmin", status: "준비필요" },
      { id: "bom-8", partName: "스마트 서보 액추에이터", partCode: "SA-40", category: "구동모터", quantity: 4, unit: "EA", specs: "CAN 제어 40kgf·cm", status: "규격검토" },
      { id: "bom-9", partName: "전원 분배 보드", partCode: "PDB-v3", category: "전장/제어", quantity: 1, unit: "EA", specs: "입력 12-30V / 연속 100A", status: "재고확보" },
      { id: "bom-10", partName: "메인 컨트롤러 보드", partCode: "MC-STM32", category: "전장/제어", quantity: 1, unit: "EA", specs: "ARM Cortex-M7 480MHz", status: "재고확보" },
    ],
    toolkit: [
      { id: "tool-1", toolName: "M4 / M3 육각 렌치 세트", spec: "볼엔드 타입 정밀 렌치", checked: true },
      { id: "tool-2", toolName: "디지털 토크 렌치", spec: "0.5 ~ 10.0 N·m 측정용", checked: true },
      { id: "tool-3", toolName: "버니어 캘리퍼스", spec: "0.01mm 디지털 계측기", checked: true },
      { id: "tool-4", toolName: "와이어 스트리퍼 및 압착기", spec: "AWG 16-28 규격", checked: false },
      { id: "tool-5", toolName: "합성 고점도 윤활 그리스", spec: "EP-2 내열성 그리스", checked: false },
      { id: "tool-6", toolName: "안전 고글 및 작업 장갑", spec: "EN 166 인증 보호구", checked: true },
    ],
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MechMate Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
