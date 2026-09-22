import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LandingPage } from '@/pages/LandingPage';
import { StationsPage } from '@/pages/StationsPage';
import { StationDetailsPage } from '@/pages/StationDetailsPage';
import { ReservationPage } from '@/pages/ReservationPage';
import { TripPlannerPage } from '@/pages/TripPlannerPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';

function PageRouter() {
  const { page } = useApp();

  const renderPage = () => {
    switch (page) {
      case 'home': return <LandingPage />;
      case 'stations': return <StationsPage />;
      case 'station-details': return <StationDetailsPage />;
      case 'reserve': return <ReservationPage />;
      case 'trip-planner': return <TripPlannerPage />;
      case 'how-it-works': return <HowItWorksPage />;
      case 'dashboard': return <DashboardPage />;
      case 'login': return <LoginPage />;
      default: return <LandingPage />;
    }
  };

  const showFooter = page !== 'login';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <PageRouter />
    </AppProvider>
  );
}

export default App;
