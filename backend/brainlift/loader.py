import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

BRAINLIFT_DOCX = Path(__file__).parent.parent.parent / "BSS_Magic_Sales_BrainLift.docx"
CACHE_PATH = Path(__file__).parent.parent / "data" / "brainlift_cache.txt"


def extract_brainlift_text() -> str:
    """Extract plain text from the BrainLift Word document.

    Caches the result to disk so the .docx is only parsed once.
    Delete brainlift_cache.txt to force re-extraction.
    """
    if CACHE_PATH.exists():
        return CACHE_PATH.read_text(encoding="utf-8")

    if not BRAINLIFT_DOCX.exists():
        return "(BrainLift document not found)"

    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

    with zipfile.ZipFile(BRAINLIFT_DOCX, "r") as z:
        with z.open("word/document.xml") as f:
            tree = ET.parse(f)
            root = tree.getroot()

    lines = []
    for p in root.findall(".//w:p", ns):
        texts = p.findall(".//w:t", ns)
        line = "".join(t.text for t in texts if t.text)
        if line.strip():
            lines.append(line.strip())

    text = "\n".join(lines)
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(text, encoding="utf-8")
    return text
