const { Prisma, PrismaClient } = require('@prisma/client');
const express = require("express");
const app = express();
const prisma = new PrismaClient();

app.get('/hello', (req, res) => {
  res.send("Hello from GET!");
});

app.get('/whitelist',(req,res)=>{
    let wl=prisma.whitelist.findMany();
    res.json(wl);
})

app.listen(11451, () => {
  console.log("XYwow server, start!");
});