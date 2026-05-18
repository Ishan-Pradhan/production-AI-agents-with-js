"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Send, Sparkles, Globe, AlertCircle, Clock } from "lucide-react";

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

/* ─── Sub-components ─────────────────────────────────────── */

function TypingIndicator() {
	return (
		<div className="mx-auto w-full max-w-2xl px-4 animate-fade-slide-up">
			<div className="flex items-start gap-3">
				<AiAvatar pulse />
				<div
					style={{
						background: "var(--ai-bubble-bg)",
						border: "1px solid var(--ai-bubble-border)",
					}}
					className="flex items-center gap-2 rounded-2xl rounded-tl-sm px-5 py-4 shadow-lg"
				>
					<span className="typing-dot" />
					<span className="typing-dot" />
					<span className="typing-dot" />
				</div>
			</div>
		</div>
	);
}

function AiAvatar({ pulse = false }: { pulse?: boolean }) {
	return (
		<div className="relative flex-none">
			<div
				style={{
					background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
					boxShadow: pulse
						? "0 0 0 0 rgba(99,102,241,0.5)"
						: "0 2px 8px rgba(99,102,241,0.35)",
				}}
				className={`flex h-8 w-8 items-center justify-center rounded-xl text-white ${pulse ? "animate-pulse" : ""}`}
			>
				<Sparkles size={14} strokeWidth={2.5} />
			</div>
			{pulse && (
				<span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[var(--background)]" />
			)}
		</div>
	);
}

