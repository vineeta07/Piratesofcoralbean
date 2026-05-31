FROM python:3.10-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code into a 'backend' directory so imports like 'backend.main' work
COPY . ./backend/

EXPOSE 8000

# Run uvicorn from the /app directory
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
