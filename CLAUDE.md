# Goal Tracker App

App móvil para trackear goals personales. La feature diferenciadora son los **widgets** que se construyen a partir de la data del usuario (in-app y, en una segunda fase, home screen widgets nativos en iOS).

## Stack

- **Expo SDK 54** (React Native 0.81, New Architecture habilitado). Pinneado a SDK 54 para mantener compatibilidad con Expo Go en App Store mientras Apple actualiza a SDK 55.
- **Expo Router** (file-based, route groups `(auth)` / `(tabs)`)
- **TypeScript** (strict)
- **NativeWind v4** (Tailwind para RN) — única capa de UI; los componentes (Button, Card, Input, etc.) se construyen custom sobre los primitivos de RN, sin librería externa
- **Supabase** (DB Postgres + Auth + Storage; RLS habilitado en todas las tablas con datos de usuario)
- **TanStack Query v5** (datos remotos de Supabase: cache, refetch, optimistic updates)
- **Zustand v5** (estado UI local: tema, filtros, etc.)
- **expo-widgets** (home screen widgets iOS, sin código nativo — fase 2)

### Auth

Email + Password y Sign in with Google. Más adelante puede agregarse Sign in with Apple (requerido por App Store si Google está activo en iOS).

### Variables de entorno

Las env vars deben tener el prefijo `EXPO_PUBLIC_` para ser accesibles en el cliente. La `anon key` de Supabase es segura de exponer porque RLS protege los datos.

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Comandos

```bash
# Dependencias
npm install

# Desarrollo
npx expo start              # arranca dev server
npx expo start --ios        # abre simulador iOS
npx expo start --android    # abre emulador Android
npx expo start --clear      # arranca limpiando caché de Metro

# Type checking
npx tsc --noEmit

# Build (EAS — configurar después)
npx eas build --platform ios
npx eas build --platform android
```

## Diseño y UI

- **Para construir cualquier UI, consulta SIEMPRE primero `docs/design-system.md`.** Es la fuente de verdad de colores, tipografía, radios, animaciones y componentes canónicos.
- Especialmente la **sección 10 ("React Native Adaptations")** que adapta las reglas web del design system al stack móvil.
- Los tokens (colores, radios, fuentes) están codificados en `tailwind.config.js` — usa siempre clases (`bg-brand-green`, `rounded-pill`, `text-brand-greenDark`), nunca hex literal.
- Slash command `/ui` disponible para generar componentes pegados al design system.

## Notas

- El proyecto requiere New Architecture (obligatorio en SDK 55).
- Supabase MCP se agregará más adelante para trabajar la DB directamente desde Claude Code.
- Los widgets nativos del home screen llegan en fase 2 (post-MVP).
