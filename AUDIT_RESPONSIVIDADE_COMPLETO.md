# Auditoria Completa de Responsividade - SouNativo

**Data:** 22/03/2026  
**Versão:** 2.0  
**Escopo:** Mobile, Tablet e Desktop

---

## 📊 Resumo Executivo

| Categoria | Total | Críticos | Altos | Médios | Baixos |
|-----------|-------|----------|-------|--------|--------|
| Layout | 8 | 2 | 3 | 2 | 1 |
| Navegação | 5 | 1 | 2 | 1 | 1 |
| Páginas | 12 | 3 | 4 | 3 | 2 |
| Componentes | 10 | 2 | 4 | 3 | 1 |
| **TOTAL** | **35** | **8** | **13** | **9** | **5** |

---

## 🔴 CRÍTICOS - Corrigir Imediatamente

### 1. Layout.tsx - Hero Banner Altura Fixa
**Arquivo:** `src/components/Layout.tsx`  
**Linha:** 362  
**Severidade:** 🔴 Crítico

```tsx
// PROBLEMA: min-h-[600px] causa scroll em tablets pequenos
h-[85vh] min-h-[600px] md:min-h-[650px]

// CORREÇÃO:
h-[60vh] sm:h-[70vh] md:h-[80vh] min-h-[400px] lg:min-h-[600px]
```

**Impacto:** Usuários de tablets (768px-1024px) experimentam scroll desnecessário.

---

### 2. Layout.tsx - Navbar Sem Safe Area
**Arquivo:** `src/components/Layout.tsx`  
**Linha:** 418  
**Severidade:** 🔴 Crítico

```tsx
// PROBLEMA: Falta safe-area para iOS/Android
<nav className="... z-[60] ...">

// CORREÇÃO:
<nav className="... z-50 pt-[env(safe-area-inset-top)]">
```

**Impacto:** Navbar fica atrás do notch em iPhones notch/fullscreen.

---

### 3. Layout.tsx - Main Content Sem Padding Mobile
**Arquivo:** `src/components/Layout.tsx`  
**Linha:** 754  
**Severidade:** 🔴 Crítico

```tsx
// PROBLEMA: px-0 elimina padding em todas as telas
<main className="flex-grow w-full px-0 py-0">

// CORREÇÃO:
<main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-4">
```

**Impacto:** Conteúdo encostado nas bordas em mobile.

---

### 4. Sidebar.tsx - Sidebar Fixed Sem Mobile
**Arquivo:** `src/components/Sidebar.tsx`  
**Linha:** 35-40  
**Severidade:** 🔴 Crítico

```tsx
// PROBLEMA: Sidebar sempre fixed, não colapsa em mobile
<aside className="fixed left-0 top-0 h-screen ...">

// CORREÇÃO: O Sidebar do Admin já deveria usar MobileTabs
// Verificar se AgencyDashboard.tsx tem versão mobile
```

**Impacto:** Admin dashboard inacessível em mobile (sidebar cobre tudo).

---

### 5. TripList.tsx - Filtros Mobile Cortam Conteúdo
**Arquivo:** `src/pages/TripList.tsx`  
**Linha:** 420-425  
**Severidade:** 🔴 Crítico

```tsx
// PROBLEMA: Filtros fixed mas sem backdrop
fixed md:static inset-0 z-40 overflow-y-auto transition-transform

// CORREÇÃO:
fixed md:static inset-0 z-40 overflow-y-auto transition-transform
// Adicionar backdrop quando aberto
{showMobileFilters && (
  <div className="fixed inset-0 bg-black/50 z-[-1] md:hidden" />
)}
```

---

### 6. BottomNav.tsx - Falta Padding Bottom no Footer
**Arquivo:** `src/components/BottomNav.tsx`  
**Linha:** 46  
**Severidade:** 🔴 Crítico

```tsx
// PROBLEMA: Safe area duplicada ou ausente
pb-[env(safe-area-inset-bottom)]

// VERIFICAR: No Layout, main content compete com BottomNav
// Layout.tsx linha 350: pb-16 md:pb-0
// CORREÇÃO: Garantir que BottomNav.height + pb = correto
```

---

### 7. TripDetails.tsx - Booking Widget Não Responsivo
**Arquivo:** `src/pages/TripDetails.tsx`  
**Severidade:** 🔴 Crítico

```tsx
// PROBLEMA: BookingWidget é sidebar fixa, não funciona em mobile
// Solução: Criar versão mobile do widget ou FAB button
```

---

### 8. GuideList.tsx - Hero Height Fixo
**Arquivo:** `src/pages/GuideList.tsx`  
**Linha:** 75  
**Severidade:** 🔴 Crítico

```tsx
// PROBLEMA: h-[500px] muito alto para mobile
h-[500px]

// CORREÇÃO:
h-[300px] sm:h-[400px] md:h-[500px]
```

---

