
import os

file_path = r'c:\Users\lucer\Certy_app\styles.css'
output_path = r'c:\Users\lucer\Certy_app\styles_clean.css'

with open(file_path, 'rb') as f:
    content = f.read()

# Decode with replacement to handle garbage
text = content.decode('utf-8', errors='replace')
lines = text.splitlines()

cleaned_lines = []
capture = True
found_target = False

for line in lines:
    if "confirmacion-envio__globo" in line:
        found_target = True
    
    cleaned_lines.append(line)
    
    if found_target and line.strip() == "}":
        # This is the closing brace of the confirmacion-envio__globo block
        # The media query closing brace should be next, but it might be corrupted or missing in the garbage
        # We stop here and will append the media query brace manually
        break

with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(cleaned_lines))
    f.write('\n}\n') # Close the media query
