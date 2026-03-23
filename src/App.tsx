import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import { TripList } from './pages/TripList';
import TripDetails from './pages/TripDetails';
import { AgencyLayout } from './pages/agency/AgencyLayout';
import Settings from './pages/Settings';
import { About, Contact, Terms, Help, Privacy, Blog, Careers, Press } from './pages/StaticPages';
import { NotFound, Unauthorized, CheckoutSuccess, ForgotPassword } from './pages/UtilityPages';
import { AdminDashboard } from './pages/AdminDashboard';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

const AgencyList = lazy(() => import('./pages/AgencyList'));
const GuideList = lazy(() => import('./pages/GuideList'));
const AgencyProfile = lazy(() => import('./pages/AgencyProfile'));
const AgencyDashboard = lazy(() => import('./pages/AgencyDashboard'));
const AgencyLandingPage = lazy(() => import('./pages/AgencyLandingPage'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const ClientFeed = lazy(() => import('./pages/ClientFeed'));
const GuideDashboard = lazy(() => import('./pages/guide/GuideDashboard'));
const TestAccounts = lazy(() => import('./pages/TestAccounts'));
const HireGuides = lazy(() => import('./pages/agency/HireGuides'));

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeProvider>
          <DataProvider>
            <Router>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />

                    <Route path="trips" element={<TripList />} />
                    <Route path="viagem/:slug" element={<TripDetails />} />
                    <Route path="agencies" element={<AgencyList />} />
                    <Route path="guides" element={<GuideList />} />
                    <Route path="agency/:id" element={<AgencyProfile />} />
                    <Route path="settings" element={<Settings />} />

                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="terms" element={<Terms />} />
                    <Route path="privacy" element={<Privacy />} />
                    <Route path="help" element={<Help />} />
                    <Route path="blog" element={<Blog />} />
                    <Route path="careers" element={<Careers />} />
                    <Route path="press" element={<Press />} />

                    <Route path="checkout/success" element={<CheckoutSuccess />} />
                    <Route path="unauthorized" element={<Unauthorized />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    {import.meta.env.DEV && (
                      <Route path="test-accounts" element={<TestAccounts />} />
                    )}

                    <Route path="agency" element={<AgencyLayout />}>
                      <Route path="dashboard" element={<AgencyDashboard />} />
                      <Route path="guides" element={<HireGuides />} />
                    </Route>
                    <Route path="admin/dashboard" element={<AdminDashboard />} />
                    <Route path="client/feed" element={<ClientFeed />} />
                    <Route path="client/dashboard/:tab?" element={<ClientDashboard />} />
                    <Route path="guide/dashboard" element={<GuideDashboard />} />

                    <Route path=":agencySlug" element={<AgencyLandingPage />} />
                    <Route path=":agencySlug/trips" element={<TripList />} />
                    <Route path=":agencySlug/guides" element={<GuideList />} />
                    <Route path=":agencySlug/viagem/:tripSlug" element={<TripDetails />} />
                    <Route path=":agencySlug/checkout/success" element={<CheckoutSuccess />} />
                    <Route path=":agencySlug/client/:tab?" element={<ClientDashboard />} />

                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </Router>
          </DataProvider>
        </ThemeProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
