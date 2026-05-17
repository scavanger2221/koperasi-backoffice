import { db } from "../lib/db.js";

export interface SearchResult {
  type: string;
  id: string;
  label: string;
  subtitle: string;
  url: string;
}

/**
 * Search across all entity tables.
 * Runs parallel queries per entity (each with a small LIMIT),
 * then combines and sorts in-memory.
 * This avoids SQLite's limitations with LIMIT inside UNION ALL.
 */
export class SearchService {
  async search(q: string, limit = 12): Promise<SearchResult[]> {
    if (!q || q.trim().length < 2) return [];

    const term = `%${q.trim()}%`;
    const sql = db.$client;

    // Each entity query fetches a capped number of results
    const queries: (() => SearchResult[])[] = [
      () => sql.prepare(`
        SELECT 'anggota' AS type, id,
               nama AS label,
               no_anggota || ' • ' || status AS subtitle,
               '/anggota' AS url
        FROM anggota
        WHERE nama LIKE ? COLLATE NOCASE
           OR no_anggota LIKE ? COLLATE NOCASE
           OR nik LIKE ? COLLATE NOCASE
        LIMIT 3
      `).all(term, term, term) as SearchResult[],

      () => sql.prepare(`
        SELECT 'pinjaman' AS type, p.id,
               p.no_pinjaman AS label,
               a.nama || ' • ' || p.status AS subtitle,
               '/pinjaman' AS url
        FROM pinjaman p
        LEFT JOIN anggota a ON a.id = p.anggota_id
        WHERE p.no_pinjaman LIKE ? COLLATE NOCASE
           OR a.nama LIKE ? COLLATE NOCASE
        LIMIT 3
      `).all(term, term) as SearchResult[],

      () => sql.prepare(`
        SELECT 'simpanan' AS type, s.id,
               a.nama AS label,
               s.jenis || ' • Rp ' || CAST(ROUND(CAST(s.jumlah AS REAL)) AS TEXT) AS subtitle,
               '/simpanan' AS url
        FROM simpanan s
        LEFT JOIN anggota a ON a.id = s.anggota_id
        WHERE a.nama LIKE ? COLLATE NOCASE
           OR s.jenis LIKE ? COLLATE NOCASE
        LIMIT 3
      `).all(term, term) as SearchResult[],

      () => sql.prepare(`
        SELECT 'tagihan' AS type, t.id,
               a.nama AS label,
               t.periode || ' • ' || t.status AS subtitle,
               '/tagihan' AS url
        FROM tagihan_simpanan t
        LEFT JOIN anggota a ON a.id = t.anggota_id
        WHERE a.nama LIKE ? COLLATE NOCASE
           OR t.periode LIKE ? COLLATE NOCASE
        LIMIT 2
      `).all(term, term) as SearchResult[],

      () => sql.prepare(`
        SELECT 'shu' AS type, id,
               'SHU ' || periode AS label,
               status || ' • Rp ' || CAST(ROUND(CAST(total_shu AS REAL)) AS TEXT) AS subtitle,
               '/shu' AS url
        FROM shu
        WHERE periode LIKE ? COLLATE NOCASE
        LIMIT 2
      `).all(term) as SearchResult[],

      () => sql.prepare(`
        SELECT 'rat' AS type, id,
               'RAT ' || periode AS label,
               tempat || ' • ' || status AS subtitle,
               '/rat' AS url
        FROM rat
        WHERE periode LIKE ? COLLATE NOCASE
           OR tempat LIKE ? COLLATE NOCASE
        LIMIT 2
      `).all(term, term) as SearchResult[],

      () => sql.prepare(`
        SELECT 'user' AS type, id,
               nama AS label,
               email || ' • ' || role AS subtitle,
               '/users' AS url
        FROM users
        WHERE nama LIKE ? COLLATE NOCASE
           OR email LIKE ? COLLATE NOCASE
        LIMIT 2
      `).all(term, term) as SearchResult[],

      () => sql.prepare(`
        SELECT 'akun' AS type, id,
               kode || ' - ' || nama AS label,
               tipe AS subtitle,
               '/buku-kas' AS url
        FROM akun
        WHERE kode LIKE ? COLLATE NOCASE
           OR nama LIKE ? COLLATE NOCASE
        LIMIT 2
      `).all(term, term) as SearchResult[],

      () => sql.prepare(`
        SELECT 'jurnal' AS type, id,
               no_jurnal AS label,
               keterangan || ' • ' || ref_tipe AS subtitle,
               '/buku-kas' AS url
        FROM jurnal
        WHERE no_jurnal LIKE ? COLLATE NOCASE
           OR keterangan LIKE ? COLLATE NOCASE
        LIMIT 2
      `).all(term, term) as SearchResult[],
    ];

    // Run all queries, flatten, sort, cap
    const results = queries
      .flatMap((fn) => fn())
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, limit);

    return results;
  }
}

export const searchService = new SearchService();