## 🟠 PROBLEMAS ALTOS - Corrigir em Breve

### 9. Layout.tsx - z-index Inconsistente
**Linha:** 418, 642, 645

```tsx
// PROBLEMA: z-[60] vs z-[100] vs z-[101]
// CORREÇÃO: Padronizar
Navbar: z-50
Mobile Drawer: z-50 (mesmo nível)
Modais: z-50
BottomNav: z-40
```

---

### 10. TripList.tsx - Grid de Cards Inconsistente
**Linha:** 644

```tsx
// PROBLEMA: 4 colunas em 2xl, pode overflow
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4

// CORREÇÃO:
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
// Ou limitar max-width do container
max-w-[1600px]
```

---

### 11. AgencyList.tsx - View Mode Toggle Mobile
**Linha:** 148-151

```tsx
// PROBLEMA: Botões de toggle muito pequenos em mobile
<button ... className="p-2 ...">

// CORREÇÃO:
<button ... className="p-2 sm:p-2.5 ...">
```

---

### 12. AgencyList.tsx - Card Grid Mobile
**Linha:** 189

```tsx
// PROBLEMA: 3 colunas em lg para grid mode
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

// CORREÇÃO: Garantir que funcione bem em tablets
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
```

---

### 13. AgencyDashboard.tsx - Mobile Tabs Verificação
**Arquivo:** `src/pages/AgencyDashboard.tsx`  
**Severidade:** 🟠 Alto

```tsx
// Verificar se DashboardMobileTabs está sendo usado corretamente
// Linha 35: import DashboardMobileTabs
// Verificar se tabs funcionam em mobile
```

---

### 14. GuideList.tsx - Cards Grid Responsivo
**Linha:** 153

```tsx
// PROBLEMA: justifyItems: 'start' pode causar desalinhamento
// CORREÇÃO:
grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
```

---

### 15. Home.tsx - Interest Chips Overflow
**Arquivo:** `src/pages/Home.tsx`  
**Linha:** 177

```tsx
// PROBLEMA: Chips podem overflow em telas pequenas
overflow-x-auto scrollbar-hide

// CORREÇÃO: Garantir que funcione com swipe
// snap-x snap-mandatory já ajuda, mas testar em SE/mini
```

---

### 16. HeroSearch.tsx - Date Picker Mobile
**Arquivo:** `src/components/HeroSearch.tsx`  
**Linha:** 763

```tsx
// PROBLEMA: max-h-[60vh] pode ser pequeno em landscape
max-h-[60vh] overflow-y-auto

// CORREÇÃO:
max-h-[70vh] lg:max-h-[60vh] overflow-y-auto
```

---

### 17. TripCard.tsx - Skeleton Aspect Ratio
**Arquivo:** `src/components/TripCard.tsx`  
**Linha:** 19

```tsx
// PROBLEMA: Skeleton usa h-64 diferente do card real
// CORREÇÃO:
<div className="relative h-64 md:aspect-[4/5] w-full overflow-hidden">
  <div className="h-full w-full bg-gray-200"></div>
</div>
```

---

### 18. Sidebar.tsx - Collapse Button Mobile
**Linha:** 62-67

```tsx
// PROBLEMA: Botão de collapse pode sair da tela em mobile
absolute -right-3 top-1/2

// CORREÇÃO:
absolute -right-3 top-1/2 hidden md:block
// Mobile não tem sidebar expandida
```

---

## 🟡 PROBLEMAS MÉDIOS - Melhorias Recomendadas

### 19. Layout.tsx - Footer Mobile Padding
**Linha:** 808

```tsx
// PROBLEMA: Padding desigual
border-t border-gray-200 pt-8 flex flex-col md:flex-row

// CORREÇÃO:
pt-6 md:pt-8
```

---

### 20. AgencyList.tsx - List View Mobile
**Linha:** 239-259

```tsx
// PROBLEMA: List view pode não funcionar bem em mobile
// Items muito apertados
// CORREÇÃO: Ajustar padding/hierarchy em mobile
```

---

### 21. TripList.tsx - Sort Select Mobile
**Linha:** 616-626

```tsx
// PROBLEMA: Select pode ser pequeno
className="flex-1 sm:flex-none"

// CORREÇÃO:
className="w-full sm:w-auto"
```

---

### 22. BottomNav.tsx - Ícones Tamanho Fixo
**Linha:** 22

```tsx
// PROBLEMA: Tamanho fixo pode não escalar
<Icon size={22} />

// CORREÇÃO:
<Icon size={20} className="sm:size-5" />
```

---

### 23. TripDetails.tsx - Gallery Swipe
**Severidade:** 🟡 Médio

```tsx
// PROBLEMA: Gallery pode não ter swipe em touch
// CORREÇÃO: Adicionar gesture handling ou bibliotecas
// como react-swipeable ou framer-motion
```

---

