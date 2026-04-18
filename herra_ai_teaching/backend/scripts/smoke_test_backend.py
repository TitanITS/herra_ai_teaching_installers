
import requests

BASE = "http://127.0.0.1:8000"
KEY = "herra-dev-key-001"

def main():
    print("Health:")
    r = requests.get(f"{BASE}/health")
    print(r.status_code, r.text)

    print("\nIngest list:")
    r = requests.get(f"{BASE}/ingest/list", headers={"x-api-key": KEY})
    print(r.status_code)
    print(r.text[:500])

    print("\nSystem audit:")
    r = requests.get(f"{BASE}/system/audit")
    print(r.status_code)
    print(r.text[:500])

if __name__ == "__main__":
    main()
