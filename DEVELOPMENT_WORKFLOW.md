# 🔧 Workflow de Desarrollo - BLife

## 📱 Modo Bundled (Actual - Desarrollo Local)

### ✅ Ventajas
- ⚡ **Carga instantánea**: La app carga desde archivos locales
- 🔄 **Iteración rápida**: Build → Sync → Run
- 📴 **Funciona offline**: No necesita conexión
- 🧪 **Testing local**: Prueba cambios sin deploy

### ⚠️ Desventajas
- 🔨 Requiere rebuild para cada cambio
- 📦 Tamaño de APK más grande
- ❌ Server Actions no funcionan (limitación de `output: 'export'`)

## 🚀 Workflow de Desarrollo

### 1. Hacer Cambios en el Código
Edita cualquier archivo `.tsx`, `.ts`, etc.

### 2. Build para Producción
```bash
npm run build
```
Esto genera la carpeta `out/` con los archivos estáticos.

### 3. Sincronizar con Capacitor
```bash
npx cap sync
```
Copia los archivos de `out/` a `android/app/src/main/assets/public/`

### 4. Rebuild en Android Studio
- **Build** → **Rebuild Project**
- **Run** (▶️)

### 🎯 Script Todo-en-Uno
Para facilitar, usa:
```bash
npm run build:mobile
```
Esto ejecuta `npm run build && npx cap sync` automáticamente.

## 🔄 Cambiar entre Modos

### Modo Bundled (Desarrollo Local) - ACTUAL ✅
```typescript
// capacitor.config.ts
const config = {
  webDir: 'out',
  // server: { ... } // COMENTADO
}
```

### Modo Live URL (Producción)
```typescript
// capacitor.config.ts
const config = {
  webDir: 'out',
  server: {
    url: 'https://blife-udc.vercel.app',
    cleartext: true
  }
}
```

## 📋 Checklist de Desarrollo

### Antes de Empezar
- [ ] `npm run build` completado sin errores
- [ ] `npx cap sync` ejecutado
- [ ] Android Studio abierto

### Para Cada Cambio
1. [ ] Editar código
2. [ ] `npm run build`
3. [ ] `npx cap sync`
4. [ ] Rebuild en Android Studio
5. [ ] Run en dispositivo

### Optimización
Si solo cambias **estilos o texto**:
- Puedes hacer Hot Reload en algunos casos
- Pero es más seguro hacer rebuild completo

## 🐛 Troubleshooting

### "Los cambios no aparecen"
1. Verifica que `npm run build` se completó sin errores
2. Ejecuta `npx cap sync` de nuevo
3. En Android Studio: **Build** → **Clean Project**
4. Luego **Build** → **Rebuild Project**

### "Error: Server Actions not supported"
Esto es normal en modo bundled. Las Server Actions requieren un servidor Node.js.
- **Solución temporal**: Usa Live URL para features con Server Actions
- **Solución permanente**: Migrar Server Actions a API Routes

### "La app carga muy lento"
En modo bundled, la primera carga puede ser lenta si hay muchos assets.
- Optimiza imágenes
- Usa lazy loading
- Considera code splitting

## 🎯 Recomendaciones

### Para Desarrollo Activo
✅ **Usa Modo Bundled** (actual)
- Iteración rápida
- No depende de Vercel
- Testing local

### Para Testing de Features Completas
⚠️ **Usa Live URL**
- Server Actions funcionan
- Refleja producción
- Más lento para iterar

### Para Producción
✅ **Usa Live URL**
- Siempre actualizado
- Menor tamaño de APK
- Todas las features funcionan

## 📊 Comparativa

| Aspecto | Bundled (Actual) | Live URL |
|---------|------------------|----------|
| **Velocidad de carga** | ⚡ Instantánea | 🐌 Depende de red |
| **Iteración** | 🔄 Build + Sync | ⚡ Solo deploy |
| **Server Actions** | ❌ No soportado | ✅ Funciona |
| **Offline** | ✅ Total | ⚠️ Parcial (SW) |
| **Tamaño APK** | 📦 ~15-20MB | 📦 ~5MB |

## 🔧 Scripts Útiles

```bash
# Build + Sync (recomendado)
npm run build:mobile

# Solo build
npm run build

# Solo sync
npm run cap:sync

# Abrir Android Studio
npx cap open android
```

## ✅ Estado Actual

- ✅ Modo: **Bundled** (desarrollo local)
- ✅ `capacitor.config.ts`: `server.url` comentado
- ✅ Scripts configurados en `package.json`
- ✅ Listo para desarrollo rápido

**Para volver a Live URL**: Descomenta `server.url` en `capacitor.config.ts` y ejecuta `npx cap sync`
