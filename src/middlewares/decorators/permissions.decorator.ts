import { SetMetadata } from '@nestjs/common';


// Define una clave constante que se usará para guardar los permisos en los metadatos
export const PERMISSIONS_KEY = 'permissions';

// Este decorador permite asociar uno o más permisos a un handler (ruta, método, etc.)
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
// Ejemplo de uso: @Permissions('create_roles')
// Esto agrega metadatos que luego pueden ser leídos por un guard