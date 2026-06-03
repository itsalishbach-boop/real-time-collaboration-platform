from django.urls import path
from .views import NotificationListView, MarkNotificationsReadView, UnreadCountView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications'),
    path('mark-read/', MarkNotificationsReadView.as_view(), name='mark_read'),
    path('unread-count/', UnreadCountView.as_view(), name='unread_count'),
]
