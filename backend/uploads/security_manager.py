# backend/uploads/security_manager.py
"""
Module de sécurité médicale — GlaucomaAI
Implémente :
  - Chiffrement authentifié Fernet (AES-128-CBC + HMAC-SHA256)
    Note : Fernet utilise AES-128 en mode CBC avec une signature HMAC-SHA256,
    pas AES-256. Pour de l'AES-256, il faudrait utiliser AES-GCM 256 bits.
  - Gestion sécurisée des clés (env var → fichier .key → auto-génération)
  - Audit logs JSON (conformité RGPD)
"""

import os
import json
import logging
import base64
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

from cryptography.fernet import Fernet

# ─────────────────────────────────────────────────────────────
# 1. CONFIGURATION
# ─────────────────────────────────────────────────────────────

LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

KEY_FILE = Path(".encryption.key")


# ─────────────────────────────────────────────────────────────
# 2. GESTION DE LA CLÉ AES-256 (Fernet)
# ─────────────────────────────────────────────────────────────

def _load_or_generate_key() -> bytes:
    """
    Charge la clé Fernet depuis :
      1. La variable d'environnement FERNET_KEY (priorité production)
      2. Le fichier .encryption.key (développement local)
      3. Génère une nouvelle clé si aucune n'existe (premier démarrage)
    """
    # Priorité 1 : variable d'environnement
    env_key = os.getenv("FERNET_KEY")
    if env_key:
        return env_key.encode()

    # Priorité 2 : fichier local
    if KEY_FILE.exists():
        return KEY_FILE.read_bytes().strip()

    # Priorité 3 : génération + sauvegarde locale
    key = Fernet.generate_key()
    KEY_FILE.write_bytes(key)
    # Permissions restrictives sur le fichier (Unix-like)
    try:
        KEY_FILE.chmod(0o600)
    except Exception:
        pass  # Windows ne supporte pas chmod de la même façon
    logging.getLogger("SecurityManager").warning(
        "⚠️  Nouvelle clé de chiffrement générée. "
        "Exportez FERNET_KEY en production : %s",
        key.decode()
    )
    return key


# Instance Fernet (singleton)
_FERNET_KEY: bytes = _load_or_generate_key()
_fernet: Fernet = Fernet(_FERNET_KEY)


# ─────────────────────────────────────────────────────────────
# 3. FONCTIONS DE CHIFFREMENT / DÉCHIFFREMENT
# ─────────────────────────────────────────────────────────────

