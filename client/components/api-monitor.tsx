"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiClient, type ApiRequest, type ApiResponse, type ApiFilter } from "@/lib/api-client"
import { Filter, Trash2, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function ApiMonitor() {
  const [requests, setRequests] = useState<(ApiRequest & { response?: ApiResponse })[]>([])
  const [filter, setFilter] = useState<ApiFilter>({})
  const [urlFilter, setUrlFilter] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Listen for new API calls
    const unsubscribe = apiClient.addListener((request, response) => {
      setRequests((prev) => [...prev, { ...request, response }])
    })

    // Load existing requests
    setRequests(apiClient.getAllRequests())

    return unsubscribe
  }, [])

  const filteredRequests = requests.filter((req) => {
    if (urlFilter && !req.url.toLowerCase().includes(urlFilter.toLowerCase())) {
      return false
    }
    return true
  })

  const getStatusColor = (status?: number) => {
    if (!status) return "secondary"
    if (status >= 200 && status < 300) return "default"
    if (status >= 400 && status < 500) return "destructive"
    if (status >= 500) return "destructive"
    return "secondary"
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return "Streaming..."
    return `${duration}ms`
  }

  const getRequestType = (url: string) => {
    if (url.includes('/chat_stream/')) return 'Chat Stream'
    if (url.includes('/chat')) return 'Chat'
    if (url.includes('/api/')) return 'API'
    return 'Request'
  }

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search
    } catch {
      return url
    }
  }

  if (!isVisible) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="shadow-lg backdrop-blur-sm bg-background/80"
        >
          <Filter className="h-4 w-4 mr-2" />
          API Monitor
        </Button>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="w-96 h-96 flex flex-col shadow-xl backdrop-blur-sm bg-background/95">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between p-3 border-b"
          >
            <h3 className="font-semibold text-sm">API Monitor</h3>
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={() => {
                    apiClient.clearHistory()
                    setRequests([])
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button onClick={() => setIsVisible(false)} variant="ghost" size="icon" className="h-6 w-6">
                  ×
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 border-b"
          >
            <div className="flex gap-2">
              <Input
                placeholder="Filter by URL..."
                value={urlFilter}
                onChange={(e) => setUrlFilter(e.target.value)}
                className="h-8 text-xs"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Search className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>

          <ScrollArea className="flex-1 p-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <AnimatePresence>
                {filteredRequests.map((req, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="p-2 text-xs hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {req.method}
                          </Badge>
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {getRequestType(req.url)}
                          </Badge>
                          {req.response && (
                            <Badge variant={getStatusColor(req.response.status)} className="text-xs px-1 py-0">
                              {req.response.status}
                            </Badge>
                          )}
                        </div>
                        <span className="text-muted-foreground">{formatDuration(req.response?.duration)}</span>
                      </div>
                      <div className="text-muted-foreground truncate" title={req.url}>
                        {formatUrl(req.url)}
                      </div>
                      <div className="text-muted-foreground">{req.timestamp.toLocaleTimeString()}</div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredRequests.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground py-4"
                >
                  No API calls yet
                </motion.div>
              )}
            </motion.div>
          </ScrollArea>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
