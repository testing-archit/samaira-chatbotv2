import re

with open('octaraa-kb-seed.md', 'r') as f:
    content = f.read()

chunks = re.split(r'(^## .*?$)', content, flags=re.MULTILINE)

out = [chunks[0]]
for i in range(1, len(chunks), 2):
    heading = chunks[i]
    body = chunks[i+1]
    
    # Check if we should drop
    if any(k in heading for k in ["Quick Links", "Contact", "Join Our Community", "Related Topics"]):
        continue
    
    # Check if it's just a link to another blog post with "Min Read"
    if "Min Read" in body and len(body.strip().split('\n')) <= 5:
        continue
        
    out.append(heading)
    out.append(body)

with open('octaraa-kb-seed-cleaned.md', 'w') as f:
    f.write(''.join(out))
