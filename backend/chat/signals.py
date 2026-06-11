from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='chat.Message')
def notify_on_new_message(sender, instance, created, **kwargs):
    if not created:
        return
    from notifications.models import Notification
    from notifications.utils import push_notification

    workspace = instance.workspace
    sender_user = instance.sender
    if sender_user is None:
        return

    members = workspace.members.exclude(id=sender_user.id)
    for member in members:
        notif = Notification.objects.create(
            recipient=member,
            sender=sender_user,
            notification_type='message',
            title=f'New message in {workspace.name}',
            message=f'{sender_user.username}: {instance.content[:80]}',
            workspace_id=workspace.id,
        )
        push_notification(member.id, {
            'id': str(notif.id),
            'notification_type': notif.notification_type,
            'title': notif.title,
            'message': notif.message,
            'workspace_id': str(workspace.id),
            'sender_name': sender_user.username,
            'is_read': False,
            'created_at': notif.created_at.isoformat(),
        })
