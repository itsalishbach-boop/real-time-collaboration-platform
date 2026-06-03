import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        ('message', 'New Message'),
        ('workspace_join', 'Workspace Join'),
        ('note_update', 'Note Update'),
        ('mention', 'Mention'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    workspace_id = models.UUIDField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.notification_type} for {self.recipient}'
