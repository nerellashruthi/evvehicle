import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from '@/context/AppContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { UserLayout } from '@/components/layout/UserLayout';
import { StationOwnerLayout } from '@/components/layout/StationOwnerLayout';
import { RoleProtectedRoute } from '@/components/layout/RoleProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { StationsPage } from '@/pages/StationsPage';
import { StationDetailsPage } from '@/pages/StationDetailsPage';
import { ReservationPage } from '@/pages/ReservationPage';
import { TripPlannerPage } from '@/pages/TripPlannerPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { PaymentPage } from '@/pages/PaymentPage';
import { MyBookingsPage } from '@/pages/MyBookingsPage';
import { AIAgentPage } from '@/pages/AIAgentPage';
import { SupportPage } from '@/pages/SupportPage';
import { StationOwnerDashboardPage } from '@/pages/StationOwnerDashboardPage';
import { StationOwnerRegisterPage } from '@/pages/StationOwnerRegisterPage';

function PageRouter() {
  const { page } = useApp();

  const renderRoute = () => {
    switch (page) {
      // ── PUBLIC ROUTES ──────────────────────────────────────────────────────────
      case 'home':
        return (
          <UserLayout>
            <LandingPage />
          </UserLayout>
        );

      case 'login':
        return <LoginPage />;

      case 'station-owner-register':
        return <StationOwnerRegisterPage />;

      case 'how-it-works':
        return (
          <UserLayout>
            <HowItWorksPage />
          </UserLayout>
        );

      // ── EV USER ROUTES (Dedicated UserLayout) ──────────────────────────────────
      case 'dashboard':
        return (
          <RoleProtectedRoute allowedRoles={['USER', 'ADMIN']}>
            <UserLayout>
              <DashboardPage />
            </UserLayout>
          </RoleProtectedRoute>
        );

      case 'stations':
        return (
          <UserLayout>
            <StationsPage />
          </UserLayout>
        );

      case 'station-details':
        return (
          <UserLayout>
            <StationDetailsPage />
          </UserLayout>
        );

      case 'reserve':
        return (
          <UserLayout>
            <ReservationPage />
          </UserLayout>
        );

      case 'payment':
        return (
          <UserLayout>
            <PaymentPage />
          </UserLayout>
        );

      case 'trip-planner':
        return (
          <UserLayout>
            <TripPlannerPage />
          </UserLayout>
        );

      case 'my-bookings':
        return (
          <UserLayout>
            <MyBookingsPage />
          </UserLayout>
        );

      case 'ai-agent':
        return (
          <UserLayout>
            <AIAgentPage />
          </UserLayout>
        );

      case 'support':
        return (
          <UserLayout>
            <SupportPage />
          </UserLayout>
        );

      // ── STATION OWNER ROUTES (Dedicated StationOwnerLayout) ────────────────────
      case 'station-owner-dashboard':
      case 'station-owner-stations':
      case 'station-owner-chargers':
      case 'station-owner-bookings':
      case 'station-owner-payments':
      case 'station-owner-refunds':
      case 'station-owner-tickets':
      case 'station-owner-analytics':
      case 'station-owner-ai-insights':
      case 'station-owner-settings':
        return (
          <RoleProtectedRoute allowedRoles={['STATION_OWNER']}>
            <StationOwnerLayout>
              <StationOwnerDashboardPage />
            </StationOwnerLayout>
          </RoleProtectedRoute>
        );

      default:
        return (
          <UserLayout>
            <LandingPage />
          </UserLayout>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={page}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {renderRoute()}
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <PageRouter />
      </ErrorBoundary>
    </AppProvider>
  );
}

export default App;

