#!/usr/bin/env node
/**
 * 번역 정합성 검사.
 *
 * 이 검사가 있는 이유: 네임스페이스 목록이 request.ts와 layout.tsx 두 곳에
 * 있어서 어긋났고, 그 결과 클라이언트 컴포넌트에서만 backlog·ai 번역이
 * 비었다. 타입 검사로는 절대 안 잡히는 종류의 사고라 스크립트로 막는다.
 *
 *   node scripts/check-i18n.mjs
 */
import fs from 'fs'
import path from 'path'

const LOCALE_DIR = 'locale'
const REQUEST_FILE = 'src/i18n/request.ts'
const SRC = 'src'

let failures = 0
const fail = (msg) => {
  console.error('✗ ' + msg)
  failures++
}

/* ── 1. locale 폴더의 파일이 모두 NAMESPACES에 등록됐는가 ───────── */
const locales = fs.readdirSync(LOCALE_DIR).filter((d) => fs.statSync(path.join(LOCALE_DIR, d)).isDirectory())
const [base, ...others] = locales

const registered = new Set(
  [...fs.readFileSync(REQUEST_FILE, 'utf8').matchAll(/^\s*'([a-z]+)',$/gm)].map((m) => m[1]),
)
const files = fs.readdirSync(path.join(LOCALE_DIR, base)).map((f) => f.replace('.json', ''))

for (const ns of files) {
  if (!registered.has(ns)) fail(`'${ns}' 네임스페이스가 ${REQUEST_FILE}의 NAMESPACES에 없습니다`)
}
for (const ns of registered) {
  if (!files.includes(ns)) fail(`NAMESPACES의 '${ns}'에 대응하는 ${base}/${ns}.json이 없습니다`)
}

/* ── 2. 로케일 간 키 경로가 일치하는가 ─────────────────────────── */
const paths = (o, p = '') =>
  o && typeof o === 'object' && !Array.isArray(o)
    ? Object.entries(o).flatMap(([k, v]) => paths(v, p ? `${p}.${k}` : k))
    : [p]

const read = (loc, ns) => JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, loc, ns + '.json'), 'utf8'))

for (const ns of files) {
  const baseKeys = new Set(paths(read(base, ns)))
  for (const loc of others) {
    if (!fs.existsSync(path.join(LOCALE_DIR, loc, ns + '.json'))) {
      fail(`${loc}/${ns}.json이 없습니다`)
      continue
    }
    const keys = new Set(paths(read(loc, ns)))
    for (const k of baseKeys) if (!keys.has(k)) fail(`${loc}/${ns}.json에 '${k}' 없음`)
    for (const k of keys) if (!baseKeys.has(k)) fail(`${base}/${ns}.json에 '${k}' 없음`)
  }
}

/* ── 3. 코드가 쓰는 키가 실제로 존재하는가 ─────────────────────── */
const messages = Object.fromEntries(files.map((ns) => [ns, read(base, ns)]))

function resolve(ns, key) {
  const parts = [...String(ns).split('.'), ...String(key).split('.')]
  let cur = messages[parts[0]]
  if (cur === undefined) return 'NO_NS'
  for (const p of parts.slice(1)) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p]
    else return false
  }
  return true
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (/\.(tsx|ts)$/.test(e.name)) acc.push(p)
  }
  return acc
}

for (const file of walk(SRC)) {
  const s = fs.readFileSync(file, 'utf8')
  const vars = {}
  for (const m of s.matchAll(
    /const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*'([^']+)'\s*\)/g,
  ))
    vars[m[1]] = m[2]
  if (!Object.keys(vars).length) continue

  for (const m of s.matchAll(/\b(\w+)(?:\.(?:rich|raw))?\(\s*'([^']+)'/g)) {
    const [, v, key] = m
    if (!(v in vars)) continue
    const r = resolve(vars[v], key)
    const where = file.replace(/^src\//, '')
    if (r === 'NO_NS') fail(`${where}: 네임스페이스 '${vars[v]}' 없음`)
    else if (!r) fail(`${where}: '${vars[v]}.${key}' 없음`)
  }
}

if (failures) {
  console.error(`\n${failures}건 발견`)
  process.exit(1)
}
console.log('✓ i18n 정합성 통과 (네임스페이스 등록 / 로케일 간 키 / 코드 사용 키)')
