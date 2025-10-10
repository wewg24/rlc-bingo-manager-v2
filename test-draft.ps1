$json = Get-Content "test-delete.json" -Raw
$response = Invoke-WebRequest -Uri "https://script.google.com/macros/s/AKfycbzpS12P38xjggfluuj8i2emlzdhaSGfCXXctdsWiwBXKYxfHQ1Xrzcdaotzf-CVFiG-FQ/exec" -Method Post -Body $json -ContentType "application/json" -UseBasicParsing
$response.Content
