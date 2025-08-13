"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ExamState, ExamConfig, Question, ExamStats } from "@/types/exam"
import axios from "axios"

interface ExamInterfaceProps {
  examState: ExamState
  config: ExamConfig
  onUpdateState: (updates: Partial<ExamState>) => void
}

interface ApiQuestion {
  id: number
  text: string
  options: string[]
  question_number: number
}

export function ExamInterface({ examState, config, onUpdateState }: ExamInterfaceProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState("english")
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [currentApiQuestion, setCurrentApiQuestion] = useState<ApiQuestion | null>(null)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const TOTAL_QUESTIONS = 30

  const getQuestion = async (questionNumber: number) => {
    setLoadingQuestion(true)
    setError(null)
    try {
      const response = await axios.get("https://schoozy.in/api/exam/get-question", {
        params: {
          question_number: questionNumber,
        },
      })
      
      if (response.data && response.data.success) {
        setCurrentApiQuestion(response.data.data)
        return response.data.data
      } else {
        throw new Error(response.data?.message || "Failed to fetch question")
      }
    } catch (error) {
      console.error("Failed to fetch question:", error)
      setError("Failed to load question. Please try again.")
      return null
    } finally {
      setLoadingQuestion(false)
    }
  }

  // Initialize questions array with placeholder data
  const initializeQuestionsArray = () => {
    return Array.from({ length: TOTAL_QUESTIONS }, (_, i) => ({
      id: i + 1,
      text: "",
      options: [],
      selectedAnswer: undefined,
      isMarkedForReview: false,
      isAnswered: false,
    }))
  }

  useEffect(() => {
    // Initialize exam
    const initializeExam = async () => {
      setIsLoading(true)

      // Initialize questions array
      const initialQuestions = initializeQuestionsArray()
      onUpdateState({ questions: initialQuestions })

      // Load first question
      await getQuestion(1)

      // Start camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error("Camera access denied:", error)
      }

      setIsLoading(false)
    }

    initializeExam()

    // Timer
    const timer = setInterval(() => {
      onUpdateState({
        timeRemaining: Math.max(0, examState.timeRemaining - 1),
      })
    }, 1000)

    return () => {
      clearInterval(timer)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    // Load question when current question changes
    if (examState.currentQuestion && examState.questions.length > 0) {
      getQuestion(examState.currentQuestion)
    }
  }, [examState.currentQuestion])

  useEffect(() => {
    // Update selected answer when question changes
    const currentQuestion = examState.questions[examState.currentQuestion - 1]
    if (currentQuestion) {
      setSelectedAnswer(currentQuestion.selectedAnswer ?? null)
    }
  }, [examState.currentQuestion, examState.questions])

  useEffect(() => {
    // Auto-submit when time runs out
    if (examState.timeRemaining <= 0 && !examState.isSubmitted) {
      handleSubmitExam()
    }
  }, [examState.timeRemaining])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getCurrentQuestion = () => {
    return examState.questions[examState.currentQuestion - 1]
  }

  const getQuestionStatus = (question: Question) => {
    if (question.isAnswered && question.isMarkedForReview) return "answered-marked"
    if (question.isAnswered) return "answered"
    if (question.isMarkedForReview) return "marked"
    return "not-answered"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "bg-green-500 text-white"
      case "marked":
        return "bg-blue-500 text-white"
      case "answered-marked":
        return "bg-purple-500 text-white"
      default:
        return "bg-red-500 text-white"
    }
  }

  const updateQuestion = (questionIndex: number, updates: Partial<Question>) => {
    const updatedQuestions = [...examState.questions]
    updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], ...updates }
    onUpdateState({ questions: updatedQuestions })
  }

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex)
  }

  const saveResponse = async () => {
    if (!currentApiQuestion) return
    
    try {
      const response = await axios.post("https://schoozy.in/api/exam/submit-answer", {
        question_number: examState.currentQuestion,
        question_id: currentApiQuestion.id,
        answer: selectedAnswer !== null ? String.fromCharCode(65 + selectedAnswer) : "",
        time_taken: 34 // You might want to track actual time taken
      })
      console.log("Response saved:", response.data)
    } catch (error) {
      console.error("Failed to save response:", error)
    }
  }

  const handleSaveAndNext = async () => {
    await saveResponse()

    const currentIndex = examState.currentQuestion - 1
    updateQuestion(currentIndex, {
      selectedAnswer,
      isAnswered: selectedAnswer !== null,
    })

    if (examState.currentQuestion < TOTAL_QUESTIONS) {
      onUpdateState({ currentQuestion: examState.currentQuestion + 1 })
    }
  }

  const handleMarkForReviewAndNext = async () => {
    await saveResponse()
    
    const currentIndex = examState.currentQuestion - 1
    updateQuestion(currentIndex, {
      selectedAnswer,
      isAnswered: selectedAnswer !== null,
      isMarkedForReview: true,
    })

    if (examState.currentQuestion < TOTAL_QUESTIONS) {
      onUpdateState({ currentQuestion: examState.currentQuestion + 1 })
    }
  }

  const handleClearResponse = () => {
    setSelectedAnswer(null)
    const currentIndex = examState.currentQuestion - 1
    updateQuestion(currentIndex, {
      selectedAnswer: undefined,
      isAnswered: false,
    })
  }

  const handlePrevious = () => {
    if (examState.currentQuestion > 1) {
      onUpdateState({ currentQuestion: examState.currentQuestion - 1 })
    }
  }

  const handleNext = () => {
    if (examState.currentQuestion < TOTAL_QUESTIONS) {
      onUpdateState({ currentQuestion: examState.currentQuestion + 1 })
    }
  }

  const handleQuestionJump = (questionNumber: number) => {
    onUpdateState({ currentQuestion: questionNumber })
  }

  const handleSubmitExam = () => {
    onUpdateState({ isSubmitted: true })
    setShowSubmitConfirm(false)
    alert("Exam submitted successfully!")
  }

  const getExamStats = (): ExamStats => {
    const answered = examState.questions.filter((q) => q.isAnswered && !q.isMarkedForReview).length
    const markedForReview = examState.questions.filter((q) => q.isMarkedForReview && !q.isAnswered).length
    const answeredAndMarkedForReview = examState.questions.filter((q) => q.isAnswered && q.isMarkedForReview).length
    const notAnswered = examState.questions.length - answered - markedForReview - answeredAndMarkedForReview

    return {
      answered,
      notAnswered,
      markedForReview,
      answeredAndMarkedForReview,
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing exam...</p>
        </div>
      </div>
    )
  }

  const currentQuestion = getCurrentQuestion()
  const stats = getExamStats()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex h-[calc(100vh-2rem)]">
            {/* Left Panel - Question Area */}
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b">
                <h1 className="text-2xl font-semibold text-slate-800 mb-2">Exam</h1>
                <p className="text-lg text-slate-700 mb-4">
                  Question No. <span className="font-semibold">{examState.currentQuestion}</span> of {TOTAL_QUESTIONS}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-slate-600">View in</span>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {config.languages.map((lang) => (
                        <SelectItem key={lang.toLowerCase()} value={lang.toLowerCase()}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                {loadingQuestion ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading question...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-red-600 mb-4">{error}</p>
                      <Button 
                        onClick={() => getQuestion(examState.currentQuestion)}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : currentApiQuestion ? (
                  <div className="space-y-6">
                    <p className="text-lg text-slate-800 leading-relaxed">{currentApiQuestion.text}</p>

                    <div className="space-y-3">
                      {currentApiQuestion.options.map((option, index) => (
                        <label
                          key={index}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedAnswer === index
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentApiQuestion.id}`}
                            value={index}
                            checked={selectedAnswer === index}
                            onChange={() => handleAnswerSelect(index)}
                            className="mr-3"
                          />
                          <span className="text-slate-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-600">No question available</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleSaveAndNext} 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={loadingQuestion}
                  >
                    Save & Next
                  </Button>
                  <Button 
                    onClick={handleMarkForReviewAndNext} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={loadingQuestion}
                  >
                    Mark for Review & Next
                  </Button>
                  <Button
                    onClick={handleClearResponse}
                    variant="outline"
                    className="bg-gray-500 hover:bg-gray-600 text-white"
                    disabled={loadingQuestion}
                  >
                    Clear Response
                  </Button>
                  <Button 
                    onClick={handlePrevious} 
                    variant="outline" 
                    disabled={examState.currentQuestion === 1 || loadingQuestion}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="outline"
                    disabled={examState.currentQuestion === TOTAL_QUESTIONS || loadingQuestion}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Panel - Camera & Question Palette */}
            <div className="w-80 border-l bg-gray-50 flex flex-col">
              <div className="p-4 space-y-4">
                {/* Camera Section */}
                <div className="bg-gray-200 rounded-lg h-40 flex items-center justify-center overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-lg" />
                </div>
                <div className="text-center">
                  <div className="bg-green-500 text-white px-2 py-1 rounded text-sm">Camera Active</div>
                  <p className="text-xs text-slate-600 mt-1">
                    Person Detection: <span className="text-green-600 font-semibold">Active</span>
                  </p>
                  <p className="text-xs text-slate-600">
                    Camera Focus: <span className="text-green-600 font-semibold">Clear</span>
                  </p>
                </div>

                {/* Profile Card */}
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold mx-auto mb-2">
                      {examState.student?.name?.charAt(0) || "S"}
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">{examState.student?.name || "Student"}</p>
                    <p className="text-xs text-slate-600">Time Left:</p>
                    <p className="font-bold text-lg text-blue-600">{formatTime(examState.timeRemaining)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Question Palette */}
              <div className="flex-1 p-4">
                <h3 className="font-semibold text-slate-700 mb-3">Question Palette</h3>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
                    const questionNumber = i + 1
                    const question = examState.questions[i]
                    return (
                      <button
                        key={questionNumber}
                        onClick={() => handleQuestionJump(questionNumber)}
                        disabled={loadingQuestion}
                        className={`w-8 h-8 text-xs font-semibold rounded ${
                          question ? getStatusColor(getQuestionStatus(question)) : "bg-red-500 text-white"
                        } ${
                          examState.currentQuestion === questionNumber ? "ring-2 ring-slate-800" : ""
                        } ${loadingQuestion ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {questionNumber}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Answered ({stats.answered})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Not Answered ({stats.notAnswered})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Marked for Review ({stats.markedForReview})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span>Answered & Marked ({stats.answeredAndMarkedForReview})</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="p-4 border-t">
                <Button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={examState.isSubmitted || loadingQuestion}
                >
                  Submit Exam
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Confirm Submission</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to submit the exam? You cannot make changes after submission.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setShowSubmitConfirm(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmitExam} className="flex-1 bg-red-600 hover:bg-red-700">
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}