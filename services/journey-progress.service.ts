export interface JourneyMilestone {
  current: number;
  next: number | null;
  completed: number[];
}

const MILESTONES = [25, 50, 75, 100];

export function getJourneyMilestones(progress: number): JourneyMilestone {
  const safeProgress = Math.max(0, Math.min(progress, 100));

  let current = 0;

  for (const milestone of MILESTONES) {
    if (safeProgress >= milestone) {
      current = milestone;
    }
  }

  const next = MILESTONES.find((milestone) => milestone > current) ?? null;

  return {
    current,

    next,

    completed: MILESTONES.filter((milestone) => safeProgress >= milestone),
  };
}
