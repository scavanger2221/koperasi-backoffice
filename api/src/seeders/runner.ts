/**
 * Seeder Runner
 *
 * Usage:
 *   npx tsx src/seeders/runner.ts              # Run all seeders
 *   npx tsx src/seeders/runner.ts --list        # List available seeders
 *   npx tsx src/seeders/runner.ts users akun    # Run specific seeders only
 *   npx tsx src/seeders/runner.ts --skip jurnal # Skip specific seeders
 *
 * Seeders are executed in dependency order automatically.
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../../database/schema/index.js";
import { seedUsers } from "./seed-users.js";
import { seedAnggota } from "./seed-anggota.js";
import { seedAkun } from "./seed-akun.js";
import { seedSimpanan } from "./seed-simpanan.js";
import { seedPinjaman } from "./seed-pinjaman.js";
import { seedTagihan } from "./seed-tagihan.js";
import { seedJurnal } from "./seed-jurnal.js";
import { seedShu } from "./seed-shu.js";
import { seedRat } from "./seed-rat.js";

type SeedFn = (db: any) => Promise<void>;

interface SeederDef {
  name: string;
  description: string;
  deps: string[];
  fn: SeedFn;
}

const SEEDERS: Record<string, SeederDef> = {
  users: {
    name: "users",
    description: "Admin user (admin@koperasi.id / admin123)",
    deps: [],
    fn: seedUsers,
  },
  anggota: {
    name: "anggota",
    description: "Sample members (Budi Santoso, Siti Aminah)",
    deps: [],
    fn: seedAnggota,
  },
  akun: {
    name: "akun",
    description: "Chart of accounts (20 standard accounts)",
    deps: [],
    fn: seedAkun,
  },
  simpanan: {
    name: "simpanan",
    description: "Sample savings (pokok, wajib)",
    deps: ["anggota"],
    fn: seedSimpanan,
  },
  pinjaman: {
    name: "pinjaman",
    description: "Sample loans + angsuran",
    deps: ["anggota"],
    fn: seedPinjaman,
  },
  tagihan: {
    name: "tagihan",
    description: "Sample tagihan simpanan wajib",
    deps: ["anggota"],
    fn: seedTagihan,
  },
  jurnal: {
    name: "jurnal",
    description: "Journal entries for SHU calculation (requires akun)",
    deps: ["akun"],
    fn: seedJurnal,
  },
  shu: {
    name: "shu",
    description: "SHU calculation & distribution",
    deps: ["anggota", "simpanan", "jurnal"],
    fn: seedShu,
  },
  rat: {
    name: "rat",
    description: "RAT meeting & agenda",
    deps: ["anggota"],
    fn: seedRat,
  },
};

function topoSort(names: string[]): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(name: string) {
    if (visited.has(name)) return;
    visited.add(name);
    const def = SEEDERS[name];
    if (!def) throw new Error(`Unknown seeder: "${name}"`);
    for (const dep of def.deps) visit(dep);
    result.push(name);
  }

  for (const name of names) visit(name);
  return result;
}

function printHelp() {
  console.log(`
Seeder Runner — per-table seeders for Koperasi Backoffice

Usage:
  npx tsx src/seeders/runner.ts              Run all seeders
  npx tsx src/seeders/runner.ts --list       List seeders
  npx tsx src/seeders/runner.ts users akun   Run specific seeders
  npx tsx src/seeders/runner.ts --skip jurnal

Available seeders:
${Object.values(SEEDERS)
  .map((s) => `  ${s.name.padEnd(12)} ${s.description}`)
  .join("\n")}
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (args.includes("--list")) {
    printHelp();
    process.exit(0);
  }

  // Determine which seeders to run
  let names: string[];
  const skipIdx = args.indexOf("--skip");
  if (skipIdx >= 0) {
    const skip = new Set(args.slice(skipIdx + 1));
    names = Object.keys(SEEDERS).filter((n) => !skip.has(n));
  } else if (args.length === 0 || (args.length === 1 && skipIdx >= 0)) {
    names = Object.keys(SEEDERS);
  } else {
    // Filter out -- flags
    names = args.filter((a) => !a.startsWith("--"));
  }

  // Topological sort
  const order = topoSort(names);

  console.log("🌱  Seeding in order:", order.join(" → "));
  console.log("");

  const sqlite = new Database("./database/koperasi.db");
  sqlite.pragma("journal_mode = WAL");
  const db = drizzle(sqlite, { schema }) as any;

  let success = 0;
  let failed = 0;

  for (const name of order) {
    const def = SEEDERS[name];
    process.stdout.write(`  ⏳ ${def.name}... `);
    try {
      await def.fn(db);
      process.stdout.write(`✅\n`);
      success++;
    } catch (err: any) {
      process.stdout.write(`❌ ${err.message || err}\n`);
      failed++;
    }
  }

  console.log(`\n📊  Done: ${success} succeeded, ${failed} failed`);
  sqlite.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Runner failed:", err);
  process.exit(1);
});
