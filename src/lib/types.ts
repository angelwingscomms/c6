// single-letter keys everywhere (db payloads, API JSON, page data)

export type User = { s: 'u'; g: string; n: string; m?: string; p?: string; d: number };

export type Project = {
	s: 'p';
	n: string;
	l?: string;
	o: string; // owner uid
	a: string[]; // member uids
	i: string; // invite code
	d: number;
};

export type Material = { s: 'm'; j: string; n: string; u: string; c?: string; d: number };

export type Order = {
	s: 'o';
	j: string;
	t: string;
	q: number;
	v?: string;
	d: number;
	x?: string;
	b: string;
};

export type Receipt = {
	s: 'r';
	j: string;
	t: string;
	q: number;
	d: number;
	f?: string;
	x?: string;
	b: string;
};

export type Usage = {
	s: 'g';
	j: string;
	t: string;
	q: number;
	w?: string;
	k?: number;
	d: number;
	x?: string;
	b: string;
};

export type Benchmark = { s: 'k'; j: string; t: string; w: string; q: number; e: number; b: string };

export type Drawing = { s: 'f'; j: string; n: string; f: string; y: string; d: number; b: string };

export type Milestone = {
	s: 'l';
	j: string;
	n: string;
	c: number;
	f?: string;
	x?: string;
	d: number;
	b: string;
};

export type Kind = User | Project | Material | Order | Receipt | Usage | Benchmark | Milestone | Drawing;

export type Pt<T> = { id: string; payload: T };

// computed
export type Stock = { t: string; n: string; u: string; o: number; r: number; g: number };
export type Flag = { t: string; n: string; y: 'over_receipt' | 'over_use' | 'under_use' | 'negative_stock'; m: string; d: number };

// rows with their point id attached (returned to pages / API)
export type Mat = Material & { id: string };
export type ProjectRow = Project & { id: string };
export type DrawingRow = Drawing & { id: string };
export type MilestoneRow = Milestone & { id: string };

// a ledger row (order | receipt | usage), fields present per kind
export type Row = {
	id: string;
	s: 'o' | 'r' | 'g';
	t: string;
	q: number;
	d: number;
	b: string;
	x?: string;
	v?: string;
	w?: string;
	k?: number;
	f?: string;
};

// dashboard recent-activity item
export type Recent = { id: string; y: 'o' | 'r' | 'g'; t: string; n: string; q: number; u: string; d: number };

// my-projects list item (c = member count)
export type ProjectCard = { id: string; n: string; l?: string; o: string; c: number };

// dashboard payload
export type Dashboard = { p: ProjectRow; m: Mat[]; s: Stock[]; f: Flag[]; r: Recent[] };
