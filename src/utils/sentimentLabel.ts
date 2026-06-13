export function sentimentToMoodLabel(score: number): string {
  if (score >= 0.3) {
    return 'Positive'
  }

  if (score <= -0.3) {
    return 'Stressed'
  }

  return 'Neutral'
}
