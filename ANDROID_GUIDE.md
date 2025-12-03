# Guía de Construcción Android para BLife

La compilación automática del APK falló debido a problemas de configuración del entorno Java/Gradle. Sin embargo, el código está listo y corregido.

Sigue estos pasos para generar el APK en tu máquina:

## Requisitos Previos
1.  Tener **Android Studio** instalado.
2.  Tener el código actualizado (ya he aplicado las correcciones en `app/market` y `app/actions`).

## Pasos para generar el APK

### Opción 1: Usando Android Studio (Recomendado)
1.  Abre **Android Studio**.
2.  Selecciona **Open** y navega a la carpeta `android` dentro de tu proyecto (`blife/android`).
3.  Espera a que Gradle sincronice el proyecto (esto puede tardar unos minutos la primera vez).
4.  Ve al menú **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5.  Una vez termine, aparecerá una notificación. Haz clic en **locate** para abrir la carpeta con el archivo `app-debug.apk`.

### Opción 2: Usando la Terminal
Si prefieres usar la terminal, asegúrate de tener Java 17 configurado correctamente.

1.  Abre una terminal en la carpeta `blife/android`.
2.  Ejecuta el siguiente comando:
    ```powershell
    .\gradlew.bat assembleDebug
    ```
3.  Si todo va bien, el APK estará en:
    `android/app/build/outputs/apk/debug/app-debug.apk`

## Notas Importantes
- **Servidor de Producción**: La app está configurada para cargar `https://blife-udc.vercel.app`. Asegúrate de que tu despliegue en Vercel esté actualizado con los últimos cambios (`git push`).
- **Server Actions**: He corregido los archivos faltantes (`sale-actions.ts`, etc.) y eliminado `output: 'export'` de la configuración de Next.js para que las Server Actions funcionen correctamente dentro de la app móvil.
