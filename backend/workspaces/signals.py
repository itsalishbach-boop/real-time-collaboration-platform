from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='workspaces.WorkspaceMember')
def notify_on_workspace_join(sender, instance, created, **kwargs):
    if not created:
        return
    from notifications.models import Notification
    from notifications.utils import push_notification

    workspace = instance.workspace
    new_member = instance.user

    # Notify everyone already in workspace (except the joining user)
    existing = workspace.members.exclude(id=new_member.id)
    for member in existing:
        notif = Notification.objects.create(
            recipient=member,
            sender=new_member,
            notification_type='workspace_join',
            title=f'{new_member.username} joined {workspace.name}',
            message=f'{new_member.username} has joined the workspace.',
            workspace_id=workspace.id,
        )
        push_notification(member.id, {
            'id': str(notif.id),
            'notification_type': notif.notification_type,
            'title': notif.title,
            'message': notif.message,
            'workspace_id': str(workspace.id),
            'sender_name': new_member.username,
            'is_read': False,
            'created_at': notif.created_at.isoformat(),
        })
