from django.urls import path
from . import views

urlpatterns = [
    path('account/', views.paper_account, name='paper-account'),
    path('positions/', views.paper_positions, name='paper-positions'),
    path('orders/', views.paper_orders, name='paper-orders'),
    path('journal/', views.paper_journal, name='paper-journal'),
]
