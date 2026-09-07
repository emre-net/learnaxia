export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(JSON.stringify({ 
    status: "ok", 
    message: "Minimal health check reached",
    time: new Date().toISOString(),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
