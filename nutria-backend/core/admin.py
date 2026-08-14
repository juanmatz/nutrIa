from django.contrib import admin

from .models import Alimento, Categoria, Rol, Usuario


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('id_rol', 'nombre')
    search_fields = ('nombre',)


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('id_usuario', 'nombre', 'email', 'rol', 'fecha_registro')
    search_fields = ('nombre', 'email')
    list_filter = ('rol',)


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('id_categoria', 'nombre')
    search_fields = ('nombre',)


@admin.register(Alimento)
class AlimentoAdmin(admin.ModelAdmin):
    list_display = ('id_alimento', 'nombre', 'categoria', 'calorias')
    search_fields = ('nombre',)
    list_filter = ('categoria',)
