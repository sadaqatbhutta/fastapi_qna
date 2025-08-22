import sqlite3

conn = sqlite3.connect("documents.db")
cur = conn.cursor()

# Insert a demo user
cur.execute("INSERT INTO users (email, password) VALUES (?, ?)", ("test@example.com", "1234"))
conn.commit()

print("✅ User added: test@example.com / 1234")

# Verify
cur.execute("SELECT * FROM users;")
print("Users:", cur.fetchall())

conn.close()
