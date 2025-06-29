"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Stethoscope, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react"
import { getMedicalLabResults } from "@/lib/database"

interface LabResult {
  "Test Name": string
  Result: number
  Unit: string
  "Reference Range": string
  Flag: string
}

export function MedicalLabResults() {
  const [data, setData] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const labData = await getMedicalLabResults()
      setData(labData)
    } catch (error) {
      console.error("Error fetching lab results:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getFlagColor = (flag: string) => {
    switch (flag?.toLowerCase()) {
      case "high":
      case "h":
        return "destructive"
      case "low":
      case "l":
        return "secondary"
      case "critical":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getFlagIcon = (flag: string) => {
    switch (flag?.toLowerCase()) {
      case "high":
      case "h":
      case "critical":
        return <AlertTriangle className="w-4 h-4" />
      case "low":
      case "l":
        return <TrendingUp className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const abnormalResults = data.filter((result) => result.Flag && result.Flag.toLowerCase() !== "normal")
  const normalResults = data.filter((result) => !result.Flag || result.Flag.toLowerCase() === "normal")

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Lab results available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Normal Results</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{normalResults.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Within reference range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abnormal Results</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{abnormalResults.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Outside reference range</p>
          </CardContent>
        </Card>
      </div>

      {/* Abnormal Results Alert */}
      {abnormalResults.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {abnormalResults.length} test result(s) outside the normal range. Please consult with your
            healthcare provider to discuss these findings.
          </AlertDescription>
        </Alert>
      )}

      {/* Lab Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Results</CardTitle>
          <CardDescription>Your latest medical test results</CardDescription>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No lab results available</p>
              <p className="text-sm">Upload your lab results to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      {getFlagIcon(result.Flag)}
                    </div>
                    <div>
                      <p className="font-medium">{result["Test Name"]}</p>
                      <p className="text-sm text-muted-foreground">Reference: {result["Reference Range"]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-lg font-semibold">
                          {result.Result} {result.Unit}
                        </p>
                      </div>
                      {result.Flag && <Badge variant={getFlagColor(result.Flag)}>{result.Flag.toUpperCase()}</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
