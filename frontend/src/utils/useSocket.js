import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function useSocket() {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [executionUpdates, setExecutionUpdates] = useState([])
  const listenersRef = useRef({})

  useEffect(() => {
    const token = localStorage.getItem('token')
    const socket = io(BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))

    // Execution real-time events
    socket.on('execution:started', (data) => {
      setExecutionUpdates(prev => [{ type: 'started', ...data, ts: Date.now() }, ...prev.slice(0, 49)])
      listenersRef.current['execution:started']?.(data)
    })

    socket.on('execution:step', (data) => {
      setExecutionUpdates(prev => [{ type: 'step', ...data, ts: Date.now() }, ...prev.slice(0, 49)])
      listenersRef.current['execution:step']?.(data)
    })

    socket.on('execution:completed', (data) => {
      setExecutionUpdates(prev => [{ type: 'completed', ...data, ts: Date.now() }, ...prev.slice(0, 49)])
      listenersRef.current['execution:completed']?.(data)
    })

    socket.on('execution:failed', (data) => {
      setExecutionUpdates(prev => [{ type: 'failed', ...data, ts: Date.now() }, ...prev.slice(0, 49)])
      listenersRef.current['execution:failed']?.(data)
    })

    socket.on('execution:update', (data) => {
      setExecutionUpdates(prev => [{ type: 'update', ...data, ts: Date.now() }, ...prev.slice(0, 49)])
      listenersRef.current['execution:update']?.(data)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const on = useCallback((event, handler) => {
    listenersRef.current[event] = handler
  }, [])

  const off = useCallback((event) => {
    delete listenersRef.current[event]
  }, [])

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data)
  }, [])

  const joinExecution = useCallback((executionId) => {
    socketRef.current?.emit('join:execution', { executionId })
  }, [])

  const leaveExecution = useCallback((executionId) => {
    socketRef.current?.emit('leave:execution', { executionId })
  }, [])

  return { connected, executionUpdates, on, off, emit, joinExecution, leaveExecution }
}