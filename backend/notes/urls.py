from django.urls import path
from .views import NoteListCreateView, NoteDetailView, NoteVersionListView

urlpatterns = [
    path('<uuid:workspace_id>/', NoteListCreateView.as_view(), name='note_list'),
    path('detail/<uuid:pk>/', NoteDetailView.as_view(), name='note_detail'),
    path('detail/<uuid:note_id>/versions/', NoteVersionListView.as_view(), name='note_versions'),
]
