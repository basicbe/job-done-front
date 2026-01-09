import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Clock } from 'lucide-react'
import { DockSet, DockEvent } from '../types'
import { useSocket } from '../hooks/useSocket'
import { useSupabase } from '../hooks/useSupabase'

const DOCK_SETS: DockSet[] = [
  { id: 1, name: '1번 대형 (32~41)', dockFrom: 32, dockTo: 41 },
  { id: 2, name: '2번 대형 (22~31)', dockFrom: 22, dockTo: 31 }
]

// 각 대형에서 제외할 도크 번호들
const EXCLUDED_DOCKS: Record<number, number[]> = {
  1: [39], // 1번 대형에서 39번 제외
  2: [27]  // 2번 대형에서 27번 제외
}

export default function AdminPage() {
  const [selectedDockSet, setSelectedDockSet] = useState<DockSet>(DOCK_SETS[0])
  const [recentEvents, setRecentEvents] = useState<DockEvent[]>([])
  const { socket, isConnected } = useSocket()
  const { supabase } = useSupabase()

  // 이미 처리된 이벤트 ID들을 추적하여 중복 방지
  const processedEventIds = useRef<Set<string>>(new Set())


  // 최근 이벤트 로드
  useEffect(() => {
    loadRecentEvents()
  }, [])

  // Socket.IO 이벤트 리스너
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

      setRecentEvents(prev => {
        const newEvent = payload.event

        // 임시 이벤트를 실제 이벤트로 교체하는 로직
        const tempEventIndex = prev.findIndex(event =>
          event.id.startsWith(`temp-${newEvent.dockSetId}-${newEvent.dockNo}-`) &&
          event.dockNo === newEvent.dockNo &&
          event.dockSetId === newEvent.dockSetId &&
          event.createdAt && newEvent.createdAt &&
          // 시간 차이가 10초 이내인 경우 (임시 이벤트 교체)
          Math.abs(new Date(event.createdAt).getTime() - new Date(newEvent.createdAt).getTime()) < 10000
        )

        if (tempEventIndex !== -1) {
          // 임시 이벤트를 실제 이벤트로 교체
          const newEvents = [...prev]
          newEvents[tempEventIndex] = newEvent
          return newEvents
        } else {
          // 새로운 이벤트 추가
          return [newEvent, ...prev.slice(0, 19)]
        }
      })
    }

    const handleEventAcked = (payload: any) => {
      const eventId = payload.eventId

      // 이미 처리된 이벤트인지 확인 (중복 방지)
      if (processedEventIds.current.has(`acked-${eventId}`)) {
        return
      }

      // 새로운 이벤트면 처리 목록에 추가
      processedEventIds.current.add(`acked-${eventId}`)

      setRecentEvents(prev =>
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

  const loadRecentEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('dock_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // DB 필드명을 프론트엔드 필드명으로 변환
      const events = (data || []).map(event => ({
        id: event.id,
        dockSetId: event.dock_set_id,
        dockNo: event.dock_no,
        status: event.status as 'sent' | 'acked',
        createdAt: event.created_at,
        ackedAt: event.acked_at
      }))

      console.log('Loaded and transformed events:', events)
      setRecentEvents(events)
    } catch (error) {
      console.error('Failed to load recent events:', error)
      // 에러 시 빈 배열로 초기화
      setRecentEvents([])
    }
  }

  const handleDockClick = (dockNo: number) => {
    if (!socket || !isConnected) {
      alert('서버에 연결되지 않았습니다.')
      return
    }

    const timestamp = Date.now()
    const clientRequestId = `${timestamp}-${Math.random()}`
    socket.emit('client:dock_done', {
      dockSetId: selectedDockSet.id,
      dockNo,
      clientRequestId
    })

    // 즉시 UI에 추가 (서버 응답 대기) - 더 정확한 ID 사용
    const tempEvent: DockEvent = {
      id: `temp-${selectedDockSet.id}-${dockNo}-${timestamp}`,
      dockSetId: selectedDockSet.id,
      dockNo,
      status: 'sent',
      createdAt: new Date().toISOString(),
      ackedAt: null
    }
    setRecentEvents(prev => [tempEvent, ...prev.slice(0, 19)])
  }

  const generateDockButtons = () => {
    const buttons = []
    const excludedDocks = EXCLUDED_DOCKS[selectedDockSet.id] || []

    for (let i = selectedDockSet.dockFrom; i <= selectedDockSet.dockTo; i++) {
      // 제외할 도크 번호인지 확인
      if (excludedDocks.includes(i)) {
        continue
      }

      buttons.push(
        <button
          key={i}
          onClick={() => handleDockClick(i)}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-6 px-4 rounded-lg text-base transition-colors disabled:opacity-50 min-h-[60px] flex items-center justify-center"
          disabled={!isConnected}
        >
          도크 {i}
        </button>
      )
    }
    return buttons
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">관리자 페이지</h1>
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
        {/* 대형 선택 */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">대형 선택</h2>
          <div className="flex gap-3">
            {DOCK_SETS.map((dockSet) => (
              <button
                key={dockSet.id}
                onClick={() => setSelectedDockSet(dockSet)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                  selectedDockSet.id === dockSet.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {dockSet.name}
              </button>
            ))}
          </div>
        </div>

        {/* 도크 버튼 그리드 */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            {selectedDockSet.name} - 작업 완료 버튼
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {generateDockButtons()}
          </div>
        </div>

        {/* 최근 로그 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">최근 전송 로그</h2>
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="max-h-80 overflow-y-auto">
              {recentEvents.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  아직 전송된 이벤트가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {event.status === 'acked' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            도크 {event.dockNo} 작업 완료
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            전송: {formatTime(event.createdAt)}
                            {event.ackedAt && ` • 확인: ${formatTime(event.ackedAt)}`}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ml-2 flex-shrink-0 ${
                        event.status === 'acked'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.status === 'acked' ? '확인됨' : '전송됨'}
                      </span>
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