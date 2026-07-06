# Configuración de Supabase

Esta app ya está conectada por código a Supabase. Para crear la base de datos real y unirla al proyecto necesitas un proyecto Supabase propio.

## 1. Crear el proyecto

1. Entra a Supabase y crea un proyecto nuevo.
2. Ve a `SQL Editor`.
3. Copia el contenido de `supabase_schema.sql`.
4. Ejecútalo completo.

Importante: `supabase_schema.sql` elimina tablas existentes antes de crearlas. Úsalo en un proyecto nuevo o en una base donde no haya datos que quieras conservar.

## 2. Copiar credenciales

En Supabase, abre `Project Settings > API` y copia:

- `Project URL`
- `anon public key`

Luego actualiza `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key
```

Reinicia el servidor de desarrollo después de cambiar `.env`.

## 3. Auth

La app usa Supabase Auth con email y contraseña.

En `Authentication > Providers` verifica que `Email` esté habilitado. Si dejas activada la confirmación por correo, los usuarios deberán confirmar su email antes de iniciar sesión.

## 4. Verificación rápida

1. Abre la app.
2. Registra un usuario nuevo.
3. Supabase debe crear automáticamente perfil, cuentas y categorías iniciales.
4. Prueba crear:
   - una transacción
   - una cuenta
   - una categoría
   - un presupuesto
   - una meta de ahorro
   - una transacción recurrente

En la pantalla `Configuración`, la tarjeta de Supabase debe aparecer como `Conectado` cuando las variables reales estén cargadas.

## 5. Lo que ya está conectado

- Autenticación y sesión persistente.
- Cuentas.
- Categorías.
- Transacciones con ajuste de saldo.
- Presupuestos.
- Metas de ahorro.
- Transacciones recurrentes.
- Notificaciones.
- Insights calculados desde transacciones.
