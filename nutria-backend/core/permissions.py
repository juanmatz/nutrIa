"""
Clases de permisos RBAC para NutrIA API.
Jerarquía de roles:
- 1: Administrador
- 2: Usuario / Paciente
- 3: Nutricionista
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRole(BasePermission):
    """
    Permiso que valida si el usuario autenticado tiene rol de Administrador
    (id_rol == 1 o is_superuser == True).
    """
    message = 'Acceso denegado: se requieren privilegios de Administrador.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return False

        # Verifica id_rol == 1 o rol.nombre == 'Administrador'
        rol_id = getattr(user, 'rol_id', None) or getattr(getattr(user, 'rol', None), 'id_rol', None)
        if rol_id == 1:
            return True

        rol_nombre = getattr(getattr(user, 'rol', None), 'nombre', '')
        if str(rol_nombre).strip().lower() == 'administrador':
            return True

        return bool(getattr(user, 'is_superuser', False))


class IsOwnerOrAdmin(BasePermission):
    """
    Permite acceso de lectura/escritura si el usuario autenticado es el propietario
    del recurso (id_usuario coincide) o si tiene rol de Administrador.
    """
    message = 'Acceso denegado: solo puedes consultar o modificar tu propia información.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and getattr(user, 'is_authenticated', False))

    def has_object_permission(self, request, view, obj):
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return False

        # Si es Admin, tiene acceso total
        rol_id = getattr(user, 'rol_id', None) or getattr(getattr(user, 'rol', None), 'id_rol', None)
        if rol_id == 1 or getattr(user, 'is_superuser', False):
            return True

        # Verifica si el objeto es el propio usuario o pertenece a él
        target_id = getattr(obj, 'id_usuario', None)
        if target_id is not None:
            return target_id == user.id_usuario

        user_fk = getattr(obj, 'usuario_id', None) or getattr(getattr(obj, 'usuario', None), 'id_usuario', None)
        if user_fk is not None:
            return user_fk == user.id_usuario

        return False


class IsNutritionistOrAdmin(BasePermission):
    """
    Permite acceso a Administradores (rol 1) y Nutricionistas (rol 3).
    """
    message = 'Acceso denegado: se requiere rol de Nutricionista o Administrador.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return False

        rol_id = getattr(user, 'rol_id', None) or getattr(getattr(user, 'rol', None), 'id_rol', None)
        return rol_id in [1, 3] or bool(getattr(user, 'is_superuser', False))

