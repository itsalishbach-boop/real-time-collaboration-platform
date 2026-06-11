from django.urls import path
from .views import MessageListView, FileUploadView

urlpatterns = [
    path('<uuid:workspace_id>/messages/', MessageListView.as_view(), name='message_list'),
    path('<uuid:workspace_id>/upload/', FileUploadView.as_view(), name='file_upload'),
]
