import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ConsentProvider } from '@/context/ConsentContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

const HomePage = lazyWithRetry(() => import('@/pages/HomePage'));
const TripsPage = lazyWithRetry(() => import('@/pages/TripsPage'));
const TripDetailsPage = lazyWithRetry(() => import('@/pages/TripDetailsPage'));
const AgenciesPage = lazyWithRetry(() => import('@/pages/AgenciesPage'));
const GuidesPage = lazyWithRetry(() => import('@/pages/GuidesPage'));
const AgencyMicrositePage = lazyWithRetry(() => import('@/pages/AgencyMicrositePage'));
const DashboardPage = lazyWithRetry(() => import('@/pages/dashboard/DashboardPage'));
const NotFoundPage = lazyWithRetry(() => import('@/pages/NotFoundPage'));

const AboutPage = lazyWithRetry(() =>
  import('@/pages/InstitutionalPage').then((m) => ({ default: m.AboutPage }))
);
const ContactPage = lazyWithRetry(() =>
  import('@/pages/InstitutionalPage').then((m) => ({ default: m.ContactPage }))
);
const TermsPage = lazyWithRetry(() =>
  import('@/pages/InstitutionalPage').then((m) => ({ default: m.TermsPage }))
);
const PrivacyPage = lazyWithRetry(() =>
  import('@/pages/InstitutionalPage').then((m) => ({ default: m.PrivacyPage }))
);
const CookiePolicyPage = lazyWithRetry(() =>
  import('@/pages/InstitutionalPage').then((m) => ({ default: m.CookiePolicyPage }))
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
          <ConsentProvider>
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
                    <Route path="termos" element={<TermsPage />} />
                    <Route path="privacy" element={<PrivacyPage />} />
                    <Route path="politica-de-privacidade" element={<PrivacyPage />} />
                    <Route path="cookies" element={<CookiePolicyPage />} />
                    <Route path="politica-de-cookies" element={<CookiePolicyPage />} />
                    <Route
                      path="minha-privacidade"
                      element={<Navigate to="/dashboard?mode=privacy" replace />}
                    />
                    <Route
                      path="privacy-settings"
                      element={<Navigate to="/dashboard?mode=privacy" replace />}
                    />

                    {/* Authentication and Registration Routes */}
                    <Route path="signup" element={<Navigate to="/?auth=signup" replace />} />
                    <Route path="cadastro" element={<Navigate to="/?auth=signup" replace />} />
                    <Route path="cadastrar" element={<Navigate to="/?auth=signup" replace />} />
                    <Route path="criar-conta" element={<Navigate to="/?auth=signup" replace />} />
                    <Route path="registro" element={<Navigate to="/?auth=signup" replace />} />
                    <Route path="register" element={<Navigate to="/?auth=signup" replace />} />
                    <Route path="cadastro/*" element={<Navigate to="/?auth=signup" replace />} />
                    <Route path="criar-conta/*" element={<Navigate to="/?auth=signup" replace />} />

                    <Route path="login" element={<Navigate to="/?auth=login" replace />} />
                    <Route path="entrar" element={<Navigate to="/?auth=login" replace />} />
                    <Route path="auth" element={<Navigate to="/?auth=login" replace />} />
                    <Route path="auth/signup" element={<Navigate to="/?auth=signup" replace />} />
                    <Route path="auth/register" element={<Navigate to="/?auth=signup" replace />} />
                    <Route path="auth/cadastro" element={<Navigate to="/?auth=signup" replace />} />
                    <Route path="auth/login" element={<Navigate to="/?auth=login" replace />} />
                    <Route path="auth/entrar" element={<Navigate to="/?auth=login" replace />} />
                    <Route path="auth/*" element={<Navigate to="/?auth=login" replace />} />

                    <Route
                      path="dashboard/signup"
                      element={<Navigate to="/dashboard?auth=signup" replace />}
                    />
                    <Route
                      path="dashboard/cadastro"
                      element={<Navigate to="/dashboard?auth=signup" replace />}
                    />
                    <Route
                      path="dashboard/register"
                      element={<Navigate to="/dashboard?auth=signup" replace />}
                    />
                    <Route
                      path="dashboard/login"
                      element={<Navigate to="/dashboard?auth=login" replace />}
                    />
                    <Route
                      path="dashboard/entrar"
                      element={<Navigate to="/dashboard?auth=login" replace />}
                    />

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
          </ConsentProvider>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  );
};

export default App;
