// staggered fade-up on scroll into view
export function reveal(node: HTMLElement, delay = 0) {
	node.classList.add('reveal');
	node.style.animationDelay = `${delay}ms`;
	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries)
				if (e.isIntersecting) {
					node.classList.add('in');
					io.unobserve(node);
				}
		},
		{ threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
	);
	io.observe(node);
	return { destroy: () => io.disconnect() };
}

// animate a number from 0 to its value when it scrolls into view
export function count_up(node: HTMLElement, opts: { to: number; dp?: number; dur?: number }) {
	let { to, dp = 0, dur = 1100 } = opts;
	const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
	const run = () => {
		const t0 = performance.now();
		const step = (t: number) => {
			const p = Math.min(1, (t - t0) / dur);
			const e = 1 - Math.pow(1 - p, 3);
			node.textContent = fmt(to * e);
			if (p < 1) requestAnimationFrame(step);
			else node.textContent = fmt(to);
		};
		requestAnimationFrame(step);
	};
	node.textContent = fmt(0);
	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries)
				if (e.isIntersecting) {
					run();
					io.unobserve(node);
				}
		},
		{ threshold: 0.4 }
	);
	io.observe(node);
	return {
		update(o: { to: number; dp?: number; dur?: number }) {
			to = o.to;
			dp = o.dp ?? dp;
			node.textContent = fmt(to);
		},
		destroy: () => io.disconnect()
	};
}
