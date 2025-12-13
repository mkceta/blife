# Guía de Contribución

¡Gracias por tu interés en contribuir a BLife! 🎉

## Cómo Contribuir

### Reportar Bugs

Si encuentras un bug, por favor abre un [issue](https://github.com/tu-usuario/blife/issues/new) con:
- **Descripción clara** del problema
- **Pasos para reproducir** el bug
- **Comportamiento esperado** vs. comportamiento actual
- **Screenshots** si es aplicable
- **Entorno** (navegador, versión de Android, etc.)

### Sugerir Mejoras

Para sugerir nuevas características:
1. Revisa los [issues existentes](https://github.com/tu-usuario/blife/issues) para evitar duplicados
2. Abre un nuevo issue con el tag `enhancement`
3. Describe claramente la funcionalidad propuesta
4. Explica por qué sería útil para la comunidad UDC

### Pull Requests

1. **Fork** el repositorio
2. **Crea una rama** desde `main`:
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```
3. **Realiza tus cambios** siguiendo las guías de estilo
4. **Escribe tests** si es aplicable
5. **Commit** tus cambios con mensajes descriptivos:
   ```bash
   git commit -m "feat: añadir búsqueda por ubicación en marketplace"
   ```
6. **Push** a tu fork:
   ```bash
   git push origin feature/nombre-descriptivo
   ```
7. **Abre un Pull Request** con:
   - Descripción clara de los cambios
   - Referencias a issues relacionados
   - Screenshots si hay cambios visuales

## Guías de Estilo

### Código

- **TypeScript**: Usa tipos explícitos siempre que sea posible
- **Componentes**: Usa componentes funcionales con hooks
- **Nombres**: 
  - Componentes: `PascalCase`
  - Funciones/variables: `camelCase`
  - Constantes: `UPPER_SNAKE_CASE`
  - Archivos: `kebab-case.tsx`
- **Imports**: Organiza los imports en este orden:
  1. React/Next.js
  2. Librerías externas
  3. Componentes internos
  4. Utilidades/helpers
  5. Tipos
  6. Estilos

### Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan la lógica)
- `refactor:` Refactorización de código
- `test:` Añadir o modificar tests
- `chore:` Tareas de mantenimiento

Ejemplos:
```
feat: añadir filtro por precio en marketplace
fix: corregir error en notificaciones push
docs: actualizar guía de instalación
```

### Testing

- Escribe tests para nuevas funcionalidades
- Asegúrate de que todos los tests pasen antes de hacer PR:
  ```bash
  npm run test
  ```

### Linting

- Ejecuta el linter antes de commit:
  ```bash
  npm run lint
  ```

## Estructura de Branches

- `main`: Código en producción
- `develop`: Desarrollo activo (si existe)
- `feature/*`: Nuevas funcionalidades
- `fix/*`: Correcciones de bugs
- `hotfix/*`: Correcciones urgentes para producción

## Código de Conducta

- Sé respetuoso y constructivo
- Acepta críticas constructivas
- Enfócate en lo mejor para la comunidad
- Ayuda a otros contribuidores

## Preguntas

Si tienes preguntas sobre cómo contribuir, no dudes en:
- Abrir un [issue](https://github.com/tu-usuario/blife/issues/new)
- Contactar al equipo de desarrollo

---

¡Gracias por hacer de BLife una mejor plataforma para la comunidad UDC! 🚀
