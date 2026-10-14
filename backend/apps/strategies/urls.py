from django.urls import path
from . import views

urlpatterns = [
    path('evaluate/', views.evaluate_strategy, name='strategy-evaluate'),
]
