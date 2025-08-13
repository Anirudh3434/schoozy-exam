"use client"

import { useState } from "react"
import type { ExamState } from "@/types/exam"
import { LandingPage } from "@/components/exam/landing-page"
import { StudentInfoForm } from "@/components/exam/student-info-form"
import { InstructionsPage } from "@/components/exam/instructions-page"
import { ExamInterface } from "@/components/exam/exam-interface"

const initialExamConfig = {
  title: "Olympiad Exam",
  duration: 180, // 3 hours
  totalQuestions: 100,
  markingScheme: {
    correct: 4,
    incorrect: -1,
    unanswered: 0,
  },
  languages: ["English", "Hindi"],
}

export default function ExamApp() {
  const [examState, setExamState] = useState<ExamState>({
    currentPage: "landing",
    student: null,
    timeRemaining: initialExamConfig.duration * 60,
    currentQuestion: 1,
    questions: [],
    isSubmitted: false,
  })

  const updateExamState = (updates: Partial<ExamState>) => {
    setExamState((prev) => ({ ...prev, ...updates }))
  }

  const renderCurrentPage = () => {
    switch (examState.currentPage) {
      case "landing":
        return (
          <LandingPage config={initialExamConfig} onNext={() => updateExamState({ currentPage: "student-info" })} />
        )
      case "student-info":
        return (
          <StudentInfoForm
            onSubmit={(student) => {
              updateExamState({
                student,
                currentPage: "instructions",
              })
            }}
            onBack={() => updateExamState({ currentPage: "landing" })}
          />
        )
      case "instructions":
        return (
          <InstructionsPage
            config={initialExamConfig}
            onStartExam={() => updateExamState({ currentPage: "exam" })}
            onBack={() => updateExamState({ currentPage: "student-info" })}
          />
        )
      case "exam":
        return <ExamInterface examState={examState} config={initialExamConfig} onUpdateState={updateExamState} />
      default:
        return null
    }
  }

  return <div className="min-h-screen bg-gray-100">{renderCurrentPage()}</div>
}
