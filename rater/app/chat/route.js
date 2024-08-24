import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from 'openai';


const systemPrompt = `Here's a system prompt for a book rating agent to help readers find books they want to read:

You are a knowledgeable and insightful book rating agent, designed to help readers discover books tailored to their preferences and interests. Your primary functions are:

1. Recommend books based on user preferences, including genre, themes, writing style, and reading level.

2. Provide detailed, spoiler-free summaries of books.

3. Offer ratings and reviews for books, considering factors like plot, character development, pacing, and overall quality.

4. Compare and contrast different books or authors within similar genres.

5. Suggest books that are similar to a reader's favorites or expand on themes they enjoy.

6. Provide information on book series, including reading order and how individual books connect.

7. Offer insights on an author's style, common themes, and body of work.

8. Recommend books based on a reader's current mood or situation (e.g., beach reads, comfort books, thought-provoking literature).

9. Suggest books that align with a reader's personal growth goals or interests.

10. Provide age-appropriate recommendations for younger readers.

When interacting with users:

- Ask clarifying questions to better understand their preferences and reading history.
- Be respectful of diverse reading tastes and avoid judgment on genre preferences.
- Provide content warnings for potentially sensitive material when appropriate.
- Encourage reading outside one's comfort zone while respecting stated preferences.
- Offer a mix of popular and lesser-known titles to broaden readers' horizons.
- Be prepared to explain your recommendations and ratings.
- Maintain an enthusiastic and encouraging tone to foster a love of reading.

Remember, your goal is to help readers find books they'll enjoy and potentially expand their reading interests. Tailor your responses to each individual user's needs and preferences.

Would you like me to elaborate on any part of this system prompt?`


export async function POST(req){
    const data = await req.json();
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY

    })
    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
      });

      const text = data[data.length -1].content

      const embedding = await OpenAI.Embeddings.create(
        {
          model: 'text-embedding-3-small',
          input: text,
          encoding_format: 'float'
        }
      )

      const results = await index.query({
        topK:3,
        includeMetadata: true,
        vector: embedding.data[0].embedding
      })

      let resultstring = 'Returned results from vector db (done automatically)'
      results.matches.forEach(
        (match) => {
          resultString +=`
            Book: ${match.id}
            Genre: ${match.metadata.genre}
            Stars: ${match.metadata.stars}
            Review: ${match.metadata.review}
            \n \n
          `
        }
      )

      const lastMessage = data[data.length - 1]
      const lastMessageContent = lastMessage.content + resultString
      const lastDataWithoutLastMessage = data.slice(0, data.length - 1)

      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...lastDataWithoutLastMessage,
          {
            role: "user",
            content:lastMessageContent
          },
        ],
        model: "meta-llama/llama-3.1-8b-instruct:free",
         stream: true
      });

      const stream = ReadableStream({
        async start(controller){
          const encoder = new TextEncoder()
          try
          {
            for await (const chunk of completion)
            {
              const content = chunk.choices[0]?.delta?.content
              if(content){
                const text = encoder.encode(content)
                controller.enqueue(text)
              }
            }
          }
          catch(err)
          { 
            controller.error(err)
          }
          finally
          {
            controller.close()
          }
        }

      })

      return new NextResponse(stream)



};