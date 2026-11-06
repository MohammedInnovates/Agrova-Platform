import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

# Ensure the directory exists
UPLOAD_DIR = "static/category_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """Uploads a category image and returns the URL path."""
    
    # 1. Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Only JPG, JPEG, PNG, and WebP are allowed."
        )
        
    # 2. Generate a unique filename to prevent conflicts
    ext = file.filename.split(".")[-1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # 3. Save the file to the server
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")
        
    # 4. Return the relative URL path
    return {"url": f"/static/category_images/{filename}"}