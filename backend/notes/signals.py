from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='notes.NoteVersion')
def notify_on_note_update(sender, instance, created, **kwargs):
    if not created:
        return
    from notifications.models import Notification
    from notifications.utils import push_notification

    note = instance.note
    editor = instance.edited_by
    if editor is None:
        return

    workspace = note.workspace
    members = workspace.members.exclude(id=editor.id)
    for member in members:
        notif = Notification.objects.create(
            recipient=member,
            sender=editor,
            notification_type='note_update',
            title=f'Note updated in {workspace.name}',
            message=f'{editor.username} edited "{note.title}"',
            workspace_id=workspace.id,
        )
        push_notification(member.id, {
            'id': str(notif.id),
            'notification_type': notif.notification_type,
            'title': notif.title,
            'message': notif.message,
            'workspace_id': str(workspace.id),
            'sender_name': editor.username,
            'is_read': False,
            'created_at': notif.created_at.isoformat(),
        })
