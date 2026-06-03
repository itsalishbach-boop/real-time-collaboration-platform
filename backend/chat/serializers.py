from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'workspace', 'sender_id', 'sender_name', 'sender_email',
                  'avatar_url', 'content', 'file_url', 'file_name', 'message_type', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.sender and obj.sender.avatar and request:
            return request.build_absolute_uri(obj.sender.avatar.url)
        return None

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
