from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from .models import Message
from .serializers import MessageSerializer
from workspaces.models import Workspace


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        workspace_id = self.kwargs['workspace_id']
        workspace = get_object_or_404(Workspace, id=workspace_id, members=self.request.user)
        return Message.objects.filter(workspace=workspace).select_related('sender').order_by('created_at')


class FileUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id, members=request.user)
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        message = Message.objects.create(
            workspace=workspace,
            sender=request.user,
            content=f'Shared a file: {file.name}',
            file=file,
            file_name=file.name,
            message_type='file',
        )
        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
