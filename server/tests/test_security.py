"""Tests for security utilities."""

from datetime import timedelta

import pytest
from fastapi import HTTPException

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
    verify_token_type,
)


class TestPasswordHashing:
    def test_hash_password_returns_string(self):
        result = hash_password("TestPassword123")
        assert isinstance(result, str)
        assert result != "TestPassword123"

    def test_verify_password_correct(self):
        hashed = hash_password("MySecurePass!")
        assert verify_password("MySecurePass!", hashed) is True

    def test_verify_password_incorrect(self):
        hashed = hash_password("MySecurePass!")
        assert verify_password("WrongPassword", hashed) is False

    def test_hash_password_different_salts(self):
        hash1 = hash_password("SamePassword")
        hash2 = hash_password("SamePassword")
        assert hash1 != hash2  # Different salts

    def test_password_truncation_at_72_bytes(self):
        long_pass = "A" * 100
        hashed = hash_password(long_pass)
        # Both should verify since bcrypt truncates at 72
        assert verify_password(long_pass, hashed) is True


class TestJWTTokens:
    def test_create_access_token(self):
        token = create_access_token(data={"sub": "123"})
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_access_token(self):
        token = create_access_token(data={"sub": "123"})
        payload = decode_token(token)
        assert payload["sub"] == "123"
        assert payload["type"] == "access"

    def test_create_refresh_token(self):
        token = create_refresh_token(data={"sub": "456"})
        payload = decode_token(token)
        assert payload["sub"] == "456"
        assert payload["type"] == "refresh"

    def test_token_with_custom_expiry(self):
        token = create_access_token(
            data={"sub": "123"},
            expires_delta=timedelta(hours=1),
        )
        payload = decode_token(token)
        assert payload["sub"] == "123"

    def test_decode_invalid_token_raises(self):
        with pytest.raises(HTTPException) as exc_info:
            decode_token("invalid.token.here")
        assert exc_info.value.status_code == 401

    def test_verify_token_type_correct(self):
        token = create_access_token(data={"sub": "123"})
        payload = decode_token(token)
        verify_token_type(payload, "access")  # Should not raise

    def test_verify_token_type_wrong(self):
        token = create_access_token(data={"sub": "123"})
        payload = decode_token(token)
        with pytest.raises(HTTPException) as exc_info:
            verify_token_type(payload, "refresh")
        assert exc_info.value.status_code == 401
