export interface AssemblyStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  completed: boolean;
  requiredParts: string[];
  notes?: string;
  diagramHotlink?: string;
  estimatedTimeMin?: number;
  torqueSpec?: string;
  dependsOn?: string[]; // IDs of predecessor steps that must be completed before this step
}

export interface BomItem {
  id: string;
  partName: string;
  partCode: string;
  category: string;
  quantity: number;
  unit: string;
  specs: string;
  status: "재고확보" | "준비필요" | "규격검토" | "발주중" | "검수완료";
  unitPrice?: number;
}

export interface ToolItem {
  id: string;
  toolName: string;
  spec: string;
  checked: boolean;
}

export interface CompatibilityWarning {
  title: string;
  message: string;
  stepIndex?: number;
  severity?: "error" | "warning" | "info";
  dismissed?: boolean;
}

export interface AssemblyProject {
  id?: string;
  title: string;
  subtitle: string;
  version: string;
  description: string;
  blueprintUrl: string;
  warning?: CompatibilityWarning;
  steps: AssemblyStep[];
  bom: BomItem[];
  toolkit: ToolItem[];
  author?: string;
  updatedAt?: string;
  category?: string;
}

export interface SavedProjectRecord {
  id: string;
  title: string;
  subtitle: string;
  version: string;
  description: string;
  category: string;
  stepCount: number;
  completedCount: number;
  bomCount: number;
  hasWarning: boolean;
  updatedAt: string;
  blueprintUrl: string;
  project: AssemblyProject;
}

export type ActiveScreen = "home" | "prompt_setup" | "assembly_manager";

export type SidebarTab =
  | "steps"
  | "graph"
  | "bom"
  | "compatibility"
  | "toolkit";

export interface PromptPartItem {
  id: string;
  name: string;
  category: string;
  dimension: string;
  isUnknownDimension: boolean;
  isUnknownCategory?: boolean;
  quantity: number;
  notes?: string;
  source?: "manual" | "vision";
}

export interface AttachedFileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

