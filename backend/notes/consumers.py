import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class NoteConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.note_id = self.scope['url_route']['kwargs']['note_id']
        self.room_group_name = f'note_{self.note_id}'
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        if not await self.can_access_note():
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        note = await self.get_note()
        await self.send(text_data=json.dumps({
            'type': 'note_init',
            'note': {
                'id': str(note.id),
                'title': note.title,
                'content': note.content,
                'updated_at': note.updated_at.isoformat(),
            }
        }))

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'user_joined_note',
            'user_id': self.user.id,
            'username': self.user.username,
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'user_left_note',
                'user_id': self.user.id,
                'username': self.user.username,
            })
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type')

        if msg_type == 'note_update':
            title = data.get('title')
            content = data.get('content')
            await self.save_note(title, content)
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'note_updated',
                'title': title,
                'content': content,
                'updated_by_id': self.user.id,
                'updated_by_name': self.user.username,
            })

        elif msg_type == 'cursor_move':
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'cursor_position',
                'user_id': self.user.id,
                'username': self.user.username,
                'position': data.get('position', 0),
            })

    async def note_updated(self, event):
        if event['updated_by_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'note_update',
                'title': event['title'],
                'content': event['content'],
                'updated_by_name': event['updated_by_name'],
            }))

    async def cursor_position(self, event):
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'cursor_move',
                'user_id': event['user_id'],
                'username': event['username'],
                'position': event['position'],
            }))

    async def user_joined_note(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user_id': event['user_id'],
            'username': event['username'],
        }))

    async def user_left_note(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user_id': event['user_id'],
            'username': event['username'],
        }))

    @database_sync_to_async
    def can_access_note(self):
        from .models import Note
        return Note.objects.filter(id=self.note_id, workspace__members=self.user).exists()

    @database_sync_to_async
    def get_note(self):
        from .models import Note
        return Note.objects.get(id=self.note_id)

    @database_sync_to_async
    def save_note(self, title, content):
        from .models import Note, NoteVersion
        from django.utils import timezone
        import datetime
        note = Note.objects.get(id=self.note_id)
        new_title = title if title is not None else note.title
        new_content = content if content is not None else note.content
        content_changed = (new_title != note.title or new_content != note.content)
        # Only snapshot a version when content actually changed
        if content_changed:
            last_version = NoteVersion.objects.filter(note=note).order_by('-created_at').first()
            # Throttle: don't create a version if one was created in the last 30 seconds
            threshold = timezone.now() - datetime.timedelta(seconds=30)
            if not last_version or last_version.created_at < threshold:
                NoteVersion.objects.create(
                    note=note,
                    title=note.title,
                    content=note.content,
                    edited_by=self.user,
                )
        note.title = new_title
        note.content = new_content
        note.last_edited_by = self.user
        note.save()
        return note
