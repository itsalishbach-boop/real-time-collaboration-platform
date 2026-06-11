from django.urls import path
from .views import (
    WorkspaceListCreateView, WorkspaceDetailView,
    JoinWorkspaceView, LeaveWorkspaceView, WorkspaceMembersView
)

urlpatterns = [
    path('', WorkspaceListCreateView.as_view(), name='workspace_list'),
    path('<uuid:pk>/', WorkspaceDetailView.as_view(), name='workspace_detail'),
    path('join/', JoinWorkspaceView.as_view(), name='workspace_join'),
    path('<uuid:pk>/leave/', LeaveWorkspaceView.as_view(), name='workspace_leave'),
    path('<uuid:pk>/members/', WorkspaceMembersView.as_view(), name='workspace_members'),
]
