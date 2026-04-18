from fastapi import Header, HTTPException, status

DEV_API_KEY = "herra-dev-key-001"

def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != DEV_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return True
