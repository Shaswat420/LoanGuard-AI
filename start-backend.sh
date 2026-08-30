#!/bin/zsh

echo "Checking port 8081..."

PID=$(lsof -tiTCP:8081 -sTCP:LISTEN)

if [ -n "$PID" ]; then
    echo "Stopping existing backend (PID: $PID)..."
    kill $PID
    sleep 2
fi

echo "Starting LoanGuard backend..."
cd ~/LoanGuard-AI/backend || exit 1

./mvnw spring-boot:run
