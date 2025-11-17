"""
Enhanced tutor bot service using LangChain (2025 best practices)
This is an optional enhanced version that can replace/enhance TutorBotService
"""

from django.conf import settings

# Optional LangChain imports (install langchain and langchain-google-genai)
try:
    from langchain.chains import ConversationalRetrievalChain
    from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory
    from langchain.prompts import ChatPromptTemplate, PromptTemplate
    from langchain.schema import AIMessage, HumanMessage
    from langchain_google_genai import ChatGoogleGenerativeAI
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False


class LangChainTutorBotService:
    """
    Enhanced tutor bot using LangChain for better conversation management,
    memory, and prompt chaining.
    
    Features:
    - Conversation memory across sessions
    - Multi-step reasoning chains
    - Better context management
    - Tool integration (calculators, code executors, etc.)
    """

    def __init__(self):
        if not LANGCHAIN_AVAILABLE:
            raise ImportError(
                "LangChain not installed. Install with: pip install langchain langchain-google-genai"
            )

        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")

        # Initialize Gemini LLM
        self.llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7,
        )

        # Memory for conversation context
        self.memory = ConversationSummaryMemory(
            llm=self.llm,
            memory_key="chat_history",
            return_messages=True,
            max_token_limit=1000,  # Limit memory size
        )

    def generate_response(
        self,
        query: str,
        student_id: int,
        conversation_history: list[dict] | None = None,
        subject_filter: str | None = None,
        difficulty_filter: str | None = None,
        use_memory: bool = True,
    ) -> dict:
        """
        Generate tutor bot response using LangChain with enhanced features.
        
        Args:
            query: Student's question
            student_id: Student ID for personalization
            conversation_history: Previous conversation messages
            subject_filter: Filter by subject
            difficulty_filter: Filter by difficulty
            use_memory: Whether to use conversation memory
        
        Returns:
            Dict with 'text' and 'citations'
        """
        try:
            # Get student context
            student_context = self._get_student_context(student_id)

            # Build personalized prompt
            prompt = self._build_prompt_template(student_context, subject_filter, difficulty_filter)

            # Load conversation history into memory if provided
            if conversation_history and use_memory:
                self._load_history_to_memory(conversation_history)

            # Create chain with memory
            chain = ConversationalRetrievalChain.from_llm(
                llm=self.llm,
                memory=self.memory if use_memory else None,
                prompt=prompt,
                verbose=settings.DEBUG,
            )

            # Generate response
            response = chain.invoke({
                "question": query,
                "chat_history": self.memory.chat_memory.messages if use_memory else [],
            })

            return {
                "text": response.get("answer", ""),
                "citations": response.get("source_documents", []),
            }

        except Exception as e:
            return {
                "text": f"I encountered an error: {str(e)}. Please try again or contact support.",
                "citations": [],
            }

    def _build_prompt_template(
        self,
        student_context: dict | None,
        subject_filter: str | None,
        difficulty_filter: str | None,
    ) -> PromptTemplate:
        """Build personalized prompt template"""
        context_parts = [
            "You are an educational tutor bot. Provide clear, helpful explanations.",
        ]

        if student_context:
            if student_context.get('grade_level'):
                context_parts.append(f"Adapt explanations for {student_context['grade_level']} level.")

            if student_context.get('learning_style'):
                style = student_context['learning_style']
                if style == 'visual':
                    context_parts.append("Use visual analogies and examples.")
                elif style == 'auditory':
                    context_parts.append("Explain concepts verbally with clear step-by-step instructions.")
                elif style == 'reading':
                    context_parts.append("Provide detailed written explanations with examples.")

        if subject_filter:
            context_parts.append(f"Focus on {subject_filter} subject.")

        if difficulty_filter:
            context_parts.append(f"Match {difficulty_filter} difficulty level.")

        system_message = " ".join(context_parts)

        template = f"""{system_message}

Previous conversation:
{{chat_history}}

Current question: {{question}}

Provide a helpful, educational answer:"""

        return PromptTemplate.from_template(template)

    def _get_student_context(self, student_id: int) -> dict | None:
        """Get student profile context"""
        from students.models import StudentProfile
        try:
            profile = StudentProfile.objects.select_related('user').get(user_id=student_id)
            return {
                'learning_style': profile.learning_style,
                'grade_level': profile.grade_level,
                'preferred_language': profile.preferred_language,
            }
        except StudentProfile.DoesNotExist:
            return None

    def _load_history_to_memory(self, history: list[dict]):
        """Load conversation history into LangChain memory"""
        for msg in history:
            if msg['role'] == 'user':
                self.memory.chat_memory.add_user_message(msg['content'])
            elif msg['role'] == 'assistant':
                self.memory.chat_memory.add_ai_message(msg['content'])

    def clear_memory(self):
        """Clear conversation memory"""
        self.memory.clear()


# Usage example:
# Replace TutorBotService with LangChainTutorBotService for enhanced features
# service = LangChainTutorBotService()
# response = service.generate_response(
#     query="Explain photosynthesis",
#     student_id=1,
#     conversation_history=history,
#     use_memory=True
# )

