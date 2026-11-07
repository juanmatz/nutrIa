from django.db import models
from django.utils import timezone


class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.nombre


class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    contrasena_hash = models.CharField(max_length=255)
    edad = models.IntegerField(null=True, blank=True)
    peso = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    altura = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    objetivo = models.CharField(max_length=100, null=True, blank=True)
    calorias_diarias = models.IntegerField(null=True, blank=True)
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, db_column='id_rol', related_name='usuarios')
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return self.nombre

    @property
    def is_authenticated(self):
        return True

    @property
    def is_active(self):
        return True

    @property
    def is_staff(self):
        return getattr(self, 'rol_id', None) == 1 or getattr(getattr(self, 'rol', None), 'id_rol', None) == 1

    @property
    def is_superuser(self):
        return getattr(self, 'rol_id', None) == 1 or getattr(getattr(self, 'rol', None), 'id_rol', None) == 1


class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'categorias'
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'

    def __str__(self):
        return self.nombre


class Alimento(models.Model):
    id_alimento = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    calorias = models.IntegerField()
    proteinas = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    carbohidratos = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    grasas = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        db_column='id_categoria',
        related_name='alimentos',
    )
    # Campos extendidos para FoodsView
    emoji = models.CharField(max_length=16, blank=True, default='🥗')
    badge = models.CharField(max_length=50, blank=True, default='')
    prioridad = models.CharField(max_length=20, default='media')
    detalles = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'alimentos'
        verbose_name = 'Alimento'
        verbose_name_plural = 'Alimentos'

    def __str__(self):
        return self.nombre


class Comida(models.Model):
    id_comida = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column='id_usuario',
        related_name='comidas',
    )
    tipo = models.CharField(max_length=50)  # Desayuno, Almuerzo, Cena, Merienda, Snack
    nombre = models.CharField(max_length=200)
    hora = models.CharField(max_length=10, blank=True, default='')  # HH:MM string
    calorias = models.FloatField(default=0.0)
    proteinas = models.FloatField(default=0.0)
    carbohidratos = models.FloatField(default=0.0)
    grasas = models.FloatField(default=0.0)
    completado = models.BooleanField(default=False)
    fecha = models.DateField(default=timezone.now)
    items = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'comidas'
        verbose_name = 'Comida'
        verbose_name_plural = 'Comidas'
        ordering = ['fecha', 'hora', 'id_comida']

    def __str__(self):
        return f"{self.nombre} ({self.tipo}) - {self.fecha}"


class RegistroAgua(models.Model):
    id_registro = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column='id_usuario',
        related_name='registros_agua',
    )
    fecha = models.DateField(default=timezone.now)
    cantidad_ml = models.IntegerField(default=0)
    meta_ml = models.IntegerField(default=2000)

    class Meta:
        db_table = 'registros_agua'
        verbose_name = 'Registro de Agua'
        verbose_name_plural = 'Registros de Agua'
        constraints = [
            models.UniqueConstraint(fields=['usuario', 'fecha'], name='unique_usuario_fecha_agua')
        ]

    def __str__(self):
        return f"Agua {self.usuario.nombre} - {self.fecha}: {self.cantidad_ml}/{self.meta_ml}ml"


class Alergia(models.Model):
    id_alergia = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column='id_usuario',
        related_name='alergias',
    )
    nombre = models.CharField(max_length=150)
    reemplazos = models.TextField(blank=True, default='')
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'alergias'
        verbose_name = 'Alergia'
        verbose_name_plural = 'Alergias'
        ordering = ['-fecha_registro']

    def __str__(self):
        return f"{self.nombre} ({self.usuario.nombre})"
