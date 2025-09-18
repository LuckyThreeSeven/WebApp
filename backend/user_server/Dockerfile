FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    postgresql-client \
    netcat-openbsd && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

COPY . .
RUN pip install -r requirements.txt

# 윈도우 환경에서 docker-compose up --build 시 오류 발생 (CRLF 문제)
# ---
RUN sed -i 's/\r$//' ./entrypoint.sh
# ---

RUN chmod +x ./entrypoint.sh

#ENTRYPOINT ["/app/entrypoint.sh"]                                     │                                                                       │
#CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]

# Windows 환경에서 volume mount 시 발생하는 줄바꿈(CRLF) 문제를 해결하기 위해 sed로 변환 후 entrypoint 실행
ENTRYPOINT ["/bin/sh", "-c", "sed -i 's/\\r$//' /app/entrypoint.sh && /app/entrypoint.sh \"$@\"", "--"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]