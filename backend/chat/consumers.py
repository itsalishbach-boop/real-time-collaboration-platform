import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.workspace_id = self.scope['url_route']['kwargs']['workspace_id']
        self.room_group_name = f'chat_{self.workspace_id}'
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        if not await self.is_workspace_member():
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'user_join',
            'user_id': self.user.id,
            'username': self.user.username,
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'user_leave',
                'user_id': self.user.id,
                'username': self.user.username,
            })
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type', 'chat_message')

        if msg_type == 'chat_message':
            content = data.get('content', '').strip()
            if not content:
                return
            message = await self.save_message(content)
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'chat_message',
                'message': {
                    'id': str(message.id),
                    'sender_id': self.user.id,
                    'sender_name': self.user.username,
                    'content': message.content,
                    'message_type': 'text',
                    'created_at': message.created_at.isoformat(),
                }
            })

        elif msg_type == 'typing':
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_typing': data.get('is_typing', False),
            })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
        }))

    async def typing_indicator(self, event):
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing'],
            }))

    async def user_join(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_join',
            'user_id': event['user_id'],
            'username': event['username'],
        }))

    async def user_leave(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_leave',
            'user_id': event['user_id'],
            'username': event['username'],
        }))

    @database_sync_to_async
    def is_workspace_member(self):
        from workspaces.models import Workspace
        return Workspace.objects.filter(id=self.workspace_id, members=self.user).exists()

    @database_sync_to_async
    def save_message(self, content):
        from .models import Message
        from workspaces.models import Workspace
        workspace = Workspace.objects.get(id=self.workspace_id)
        return Message.objects.create(workspace=workspace, sender=self.user, content=content)
