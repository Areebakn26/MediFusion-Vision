# How to Convert Chapter 5 Testing Document to Word/PDF

## Method 1: Using Microsoft Word (Recommended)

1. **Open the Markdown file:**
   - Open `Chapter_5_Testing_and_Evaluation_FYP.md` in any text editor
   - Copy all the content (Ctrl+A, Ctrl+C)

2. **Paste into Word:**
   - Open Microsoft Word
   - Paste the content (Ctrl+V)
   - Word will automatically format the tables

3. **Format the document:**
   - Select all text (Ctrl+A)
   - Set font: Times New Roman or Arial, Size 12
   - Set line spacing: 1.5 or Double
   - Add page numbers (Insert > Page Number)
   - Format headings:
     - Chapter title: Bold, Size 16, Center
     - Section headings (5.1, 5.2, etc.): Bold, Size 14
     - Subsection headings: Bold, Size 12

4. **Format tables:**
   - Select each table
   - Go to Table Design
   - Apply a table style (e.g., Grid Table 4 - Accent 1)
   - Ensure all columns are visible
   - Center align table numbers

5. **Add table of contents:**
   - Place cursor after "Table of Contents"
   - Go to References > Table of Contents > Automatic Table 1

6. **Save as Word:**
   - File > Save As > Word Document (.docx)

7. **Export to PDF (if needed):**
   - File > Save As > PDF

## Method 2: Using Pandoc (Command Line)

If you have Pandoc installed:

```bash
# Install Pandoc first (if not installed)
# Windows: choco install pandoc
# Mac: brew install pandoc
# Linux: sudo apt-get install pandoc

# Convert to Word
pandoc Chapter_5_Testing_and_Evaluation_FYP.md -o Chapter_5_Testing_and_Evaluation.docx

# Convert to PDF (requires LaTeX)
pandoc Chapter_5_Testing_and_Evaluation_FYP.md -o Chapter_5_Testing_and_Evaluation.pdf
```

## Method 3: Using Online Converters

1. **Markdown to Word:**
   - Visit: https://www.markdowntoword.com/
   - Upload `Chapter_5_Testing_and_Evaluation_FYP.md`
   - Download the Word document

2. **Markdown to PDF:**
   - Visit: https://www.markdowntopdf.com/
   - Upload the file
   - Download the PDF

## Method 4: Using VS Code Extensions

1. Install "Markdown PDF" extension in VS Code
2. Open `Chapter_5_Testing_and_Evaluation_FYP.md`
3. Right-click > "Markdown PDF: Export (pdf)"
4. For Word: Use "Markdown to Word" extension

## Formatting Checklist

Before submitting, ensure:

- [ ] All tables are properly formatted and visible
- [ ] Page numbers are added
- [ ] Table of contents is updated
- [ ] Headings are properly styled
- [ ] Font is consistent (Times New Roman 12pt recommended)
- [ ] Line spacing is 1.5 or double
- [ ] Margins are set (1 inch on all sides)
- [ ] Code blocks are properly formatted
- [ ] All test results are filled in
- [ ] Document is spell-checked

## Quick Formatting Tips

### Table Formatting in Word:
1. Select table
2. Right-click > Table Properties
3. Set alignment: Center
4. Set text wrapping: None
5. Go to Borders and Shading
6. Apply borders to all cells

### Heading Styles:
- Use Word's built-in heading styles (Heading 1, Heading 2, etc.)
- This helps with table of contents generation

### Page Breaks:
- Insert page breaks before major sections if needed
- Insert > Page Break

---

**Recommended:** Use Method 1 (Microsoft Word) for best formatting control.

