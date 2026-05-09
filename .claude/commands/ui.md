---
description: Genera un componente React Native pegado al design system del proyecto
---

Vas a crear o modificar un componente de UI siguiendo estrictamente el design system de este proyecto.

## Pasos obligatorios

1. **Lee `docs/design-system.md` completo**, especialmente:
   - Sección 2 (paleta de colores y roles)
   - Sección 4 (componentes canónicos: botones, cards)
   - Sección 7 (Do's and Don'ts)
   - **Sección 10 (React Native Adaptations)** — esta sobreescribe lo web cuando hay conflicto

2. **Revisa `tailwind.config.js`** para confirmar los tokens disponibles (`brand-*`, `semantic-*`, `neutral-*`, `rounded-token-*`, `rounded-pill`, `font-display`, etc.).

3. **Construye el componente** respetando el checklist de la sección 10.9:
   - Tokens de color, nunca hex literal
   - `Pressable` con `active:scale-95` para interactivos (no `TouchableOpacity`)
   - `rounded-pill` para botones, `rounded-token-2xl` para cards (default)
   - Border + sin shadow (RN no soporta ring shadows)
   - Display en `font-display` (Inter Black 900) con `leading-[0.85]`
   - Body en `font-semibold` por default

4. **Componente debe ser reutilizable** y vivir en `components/ui/` salvo que el usuario diga otra ubicación. Tipado con TypeScript estricto, props explícitas.

5. Después de crear el archivo, muestra una previsualización mental: lista los tokens usados y por qué, y confirma que pasa el checklist 10.9.

## Input del usuario

$ARGUMENTS

Si el input está vacío, pregunta qué componente quiere construir y para qué pantalla.
