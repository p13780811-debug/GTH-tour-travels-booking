"""Protect existing central CSS; allow only the scoped hotel booking append."""
from pathlib import Path
import re
import subprocess

marker = '/* GTH HOTEL BOOKING SCOPED EXTENSION START */'
path = 'src/app/globals.css'
baseline = subprocess.check_output(['git', 'show', f'HEAD^1:{path}'], text=True)
current = Path(path).read_text()
if current == baseline:
    raise SystemExit(0)
# A follow-up commit may already have the extension. Original CSS remains immutable.
original, existing_marker, _ = baseline.partition(marker)
prefix, found, extension = current.partition(marker)
expected_prefix = original if existing_marker else original + '\n'
assert found and prefix == expected_prefix, 'Existing ecosystem CSS must remain byte-identical'
css = re.sub(r'/\*.*?\*/', '', extension, flags=re.S).strip()
assert not re.search(r'@import|url\s*\(|--[\w-]+\s*:', css), 'No new imports, assets or theme variables'
# Parse block boundaries. Declaration bodies are skipped; every rule selector
# must begin with a hotel scope. No unscoped html/body/button/utility overrides.
def check_rules(text):
    while text.strip():
        text = text.lstrip()
        head, brace, rest = text.partition('{')
        assert brace, 'Expected a CSS rule'
        depth = 1
        i = 0
        while depth and i < len(rest):
            depth += (rest[i] == '{') - (rest[i] == '}')
            i += 1
        assert depth == 0, 'Unbalanced CSS braces'
        body, text = rest[:i-1], rest[i:]
        if head.strip().startswith('@'):
            assert re.fullmatch(r'@media\s*\(max-width:\s*640px\)\s*', head), 'Unexpected at-rule'
            check_rules(body)
        else:
            for selector in head.split(','):
                assert re.match(r'^(?:html|body)?\.gth-hotel-[\w-]+(?:\b|\s|[.:\[])', selector.strip()), selector
            assert '{' not in body and '}' not in body, 'Nested rules must retain explicit hotel scope'
check_rules(css)
print('Existing ecosystem CSS preserved; appended hotel selectors are scoped.')
