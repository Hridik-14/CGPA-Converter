import express from "express";
import bodyParser from "body-parser";
import cors from 'cors';
import fileUpload from "express-fileupload";
import PdfParse from "pdf-parse";

const app = express();
app.use(cors());
const port = 4000;

// Middleware
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(fileUpload());

app.post('/extract-text', (req, res) => {
  if(!req.files) {
    res.status(404);
    res.end();
  }
  PdfParse(req.files.pdfFile).then(result => {
    res.send(result.text)
  })
})

app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
