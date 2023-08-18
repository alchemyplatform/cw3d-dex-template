import { NextResponse } from "next/server";
import qs from "qs";

export async function POST(request: Request) {
	const params = await request.json();
	console.log(params);

	const quote = await fetch(
		`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`,
		{
			headers: {
				"0x-api-key": process.env.ZERO_X_API_KEY!,
			},
		}
	).then((response) => response.json());

	return NextResponse.json({ quote });
}
