"""
GraphQL schema for Monarch Learning Platform (2025 best practices)
"""
import graphene
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField

from content.models import EducationalContent
from students.models import Assessment, KnowledgeGap, StudentProfile, User
from tutoring.models import Conversation, Message


class UserType(DjangoObjectType):
    """GraphQL type for User"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'date_joined')
        filter_fields = ['role', 'is_active']
        interfaces = (graphene.relay.Node,)


class StudentProfileType(DjangoObjectType):
    """GraphQL type for StudentProfile"""
    class Meta:
        model = StudentProfile
        fields = '__all__'
        interfaces = (graphene.relay.Node,)


class AssessmentType(DjangoObjectType):
    """GraphQL type for Assessment"""
    class Meta:
        model = Assessment
        fields = '__all__'
        filter_fields = ['subject', 'student']
        interfaces = (graphene.relay.Node,)


class KnowledgeGapType(DjangoObjectType):
    """GraphQL type for KnowledgeGap"""
    class Meta:
        model = KnowledgeGap
        fields = '__all__'
        filter_fields = ['subject', 'resolved', 'student']
        interfaces = (graphene.relay.Node,)


class EducationalContentType(DjangoObjectType):
    """GraphQL type for EducationalContent"""
    class Meta:
        model = EducationalContent
        fields = '__all__'
        filter_fields = ['subject', 'difficulty', 'indexed']
        interfaces = (graphene.relay.Node,)


class ConversationType(DjangoObjectType):
    """GraphQL type for Conversation"""
    class Meta:
        model = Conversation
        fields = '__all__'
        filter_fields = ['subject', 'student']
        interfaces = (graphene.relay.Node,)


class MessageType(DjangoObjectType):
    """GraphQL type for Message"""
    class Meta:
        model = Message
        fields = '__all__'
        interfaces = (graphene.relay.Node,)


class Query(graphene.ObjectType):
    """GraphQL queries"""
    # User queries
    user = graphene.relay.Node.Field(UserType)
    users = DjangoFilterConnectionField(UserType)

    # Assessment queries
    assessment = graphene.relay.Node.Field(AssessmentType)
    assessments = DjangoFilterConnectionField(AssessmentType)

    # Knowledge gap queries
    knowledge_gap = graphene.relay.Node.Field(KnowledgeGapType)
    knowledge_gaps = DjangoFilterConnectionField(KnowledgeGapType)

    # Content queries
    educational_content = graphene.relay.Node.Field(EducationalContentType)
    educational_contents = DjangoFilterConnectionField(EducationalContentType)

    # Conversation queries
    conversation = graphene.relay.Node.Field(ConversationType)
    conversations = DjangoFilterConnectionField(ConversationType)


schema = graphene.Schema(query=Query)

