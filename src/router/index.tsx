import { lazy, Suspense } from 'react'
import { useRoutes, Navigate } from 'react-router-dom'
import { ERouterName } from '@/types'

const LoginPage = lazy(() => import('@/pages/page-web/LoginPage'))
const HomePage = lazy(() => import('@/pages/page-web/HomePage'))
const WorkspacePage = lazy(() => import('@/pages/page-web/projects/WorkspacePage'))

const MembersPage = lazy(() => import('@/pages/page-web/projects/MembersPage'))
const DevicesPage = lazy(() => import('@/pages/page-web/projects/DevicesPage'))
const FirmwaresPage = lazy(() => import('@/pages/page-web/projects/FirmwaresPage'))

const TsaPage = lazy(() => import('@/pages/page-web/projects/TsaPage'))
const LivestreamPage = lazy(() => import('@/pages/page-web/projects/LivestreamPage'))
const LayerPage = lazy(() => import('@/pages/page-web/projects/LayerPage'))
const MediaPage = lazy(() => import('@/pages/page-web/projects/MediaPage'))
const WaylinePage = lazy(() => import('@/pages/page-web/projects/WaylinePage'))
const TaskPage = lazy(() => import('@/pages/page-web/projects/TaskPage'))
const FlightAreaPage = lazy(() => import('@/pages/page-web/projects/FlightAreaPage'))
const CreatePlan = lazy(() => import('@/components/task/CreatePlan'))

const PilotLoginPage = lazy(() => import('@/pages/page-pilot/PilotLoginPage'))
const PilotHomePage = lazy(() => import('@/pages/page-pilot/PilotHomePage'))
const PilotMediaPage = lazy(() => import('@/pages/page-pilot/PilotMediaPage'))
const PilotLivesharePage = lazy(() => import('@/pages/page-pilot/PilotLivesharePage'))
const PilotBindPage = lazy(() => import('@/pages/page-pilot/PilotBindPage'))

function AppRoutes() {
  const routes = useRoutes([
    {
      path: '/',
      element: <Navigate to={'/' + ERouterName.PROJECT} replace />,
    },
    {
      path: '/' + ERouterName.PROJECT,
      element: <LoginPage />,
    },
    {
      path: '/' + ERouterName.HOME,
      element: <HomePage />,
      children: [
        {
          path: ERouterName.MEMBERS,
          element: <MembersPage />,
        },
        {
          path: ERouterName.DEVICES,
          element: <DevicesPage />,
        },
        {
          path: ERouterName.FIRMWARES,
          element: <FirmwaresPage />,
        },
      ],
    },
    {
      path: '/' + ERouterName.WORKSPACE,
      element: <WorkspacePage />,
      children: [
        {
          index: true,
          element: <Navigate to={ERouterName.TSA} replace />,
        },
        {
          path: ERouterName.TSA,
          element: <TsaPage />,
        },
        {
          path: ERouterName.LIVESTREAM,
          element: <LivestreamPage />,
        },
        {
          path: ERouterName.LAYER,
          element: <LayerPage />,
        },
        {
          path: ERouterName.MEDIA,
          element: <MediaPage />,
        },
        {
          path: ERouterName.WAYLINE,
          element: <WaylinePage />,
        },
        {
          path: ERouterName.TASK,
          element: <TaskPage />,
          children: [
            {
              path: ERouterName.CREATE_PLAN,
              element: <CreatePlan />,
            },
          ],
        },
        {
          path: ERouterName.FLIGHT_AREA,
          element: <FlightAreaPage />,
        },
      ],
    },
    // Pilot routes
    {
      path: '/' + ERouterName.PILOT,
      element: <PilotLoginPage />,
    },
    {
      path: '/' + ERouterName.PILOT_HOME,
      element: <PilotHomePage />,
    },
    {
      path: '/' + ERouterName.PILOT_MEDIA,
      element: <PilotMediaPage />,
    },
    {
      path: '/' + ERouterName.PILOT_LIVESHARE,
      element: <PilotLivesharePage />,
    },
    {
      path: '/' + ERouterName.PILOT_BIND,
      element: <PilotBindPage />,
    },
  ])

  return <Suspense fallback={<div>Loading...</div>}>{routes}</Suspense>
}

export default AppRoutes
