# PrivacyGuard AI — Python backend (optional)

This is **Plan B**, not the primary demo. The deployed app (`../src`) does
everything in the browser — that's the stronger story for an "on-device AI"
hackathon theme, and it's what's linked in the main README's deploy steps.

Use this backend if you specifically want to show a Python/OpenCV/pytesseract
pipeline, or want batch processing outside a browser tab.

## Setup

```bash
# System dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y tesseract-ocr libzbar0

# Python dependencies
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run
uvicorn main:app --reload --port 8000
```

Then `POST` an image to `http://localhost:8000/scan` as multipart form-data
under the field name `file`, or open `http://localhost:8000/docs` for the
interactive Swagger UI to try it directly.

## What was and wasn't verified here

The regex patterns in `main.py` were tested directly (they mirror
`src/lib/piiDetector.js` exactly and produce identical matches on the same
test strings). The OCR/face/QR code paths depend on `tesseract-ocr`,
`opencv-python`, and `libzbar0`, which aren't available in the environment
this was written in — install the system packages above and test locally
with a real image before relying on this for a live demo.

## Face detection note

This uses OpenCV's Haar cascade (`haarcascade_frontalface_default.xml`,
bundled with `opencv-python`) rather than MediaPipe's Python package —
`mediapipe` is a very large dependency and Haar cascades are fast and
dependency-light for a hackathon demo. Swap in `mediapipe` if you want
better accuracy on angled/partial faces and don't mind the extra install
size.