def encrypt_file(file_path: str) -> str:
    """
    Chiffre un fichier avec AES-256 (Fernet).
    Retourne le chemin du fichier chiffré (.encrypted).
    Le fichier original est supprimé après chiffrement.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Fichier introuvable : {file_path}")

    plaintext = path.read_bytes()
    ciphertext = _fernet.encrypt(plaintext)

    encrypted_path = path.with_suffix(path.suffix + ".encrypted")
    encrypted_path.write_bytes(ciphertext)

    # Suppression sécurisée de l'original
    path.unlink()

    return str(encrypted_path)


def decrypt_file(encrypted_path: str, output_path: Optional[str] = None) -> str:
    """
    Déchiffre un fichier .encrypted.
    Retourne le chemin du fichier déchiffré.
    Si output_path n'est pas fourni, supprime le suffixe .encrypted.
    """
    enc_path = Path(encrypted_path)
    if not enc_path.exists():
        raise FileNotFoundError(f"Fichier chiffré introuvable : {encrypted_path}")

    ciphertext = enc_path.read_bytes()
    plaintext = _fernet.decrypt(ciphertext)

    if output_path is None:
        # Supprime ".encrypted" du nom
        output_path = str(enc_path).replace(".encrypted", "")

    Path(output_path).write_bytes(plaintext)
    return output_path


def encrypt_bytes(data: bytes) -> bytes:
    """Chiffre des données brutes en mémoire."""
    return _fernet.encrypt(data)


def decrypt_bytes(data: bytes) -> bytes:
    """Déchiffre des données brutes en mémoire."""
    return _fernet.decrypt(data)


def get_public_key_b64() -> str:
    """Retourne la clé publique (base64) pour affichage de diagnostic."""
    return base64.urlsafe_b64encode(_FERNET_KEY).decode()


# ─────────────────────────────────────────────────────────────
# 4. AUDIT LOGGER JSON (conformité RGPD)
# ─────────────────────────────────────────────────────────────

class SecurityLogger:
    """
    Logger d'audit qui écrit des entrées JSON dans des fichiers
    rotatifs par date : logs/security_audit_YYYYMMDD.log
    
    Actions loguées :
      LOGIN, LOGOUT, SIGNUP, UPLOAD_IMAGE, ANALYZE_IMAGE,
      ENCRYPTION_ACTION, DELETE_FILE, GENERATE_REPORT,
      CREATE_PATIENT, SECURITY_VIOLATION, ACCESS_DENIED
    """

    def __init__(self, logs_dir: str = "logs"):
        self._logs_dir = Path(logs_dir)
        self._logs_dir.mkdir(exist_ok=True)
        self._logger = self._build_logger()

    # ── Rotation de fichier par date ──────────────────────────
    def _log_file_path(self) -> Path:
        today = datetime.utcnow().strftime("%Y%m%d")
        return self._logs_dir / f"security_audit_{today}.log"

    def _build_logger(self) -> logging.Logger:
        logger = logging.getLogger("SecurityAudit")
        logger.setLevel(logging.DEBUG)
        logger.propagate = False  # Ne pas remonter vers le root logger
        if not logger.handlers:
            # Handler sur le fichier du jour (rotation manuelle)
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                "%(asctime)s - %(levelname)s - %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S"
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        return logger

    # ── Écriture d'une entrée JSON ─────────────────────────────
    def _write_entry(self, level: str, entry: Dict[str, Any]):
        json_line = json.dumps(entry, ensure_ascii=False)
        log_path = self._log_file_path()

        # Écriture dans le fichier rotatif
        with open(log_path, "a", encoding="utf-8") as f:
            timestamp_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"{timestamp_str} - {level} - {json_line}\n")

        # Aussi vers le logger standard
        if level == "ERROR":
            self._logger.error(json_line)
        else:
            self._logger.info(json_line)

    # ── API publique ───────────────────────────────────────────
    def log_action(
        self,
        action_type: str,
        user_email: Optional[str] = None,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        success: bool = True,
        details: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ):
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "action_type": action_type,
            "user_email": user_email,
            "user_id": user_id,
            "ip_address": ip_address,
            "success": success,
            "details": details or {},
            "error_message": error_message,
        }
        level = "INFO" if success else "ERROR"
        self._write_entry(level, entry)

    # ── Helpers pour actions courantes ─────────────────────────
    def log_login(self, user_email: str, user_id: int, ip: Optional[str], success: bool = True):
        self.log_action(
            "LOGIN", user_email=user_email, user_id=user_id,
            ip_address=ip, success=success,
            details={"login_attempt": True}
        )

    def log_signup(self, user_email: str, ip: Optional[str], success: bool = True):
        self.log_action(
            "SIGNUP", user_email=user_email,
            ip_address=ip, success=success,
            details={"signup_attempt": True}
        )

    def log_logout(self, user_email: str, user_id: int):
        self.log_action("LOGOUT", user_email=user_email, user_id=user_id)

    def log_upload(self, user_email: str, user_id: int, filename: str, patient_id: int, ip: Optional[str] = None):
        self.log_action(
            "UPLOAD_IMAGE", user_email=user_email, user_id=user_id,
            ip_address=ip, success=True,
            details={"filename": filename, "patient_id": patient_id, "file_type": "medical_image"}
        )

    def log_analysis(self, user_email: str, user_id: int, filename: str, prediction: str, confidence: float, patient_id: int):
        self.log_action(
            "ANALYZE_IMAGE", user_email=user_email, user_id=user_id,
            success=True,
            details={"filename": filename, "prediction": prediction, "confidence": confidence, "patient_id": patient_id}
        )

    def log_encryption(self, user_email: str, user_id: int, action: str, filename: str):
        """action = 'encrypt' ou 'decrypt'"""
        self.log_action(
            "ENCRYPTION_ACTION", user_email=user_email, user_id=user_id,
            success=True,
            details={"encryption_action": action, "filename": filename}
        )

    def log_delete(self, user_email: str, user_id: int, filename: str):
        self.log_action(
            "DELETE_FILE", user_email=user_email, user_id=user_id,
            success=True,
            details={"temp_file_cleanup": filename}
        )

    def log_report(self, user_email: str, user_id: int, patient_id: int, report_type: str = "PDF"):
        self.log_action(
            "GENERATE_REPORT", user_email=user_email, user_id=user_id,
            success=True,
            details={"patient_id": patient_id, "report_type": report_type}
        )

    def log_create_patient(self, user_email: str, user_id: int, patient_name: str, patient_id: int):
        self.log_action(
            "CREATE_PATIENT", user_email=user_email, user_id=user_id,
            success=True,
            details={"patient_name": patient_name, "patient_id": patient_id}
        )

    def log_security_violation(self, ip: Optional[str], error: str, extra: Optional[Dict] = None):
        details = {"error": error}
        if extra:
            details.update(extra)
        self.log_action(
            "SECURITY_VIOLATION",
            ip_address=ip,
            success=False,
            details=details
        )

    def log_access_denied(self, user_email: str, user_id: int, resource: str, ip: Optional[str] = None):
        self.log_action(
            "ACCESS_DENIED", user_email=user_email, user_id=user_id,
            ip_address=ip, success=False,
            details={"resource": resource}
        )


# ─────────────────────────────────────────────────────────────
# 5. INSTANCES GLOBALES (importées par main.py)
# ─────────────────────────────────────────────────────────────

security_logger = SecurityLogger(logs_dir="logs")
