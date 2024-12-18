import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { quote, author } = await req.json()

    if (!quote || !author) {
      throw new Error('Quote and author are required')
    }

    console.log('Generating quote card for:', quote, 'by', author)

    const html = `
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Satisfy&display=swap" rel="stylesheet">
          <style>
            body {
              margin: 0;
              padding: 0;
              width: 1080px;
              height: 1080px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #2D1B4D;
              font-family: Georgia, serif;
              color: white;
            }
            .container {
              max-width: 800px;
              padding: 60px;
              text-align: center;
              position: relative;
            }
            .quote {
              font-size: 48px;
              line-height: 1.4;
              margin-bottom: 40px;
              font-style: italic;
            }
            .author {
              font-size: 32px;
              opacity: 0.9;
              margin-bottom: 60px;
            }
            .logo {
              font-family: 'Satisfy', cursive;
              font-size: 42px;
              color: transparent;
              background-image: linear-gradient(to right, #9b87f5, #6E59A5);
              -webkit-background-clip: text;
              background-clip: text;
              display: inline-block;
              padding: 0;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="quote">"${quote}"</div>
            <div class="author">- ${author}</div>
            <div class="logo">inspiro</div>
          </div>
        </body>
      </html>
    `

    const base64Html = btoa(html)

    return new Response(
      JSON.stringify({ 
        imageData: `data:text/html;base64,${base64Html}`,
        quote,
        author
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in generate-quote-image function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate quote image'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})