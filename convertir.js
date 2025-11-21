// convertir.js
const XLSX = require("xlsx");
const fs = require("fs");

const workbook = XLSX.readFile("Jornadas_2022_septiembre_01.xlsx");
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

fs.writeFileSync("public_datos.json", JSON.stringify(data, null, 2));
console.log("Archivo generado: public_datos.json");
