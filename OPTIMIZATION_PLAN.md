# 🚀 Plan de Optimización: App Nativa Ultra-Rápida

## 📊 Problemas Actuales

1. **Falta `gcTime` en la mayoría de queries** - Los datos se borran al salir de la página
2. **Profile no usa React Query** - Se recarga desde cero cada vez
3. **No hay persistencia en localStorage** - Se pierde todo al cerrar la app
4. **Prefetch no está optimizado** - No precarga suficientes datos

---

## ✅ Soluciones a Implementar

### 1. **Configurar `gcTime` Global** (24 horas)
- Mantener datos en memoria incluso al cambiar de página
- Solo se borra después de 24h sin usar

### 2. **Profile con React Query**
- Convertir `profile-content.tsx` para usar `useQuery`
- Cache de 24h con `placeholderData`
- Carga instantánea en segunda visita

### 3. **Persistencia con React Query Persist**
- Guardar cache en localStorage/AsyncStorage
- Sobrevive al cerrar la app
- Hydratación instantánea al abrir

### 4. **Optimistic Updates**
- Actualizar UI antes de que responda el servidor
- Sensación de app nativa

### 5. **Prefetch Agresivo**
- Precargar todas las páginas principales al login
- Market, Community, Profile, Messages
- Todo listo antes de que el usuario navegue

### 6. **Service Worker para Offline**
- Cache de assets estáticos
- Funciona sin internet (datos cacheados)

---

## 🎯 Resultado Esperado

- ✅ **Primera carga**: ~2s (normal)
- ✅ **Segunda carga**: ~50ms (instantánea)
- ✅ **Navegación entre páginas**: 0ms (ya está en memoria)
- ✅ **Funciona offline**: Sí (datos cacheados)
- ✅ **Sensación**: App nativa real

---

## 📝 Orden de Implementación

1. ✅ Configurar `gcTime` global (5 min)
2. ✅ Añadir `gcTime` a todas las queries existentes (10 min)
3. ✅ Convertir Profile a React Query (15 min)
4. ✅ Implementar React Query Persist (20 min)
5. ⏭️ Optimistic updates (opcional, 30 min)
6. ⏭️ Service Worker (opcional, 45 min)

**Total tiempo: ~50 minutos para velocidad de rayo** ⚡
