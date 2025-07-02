"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, CheckCircle, AlertCircle } from "lucide-react"

interface WhoopConnectProps {
  onConnect?: () => void
}

export function WhoopConnect({ onConnect }: WhoopConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      // Try to fetch some Whoop data to check if connected
      const response = await fetch('/api/whoop/recovery?limit=1')
      if (response.ok) {
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      // Network error or connection refused - Whoop not connected
      console.log('Whoop connection check failed:', error.message)
      setIsConnected(false)
    } finally {
      setIsChecking(false)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // Redirect to Whoop OAuth
      window.location.href = '/api/auth/whoop'
    } catch (error) {
      console.error('Failed to connect to Whoop:', error)
      setIsConnecting(false)
    }
  }

  if (isChecking) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm text-muted-foreground">Checking Whoop connection...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleDisconnect = async () => {
    try {
      // Clear the cookies by making a request to a logout endpoint
      const response = await fetch('/api/auth/whoop/disconnect', { method: 'POST' })
      if (response.ok) {
        setIsConnected(false)
        window.location.reload() // Refresh to clear any cached data
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  if (isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-red-500" />
            Whoop Integration
          </CardTitle>
          <CardDescription>
            Your Whoop device is connected and syncing data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="outline" className="text-green-700 border-green-300">
                Connected
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={checkConnectionStatus}>
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Real-time recovery, sleep, and workout data from your Whoop device
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-red-500" />
          Connect Whoop
        </CardTitle>
        <CardDescription>
          Sync your recovery, sleep, and workout data from Whoop
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <Badge variant="outline" className="text-yellow-700 border-yellow-300">
            Not Connected
          </Badge>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Connect your Whoop device to get:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Real-time recovery scores</li>
            <li>Detailed sleep analysis</li>
            <li>Workout strain tracking</li>
            <li>Heart rate variability data</li>
          </ul>
        </div>

        <Button 
          onClick={handleConnect} 
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? 'Connecting...' : 'Connect Whoop'}
        </Button>
      </CardContent>
    </Card>
  )
}