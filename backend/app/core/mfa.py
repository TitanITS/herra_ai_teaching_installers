DEVELOPMENT_MFA_CODE = "123456"


def verify_mfa_code(code: str) -> bool:
    return code == DEVELOPMENT_MFA_CODE


def get_mfa_bootstrap_message() -> str:
    return f"Development MFA code: {DEVELOPMENT_MFA_CODE}"