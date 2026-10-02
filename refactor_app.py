import os

app_path = "website/src/App.jsx"
with open(app_path, "r") as f:
    lines = f.readlines()

new_lines = ["import { Routes, Route } from 'react-router-dom'\n", 
             "import { Suspense, lazy } from 'react'\n",
             "import Navbar from './components/Navbar'\n",
             "import Footer from './components/Footer'\n",
             "import Home from './pages/Home'\n",
             "import Tools from './pages/Tools'\n",
             "import NotFound from './pages/NotFound'\n\n"]

routes = []
for line in lines:
    if line.startswith("import ") and "./pages/" in line:
        comp = line.split("import ")[1].split(" from")[0].strip()
        path = line.split("'")[1]
        if comp not in ["Home", "Tools", "NotFound"]:
            new_lines.append(f"const {comp} = lazy(() => import('{path}'))\n")
            
new_lines.append("\nexport default function App() {\n")
new_lines.append("  return (\n")
new_lines.append("    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>\n")
new_lines.append("      <Navbar />\n")
new_lines.append("      <div style={{ flex: 1 }}>\n")
new_lines.append("        <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tool...</div>}>\n")
new_lines.append("          <Routes>\n")

for line in lines:
    if line.strip().startswith("<Route "):
        routes.append(line)

new_lines.extend(routes)
new_lines.append("            <Route path=\"*\" element={<NotFound />} />\n")
new_lines.append("          </Routes>\n")
new_lines.append("        </Suspense>\n")
new_lines.append("      </div>\n")
new_lines.append("      <Footer />\n")
new_lines.append("    </div>\n")
new_lines.append("  )\n")
new_lines.append("}\n")

with open(app_path, "w") as f:
    f.writelines(new_lines)
print("Lazy loading applied.")
