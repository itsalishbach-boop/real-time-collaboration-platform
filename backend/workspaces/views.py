from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Workspace, WorkspaceMember
from .serializers import WorkspaceSerializer, WorkspaceDetailSerializer


class WorkspaceListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkspaceSerializer

    def get_queryset(self):
        return self.request.user.workspaces.all().order_by('-memberships__joined_at').distinct()


class WorkspaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkspaceDetailSerializer

    def get_queryset(self):
        return self.request.user.workspaces.all()

    def destroy(self, request, *args, **kwargs):
        workspace = self.get_object()
        if workspace.owner != request.user:
            return Response({'detail': 'Only the owner can delete this workspace.'}, status=status.HTTP_403_FORBIDDEN)
        workspace.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class JoinWorkspaceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        invite_code = request.data.get('invite_code')
        workspace = get_object_or_404(Workspace, invite_code=invite_code)
        if WorkspaceMember.objects.filter(workspace=workspace, user=request.user).exists():
            return Response({'detail': 'Already a member.'}, status=status.HTTP_400_BAD_REQUEST)
        WorkspaceMember.objects.create(workspace=workspace, user=request.user)
        return Response(WorkspaceSerializer(workspace, context={'request': request}).data, status=status.HTTP_200_OK)


class LeaveWorkspaceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        workspace = get_object_or_404(Workspace, pk=pk, members=request.user)
        if workspace.owner == request.user:
            return Response({'detail': 'Owner cannot leave. Transfer ownership or delete the workspace.'}, status=status.HTTP_400_BAD_REQUEST)
        WorkspaceMember.objects.filter(workspace=workspace, user=request.user).delete()
        return Response({'detail': 'Left workspace.'})


class WorkspaceMembersView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        workspace = get_object_or_404(Workspace, pk=pk, members=request.user)
        from .serializers import MemberSerializer
        members = WorkspaceMember.objects.filter(workspace=workspace).select_related('user')
        serializer = MemberSerializer(members, many=True, context={'request': request})
        return Response(serializer.data)
