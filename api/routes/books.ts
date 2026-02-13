import { Router } from 'express';
import { AuthenticatedRequest, authenticateFirebaseToken } from './middleware/firebaseAuth';

const BASE_URL = "https://openlibrary.org";
const COVER_BASE_URL = "https://covers.openlibrary.org";

type LanguageKey = { key: string };
type Key = { key: string };
type AuthorRef = { author: Key };
type EditionRef = { key: string, language:string[] };

interface SearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  language?: string[];
  editions:{docs:EditionRef[]}
}

interface Work {
  key: string;
  title: string;
  description?: string | { value: string };
  authors?: AuthorRef[];
}

interface Edition {
  key: string;
  title: string;
  authors?: Key[];
  subtitle?: string;
  number_of_pages?: number;
  publish_date?: string;
  isbn_10?: string[];
  isbn_13?: string[];
  languages?: LanguageKey[];
  covers?: number[];
  works?: Key[];
}

export interface StandardizedBook {
  id: string;
  editionId: string;
  title: string;
  subtitle?: string;
  authorNames: string[];
  numberOfPages?: number;
  description?: string;
  isbn: string[];
  publishDate?: string;
  coverUrl: {
    small?: string;
    large?: string;
  };
}


interface Author {
  name: string;
}

export class OpenLibraryService {
  /* ------------------------------------------------------------------ */
  /* Core fetch helper                                                    */
  /* ------------------------------------------------------------------ */

