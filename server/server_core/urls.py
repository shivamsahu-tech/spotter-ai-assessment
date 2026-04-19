from django.urls import path
from . import views

urlpatterns = [
    path('api/calculate-trip/', views.calculate_trip, name='calculate_trip'),
    path('api/generate-logbook/', views.generate_logbook, name='generate_logbook'),
]
