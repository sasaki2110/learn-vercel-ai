# LangGraph Agent Dockerfile
# Build from project root: docker build -f apps/agents/Dockerfile -t langgraph-agents .
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/agents/package*.json ./apps/agents/
COPY langgraph.json ./

# Install root dependencies (for workspaces)
RUN npm ci --only=production

# Install agents dependencies
WORKDIR /app/apps/agents
RUN npm ci --only=production

# Copy source code
COPY apps/agents/ ./

# Build TypeScript
RUN npm run build:internal

# Expose port
EXPOSE 2024

# Set environment
ENV NODE_ENV=production
ENV PORT=2024

# Start LangGraph server
CMD ["npx", "@langchain/langgraph-cli", "dev", "--port", "2024", "--config", "../../langgraph.json", "--host", "0.0.0.0"]

