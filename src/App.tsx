import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import JournalPage from './pages/JournalPage'
import SkeletonLoader from './components/SkeletonLoader'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<SkeletonLoader rows={5} />}>
              <DashboardPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
