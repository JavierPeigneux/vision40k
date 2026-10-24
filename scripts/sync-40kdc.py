#!/usr/bin/env python3
"""Refresh the local dataset fallback from one immutable upstream revision (no PDFs)."""
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1] / 'integrations' / '40kdc' / 'snapshot'
FILES = ['terrain-layouts', 'terrain-templates', 'mission-matchups', 'deployment-patterns', 'force-dispositions']

def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Vision40K-PoC', 'Accept': 'application/vnd.github+json'})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()

def main():
    commit = json.loads(get('https://api.github.com/repos/wn-mitch/40kdc-data/commits/main'))['sha']
    base = f'https://raw.githubusercontent.com/wn-mitch/40kdc-data/{commit}/data/core/'
    def download(name):
        data = get(base + name + '.json')
        if not isinstance(json.loads(data), list):
            raise ValueError(f'{name}: expected array')
        return name, data
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        results = list(pool.map(download, FILES))
    # Fetch/parse every file before replacing the local fallback.
    ROOT.mkdir(parents=True, exist_ok=True)
    for name, data in results:
        (ROOT / (name + '.json')).write_bytes(data)
    meta = {'repository': 'https://github.com/wn-mitch/40kdc-data', 'commit': commit,
            'fetchedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'files': {name: hashlib.sha256(data).hexdigest() for name, data in results}}
    (ROOT / 'metadata.json').write_text(json.dumps(meta, indent=2) + '\n')
    print(f'40kdc snapshot refreshed: {commit}')

if __name__ == '__main__':
    main()
