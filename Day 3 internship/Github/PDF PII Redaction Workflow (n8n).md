# PDF PII Redaction Workflow (n8n)

Automated workflow that accepts a PDF upload via a form, detects personally identifiable information (PII) using AI, redacts it, and returns a clean redacted PDF.

## How It Works

```
On Form Submission1 (Form Trigger)
        │
        ▼
Extract Text From PDF1        → pulls raw text out of the uploaded PDF
        │
        ▼
Detect PII (AI)1              → GPT-5-mini scans the text and returns
                                 a JSON list of PII values + categories
        │
        ▼
Apply Redactions1             → finds each PII value in the original text
                                 and replaces it with [REDACTED:<type>]
        │
        ▼
Build HTML                    → converts redacted text into formatted
                                 HTML (paragraphs + line breaks preserved)
        │
        ▼
Convert HTML to PDF           → renders the HTML into a PDF file
                                 (via HTML/CSS to PDF API)
        │
        ▼
Form Ending                   → returns the redacted PDF to the user
                                 who submitted the form
```

## Nodes

| Node | Type | Purpose |
|---|---|---|
| On Form Submission1 | Form Trigger | Entry point — user uploads a PDF |
| Extract Text From PDF1 | Extract From File | Extracts raw text from the uploaded PDF |
| Detect PII (AI)1 | OpenAI (GPT-5-mini) | Identifies PII and returns structured JSON |
| Apply Redactions1 | Code | Replaces each detected PII value with a `[REDACTED:type]` tag |
| Build HTML | Code | Formats redacted text into clean, paragraph-preserving HTML |
| Convert HTML to PDF | HTML/CSS to PDF | Renders the HTML into a downloadable PDF |
| Form Ending | Form (Page Type: Form Ending) | Returns the final PDF to the user |

## PII Categories Detected

- Full name
- Date of birth
- Home / mailing address
- Phone number
- Email address
- Social security / national ID number
- Bank account number
- Credit card number
- Emergency contact details
- Signature / signature date

The detection prompt can be edited in the **Detect PII (AI)1** node's system message to add or remove categories.

## Known Limitations

- **Formatting fidelity**: Since redaction works on plain extracted text (not the PDF's original layout/XML), the output PDF will **not exactly match** the original's fonts, columns, tables, or precise spacing. Paragraph and line breaks are preserved, but complex layouts (multi-column forms, tables) will be simplified into plain text blocks.
- **Regex matching**: `Apply Redactions1` uses exact substring matching to redact values. If the AI-detected value doesn't match the exact text formatting in the extracted PDF text (e.g. slightly different spacing), that instance won't be redacted. Always spot-check output PDFs before relying on them for sensitive documents.
- **AI detection isn't guaranteed complete**: The AI model may occasionally miss PII or over/under-flag items. This workflow should be treated as an assist tool, not a guaranteed compliance solution — review redacted output before sharing.

## Setup Requirements

1. **OpenAI credential** — connected under `n8n free OpenAI API credits` (or your own OpenAI API key) for the PII detection step.
2. **HTML to PDF credential** — connected under `HTML to PDF account`, used to render the final redacted PDF.
3. Workflow must be **published/activated** for the Production form URL to accept live submissions (the Test URL only works for manual test runs).

## Testing

1. Open the workflow and use **"Pull in a test form submission"** or the Test Form URL.
2. Upload a sample PDF containing dummy PII.
3. Check the output of each node in order to confirm:
   - Extracted text looks correct
   - Detected PII list looks accurate
   - Redacted text has PII replaced
   - Final PDF renders and downloads correctly with formatting intact

## Possible Future Improvements

- Preserve original PDF layout more closely by extracting structured content (positions/tables) instead of plain text.
- Add a manual review step before the redacted PDF is returned.
- Log redaction counts/history to a database or spreadsheet for audit purposes.
- Support batch PDF uploads.
