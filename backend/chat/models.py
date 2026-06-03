import uuid
from django.db import models
from django.conf import settings


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey('workspaces.Workspace', on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sent_messages')
    content = models.TextField()
    file = models.FileField(upload_to='chat_files/', null=True, blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    message_type = models.CharField(max_length=10, choices=[('text', 'Text'), ('file', 'File')], default='text')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender} @ {self.workspace}: {self.content[:50]}'
