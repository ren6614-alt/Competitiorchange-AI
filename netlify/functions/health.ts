/**
 * Dedicated Netlify Health Check Function
 * Accessible directly via /.netlify/functions/health
 */
export const handler: any = async (event: any, context: any) => {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
    body: JSON.stringify({
      status: "ok",
      app: "CompetitorChange AI",
      runtime: "Netlify Functions",
      timestamp: new Date().toISOString(),
      ai_configured: Boolean(process.env.GEMINI_API_KEY),
      gpay_upi_configured: Boolean(process.env.GPAY_UPI_ID || "gugankousi5124@okaxis"),
      free_development_mode: process.env.FREE_DEVELOPMENT_MODE !== "false",
    }),
  };
};
