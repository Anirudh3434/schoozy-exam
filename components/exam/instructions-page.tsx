"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ExamConfig } from "@/types/exam"
import axios from "axios"

interface InstructionsPageProps {
  config: ExamConfig
  onStartExam: () => void
  onBack: () => void
}

export function InstructionsPage({ config, onStartExam, onBack }: InstructionsPageProps) {
  const [currentStep, setCurrentStep] = useState<"general" | "mock">("general")
  const [timeRemaining, setTimeRemaining] = useState("03:00:00")
  const [selectedLanguage, setSelectedLanguage] = useState("english")
  const [hasAgreed, setHasAgreed] = useState(false)
  const [user, setUser] = useState<null | { full_name: string; email: string }>(null)

  const VerificationCheck = async () => {
    try {
      const response = await axios.post(
        "https://schoozy.in/api/exam/verify-check",
        {}, // request body (empty in your case)
        {
          withCredentials: true, // credentials should be in config, not body
        }
      )

      if (response.status === 200 && response.data?.user?.[0]) {
        setUser({
          full_name: response.data.user[0].full_name,
          email: response.data.user[0].email,
        })
      }
    } catch (error) {
      console.error("Verification check failed:", error)
    }
  }

  useEffect(() => {
    VerificationCheck()

    // Mock timer countdown
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const [hours, minutes, seconds] = prev.split(":").map(Number)
        const totalSeconds = hours * 3600 + minutes * 60 + seconds
        if (totalSeconds <= 1) {
          clearInterval(timer)
          return "00:00:00"
        }
        const newTotal = totalSeconds - 1
        const newHours = Math.floor(newTotal / 3600)
        const newMinutes = Math.floor((newTotal % 3600) / 60)
        const newSeconds = newTotal % 60
        return `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}:${newSeconds
          .toString()
          .padStart(2, "0")}`
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const renderGeneralInstructions = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">General Instructions:</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-slate-700 list-decimal list-inside">
                <li>The total duration of the examination is {config.duration} minutes.</li>
                <li>The test is divided into sections and each section will have specific time allocation.</li>
                <li>
                  The clock will be set at the server. The countdown timer in the top right corner of screen will
                  display the remaining time available to you for completing the examination. When the timer reaches
                  zero, the examination will end by itself.
                </li>
                <li>
                  The Question Palette displayed on the right side of screen will show the status of each question using
                  one of the following symbols:
                  <ul className="ml-6 mt-2 space-y-1 list-none">
                    <li>
                      1. <span className="text-green-600 font-medium">Answered questions in green colour.</span>
                    </li>
                    <li>
                      2. <span className="text-red-600 font-medium">Unanswered questions in red colour.</span>
                    </li>
                    <li>
                      3. <span className="text-blue-600 font-medium">Marked for review questions in blue colour.</span>
                    </li>
                  </ul>
                </li>
                <li>
                  Marked for review status for a question simply indicates that you would like to review the question
                  again.
                </li>
                <li>
                  Please note that if a question is answered and 'marked for review', your answer for that question will
                  be considered in the evaluation.
                </li>
                <li>You can click on the question palette to navigate faster across questions.</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">Answering a Question:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-700 space-y-2">
                <p className="font-medium">Procedure for multiple-choice questions:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Click on one of the options to select your answer.</li>
                  <li>Click again on the chosen option or Clear Response to deselect.</li>
                  <li>Click on another option to change your answer.</li>
                  <li>Click Save & Next to save your answer.</li>
                  <li>Click Mark for Review & Next to mark for review.</li>
                  <li>Use Question Palette to navigate to previously answered questions.</li>
                  <li>Only saved or marked answers will be considered for evaluation.</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">Navigation:</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                <li>Click question numbers in Question Palette to navigate.</li>
                <li>Navigation does NOT save your answer automatically.</li>
                <li>Use Save & Next to save and move forward.</li>
                <li>Use Mark for Review & Next to mark and proceed.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const renderMockTestInstructions = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">Read the following instruction carefully:</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
                <li>This test comprises of multiple-choice questions.</li>
                <li>Each question will have only one of the available options as the correct answer.</li>
                <li>You are advised not to close the browser window before submitting the test.</li>
                <li>
                  In case, if the test does not load completely or becomes unresponsive, click on browser's refresh
                  button to reload.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">Marking Scheme:</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
                <li>
                  <span className="text-green-600 font-medium">+{config.markingScheme.correct} marks</span> will be
                  awarded for each correct answer.
                </li>
                <li>
                  <span className="text-red-600 font-medium">{config.markingScheme.incorrect} marks</span> will be
                  deducted for each wrong answer.
                </li>
                <li>
                  <span className="text-slate-600 font-medium">{config.markingScheme.unanswered} marks</span> will be
                  deducted for un-attempted questions.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">Language Selection:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Choose your default Language:</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
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
                <p className="text-xs text-slate-600 mt-2">
                  Please note that all questions will appear in your default language. This language can't be changed
                  afterwards.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">Agreement:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreement"
                  checked={hasAgreed}
                  onCheckedChange={(checked) => setHasAgreed(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="agreement" className="text-sm text-slate-700 leading-relaxed">
                  I have read and understood all the instructions. I understand that using unfair means of any sort for
                  any advantage will lead to immediate disqualification. The decision of the examination authority will
                  be final in these matters.
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-slate-800">{config.title}</h1>
          <div className="flex items-center gap-4">
            <Card className="p-4 min-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.full_name?.[0] || "?"}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{user?.full_name || ""}</p>
                  <p className="text-xs text-slate-600">Time Left:</p>
                  <p className="font-bold text-blue-600">{timeRemaining}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentStep === "general" ? renderGeneralInstructions() : renderMockTestInstructions()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={onBack} className="px-6 bg-transparent">
            ← PREVIOUS
          </Button>
          <div className="flex gap-3">
            {currentStep === "general" ? (
              <Button onClick={() => setCurrentStep("mock")} className="px-6 bg-indigo-600 hover:bg-indigo-700">
                NEXT →
              </Button>
            ) : (
              <Button
                onClick={onStartExam}
                disabled={!hasAgreed}
                className="px-6 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                I AM READY TO BEGIN →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}