function SourceCard({ sources }: { sources: string[] }) {
	function getDomain(url: string) {
		try {
			return new URL(url).hostname.replace("www.", "");
		} catch {
			return url;
		}
	}

	return (
		<div
			style={{
				background: "rgba(99,102,241,0.06)",
				border: "1px solid rgba(99,102,241,0.15)",
			}}
			className="mt-3 rounded-xl px-4 py-3"
		>
			<div className="flex items-center gap-1.5 mb-2.5">
				<Globe size={12} style={{ color: "var(--accent-primary)" }} />
				<span
					style={{ color: "var(--accent-primary)" }}
					className="text-[11px] font-semibold uppercase tracking-wider"
				>
					Sources
				</span>
			</div>
			<ul className="space-y-1.5">
				{sources.map((source, i) => (
					<li key={i} className="flex items-start gap-2 min-w-0">
						<span
							style={{ color: "var(--foreground-subtle)" }}
							className="mt-0.5 text-[10px] font-mono flex-none"
						>
							{String(i + 1).padStart(2, "0")}
						</span>
						<Link
							href={source}
							target="_blank"
							rel="noreferrer"
							className="group min-w-0 flex-1"
						>
							<span
								style={{ color: "var(--accent-primary)" }}
								className="block text-[11px] font-medium group-hover:underline underline-offset-2 truncate"
							>
								{getDomain(source)}
							</span>
							<span
								style={{ color: "var(--foreground-subtle)" }}
								className="block text-[10px] truncate"
							>
								{source}
							</span>
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

function EmptyState() {
	const examples = [
		"Top 10 engineering colleges in Nepal 2026",
		"Explain what Docker is for beginners",
		"Latest news in AI this week",
		"How does LangChain work?",
	];

	return (
		<div className="flex flex-col items-center justify-center h-full px-4 animate-fade-in">
			{/* Logo mark */}
			<div
				style={{
					background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
					boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
				}}
				className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
			>
				<Sparkles size={28} className="text-white" strokeWidth={2} />
			</div>

			<h1
				style={{ color: "var(--foreground)" }}
				className="mb-2 text-2xl font-semibold tracking-tight"
			>
				Ask anything
			</h1>
			<p
				style={{ color: "var(--foreground-muted)" }}
				className="mb-8 text-sm text-center max-w-xs leading-relaxed"
			>
				Powered by LangChain. Searches the web when needed and always cites its
				sources.
			</p>

			{/* Example chips */}
			<div className="flex flex-wrap justify-center gap-2 max-w-lg">
				{examples.map((ex) => (
					<button
						key={ex}
						type="button"
						onClick={() => {
							/* trigger via custom event so page.tsx keeps control */
							window.dispatchEvent(
								new CustomEvent("set-query", { detail: ex }),
							);
						}}
						style={{
							background: "var(--surface-elevated)",
							border: "1px solid var(--surface-border)",
							color: "var(--foreground-muted)",
						}}
						className="rounded-full px-4 py-2 text-xs transition-all duration-200 cursor-pointer hover:border-[rgba(99,102,241,0.5)] hover:text-[var(--foreground)] hover:shadow-[0_0_12px_rgba(99,102,241,0.15)]"
					>
						{ex}
					</button>
				))}
			</div>
		</div>
	);
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function Home() {
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [chat, setChat] = useState<CurrentChatTurn[]>([]);

	const scrollRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLTextAreaElement | null>(null);

	/* Auto-scroll on new messages */
	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [chat, loading]);

	/* Listen for example chip clicks */
	useEffect(() => {
		const handler = (e: Event) => {
			const text = (e as CustomEvent<string>).detail;
			setQuery(text);
			inputRef.current?.focus();
		};
		window.addEventListener("set-query", handler);
		return () => window.removeEventListener("set-query", handler);
	}, []);

	/* Auto-grow textarea */
	function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
		setQuery(e.target.value);
		e.target.style.height = "auto";
		e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
	}

	/* ── Business logic (unchanged) ── */
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
		if (inputRef.current) {
			inputRef.current.style.height = "auto";
		}
		await runSearch(prompt);
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (!query.trim() || query.trim().length < 5) return;
			handleChatSubmit(e as unknown as FormEvent);
		}
	}

	return (
		<div
			style={{ background: "var(--background)", color: "var(--foreground)" }}
			className="flex h-dvh flex-col overflow-hidden"
		>
			{/* ── Header ── */}
			<header
				style={{
					background: "rgba(13,15,20,0.8)",
					borderBottom: "1px solid var(--surface-border)",
					backdropFilter: "blur(12px)",
					WebkitBackdropFilter: "blur(12px)",
				}}
				className="z-10 flex items-center justify-between px-6 py-3.5 flex-none"
			>
				<div className="flex items-center gap-3">
					<div
						style={{
							background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
						}}
						className="flex h-7 w-7 items-center justify-center rounded-lg"
					>
						<Sparkles size={13} className="text-white" strokeWidth={2.5} />
					</div>
					<div>
						<p
							style={{ color: "var(--foreground)" }}
							className="text-sm font-semibold leading-none"
						>
							Search AI
						</p>
						<p
							style={{ color: "var(--foreground-subtle)" }}
							className="text-[11px] mt-0.5"
						>
							LCEL Web Agent
						</p>
					</div>
				</div>

				{/* Status badge */}
				<div
					style={{
						background: "rgba(52,211,153,0.08)",
						border: "1px solid rgba(52,211,153,0.2)",
					}}
					className="flex items-center gap-1.5 rounded-full px-3 py-1"
				>
					<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
					<span className="text-[11px] text-emerald-400 font-medium">
						Online
					</span>
				</div>
			</header>

			{/* ── Messages ── */}
			<main
				ref={scrollRef}
				className="flex-1 overflow-y-auto py-6 space-y-1 scroll-smooth"
			>
				{chat.length === 0 && !loading ? (
					<EmptyState />
				) : (
					<div className="flex flex-col gap-6 pb-2">
						{chat.map((turn, idx) => {
							/* User bubble */
							if (turn.role === "user") {
								return (
									<div
										key={idx}
										className="mx-auto w-full max-w-2xl px-4 flex justify-end animate-fade-slide-up"
									>
										<div
											style={{
												background: "var(--user-bubble-bg)",
												color: "var(--user-bubble-text)",
												boxShadow: "0 4px 16px rgba(99,102,241,0.25)",
											}}
											className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words"
										>
											{turn.content}
										</div>
									</div>
								);
							}

							/* Assistant bubble */
							return (
								<div
									key={idx}
									className="mx-auto w-full max-w-2xl px-4 animate-fade-slide-up"
								>
									<div className="flex items-start gap-3">
										<AiAvatar />
										<div className="flex-1 min-w-0">
											{/* Answer card */}
											<div
												style={{
													background: "var(--ai-bubble-bg)",
													border: "1px solid var(--ai-bubble-border)",
													boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
												}}
												className="rounded-2xl rounded-tl-sm px-5 py-4"
											>
												{turn.error ? (
													<div className="flex items-start gap-2">
														<AlertCircle
															size={15}
															className="mt-0.5 flex-none text-red-400"
														/>
														<p
															style={{ color: "var(--foreground-muted)" }}
															className="text-sm leading-relaxed"
														>
															{turn.content}
														</p>
													</div>
												) : (
													<p
														style={{ color: "var(--foreground)" }}
														className="text-sm leading-relaxed whitespace-pre-wrap break-words"
													>
														{turn.content}
													</p>
												)}

												{/* Sources */}
												{turn.sources && turn.sources.length > 0 && (
													<SourceCard sources={turn.sources} />
												)}
											</div>

											{/* Meta row */}
											<div className="mt-1.5 flex items-center gap-3 px-1">
												{typeof turn.time === "number" && (
													<span
														style={{ color: "var(--foreground-subtle)" }}
														className="flex items-center gap-1 text-[10px]"
													>
														<Clock size={10} />
														{(turn.time / 1000).toFixed(1)}s
													</span>
												)}
											</div>
										</div>
									</div>
								</div>
							);
						})}

						{/* Typing indicator */}
						{loading && <TypingIndicator />}
					</div>
				)}
			</main>

			{/* ── Input bar ── */}
			<div
				style={{
					background: "rgba(13,15,20,0.85)",
					borderTop: "1px solid var(--surface-border)",
					backdropFilter: "blur(16px)",
					WebkitBackdropFilter: "blur(16px)",
				}}
				className="flex-none px-4 py-4"
			>
				<form
					onSubmit={handleChatSubmit}
					className="mx-auto flex w-full max-w-2xl items-end gap-3"
				>
					{/* Textarea wrapper */}
					<div
						style={{
							background: "var(--surface-elevated)",
							border: "1px solid var(--surface-border)",
							transition: "box-shadow 0.2s ease, border-color 0.2s ease",
						}}
						className="input-glow flex-1 rounded-2xl overflow-hidden"
					>
						<textarea
							ref={inputRef}
							id="chat-input"
							rows={1}
							placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
							value={query}
							onChange={handleInput}
							onKeyDown={handleKeyDown}
							disabled={loading}
							style={{
								background: "transparent",
								color: "var(--foreground)",
								resize: "none",
								outline: "none",
								caretColor: "var(--accent-primary)",
							}}
							className="w-full px-4 py-3.5 text-sm leading-relaxed placeholder:text-[var(--foreground-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
						/>
					</div>

					{/* Send button */}
					<button
						type="submit"
						disabled={loading || query.trim().length < 5}
						id="send-button"
						style={{
							background:
								loading || query.trim().length < 5
									? "var(--surface-elevated)"
									: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
							border: "1px solid var(--surface-border)",
							boxShadow:
								loading || query.trim().length < 5
									? "none"
									: "0 4px 16px rgba(99,102,241,0.35)",
							transition:
								"background 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease, opacity 0.2s ease",
						}}
						className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed hover:not-disabled:scale-105 active:scale-95"
					>
						{loading ? (
							<span
								style={{
									width: 16,
									height: 16,
									border: "2px solid rgba(255,255,255,0.2)",
									borderTopColor: "white",
									borderRadius: "50%",
									display: "inline-block",
									animation: "spin 0.75s linear infinite",
								}}
							/>
						) : (
							<Send size={16} strokeWidth={2.5} />
						)}
					</button>
				</form>

				<p
					style={{ color: "var(--foreground-subtle)" }}
					className="mt-2 text-center text-[10px]"
				>
					AI can make mistakes. Verify important information.
				</p>
			</div>
		</div>
	);
}
