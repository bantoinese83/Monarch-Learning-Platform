"""
WebSocket consumer for real-time tutor bot
"""
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import Conversation, Message
from .services import TutorBotService


class TutorBotConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        self.conversation_id = None
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'new_conversation':
                await self.handle_new_conversation(data)
            elif message_type == 'message':
                await self.handle_message(data)
            else:
                await self.send_error('Unknown message type')

        except json.JSONDecodeError:
            await self.send_error('Invalid JSON')
        except Exception as e:
            await self.send_error(f'Error: {str(e)}')

    async def handle_new_conversation(self, data):
        """Create a new conversation"""
        conversation = await self.create_conversation()
        self.conversation_id = conversation.id

        await self.send(text_data=json.dumps({
            'type': 'conversation_created',
            'conversation_id': conversation.id,
        }))

    async def handle_message(self, data):
        """Handle incoming message and generate response"""
        if not self.conversation_id:
            # Create conversation if none exists
            conversation = await self.create_conversation()
            self.conversation_id = conversation.id

        query = data.get('message', '').strip()
        if not query:
            await self.send_error('Message is required')
            return

        # Save user message
        user_message = await self.save_message('user', query)

        # Send user message back for UI
        await self.send(text_data=json.dumps({
            'type': 'user_message',
            'message': {
                'id': user_message['id'],
                'role': 'user',
                'content': query,
                'created_at': user_message['created_at'],
            }
        }))

        # Get conversation history
        history = await self.get_conversation_history()

        # Generate response (async wrapper for sync service)
        response_data = await self.generate_response(
            query=query,
            history=history,
            subject_filter=data.get('subject'),
            difficulty_filter=data.get('difficulty')
        )

        # Save assistant response
        assistant_message = await self.save_message(
            'assistant',
            response_data['text'],
            response_data.get('citations', [])
        )

        # Send assistant response
        await self.send(text_data=json.dumps({
            'type': 'assistant_message',
            'message': {
                'id': assistant_message['id'],
                'role': 'assistant',
                'content': response_data['text'],
                'citations': response_data.get('citations', []),
                'created_at': assistant_message['created_at'],
            }
        }))

    @database_sync_to_async
    def create_conversation(self):
        """Create a new conversation"""
        from django.db import transaction
        with transaction.atomic():
            return Conversation.objects.create(student=self.user)

    @database_sync_to_async
    def save_message(self, role, content, citations=None):
        """Save a message to the conversation"""
        from django.db import transaction
        with transaction.atomic():
            message = Message.objects.create(
                conversation_id=self.conversation_id,
                role=role,
                content=content,
                citations=citations or []
            )
            return {
                'id': message.id,
                'created_at': message.created_at.isoformat(),
            }

    @database_sync_to_async
    def get_conversation_history(self):
        """Get conversation history"""
        messages = list(Message.objects.by_conversation(self.conversation_id).order_by('created_at')[:20])

        return [
            {'role': msg.role, 'content': msg.content}
            for msg in messages
        ]

    async def generate_response(self, query, history, subject_filter=None, difficulty_filter=None):
        """Generate tutor bot response"""
        tutor_service = TutorBotService()
        return tutor_service.generate_response(
            query=query,
            student_id=self.user.id,
            conversation_history=history,
            subject_filter=subject_filter,
            difficulty_filter=difficulty_filter
        )

    async def send_error(self, error_message):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': error_message,
        }))

