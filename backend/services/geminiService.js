const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateEventSummary(posts) {
    try {
      const eventPosts = posts.filter(post => 
        post.category === 'events' || 
        post.tags?.includes('event') ||
        post.content.toLowerCase().includes('event')
      );

      if (eventPosts.length === 0) {
        return "No events found to summarize.";
      }

      const postsText = eventPosts.map(post => 
        `Title: ${post.title || 'Untitled'}
Content: ${post.content}
Category: ${post.category}
Location: ${post.location || 'Not specified'}
Date: ${new Date(post.createdAt).toLocaleDateString()}
---`
      ).join('\n');

      const prompt = `
        Based on the following campus event posts, create a concise and engaging summary of upcoming events. 
        Focus on the most important details like dates, locations, and key highlights. 
        Format it in a friendly, campus bulletin style:

        ${postsText}

        Please provide:
        1. A brief overview of upcoming events
        2. Highlight the most popular or urgent events
        3. Include relevant dates and locations
        4. Keep it under 200 words
        5. Use a casual, student-friendly tone
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('Error generating event summary:', error);
      return "Unable to generate event summary at this time.";
    }
  }

  async generateMemeAnalysis(memePosts) {
    try {
      if (memePosts.length === 0) {
        return "No memes to analyze.";
      }

      const memesText = memePosts.map(meme => 
        `Content: ${meme.content}
Upvotes: ${meme.upvotes || 0}
Comments: ${meme.commentCount || 0}
---`
      ).join('\n');

      const prompt = `
        Analyze these campus memes and provide insights about campus mood and trending topics:

        ${memesText}

        Please provide:
        1. Popular themes or topics in the memes
        2. Overall campus mood based on meme content
        3. Trending jokes or references
        4. Keep it fun and engaging, under 150 words
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('Error analyzing memes:', error);
      return "Unable to analyze memes at this time.";
    }
  }

  async generateCampusDigest(allPosts, timeRange = '24h') {
    try {
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - (timeRange === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000));
      
      const recentPosts = allPosts.filter(post => 
        new Date(post.createdAt) > cutoffTime
      );

      if (recentPosts.length === 0) {
        return `No posts found in the last ${timeRange}.`;
      }

      const categorizedPosts = {
        events: recentPosts.filter(p => p.category === 'events'),
        lostFound: recentPosts.filter(p => p.category === 'lost_found'),
        food: recentPosts.filter(p => p.category === 'food'),
        memes: recentPosts.filter(p => p.category === 'memes'),
        announcements: recentPosts.filter(p => p.category === 'announcements')
      };

      const digestData = Object.entries(categorizedPosts)
        .map(([category, posts]) => 
          `${category.toUpperCase()}: ${posts.length} posts\n` +
          posts.slice(0, 3).map(p => `- ${p.content.substring(0, 100)}...`).join('\n')
        ).join('\n\n');

      const prompt = `
        Create a campus digest summary for the last ${timeRange} based on this activity:

        ${digestData}

        Total posts: ${recentPosts.length}

        Please provide:
        1. A catchy headline for the digest
        2. Key highlights from each category
        3. Notable trends or patterns
        4. A fun closing note
        5. Keep it engaging and under 250 words
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('Error generating campus digest:', error);
      return "Unable to generate campus digest at this time.";
    }
  }

  async moderateContent(content) {
    try {
      const prompt = `
        Analyze this campus post content for appropriateness and safety:

        "${content}"

        Determine if this content:
        1. Contains inappropriate language or hate speech
        2. Includes personal attacks or bullying
        3. Has spam or promotional content
        4. Contains misinformation that could be harmful
        5. Is appropriate for a college campus community

        Respond with JSON format:
        {
          "isAppropriate": true/false,
          "concerns": ["list", "of", "issues"],
          "severity": "low/medium/high",
          "recommendation": "approve/review/reject"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      try {
        return JSON.parse(response.text());
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          isAppropriate: true,
          concerns: [],
          severity: "low",
          recommendation: "approve"
        };
      }

    } catch (error) {
      console.error('Error moderating content:', error);
      return {
        isAppropriate: true,
        concerns: [],
        severity: "low",
        recommendation: "approve"
      };
    }
  }
}

module.exports = new GeminiService();
