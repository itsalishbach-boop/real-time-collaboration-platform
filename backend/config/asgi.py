import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from chat.middleware import JWTAuthMiddleware
import chat.routing
import notes.routing
import notifications.routing

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': JWTAuthMiddleware(
        URLRouter(
            chat.routing.websocket_urlpatterns +
            notes.routing.websocket_urlpatterns +
            notifications.routing.websocket_urlpatterns
        )
    ),
})
