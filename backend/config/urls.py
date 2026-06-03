from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/workspaces/', include('workspaces.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/notes/', include('notes.urls')),
    path('api/notifications/', include('notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
