# Goal Tracker App — Mapa de pantallas y flujo

## Estructura de navegación

```
app/index.tsx           → Auth check (loading spinner)
  ├── /(auth)/signin    → Login email/password
  ├── /(auth)/signup    → Registro
  └── /(tabs)           → App principal
        ├── Home        → Dashboard con árbol de goals
        ├── Goals       → Lista con búsqueda y filtros (All/Active/Overdue/Done)
        └── Profile     → Avatar, dark mode, premium, sign out
```

## Flujo del Goal

```
/(tabs) Home o Goals
  └── tap GoalCard → /goal/[id]           (modal) DETALLE
        ├── tap "Edit"  → /goal/[id]/edit  (modal) EDICIÓN
        ├── tap "Logs"  → /goal/[id]/logs  (modal) HISTORIAL
        │     └── tap 👁 → /goal/[id]/log/[logId]  (modal) DETALLE DEL LOG
        │                    └── tap thumbnail → fullscreen viewer (Modal nativo)
        ├── tap "AI"    → /goal/[id]/ai    (modal) ASISTENTE IA (solo composite)
        └── tap "+ sub-goal" → /goal/new   (push) CREAR SUBGOAL
```

## Pantallas en detalle

| Pantalla | Secciones principales | Datos |
|---|---|---|
| **Home** | Headline dinámico, árbol de GoalCards, pull-to-refresh | `useGoals()` |
| **Goals** | Buscador, filtros, lista flat de goals | `useGoals()` |
| **Goal Detail** `/goal/[id]` | Nombre, progreso (barra + %), nota si existe, form de progreso (Add/Set/chips/fotos) o sub-goals si es composite | `useGoal`, `useAddProgress` |
| **New Goal** `/goal/new` | Toggle simple/composite, icon, nombre, target, unit, parent, deadline, fotos, nota | `useCreateGoal` |
| **Edit Goal** `/goal/[id]/edit` | Mismo que new pero pre-filled, parent lock | `useUpdateGoal` |
| **Logs** `/goal/[id]/logs` | Lista cronológica de entradas (monto, sub-goal si composite, reason, fecha, 👁, 🗑) | `useGoalLogs` / `useGoalLogsForIds` |
| **Log Detail** `/goal/[id]/log/[logId]` | Monto hero, badges, nota, grid de fotos 3-col, viewer fullscreen con swipe | `useGoalLog`, `useGoal` |
| **AI Assistant** `/goal/[id]/ai` | Chat, propuesta de sub-goals con checkboxes | `useAiChat`, `useAiGenerate` |
| **Premium** | Feature list, planes monthly/yearly, RevenueCat | RevenueCat SDK |
| **Profile** | Avatar, nombre, email, dark mode toggle, go pro, suggestions, sign out | `useAuth`, `usePremium` |
| **Edit Profile** | Avatar picker, nombre editable, email read-only | `supabase.auth` |
| **Suggestions** | Tipo (feedback/feature/bug), título, mensaje | `useCreateSuggestion` |

## Stack técnico

- **Expo SDK 54** / React Native 0.81 / New Architecture
- **Expo Router** (file-based, stack + modal presentations)
- **NativeWind v4** (Tailwind para RN, sin librerías de UI externas)
- **Supabase** (Postgres + Auth + Storage con RLS)
- **TanStack Query v5** (cache, refetch, optimistic updates)
- **Zustand v5** (estado UI local)
- **RevenueCat** (IAP / suscripciones)
- **react-native-gesture-handler + reanimated** (gestures y animaciones)

## Presentación de las rutas

| Tipo | Rutas |
|---|---|
| **Modal** | `/premium`, `/profile/edit`, `/suggestions`, `/goal/[id]`, `/goal/[id]/edit`, `/goal/[id]/logs`, `/goal/[id]/log/[logId]`, `/goal/[id]/ai` |
| **Push normal** | `/(tabs)`, `/(auth)`, `/goal/new` |

## Problema de UX actual

El path para ver imágenes de un log son **4 taps mínimo**:

1. `Home` → tap goal → **Goal Detail** (modal)
2. `Goal Detail` → tap "Logs" → **Logs** (modal apilado)
3. `Logs` → tap 👁 → **Log Detail** (modal apilado)
4. `Log Detail` → tap thumbnail → **viewer fullscreen**

Para agregar progreso con fotos: **3 taps + form complejo** dentro de Goal Detail.

`Goal Detail` intenta hacer demasiado en una sola pantalla: ver stats, agregar progreso, ver sub-goals. El acceso a fotos y logs está demasiado enterrado.
