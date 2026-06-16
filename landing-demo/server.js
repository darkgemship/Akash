const http = require("http");
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const PORT = 4321;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const file = path.join(ROOT, p);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => console.log("serving on http://localhost:" + PORT));
