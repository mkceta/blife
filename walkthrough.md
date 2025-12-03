# Admin Dashboard Improvements

I have enhanced the Admin Dashboard (`/admin`) to provide more insights and a better layout.

## Changes

### 1. Enhanced Stats Overview
- **New Stats**: Added cards for **Pisos (Flats)** and **Posts**.
- **Layout**: Updated the stats grid to support up to 6 columns on large screens, making better use of horizontal space.
- **Data**: Now fetching counts for active flats and visible posts.

### 2. Expanded Recent Activity
- **New Section**: Added a **"Últimos Pisos"** column to the Recent Activity section.
- **Layout**: Changed the Recent Activity layout from a 2-column grid to a 3-column grid (Users, Listings, Flats).
- **Content**: Now displaying the 5 most recent flats with their images and rent prices.

## Verification

### Manual Verification Steps
1.  **Navigate to Admin Dashboard**: Go to `/admin`.
2.  **Check Stats**: Verify that you see cards for Users, Mercadillo, Ventas, Pisos, Posts, and Reportes.
3.  **Check Activity**: Verify that there are three columns in the "Actividad Reciente" section:
    - **Nuevos Usuarios**
    - **Últimos Anuncios**
    - **Últimos Pisos**
4.  **Responsiveness**: Resize the window to check that the grids adapt correctly (1 column on mobile, 2/3 on tablet, full width on desktop).
