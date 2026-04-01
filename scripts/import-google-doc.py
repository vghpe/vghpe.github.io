#!/usr/bin/env python3
"""
import-google-doc.py

Imports a Google Docs markdown export into a bumped project version file.
Strips base64 image blobs, maps image placeholders to the previous version's
image paths (positional), and replaces the target file's body while keeping
its frontmatter intact.

Usage: python3 scripts/import-google-doc.py /absolute/path/to/target-version.md

Expects exactly one .md file in content/projects/_import/.
"""

import sys
import os
import re
import glob


def read_frontmatter(content):
    """Return (frontmatter_block, body) from a Hugo markdown file."""
    match = re.match(r'^(---\n.*?\n---\n)(.*)', content, re.DOTALL)
    if match:
        return match.group(1), match.group(2)
    return None, content


def extract_field(frontmatter, field):
    """Extract a single YAML scalar from frontmatter."""
    match = re.search(
        rf'^{field}:\s*["\']?(.*?)["\']?\s*$', frontmatter, re.MULTILINE
    )
    return match.group(1) if match else None


def extract_image_paths(content):
    """Return inline image paths in document order."""
    return re.findall(r'!\[[^\]]*\]\(([^)]+)\)', content)


def find_previous_version(projects_dir, document, major, minor):
    """Locate the previous version file and return its image paths."""
    if minor > 0:
        prev_rev = f"v{major}.{minor - 1}"
    else:
        return []

    for fname in sorted(os.listdir(projects_dir)):
        fpath = os.path.join(projects_dir, fname)
        if not fname.endswith('.md') or fname.startswith('_'):
            continue
        try:
            with open(fpath, 'r') as f:
                content = f.read()
            doc_pat = r'^document:\s*["\']?' + re.escape(document) + r'["\']?\s*$'
            rev_pat = r'^revision:\s*["\']?' + re.escape(prev_rev) + r'["\']?\s*$'
            if re.search(doc_pat, content, re.MULTILINE) and \
               re.search(rev_pat, content, re.MULTILINE):
                return extract_image_paths(content)
        except Exception:
            continue
    return []


def clean_export(raw):
    """Strip base64 reference definitions and clean Google Docs escaping."""
    lines = raw.split('\n')
    body_lines = []
    for line in lines:
        if re.match(r'^\[image\d+\]:\s*<data:', line):
            break
        body_lines.append(line)

    body = '\n'.join(body_lines).strip()

    # Google Docs escapes hyphens in headings: \- → -
    body = body.replace('\\-', '-')

    return body


def map_images(body, prev_images):
    """Replace reference-style [imageN] with inline paths or empty placeholders."""

    # Collect unique image numbers in document order
    refs = re.findall(r'\[image(\d+)\]', body)
    seen = set()
    ordered = []
    for r in refs:
        n = int(r)
        if n not in seen:
            seen.add(n)
            ordered.append(n)

    # Positional map: imageN → previous version path (or empty)
    image_map = {}
    for i, num in enumerate(sorted(ordered)):
        if i < len(prev_images):
            image_map[num] = prev_images[i]
        else:
            image_map[num] = ""

    def replace_ref(match):
        alt = match.group(2)
        num = int(match.group(3))
        path = image_map.get(num, "")
        if path:
            hint = f"<!-- IMAGE {num} — prev: {path} -->"
        else:
            hint = f"<!-- IMAGE {num} — TODO: add image path -->"
        return f"\n{hint}\n![{alt}]({path})\n"

    # Match optional bold wrappers: **![alt][imageN]**
    body = re.sub(
        r'(\*\*)?!\[([^\]]*)\]\[image(\d+)\](\*\*)?',
        replace_ref,
        body
    )

    # Collapse 3+ consecutive blank lines to 2
    body = re.sub(r'\n{3,}', '\n\n', body)

    return body, image_map


def main():
    if len(sys.argv) != 2:
        print("Usage: import-google-doc.py <target-file>")
        sys.exit(1)

    target_file = sys.argv[1]
    if not os.path.isfile(target_file):
        print(f"ERROR: Target file not found: {target_file}")
        sys.exit(1)

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    import_dir = os.path.join(repo_root, "content", "projects", "_import")

    if not os.path.isdir(import_dir):
        print("ERROR: content/projects/_import/ does not exist.")
        print("Create it and drop your Google Docs export there.")
        sys.exit(1)

    import_files = glob.glob(os.path.join(import_dir, "*.md"))
    if len(import_files) == 0:
        print("ERROR: No .md files in content/projects/_import/")
        sys.exit(1)
    if len(import_files) > 1:
        print("ERROR: Multiple .md files in content/projects/_import/")
        print("Keep only one export file at a time.")
        sys.exit(1)

    import_file = import_files[0]

    # --- Read target file ---
    with open(target_file, 'r') as f:
        target_content = f.read()

    frontmatter, _ = read_frontmatter(target_content)
    if not frontmatter:
        print("ERROR: Could not parse frontmatter in target file.")
        sys.exit(1)

    document = extract_field(frontmatter, 'document')
    rev_str = extract_field(frontmatter, 'revision')

    if not document or not rev_str:
        print("ERROR: Missing document or revision in target frontmatter.")
        sys.exit(1)

    rev_match = re.match(r'v(\d+)\.(\d+)', rev_str)
    if not rev_match:
        print(f"ERROR: Revision '{rev_str}' doesn't match vX.Y format.")
        sys.exit(1)

    major = int(rev_match.group(1))
    minor = int(rev_match.group(2))

    # --- Previous version images ---
    projects_dir = os.path.dirname(target_file)
    prev_images = find_previous_version(projects_dir, document, major, minor)

    # --- Clean export ---
    with open(import_file, 'r') as f:
        export_content = f.read()

    body = clean_export(export_content)
    body, image_map = map_images(body, prev_images)

    # --- Write target: keep frontmatter, replace body ---
    with open(target_file, 'w') as f:
        f.write(frontmatter + '\n' + body.strip() + '\n')

    # --- Summary ---
    total = len(image_map)
    mapped = sum(1 for v in image_map.values() if v)
    unmapped = total - mapped
    print(f"Imported: {os.path.basename(import_file)}")
    print(f"Images: {mapped} mapped from prev version, {unmapped} need paths")
    if unmapped > 0:
        print("Search <!-- IMAGE to find placeholders")


if __name__ == '__main__':
    main()
