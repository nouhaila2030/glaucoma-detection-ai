# backend/uploads/tests/test_security.py
"""
Tests unitaires du module de sécurité médicale.
  - Chiffrement / déchiffrement AES-256 (Fernet)
  - Audit logger JSON (format, rotation par date, actions)

Lancer : python -m pytest tests/test_security.py -v
"""

import json
import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

import pytest

# Ajoute le dossier parent au path pour importer security_manager
sys.path.insert(0, str(Path(__file__).parent.parent))

from security_manager import (
    SecurityLogger,
    encrypt_bytes,
    decrypt_bytes,
    encrypt_file,
    decrypt_file,
)


# ─────────────────────────────────────────────────────────────
# 1. Tests chiffrement / déchiffrement en mémoire
# ─────────────────────────────────────────────────────────────

class TestEncryptionBytes:
    def test_encrypt_returns_bytes(self):
        data = b"image_medicale_test"
        result = encrypt_bytes(data)
        assert isinstance(result, bytes)

    def test_encrypted_differs_from_original(self):
        data = b"donnee_sensible"
        encrypted = encrypt_bytes(data)
        assert encrypted != data

    def test_decrypt_restores_original(self):
        original = b"fundus_image_patient_42"
        encrypted = encrypt_bytes(original)
        decrypted = decrypt_bytes(encrypted)
        assert decrypted == original

    def test_roundtrip_large_data(self):
        """Simule une image de ~50KB."""
        large_data = os.urandom(50_000)
        assert decrypt_bytes(encrypt_bytes(large_data)) == large_data

    def test_tampered_data_raises(self):
        """Toute modification du ciphertext doit lever une exception."""
        from cryptography.fernet import InvalidToken
        encrypted = encrypt_bytes(b"test")
        tampered = encrypted[:-5] + b"XXXXX"
        with pytest.raises((InvalidToken, Exception)):
            decrypt_bytes(tampered)


# ─────────────────────────────────────────────────────────────
# 2. Tests chiffrement / déchiffrement de fichier
# ─────────────────────────────────────────────────────────────

class TestEncryptionFile:
    def test_encrypt_creates_encrypted_file(self, tmp_path):
        src = tmp_path / "image.png"
        src.write_bytes(b"fake_png_data")
        enc_path = encrypt_file(str(src))
        assert enc_path.endswith(".encrypted")
        assert Path(enc_path).exists()
        assert not src.exists()  # original supprimé

    def test_decrypt_restores_file(self, tmp_path):
        original_data = b"retinal_image_bytes"
        src = tmp_path / "fundus.jpg"
        src.write_bytes(original_data)

        enc_path = encrypt_file(str(src))
        out_path = str(tmp_path / "fundus_restored.jpg")
        decrypt_file(enc_path, out_path)

        assert Path(out_path).read_bytes() == original_data

    def test_encrypt_nonexistent_file_raises(self):
        with pytest.raises(FileNotFoundError):
            encrypt_file("/nonexistent/path/image.png")


# ─────────────────────────────────────────────────────────────
# 3. Tests SecurityLogger (audit logs JSON)
# ─────────────────────────────────────────────────────────────

