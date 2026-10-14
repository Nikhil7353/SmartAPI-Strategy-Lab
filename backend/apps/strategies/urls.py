from django.urls import path
from . import views

urlpatterns = [
    path('evaluate/', views.evaluate_strategy, name='strategy-evaluate'),
    path('decision/', views.evaluate_decision, name='strategy-decision'),
    path('outcomes/', views.setup_outcomes, name='strategy-outcomes'),
]
