// 도크 세트 타입
export interface DockSet {
  id: number
  name: string
  dockFrom: number
  dockTo: number
}

// 도크 이벤트 타입
export interface DockEvent {
  id: string
  dockSetId: number
  dockNo: number
  status: 'sent' | 'acked'
  createdAt: string | null
  ackedAt: string | null
}

// Socket.IO 이벤트 타입
export interface DockDonePayload {
  dockSetId: number
  dockNo: number
  clientRequestId: string
}

export interface AckEventPayload {
  eventId: string
  clientRequestId: string
}

export interface ServerEventCreatedPayload {
  event: DockEvent
}

export interface ServerEventAckedPayload {
  eventId: string
  status: 'acked'
  ackedAt: string
}

export interface SyncResultPayload {
  events: DockEvent[]
}

// 컴포넌트 props 타입
export interface AdminPageProps {}

export interface SignalPageProps {}

// 환경 변수 타입은 src/vite-env.d.ts에 정의됨