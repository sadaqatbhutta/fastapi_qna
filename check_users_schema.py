import sqlite3

conn = sqlite3.connect("documents.db")
cur = conn.cursor()

cur.execute("PRAGMA table_info(users);")
print("Users table schema:")
for row in cur.fetchall():
    print(row)

conn.close()
