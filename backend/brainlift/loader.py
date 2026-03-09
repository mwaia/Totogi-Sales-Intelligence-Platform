import xml.etree.ElementTree as ET
import zipfile
from html.parser import HTMLParser
from pathlib import Path

BRAINLIFT_DIR = Path(__file__).parent.parent.parent
CACHE_PATH = Path(__file__).parent.parent / "data" / "brainlift_cache.txt"

# Both BrainLift files — the Sales BrainLift (DOCX) and the Product BrainLift (HTML)
SALES_BRAINLIFT = BRAINLIFT_DIR / "BSS_Magic_Sales_BrainLift.docx"
PRODUCT_BRAINLIFT = next(BRAINLIFT_DIR.glob("WF*BrainLift*.html"), None)


class _HTMLTextExtractor(HTMLParser):
    """Extract text from HTML, preserving structure with indentation."""
    def __init__(self):
        super().__init__()
        self.lines: list[str] = []
        self._depth = 0
        self._in_content = False

    def handle_starttag(self, tag, attrs):
        if tag == "ul":
            self._depth += 1
        if tag == "span":
            for name, val in attrs:
                if name == "class" and val == "innerContentContainer":
                    self._in_content = True

    def handle_endtag(self, tag):
        if tag == "ul":
            self._depth = max(0, self._depth - 1)
        if tag == "span":
            self._in_content = False

    def handle_data(self, data):
        if self._in_content:
            text = data.strip()
            if text:
                indent = "  " * max(0, self._depth - 1)
                prefix = "- " if self._depth > 0 else ""
                self.lines.append(f"{indent}{prefix}{text}")


def _extract_docx(path: Path) -> str:
    """Extract text from a DOCX file."""
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    with zipfile.ZipFile(path, "r") as z:
        with z.open("word/document.xml") as f:
            tree = ET.parse(f)
            root = tree.getroot()
    lines = []
    for p in root.findall(".//w:p", ns):
        texts = p.findall(".//w:t", ns)
        line = "".join(t.text for t in texts if t.text)
        if line.strip():
            lines.append(line.strip())
    return "\n".join(lines)


def _extract_html(path: Path) -> str:
    """Extract structured text from a Workflowy-exported HTML BrainLift."""
    html = path.read_text(encoding="utf-8")
    parser = _HTMLTextExtractor()
    parser.feed(html)
    return "\n".join(parser.lines)


def extract_brainlift_text() -> str:
    """Extract and combine all BrainLift documents into a single knowledge base.

    Combines the Sales BrainLift (DOCX) and the Product BrainLift (HTML)
    into one comprehensive text. Caches the result to disk.
    Delete brainlift_cache.txt to force re-extraction.
    """
    if CACHE_PATH.exists():
        return CACHE_PATH.read_text(encoding="utf-8")

    parts = []

    # Product BrainLift (HTML) — the comprehensive company DNA
    if PRODUCT_BRAINLIFT and PRODUCT_BRAINLIFT.exists():
        product_text = _extract_html(PRODUCT_BRAINLIFT)
        if product_text:
            parts.append("=== BSS MAGIC PRODUCT BRAINLIFT (Company DNA & Methodology) ===\n")
            parts.append(product_text)

    # Sales BrainLift (DOCX) — the sales-specific methodology
    if SALES_BRAINLIFT.exists():
        sales_text = _extract_docx(SALES_BRAINLIFT)
        if sales_text:
            parts.append("\n\n=== BSS MAGIC SALES BRAINLIFT (Sales Strategy & Execution) ===\n")
            parts.append(sales_text)

    if not parts:
        text = "(BrainLift documents not found)"
    else:
        text = "\n".join(parts)

    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(text, encoding="utf-8")
    return text
