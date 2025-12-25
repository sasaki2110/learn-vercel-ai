// Mock for TavilySearchResults
export class TavilySearchResults {
  name = "tavily_search_results_json";
  description = "A search engine. Useful for when you need to answer questions about current events. Input should be a search query.";

  constructor(_config?: { maxResults?: number }) {
    // Mock constructor - no API key needed
  }

  async invoke(_input: string) {
    return [
      {
        url: "https://example.com",
        content: "Mocked search result",
      },
    ];
  }
}

