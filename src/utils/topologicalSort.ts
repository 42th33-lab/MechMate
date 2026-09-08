import { AssemblyStep } from "../types";

export interface TopologicalSortResult {
  success: boolean;
  sortedSteps: AssemblyStep[];
  levels: AssemblyStep[][];
  hasCycle: boolean;
  cycleNodeIds: string[];
  error?: string;
}

/**
 * Performs Kahn's Algorithm (Topological Sort) on Assembly Steps.
 * Each step can declare predecessor steps in `dependsOn` (must be done before this step).
 * Edges represent: predecessor -> currentStep
 */
export function performTopologicalSort(steps: AssemblyStep[]): TopologicalSortResult {
  if (!steps || steps.length === 0) {
    return {
      success: true,
      sortedSteps: [],
      levels: [],
      hasCycle: false,
      cycleNodeIds: [],
    };
  }

  const stepMap = new Map<string, AssemblyStep>();
  steps.forEach((s) => stepMap.set(s.id, s));

  // Build adjacency list (predecessor -> successors) and calculate inDegrees
  // Edge: u -> v means u must precede v.
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  steps.forEach((s) => {
    adj.set(s.id, []);
    inDegree.set(s.id, 0);
  });

  steps.forEach((s) => {
    const deps = s.dependsOn || [];
    deps.forEach((predecessorId) => {
      if (stepMap.has(predecessorId)) {
        adj.get(predecessorId)?.push(s.id);
        inDegree.set(s.id, (inDegree.get(s.id) || 0) + 1);
      }
    });
  });

  // Kahn's algorithm with Level (Wave) calculation
  // Queue stores { id, level }
  const queue: { id: string; level: number }[] = [];
  const nodeLevels = new Map<string, number>();

  // Find all root nodes (inDegree === 0)
  steps.forEach((s) => {
    if ((inDegree.get(s.id) || 0) === 0) {
      queue.push({ id: s.id, level: 0 });
      nodeLevels.set(s.id, 0);
    }
  });

  const sortedIds: string[] = [];
  const levelsMap = new Map<number, AssemblyStep[]>();

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    sortedIds.push(id);

    const stepObj = stepMap.get(id);
    if (stepObj) {
      if (!levelsMap.has(level)) {
        levelsMap.set(level, []);
      }
      levelsMap.get(level)!.push(stepObj);
    }

    const neighbors = adj.get(id) || [];
    for (const nextId of neighbors) {
      const currentIn = inDegree.get(nextId) || 0;
      const updatedIn = currentIn - 1;
      inDegree.set(nextId, updatedIn);

      // Track max level from all predecessors + 1
      const prevLevel = nodeLevels.get(nextId) ?? -1;
      nodeLevels.set(nextId, Math.max(prevLevel, level + 1));

      if (updatedIn === 0) {
        queue.push({ id: nextId, level: nodeLevels.get(nextId)! });
      }
    }
  }

  // Check for cycle (if sortedIds.length < steps.length)
  if (sortedIds.length < steps.length) {
    const cycleNodeIds: string[] = [];
    steps.forEach((s) => {
      if (!sortedIds.includes(s.id)) {
        cycleNodeIds.push(s.id);
      }
    });

    return {
      success: false,
      sortedSteps: steps,
      levels: [],
      hasCycle: true,
      cycleNodeIds,
      error: `순환 의존성(Cycle) 감지: 다음 공정들 사이에 서로를 필요로 하는 폐루프가 존재합니다 (${cycleNodeIds
        .map((id) => stepMap.get(id)?.title || id)
        .join(" ↔ ")})`,
    };
  }

  // Convert levelsMap to ordered array of levels
  const maxLevel = Math.max(...Array.from(levelsMap.keys()), 0);
  const levels: AssemblyStep[][] = [];
  for (let l = 0; l <= maxLevel; l++) {
    if (levelsMap.has(l)) {
      levels.push(levelsMap.get(l)!);
    }
  }

  // Map sorted IDs back to step objects with re-indexed stepNumbers
  const sortedSteps = sortedIds
    .map((id, index) => {
      const original = stepMap.get(id)!;
      return {
        ...original,
        stepNumber: index + 1,
      };
    })
    .filter(Boolean);

  return {
    success: true,
    sortedSteps,
    levels,
    hasCycle: false,
    cycleNodeIds: [],
  };
}

/**
 * Validates whether adding a dependency u -> v would create a cycle.
 */
export function willCreateCycle(
  steps: AssemblyStep[],
  targetStepId: string,
  newPredecessorId: string
): boolean {
  if (targetStepId === newPredecessorId) return true;

  // Build temporary steps with the proposed dependency
  const tempSteps = steps.map((s) => {
    if (s.id === targetStepId) {
      const current = s.dependsOn || [];
      if (!current.includes(newPredecessorId)) {
        return { ...s, dependsOn: [...current, newPredecessorId] };
      }
    }
    return s;
  });

  const result = performTopologicalSort(tempSteps);
  return result.hasCycle;
}
