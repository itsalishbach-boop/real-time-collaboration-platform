from django.urls import re_path
from .consumers import PresenceConsumer, WorkspacePresenceConsumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', PresenceConsumer.as_asgi()),
    re_path(r'ws/presence/(?P<workspace_id>[0-9a-f-]+)/$', WorkspacePresenceConsumer.as_asgi()),
]
