import urllib.request, json

# Test image upload via multipart form
with open('test_images/George_W_Bush_test.jpg', 'rb') as f:
    img_data = f.read()

boundary = b'boundary123xyz'
body = (
    b'--boundary123xyz\r\n'
    b'Content-Disposition: form-data; name="image"; filename="test.jpg"\r\n'
    b'Content-Type: image/jpeg\r\n\r\n'
    + img_data
    + b'\r\n--boundary123xyz--\r\n'
)
req = urllib.request.Request(
    'http://localhost:5000/upload_image',
    data=body,
    headers={'Content-Type': 'multipart/form-data; boundary=boundary123xyz'}
)
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    print('=== IMAGE UPLOAD TEST RESULT ===')
    r = data.get('results', {})
    print('Total faces found:', r.get('total_faces', 0))
    print('Recognized:', r.get('recognized_persons', []))
    print('Unknowns:', r.get('unknown_persons', 0))
    print('Alert:', r.get('alert', False))
except Exception as e:
    print('Error:', e)
