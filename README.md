# SouNativo — Marketplace de Experiências Autênticas do Brasil

> Conectando viajantes a agências verificadas, guias credenciados (Cadastur) e roteiros autorais pela natureza e cultura brasileira.

---

## Identidade Visual

- **Verde Floresta (Primária):** `#0F4C3A`
- **Terracota (Secundária / Acento):** `#C66B3D` (`#9E5631` para textos/botões com contraste WCAG AA)
- **Stone Premium (Canvas):** `#FAFAF9`
- **Tipografia:** `Playfair Display` (títulos editoriais) + `Inter` (interface e leitura)

---

## Arquitetura Modular (`src/`)

```plaintext
src/
├── __tests__/           # Suíte unitária Vitest (filtros, slugs, formatação, permissões, Auth/WhatsApp)
├── components/
│   ├── auth/            # AuthModal, AuthRoleSelector, AuthEmailForm, PasswordResetForm
│   ├── feedback/        # ErrorBoundary
│   ├── institutional/   # ContactForm
│   ├── landing/         # HeroSection, HeroSearchBar, BiomesDiscoverySection, UpcomingTripsSection, InterestFilterBar, HowItWorksSection, WhySouNativoSection, ReviewsShowcaseSection, GroupQuoteSection, GuidesHighlightSection, FaqSection, CtaBannerSection
│   ├── layout/          # AppLayout, Navbar, MobileDrawer, BottomNav, Footer
│   ├── trips/           # TripCard, TripGrid, TripGallery, TripHeader, TripItinerarySection, TripReviewsSection, BookingCard, StickyTripBar, GuestCounterRow, CompanionFields
│   └── ui/              # Logo, Button, Badge, Tooltip, Modal, Skeleton, EmptyState, GoogleSignInButton, SafeImage
├── context/             # AuthContext, ThemeContext, ToastContext
├── data/                # Catálogo curado modular (seedAgencies, seedTripsNorthEast, seedTripsSouthCenter, seedReviews)
├── hooks/               # useAuth, useUserProfile, useTrips, useTripDetails, useBookings, useAgencies, useAgencyMicrosite, usePlanPermissions, useDebounce
├── pages/               # HomePage, TripsPage, TripDetailsPage, AgenciesPage, GuidesPage, AgencyMicrositePage, InstitutionalPage, NotFoundPage
│   └── dashboard/       # DashboardPage, ClientDashboardView, ClientBookingsTab, BookingVoucherModal, ClientProfileForm, PartnerDashboardView, PartnerOnboardingForm, PartnerTripsSection, PartnerBookingsSection, PartnerThemeBuilder, PartnerProfileForm, PartnerGuideFields, PartnerPlansSection, TripCreateModal, TripFormFields, AdminDashboardView, AdminCatalogSection
├── services/            # firebase.config.ts, firebase.ts, authService.ts, userService.ts, tripService.ts, agencyService.ts, bookingService.ts, reviewService.ts, adminService.ts, seedCatalog.ts
├── types/               # Modelos TypeScript estritos (user, agency, trip, booking)
└── utils/               # constants, formatters, slugUtils, dailyHeroImage, whatsapp, colorExtractor, tripFilters, planPermissions, cn
```

---

## Esquema Cloud Firestore & Segurança

Regras configuradas em [`firestore.rules`](./firestore.rules) e índices em [`firestore.indexes.json`](./firestore.indexes.json):

| Coleção | Chave | Propósito |
|---|---|---|
| `users/{uid}` | `uid` (Firebase Auth) | Perfil privado do usuário (`role`, `favorites`, `phone`, `cpf`, `agencyId`) |
| `agencies/{agencyId}` | `agencyId` | Microsites públicos (`/:agencySlug`), planos (`STARTER`, `BASIC`, `PREMIUM`), guia Cadastur e tema |
| `trips/{tripId}` | `tripId` | Catálogo de pacotes ativos, itinerário, inclusos e faixa etária |
| `bookings/{bookingId}` | `bookingId` | Solicitações e confirmações de reserva entre viajante e agência |
| `reviews/{reviewId}` | `reviewId` | Avaliações autenticadas de pacotes e agências |

---

## Configuração Local

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis Firebase:**
   Copie `.env.example` para `.env.local` e preencha as credenciais Web do seu projeto no Firebase Console:
   ```bash
   cp .env.example .env.local
   ```
   No Firebase Console:
   - Ative **Authentication → Sign-in method → Google** e **E-mail/senha**.
   - Em **Authentication → Settings → Authorized domains**, garanta `localhost` e o domínio da Vercel (ex: `sounativo.vercel.app`).
   - Crie o banco **Cloud Firestore** e faça deploy das regras:
     ```bash
     npx firebase-tools deploy --only firestore
     ```

3. **Executar em desenvolvimento:**
   ```bash
   npm run dev
   ```

---

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor local Vite com HMR (porta `3000`) |
| `npm run typecheck` | Verificação estrita TypeScript (`tsc --noEmit`) |
| `npm run lint` | Análise ESLint + Regras React Hooks + Acessibilidade `jsx-a11y` |
| `npm test` | Execução dos testes unitários com Vitest |
| `npm run format` | Formatação Prettier em `src/` |
| `npm run build` | Typecheck + Build de produção + geração do Service Worker PWA em `dist/` |
| `npm run preview` | Preview local do build final |

---

## Deploy (Vercel & Firebase Hosting)

### Vercel (Conectado ao GitHub `muurder/sounativo`)
- O arquivo [`vercel.json`](./vercel.json) está configurado para `framework: "vite"`, saída `dist/`, rewrites SPA (`/(.*) -> /index.html` para `BrowserRouter`) e headers para `sw.js`.
- Adicione as variáveis `VITE_FIREBASE_*` em **Vercel → Project Settings → Environment Variables** antes do próximo deploy.

### Firebase Hosting (Alternativo)
- [`firebase.json`](./firebase.json) aponta `public: "dist"` com rewrite SPA `** -> /index.html`:
  ```bash
  npm run build && npx firebase-tools deploy
  ```
