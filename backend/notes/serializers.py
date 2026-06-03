from rest_framework import serializers
from .models import Note, NoteVersion


class NoteVersionSerializer(serializers.ModelSerializer):
    edited_by_name = serializers.CharField(source='edited_by.username', read_only=True)

    class Meta:
        model = NoteVersion
        fields = ['id', 'title', 'content', 'edited_by_name', 'created_at']


class NoteSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    last_edited_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = ['id', 'workspace', 'title', 'content', 'created_by_name',
                  'last_edited_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'workspace', 'created_at', 'updated_at']

    def get_last_edited_by_name(self, obj):
        return obj.last_edited_by.username if obj.last_edited_by else None

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
