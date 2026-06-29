import urllib.request, json
url = 'http://localhost:8000/api/settings.php'
req = urllib.request.Request(url, headers={'Accept': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=5) as res:
        body = res.read().decode('utf-8', errors='replace')
        print('STATUS', res.status)
        print('HEADERS', res.getheaders())
        print('BODY_LEN', len(body))
        j = json.loads(body)
        print('HAS_GTM', 'gtm' in j)
        print('GTM_VALUE', j.get('gtm'))
        print('PAST', body.find('gtm'))
except Exception as exc:
    print('ERROR', repr(exc))
