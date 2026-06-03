from rest_framework import generics, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Note, NoteVersion
from .serializers import NoteSerializer, NoteVersionSerializer
from workspaces.models import Workspace


class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        workspace_id = self.kwargs['workspace_id']
        workspace = get_object_or_404(Workspace, id=workspace_id, members=self.request.user)
        return Note.objects.filter(workspace=workspace)

    def perform_create(self, serializer):
        workspace_id = self.kwargs['workspace_id']
        workspace = get_object_or_404(Workspace, id=workspace_id, members=self.request.user)
        serializer.save(workspace=workspace, created_by=self.request.user)


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(workspace__members=self.request.user)

    def perform_update(self, serializer):
        note = self.get_object()
        new_title = serializer.validated_data.get('title', note.title)
        new_content = serializer.validated_data.get('content', note.content)
        if new_title != note.title or new_content != note.content:
            NoteVersion.objects.create(
                note=note,
                title=note.title,
                content=note.content,
                edited_by=self.request.user,
            )
        serializer.save(last_edited_by=self.request.user)


class NoteVersionListView(generics.ListAPIView):
    serializer_class = NoteVersionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        note_id = self.kwargs['note_id']
        note = get_object_or_404(Note, id=note_id, workspace__members=self.request.user)
        return NoteVersion.objects.filter(note=note)