  private async fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`OpenLibrary error: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Search books in French only, normalized to StandardizedBook
   */
  async searchFrenchBooks(query: string): Promise<StandardizedBook[]> {
    const params = new URLSearchParams({
      q: `${query} language:fre`,
      limit: "5",
      sort: "editions",
      fields: "key,title,author_name,first_publish_year,language,editions,editions.key,editions.language"
    });
    
    const searchUrl = `${BASE_URL}/search.json?${params}`;
    const { docs } = await this.fetchJson<{ docs: SearchDoc[] }>(searchUrl);

    const frenchEditionKeys = docs
      .map(doc =>
        doc.editions?.docs.find(e => e.language?.includes("fre"))?.key
      )
      .filter((key): key is string => Boolean(key));
  
    const editions = await Promise.all(
      frenchEditionKeys.map(key => this.getEditionByKey(key))
    );

    const works = await Promise.all(
      editions.map(edition =>
        edition?.works?.[0]
          ? this.getWorkByKey(edition.works[0].key)
          : Promise.resolve(undefined)
      )
    );

    const standardizedBooks = await Promise.all(
      editions.map((edition, index) =>
        edition
          ? this.toStandardizedBook(edition, works[index])
          : Promise.resolve(null)
      )
    );

    return standardizedBooks.filter((b): b is StandardizedBook => b !== null);
  }

  /**
   * Fetch a book by Open Library ID (work or edition)
   */
  async getBookById(id: string): Promise<StandardizedBook | null> {
    const isWork = id.endsWith("W");

    if (isWork) {
      const work = await this.getWorkByKey(`/works/${id}`);
      const edition = await this.findFrenchEditionFromWork(work);
      if (!edition) return null;
      return this.toStandardizedBook(edition, work);
    }

    const edition = await this.getEditionByKey(`/books/${id}`);
    const work = edition.works?.[0]
      ? await this.getWorkByKey(edition.works[0].key)
      : undefined;

    if (!this.isFrenchEdition(edition)) return null;

    return this.toStandardizedBook(edition, work);
  }

  /**
   * Fetch by ISBN
   */
  async getBookByISBN(isbn: string): Promise<StandardizedBook | null> {
    const edition = await this.fetchJson<Edition>(
      `${BASE_URL}/isbn/${isbn}.json`
    );

    if (!this.isFrenchEdition(edition)) return null;

    const work = edition.works?.[0]
      ? await this.getWorkByKey(edition.works[0].key)
      : undefined;

    return this.toStandardizedBook(edition, work);
  }

  /* ------------------------------------------------------------------ */
  /* Internal helpers                                                    */
  /* ------------------------------------------------------------------ */

  private async getWorkByKey(key: string): Promise<Work> {
    return this.fetchJson<Work>(`${BASE_URL}${key}.json`);
  }

  private async getEditionByKey(key: string): Promise<Edition> {
    return this.fetchJson<Edition>(`${BASE_URL}${key}.json`);
  }

  /**
   * French-only edition filtering
   */
  private isFrenchEdition(edition: Edition): boolean {
    return edition.languages?.some(
      l => l.key === "/languages/fre" || l.key === "/languages/fra" || l.key === "fre"
    ) ?? false;
  }

  private async findFrenchEditionFromWork(work: Work): Promise<Edition | null> {
    const editions = await this.fetchJson<{ entries: Edition[] }>(
      `${BASE_URL}${work.key}/editions.json`
    );

    return editions.entries.find(e => this.isFrenchEdition(e)) ?? null;
  }

  /**
   * Author resolution
   */
  private async resolveAuthors(authors?: AuthorRef[]|Key[]): Promise<string[]> {
    if (!authors?.length) return [];

    return Promise.all(
      authors.map(async a => {
        const authorKey = 'author' in a ? a.author.key : a.key;
        const author = await this.fetchJson<Author>(
          `${BASE_URL}${authorKey}.json`
        );
        return author.name;
      })
    );
  }

  /**
   * Normalize Work + Edition → StandardizedBook
   */
  private async toStandardizedBook(
    edition: Edition,
    work?: Work
  ): Promise<StandardizedBook> {
    const authorNames = await this.resolveAuthors(edition?.authors);

    const coverId = edition?.covers?.[0];

    return {
      id: edition?.works?.[0]?.key.replace("/works/", "") ?? edition.key.replace("/books/", ""),
      editionId: edition.key.replace("/books/", ""),
      title: edition.title,
      subtitle: edition.subtitle,
      numberOfPages: edition.number_of_pages,
      authorNames,
      description:
        typeof work?.description === "string"
          ? work.description
          : work?.description?.value,
      isbn: [...(edition.isbn_13 ?? []), ...(edition.isbn_10 ?? [])],
      publishDate: edition?.publish_date,
      coverUrl: {
        small: coverId ? `${COVER_BASE_URL}/b/id/${coverId}-S.jpg` : undefined,
        large: coverId ? `${COVER_BASE_URL}/b/id/${coverId}-L.jpg` : undefined
      }
    };
  }
}


const router = Router();

// Apply middleware to all routes in this group
router.use(authenticateFirebaseToken);

const service = new OpenLibraryService();

/**
 * GET /books?query=harry+potter
 * Search by text query
 */
router.get('/', async (req: AuthenticatedRequest, res): Promise<any> => {
    try {
        const query = req.query.query as string;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }
        
        const books = await service.searchFrenchBooks(query);
        res.json({ books });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to search books' });
    }
});

/**
 * GET /books/isbn/:isbn
 * Search by ISBN
 */
router.get('/isbn/:isbn', async (req: AuthenticatedRequest, res): Promise<any> => {
    try {
        const { isbn } = req.params;
        if (typeof isbn !== 'string') {
            return res.status(400).json({ error: 'Invalid ISBN parameter' });
        }

        const edition = await service.getBookByISBN(isbn);
        res.json({ book: edition });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch book by ISBN' });
    }
});

/**
 * GET /books/:id
 * Fetch book by Open Library Work ID (stored in local DB)
 */
router.get('/id/:id', async (req: AuthenticatedRequest, res): Promise<any> => {
    try {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({ error: 'Invalid ISBN parameter' });
        }

        const book = await service.getBookById(id);
        res.json({ book });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch book by ID' });
    }
});

export default router;