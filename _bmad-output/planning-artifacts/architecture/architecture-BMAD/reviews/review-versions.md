# Independent Re-verification: Stack Versions & ExifReader-vs-exifr Claims

**Reviewed doc:** `ARCHITECTURE-SPINE.md` (Stack table + AD-2)
**Checked against:** live npm registry (`registry.npmjs.org`) and GitHub source (ExifReader + exifr READMEs/changelogs), 2026-07-06.

## 1. Stack table versions — all 9 MATCH exactly

| Package | Claimed | npm registry `latest` (re-checked now) | Match |
| --- | --- | --- | --- |
| pnpm | 11.10.0 | 11.10.0 | ✅ |
| Turborepo (`turbo`) | 2.10.3 | 2.10.3 | ✅ |
| React | 19.2.7 | 19.2.7 | ✅ |
| Vite | 8.1.3 | 8.1.3 | ✅ |
| Astro | 7.0.6 | 7.0.6 | ✅ |
| TypeScript | 6.0.3 | 6.0.3 | ✅ |
| Zustand | 5.0.14 | 5.0.14 | ✅ |
| ExifReader | 4.41.0 | 4.41.0 | ✅ |
| Vitest | 4.1.10 | 4.1.10 | ✅ |

No discrepancies found. (Method: `curl -s https://registry.npmjs.org/<pkg>/latest` for each package, parsed `.version`.)

## 2. ExifReader publish-date and HEIC/HEIF-support claims — CONFIRMED

- **"last published 2026-06-08"**: confirmed. Registry `time` field for version 4.41.0 = `2026-06-08T09:29:27.899Z`.
- **"explicitly supports HEIC/HEIF/JPEG/PNG/TIFF/WebP/AVIF"**: confirmed. `README.md` (github.com/mattiasw/ExifReader, master) line 6: "Supports JPEG, JPEG XL, TIFF, PNG, HEIC, AVIF, WebP, and ..." plus a support matrix (lines 26–34) showing HEIC/HEIF and AVIF rows with Exif=yes, XMP=yes, ICC=yes, Thumbnail=yes.
- **`length: 'auto'` partial-byte-read claim**: confirmed, documented in README lines 370–433 (dedicated section "Read only the metadata bytes (`length: 'auto'`)", including a stated ~17% slowdown avoided and sub-1ms performance discussion).

## 3. exifr claims — version/staleness CONFIRMED, but the HEIC/HEIF-support claim is **FALSE**

- **"exifr 7.1.3, unpublished since 2021-08"**: confirmed. Registry `latest` = 7.1.3, published `2021-08-05T08:00:59.676Z`; no newer version exists (last 5 published versions all cluster in 2021-05 to 2021-08).
- **"no documented HEIC/HEIF support"**: **NOT accurate — this claim does not hold up.** exifr's README (github.com/MikeKovarik/exifr) extensively documents HEIC support, and this is not late/unreleased drift:
  - The last commit to the entire repo is the 7.1.3 release commit itself (`6cbf6e9`, 2021-08-05T08:00:24Z); the README's last edit (`f5e29132`, same day/minute-scale) is part of that same release. So the README content fetched from `master` today is exactly what shipped in the published 7.1.3 — there is no unpublished-feature drift to discount.
  - README line 41: "Files: **.jpg**, **.tif**, **.png**, **.heic**, .avif, .iiq"
  - README line 139: a dedicated **"lite"** build variant described as "Reads JPEG and HEIC."
  - A dedicated HEIC file-parser module is documented for manual/tree-shaken imports: `import 'exifr/src/file-parsers/heic.mjs'` (line 832).
  - CHANGELOG.md shows HEIC support was added in **v3.0.0** (2019) and refined multiple times pre-2021, e.g. v5.0.4/5.0.6 fixed HEIC-specific parsing bugs — well before the final 7.1.3 release, so it long predates and is included in the last published version.
  - The npm package metadata itself lists `heic`/`heif` among its `keywords`.

**Net effect:** the "unpublished since 2021" staleness point is accurate and remains a legitimate reason to prefer ExifReader (actively maintained, published as recently as 2026-06-08, vs. exifr dormant for ~5 years). But the specific "no documented HEIC/HEIF support" justification used in the Stack/AD-2 rationale is factually wrong — exifr does document HEIC (and partial AVIF) support. This part of the decision's stated reasoning should be corrected or dropped; the staleness/maintenance argument alone is sufficient to support the ExifReader choice, but the doc currently overstates the case with an incorrect claim.

## Verification commands used (for reproducibility)

```bash
curl -s https://registry.npmjs.org/<pnpm|turbo|react|vite|astro|typescript|zustand|exifreader|vitest|exifr>/latest
curl -s https://registry.npmjs.org/exifreader   # .time[<version>] for publish dates
curl -s https://registry.npmjs.org/exifr        # .time[<version>] for publish dates
curl -s https://raw.githubusercontent.com/mattiasw/ExifReader/master/README.md
curl -s https://raw.githubusercontent.com/MikeKovarik/exifr/master/README.md
curl -s https://raw.githubusercontent.com/MikeKovarik/exifr/master/CHANGELOG.md
curl -s https://api.github.com/repos/MikeKovarik/exifr/commits?per_page=5
curl -s https://api.github.com/repos/MikeKovarik/exifr/commits?path=README.md&per_page=5
```
