import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Clock } from 'lucide-react'
import { DockEvent } from '../types'
import { useSocket } from '../hooks/useSocket'

export default function SignalPage() {
  const [events, setEvents] = useState<DockEvent[]>([])
  const { socket, isConnected } = useSocket()

  // 이미 처리된 이벤트 ID들을 추적하여 중복 방지
  const processedEventIds = useRef<Set<string>>(new Set())

  // 초기 데이터 로드 및 동기화
  useEffect(() => {
    if (!socket || !isConnected) return

    // 서버에 동기화 요청
    socket.emit('client:sync', { limit: 50 })

    const handleSyncResult = (payload: any) => {
      const sortedEvents = payload.events.sort((a: DockEvent, b: DockEvent) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })
      setEvents(sortedEvents)
    }

    socket.on('server:sync_result', handleSyncResult)

    return () => {
      socket.off('server:sync_result', handleSyncResult)
    }
  }, [socket, isConnected])

  // 실시간 이벤트 리스너
  useEffect(() => {
    if (!socket) return

    const handleEventCreated = (payload: any) => {
      const eventId = payload.event.id

      // 이미 처리된 이벤트인지 확인 (중복 방지)
      if (processedEventIds.current.has(eventId)) {
        return
      }

      // 새로운 이벤트면 처리 목록에 추가
      processedEventIds.current.add(eventId)

      const newEvent = payload.event
      setEvents(prev => [newEvent, ...prev])
    }

    const handleEventAcked = (payload: any) => {
      const eventId = payload.eventId

      // 이미 처리된 이벤트인지 확인 (중복 방지)
      if (processedEventIds.current.has(`acked-${eventId}`)) {
        return
      }

      // 새로운 이벤트면 처리 목록에 추가
      processedEventIds.current.add(`acked-${eventId}`)

      setEvents(prev =>
        prev.map(event =>
          event.id === eventId
            ? { ...event, status: 'acked', ackedAt: payload.ackedAt }
            : event
        )
      )
    }

    socket.on('server:dock_event_created', handleEventCreated)
    socket.on('server:event_acked', handleEventAcked)

    return () => {
      socket.off('server:dock_event_created', handleEventCreated)
      socket.off('server:event_acked', handleEventAcked)
    }
  }, [socket])

  const handleAckEvent = (eventId: string) => {
    if (!socket || !isConnected) return

    const clientRequestId = `${Date.now()}-${Math.random()}`
    socket.emit('client:ack_event', {
      eventId,
      clientRequestId
    })
  }

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return '시간 정보 없음'

    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '시간 정보 없음'

    return date.toLocaleString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const unackedEvents = events.filter(event => event.status === 'sent')
  const ackedEvents = events.filter(event => event.status === 'acked')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">신호수 페이지</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600">
                {isConnected ? '연결됨' : '연결 끊어짐'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* 미확인 알림 리스트 */}
        {unackedEvents.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">미확인 알림</h2>
            <div className="space-y-3">
              {unackedEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer active:bg-gray-50 transition-colors min-h-[80px] flex items-center"
                  onClick={() => handleAckEvent(event.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          도크 {event.dockNo} 작업 완료
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(event.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full ml-2 flex-shrink-0">
                      탭하여 확인
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 확인된 알림 리스트 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            알림 히스토리 ({ackedEvents.length}개 확인됨)
          </h2>
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="max-h-80 overflow-y-auto">
              {ackedEvents.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  아직 확인된 알림이 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {ackedEvents.map((event) => (
                    <div key={event.id} className="p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            도크 {event.dockNo} 작업 완료
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            전송: {formatTime(event.createdAt)}
                            {event.ackedAt && ` • 확인: ${formatTime(event.ackedAt)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}