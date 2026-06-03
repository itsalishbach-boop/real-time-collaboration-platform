from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def push_notification(user_id: int, notification_data: dict):
    """Send a notification dict to a user's personal WS channel."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{user_id}',
        {
            'type': 'send_notification',
            'notification': notification_data,
        }
    )
