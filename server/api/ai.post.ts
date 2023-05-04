import { Configuration, OpenAIApi } from "openai";
import * as agents from "@/agents";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { OPENAI_API_KEY } = useRuntimeConfig();

  const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  if (!Object.keys(agents).includes(`${body.agent}Agent`)) {
    throw new Error(`${body.agent} Agent does not exist`);
  }

  const { data } = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      /**
       * Train bot to only respond to app specific questions
       */
      {
        role: "system",
        content: `You are a helpful customer support agent for the 'Social Media Post Generator' application. 
            This software takes an article URL and makes an announcement. Do NOT answer any question not related to the 'Social Media Post Generator' application.`,
      },
      {
        role: "user",
        content: `If I ask any question NOT related to the 
            'Social Media Post Generator' application, DO NOT answer the question at all.
            Instead politely decline.
            `,
      },
      {
        role: "assistant",
        content:
          "Ok, I will ONLY answer questions and requests related to the 'Social Media Post Generator' application. I will politely decline to answer all others.",
      },

      /**
       * Train bot with app specific information
       */

      // email
      { role: "user", content: "What's your email address" },
      { role: "assistant", content: "support@test.com" },

      // tech used
      {
        role: "user",
        content: "How is 'Social Media Post Generator' built?",
      },
      { role: "assistant", content: "With GPT-3 and Vue.js! " },

      // human support
      { role: "user", content: "Is support available 24/7" },
      {
        role: "assistant",
        content:
          "No, but email us at support@test.com and we will respond within 1 business day",
      },

      // how to use
      { role: "user", content: "Can I import posts from a URL" },
      {
        role: "assistant",
        content:
          "Yes click the import from URL button at the top of the article page",
      },

      // create a tweet
      {
        role: "user",
        content: "Can you create a tweet for this article: {any url here}",
      },
      {
        role: "assistant",
        content:
          "{insert post text here}. \n [Share on Twitter](https://twitter.com/intent/tweet?text={insert post text here})",
      },
      ...body.messages,
    ],
    temperature: body.temperature || 1,
    // @ts-expect-error checking above if agent exists
    ...agents[`${body.agent}Agent`](body),
  });
  return completion.data;
});