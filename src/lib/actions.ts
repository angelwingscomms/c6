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

// gentle scroll-linked parallax — element drifts by `speed` * scroll distance
export function parallax(node: HTMLElement, speed = 0.06) {
	let raf = 0;
	const tick = () => {
		raf = 0;
		const r = node.getBoundingClientRect();
		const vh = window.innerHeight || 1;
		const offset = (r.top + r.height / 2 - vh / 2) * -speed;
		node.style.setProperty('--py', `${offset.toFixed(2)}px`);
	};
	const on_scroll = () => {
		if (!raf) raf = requestAnimationFrame(tick);
	};
	tick();
	window.addEventListener('scroll', on_scroll, { passive: true });
	window.addEventListener('resize', on_scroll);
	return {
		destroy() {
			window.removeEventListener('scroll', on_scroll);
			window.removeEventListener('resize', on_scroll);
			if (raf) cancelAnimationFrame(raf);
		}
	};
}

// soft idle float — breathing motion for hero visuals
export function float(node: HTMLElement, { amp = 10, dur = 7 }: { amp?: number; dur?: number } = {}) {
	node.style.setProperty('--float-amp', `${amp}px`);
	node.style.setProperty('--float-dur', `${dur}s`);
	node.classList.add('float');
	return {};
}

// submit a form on Ctrl/Cmd+Enter from any field inside the node.
// Plain Enter is left to the browser (newline in textareas, nothing in inputs)
// so the explicit Control+Enter stays the deliberate submit gesture.
export function ctrlEnter(node: HTMLElement, handler: () => void) {
	const on_key = (e: KeyboardEvent) => {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handler();
		}
	};
	node.addEventListener('keydown', on_key);
	return {
		destroy() {
			node.removeEventListener('keydown', on_key);
		}
	};
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
