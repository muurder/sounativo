import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';

const HomePage = lazy(() => import('@/pages/HomePage'));
const TripsPage = lazy(() => import('@/pages/TripsPage'));
const TripDetailsPage = lazy(() => import('@/pages/TripDetailsPage'));
const AgenciesPage = lazy(() => import('@/pages/AgenciesPage'));
const GuidesPage = lazy(() => import('@/pages/GuidesPage'));
const AgencyMicrositePage = lazy(() => import('@/pages/AgencyMicrositePage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const AboutPage = lazy(() =>
  import('@/pages/InstitutionalPage').then((m) => ({ default: m.AboutPage }))
);
const ContactPage = lazy(() =>
  import('@/pages/InstitutionalPage').then((m) => ({ default: m.ContactPage }))
);
const TermsPage = lazy(() =>
  import('@/pages/InstitutionalPage').then((m) => ({ default: m.TermsPage }))
);
const PrivacyPage = lazy(() =>
  import('@/pages/InstitutionalPage').then((m) => ({ default: m.PrivacyPage }))
);

const PageLoader: React.FC = () => (
  <div className="flex min-h-[55vh] items-center justify-center">
    <div
      className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500"
      role="status"
      aria-label="Carregando página"
    />
  </div>
);

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="trips" element={<TripsPage />} />
                  <Route path="trips/:slug" element={<TripDetailsPage />} />
                  <Route path="viagem/:slug" element={<TripDetailsPage />} />
                  <Route path="agencies" element={<AgenciesPage />} />
                  <Route path="guides" element={<GuidesPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />

                  <Route path="about" element={<AboutPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="terms" element={<TermsPage />} />
                  <Route path="privacy" element={<PrivacyPage />} />

                  {/* Legacy route redirects */}
                  <Route path="client/*" element={<Navigate to="/dashboard" replace />} />
                  <Route path="agency/*" element={<Navigate to="/dashboard" replace />} />
                  <Route path="guide/*" element={<Navigate to="/dashboard" replace />} />
                  <Route path="admin/*" element={<Navigate to="/dashboard" replace />} />
                  <Route path="settings" element={<Navigate to="/dashboard" replace />} />

                  {/* Whitelabel agency microsite */}
                  <Route path=":agencySlug" element={<AgencyMicrositePage />} />
                  <Route path=":agencySlug/viagem/:tripSlug" element={<TripDetailsPage />} />

                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  );
};

export default App;
