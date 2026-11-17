"""Assemble app/index.html from src parts: head template + style.part + body.part."""
h = open('src/head-template.html').read()
head = h[:h.index('<style>')].replace('<title>Flow Check — async interface volume</title>', '<title>Volume &amp; Performance Calculator</title>')
open('app/index.html', 'w').write(head + open('src/style.part').read() + "\n" + open('src/body.part').read())
print('built app/index.html')
