import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import SignalPage from './pages/SignalPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/signal" element={<SignalPage />} />
          <Route path="/" element={
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="w-full max-w-md text-center">
                <h1 className="text-xl font-bold text-gray-900 mb-6">
                  Job Done
                </h1>
                <p className="text-sm text-gray-600 mb-8">
                  도크 작업 완료 알림 시스템
                </p>
                <div className="space-y-3">
                  <a href="/admin" className="btn-primary block w-full py-3 text-center">
                    관리자 페이지
                  </a>
                  <a href="/signal" className="btn-secondary block w-full py-3 text-center">
                    신호수 페이지
                  </a>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App