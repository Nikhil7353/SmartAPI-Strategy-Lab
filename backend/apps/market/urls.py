from django.urls import path
from . import views

urlpatterns = [
    path('auth/status/', views.auth_status, name='market-auth-status'),
    path('auth/login/', views.auth_login, name='market-auth-login'),
    path('quotes/', views.quotes, name='market-quotes'),
    path('candles/', views.candles, name='market-candles'),
    path('instruments/search/', views.instrument_search, name='market-instrument-search'),
]
