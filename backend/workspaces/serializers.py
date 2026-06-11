from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Workspace, WorkspaceMember

User = get_user_model()


class MemberSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='user.id')
    email = serializers.EmailField(source='user.email')
    username = serializers.CharField(source='user.username')
    is_online = serializers.BooleanField(source='user.is_online')
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = WorkspaceMember
        fields = ['id', 'email', 'username', 'is_online', 'avatar_url', 'role', 'joined_at']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.user.avatar and request:
            return request.build_absolute_uri(obj.user.avatar.url)
        return None


class WorkspaceSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    member_count = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = ['id', 'name', 'description', 'invite_code', 'owner_id', 'owner_name',
                  'member_count', 'is_owner', 'created_at']
        read_only_fields = ['id', 'invite_code', 'created_at']

    def get_member_count(self, obj):
        return obj.members.count()

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request:
            return obj.owner == request.user
        return False

    def create(self, validated_data):
        user = self.context['request'].user
        workspace = Workspace.objects.create(owner=user, **validated_data)
        WorkspaceMember.objects.create(workspace=workspace, user=user, role='admin')
        return workspace


class WorkspaceDetailSerializer(WorkspaceSerializer):
    members = MemberSerializer(source='memberships', many=True, read_only=True)

    class Meta(WorkspaceSerializer.Meta):
        fields = WorkspaceSerializer.Meta.fields + ['members']
