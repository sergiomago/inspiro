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
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              min-height: 600px;
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
              color: rgba(255, 255, 255, 0.9);
            }
            .credit {
              position: absolute;
              bottom: 20px;
              font-size: 12px;
              opacity: 0.7;
            }
            .credit a {
              color: white;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div>
              <div class="quote">"${quote}"</div>
              <div class="author">- ${author}</div>
            </div>
            <div class="logo">inspiro</div>
            <div class="credit">
              <a href="https://whytoai.com/" target="_blank">Developed by Why to AI</a>
            </div>
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