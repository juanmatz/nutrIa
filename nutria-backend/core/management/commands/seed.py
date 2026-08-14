from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import Alimento, Categoria, Rol


ROLES = ['Administrador', 'Usuario']
CATEGORIAS = ['Proteínas', 'Carbohidratos', 'Grasas', 'Bebidas']

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
        for nombre in ROLES:
            rol, creado = Rol.objects.get_or_create(nombre=nombre)
            roles[nombre] = rol
            self.stdout.write(f"{'creado' if creado else 'ya existe'} rol: {nombre}")

        categorias = {}
        for nombre in CATEGORIAS:
            cat, creado = Categoria.objects.get_or_create(nombre=nombre)
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

        self.stdout.write(self.style.SUCCESS('Seed completado.'))
