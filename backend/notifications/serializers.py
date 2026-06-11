from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'workspace_id',
                  'sender_name', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
