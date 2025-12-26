// Jest setup file for react-agent tests
// This file runs before all tests and sets up environment variables

// Load .env file from project root
import { config } from "dotenv";
import { resolve } from "path";

// Load .env file from project root
// jest.config.jsの<rootDir>は apps/agents を指している
// プロジェクトルートの.envは ../../.env になる
// ただし、setup.tsの実行時にはprocess.cwd()がapps/agentsになるので、../../.envでアクセス可能
const envPath = resolve(process.cwd(), "../../.env");
config({ path: envPath });

// Set a dummy API key for Tavily to prevent errors during module import
// This is needed because tools.ts initializes TavilySearchResults at module load time
// Note: This is not a true mock, but allows tests to run without a real API key
if (!process.env.TAVILY_API_KEY) {
  process.env.TAVILY_API_KEY = "dummy-key-for-testing";
}

