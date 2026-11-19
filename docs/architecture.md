# Architecture — original Google Sheets automation

```text
User selects custom Google Sheets menu → Search Subreddit dialog
                  │
                  ▼
          Google Apps Script
                  │
            Reddit JSON GET
                  │
                  ▼
        Recent subreddit posts
                  │
                  ├── titles, bodies, subreddits, vote count, permalinks
                  │
                  ▼
       BlogContent in Google Sheets
                  │
                  └── title, category, comma-separated keywords
                  │
                  ▼
     Nested keyword relevance comparison
                  │
                  ├── matching Reddit post + blog entry
                  ▼
         Optional Gemini API call
                  │
                  └── draft comment (not automatically published)
                  ▼
        RedditMatches in Google Sheets
                  │
                  ▼
          Human editorial review
```

## Interfaces in the recovered code

- `onOpen()` creates the spreadsheet menu.
- `showSearchDialog()` prompts for a subreddit name.
- `searchSubredditForMatches()` fetches subreddit `/new.json` and matches topics against a `BlogContent` sheet.
- `getBlogContentByTitle()` reads an assumed fourth column for blog text.
- `generateCommentWithGemini()` assembles a prompt and sends it to the historical Gemini endpoint using an API key stored in Script Properties.

The earlier code also contains `getRedditDataAndMatchBlog()` for matching a single Reddit post by URL. The recovered file contains multiple definitions of two functions, which shows that it includes intermediate and later iterations, not a clean single-release snapshot.

## Data provenance

A historical spreadsheet was recovered separately, with 231 blog inventory rows, 21 matched output rows, and 4 distinct Reddit discussion URLs. No actual employer dataset is included in this public archive. The screenshot is of the user-facing dialog, not confidential business data.
