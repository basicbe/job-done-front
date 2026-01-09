import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // 환경 변수에서 Socket.IO 서버 URL을 가져옴
    const socketUrl = import.meta.env.VITE_SOCKET_IO_URL || 'http://localhost:3001'

    console.log('Connecting to Socket.IO server:', socketUrl)

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    })

    socketRef.current = newSocket

    // 연결 이벤트 리스너
    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error)
      setIsConnected(false)
    })

    // 에러 이벤트 리스너
    newSocket.on('server:error', (payload) => {
      console.error('Server error:', payload)
      alert(`서버 오류: ${payload.message}`)
    })

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      console.log('Disconnecting Socket.IO')
      newSocket.disconnect()
      socketRef.current = null
    }
  }, [])

  return {
    socket: socketRef.current,
    isConnected
  }
}