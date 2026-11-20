import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { STARTER_CATEGORIES, STARTER_POSTS } from './src/data/starterContent.ts';
import type { Category, Post } from './src/types/content.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId?: string;
}

function loadFirebaseConfig(): FirebaseConfig | null {
  try {
    const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as FirebaseConfig;
  } catch {
    return null;
  }
}

function decodeFirestoreValue(val: Record<string, unknown> | undefined): unknown {
  if (!val) return undefined;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('timestampValue' in val) return String(val.timestampValue);
  if ('arrayValue' in val) {
    const arr = val.arrayValue as { values?: Record<string, unknown>[] };
    return (arr.values || []).map((item) => decodeFirestoreValue(item));
  }
  return undefined;
}

function decodeDocFields(fields: Record<string, Record<string, unknown>> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!fields) return out;
  for (const [k, v] of Object.entries(fields)) {
    out[k] = decodeFirestoreValue(v);
  }
  return out;
}

let cachedData: { categories: Category[]; posts: Post[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 15000;

async function fetchPublicSeoData(): Promise<{ categories: Category[]; posts: Post[] }> {
  const now = Date.now();
  if (cachedData && now - cachedData.fetchedAt < CACHE_TTL_MS) {
    return { categories: cachedData.categories, posts: cachedData.posts };
  }

  const fb = loadFirebaseConfig();
  if (!fb || !fb.projectId || !fb.apiKey) {
    return { categories: STARTER_CATEGORIES, posts: STARTER_POSTS };
  }

  const dbId = fb.firestoreDatabaseId || '(default)';
  const base = `https://firestore.googleapis.com/v1/projects/${fb.projectId}/databases/${dbId}/documents`;

  try {
    const [catRes, postRes] = await Promise.all([
      fetch(`${base}/categories?pageSize=100&key=${encodeURIComponent(fb.apiKey)}`),
      fetch(`${base}:runQuery?key=${encodeURIComponent(fb.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'posts' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'published' },
                op: 'EQUAL',
                value: { booleanValue: true },
              },
            },
            limit: 500,
          },
        }),
      }),
    ]);

    let categories: Category[] = [];
    if (catRes.ok) {
      const catJson = (await catRes.json()) as {
        documents?: Array<{ name: string; fields?: Record<string, Record<string, unknown>> }>;
      };
      categories = (catJson.documents || []).map((doc) => {
        const d = decodeDocFields(doc.fields);
        const docId = doc.name.split('/').pop() || '';
        return {
          id: String(d.id || docId),
          name: String(d.name || ''),
          slug: String(d.slug || docId),
          description: String(d.description || ''),
          colorTheme: (d.colorTheme || 'sky') as Category['colorTheme'],
          illustration: String(d.illustration || 'preset:science'),
          order: typeof d.order === 'number' ? d.order : 10,
        };
      });
      categories.sort((a, b) => a.order - b.order);
    }

    let posts: Post[] = [];
    if (postRes.ok) {
      const rows = (await postRes.json()) as Array<{
        document?: { name: string; fields?: Record<string, Record<string, unknown>> };
      }>;
      posts = rows
        .filter((r) => Boolean(r.document))
        .map((r) => {
          const doc = r.document!;
          const d = decodeDocFields(doc.fields);
          const docId = doc.name.split('/').pop() || '';
          return {
            id: String(d.id || docId),
            title: String(d.title || ''),
            slug: String(d.slug || docId),
            summary: String(d.summary || ''),
            contentHtml: String(d.contentHtml || ''),
            categoryId: String(d.categoryId || ''),
            categoryName: String(d.categoryName || ''),
            coverImage: String(d.coverImage || 'preset:science'),
            keywords: Array.isArray(d.keywords) ? d.keywords.map(String) : [],
            ageGroup: String(d.ageGroup || '۸ تا ۱۰ سال'),
            readingMinutes: typeof d.readingMinutes === 'number' ? d.readingMinutes : 3,
            published: Boolean(d.published),
            authorName: String(d.authorName || 'مدیر وب‌جیکو'),
            createdAt: String(d.createdAt || new Date().toISOString()),
            updatedAt: String(d.updatedAt || new Date().toISOString()),
          };
        });
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const finalCats = categories.length > 0 ? categories : STARTER_CATEGORIES;
    const finalPosts = posts.length > 0 ? posts : STARTER_POSTS;
    cachedData = { categories: finalCats, posts: finalPosts, fetchedAt: now };
    return { categories: finalCats, posts: finalPosts };
  } catch {
    return { categories: STARTER_CATEGORIES, posts: STARTER_POSTS };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getBaseUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

function buildSeoPayload(
  reqPath: string,
  baseUrl: string,
  categories: Category[],
  posts: Post[]
): {
  title: string;
  description: string;
  canonical: string;
  ogType: string;
  jsonLd: string;
  ssrHtml: string;
} {
  const postMatch = reqPath.match(/^\/post\/([^/]+)\/?$/);
  const catMatch = reqPath.match(/^\/category\/([^/]+)\/?$/);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  if (postMatch) {
    const slug = decodeURIComponent(postMatch[1]);
    const post = posts.find((p) => p.slug === slug);
    if (post) {
      const cat = categoryMap.get(post.categoryId);
      const canonical = `${baseUrl}/post/${encodeURIComponent(post.slug)}`;
      const ld = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.summary,
            inLanguage: 'fa-IR',
            datePublished: post.createdAt,
            dateModified: post.updatedAt,
            author: { '@type': 'Person', name: post.authorName || 'تیم تحریریه وب‌جیکو' },
            publisher: { '@type': 'Organization', name: 'webjiko | وب‌جیکو' },
            mainEntityOfPage: canonical,
            articleSection: post.categoryName || cat?.name || 'کودکان',
            keywords: (post.keywords || []).join(', '),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'صفحه نخست', item: baseUrl },
              ...(cat
                ? [
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: cat.name,
                      item: `${baseUrl}/category/${encodeURIComponent(cat.slug)}`,
                    },
                  ]
                : []),
              {
                '@type': 'ListItem',
                position: cat ? 3 : 2,
                name: post.title,
                item: canonical,
              },
            ],
          },
        ],
      };

      const ssrHtml = `
        <header><a href="/">webjiko</a></header>
        <main>
          <article>
            <h1>${escapeHtml(post.title)}</h1>
            <p>${escapeHtml(post.summary)}</p>
            <div>${post.contentHtml}</div>
          </article>
          <nav aria-label="سایر نوشته‌ها">
            <ul>${posts
              .map((p) => `<li><a href="/post/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a></li>`)
              .join('')}</ul>
          </nav>
        </main>
      `;

      return {
        title: `${post.title} | webjiko`,
        description: post.summary,
        canonical,
        ogType: 'article',
        jsonLd: JSON.stringify(ld),
        ssrHtml,
      };
    }
  }

  if (catMatch) {
    const slug = decodeURIComponent(catMatch[1]);
    const cat = categories.find((c) => c.slug === slug);
    if (cat) {
      const catPosts = posts.filter((p) => p.categoryId === cat.id);
      const canonical = `${baseUrl}/category/${encodeURIComponent(cat.slug)}`;
      const ld = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${cat.name} | webjiko`,
        description: cat.description,
        url: canonical,
        inLanguage: 'fa-IR',
      };

      const ssrHtml = `
        <header><a href="/">webjiko</a></header>
        <main>
          <h1>${escapeHtml(cat.name)}</h1>
          <p>${escapeHtml(cat.description)}</p>
          <ul>
            ${catPosts
              .map(
                (p) =>
                  `<li><a href="/post/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a> — ${escapeHtml(p.summary)}</li>`
              )
              .join('')}
          </ul>
        </main>
      `;

      return {
        title: `${cat.name} | webjiko`,
        description: cat.description,
        canonical,
        ogType: 'website',
        jsonLd: JSON.stringify(ld),
        ssrHtml,
      };
    }
  }

  // Default: Homepage /
  const canonical = `${baseUrl}/`;
  const title = 'webjiko | دنیای شاد دانش، داستان و بازی فکری برای بچه‌های ۸ تا ۱۰ ساله';
  const description =
    'وب‌جیکو (webjiko) یک مجله فارسی شاد و رنگارنگ پر از داستان‌های خیال‌انگیز، آزمایش‌های علمی ساده و معماهای جذاب برای بچه‌های ۸ تا ۱۰ ساله است.';

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'webjiko | وب‌جیکو',
        url: canonical,
        inLanguage: 'fa-IR',
        description,
      },
      {
        '@type': 'Blog',
        name: 'وب‌جیکو (webjiko)',
        url: canonical,
        inLanguage: 'fa-IR',
        blogPost: posts.slice(0, 50).map((p) => ({
          '@type': 'BlogPosting',
          headline: p.title,
          url: `${baseUrl}/post/${encodeURIComponent(p.slug)}`,
          datePublished: p.createdAt,
          description: p.summary,
        })),
      },
    ],
  };

  const ssrHtml = `
    <header>
      <a href="/">webjiko</a>
      <nav>
        ${categories
          .map((c) => `<a href="/category/${encodeURIComponent(c.slug)}">${escapeHtml(c.name)}</a>`)
          .join(' ')}
      </nav>
    </header>
    <main>
      <h1>با وب‌جیکو دنیا را رنگارنگ‌تر کشف کن!</h1>
      <p>${escapeHtml(description)}</p>
      <section>
        <h2>فهرست کامل همه نوشته‌ها و لینک‌ها</h2>
        <ul>
          ${posts
            .map(
              (p) =>
                `<li><article><h3><a href="/post/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a></h3><p>${escapeHtml(p.summary)}</p></article></li>`
            )
            .join('')}
        </ul>
      </section>
    </main>
  `;

  return {
    title,
    description,
    canonical,
    ogType: 'website',
    jsonLd: JSON.stringify(ld),
    ssrHtml,
  };
}

function injectSeoIntoHtml(
  template: string,
  seo: ReturnType<typeof buildSeoPayload>
): string {
  const safeTitle = escapeHtml(seo.title);
  const safeDesc = escapeHtml(seo.description);
  const safeCanonical = escapeHtml(seo.canonical);

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${safeDesc}" />`
    )
    .replace(
      /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:type" content="${seo.ogType}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${safeTitle}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${safeDesc}" />`
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${safeTitle}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${safeDesc}" />`
    );

  const metaTags = `
    <link rel="canonical" href="${safeCanonical}" />
    <meta property="og:url" content="${safeCanonical}" />
  `.trim();

  const jsonLdScript = `<script type="application/ld+json">${seo.jsonLd}</script>`;

  html = html
    .replace('<!--SEO_META-->', metaTags)
    .replace('<!--SEO_JSONLD-->', jsonLdScript)
    .replace('<!--SSR_APP_CONTENT-->', seo.ssrHtml);

  return html;
}

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '1mb' }));

  app.post('/api/seo-refresh', (_req: Request, res: Response) => {
    cachedData = null;
    res.json({ ok: true });
  });

  app.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);
    res.type('text/plain; charset=utf-8').send(
      `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`
    );
  });

  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);
    const { categories, posts } = await fetchPublicSeoData();
    const today = new Date().toISOString().split('T')[0];

    const urls = [
      `  <url>\n    <loc>${escapeHtml(baseUrl)}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
      ...categories.map(
        (cat) =>
          `  <url>\n    <loc>${escapeHtml(baseUrl)}/category/${encodeURIComponent(cat.slug)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
      ),
      ...posts.map((post) => {
        const lastmod = (post.updatedAt || post.createdAt || today).split('T')[0];
        return `  <url>\n    <loc>${escapeHtml(baseUrl)}/post/${encodeURIComponent(post.slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>`;
      }),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    res.type('application/xml; charset=utf-8').send(xml);
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use(async (req: Request, res: Response, next) => {
      if (req.method !== 'GET' || req.originalUrl.startsWith('/api/')) {
        return next();
      }
      try {
        const rawTemplate = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
        const { categories, posts } = await fetchPublicSeoData();
        const seo = buildSeoPayload(req.path, getBaseUrl(req), categories, posts);
        const finalHtml = injectSeoIntoHtml(transformed, seo);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(finalHtml);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir, { index: false }));

    app.use(async (req: Request, res: Response, next) => {
      if (req.method !== 'GET' || req.originalUrl.startsWith('/api/')) {
        return next();
      }
      try {
        const distTemplate = fs.readFileSync(path.resolve(distDir, 'index.html'), 'utf-8');
        const { categories, posts } = await fetchPublicSeoData();
        const seo = buildSeoPayload(req.path, getBaseUrl(req), categories, posts);
        const finalHtml = injectSeoIntoHtml(distTemplate, seo);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(finalHtml);
      } catch (err) {
        next(err);
      }
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`webjiko server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
