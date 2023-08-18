import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const response = await fetch(
		"https://tokens.coingecko.com/uniswap/all.json"
	);
	const data = await response.json();
	return NextResponse.json({ data: data.tokens });
}
