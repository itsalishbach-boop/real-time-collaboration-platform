import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class PresenceConsumer(AsyncWebsocketConsumer):
    """Handles per-user notification delivery and online presence tracking."""

    async def connect(self):
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        self.user_group = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()

        await self.set_online(True)
        await self.broadcast_presence(True)

    async def disconnect(self, close_code):
        if hasattr(self, 'user_group'):
            await self.set_online(False)
            await self.broadcast_presence(False)
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

    async def receive(self, text_data):
        pass

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification'],
        }))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_online': event['is_online'],
        }))

    @database_sync_to_async
    def set_online(self, status):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.filter(id=self.user.id).update(
            is_online=status,
            last_seen=timezone.now(),
        )

    @database_sync_to_async
    def get_workspace_ids(self):
        return list(self.user.workspaces.values_list('id', flat=True))

    async def broadcast_presence(self, is_online):
        workspace_ids = await self.get_workspace_ids()
        for workspace_id in workspace_ids:
            await self.channel_layer.group_send(
                f'workspace_presence_{workspace_id}',
                {
                    'type': 'presence_update',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'is_online': is_online,
                }
            )


class WorkspacePresenceConsumer(AsyncWebsocketConsumer):
    """Broadcasts presence events to all members of a workspace."""

    async def connect(self):
        self.workspace_id = self.scope['url_route']['kwargs']['workspace_id']
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        if not await self.is_member():
            await self.close()
            return

        self.group_name = f'workspace_presence_{self.workspace_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        online_members = await self.get_online_members()
        await self.send(text_data=json.dumps({
            'type': 'online_members',
            'members': online_members,
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_online': event['is_online'],
        }))

    @database_sync_to_async
    def is_member(self):
        from workspaces.models import Workspace
        return Workspace.objects.filter(id=self.workspace_id, members=self.user).exists()

    @database_sync_to_async
    def get_online_members(self):
        from workspaces.models import WorkspaceMember
        members = WorkspaceMember.objects.filter(
            workspace_id=self.workspace_id
        ).select_related('user')
        return [
            {'user_id': m.user.id, 'username': m.user.username, 'is_online': m.user.is_online}
            for m in members
        ]
