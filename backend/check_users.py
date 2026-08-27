import sqlite3
conn = sqlite3.connect(r'C:\Users\Naveen S\OneDrive\Documents\cit\civicpulse-app\backend\civicpulse.db')
c = conn.cursor()
c.execute("PRAGMA table_info(users)")
print("Columns:", [r[1] for r in c.fetchall()])
c.execute("SELECT id, email, password_hash FROM users WHERE role = 'CITIZEN'")
rows = c.fetchall()
for r in rows:
    print("ID:", r[0], "Email:", r[1], "HasHash:", bool(r[2]))
conn.close()
