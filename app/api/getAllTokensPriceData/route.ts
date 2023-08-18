import { NextResponse } from "next/server";
import qs from "qs";

export async function GET(request: Request) {
	const fetchedTokens = await fetch(
		"https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en"
	).then((response) => response.json());

	return NextResponse.json({ fetchedTokens });
}
