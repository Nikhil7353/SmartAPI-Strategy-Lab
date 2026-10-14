from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/market/', include('apps.market.urls')),
    path('api/strategies/', include('apps.strategies.urls')),
    path('api/backtesting/', include('apps.backtesting.urls')),
    path('api/paper/', include('apps.paper_trading.urls')),
]
