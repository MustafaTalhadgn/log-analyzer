import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../shared/layouts/MainLayout';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import RulesPage from '../features/rules/pages/RulesPage';
import AlertsPage from '../features/alerts/pages/AlertsPage';
// import LogsPage from '../features/logs/pages/LogsPage'; (Sonra yapacağız)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />, // Tüm sayfalar bu layout'un içinde açılacak
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'rules',
        element: <RulesPage />,
      },
      {
        path: 'alerts',
        element: <AlertsPage />,
      },
      // {
      //   path: 'logs',
      //   element: <LogsPage />,
      // },
    ],
  },
]);