"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchResponse = {
	answer: string;
	sources: string[];
};

type CurrentChatTurn =
	| {
			role: "user";
			content: string;
	  }
	| {
			role: "assistant";
			content: string;
			sources: string[];
			time: number;
			error?: string;
	  };

export default function Home() {
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [chat, setChat] = useState<CurrentChatTurn[]>([]);

	const scrollRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [chat]);

	async function runSearch(prompt: string) {
		setLoading(true);
		setChat((old) => [...old, { role: "user", content: prompt }]);
		const oldTime = performance.now();

		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					q: prompt,
				}),
			});

			const json = await res.json();
			const timeDiff = Math.round(performance.now() - oldTime);

			if (!res.ok) {
				const msg =
					"I tried to answer, but someting went wrong. Please try again";
				setChat((old) => [
					...old,
					{
						role: "assistant",
						content: msg,
						time: timeDiff,
						sources: [],
						error: msg,
					},
				]);
			} else {
				const data = json as SearchResponse;
				setChat((old) => [
					...old,
					{
						role: "assistant",
						content: data.answer,
						time: timeDiff,
						sources: data.sources,
					},
				]);
			}
		} catch (error) {
			const timeDiff = Math.round(performance.now() - oldTime);

			const msg =
				"I tried to answer, but someting went wrong. Please try again";
			setChat((old) => [
				...old,
				{
					role: "assistant",
					content: msg,
					time: timeDiff,
					sources: [],
					error: String(error),
				},
			]);
		} finally {
			setLoading(false);
		}
	}

	async function handleChatSubmit(e: FormEvent) {
		e.preventDefault();
		const prompt = query.trim();
		if (!prompt || loading) return;
		setQuery("");
		await runSearch(prompt);
	}

	return (
		<div className="flex h-dvh flex-col bg-[#f9fafb] text-gray-900">
			<header className="border-b bg-white px-4 py-3 text-sm flex items-center justify-between">
				<div className="flex flex-col">
					<span className="font-medium text-gray-800">
						Search V1 (LCEL Web Agent)
					</span>
					<span className="text-[11px] text-gray-500">
						Answer with sources. Some queries will browse the web and some
						don&apos;t.
					</span>
				</div>
			</header>

			<main className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
				{chat.length === 0 && (
					<div className="mx-auto max-w-2xl text-center text-sm text-gray-500">
						<div className="text-base font-semibold text-gray-800 mb-2">
							Ask Anything
						</div>
						<div className="text-[14px] leading-relaxed text-gray-500">
							Examples:
							<br />
							<code className="rounded bg-gray-100 px-1 py-2 text-[12px]">
								Top 10 engineering colleges in Nepal 2026
							</code>
							<code className="rounded bg-gray-100 px-1 py-2 text-[12px]">
								Explain what docker is for beginners.{" "}
							</code>
						</div>
					</div>
				)}
				{chat.map((turn, idx) => {
					//user
					if (turn.role === "user") {
						return (
							<div
								key={idx}
								className="mx-auto max-w-2xl flex justify-end text-right"
							>
								<div className="inline-block rounded-2xl bg-gray-900 px-4 py-3 text-sm text-white shadow-md max-w-full">
									<div className="whitespace-pre-wrap wrap-break-word">
										{turn.content}
									</div>
								</div>
							</div>
						);
					}

					//assistant
					return (
						<div
							key={idx}
							className="mx-auto max-w-2xl flex items-start gap-3 text-left"
						>
							<div className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-gray-800 text-[11px] text-white font-semibold">
								AI
							</div>
							<div className="flex-1 space-y-3">
								<div className=" rounded-2xl bg-white border px-4 py-3 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 whitespace-pre-wrap wrap-break-word">
									<div className="whitespace-pre-wrap wrap-break-word">
										{turn.content}
									</div>
									<div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-x-2">
										{typeof turn.time === "number" && (
											<span>answered in {turn.time} time</span>
										)}
										{turn?.error && <span>{turn.error}</span>}
									</div>

									{turn.sources && turn.sources.length > 0 && (
										<div className="rounded-lg bg-white px-3 py-2 text-[12px] shadow-sm ring-1 ring-gray-200">
											<div className="text-[11px] font-medium text-gray-600 mb-1">
												Sources
											</div>
											<ul className="space-y-1">
												{turn.sources.map((source, i) => (
													<li
														key={i}
														className="flex items-baseline gap-x-2 overflow-hidden truncate"
													>
														<Link
															href={source}
															target="_blank"
															rel="noreferrer"
															className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] text-blue-500 underline underline-offset-4 break-all"
														>
															{source}
														</Link>
													</li>
												))}
											</ul>
										</div>
									)}
								</div>
							</div>
						</div>
					);
				})}

				{loading && (
					<div className="mx-auto max-w-2xl flex items-start gap-3 text-left">
						<div className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-gray-700 text-[11px] text-white font-semibold">
							...
						</div>
						<p className="animate-pulse text-gray-400 text-sm inline-block rounded-2xl bg-white border px-4 py-3 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200">
							Thinking...
						</p>
					</div>
				)}
				<footer className="border-t bg-white p-4">
					<form
						onSubmit={handleChatSubmit}
						className="mx-auto flex w-full max-w-2xl items-end gap-2"
					>
						<div>
							<Input
								className="w-full resize-none"
								placeholder="Ask your query..."
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								disabled={loading}
							/>
						</div>
						<Button
							disabled={loading || query.trim().length < 5}
							type="submit"
							className="shrink-0"
						>
							Send
						</Button>
					</form>
				</footer>
			</main>
		</div>
	);
}