class TestSecurityLogger:
    @pytest.fixture
    def logger(self, tmp_path):
        """Crée un logger dans un dossier temporaire."""
        return SecurityLogger(logs_dir=str(tmp_path))

    def _read_last_entry(self, logs_dir: str) -> dict:
        today = datetime.utcnow().strftime("%Y%m%d")
        log_file = Path(logs_dir) / f"security_audit_{today}.log"
        assert log_file.exists(), f"Log file not found: {log_file}"
        lines = [l.strip() for l in log_file.read_text(encoding="utf-8").splitlines() if l.strip()]
        last_line = lines[-1]
        # Format: "2026-01-14 12:24:16 - INFO - {...}"
        parts = last_line.split(" - ", 2)
        return json.loads(parts[2])

    def test_log_action_creates_file(self, logger, tmp_path):
        logger.log_action("TEST_ACTION", user_email="test@example.com", user_id=1)
        today = datetime.utcnow().strftime("%Y%m%d")
        assert (tmp_path / f"security_audit_{today}.log").exists()

    def test_log_action_json_structure(self, logger, tmp_path):
        logger.log_action(
            "LOGIN",
            user_email="dr.martin@hopital.fr",
            user_id=42,
            ip_address="192.168.1.100",
            success=True,
            details={"login_attempt": True}
        )
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "LOGIN"
        assert entry["user_email"] == "dr.martin@hopital.fr"
        assert entry["user_id"] == 42
        assert entry["ip_address"] == "192.168.1.100"
        assert entry["success"] is True
        assert entry["details"]["login_attempt"] is True
        assert "timestamp" in entry

    def test_log_login_success(self, logger, tmp_path):
        logger.log_login("user@test.com", 1, "127.0.0.1", success=True)
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "LOGIN"
        assert entry["success"] is True

    def test_log_login_failure(self, logger, tmp_path):
        logger.log_login("hacker@evil.com", -1, "10.0.0.1", success=False)
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "LOGIN"
        assert entry["success"] is False

    def test_log_signup(self, logger, tmp_path):
        logger.log_signup("new@doc.fr", "127.0.0.1", success=True)
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "SIGNUP"

    def test_log_upload(self, logger, tmp_path):
        logger.log_upload("doc@h.fr", 1, "fundus.png", patient_id=42)
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "UPLOAD_IMAGE"
        assert entry["details"]["filename"] == "fundus.png"
        assert entry["details"]["patient_id"] == 42
        assert entry["details"]["file_type"] == "medical_image"

    def test_log_analysis(self, logger, tmp_path):
        logger.log_analysis("doc@h.fr", 1, "fundus.png", "Glaucome détecté", 0.92, 42)
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "ANALYZE_IMAGE"
        assert entry["details"]["confidence"] == 0.92
        assert "Glaucome" in entry["details"]["prediction"]

    def test_log_encryption_encrypt(self, logger, tmp_path):
        logger.log_encryption("doc@h.fr", 1, "encrypt", "fundus.png")
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "ENCRYPTION_ACTION"
        assert entry["details"]["encryption_action"] == "encrypt"

    def test_log_encryption_decrypt(self, logger, tmp_path):
        logger.log_encryption("doc@h.fr", 1, "decrypt", "fundus.png.encrypted")
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "ENCRYPTION_ACTION"
        assert entry["details"]["encryption_action"] == "decrypt"

    def test_log_delete(self, logger, tmp_path):
        logger.log_delete("doc@h.fr", 1, "fundus.png.encrypted")
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "DELETE_FILE"

    def test_log_report(self, logger, tmp_path):
        logger.log_report("doc@h.fr", 1, patient_id=5, report_type="PDF_Medical_Report")
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "GENERATE_REPORT"
        assert entry["details"]["report_type"] == "PDF_Medical_Report"

    def test_log_create_patient(self, logger, tmp_path):
        logger.log_create_patient("doc@h.fr", 1, "Jean Dupont", patient_id=99)
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "CREATE_PATIENT"
        assert entry["details"]["patient_name"] == "Jean Dupont"

    def test_log_security_violation(self, logger, tmp_path):
        logger.log_security_violation(
            ip="192.168.1.200",
            error="Tentative d'accès non autorisé",
            extra={"file": "patient_data.encrypted", "user_attempt": "unknown"}
        )
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "SECURITY_VIOLATION"
        assert entry["success"] is False
        assert "accès" in entry["details"]["error"]

    def test_log_access_denied(self, logger, tmp_path):
        logger.log_access_denied("doc@h.fr", 1, resource="patient/42", ip="127.0.0.1")
        entry = self._read_last_entry(str(tmp_path))
        assert entry["action_type"] == "ACCESS_DENIED"
        assert entry["success"] is False
        assert entry["details"]["resource"] == "patient/42"

    def test_multiple_entries_append(self, logger, tmp_path):
        """Vérifie que les entrées s'accumulent dans le même fichier."""
        for i in range(5):
            logger.log_action(f"ACTION_{i}", user_email=f"user{i}@test.com")
        today = datetime.utcnow().strftime("%Y%m%d")
        lines = [
            l for l in
            (tmp_path / f"security_audit_{today}.log").read_text(encoding="utf-8").splitlines()
            if l.strip()
        ]
        assert len(lines) == 5

    def test_timestamp_format(self, logger, tmp_path):
        """Le timestamp doit être au format ISO 8601."""
        logger.log_action("TIMESTAMP_TEST", user_email="t@t.com")
        entry = self._read_last_entry(str(tmp_path))
        # Doit parser sans exception
        datetime.fromisoformat(entry["timestamp"])
