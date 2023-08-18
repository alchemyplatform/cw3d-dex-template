import { NextResponse } from "next/server";
import qs from "qs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("tokenId");
  console.log(tokenId);
  const chartData = await fetch(
    `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=30&interval=1&precision=3`
  ).then((response) => response.json());

  return NextResponse.json({ chartData });
}
