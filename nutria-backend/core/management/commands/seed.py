from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import Alimento, Categoria, Rol


ROLES = [
    (1, 'Administrador'),
    (2, 'Usuario'),
    (3, 'Nutricionista'),
]
CATEGORIAS = [
    (1, 'Proteínas'),
    (2, 'Carbohidratos'),
    (3, 'Grasas'),
    (4, 'Bebidas'),
]

ALIMENTOS = [
    ('Pechuga de pollo', 'Proteínas', 165, 31, 0, 3.6),
    ('Atún en agua', 'Proteínas', 116, 26, 0, 0.8),
    ('Huevo entero', 'Proteínas', 155, 13, 1.1, 11),
    ('Arroz blanco cocido', 'Carbohidratos', 130, 2.7, 28, 0.3),
    ('Avena', 'Carbohidratos', 389, 17, 66, 7),
    ('Papa cocida', 'Carbohidratos', 87, 1.9, 20, 0.1),
    ('Aguacate', 'Grasas', 160, 2, 8.5, 14.7),
    ('Almendras', 'Grasas', 579, 21, 21.6, 50),
    ('Aceite de oliva', 'Grasas', 884, 0, 0, 100),
    ('Agua', 'Bebidas', 0, 0, 0, 0),
    ('Jugo de naranja natural', 'Bebidas', 45, 0.7, 10.4, 0.2),
    ('Leche descremada', 'Bebidas', 34, 3.4, 5, 0.1),
]


class Command(BaseCommand):
    help = 'Crea datos base: roles, categorías y alimentos de ejemplo'

    @transaction.atomic
    def handle(self, *args, **options):
        roles = {}
        for id_rol, nombre in ROLES:
            rol = Rol.objects.filter(id_rol=id_rol).first() or Rol.objects.filter(nombre=nombre).first()
            creado = False
            if not rol:
                rol = Rol.objects.create(id_rol=id_rol, nombre=nombre)
                creado = True
            roles[nombre] = rol
            self.stdout.write(f"{'creado' if creado else 'ya existe'} rol: {nombre} (id: {rol.id_rol})")

        categorias = {}
        for id_cat, nombre in CATEGORIAS:
            cat = Categoria.objects.filter(id_categoria=id_cat).first() or Categoria.objects.filter(nombre=nombre).first()
            creado = False
            if not cat:
                cat = Categoria.objects.create(id_categoria=id_cat, nombre=nombre)
                creado = True
            categorias[nombre] = cat
            self.stdout.write(f"{'creado' if creado else 'ya existe'} categoría: {nombre}")

        for nombre, cat, cal, prot, carb, gras in ALIMENTOS:
            alimento, creado = Alimento.objects.get_or_create(
                nombre=nombre,
                categoria=categorias[cat],
                defaults={
                    'calorias': cal,
                    'proteinas': prot,
                    'carbohidratos': carb,
                    'grasas': gras,
                },
            )
            self.stdout.write(f"{'creado' if creado else 'ya existe'} alimento: {nombre}")

        self.stdout.write(self.style.SUCCESS('Seed completado con roles RBAC (Administrador, Usuario, Nutricionista).'))
