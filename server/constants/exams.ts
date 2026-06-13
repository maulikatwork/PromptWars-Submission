export const EXAM_OPTIONS = ['JEE', 'NEET', 'CUET', 'CAT', 'GATE', 'UPSC', 'Other'] as const

export type ExamOption = (typeof EXAM_OPTIONS)[number]

export function isValidExam(value: unknown): value is ExamOption {
  return typeof value === 'string' && EXAM_OPTIONS.includes(value as ExamOption)
}
