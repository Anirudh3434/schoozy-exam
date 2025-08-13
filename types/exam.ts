export interface Student {
  name: string
  email: string
  examId: string
  cameraStatus: "checking" | "enabled" | "disabled"
}

export interface Question {
  id: number
  text: string
  options: string[]
  correctAnswer?: number
  selectedAnswer?: number
  isMarkedForReview: boolean
  isAnswered: boolean
}

export interface ExamConfig {
  title: string
  duration: number // in minutes
  totalQuestions: number
  markingScheme: {
    correct: number
    incorrect: number
    unanswered: number
  }
  languages: string[]
}

export interface ExamState {
  currentPage: "landing" | "student-info" | "instructions" | "mock-test" | "exam"
  student: Student | null
  timeRemaining: number // in seconds
  currentQuestion: number
  questions: Question[]
  isSubmitted: boolean
}

export interface ExamStats {
  answered: number
  notAnswered: number
  markedForReview: number
  answeredAndMarkedForReview: number
}
