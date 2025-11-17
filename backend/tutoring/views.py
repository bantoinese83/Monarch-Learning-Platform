from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from .services import TutorBotService


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.by_student(self.request.user.id)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message to the tutor bot and get response"""
        conversation = self.get_object()
        query = request.data.get('message', '').strip()

        if not query:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get conversation history (optimized - already prefetched)
        if hasattr(conversation, 'recent_messages'):
            messages = conversation.recent_messages[:20]
        else:
            messages = list(Message.objects.by_conversation(conversation.id).order_by('created_at')[:20])

        history = [
            {'role': msg.role, 'content': msg.content}
            for msg in messages
        ]

        # Get optional filters
        subject_filter = request.data.get('subject')
        difficulty_filter = request.data.get('difficulty')

        # Generate response
        tutor_service = TutorBotService()
        response_data = tutor_service.generate_response(
            query=query,
            student_id=request.user.id,
            conversation_history=history,
            subject_filter=subject_filter,
            difficulty_filter=difficulty_filter
        )

        # Save both messages atomically
        with transaction.atomic():
            user_message = Message.objects.create(
                conversation=conversation,
                role='user',
                content=query
            )

            assistant_message = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=response_data['text'],
                citations=response_data.get('citations', [])
            )

        # Update conversation title if it's the first message
        if not conversation.title:
            # Generate title from first message (truncated)
            conversation.title = query[:50] + ('...' if len(query) > 50 else '')
            conversation.save()

        return Response({
            'user_message': MessageSerializer(user_message).data,
            'assistant_message': MessageSerializer(assistant_message).data,
        })


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.request.query_params.get('conversation')
        if conversation_id:
            return Message.objects.by_conversation(conversation_id).filter(
                conversation__student=self.request.user
            )
        return Message.objects.by_student(self.request.user.id)

