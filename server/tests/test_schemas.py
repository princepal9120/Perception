"""Tests for Pydantic request/response schemas."""

import pytest
from pydantic import ValidationError

from app.models.schemas import (
    ChatCreate,
    MessageCreate,
    UserSignup,
)


class TestUserSignup:
    def test_valid_signup(self):
        user = UserSignup(name="John", email="john@example.com", password="StrongPass1")
        assert user.name == "John"
        assert user.email == "john@example.com"

    def test_password_requires_uppercase(self):
        with pytest.raises(ValidationError, match="uppercase"):
            UserSignup(name="John", email="john@example.com", password="weakpass1")

    def test_password_requires_lowercase(self):
        with pytest.raises(ValidationError, match="lowercase"):
            UserSignup(name="John", email="john@example.com", password="STRONGPASS1")

    def test_password_requires_digit(self):
        with pytest.raises(ValidationError, match="digit"):
            UserSignup(name="John", email="john@example.com", password="StrongPass")

    def test_password_min_length(self):
        with pytest.raises(ValidationError):
            UserSignup(name="John", email="john@example.com", password="Ab1")

    def test_invalid_email(self):
        with pytest.raises(ValidationError):
            UserSignup(name="John", email="not-an-email", password="StrongPass1")

    def test_name_too_short(self):
        with pytest.raises(ValidationError):
            UserSignup(name="J", email="john@example.com", password="StrongPass1")


class TestChatCreate:
    def test_valid_chat(self):
        chat = ChatCreate(title="My Chat")
        assert chat.title == "My Chat"

    def test_empty_title(self):
        with pytest.raises(ValidationError):
            ChatCreate(title="")

    def test_title_too_long(self):
        with pytest.raises(ValidationError):
            ChatCreate(title="x" * 256)


class TestMessageCreate:
    def test_valid_message(self):
        msg = MessageCreate(content="Hello!")
        assert msg.content == "Hello!"

    def test_empty_content(self):
        with pytest.raises(ValidationError):
            MessageCreate(content="")

    def test_content_max_length(self):
        with pytest.raises(ValidationError):
            MessageCreate(content="x" * 10001)