### 24. Layout.tsx - Mobile Menu Esconde Navegação
**Linha:** 448-457

```tsx
// PROBLEMA: Mobile menu só aparece quando !user
{!user && (
  <button ... className="md:hidden ...">
)}

// CORREÇÃO: Mobile menu deveria aparecer sempre
// Ou usar BottomNav para navegação quando logado
```

---

### 25. Home.tsx - Featured Section Responsivo
**Linha:** 414

```tsx
// VERIFICAR: FeaturedSection é responsivo?
// Testar em todas as resoluções
```

---

### 26. TripCard.tsx - CTA Button Mobile
**Linha:** 298

```tsx
// PROBLEMA: Botão "Ver detalhes" pode ser pequeno
px-5 py-2.5 rounded-full

// CORREÇÃO:
px-4 sm:px-5 py-2 sm:py-2.5
```

---

### 27. HeroSearch.tsx - Input Mobile Landscape
**Linha:** 741

```tsx
// PROBLEMA: py-3 pode ser alto em landscape
py-3 text-gray-900

// CORREÇÃO:
py-2 sm:py-3
```

---

## 🟢 PROBLEMAS BAIXOS - Nice to Have

### 28. AgencyList.tsx - Pagination Mobile
**Linha:** 275-282

```tsx
// PROBLEMA: Números de página podem não caber
<button className="w-10 h-10">

// CORREÇÃO: Usar "Anterior/Próxima" em mobile
```

---

### 29. BottomNav.tsx - Active State Visual
**Linha:** 22

```tsx
// PROBLEMA: Indicador de dot pode não aparecer em todos estados
<div className="absolute -top-1 right-0 ..." />
```

---

### 30. TripList.tsx - Empty State Mobile
**Linha:** 650-659

```tsx
// PROBLEMA: Empty state pode ter padding excessivo
py-20

// CORREÇÃO:
py-12 sm:py-20
```

---

### 31. Layout.tsx - Logo Responsivo
**Linha:** 463-475

```tsx
// PROBLEMA: Logo pode não escalar bem
className="h-8 w-auto mr-2"

// CORREÇÃO:
className="h-7 sm:h-8 w-auto mr-2"
```

---

### 32. Sidebar.tsx - Scrollbar Mobile
**Linha:** 71

```tsx
// PROBLEMA: Scrollbar pode aparecer em mobile
scrollbar-thin scrollbar-thumb-gray-200

// CORREÇÃO:
scrollbar-thin scrollbar-thumb-gray-200 scrollbar-thin:touch-auto
```

---

## 📱 Breakpoints do Projeto

O projeto usa breakpoints padrão do Tailwind:

| Breakpoint | Largura | Uso |
|------------|---------|-----|
| `sm` | 640px | Mobile grande |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Desktop grande |

### Melhorias Sugeridas no tailwind.config.js:

```js
screens: {
  'xs': '475px',      // Mobile pequeno (iPhone SE)
  ...defaultTheme.screens,
  'tablet': '768px',  // Tablet (iPad Mini)
  'laptop': '1024px', // Laptop
}
```

---

## ✅ Checklist de Correção

### Fase 1 - Críticos (1-2 dias)
- [ ] Layout.tsx: Hero height responsivo
- [ ] Layout.tsx: Safe area padding
- [ ] Layout.tsx: Main content padding
- [ ] Sidebar.tsx: Versão mobile (ou usar tabs)
- [ ] TripList.tsx: Backdrop filtros mobile
- [ ] BottomNav.tsx: Safe area verificação
- [ ] TripDetails.tsx: Mobile booking widget
- [ ] GuideList.tsx: Hero height

### Fase 2 - Altos (3-5 dias)
- [ ] Layout.tsx: Padronizar z-index
- [ ] TripList.tsx: Grid limits
- [ ] AgencyList.tsx: View toggle
- [ ] AgencyDashboard.tsx: Mobile tabs
- [ ] HeroSearch.tsx: Date picker mobile
- [ ] TripCard.tsx: Skeleton aspect ratio

### Fase 3 - Médios (1 semana)
- [ ] Layout.tsx: Footer padding
- [ ] Mobile menu lógica
- [ ] GuideList.tsx: Grid alinhamento
- [ ] Home.tsx: Chips overflow

### Fase 4 - Baixos (Contínuo)
- [ ] Pagination mobile
- [ ] Empty states
- [ ] Logo scaling

---

## 🧪 Dispositivos de Teste Recomendados

| Dispositivo | Resolução | Prioridade |
|-------------|-----------|------------|
| iPhone SE | 375x667 | Alta |
| iPhone 14 | 390x844 | Alta |
| iPhone 14 Pro Max | 430x932 | Alta |
| iPad Mini | 768x1024 | Alta |
| iPad Pro 11" | 834x1194 | Média |
| Desktop 1080p | 1920x1080 | Alta |

---

**Última atualização:** 22/03/2026
