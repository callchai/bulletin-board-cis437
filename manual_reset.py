# Manual reset script
from google.cloud import firestore
from datetime import datetime, timezone

db = firestore.Client()

posts = db.collection('posts').stream()
deleted = 0
for p in posts:
    p.reference.delete()
    deleted += 1
print(f"Posts wiped. ({deleted} deleted)")

db.collection('meta').document('board').set({
    'createdAt': datetime.now(timezone.utc)
})
print("Clock reset.")

# Cookie reset command
# 
# document.cookie.split(';').forEach(c => document.cookie = c.replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/'));location.reload();