@echo off
echo Starting AssetFlow Backend Server...
echo.

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Run the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
