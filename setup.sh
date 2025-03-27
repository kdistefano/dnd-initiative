#!/bin/bash

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install

# Setup Prisma
echo "Setting up Prisma..."
npx prisma generate
npx prisma migrate dev --name init

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install

# Start both servers
echo "Starting servers..."
echo "Backend will run on http://localhost:5050"
echo "Frontend will run on http://localhost:5173"

# Start backend in background
cd ../backend
npm run dev &

# Start frontend
cd ../frontend
npm run dev 