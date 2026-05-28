FROM node:20-alpine

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm i --no-frozen-lockfile; \
  else npm ci; \
  fi

# Copy the rest of the application code
COPY . .

# Expose port and start development server
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Set Next.js to use polling if on Windows (uncomment if hot-reload doesn't work)
# ENV WATCHPACK_POLLING=true

CMD ["npm", "run", "dev"]
