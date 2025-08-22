import sqlite3

# Connect to your SQLite database
conn = sqlite3.connect("documents.db")
cur = conn.cursor()

# List all tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("Tables:", cur.fetchall())

# Show all users
cur.execute("SELECT * FROM users;")
users = cur.fetchall()
print("Users:")
for u in users:
    print(u)

# Show all documents
cur.execute("SELECT * FROM documents;")
docs = cur.fetchall()
print("\nDocuments:")
for d in docs:
    print(d)

conn.close()
